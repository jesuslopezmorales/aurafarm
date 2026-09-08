import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Gift, Sparkles, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/stripe-checkout.functions";
import { useAura } from "@/lib/aura-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aura-pass")({
  head: () => ({
    meta: [
      { title: "Aura Pass — multiplicadores y recompensas" },
      {
        name: "description",
        content:
          "Suscríbete al Aura Pass para desbloquear multiplicadores, recompensas exclusivas y ventajas en las Zonas de Aura.",
      },
      { property: "og:title", content: "Aura Pass — AuraFarm" },
      {
        property: "og:description",
        content: "Multiplicadores de Aura, recompensas de temporada y ventajas de comunidad.",
      },
    ],
  }),
  component: PassPage,
});

const plans = [
  {
    id: "free",
    name: "NPC",
    price: "0 €",
    period: "siempre",
    multiplier: 1,
    perks: ["Feed diario", "3 pruebas al día", "Ranking global"],
  },
  {
    id: "plus",
    name: "Aura Pass",
    price: "6,99 €",
    period: "al mes",
    multiplier: 2,
    perks: [
      "Multiplicador x2 permanente",
      "Pruebas ilimitadas",
      "Zonas patrocinadas exclusivas",
      "Escudo de racha (1/semana)",
    ],
    featured: true,
  },
  {
    id: "master",
    name: "Aura Master",
    price: "14,99 €",
    period: "al mes",
    multiplier: 3,
    perks: [
      "Multiplicador x3 permanente",
      "Marco de perfil neón animado",
      "Crea tus propias Zonas de Aura",
      "Aura Battles privadas",
    ],
  },
];

const shop = [
  { name: "Boost x5 (1 h)", cost: 900, icon: Zap },
  { name: "Escudo de racha", cost: 1400, icon: Star },
  { name: "Caja de temporada", cost: 2600, icon: Gift },
  { name: "Marco Aura Master", cost: 6200, icon: Crown },
];

function PassPage() {
  const { aura, multiplier, activatePass } = useAura();
  const [selected, setSelected] = useState("plus");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      toast.success("Pago confirmado. Actualizando tu Aura Pass…");
      window.history.replaceState({}, "", "/aura-pass");
      window.location.reload();
    } else if (checkout === "cancel") {
      toast.info("Pago cancelado");
      window.history.replaceState({}, "", "/aura-pass");
    }
  }, []);

  async function handleActivate() {
    const plan = plans.find((p) => p.id === selected)!;

    if (plan.id !== "plus") {
      // Sin cobro real configurado todavía para este plan (fuera de alcance de esta sesión).
      activatePass(plan.multiplier);
      toast.success(`${plan.name} activo · multiplicador x${plan.multiplier}`);
      return;
    }

    setSubscribing(true);
    try {
      const { url } = await createCheckoutSession();
      if (url) {
        window.location.href = url;
      } else {
        toast.error("No se pudo iniciar el pago");
        setSubscribing(false);
      }
    } catch (err) {
      console.error("[aura-pass] createCheckoutSession", err);
      toast.error("No se pudo iniciar el pago");
      setSubscribing(false);
    }
  }

  return (
    <AppShell title="Aura Pass">
      <section className="glass glow-electric relative overflow-hidden rounded-3xl p-5">
        <div className="absolute -top-12 -left-8 size-40 rounded-full bg-accent/25 blur-3xl" />
        <p className="relative flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-accent uppercase">
          <Sparkles className="size-3.5" /> Temporada 3 · Neón
        </p>
        <h2 className="font-display relative mt-2 text-2xl leading-tight font-black">
          Farmea Aura <span className="text-aura">más rápido</span>
        </h2>
        <p className="relative mt-2 text-xs text-muted-foreground">
          Multiplicador actual x{multiplier} · {aura.toLocaleString("es-ES")} Aura disponible
        </p>
      </section>

      <div className="mt-4 space-y-3">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={cn(
              "glass block w-full rounded-3xl p-4 text-left transition-all active:scale-[0.99]",
              selected === p.id && "glow-neon border-primary/60",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display flex items-center gap-2 text-base font-bold">
                  {p.name}
                  {p.featured && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Popular
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {p.price} · {p.period}
                </p>
              </div>
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">
                x{p.multiplier}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-3.5 shrink-0 text-primary" /> {perk}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <Button
        className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-sm font-bold"
        onClick={handleActivate}
        disabled={subscribing}
      >
        {subscribing
          ? "Redirigiendo a pago…"
          : `Activar ${plans.find((p) => p.id === selected)!.name}`}
      </Button>

      <h2 className="font-display mt-7 mb-3 text-sm font-semibold">Tienda de recompensas</h2>
      <div className="grid grid-cols-2 gap-3">
        {shop.map(({ name, cost, icon: Icon }) => (
          <div key={name} className="glass flex flex-col rounded-2xl p-3.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15">
              <Icon className="size-4 text-primary" />
            </span>
            <p className="mt-2.5 flex-1 text-xs font-semibold">{name}</p>
            <p className="mt-1 text-[11px] text-accent">{cost.toLocaleString("es-ES")} Aura</p>
            <Button
              variant="secondary"
              size="sm"
              disabled={aura < cost}
              className="mt-2.5 h-8 rounded-xl text-[11px] font-bold"
              onClick={() => toast.success(`${name} canjeado`)}
            >
              {aura < cost ? "Bloqueado" : "Canjear"}
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Cancela cuando quieras. Aura Pass se cobra mensualmente vía Stripe; los precios de Aura
        Master y la tienda de recompensas son de ejemplo, sin cobro activo todavía.
      </p>
    </AppShell>
  );
}