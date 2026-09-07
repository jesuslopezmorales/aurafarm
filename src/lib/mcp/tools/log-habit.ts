import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { ensureProfile, rankFor, requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "log_habit",
  title: "Registrar un hábito o desliz",
  description:
    "Marca como hecho hoy un hábito (o desliz) del usuario conectado y aplica sus puntos de Aura. Crea el hábito si no existe.",
  inputSchema: {
    habit: z.string().trim().min(2).max(80).describe("Nombre del hábito o desliz, p. ej. Entrenar 45 min."),
    create_if_missing: z
      .boolean()
      .default(false)
      .describe("Crear el hábito si el usuario todavía no lo tiene."),
    points: z
      .number()
      .int()
      .min(-200)
      .max(200)
      .optional()
      .describe("Puntos de Aura si hay que crear el hábito (negativos para deslices)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ habit, create_if_missing, points }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const profile = await ensureProfile(supabase, ctx);
    const today = new Date().toISOString().slice(0, 10);

    const found = await supabase
      .from("habits")
      .select("id, name, points, kind")
      .ilike("name", habit)
      .maybeSingle();
    if (found.error) throw new ToolError(found.error.message);

    let row = found.data;
    if (!row) {
      if (!create_if_missing || points === undefined) {
        throw new ToolError(
          `No existe el hábito "${habit}". Vuelve a llamar con create_if_missing=true y points para crearlo.`,
        );
      }
      const created = await supabase
        .from("habits")
        .insert({
          user_id: profile.id,
          name: habit,
          points,
          kind: points < 0 ? "slip" : "habit",
        })
        .select("id, name, points, kind")
        .single();
      if (created.error) throw new ToolError(created.error.message);
      row = created.data;
    }

    const log = await supabase
      .from("habit_logs")
      .insert({ habit_id: row.id, user_id: profile.id, logged_on: today })
      .select("id")
      .maybeSingle();
    if (log.error) {
      if (log.error.code === "23505") {
        throw new ToolError(`"${row.name}" ya estaba registrado hoy.`);
      }
      throw new ToolError(log.error.message);
    }

    const gain = Math.round(row.points * Number(profile.multiplier));
    const nextAura = Math.max(0, profile.aura + gain);
    const updated = await supabase
      .from("profiles")
      .update({ aura: nextAura, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (updated.error) throw new ToolError(updated.error.message);

    const result = {
      habit: row.name,
      kind: row.kind,
      logged_on: today,
      aura_delta: gain,
      aura_total: nextAura,
      rank: rankFor(nextAura).name,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
