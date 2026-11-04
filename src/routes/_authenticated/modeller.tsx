import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileBox, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProducts, useSettings, useInvalidate, signedUrl, type Product } from "@/lib/db";
import { calcPrice, productPrice } from "@/lib/pricing";
import { kr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/modeller")({
  head: () => ({
    meta: [
      { title: "Modeller – Printebles Manager" },
      { name: "description", content: "Produkter, STL-filer och prissättning." },
      { property: "og:title", content: "Modeller – Printebles Manager" },
      { property: "og:description", content: "Produkter, STL-filer och prissättning." },
    ],
  }),
  component: Models,
});

function Thumb({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { signedUrl(path).then(setUrl); }, [path]);
  return (
    <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-muted">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
    </div>
  );
}

const empty = { name: "", description: "", default_color: "Svart", grams: 0, print_minutes: 0, price_override: "" as string | number };

function Models() {
  const products = useProducts().data ?? [];
  const s = useSettings().data;
  const rates = { perGram: Number(s?.price_per_gram ?? 0.25), perMinute: Number(s?.price_per_minute ?? 0.1) };
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Product | null>(null);
  const [f, setF] = useState(empty);
  const [stl, setStl] = useState<File | null>(null);
  const [img, setImg] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const openFor = (p: Product | null) => {
    setEdit(p);
    setF(p ? { name: p.name, description: p.description ?? "", default_color: p.default_color, grams: Number(p.grams), print_minutes: Number(p.print_minutes), price_override: p.price_override ?? "" } : empty);
    setStl(null); setImg(null); setOpen(true);
  };

  async function upload(file: File, folder: string) {
    const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("product-files").upload(path, file);
    if (error) throw error;
    return path;
  }

  async function save() {
    if (!f.name.trim()) return toast.error("Ange namn");
    setBusy(true);
    try {
      const row: Record<string, unknown> = {
        name: f.name, description: f.description || null, default_color: f.default_color, material: "PLA",
        grams: Number(f.grams), print_minutes: Number(f.print_minutes),
        price_override: f.price_override === "" ? null : Number(f.price_override),
      };
      if (stl) row.stl_path = await upload(stl, "stl");
      if (img) row.image_path = await upload(img, "images");
      const { error } = edit
        ? await supabase.from("products").update(row as never).eq("id", edit.id)
        : await supabase.from("products").insert(row as never);
      if (error) throw error;
      toast.success("Modellen sparad");
      setOpen(false);
      invalidate("products");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte spara");
    } finally { setBusy(false); }
  }

  async function remove(p: Product) {
    if (!confirm(`Ta bort ${p.name}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    invalidate("products");
  }

  async function downloadStl(p: Product) {
    const url = await signedUrl(p.stl_path);
    if (url) window.open(url, "_blank");
  }

  return (
    <>
      <PageHeader title="Modeller" subtitle="Pris = gram × 0,25 + minuter × 0,1 (kan överskridas manuellt)" action={<Button onClick={() => openFor(null)}><Plus className="h-4 w-4" /> Ny modell</Button>} />
      {products.length === 0 ? <Empty>Inga modeller ännu.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Panel key={p.id} className="p-4">
              <Thumb path={p.image_path} />
              <div className="mt-3 flex items-start justify-between gap-2">
                <div><h3 className="font-semibold">{p.name}</h3><p className="text-xs text-muted-foreground">{p.description}</p></div>
                <div className="text-right font-display font-bold">{kr(productPrice(p, rates))}{p.price_override != null && <div className="text-[10px] font-normal text-accent">manuellt</div>}</div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{p.default_color} · {p.material} · {Number(p.grams)} g · {Number(p.print_minutes)} min</div>
              <div className="mt-3 flex gap-1 border-t pt-3">
                <Button size="sm" variant="ghost" disabled={!p.stl_path} onClick={() => downloadStl(p)}><FileBox className="h-4 w-4" /> {p.stl_path ? "STL" : "Ingen STL"}</Button>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => openFor(p)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit ? "Redigera modell" : "Ny modell"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Namn</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Beskrivning</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Standardfärg</Label><Input value={f.default_color} onChange={(e) => setF({ ...f, default_color: e.target.value })} /></div>
            <div className="space-y-2"><Label>Material</Label><Input value="PLA" disabled /></div>
            <div className="space-y-2"><Label>Filament (gram)</Label><Input type="number" value={f.grams} onChange={(e) => setF({ ...f, grams: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Printtid (minuter)</Label><Input type="number" value={f.print_minutes} onChange={(e) => setF({ ...f, print_minutes: Number(e.target.value) })} /></div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Manuellt pris (lämna tomt för beräknat: {kr(calcPrice(f.grams, f.print_minutes, rates))})</Label>
              <Input type="number" step="0.01" value={f.price_override} onChange={(e) => setF({ ...f, price_override: e.target.value })} />
            </div>
            <div className="space-y-2"><Label>STL-fil</Label><Input type="file" accept=".stl" onChange={(e) => setStl(e.target.files?.[0] ?? null)} /></div>
            <div className="space-y-2"><Label>Produktbild</Label><Input type="file" accept="image/*" onChange={(e) => setImg(e.target.files?.[0] ?? null)} /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={busy}>{busy ? "Sparar…" : "Spara"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
