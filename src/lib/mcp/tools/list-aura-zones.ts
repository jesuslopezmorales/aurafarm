import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_aura_zones",
  title: "Consultar zonas y eventos de Aura",
  description:
    "Lista las Zonas de Aura (eventos, lugares patrocinados y zonas salvajes) con su multiplicador, gente activa y si están en directo.",
  inputSchema: {
    only_live: z.boolean().default(false).describe("Devolver solo las zonas activas en directo."),
    kind: z
      .enum(["Evento", "Patrocinado", "Zona salvaje"])
      .optional()
      .describe("Filtrar por tipo de zona."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_live, kind }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("aura_zones")
      .select("id, name, kind, multiplier, people, detail, live")
      .order("people", { ascending: false });
    if (only_live) query = query.eq("live", true);
    if (kind) query = query.eq("kind", kind);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { zones: data ?? [] },
    };
  },
});
