import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Receipt, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, StatusBadge, Empty } from "@/components/ui-kit";
import { OrderDialog } from "@/components/OrderDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { useOrders, useInvalidate, PRIORITY_LABEL, type OrderWithItems } from "@/lib/db";
import { kr, dateSv } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ordrar")({
  head: () => ({
    meta: [
      { title: "Ordrar – Printebles Manager" },
      { name: "description", content: "Skapa, redigera och följ upp kundordrar." },
      { property: "og:title", content: "Ordrar – Printebles Manager" },
      { property: "og:description", content: "Skapa, redigera och följ upp kundordrar." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const orders = useOrders().data ?? [];
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<OrderWithItems | null>(null);
  const [del, setDel] = useState<OrderWithItems | null>(null);
  const [q, setQ] = useState("");
  const list = orders.filter((o) => o.customer_name.toLowerCase().includes(q.toLowerCase()) || String(o.order_number).includes(q));

  async function togglePaid(o: OrderWithItems) {
    const { error } = await supabase.from("orders").update({ paid: !o.paid }).eq("id", o.id);
    if (error) return toast.error(error.message);
    invalidate("orders");
  }
  async function remove() {
    if (!del) return;
    const { error } = await supabase.from("orders").delete().eq("id", del.id);
    if (error) return toast.error(error.message);
    toast.success("Ordern borttagen");
    setDel(null);
    invalidate("orders");
  }

  return (
    <>
      <PageHeader title="Ordrar" subtitle={`${orders.length} ordrar totalt`} action={<Button onClick={() => { setEdit(null); setOpen(true); }}><Plus className="h-4 w-4" /> Ny order</Button>} />
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Sök kund eller ordernummer" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {list.length === 0 ? <Empty>Inga ordrar hittades.</Empty> : (
        <div className="grid gap-3">
          {list.map((o) => (
            <Panel key={o.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{o.customer_name}</span>
                    <span className="text-xs text-muted-foreground">#{o.order_number}</span>
                    {o.priority === "hog" && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">Hög prio</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Leverans {dateSv(o.delivery_date)} · Prioritet {PRIORITY_LABEL[o.priority]}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{o.order_items.map((i) => `${i.quantity}× ${i.product_name} (${i.color})`).join(", ")}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold">{kr(o.total)}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                <button onClick={() => togglePaid(o)} className={cn("rounded-full px-3 py-1 text-xs font-medium", o.paid ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                  {o.paid ? "Betald" : "Obetald"} · {o.payment_method === "swish" ? "Swish" : "Kontant"}
                </button>
                <div className="ml-auto flex gap-1">
                  <Button asChild size="sm" variant="ghost"><Link to="/kvitto/$id" params={{ id: o.id }}><Receipt className="h-4 w-4" /> Kvitto</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEdit(o); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDel(o)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
      <OrderDialog open={open} onOpenChange={setOpen} order={edit} />
      <AlertDialog open={!!del} onOpenChange={(v) => !v && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Ta bort order?</AlertDialogTitle><AlertDialogDescription>Ordern för {del?.customer_name} tas bort permanent.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction onClick={remove}>Ta bort</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
