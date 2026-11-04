import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useFilaments, useSettings, useInvalidate, STATUSES, type OrderWithItems } from "@/lib/db";
import { productPrice, orderTotal } from "@/lib/pricing";
import { kr } from "@/lib/format";

type Line = { product_id: string; color: string; quantity: number; unit_price: number };

export function OrderDialog({ open, onOpenChange, order }: { open: boolean; onOpenChange: (o: boolean) => void; order?: OrderWithItems | null }) {
  const products = useProducts().data ?? [];
  const filaments = useFilaments().data ?? [];
  const s = useSettings().data;
  const rates = { perGram: Number(s?.price_per_gram ?? 0.25), perMinute: Number(s?.price_per_minute ?? 0.1) };
  const invalidate = useInvalidate();
  const [f, setF] = useState({ customer_name: "", delivery_date: "", priority: "normal", status: "vantar", paid: false, payment_method: "swish", notes: "" });
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (order) {
      setF({ customer_name: order.customer_name, delivery_date: order.delivery_date ?? "", priority: order.priority, status: order.status, paid: order.paid, payment_method: order.payment_method, notes: order.notes ?? "" });
      setLines(order.order_items.map((i) => ({ product_id: i.product_id ?? "", color: i.color, quantity: i.quantity, unit_price: Number(i.unit_price) })));
    } else {
      setF({ customer_name: "", delivery_date: "", priority: "normal", status: "vantar", paid: false, payment_method: "swish", notes: "" });
      setLines([]);
    }
  }, [open, order]);

  const colors = Array.from(new Set(filaments.map((x) => x.color)));
  const addLine = () => {
    const p = products[0];
    if (!p) { toast.error("Lägg till en modell först"); return; }
    setLines([...lines, { product_id: p.id, color: p.default_color, quantity: 1, unit_price: productPrice(p, rates) }]);
  };
  const upd = (i: number, patch: Partial<Line>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  async function save() {
    if (!f.customer_name.trim()) { toast.error("Ange kundnamn"); return; }
    if (lines.length === 0) { toast.error("Lägg till minst en produkt"); return; }
    setBusy(true);
    try {
      const payload = { ...f, delivery_date: f.delivery_date || null, notes: f.notes || null } as never;
      let id = order?.id;
      if (id) {
        const { error } = await supabase.from("orders").update(payload).eq("id", id);
        if (error) throw error;
        await supabase.from("order_items").delete().eq("order_id", id);
      } else {
        const { data, error } = await supabase.from("orders").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      const items = lines.map((l) => {
        const p = products.find((x) => x.id === l.product_id);
        return { order_id: id!, product_id: l.product_id || null, product_name: p?.name ?? "Produkt", color: l.color, quantity: l.quantity, unit_price: l.unit_price, grams: Number(p?.grams ?? 0) };
      });
      const { error } = await supabase.from("order_items").insert(items);
      if (error) throw error;
      await invalidate("orders");
      toast.success(order ? "Ordern uppdaterad" : "Ordern skapad");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte spara");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{order ? `Redigera order #${order.order_number}` : "Ny order"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label>Kundnamn</Label><Input value={f.customer_name} onChange={(e) => setF({ ...f, customer_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Leveransdatum</Label><Input type="date" value={f.delivery_date} onChange={(e) => setF({ ...f, delivery_date: e.target.value })} /></div>
          <div className="space-y-2"><Label>Prioritet</Label>
            <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="lag">Låg</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="hog">Hög</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Produktionsstatus</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })} disabled={!!order}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            {order && <p className="text-xs text-muted-foreground">Ändra status under Produktion.</p>}
          </div>
          <div className="space-y-2"><Label>Betalningssätt</Label>
            <Select value={f.payment_method} onValueChange={(v) => setF({ ...f, payment_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="swish">Swish</SelectItem><SelectItem value="kontant">Kontant</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2"><Switch checked={f.paid} onCheckedChange={(v) => setF({ ...f, paid: v })} /><Label>Betald</Label></div>
        </div>

        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between"><Label>Produkter</Label><Button size="sm" variant="secondary" onClick={addLine}><Plus className="h-4 w-4" /> Lägg till</Button></div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-[2fr_1.2fr_0.7fr_1fr_auto]">
              <Select value={l.product_id} onValueChange={(v) => { const p = products.find((x) => x.id === v)!; upd(i, { product_id: v, color: p.default_color, unit_price: productPrice(p, rates) }); }}>
                <SelectTrigger className="col-span-2 sm:col-span-1"><SelectValue placeholder="Produkt" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={l.color} onValueChange={(v) => upd(i, { color: v })}>
                <SelectTrigger><SelectValue placeholder="Färg" /></SelectTrigger>
                <SelectContent>{Array.from(new Set([...colors, l.color])).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" min={1} value={l.quantity} onChange={(e) => upd(i, { quantity: Math.max(1, Number(e.target.value)) })} aria-label="Antal" />
              <Input type="number" step="0.01" value={l.unit_price} onChange={(e) => upd(i, { unit_price: Number(e.target.value) })} aria-label="Styckpris" />
              <Button size="icon" variant="ghost" onClick={() => setLines(lines.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="text-right font-display text-lg font-bold">Totalt: {kr(orderTotal(lines.map((l) => ({ ...l, grams: 0 }))))}</div>
        </div>
        <DialogFooter><Button onClick={save} disabled={busy}>Spara order</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
