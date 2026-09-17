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
6. **Rango geoespacial dinámico de 1 a 50 km** en la validación de proximidad de Zonas (Objetivo 4, Parte B) — implementado con Haversine en checkInZone, nunca radio fijo.
7. Antes de dar una tarea por completada, comprobar `git status` — no asumir que algo implementado ya está commiteado.

---

## Archivos permanentemente off-limits (nunca modificar directamente)

Marcados como auto-generados en su propia cabecera — cualquier cambio debe hacerse vía el chat de Lovable, no editando estos archivos a mano:
- `drizzle/schema.ts` (auto-generado y dejado en blanco intencionadamente)
- `drizzle/migrations/*` (incluye 0000_aurasync_core_schema.sql — el nombre NO se actualizó a "aurafarm" en el rebrand a propósito, coincide con el tag interno de Drizzle)
- `src/integrations/supabase/types.ts`, `client.ts`, `client.server.ts`, `auth-attacher.ts`, `auth-middleware.ts`, `cron-auth.ts`, `previewAuthStorage.ts`
- `src/integrations/lovable/index.ts` — broker de OAuth (`@lovable.dev/cloud-auth-js`); el bypass para Google en dominio propio ya se realizó en `auth.tsx` (17.09.26: llamada directa a `supabase.auth.signInWithOAuth()`, import de lovable eliminado), no en este archivo

---

## Notas de infraestructura críticas

- **Backend**: Lovable Cloud (Supabase gestionado por Lovable, proxy propio en dominio *.lovable.cloud, no *.supabase.co). Sin dashboard de supabase.com. Sin acceso SQL directo salvo plan Enterprise de Lovable (LOVABLE_DB_MIGRATION_URL, en "Secretos de compilación").
- **Hosting de producción del frontend real**: Vercel (proyecto "aurafarm", plan gratuito), conectado directamente al repo de GitHub (jesuslopezmorales/aurafarm) — deploy automático en cada push a main. Variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) configuradas en Vercel → Environment Variables, no se leen del `.env` del repo (gitignored, solo existe localmente/Codespace). Dominio: getaurafarmapp.com y www.getaurafarmapp.com, DNS en Squarespace apuntando a Vercel (A @ → 216.198.79.1, CNAME www → el valor exacto que indique el panel de Vercel, no el preset legacy automático de Squarespace). El proyecto de Lovable (editor propio, aura-sync-playground.lovable.app) mantiene una copia de frontend independiente y desactualizada desde el rebrand — se usa únicamente como backend (Supabase/Lovable Cloud) y como panel de administración de Auth/Database/Edge Functions, nunca como fuente del frontend de producción.
- **Cambios de esquema de base de datos** (columnas o tablas nuevas) solo vía chat de IA de Lovable — consumen créditos. Dividir siempre cualquier objetivo en "parte sin coste" (usa el esquema ya existente) y "parte bloqueada" (requiere créditos).
- **Auth**: email/contraseña funcional y verificado en ambos dominios (Vercel/getaurafarmapp.com y Lovable/aura-sync-playground.lovable.app). **Google OAuth bypass del broker de Lovable completado el 17.09.26**: `auth.tsx` llama directamente a `supabase.auth.signInWithOAuth()` (import de lovable eliminado); credenciales OAuth propias creadas en Google Cloud Console (proyecto "AuraFarm", id `aurafarm-508811`, cliente "AuraFarm Web") e introducidas en Cloud → Users → Authentication → Google → "Your own credentials" del editor de Lovable. Authorized redirect URI en Google Cloud Console: `https://ybvcomzflnoezonipbde.supabase.co/auth/v1/callback` (URL nativa de GoTrue/Supabase — no el dominio proxy *.lovable.cloud) + las URIs del broker de Lovable (`oauth.lovable.app/callback` y `aura-sync-playground.lovable.app/~oauth/callback`). Verificado en local (localhost:8080) — **pendiente de verificar en producción (getaurafarmapp.com)**. Nota histórica: el broker `@lovable.dev/cloud-auth-js` redirige a rutas `/~oauth/initiate`, `/~oauth/callback` que solo existen en dominios servidos por la infraestructura de Lovable — falla con 404 en Vercel y cualquier hosting externo.
- **Variables de entorno (Codespace/local)**: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en `.env` (gitignored). Si faltan en un Codespace nuevo, recuperarlas inspeccionando la pestaña Network del navegador en una vista previa de Lovable que sí funcione (URL de la petición = SUPABASE_URL, cabecera `apikey` = publishable key).
- **Dominio**: getaurafarmapp.com (Squarespace) — DNS de hosting web configurado y funcional (Vercel) desde el 15.09.26. Email corporativo vía Zoho Mail sigue en el mismo dominio, registros MX/TXT intactos y sin relación con los registros de hosting.
- **Stripe**: modo test. El webhook apunta a la URL de publicación de Lovable (`*.lovable.app`), no a la de preview del editor — si el proyecto nunca se ha publicado, el webhook devuelve 404 aunque todo lo demás esté bien configurado. Publicar no es automático tras cambios en el editor de Lovable: hay que republicar explícitamente. **Pendiente de decidir**: ahora que el frontend de producción real vive en Vercel/getaurafarmapp.com y no en el dominio publicado de Lovable, revisar si el webhook debe seguir apuntando a *.lovable.app o si el checkout/webhook debe reconfigurarse para el dominio real. La sesión de Supabase Auth no se comparte entre el preview del editor y el sitio publicado (dominios distintos).
- **Esquema de base de datos ya existente**: `profiles` (id, display_name, handle, aura, streak, multiplier, pass_active, avatar_url, bio, stripe_customer_id, latitude, longitude). RLS de `profiles` restringido a `auth.uid() = id` (corregido 09.09.26 — antes cualquier usuario autenticado podía leer todas las filas, incluido `stripe_customer_id`); datos públicos (display_name, handle, aura, streak, multiplier, avatar_url, bio) expuestos solo vía una vista separada con `SECURITY INVOKER` (corregida el mismo día, estaba con `SECURITY DEFINER`, crítico). `aura_posts`, `post_votes`, `habits`, `habit_logs`, `aura_zones` (x/y son posiciones decorativas 0-100 para el mapa SVG, NO coordenadas GPS; latitude/longitude se usan únicamente para el cálculo de Haversine del check-in, implementado y verificado el 15.09.26 con radio dinámico 1-50km por `kind` de zona), `zone_checkins`. Warnings de seguridad preexistentes aún sin corregir (fuera de alcance): posts legibles por cualquier usuario autenticado, datos de zonas legibles por usuarios anónimos, votos legibles por cualquier usuario autenticado.
- **RPC `toggle_habit`**: creada directamente vía el SQL editor de Lovable (no vía chat de migración normal), por lo que NO aparece en el `types.ts` auto-generado. `aura-store.tsx` la llama con un cast local estrecho (`ToggleHabitClient`) en vez de tipar `supabase` de forma más laxa globalmente. Patrón a repetir si Lovable crea más objetos de base de datos fuera del flujo de chat: el `types.ts` no los conocerá y habrá que tipar la llamada localmente.
- **GitHub Codespaces**: cuota gratuita (120 core-hours/mes) agotada al 100% el 15.09.26, resetea el 01.10.26. Hasta entonces: desarrollo local (clonar el repo, `npm i`, `npm run dev`) o github.dev (pulsar `.` en la página del repo — editor completo con commit/push vía Source Control, pero sin terminal: no sirve para `npm run dev` ni `npx tsc --noEmit`, solo para ediciones de texto puntuales).

---

## Architecture Overview

**AuraFarm** — PWA de desarrollo personal gamificado: pruebas de Aura, rangos, rachas, hábitos/deslices, zonas con multiplicador, Aura Pass.

### Stack
- **TanStack Start** (React 19) sobre Vite 8
- **Supabase JS** (`@supabase/supabase-js`) contra Lovable Cloud
- **Tailwind CSS v4** + Shadcn UI (Radix)
- **lucide-react** para iconos
- **sonner** para toasts
- **@lovable.dev/cloud-auth-js**: broker de OAuth propio de Lovable (auto-generado, no editar) — solo funciona en dominios servidos por Lovable, ver Notas de infraestructura

### Key Data Flows
- **Estado global**: `src/lib/aura-store.tsx` (AuraProvider/useAura) — se suscribe a `supabase.auth.onAuthStateChange`; con sesión activa carga profiles/habits/habit_logs/aura_zones/zone_checkins (del día) reales, sin sesión mantiene datos de ejemplo en memoria (comportamiento de invitado, no roto). Expone `checkedInZoneIds`, `isAuthenticated` y `signOut()`.
- **Auth**: `src/routes/auth.tsx` — email/contraseña directo contra `supabase.auth`, Google vía `supabase.auth.signInWithOAuth()` directo (bypass del broker de Lovable completado el 17.09.26 — commit 791401c). `src/routes/perfil.tsx` incluye botón "Cerrar sesión" (llama a `signOut()` del store).
- **Zonas**: `src/routes/zonas.tsx` — captura `navigator.geolocation` real y la pasa a `checkInZone(zoneId, coords)`; el store valida con Haversine contra `aura_zones.latitude/longitude` y un radio dinámico por `kind` (Evento=1km, Patrocinado=5km, Zona salvaje=50km) antes de insertar en `zone_checkins`. La UI deshabilita y marca visualmente (icono Check) las zonas con check-in ya hecho hoy.
- **MCP server**: `src/lib/mcp/` — expone herramientas (get_aura_profile, list_aura_feed, log_aura_action, list_habits, log_habit, list_aura_zones) para que asistentes de IA externos (ChatGPT, Claude, Cursor) consulten/modifiquen el Aura del usuario autenticado, vía OAuth del propio issuer de Supabase. Endpoint en producción: `https://www.getaurafarmapp.com/mcp`.

### Environment Variables
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (cliente, en `.env` local/Codespace, y en Environment Variables de Vercel para producción)
- `SUPABASE_SERVICE_ROLE_KEY` (servidor, `client.server.ts` — no configurada en Codespace ni en Vercel, solo necesaria para operaciones admin, inaccesible fuera de Lovable)
- `VITE_SUPABASE_PROJECT_ID` (usado en `mcp/index.ts` para construir el issuer de OAuth)

---

## Theme & Brand

Paleta actual: morado/violeta con gradientes hacia azul-violeta (oklch, tonos ~300°/~255°). **Nota pendiente**: se parece bastante a la paleta "Urban Night" de VibeRadar (#1F1A23/#9947EB/#7575F0) — coincidencia de tendencia, no copia. Cambio de paleta recomendado pero no aplicado (congelación estética activa) — ver PENDIENTES en aurafarm_session.md.