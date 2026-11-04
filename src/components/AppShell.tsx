import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, ClipboardList, Printer, Grid3x3, Box, Disc3, Wallet, Settings, LogOut, MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { to: "/oversikt", label: "Översikt", icon: LayoutDashboard },
  { to: "/ordrar", label: "Ordrar", icon: ClipboardList },
  { to: "/produktion", label: "Produktion", icon: Printer },
  { to: "/plattor", label: "Plattor", icon: Grid3x3 },
  { to: "/modeller", label: "Modeller", icon: Box },
  { to: "/filament", label: "Filament", icon: Disc3 },
  { to: "/ekonomi", label: "Ekonomi", icon: Wallet },
  { to: "/installningar", label: "Inställningar", icon: Settings },
] as const;

const linkCls =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const activeCls = "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-primary";

export function AppShell() {
  const nav = useNavigate();
  const [more, setMore] = useState(false);
  const logout = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand shadow-glow"><Box className="h-5 w-5 text-primary-foreground" /></div>
          <div className="font-display text-lg font-bold leading-tight">Printebles<br /><span className="text-xs font-medium text-muted-foreground">Manager</span></div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: activeCls }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className={linkCls}><LogOut className="h-4 w-4" /> Logga ut</button>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-6xl"><Outlet /></div>
      </main>

      {/* Mobil: tumvänlig bottennavigering */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-sidebar/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.slice(0, 4).map((n) => (
            <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
              <n.icon className="h-5 w-5" /> {n.label}
            </Link>
          ))}
          <button onClick={() => setMore(true)} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" /> Mer
          </button>
        </div>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle>Mer</SheetTitle></SheetHeader>
          <div className="grid gap-1 p-4">
            {NAV.slice(4).map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMore(false)} className={linkCls} activeProps={{ className: activeCls }}>
                <n.icon className="h-5 w-5" /> {n.label}
              </Link>
            ))}
            <button onClick={logout} className={linkCls}><LogOut className="h-5 w-5" /> Logga ut</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
