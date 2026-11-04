import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFilaments, useInvalidate, type Filament } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/filament")({
  head: () => ({
    meta: [
      { title: "Filament – Printebles Manager" },
      { name: "description", content: "PLA-lager per färg med varningar vid låg nivå." },
      { property: "og:title", content: "Filament – Printebles Manager" },
      { property: "og:description", content: "PLA-lager per färg med varningar vid låg nivå." },
    ],
  }),
  component: FilamentPage,
});

const empty = { color: "", pla_type: "PLA Basic", brand: "Bambu Lab", remaining_grams: 1000, spool_weight: 1000, warning_threshold: 150 };

function FilamentPage() {
  const list = useFilaments().data ?? [];
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Filament | null>(null);
  const [f, setF] = useState(empty);

  const openFor = (x: Filament | null) => {
    setEdit(x);
    setF(x ? { color: x.color, pla_type: x.pla_type, brand: x.brand, remaining_grams: Number(x.remaining_grams), spool_weight: Number(x.spool_weight), warning_threshold: Number(x.warning_threshold) } : empty);
    setOpen(true);
  };
  async function save() {
    if (!f.color.trim()) { toast.error("Ange färg"); return; }
    const { error } = edit ? await supabase.from("filaments").update(f).eq("id", edit.id) : await supabase.from("filaments").insert(f);
    if (error) { toast.error(error.message); return; }
    toast.success("Filament sparat");
    setOpen(false);
    invalidate("filaments");
  }
  async function remove(x: Filament) {
    if (!confirm(`Ta bort ${x.color}?`)) return;
    const { error } = await supabase.from("filaments").delete().eq("id", x.id);
    if (error) { toast.error(error.message); return; }
    invalidate("filaments");
  }
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });

  return (
    <>
      <PageHeader title="Filament" subtitle="Endast PLA. Dras automatiskt efter bekräftad utskrift." action={<Button onClick={() => openFor(null)}><Plus className="h-4 w-4" /> Ny rulle</Button>} />
      {list.length === 0 ? <Empty>Inget filament registrerat.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((x) => {
            const low = Number(x.remaining_grams) < Number(x.warning_threshold);
            return (
              <Panel key={x.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div><h3 className="font-semibold">{x.color}</h3><p className="text-xs text-muted-foreground">{x.brand} · {x.pla_type}</p></div>
                  {low && <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> Lågt</span>}
                </div>
                <div className="mt-3 flex justify-between text-sm"><span className="font-display text-lg font-bold">{Number(x.remaining_grams)} g</span><span className="text-muted-foreground">av {Number(x.spool_weight)} g</span></div>
                <Progress value={(Number(x.remaining_grams) / Number(x.spool_weight)) * 100} className="mt-2 h-1.5" />
                <div className="mt-2 text-xs text-muted-foreground">Varning under {Number(x.warning_threshold)} g</div>
                <div className="mt-3 flex justify-end gap-1 border-t pt-3">
                  <Button size="sm" variant="ghost" onClick={() => openFor(x)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(x)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Redigera filament" : "Nytt filament"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Färg</Label><Input value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} /></div>
            <div className="space-y-2"><Label>PLA-typ</Label><Input value={f.pla_type} onChange={(e) => setF({ ...f, pla_type: e.target.value })} /></div>
            <div className="space-y-2"><Label>Märke</Label><Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></div>
            <div className="space-y-2"><Label>Kvar (gram)</Label><Input type="number" value={f.remaining_grams} onChange={num("remaining_grams")} /></div>
            <div className="space-y-2"><Label>Rullvikt (gram)</Label><Input type="number" value={f.spool_weight} onChange={num("spool_weight")} /></div>
            <div className="space-y-2"><Label>Varningsgräns (gram)</Label><Input type="number" value={f.warning_threshold} onChange={num("warning_threshold")} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Spara</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
