import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function configuredEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

function supabaseProjectUrl(): string {
  const url = configuredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  if (!url) throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) is required");
  return url;
}

function supabasePublishableKey(): string {
  const direct = configuredEnv(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (direct) return direct;
  const keyset = runtimeEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (keyset) {
    try {
      const parsed: unknown = JSON.parse(keyset);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys['default'], ...Object.values(keys)]
          .find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"))
          ?.trim();
        if (key) return key;
      }
    } catch {
      // fall through to legacy names
    }
  }
  const legacy = configuredEnv(["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]);
  if (legacy) return legacy;
  throw new Error("A Supabase publishable key is required");
}

/** No caller identity — RLS runs as `anon`. Public data only. */
export function supabaseAnon() {
  return createClient(supabaseProjectUrl(), supabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Forwards the verified bearer token so RLS runs as the signed-in user. */
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("Esta herramienta requiere una sesión OAuth verificada");
  return createClient(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AuraProfile = {
  id: string;
  display_name: string;
  handle: string;
  aura: number;
  streak: number;
  multiplier: number;
  pass_active: boolean;
};

/** Reads the caller's profile, creating a default one the first time. */
export async function ensureProfile(
  supabase: SupabaseClient,
  ctx: ToolContext,
): Promise<AuraProfile> {
  const userId = ctx.getUserId();
  if (!userId) throw new Error("No se pudo identificar al usuario");

  const existing = await supabase
    .from("profiles")
    .select("id, display_name, handle, aura, streak, multiplier, pass_active")
    .eq("id", userId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data as AuraProfile;

  const email = ctx.getUserEmail() ?? "";
  const handle = (email.split("@")[0] ?? "aura").toLowerCase().replace(/[^a-z0-9_]/g, "") || "aura";
  const created = await supabase
    .from("profiles")
    .insert({ id: userId, display_name: email.split("@")[0] || "Aura Farmer", handle })
    .select("id, display_name, handle, aura, streak, multiplier, pass_active")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data as AuraProfile;
}

export const RANKS = [
  { name: "NPC", min: 0, max: 2500 },
  { name: "Main Character", min: 2500, max: 12000 },
  { name: "Aura Master", min: 12000, max: Number.POSITIVE_INFINITY },
] as const;

export function rankFor(aura: number) {
  return RANKS.find((r) => aura >= r.min && aura < r.max) ?? RANKS[RANKS.length - 1]!;
}

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated() || !ctx.getUserId()) {
    throw new Error("Necesitas conectar tu cuenta de AuraSync para usar esta herramienta");
  }
}
