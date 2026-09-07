import { defineTool } from "@lovable.dev/mcp-js";

import { requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_habits",
  title: "Listar hábitos y deslices",
  description:
    "Devuelve los hábitos y deslices del usuario conectado, con sus puntos de Aura y si ya se han registrado hoy.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const today = new Date().toISOString().slice(0, 10);

    const habits = await supabase
      .from("habits")
      .select("id, name, points, kind")
      .order("created_at", { ascending: true });
    if (habits.error) return { content: [{ type: "text", text: habits.error.message }], isError: true };

    const logs = await supabase.from("habit_logs").select("habit_id").eq("logged_on", today);
    if (logs.error) return { content: [{ type: "text", text: logs.error.message }], isError: true };
    const doneToday = new Set((logs.data ?? []).map((l) => l.habit_id));

    const items = (habits.data ?? []).map((h) => ({
      id: h.id,
      name: h.name,
      points: h.points,
      kind: h.kind,
      done_today: doneToday.has(h.id),
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { habits: items },
    };
  },
});
