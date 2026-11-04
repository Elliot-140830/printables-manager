import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Box } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logga in – Printebles Manager" },
      { name: "description", content: "Logga in för att hantera din 3D-printverksamhet." },
      { property: "og:title", content: "Logga in – Printebles Manager" },
      { property: "og:description", content: "Logga in för att hantera din 3D-printverksamhet." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/oversikt" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Kontrollera din e-post för att bekräfta kontot.");
        setMode("in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-3xl border bg-card-grad p-8 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand"><Box className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <h1 className="text-xl font-bold">Printebles Manager</h1>
            <p className="text-sm text-muted-foreground">{mode === "in" ? "Logga in" : "Skapa konto"}</p>
          </div>
        </div>
        <div className="space-y-2"><Label>E-post</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label>Lösenord</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Logga in" : "Skapa konto"}</Button>
        <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Inget konto? Skapa ett" : "Har du konto? Logga in"}
        </button>
      </form>
    </div>
  );
}
