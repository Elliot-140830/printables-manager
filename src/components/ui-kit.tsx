import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/db";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card-grad p-5", className)}>{children}</div>;
}

export function Stat({ label, value, icon: Icon, tone = "primary" }: { label: string; value: ReactNode; icon: LucideIcon; tone?: "primary" | "accent" | "success" | "warning" | "destructive" }) {
  const tones = {
    primary: "bg-primary/15 text-primary",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <Panel className="flex items-center gap-4 p-4">
      <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tones[tone])}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="truncate text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-xl font-bold">{value}</div>
      </div>
    </Panel>
  );
}

const STATUS_TONE: Record<string, string> = {
  vantar: "bg-muted text-muted-foreground",
  planerad: "bg-primary/15 text-primary",
  printas: "bg-accent/20 text-accent",
  efterarbete: "bg-warning/15 text-warning",
  klar: "bg-success/15 text-success",
  levererad: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_TONE[status])}>{statusLabel(status)}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>;
}
