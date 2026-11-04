import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Coins, Wallet, Clock, Landmark, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Stat, Empty } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrders, useExpenses, useAllocations, useSettings, useInvalidate } from "@/lib/db";
import { economySummary } from "@/lib/pricing";
import { kr, dateSv, today } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ekonomi")({
  head: () => ({
    meta: [
      { title: "Ekonomi – Printebles Manager" },
      { name: "description", content: "Intäkter, utgifter, vinst och fördelningar." },
      { property: "og:title", content: "Ekonomi – Printebles Manager" },
      { property: "og:description", content: "Intäkter, utgifter, vinst och fördelningar." },
    ],
  }),
  component: Economy,
});

function Economy() {
  const orders = useOrders().data ?? [];
  const expenses = useExpenses().data ?? [];
  const allocations = useAllocations().data ?? [];
  const settings = useSettings().data;
  const invalidate = useInvalidate();
  const taxPercent = Number(settings?.tax_percent ?? 25);
  const eco = economySummary({ orders, expenses: expenses.map((e) => Number(e.amount)), taxPercent, allocations: allocations.map((a) => ({ name: a.name, percent: Number(a.percent) })) });
  const byMethod = (m: string) => orders.filter((o) => o.paid && o.payment_method === m).reduce((s, o) => s + o.total, 0);
  const unpaid = orders.filter((o) => !o.paid);

  const [ex, setEx] = useState({ description: "", amount: "", category: "Material", date: today() });
  async function addExpense() {
    if (!ex.description || !ex.amount) { toast.error("Fyll i beskrivning och belopp"); return; }
    const { error } = await supabase.from("expenses").insert({ ...ex, amount: Number(ex.amount) });
    if (error) { toast.error(error.message); return; }
    setEx({ description: "", amount: "", category: "Material", date: today() });
    invalidate("expenses");
  }
  async function delExpense(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    invalidate("expenses");
  }

  return (
    <>
      <PageHeader title="Ekonomi" subtitle={`Moms ${taxPercent}% räknas bort från intäkterna innan vinst`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Totala intäkter" value={kr(eco.revenue)} icon={TrendingUp} />
        <Stat label="Totala utgifter" value={kr(eco.expenses)} icon={TrendingDown} tone="destructive" />
        <Stat label="Vinst" value={kr(eco.profit)} icon={Coins} tone="success" />
        <Stat label="Mottagna betalningar" value={kr(eco.received)} icon={Wallet} tone="accent" />
        <Stat label="Obetalt" value={kr(eco.unpaid)} icon={Clock} tone="warning" />
        <Stat label={`Moms (${taxPercent}%)`} value={kr(eco.tax)} icon={Landmark} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-semibold">Betalningssätt</h2>
          <div className="flex justify-between py-1.5"><span>Swish</span><span className="font-semibold">{kr(byMethod("swish"))}</span></div>
          <div className="flex justify-between py-1.5"><span>Kontant</span><span className="font-semibold">{kr(byMethod("kontant"))}</span></div>
          <h2 className="mb-3 mt-6 font-semibold">Fördelningar av vinst</h2>
          {eco.allocations.map((a) => (
            <div key={a.name} className="flex justify-between py-1.5"><span>{a.name} <span className="text-muted-foreground">({a.percent}%)</span></span><span className="font-semibold">{kr(a.amount)}</span></div>
          ))}
          <p className="mt-2 text-xs text-muted-foreground">Ändra fördelningar under Inställningar.</p>
        </Panel>
        <Panel>
          <h2 className="mb-3 font-semibold">Obetalda ordrar</h2>
          {unpaid.length === 0 ? <Empty>Alla ordrar är betalda.</Empty> : unpaid.map((o) => (
            <div key={o.id} className="flex justify-between py-1.5 text-sm"><span>{o.customer_name} <span className="text-muted-foreground">#{o.order_number}</span></span><span className="font-semibold text-warning">{kr(o.total)}</span></div>
          ))}
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="mb-3 font-semibold">Utgifter</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <Input placeholder="Beskrivning" value={ex.description} onChange={(e) => setEx({ ...ex, description: e.target.value })} />
          <Input type="number" placeholder="Belopp" value={ex.amount} onChange={(e) => setEx({ ...ex, amount: e.target.value })} />
          <Input placeholder="Kategori" value={ex.category} onChange={(e) => setEx({ ...ex, category: e.target.value })} />
          <Input type="date" value={ex.date} onChange={(e) => setEx({ ...ex, date: e.target.value })} />
          <Button onClick={addExpense}><Plus className="h-4 w-4" /> Lägg till</Button>
        </div>
        <div className="divide-y divide-border">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 text-sm">
              <div><div>{e.description}</div><div className="text-xs text-muted-foreground">{e.category} · {dateSv(e.date)}</div></div>
              <div className="flex items-center gap-2"><span className="font-semibold">{kr(Number(e.amount))}</span><Button size="icon" variant="ghost" onClick={() => delExpense(e.id)}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
