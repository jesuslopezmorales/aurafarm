import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

function safeNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNext(s['next']) }),
  head: () => ({
    meta: [
      { title: "Entrar en AuraFarm — tu cuenta de Aura" },
      {
        name: "description",
        content:
          "Crea tu cuenta de AuraFarm para guardar tu Aura, tu racha y tus hábitos, y conectar asistentes de IA a tu progreso.",
      },
      { property: "og:title", content: "Entrar en AuraFarm" },
      { property: "og:description", content: "Guarda tu progreso de Aura y conecta tus asistentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      window.location.href = next;
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cuenta creada. Revisa tu correo si te pedimos confirmarla.");
    const { data } = await supabase.auth.getSession();
    if (data.session) window.location.href = next;
    else navigate({ to: "/auth", search: { next } });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${next}`,
    });
    if (result.error) {
      toast.error("No se pudo entrar con Google");
      return;
    }
    if (result.redirected) return;
    window.location.href = next;
  }


  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="text-center">
        <span className="glow-neon mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/20">
          <Sparkles className="size-5 text-primary" />
        </span>
        <h1 className="font-display mt-4 text-2xl font-bold">
          {mode === "in" ? "Entra a tu Aura" : "Crea tu cuenta"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu Aura, racha y hábitos quedan guardados y disponibles para tus asistentes conectados.
        </p>
      </header>

      <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-5">
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "in" ? "Entrar" : "Crear cuenta"}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={google}>
          Continuar con Google
        </Button>
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground underline"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "No tengo cuenta todavía" : "Ya tengo cuenta"}
        </button>
      </form>
    </main>
  );
}
