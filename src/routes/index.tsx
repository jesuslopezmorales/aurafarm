import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, Flame, ShieldCheck, ThumbsDown, TrendingDown, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAura } from "@/lib/aura-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AuraFarm — Feed de Prueba de Aura" },
      {
        name: "description",
        content:
          "Publica pruebas de tus acciones, gana o pierde Aura y deja que la comunidad vote la autenticidad.",
      },
      { property: "og:title", content: "AuraFarm — Feed de Prueba de Aura" },
      {
        property: "og:description",
        content: "Desarrollo personal gamificado: farmea Aura con pruebas reales cada día.",
      },
    ],
  }),
  component: FeedPage,
});

const filters = ["Todo", "Disciplina", "Coraje", "Karma", "Desliz"];

function FeedPage() {
  const { posts, vote, addPost, multiplier } = useAura();
  const [filter, setFilter] = useState("Todo");
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [detail, setDetail] = useState("");
  const [category, setCategory] = useState("Disciplina");
  const [points, setPoints] = useState(120);

  const visible = filter === "Todo" ? posts : posts.filter((p) => p.category === filter);

  return (
    <AppShell title="Prueba de Aura">
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95",
              filter === f
                ? "glow-neon border-primary/60 bg-primary/20 text-primary"
                : "border-border bg-secondary/50 text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mb-5 h-12 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-sm font-bold text-primary-foreground">
            <Camera className="size-4" /> Subir prueba de Aura
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[92vw] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Nueva prueba</DialogTitle>
            <DialogDescription>
              Sé honesto. La comunidad vota si es real o inventado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="accion">Acción</Label>
              <Input
                id="accion"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Entrené a las 5:40 AM"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detalle">Contexto</Label>
              <Textarea
                id="detalle"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Cuenta cómo fue en una línea"
              />
            </div>
            <div className="flex gap-2">
              {["Disciplina", "Coraje", "Karma", "Desliz"].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setPoints(c === "Desliz" ? -120 : 120);
                  }}
                  className={cn(
                    "flex-1 rounded-xl border px-2 py-2 text-[11px] font-semibold",
                    category === c
                      ? "border-primary/60 bg-primary/20 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-11 w-full rounded-2xl bg-gradient-to-r from-primary to-accent font-bold"
              disabled={!action.trim()}
              onClick={() => {
                addPost({ action: action.trim(), detail: detail.trim(), points, category });
                toast.success(
                  points >= 0
                    ? `+${Math.round(points * multiplier)} Aura en camino`
                    : `${Math.round(points * multiplier)} Aura, respeto por la honestidad`,
                );
                setAction("");
                setDetail("");
                setOpen(false);
              }}
            >
              Publicar prueba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ul className="space-y-4">
        {visible.map((p) => {
          const total = p.votesReal + p.votesCap;
          const trust = total ? Math.round((p.votesReal / total) * 100) : 0;
          return (
            <li
              key={p.id}
              className="glass overflow-hidden rounded-3xl"
            >
              <div className={cn("relative bg-gradient-to-br p-4", p.gradient)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-background/60 text-sm font-bold">
                      {p.user.slice(0, 1)}
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">{p.user}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.rank} · {p.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                      p.points >= 0
                        ? "bg-primary/20 text-primary"
                        : "bg-destructive/20 text-destructive",
                    )}
                  >
                    {p.points >= 0 ? (
                      <Zap className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {p.points > 0 ? `+${p.points}` : p.points}
                  </span>
                </div>

                <p className="font-display mt-4 text-base leading-snug font-semibold">{p.action}</p>
                {p.detail && <p className="mt-1 text-xs text-muted-foreground">{p.detail}</p>}
                <Badge variant="secondary" className="mt-3 rounded-full text-[10px]">
                  {p.category}
                </Badge>
              </div>

              <div className="space-y-3 px-4 pt-3 pb-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-accent" /> Autenticidad {trust}%
                  </span>
                  <span>{total} votos</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${trust}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => vote(p.id, "real")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all active:scale-95",
                      p.myVote === "real"
                        ? "glow-neon border-primary/60 bg-primary/20 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <Check className="size-4" /> Es real ({p.votesReal})
                  </button>
                  <button
                    onClick={() => vote(p.id, "cap")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all active:scale-95",
                      p.myVote === "cap"
                        ? "border-destructive/60 bg-destructive/20 text-destructive"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <ThumbsDown className="size-4" /> Cap ({p.votesCap})
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Flame className="size-3.5 text-primary" /> El feed se renueva cada 24 h
      </p>
    </AppShell>
  );
}
