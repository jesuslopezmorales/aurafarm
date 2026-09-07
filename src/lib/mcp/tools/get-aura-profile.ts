import { defineTool } from "@lovable.dev/mcp-js";

import { ensureProfile, rankFor, requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_aura_profile",
  title: "Consultar perfil y progreso de Aura",
  description:
    "Devuelve el perfil del usuario conectado: Aura total, rango actual, racha de días, multiplicador y estado del Aura Pass.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const profile = await ensureProfile(supabase, ctx);
    const rank = rankFor(profile.aura);

    const [posts, checkins] = await Promise.all([
      supabase.from("aura_posts").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
      supabase.from("zone_checkins").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    ]);

    const summary = {
      display_name: profile.display_name,
      handle: `@${profile.handle}`,
      aura: profile.aura,
      rank: rank.name,
      next_rank_at: Number.isFinite(rank.max) ? rank.max : null,
      streak_days: profile.streak,
      multiplier: Number(profile.multiplier),
      aura_pass_active: profile.pass_active,
      proofs_published: posts.count ?? 0,
      zone_checkins: checkins.count ?? 0,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
