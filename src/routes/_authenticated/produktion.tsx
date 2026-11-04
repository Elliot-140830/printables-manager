import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, Panel, Empty } from "@/components/ui-kit";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrders, useInvalidate, setOrderStatus, STATUSES, statusProgress, type OrderStatus } from "@/lib/db";
import { dateSv } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/produktion")({
  head: () => ({
    meta: [
      { title: "Produktion – Printebles Manager" },
      { name: "description", content: "Följ varje orders produktionsstatus." },
      { property: "og:title", content: "Produktion – Printebles Manager" },
      { property: "og:description", content: "Följ varje orders produktionsstatus." },
    ],
  }),
  component: Production,
});

function Production() {
  const orders = useOrders().data ?? [];
  const invalidate = useInvalidate();
  async function change(id: string, status: OrderStatus) {
    const o = orders.find((x) => x.id === id)!;
    try {
      const deducted = await setOrderStatus(o, status);
      toast.success(deducted ? "Status ändrad – filament dras av från lagret" : "Status ändrad");
      invalidate("orders", "filaments");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fel");
    }
  }
  return (
    <>
      <PageHeader title="Produktion" subtitle="Filament dras automatiskt när utskriften bekräftats (Behöver efterarbete eller Klar)." />
      <div className="grid gap-4 lg:grid-cols-3">
        {STATUSES.filter((s) => s.value !== "levererad").map((s) => {
          const list = orders.filter((o) => o.status === s.value);
          return (
            <Panel key={s.value}>
              <h2 className="mb-3 flex justify-between font-semibold">{s.label}<span className="text-muted-foreground">{list.length}</span></h2>
              {list.length === 0 ? <Empty>Tomt</Empty> : (
                <div className="space-y-3">
                  {list.map((o) => (
                    <div key={o.id} className="rounded-xl border bg-background/40 p-3">
                      <div className="flex justify-between text-sm"><span className="font-medium">{o.customer_name}</span><span className="text-muted-foreground">{dateSv(o.delivery_date)}</span></div>
                      <div className="mt-1 text-xs text-muted-foreground">{o.order_items.map((i) => `${i.quantity}× ${i.product_name} · ${i.color}`).join(", ")}</div>
                      <Progress value={statusProgress(o.status)} className="my-3 h-1.5" />
                      <Select value={o.status} onValueChange={(v) => change(o.id, v as OrderStatus)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map((x) => <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </>
  );
}
