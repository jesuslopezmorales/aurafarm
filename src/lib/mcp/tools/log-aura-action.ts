import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { ensureProfile, rankFor, requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "log_aura_action",
  title: "Registrar una acción de Aura",
  description:
    "Publica una prueba de Aura del usuario conectado (acción positiva o desliz) y actualiza su Aura y su racha.",
  inputSchema: {
    action: z.string().trim().min(3).max(140).describe("Qué hizo el usuario."),
    detail: z.string().trim().max(500).default("").describe("Contexto opcional de la acción."),
    points: z
      .number()
      .int()
      .min(-500)
      .max(500)
      .describe("Aura base: positiva para logros, negativa para deslices."),
    category: z.string().trim().min(1).max(40).default("Disciplina").describe("Categoría de la acción."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ action, detail, points, category }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const profile = await ensureProfile(supabase, ctx);

    const gain = Math.round(points * Number(profile.multiplier));
    const inserted = await supabase
      .from("aura_posts")
      .insert({ user_id: profile.id, action, detail, points: gain, category })
      .select("id, action, points, category, created_at")
      .single();
    if (inserted.error)
      return { content: [{ type: "text", text: inserted.error.message }], isError: true };

    const nextAura = Math.max(0, profile.aura + gain);
    const nextStreak = gain > 0 ? profile.streak + 1 : profile.streak;
    const updated = await supabase
      .from("profiles")
      .update({ aura: nextAura, streak: nextStreak, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (updated.error)
      return { content: [{ type: "text", text: updated.error.message }], isError: true };

    const result = {
      post: inserted.data,
      aura_delta: gain,
      aura_total: nextAura,
      streak_days: nextStreak,
      rank: rankFor(nextAura).name,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
