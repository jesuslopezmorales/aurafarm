import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Vote = "real" | "cap" | null;

export type AuraPost = {
  id: string;
  user: string;
  handle: string;
  rank: string;
  time: string;
  action: string;
  detail: string;
  points: number;
  category: string;
  gradient: string;
  votesReal: number;
  votesCap: number;
  myVote: Vote;
};

export type Habit = {
  id: string;
  name: string;
  points: number;
  done: boolean;
  kind: "habit" | "slip";
};

export type AuraZone = {
  id: string;
  name: string;
  kind: "Evento" | "Patrocinado" | "Zona salvaje";
  x: number;
  y: number;
  multiplier: string;
  people: number;
  detail: string;
  live: boolean;
};

const initialPosts: AuraPost[] = [
  {
    id: "p1",
    user: "Nerea",
    handle: "@nereafarm",
    rank: "Main Character",
    time: "hace 6 min",
    action: "Gym a las 5:40 AM sin alarma social",
    detail: "Nadie me vio salir de casa. La disciplina se cocina en silencio.",
    points: 240,
    category: "Disciplina",
    gradient: "from-primary/40 via-accent/25 to-transparent",
    votesReal: 182,
    votesCap: 14,
    myVote: null,
  },
  {
    id: "p2",
    user: "Iker",
    handle: "@ikerzero",
    rank: "NPC",
    time: "hace 22 min",
    action: "Scroll de 3 horas en la cama",
    detail: "Confesión honesta. Me quito el Aura yo mismo antes de que lo hagan otros.",
    points: -160,
    category: "Desliz",
    gradient: "from-destructive/35 via-primary/10 to-transparent",
    votesReal: 341,
    votesCap: 6,
    myVote: null,
  },
  {
    id: "p3",
    user: "Ada",
    handle: "@adasync",
    rank: "Aura Master",
    time: "hace 1 h",
    action: "Hablé en público sin notas ante 200 personas",
    detail: "Me temblaban las manos, seguí igual. Aura se farmea en el miedo.",
    points: 520,
    category: "Coraje",
    gradient: "from-accent/40 via-primary/25 to-transparent",
    votesReal: 903,
    votesCap: 41,
    myVote: null,
  },
  {
    id: "p4",
    user: "Bruno",
    handle: "@brunolift",
    rank: "Main Character",
    time: "hace 2 h",
    action: "Devolví una cartera con 300 € dentro",
    detail: "El dueño lloró. Yo también, un poco.",
    points: 380,
    category: "Karma",
    gradient: "from-primary/35 via-accent/20 to-transparent",
    votesReal: 512,
    votesCap: 88,
    myVote: null,
  },
];

const initialHabits: Habit[] = [
  { id: "h1", name: "Despertar antes de las 6:00", points: 60, done: true, kind: "habit" },
  { id: "h2", name: "Entrenar 45 min", points: 80, done: true, kind: "habit" },
  { id: "h3", name: "Leer 20 páginas", points: 40, done: false, kind: "habit" },
  { id: "h4", name: "Cero azúcar", points: 30, done: false, kind: "habit" },
  { id: "h5", name: "Móvil antes de dormir", points: -50, done: false, kind: "slip" },
  { id: "h6", name: "Cancelar planes por pereza", points: -70, done: false, kind: "slip" },
];

function zoneFromRow(row: Tables<"aura_zones">): AuraZone {
  const kind: AuraZone["kind"] =
    row.kind === "Evento" || row.kind === "Patrocinado" || row.kind === "Zona salvaje"
      ? row.kind
      : "Zona salvaje";
  return {
    id: row.id,
    name: row.name,
    kind,
    x: row.x,
    y: row.y,
    multiplier: row.multiplier,
    people: row.people,
    detail: row.detail,
    live: row.live,
  };
}

export const ranks = [
  { name: "NPC", min: 0, max: 2500 },
  { name: "Main Character", min: 2500, max: 12000 },
  { name: "Aura Master", min: 12000, max: 30000 },
];

export function rankFor(aura: number) {
  return ranks.find((r) => aura >= r.min && aura < r.max) ?? ranks[ranks.length - 1]!;
}

/** Local (not UTC) calendar date, matching the `date` type of habit_logs.logged_on. */
function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** [00:00:00 today, 00:00:00 tomorrow) in local time, as ISO strings for a timestamptz range filter. */
function localDayRangeIso(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

const GUEST_DISPLAY_NAME = "Tú";
const GUEST_HANDLE = "@tuaura";

type ProfileRow = Tables<"profiles">;
type HabitRow = Tables<"habits">;

function habitFromRow(row: HabitRow, done: boolean): Habit {
  return {
    id: row.id,
    name: row.name,
    points: row.points,
    kind: row.kind === "slip" ? "slip" : "habit",
    done,
  };
}

function handleFromProfile(profile: ProfileRow): string {
  const raw = (profile as { handle?: string | null }).handle;
  return raw ? `@${raw.replace(/^@/, "")}` : GUEST_HANDLE;
}

/**
 * toggle_habit(p_habit_id uuid, p_done boolean, p_logged_on date) is a Postgres RPC
 * created directly via Lovable's SQL editor (not through a schema-chat migration), so it
 * is absent from the auto-generated src/integrations/supabase/types.ts (off-limits, never
 * hand-edited here). This narrow, local type lets us call it without weakening the
 * typing of the shared `supabase` client anywhere else.
 */
type ToggleHabitClient = {
  rpc: (
    fn: "toggle_habit",
    args: { p_habit_id: string; p_done: boolean; p_logged_on: string },
  ) => PromiseLike<{
    data: { new_aura: number }[] | null;
    error: { message: string } | null;
  }>;
};

type Store = {
  aura: number;
  streak: number;
  multiplier: number;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  bio: string | null;
  posts: AuraPost[];
  habits: Habit[];
  zones: AuraZone[];
  passActive: boolean;
  vote: (postId: string, vote: Exclude<Vote, null>) => void;
  toggleHabit: (habitId: string) => void;
  addPost: (input: { action: string; detail: string; points: number; category: string }) => void;
  activatePass: (multiplier: number) => void;
  addHabit: (input: { name: string; points: number; kind: "habit" | "slip" }) => void;
  updateDisplayName: (name: string) => void;
  updateAvatarUrl: (url: string) => void;
  updateBio: (bio: string) => void;
  checkInZone: (zoneId: string) => Promise<boolean>;
};

const AuraContext = createContext<Store | null>(null);

export function AuraProvider({ children }: { children: ReactNode }) {
  const [aura, setAura] = useState(8420);
  const [streak, setStreak] = useState(37);
  const [multiplier, setMultiplier] = useState(1);
  const [passActive, setPassActive] = useState(false);
  const [displayName, setDisplayName] = useState(GUEST_DISPLAY_NAME);
  const [handle, setHandle] = useState(GUEST_HANDLE);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [habits, setHabits] = useState(initialHabits);
  const [zones, setZones] = useState<AuraZone[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("aura_zones")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("[aura-store] load zones", error.message);
          return;
        }
        setZones((data ?? []).map(zoneFromRow));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let lastUid: string | null | undefined = undefined;

    function applyProfile(profile: ProfileRow) {
      if (!active) return;
      setAura(profile.aura);
      setStreak(profile.streak);
      setMultiplier(profile.multiplier);
      setPassActive(profile.pass_active);
      setDisplayName(profile.display_name);
      setHandle(handleFromProfile(profile));
      setAvatarUrl(profile.avatar_url);
      setBio(profile.bio);
    }

    async function loadForUser(uid: string) {
      const existing = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (!active) return;
      if (existing.error) {
        console.error("[aura-store] load profile", existing.error.message);
      } else if (existing.data) {
        applyProfile(existing.data);
      } else {
        const created = await supabase.from("profiles").insert({ id: uid }).select("*").single();
        if (!active) return;
        if (created.error) {
          console.error("[aura-store] create profile", created.error.message);
        } else if (created.data) {
          applyProfile(created.data);
        }
      }

      const [habitsRes, logsRes] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", uid),
        supabase.from("habit_logs").select("habit_id").eq("user_id", uid).eq("logged_on", todayIso()),
      ]);
      if (!active) return;
      if (habitsRes.error) {
        console.error("[aura-store] load habits", habitsRes.error.message);
        return;
      }
      const doneIds = new Set((logsRes.data ?? []).map((l) => l.habit_id));
      setHabits(habitsRes.data.map((row) => habitFromRow(row, doneIds.has(row.id))));
    }

    function resetToGuestDefaults() {
      if (!active) return;
      setAura(8420);
      setStreak(37);
      setMultiplier(1);
      setPassActive(false);
      setDisplayName(GUEST_DISPLAY_NAME);
      setHandle(GUEST_HANDLE);
      setAvatarUrl(null);
      setBio(null);
      setHabits(initialHabits);
    }

    function syncUser(uid: string | null) {
      if (uid === lastUid) return;
      lastUid = uid;
      setUserId(uid);
      if (uid) {
        void loadForUser(uid);
      } else {
        resetToGuestDefaults();
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      syncUser(data.session?.user.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user.id ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<Store>(
    () => ({
      aura,
      streak,
      multiplier,
      displayName,
      handle,
      avatarUrl,
      bio,
      passActive,
      posts,
      habits,
      zones,
      vote: (postId, vote) =>
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const was = p.myVote;
            const next = was === vote ? null : vote;
            const delta = (kind: Exclude<Vote, null>) =>
              (next === kind ? 1 : 0) - (was === kind ? 1 : 0);
            return {
              ...p,
              myVote: next,
              votesReal: p.votesReal + delta("real"),
              votesCap: p.votesCap + delta("cap"),
            };
          }),
        ),
      toggleHabit: (habitId) => {
        const target = habits.find((h) => h.id === habitId);
        if (!target) return;
        const done = !target.done;

        setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, done } : h)));

        if (!userId) {
          const delta = (done ? target.points : -target.points) * multiplier;
          setAura((a) => Math.max(0, a + delta));
          return;
        }

        (supabase as unknown as ToggleHabitClient)
          .rpc("toggle_habit", {
            p_habit_id: habitId,
            p_done: done,
            p_logged_on: todayIso(),
          })
          .then(({ data, error }) => {
            if (error) {
              console.error("[aura-store] toggle_habit", error.message);
              toast.error("No se pudo guardar el hábito");
              setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, done: !done } : h)));
              return;
            }
            const row = data?.[0];
            if (row) setAura(row.new_aura);
          });
      },
      addPost: ({ action, detail, points, category }) => {
        const gain = Math.round(points * multiplier);
        setPosts((prev) => [
          {
            id: `p${Date.now()}`,
            user: displayName,
            handle,
            rank: rankFor(aura).name,
            time: "ahora",
            action,
            detail,
            points: gain,
            category,
            gradient:
              gain >= 0
                ? "from-primary/40 via-accent/25 to-transparent"
                : "from-destructive/35 via-primary/10 to-transparent",
            votesReal: 0,
            votesCap: 0,
            myVote: null,
          },
          ...prev,
        ]);
        setAura((a) => Math.max(0, a + gain));
        if (gain > 0) setStreak((s) => s + 1);
      },
      activatePass: (m) => {
        setMultiplier(m);
        setPassActive(true);
      },
      addHabit: ({ name, points, kind }) => {
        if (!userId) {
          toast.error("Inicia sesión para añadir hábitos");
          return;
        }
        const trimmed = name.trim();
        if (!trimmed) return;
        supabase
          .from("habits")
          .insert({ user_id: userId, name: trimmed, points, kind })
          .select("*")
          .single()
          .then(({ data, error }) => {
            if (error || !data) {
              console.error("[aura-store] addHabit", error?.message);
              toast.error("No se pudo guardar el hábito");
              return;
            }
            setHabits((prev) => [...prev, habitFromRow(data, false)]);
          });
      },
      updateDisplayName: (name) => {
        if (!userId) {
          toast.error("Inicia sesión para editar tu nombre");
          return;
        }
        const trimmed = name.trim();
        if (!trimmed) return;
        setDisplayName(trimmed);
        supabase
          .from("profiles")
          .update({ display_name: trimmed })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) {
              console.error("[aura-store] updateDisplayName", error.message);
              toast.error("No se pudo actualizar el nombre");
            }
          });
      },
      updateAvatarUrl: (url) => {
        if (!userId) {
          toast.error("Inicia sesión para editar tu foto");
          return;
        }
        const trimmed = url.trim();
        const next = trimmed.length > 0 ? trimmed : null;
        setAvatarUrl(next);
        supabase
          .from("profiles")
          .update({ avatar_url: next })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) {
              console.error("[aura-store] updateAvatarUrl", error.message);
              toast.error("No se pudo actualizar la foto");
            }
          });
      },
      updateBio: (bioText) => {
        if (!userId) {
          toast.error("Inicia sesión para editar tu bio");
          return;
        }
        const trimmed = bioText.trim();
        const next = trimmed.length > 0 ? trimmed : null;
        setBio(next);
        supabase
          .from("profiles")
          .update({ bio: next })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) {
              console.error("[aura-store] updateBio", error.message);
              toast.error("No se pudo actualizar la bio");
            }
          });
      },
      checkInZone: async (zoneId) => {
        if (!userId) {
          toast.error("Inicia sesión para hacer check-in");
          return false;
        }

        const { start, end } = localDayRangeIso();
        const lookup = await supabase
          .from("zone_checkins")
          .select("id")
          .eq("user_id", userId)
          .eq("zone_id", zoneId)
          .gte("created_at", start)
          .lt("created_at", end)
          .limit(1);
        if (lookup.error) {
          console.error("[aura-store] checkInZone lookup", lookup.error.message);
        } else if (lookup.data.length > 0) {
          toast.info("Ya hiciste check-in aquí hoy");
          return false;
        }

        const { error } = await supabase
          .from("zone_checkins")
          .insert({ zone_id: zoneId, user_id: userId });
        if (error) {
          console.error("[aura-store] checkInZone", error.message);
          toast.error("No se pudo registrar el check-in");
          return false;
        }
        return true;
      },
    }),
    [aura, streak, multiplier, displayName, handle, avatarUrl, bio, passActive, posts, habits, zones, userId],
  );

  return <AuraContext.Provider value={value}>{children}</AuraContext.Provider>;
}

export function useAura() {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error("useAura must be used inside AuraProvider");
  return ctx;
}
