import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Info } from "lucide-react";
import { PageHeader, Panel, Empty } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { useOrders, useProducts, useInvalidate, setOrderStatus } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/plattor")({
  head: () => ({
    meta: [
      { title: "Plattor – Printebles Manager" },
      { name: "description", content: "Planera byggplattor för Bambu Lab A1 Mini per färg." },
      { property: "og:title", content: "Plattor – Printebles Manager" },
      { property: "og:description", content: "Planera byggplattor för Bambu Lab A1 Mini per färg." },
    ],
  }),
  component: Plates,
});

function Plates() {
  const orders = (useOrders().data ?? []).filter((o) => o.status === "vantar");
  const products = useProducts().data ?? [];
  const invalidate = useInvalidate();
  const [rejected, setRejected] = useState<string[]>([]);

  const groups: Record<string, { orderIds: Set<string>; lines: string[]; grams: number; minutes: number }> = {};
  for (const o of orders) for (const i of o.order_items) {
    const key = `${i.color} · PLA`;
    const p = products.find((x) => x.id === i.product_id);
    const g = (groups[key] ??= { orderIds: new Set(), lines: [], grams: 0, minutes: 0 });
    g.orderIds.add(o.id);
    g.lines.push(`${i.quantity}× ${i.product_name} (${o.customer_name})`);
    g.grams += Number(i.grams) * i.quantity;
    g.minutes += Number(p?.print_minutes ?? 0) * i.quantity;
  }
  const suggestions = Object.entries(groups).filter(([k]) => !rejected.includes(k));

  async function approve(key: string) {
    for (const id of groups[key]?.orderIds ?? []) {
      const o = orders.find((x) => x.id === id);
      if (o) await setOrderStatus(o, "planerad");
    }
    toast.success("Plattan godkänd – ordrarna är planerade");
    invalidate("orders");
  }

  return (
    <>
      <PageHeader title="Plattor" subtitle="Bambu Lab A1 Mini · 180 × 180 × 180 mm · endast PLA · ingen AMS" />
      <Panel className="mb-4 flex gap-3 text-sm text-muted-foreground">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        Förslagen grupperar väntande ordrar per färg och material. Automatisk placering och 3MF-export kräver en kommande Bambu Studio-integration och skapas inte ännu.
      </Panel>
      {suggestions.length === 0 ? <Empty>Inga ordrar väntar på utskrift.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map(([key, g]) => (
            <Panel key={key}>
              <div className="flex justify-between"><h2 className="font-semibold">{key}</h2><span className="text-sm text-muted-foreground">{g.grams} g · {Math.round(g.minutes / 6) / 10} h</span></div>
              <ul className="my-3 space-y-1 text-sm text-muted-foreground">{g.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approve(key)}><Check className="h-4 w-4" /> Godkänn</Button>
                <Button size="sm" variant="secondary" onClick={() => setRejected([...rejected, key])}><X className="h-4 w-4" /> Avvisa</Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
