import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_aura_feed",
  title: "Leer el feed de pruebas de Aura",
  description:
    "Lista las pruebas de Aura publicadas por la comunidad, con puntos, categoría y votos de autenticidad (real / cap).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10).describe("Número de pruebas a devolver."),
    only_mine: z.boolean().default(false).describe("Devolver solo las pruebas del usuario conectado."),
    category: z.string().trim().min(1).optional().describe("Filtrar por categoría, p. ej. Disciplina."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, only_mine, category }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("aura_posts")
      .select("id, user_id, action, detail, points, category, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (only_mine) query = query.eq("user_id", ctx.getUserId()!);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const ids = (data ?? []).map((p) => p.id);
    const voteCounts = ids.length
      ? await supabase.from("post_vote_counts").select("post_id, votes_real, votes_cap").in("post_id", ids)
      : { data: [], error: null };
    if (voteCounts.error) return { content: [{ type: "text", text: voteCounts.error.message }], isError: true };

    const posts = (data ?? []).map((p) => {
      const counts = (voteCounts.data ?? []).find((v) => v.post_id === p.id);
      return {
        id: p.id,
        action: p.action,
        detail: p.detail,
        points: p.points,
        category: p.category,
        created_at: p.created_at,
        mine: p.user_id === ctx.getUserId(),
        votes_real: counts?.votes_real ?? 0,
        votes_cap: counts?.votes_cap ?? 0,
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(posts, null, 2) }],
      structuredContent: { posts },
    };
  },
});