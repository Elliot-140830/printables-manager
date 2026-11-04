import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings, useAllocations, useInvalidate, type Settings } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/installningar")({
  head: () => ({
    meta: [
      { title: "Inställningar – Printebles Manager" },
      { name: "description", content: "Notiser, prissättning, moms och fördelningar." },
      { property: "og:title", content: "Inställningar – Printebles Manager" },
      { property: "og:description", content: "Notiser, prissättning, moms och fördelningar." },
    ],
  }),
  component: SettingsPage,
});

const NOTIFS: { key: keyof Settings; label: string }[] = [
  { key: "notify_low_filament", label: "Filament under gränsvärde" },
  { key: "notify_deliveries", label: "Kommande leveranser" },
  { key: "notify_unpaid", label: "Obetalda ordrar" },
  { key: "notify_production", label: "Produktionspåminnelser" },
];

function SettingsPage() {
  const s = useSettings().data;
  const allocations = useAllocations().data ?? [];
  const invalidate = useInvalidate();
  const [newAlloc, setNewAlloc] = useState({ name: "", percent: "" });

  async function patch(p: Partial<Settings>) {
    const { error } = await supabase.from("settings").update(p).eq("id", 1);
    if (error) return toast.error(error.message);
    invalidate("settings");
  }
  async function updAlloc(id: string, percent: number) {
    await supabase.from("allocations").update({ percent }).eq("id", id);
    invalidate("allocations");
  }
  async function addAlloc() {
    if (!newAlloc.name) return;
    await supabase.from("allocations").insert({ name: newAlloc.name, percent: Number(newAlloc.percent || 0) });
    setNewAlloc({ name: "", percent: "" });
    invalidate("allocations");
  }
  async function delAlloc(id: string) {
    await supabase.from("allocations").delete().eq("id", id);
    invalidate("allocations");
  }

  if (!s) return null;
  return (
    <>
      <PageHeader title="Inställningar" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-1 font-semibold">Notiser</h2>
          <p className="mb-4 text-xs text-muted-foreground">Förberedda inställningar – utskick aktiveras i ett senare steg.</p>
          {NOTIFS.map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2">
              <Label>{n.label}</Label>
              <Switch checked={Boolean(s[n.key])} onCheckedChange={(v) => patch({ [n.key]: v })} />
            </div>
          ))}
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold">Prissättning & moms</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2"><Label>Kr per gram</Label><Input type="number" step="0.01" defaultValue={Number(s.price_per_gram)} onBlur={(e) => patch({ price_per_gram: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Kr per minut</Label><Input type="number" step="0.01" defaultValue={Number(s.price_per_minute)} onBlur={(e) => patch({ price_per_minute: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Moms %</Label><Input type="number" defaultValue={Number(s.tax_percent)} onBlur={(e) => patch({ tax_percent: Number(e.target.value) })} /></div>
          </div>
        </Panel>
        <Panel className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Fördelningar av vinst</h2>
          {allocations.map((a) => (
            <div key={a.id} className="flex items-center gap-2 py-1.5">
              <span className="flex-1">{a.name}</span>
              <Input type="number" className="w-24" defaultValue={Number(a.percent)} onBlur={(e) => updAlloc(a.id, Number(e.target.value))} />
              <span className="text-muted-foreground">%</span>
              <Button size="icon" variant="ghost" onClick={() => delAlloc(a.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            <Input placeholder="Namn" value={newAlloc.name} onChange={(e) => setNewAlloc({ ...newAlloc, name: e.target.value })} />
            <Input type="number" placeholder="%" className="w-24" value={newAlloc.percent} onChange={(e) => setNewAlloc({ ...newAlloc, percent: e.target.value })} />
            <Button onClick={addAlloc}><Plus className="h-4 w-4" /></Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
