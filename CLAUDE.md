# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

---

## Commands

```bash
# Development
npm run dev          # Vite dev server (TanStack Start), puerto 8080 en este Codespace
npm run build         # Build de producción
npm run build:dev     # Build en modo development
npm run preview       # Preview del build
npm run lint          # ESLint
npx tsc --noEmit      # Type-check (no existe script "typecheck" en package.json, usar este comando directo)

# Deploy (siempre en una sola línea encadenada)
git add . && git commit -m 'mensaje' && git push origin main

# Snapshot de código
npx repomix --output repomix-focused.xml --include "src/**/*.ts,src/**/*.tsx"
```

No test suite exists in this project.

---

## Reglas de trabajo obligatorias

1. **Archivos completos siempre** — cero `// ...`, cero truncaciones, cero snippets, salvo que el archivo sea excesivamente largo (indicarlo explícitamente si es el caso).
2. **Un paso a la vez** — esperar confirmación ("OK") antes de avanzar a la siguiente tarea.
3. **Congelación estética**: sin cambios visuales/CSS/estructurales salvo que se pidan explícitamente.
4. **Tipado estricto de TypeScript** siempre, con todos los imports necesarios incluidos.
5. **Deploy** siempre con comillas simples en el mensaje de commit para evitar expansión de historial bash.
6. **Rango geoespacial dinámico de 1 a 50 km** cuando se implemente la validación de proximidad de Zonas (Objetivo 4, Parte B) — nunca radio fijo.
7. Antes de dar una tarea por completada, comprobar `git status` — no asumir que algo implementado ya está commiteado.

---

## Archivos permanentemente off-limits (nunca modificar directamente)

Marcados como auto-generados en su propia cabecera — cualquier cambio debe hacerse vía el chat de Lovable, no editando estos archivos a mano:
- `drizzle/schema.ts` (auto-generado y dejado en blanco intencionadamente)
- `drizzle/migrations/*` (incluye 0000_aurasync_core_schema.sql — el nombre NO se actualizó a "aurafarm" en el rebrand a propósito, coincide con el tag interno de Drizzle)
- `src/integrations/supabase/types.ts`, `client.ts`, `client.server.ts`, `auth-attacher.ts`, `auth-middleware.ts`, `cron-auth.ts`, `previewAuthStorage.ts`
- `src/integrations/lovable/index.ts`

---

## Notas de infraestructura críticas

- **Backend**: Lovable Cloud (Supabase gestionado por Lovable, proxy propio en dominio *.lovable.cloud, no *.supabase.co). Sin dashboard de supabase.com. Sin acceso SQL directo salvo plan Enterprise de Lovable (LOVABLE_DB_MIGRATION_URL, en "Secretos de compilación").
- **Cambios de esquema de base de datos** (columnas o tablas nuevas) solo vía chat de IA de Lovable — consumen créditos. Dividir siempre cualquier objetivo en "parte sin coste" (usa el esquema ya existente) y "parte bloqueada" (requiere créditos).
- **Auth**: email/contraseña funcional y verificado. Google vía broker propio de Lovable (@lovable.dev/cloud-auth-js) — solo soporta google/apple/microsoft/lovable, NUNCA GitHub. Fiable solo en el dominio publicado final, no en vistas previas ni Codespaces.
- **Variables de entorno**: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en `.env` (gitignored). Si faltan en un Codespace nuevo, recuperarlas inspeccionando la pestaña Network del navegador en una vista previa de Lovable que sí funcione (URL de la petición = SUPABASE_URL, cabecera `apikey` = publishable key).
- **Dominio**: getaurafarmapp.com (Squarespace), sin DNS/hosting configurado todavía.
- **Esquema de base de datos ya existente** (con RLS configurado): `profiles` (id, display_name, handle, aura, streak, multiplier, pass_active — sin avatar_url ni bio todavía), `aura_posts`, `post_votes`, `habits`, `habit_logs`, `aura_zones` (x/y son posiciones decorativas 0-100 para el mapa SVG, NO coordenadas GPS — sin latitude/longitude todavía), `zone_checkins`.

---

## Architecture Overview

**AuraFarm** — PWA de desarrollo personal gamificado: pruebas de Aura, rangos, rachas, hábitos/deslices, zonas con multiplicador, Aura Pass.

### Stack
- **TanStack Start** (React 19) sobre Vite 8
- **Supabase JS** (`@supabase/supabase-js`) contra Lovable Cloud
- **Tailwind CSS v4** + Shadcn UI (Radix)
- **lucide-react** para iconos
- **sonner** para toasts
- **@lovable.dev/cloud-auth-js**: broker de OAuth propio de Lovable (auto-generado, no editar)

### Key Data Flows
- **Estado global**: `src/lib/aura-store.tsx` (AuraProvider/useAura) — se suscribe a `supabase.auth.onAuthStateChange`; con sesión activa carga profiles/habits/habit_logs/aura_zones reales, sin sesión mantiene datos de ejemplo en memoria (comportamiento de invitado, no roto).
- **Auth**: `src/routes/auth.tsx` — email/contraseña directo contra `supabase.auth`, Google vía `lovable.auth.signInWithOAuth` (integrations/lovable/index.ts).
- **MCP server**: `src/lib/mcp/` — expone herramientas (get_aura_profile, list_aura_feed, log_aura_action, list_habits, log_habit, list_aura_zones) para que asistentes de IA externos (ChatGPT, Claude, Cursor) consulten/modifiquen el Aura del usuario autenticado, vía OAuth del propio issuer de Supabase.

### Environment Variables
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (cliente, en `.env`)
- `SUPABASE_SERVICE_ROLE_KEY` (servidor, `client.server.ts` — no configurada en Codespace, solo necesaria para operaciones admin)
- `VITE_SUPABASE_PROJECT_ID` (usado en `mcp/index.ts` para construir el issuer de OAuth)

---

## Theme & Brand

Paleta actual: morado/violeta con gradientes hacia azul-violeta (oklch, tonos ~300°/~255°). **Nota pendiente**: se parece bastante a la paleta "Urban Night" de VibeRadar (#1F1A23/#9947EB/#7575F0) — coincidencia de tendencia, no copia. Cambio de paleta recomendado pero no aplicado (congelación estética activa) — ver PENDIENTES en aurafarm_session.md.
