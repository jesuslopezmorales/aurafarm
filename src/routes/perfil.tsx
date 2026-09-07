import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Flame, Minus, Plus, Target, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { rankFor, ranks, useAura } from "@/lib/aura-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Tu perfil de Aura — rango, racha y hábitos" },
      {
        name: "description",
        content:
          "Consulta tu rango (NPC, Main Character, Aura Master), tu contador de Aura, tu racha y marca hábitos o deslices del día.",
      },
      { property: "og:title", content: "Tu perfil de Aura en AuraSync" },
      {
        property: "og:description",
        content: "Rango, contador de Aura, racha de días y control de hábitos y deslices.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { aura, streak, habits, toggleHabit, multiplier } = useAura();
  const rank = rankFor(aura);
  const progress = Math.min(100, ((aura - rank.min) / (rank.max - rank.min)) * 100);

  return (
    <AppShell title="Perfil">
      <section className="glass glow-neon relative overflow-hidden rounded-3xl p-5">
        <div className="absolute -top-16 -right-10 size-40 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-2xl font-black text-primary-foreground">
            T
          </div>
          <div>
            <p className="font-display text-lg font-bold">Tú</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Crown className="size-3.5 text-[color:var(--gold)]" /> {rank.name}
            </p>
          </div>
        </div>

        <p className="text-aura font-display relative mt-5 text-4xl font-black">
          {aura.toLocaleString("es-ES")}
        </p>
        <p className="text-xs text-muted-foreground">Aura total · multiplicador x{multiplier}</p>

        <div className="relative mt-4 space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{rank.name}</span>
            <span>
              {Math.max(0, rank.max - aura).toLocaleString("es-ES")} Aura para el siguiente rango
            </span>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: Flame, label: "Racha", value: `${streak} d` },
          { icon: TrendingUp, label: "Esta semana", value: "+1.2k" },
          { icon: Target, label: "Pruebas", value: "184" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-2xl p-3 text-center">
            <Icon className="mx-auto size-4 text-accent" />
            <p className="font-display mt-1.5 text-base font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display mt-6 mb-3 text-sm font-semibold">Rangos</h2>
      <div className="flex gap-2">
        {ranks.map((r) => (
          <div
            key={r.name}
            className={cn(
              "glass flex-1 rounded-2xl p-3 text-center text-[11px]",
              r.name === rank.name && "glow-electric border-accent/60 text-accent",
            )}
          >
            <p className="font-semibold">{r.name}</p>
            <p className="text-muted-foreground">{r.min.toLocaleString("es-ES")}+</p>
          </div>
        ))}
      </div>

      <h2 className="font-display mt-6 mb-3 text-sm font-semibold">Hábitos de hoy</h2>
      <ul className="space-y-2">
        {habits
          .filter((h) => h.kind === "habit")
          .map((h) => (
            <HabitRow key={h.id} habit={h} onToggle={() => toggleHabit(h.id)} />
          ))}
      </ul>

      <h2 className="font-display mt-6 mb-3 text-sm font-semibold">Deslices</h2>
      <ul className="space-y-2">
        {habits
          .filter((h) => h.kind === "slip")
          .map((h) => (
            <HabitRow key={h.id} habit={h} onToggle={() => toggleHabit(h.id)} />
          ))}
      </ul>
    </AppShell>
  );
}

function HabitRow({
  habit,
  onToggle,
}: {
  habit: { name: string; points: number; done: boolean; kind: "habit" | "slip" };
  onToggle: () => void;
}) {
  const positive = habit.points >= 0;
  return (
    <li className="glass flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3">
      <button
        onClick={onToggle}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-90",
          habit.done
            ? positive
              ? "border-primary bg-primary/25 text-primary"
              : "border-destructive bg-destructive/25 text-destructive"
            : "border-border text-muted-foreground",
        )}
        aria-label={`Marcar ${habit.name}`}
      >
        {habit.done ? (
          <Check className="size-4" />
        ) : positive ? (
          <Plus className="size-4" />
        ) : (
          <Minus className="size-4" />
        )}
      </button>
      <p
        className={cn(
          "flex-1 text-sm",
          habit.done && "text-muted-foreground line-through decoration-primary/60",
        )}
      >
        {habit.name}
      </p>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-bold",
          positive ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive",
        )}
      >
        {positive ? `+${habit.points}` : habit.points}
      </span>
    </li>
  );
}
