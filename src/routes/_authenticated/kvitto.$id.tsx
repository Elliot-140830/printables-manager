import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders, useSettings } from "@/lib/db";
import { includedTax } from "@/lib/pricing";
import { kr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/kvitto/$id")({
  head: () => ({
    meta: [
      { title: "Kvitto – Printebles Manager" },
      { name: "description", content: "Utskrivbart kvitto för order." },
      { property: "og:title", content: "Kvitto – Printebles Manager" },
      { property: "og:description", content: "Utskrivbart kvitto för order." },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const o = (useOrders().data ?? []).find((x) => x.id === id);
  const tax = Number(useSettings().data?.tax_percent ?? 25);
  if (!o) return <p className="text-muted-foreground">Laddar kvitto…</p>;
  return (
    <div className="mx-auto max-w-md">
      <div className="no-print mb-4 flex justify-between">
        <Button asChild variant="ghost"><Link to="/ordrar"><ArrowLeft className="h-4 w-4" /> Tillbaka</Link></Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Skriv ut</Button>
      </div>
      <div className="rounded-2xl border bg-card p-6 font-mono text-sm">
        <div className="text-center"><div className="font-display text-xl font-bold">Printebles</div><div className="text-muted-foreground">Kvitto #{o.order_number}</div><div className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("sv-SE")}</div></div>
        <div className="my-4 border-t border-dashed" />
        <div>Kund: {o.customer_name}</div>
        <div className="my-4 border-t border-dashed" />
        {o.order_items.map((i) => (
          <div key={i.id} className="flex justify-between gap-2"><span>{i.quantity}× {i.product_name} ({i.color})</span><span>{kr(Number(i.unit_price) * i.quantity)}</span></div>
        ))}
        <div className="my-4 border-t border-dashed" />
        <div className="flex justify-between font-bold"><span>Totalt</span><span>{kr(o.total)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>varav moms {tax}%</span><span>{kr(includedTax(o.total, tax))}</span></div>
        <div className="mt-2">Betalning: {o.payment_method === "swish" ? "Swish" : "Kontant"} · {o.paid ? "Betald" : "Ej betald"}</div>
        <div className="mt-6 text-center text-muted-foreground">Tack för ditt köp!</div>
      </div>
    </div>
  );
}
