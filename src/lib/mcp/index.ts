import { auth, defineMcp } from "@lovable.dev/mcp-js";

import getAuraProfile from "./tools/get-aura-profile";
import listAuraFeed from "./tools/list-aura-feed";
import logAuraAction from "./tools/log-aura-action";
import listHabits from "./tools/list-habits";
import logHabit from "./tools/log-habit";
import listAuraZones from "./tools/list-aura-zones";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "aurasync-your-personal-growth-journey",
  title: "AuraSync: Your Personal Growth Journey",
  version: "0.1.0",
  instructions:
    "Herramientas de AuraSync, una app de desarrollo personal gamificado. Usa get_aura_profile para el progreso del usuario (Aura, rango, racha), list_aura_feed para leer pruebas de Aura de la comunidad, log_aura_action para registrar un logro o desliz, list_habits y log_habit para los hábitos diarios, y list_aura_zones para eventos y lugares con multiplicador. Todas las herramientas actúan en nombre del usuario que ha iniciado sesión.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getAuraProfile, listAuraFeed, logAuraAction, listHabits, logHabit, listAuraZones],
});
