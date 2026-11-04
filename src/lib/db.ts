import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { filamentUsage, orderTotal, shouldDeductFilament } from "./pricing";

type T = Database["public"]["Tables"];
export type Product = T["products"]["Row"];
export type Filament = T["filaments"]["Row"];
export type Order = T["orders"]["Row"];
export type OrderItem = T["order_items"]["Row"];
export type Expense = T["expenses"]["Row"];
export type Allocation = T["allocations"]["Row"];
export type Settings = T["settings"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type OrderWithItems = Order & { order_items: OrderItem[]; total: number };

export const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "vantar", label: "Väntar på utskrift" },
  { value: "planerad", label: "Planerad" },
  { value: "printas", label: "Printas" },
  { value: "efterarbete", label: "Behöver efterarbete" },
  { value: "klar", label: "Klar" },
  { value: "levererad", label: "Levererad" },
];
export const statusLabel = (s: string) => STATUSES.find((x) => x.value === s)?.label ?? s;
export const statusProgress = (s: string) => ((STATUSES.findIndex((x) => x.value === s) + 1) / STATUSES.length) * 100;
export const PRIORITY_LABEL = { lag: "Låg", normal: "Normal", hog: "Hög" } as const;

function unwrap<D>(r: { data: D | null; error: { message: string } | null }): D {
  if (r.error) throw new Error(r.error.message);
  return r.data as D;
}

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: async () => unwrap(await supabase.from("products").select("*").order("name")) });
export const useFilaments = () =>
  useQuery({ queryKey: ["filaments"], queryFn: async () => unwrap(await supabase.from("filaments").select("*").order("color")) });
export const useExpenses = () =>
  useQuery({ queryKey: ["expenses"], queryFn: async () => unwrap(await supabase.from("expenses").select("*").order("date", { ascending: false })) });
export const useAllocations = () =>
  useQuery({ queryKey: ["allocations"], queryFn: async () => unwrap(await supabase.from("allocations").select("*").order("created_at")) });
export const useSettings = () =>
  useQuery({ queryKey: ["settings"], queryFn: async () => unwrap(await supabase.from("settings").select("*").eq("id", 1).single()) });
export const useOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const rows = unwrap(await supabase.from("orders").select("*, order_items(*)").order("delivery_date", { ascending: true }));
      return rows.map((o) => ({ ...o, total: orderTotal(o.order_items) })) as OrderWithItems[];
    },
  });

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

/** Change status; subtracts filament once printing is confirmed. */
export async function setOrderStatus(order: OrderWithItems, status: OrderStatus) {
  const deduct = shouldDeductFilament(status, order.filament_deducted);
  if (deduct) {
    const usage = filamentUsage(order.order_items);
    const filaments = unwrap(await supabase.from("filaments").select("*"));
    for (const [color, grams] of Object.entries(usage)) {
      const f = filaments.find((x) => x.color.toLowerCase() === color.toLowerCase());
      if (f) {
        unwrap(await supabase.from("filaments").update({ remaining_grams: Math.max(0, Number(f.remaining_grams) - grams) }).eq("id", f.id).select());
      }
    }
  }
  unwrap(
    await supabase
      .from("orders")
      .update({ status, filament_deducted: order.filament_deducted || deduct })
      .eq("id", order.id)
      .select(),
  );
  return deduct;
}

export async function signedUrl(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("product-files").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
