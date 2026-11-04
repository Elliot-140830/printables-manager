import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Coins, ClipboardList, Hourglass, Printer, Wrench, PackageCheck, AlertTriangle, CalendarClock } from "lucide-react";
import { PageHeader, Panel, Stat, StatusBadge, Empty } from "@/components/ui-kit";
import { useOrders, useFilaments, useExpenses, useSettings, useAllocations } from "@/lib/db";
import { economySummary } from "@/lib/pricing";
import { kr, today } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/oversikt")({
  head: () => ({
    meta: [
      { title: "Översikt – Printebles Manager" },
      { name: "description", content: "Försäljning, vinst och orderläge i realtid." },
      { property: "og:title", content: "Översikt – Printebles Manager" },
      { property: "og:description", content: "Försäljning, vinst och orderläge i realtid." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const orders = useOrders().data ?? [];
  const filaments = useFilaments().data ?? [];
  const expenses = useExpenses().data ?? [];
  const settings = useSettings().data;
  const allocations = useAllocations().data ?? [];
  const eco = economySummary({
    orders,
    expenses: expenses.map((e) => Number(e.amount)),
    taxPercent: Number(settings?.tax_percent ?? 25),
    allocations: allocations.map((a) => ({ name: a.name, percent: Number(a.percent) })),
  });
  const count = (s: string) => orders.filter((o) => o.status === s).length;
  const active = orders.filter((o) => o.status !== "levererad").length;
  const low = filaments.filter((f) => Number(f.remaining_grams) < Number(f.warning_threshold));
  const todays = orders.filter((o) => o.delivery_date === today() && o.status !== "levererad");

  return (
    <>
      <PageHeader title="Översikt" subtitle="Läget i din printverksamhet just nu" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total försäljning" value={kr(eco.revenue)} icon={TrendingUp} />
        <Stat label="Total vinst" value={kr(eco.profit)} icon={Coins} tone="success" />
        <Stat label="Aktiva ordrar" value={active} icon={ClipboardList} tone="accent" />
        <Stat label="Väntar på utskrift" value={count("vantar") + count("planerad")} icon={Hourglass} tone="warning" />
        <Stat label="Printas nu" value={count("printas")} icon={Printer} tone="accent" />
        <Stat label="Väntar på efterarbete" value={count("efterarbete")} icon={Wrench} tone="warning" />
        <Stat label="Redo för leverans" value={count("klar")} icon={PackageCheck} tone="success" />
        <Stat label="Lågt filament" value={low.length} icon={AlertTriangle} tone={low.length ? "destructive" : "primary"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4 text-primary" /> Dagens leveranser</h2>
          {todays.length === 0 ? <Empty>Inga leveranser planerade idag.</Empty> : (
            <ul className="divide-y divide-border">
              {todays.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3">
                  <div><div className="font-medium">{o.customer_name}</div><div className="text-xs text-muted-foreground">#{o.order_number} · {kr(o.total)}</div></div>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-warning" /> Filamentvarningar</h2>
          {low.length === 0 ? <Empty>Allt filament ligger över gränsvärdet.</Empty> : (
            <ul className="divide-y divide-border">
              {low.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-3">
                  <div><div className="font-medium">{f.color}</div><div className="text-xs text-muted-foreground">{f.brand} · {f.pla_type}</div></div>
                  <span className="text-sm font-semibold text-destructive">{Number(f.remaining_grams)} g kvar</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/filament" className="mt-3 inline-block text-sm text-primary">Hantera filament →</Link>
        </Panel>
      </div>
    </>
  );
}
