import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Plug, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/conectar")({
  head: () => ({
    meta: [
      { title: "Conectar AuraSync con tu asistente de IA" },
      {
        name: "description",
        content:
          "Instrucciones para conectar AuraSync a ChatGPT, Claude, Cursor u otros clientes compatibles y consultar tu Aura, hábitos y zonas desde el chat.",
      },
      { property: "og:title", content: "Conectar AuraSync con tu asistente de IA" },
      {
        property: "og:description",
        content: "Conecta tu cuenta y consulta tu Aura, feed, hábitos y zonas desde tu asistente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnectPage,
});

const tools = [
  { name: "get_aura_profile", detail: "Tu Aura total, rango, racha y multiplicador." },
  { name: "list_aura_feed", detail: "Últimas pruebas de Aura de la comunidad y sus votos." },
  { name: "log_aura_action", detail: "Registra un logro o un desliz y actualiza tu Aura." },
  { name: "list_habits", detail: "Tus hábitos y deslices, con lo ya registrado hoy." },
  { name: "log_habit", detail: "Marca un hábito como hecho hoy (o créalo al vuelo)." },
  { name: "list_aura_zones", detail: "Zonas, eventos y sitios patrocinados con multiplicador." },
];

function ConnectPage() {
  const [endpoint, setEndpoint] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEndpoint(`${window.location.origin}/mcp`);
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    toast.success("Dirección copiada");
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <AppShell title="Conectar asistentes">
      <section className="glass rounded-3xl p-5">
        <span className="glow-neon flex size-11 items-center justify-center rounded-2xl bg-primary/20">
          <Plug className="size-5 text-primary" />
        </span>
        <h1 className="font-display mt-4 text-xl font-bold">
          Habla con tu Aura desde tu asistente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          AuraSync ofrece un servidor de herramientas para clientes compatibles como ChatGPT, Claude,
          Cursor o Codex. Tras conectarlo puedes pedir cosas como «¿cómo va mi racha?» o «apunta que
          he entrenado 45 minutos».
        </p>
      </section>

      <section className="glass mt-4 rounded-3xl p-5">
        <h2 className="font-display text-sm font-semibold">1 · Dirección de conexión</h2>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl border border-border/70 bg-secondary/50 px-3 py-2 text-xs">
            {endpoint || "…"}
          </code>
          <Button size="icon" variant="outline" onClick={copy} aria-label="Copiar dirección">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Pega esta dirección en tu cliente como servidor remoto (HTTP). El propio cliente se registra
          solo, no necesitas claves.
        </p>
      </section>

      <section className="glass mt-4 rounded-3xl p-5">
        <h2 className="font-display text-sm font-semibold">2 · Autoriza tu cuenta</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Al conectar, tu cliente te llevará a una pantalla de AuraSync para iniciar sesión y aprobar
          el acceso. Cada persona ve y modifica solo su propio Aura.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <ShieldCheck className="size-4 text-accent" />
          {signedIn === null
            ? "Comprobando tu sesión…"
            : signedIn
              ? "Tu sesión está activa: la autorización será inmediata."
              : "Aún no has iniciado sesión: te la pediremos al autorizar."}
        </div>
        {signedIn === false && (
          <Button asChild className="mt-4 w-full">
            <a href="/auth">Crear cuenta o entrar</a>
          </Button>
        )}
      </section>

      <section className="glass mt-4 rounded-3xl p-5">
        <h2 className="font-display text-sm font-semibold">3 · Qué puede hacer</h2>
        <ul className="mt-3 space-y-3">
          {tools.map((t) => (
            <li key={t.name} className="rounded-2xl border border-border/60 bg-secondary/40 p-3">
              <p className="text-xs font-semibold text-primary">{t.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Puedes revocar el acceso en cualquier momento cerrando la sesión de la app o denegando la
          siguiente solicitud de conexión.
        </p>
      </section>
    </AppShell>
  );
}
