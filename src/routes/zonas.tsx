import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Navigation, Radio, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAura } from "@/lib/aura-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/zonas")({
  head: () => ({
    meta: [
      { title: "Zonas de Aura — eventos y lugares con multiplicador" },
      {
        name: "description",
        content:
          "Explora el mapa de Zonas de Aura: eventos locales, lugares patrocinados y multiplicadores activos cerca de ti.",
      },
      { property: "og:title", content: "Mapa de Zonas de Aura — AuraFarm" },
      {
        property: "og:description",
        content: "Haz check-in en eventos y lugares patrocinados para multiplicar tu Aura.",
      },
    ],
  }),
  component: ZonesPage,
});

function ZonesPage() {
  const { zones, checkInZone } = useAura();
  const [selected, setSelected] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const zone = zones.find((z) => z.id === selected) ?? zones[0] ?? null;

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        // Coordinates aren't persisted yet (no location columns in the DB);
        // this only warms up the permission for next session's proximity check.
      },
      () => {
        // Permission denied or unavailable — nothing to block, check-in still works.
      },
    );
  }, []);

  async function handleCheckIn() {
    if (!zone || checkingIn) return;
    setCheckingIn(true);
    const ok = await checkInZone(zone.id);
    setCheckingIn(false);
    if (ok) toast.success(`Check-in en ${zone.name} · ${zone.multiplier} activo`);
  }

  if (!zone) {
    return (
      <AppShell title="Zonas de Aura">
        <div className="glass flex aspect-[4/5] items-center justify-center rounded-3xl">
          <p className="text-sm text-muted-foreground">Cargando zonas…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Zonas de Aura">
      <div className="glass relative aspect-[4/5] overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.68_0.26_300/0.25),transparent_60%),radial-gradient(circle_at_75%_75%,oklch(0.66_0.22_255/0.25),transparent_60%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(oklch(0.68_0.26_300/0.35)_1px,transparent_1px),linear-gradient(90deg,oklch(0.66_0.22_255/0.3)_1px,transparent_1px)] [background-size:34px_34px]" />
        <svg className="absolute inset-0 size-full opacity-40" viewBox="0 0 100 100">
          <path
            d="M0 62 Q28 48 48 66 T100 54"
            fill="none"
            stroke="oklch(0.7 0.22 250 / 0.5)"
            strokeWidth="1.2"
          />
          <path
            d="M22 0 Q30 40 16 78 T24 100"
            fill="none"
            stroke="oklch(0.72 0.27 305 / 0.4)"
            strokeWidth="1.2"
          />
        </svg>

        {zones.map((z) => {
          const active = z.id === zone.id;
          return (
            <button
              key={z.id}
              onClick={() => setSelected(z.id)}
              style={{ left: `${z.x}%`, top: `${z.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              aria-label={z.name}
            >
              {z.live && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
              )}
              <span
                className={cn(
                  "relative flex items-center justify-center rounded-full border transition-all",
                  active
                    ? "glow-neon size-11 border-primary bg-primary/30"
                    : "size-9 border-border bg-background/70",
                )}
              >
                <MapPin className={cn("size-4", active ? "text-primary" : "text-accent")} />
              </span>
            </button>
          );
        })}

        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-border/70 bg-background/80 p-3 backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-sm font-bold">{zone.name}</p>
              <p className="text-[11px] text-muted-foreground">{zone.detail}</p>
            </div>
            <span className="glow-electric shrink-0 rounded-full bg-accent/15 px-2 py-1 text-[11px] font-bold text-accent">
              {zone.multiplier}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {zone.people} farmeando
            </span>
            {zone.live && (
              <span className="flex items-center gap-1 text-primary">
                <Radio className="size-3.5" /> en directo
              </span>
            )}
          </div>
          <Button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="mt-3 h-10 w-full rounded-xl bg-gradient-to-r from-primary to-accent text-xs font-bold"
          >
            <Navigation className="size-4" /> Hacer check-in
          </Button>
        </div>
      </div>

      <h2 className="font-display mt-5 mb-3 text-sm font-semibold">Cerca de ti</h2>
      <ul className="space-y-2">
        {zones.map((z) => (
          <li key={z.id}>
            <button
              onClick={() => setSelected(z.id)}
              className={cn(
                "glass flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.99]",
                z.id === zone.id && "border-primary/50",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Zap className="size-4 text-primary" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{z.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {z.kind} · {z.people} personas
                </span>
              </span>
              <span className="text-[11px] font-bold text-accent">{z.multiplier}</span>
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
