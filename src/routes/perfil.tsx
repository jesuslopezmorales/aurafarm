import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Crown, Flame, Gift, LogOut, Minus, Pencil, Plus, Share2, Target, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
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
      { property: "og:title", content: "Tu perfil de Aura en AuraFarm" },
      {
        property: "og:description",
        content: "Rango, contador de Aura, racha de días y control de hábitos y deslices.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const {
    aura,
    streak,
    habits,
    toggleHabit,
    multiplier,
    displayName,
    updateDisplayName,
    avatarUrl,
    updateAvatarUrl,
    bio,
    updateBio,
    isAuthenticated,
    signOut,
  } = useAura();
  const rank = rankFor(aura);
  const progress = Math.min(100, ((aura - rank.min) / (rank.max - rank.min)) * 100);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState(avatarUrl ?? "");
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio ?? "");

  function startEditingName() {
    setNameDraft(displayName || "Tú");
    setEditingName(true);
  }

  function confirmNameEdit() {
    updateDisplayName(nameDraft);
    setEditingName(false);
  }

  function startEditingAvatar() {
    setAvatarDraft(avatarUrl ?? "");
    setEditingAvatar(true);
  }

  function confirmAvatarEdit() {
    updateAvatarUrl(avatarDraft);
    setEditingAvatar(false);
  }

  function startEditingBio() {
    setBioDraft(bio ?? "");
    setEditingBio(true);
  }

  function confirmBioEdit() {
    updateBio(bioDraft);
    setEditingBio(false);
  }

  return (
    <AppShell title="Perfil">
      <section className="glass glow-neon relative overflow-hidden rounded-3xl p-5">
        <div className="absolute -top-16 -right-10 size-40 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent text-2xl font-black text-primary-foreground">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                "T"
              )}
            </div>
            <button
              type="button"
              onClick={startEditingAvatar}
              aria-label="Editar foto"
              className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
            >
              <Pencil className="size-3" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmNameEdit();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="h-8 max-w-[160px] text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label="Confirmar nombre"
                  onClick={confirmNameEdit}
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label="Cancelar"
                  onClick={() => setEditingName(false)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditingName}
                className="font-display flex items-center gap-1.5 text-lg font-bold"
              >
                {displayName || "Tú"}
                <Pencil className="size-3.5 text-muted-foreground" />
              </button>
            )}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Crown className="size-3.5 text-[color:var(--gold)]" /> {rank.name}
            </p>
          </div>
        </div>

        {editingAvatar && (
          <div className="relative mt-3 flex items-center gap-1.5">
            <Input
              autoFocus
              value={avatarDraft}
              onChange={(e) => setAvatarDraft(e.target.value)}
              placeholder="URL de la imagen"
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmAvatarEdit();
                if (e.key === "Escape") setEditingAvatar(false);
              }}
              className="h-8 flex-1 text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label="Confirmar foto"
              onClick={confirmAvatarEdit}
            >
              <Check className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label="Cancelar"
              onClick={() => setEditingAvatar(false)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}

        <div className="relative mt-3">
          {editingBio ? (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder="Escribe tu bio"
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmBioEdit();
                  if (e.key === "Escape") setEditingBio(false);
                }}
                className="h-8 flex-1 text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                aria-label="Confirmar bio"
                onClick={confirmBioEdit}
              >
                <Check className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                aria-label="Cancelar"
                onClick={() => setEditingBio(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditingBio}
              className="flex items-center gap-1.5 text-left text-xs text-muted-foreground"
            >
              {bio || "Añade una bio"}
              <Pencil className="size-3 shrink-0" />
            </button>
          )}
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

      <NewHabitForm />

      {isAuthenticated && <ReferralSection />}

      {isAuthenticated && (
        <Button
          onClick={signOut}
          variant="outline"
          className="mt-6 w-full border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" /> Cerrar sesión
        </Button>
      )}
    </AppShell>
  );
}

/**
 * get_or_create_referral_code() and get_my_referrals() are Postgres RPCs created directly
 * via Lovable's SQL editor (drizzle/migrations/manual/0002_referral_system.sql and
 * 0003_referral_status_rpc.sql), same reasoning as ToggleHabitClient in aura-store.tsx:
 * absent from the auto-generated types.ts.
 */
type ReferralRpcClient = {
  rpc: (
    fn: "get_or_create_referral_code",
    args?: Record<string, never>,
  ) => PromiseLike<{ data: string | null; error: { message: string } | null }>;
} & {
  rpc: (
    fn: "get_my_referrals",
    args?: Record<string, never>,
  ) => PromiseLike<{
    data: { referred_display_name: string; status: string; rewarded_at: string | null }[] | null;
    error: { message: string } | null;
  }>;
};

type ReferralRow = { referred_display_name: string; status: string; rewarded_at: string | null };

const REFERRAL_LIMIT = 1;

function ReferralSection() {
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const canNativeShare = typeof navigator.share === "function";

  useEffect(() => {
    let active = true;
    async function load() {
      const client = supabase as unknown as ReferralRpcClient;
      const [codeRes, referralsRes] = await Promise.all([
        client.rpc("get_or_create_referral_code"),
        client.rpc("get_my_referrals"),
      ]);
      if (!active) return;
      if (codeRes.error) {
        console.error("[perfil] get_or_create_referral_code", codeRes.error.message);
      } else {
        setCode(codeRes.data);
      }
      if (referralsRes.error) {
        console.error("[perfil] get_my_referrals", referralsRes.error.message);
      } else {
        setReferrals(referralsRes.data ?? []);
      }
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const rewardedCount = referrals.filter((r) => r.status === "rewarded").length;
  const shareUrl = code ? `${window.location.origin}/auth?ref=${code}` : null;

  async function share() {
    if (!shareUrl) return;
    if (canNativeShare) {
      try {
        await navigator.share({
          title: "AuraFarm",
          text: "Únete a AuraFarm con mi código y farmea Aura conmigo",
          url: shareUrl,
        });
        return;
      } catch {
        // el usuario canceló el share nativo, no hacer nada
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  return (
    <section className="glass glow-electric relative mt-6 overflow-hidden rounded-3xl p-5">
      <div className="absolute -top-12 -right-8 size-40 rounded-full bg-accent/20 blur-3xl" />
      <p className="relative flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-accent uppercase">
        <Gift className="size-3.5" /> Promociona
      </p>
      <h2 className="font-display relative mt-2 text-lg font-bold">
        Invita a un amigo, gana Aura Pass gratis
      </h2>
      <p className="relative mt-1.5 text-xs text-muted-foreground">
        Cuando tu amigo se registre con tu código y complete su primera acción, recibes un mes de
        Aura Pass gratis (multiplicador x2). Máximo {REFERRAL_LIMIT} amigo.
      </p>

      {loading ? (
        <p className="relative mt-4 text-xs text-muted-foreground">Cargando…</p>
      ) : (
        <>
          <div className="relative mt-4 flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-center font-mono text-sm font-bold tracking-widest">
              {code}
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="size-10 shrink-0 rounded-xl"
              aria-label="Compartir código"
              onClick={share}
            >
              {canNativeShare ? <Share2 className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>

          <p className="relative mt-3 text-xs font-semibold">
            {rewardedCount}/{REFERRAL_LIMIT} amigos canjeados
          </p>

          {referrals.length > 0 && (
            <ul className="relative mt-2 space-y-1.5">
              {referrals.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs"
                >
                  <span>{r.referred_display_name}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      r.status === "rewarded"
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {r.status === "rewarded" ? "Recompensado" : "Pendiente"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function NewHabitForm() {
  const { addHabit } = useAura();
  const [name, setName] = useState("");
  const [points, setPoints] = useState("50");
  const [kind, setKind] = useState<"habit" | "slip">("habit");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const parsedPoints = Number(points);
    if (!trimmed || !Number.isFinite(parsedPoints)) return;
    addHabit({ name: trimmed, points: Math.abs(parsedPoints) * (kind === "slip" ? -1 : 1), kind });
    setName("");
    setPoints("50");
  }

  return (
    <form onSubmit={submit} className="glass mt-6 space-y-3 rounded-2xl p-4">
      <h2 className="font-display text-sm font-semibold">Nuevo hábito o desliz</h2>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setKind("habit")}
          className={cn(
            "flex-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
            kind === "habit"
              ? "border-primary bg-primary/20 text-primary"
              : "border-border text-muted-foreground",
          )}
        >
          Hábito
        </button>
        <button
          type="button"
          onClick={() => setKind("slip")}
          className={cn(
            "flex-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
            kind === "slip"
              ? "border-destructive bg-destructive/20 text-destructive"
              : "border-border text-muted-foreground",
          )}
        >
          Desliz
        </button>
      </div>
      <Input
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="number"
        min={1}
        placeholder="Puntos"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
      />
      <Button type="submit" className="w-full" size="sm">
        Añadir
      </Button>
    </form>
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