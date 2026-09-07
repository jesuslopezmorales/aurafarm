import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

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

export const zones: AuraZone[] = [
  {
    id: "z1",
    name: "Parque del Retiro",
    kind: "Evento",
    x: 26,
    y: 30,
    multiplier: "x2 Aura",
    people: 148,
    detail: "Run club comunitario · 07:00",
    live: true,
  },
  {
    id: "z2",
    name: "Iron Vault Gym",
    kind: "Patrocinado",
    x: 68,
    y: 22,
    multiplier: "x3 Aura",
    people: 92,
    detail: "Check-in patrocinado · todo el día",
    live: true,
  },
  {
    id: "z3",
    name: "Biblioteca Central",
    kind: "Zona salvaje",
    x: 44,
    y: 58,
    multiplier: "x1.5 Aura",
    people: 37,
    detail: "Deep work silencioso · 2 h mínimo",
    live: false,
  },
  {
    id: "z4",
    name: "Azotea Neón",
    kind: "Evento",
    x: 78,
    y: 48,
    multiplier: "x2.5 Aura",
    people: 264,
    detail: "Aura Battle abierta · 21:00",
    live: true,
  },
  {
    id: "z5",
    name: "Mercado Sur",
    kind: "Patrocinado",
    x: 16,
    y: 60,
    multiplier: "x1.8 Aura",
    people: 61,
    detail: "Comida real, cero ultraprocesados",
    live: false,
  },
];

export const ranks = [
  { name: "NPC", min: 0, max: 2500 },
  { name: "Main Character", min: 2500, max: 12000 },
  { name: "Aura Master", min: 12000, max: 30000 },
];

export function rankFor(aura: number) {
  return ranks.find((r) => aura >= r.min && aura < r.max) ?? ranks[ranks.length - 1]!;
}

type Store = {
  aura: number;
  streak: number;
  multiplier: number;
  posts: AuraPost[];
  habits: Habit[];
  passActive: boolean;
  vote: (postId: string, vote: Exclude<Vote, null>) => void;
  toggleHabit: (habitId: string) => void;
  addPost: (input: { action: string; detail: string; points: number; category: string }) => void;
  activatePass: (multiplier: number) => void;
};

const AuraContext = createContext<Store | null>(null);

export function AuraProvider({ children }: { children: ReactNode }) {
  const [aura, setAura] = useState(8420);
  const [streak, setStreak] = useState(37);
  const [multiplier, setMultiplier] = useState(1);
  const [passActive, setPassActive] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [habits, setHabits] = useState(initialHabits);

  const value = useMemo<Store>(
    () => ({
      aura,
      streak,
      multiplier,
      passActive,
      posts,
      habits,
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
        setHabits((prev) =>
          prev.map((h) => {
            if (h.id !== habitId) return h;
            const done = !h.done;
            setAura((a) => Math.max(0, a + (done ? h.points : -h.points) * multiplier));
            return { ...h, done };
          }),
        );
      },
      addPost: ({ action, detail, points, category }) => {
        const gain = Math.round(points * multiplier);
        setPosts((prev) => [
          {
            id: `p${Date.now()}`,
            user: "Tú",
            handle: "@tuaura",
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
    }),
    [aura, streak, multiplier, passActive, posts, habits],
  );

  return <AuraContext.Provider value={value}>{children}</AuraContext.Provider>;
}

export function useAura() {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error("useAura must be used inside AuraProvider");
  return ctx;
}
