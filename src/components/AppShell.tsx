import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Map, Plug, Sparkles, Ticket, User } from "lucide-react";
import type { ReactNode } from "react";

import { useAura } from "@/lib/aura-store";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Feed", icon: Flame },
  { to: "/zonas", label: "Zonas", icon: Map },
  { to: "/perfil", label: "Perfil", icon: User },
  { to: "/aura-pass", label: "Pass", icon: Ticket },
  { to: "/conectar", label: "Conectar", icon: Plug },
] as const;


export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { aura, streak } = useAura();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="glass sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="glow-neon flex size-9 items-center justify-center rounded-xl bg-primary/20">
            <Sparkles className="size-4 text-primary" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">{title}</p>
            <p className="text-[11px] text-muted-foreground">AuraSync</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-[11px] font-semibold">
            🔥 {streak}d
          </span>
          <span className="glow-electric rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
            {aura.toLocaleString("es-ES")} Aura
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>

      <nav className="glass fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md rounded-t-3xl px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-all active:scale-95",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl transition-all",
                      active && "glow-neon bg-primary/15",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
