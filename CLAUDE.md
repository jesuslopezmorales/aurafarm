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
8. Los cambios hechos en el editor SQL de Lovable no quedan en git; documentarlos siempre en `aurafarm_session.md`.
9. `src/routeTree.gen.ts` se versiona y se regenera arrancando `npm run dev`; comprobar con `npx tsc --noEmit` antes de commitear.
10. Al pegar código con etiquetas `<a href>` en VS Code el portapapeles puede perder la etiqueta: verificar el diff antes de guardar.

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
- **Auth**: email/contraseña funcional y verificado en ambos dominios (Vercel/getaurafarmapp.com y Lovable/aura-sync-playground.lovable.app). **Google OAuth bypass del broker de Lovable completado el 17.09.26**: `auth.tsx` llama directamente a `supabase.auth.signInWithOAuth()` (import de lovable eliminado); credenciales OAuth propias creadas en Google Cloud Console (proyecto "AuraFarm", id `aurafarm-508811`, cliente "AuraFarm Web") e introducidas en Cloud → Users → Authentication → Google → "Your own credentials" del editor de Lovable. Authorized redirect URI en Google Cloud Console: `https://ybvcomzflnoezonipbde.supabase.co/auth/v1/callback` (URL nativa de GoTrue/Supabase — no el dominio proxy *.lovable.cloud) + las URIs del broker de Lovable (`oauth.lovable.app/callback` y `aura-sync-playground.lovable.app/~oauth/callback`). Verificado en local (localhost:8080) y en producción (getaurafarmapp.com — 18.09.26). Nota histórica: el broker `@lovable.dev/cloud-auth-js` redirige a rutas `/~oauth/initiate`, `/~oauth/callback` que solo existen en dominios servidos por la infraestructura de Lovable — falla con 404 en Vercel y cualquier hosting externo.
- **Variables de entorno (Codespace/local)**: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en `.env` (gitignored). Si faltan en un Codespace nuevo, recuperarlas inspeccionando la pestaña Network del navegador en una vista previa de Lovable que sí funcione (URL de la petición = SUPABASE_URL, cabecera `apikey` = publishable key).
- **Dominio**: getaurafarmapp.com (Squarespace) — DNS de hosting web configurado y funcional (Vercel) desde el 15.09.26. Email corporativo vía Zoho Mail sigue en el mismo dominio, registros MX/TXT intactos y sin relación con los registros de hosting.
- **Stripe**: **modo Live activo desde 18.09.26**. Webhook Live (`aurafarm-stripe-webhook-live`) apuntando a `https://www.getaurafarmapp.com/api/public/stripe-webhook` (con `www` obligatorio — Vercel emite 308 en el apex que Stripe no sigue). `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` configurados en Vercel (Production). Price IDs Live: Aura Pass `price_1UGfIzE832UCdFMQYMTjjRhk`, Aura Master `price_1UGfItE832UCdFMQ4E2bNUnL`. El webhook de modo Test (`aurafarm-stripe-webhook`, `we_1UDN4BCce8fDVXouWxBMkRZV`) apuntaba a `*.lovable.app` y queda obsoleto para producción. `stripe-checkout.functions.ts` usa el cliente `supabase` autenticado del usuario (no `supabaseAdmin`) para leer/escribir `profiles.stripe_customer_id` — esto evita la dependencia de `SUPABASE_SERVICE_ROLE_KEY`, que es inaccesible fuera de Lovable. `SUPABASE_SERVICE_ROLE_KEY` tampoco está disponible en Vercel: no usar `supabaseAdmin` en producción bajo ningún flujo. `stripe-webhook.ts` (commit 442df8d, 21.09.26) sigue el mismo patrón — llama a la RPC `apply_stripe_pass` (Postgres, `SECURITY DEFINER`, protegida con el secreto compartido `STRIPE_RPC_SECRET` en Vercel Production) en vez de tocar `profiles` directamente. Esa RPC quedó versionada el 23.09.26 en `drizzle/migrations/manual/0001_apply_stripe_pass.sql` (secreto real sustituido por `REEMPLAZA_CON_EL_SECRETO`). Portal de clientes (`src/lib/stripe-portal.functions.ts`, `createPortalSession`, mismo patrón sin `supabaseAdmin`) completado el 23.09.26, con botón "Gestionar suscripción" en `aura-pass.tsx` visible solo si `multiplier > 1`. Pendiente: verificar end-to-end con un pago real (bloquea también la verificación del portal y del sistema de referidos).

**Estado general al 23.09.26** (ver `aurafarm_session.md` para detalle completo): completados — checkout verificado en producción sin pago, portal de clientes, versionado del SQL de `apply_stripe_pass`, y la implementación (no la verificación) del sistema de referidos (`profiles.referral_code`/`referred_by_code`/`pass_expires_at`, tabla `referrals`, RPCs `get_or_create_referral_code`/`apply_referral_code`/`complete_referral_if_pending`/`get_my_referrals`/`get_pending_stripe_coupons`/`mark_referral_stripe_rewarded`, migraciones `drizzle/migrations/manual/0002-0004`, sección "Promociona" en `perfil.tsx`). Pendientes: flujo de reporte de contenido (bloqueado por el hallazgo del feed no persistido, ver abajo), fiscalidad de suscripciones (consulta enviada a indieprof.com, sin respuesta), verificación end-to-end del sistema de referidos y del portal de clientes (ambas requieren una suscripción de pago real), y la prueba de pago real en sí. **Hallazgo crítico sin resolver, bloqueante antes de usuarios reales**: el feed de posts en `aura-store.tsx` no usa las tablas reales `aura_posts`/`post_votes` — `initialPosts` es un array mock y `addPost` solo modifica estado en memoria.
- **Esquema de base de datos ya existente**: `profiles` (id, display_name, handle, aura, streak, multiplier, pass_active, avatar_url, bio, stripe_customer_id, latitude, longitude). RLS de `profiles` restringido a `auth.uid() = id` (corregido 09.09.26 — antes cualquier usuario autenticado podía leer todas las filas, incluido `stripe_customer_id`); datos públicos (display_name, handle, aura, streak, multiplier, avatar_url, bio) expuestos solo vía una vista separada con `SECURITY INVOKER` (corregida el mismo día, estaba con `SECURITY DEFINER`, crítico). `aura_posts`, `post_votes`, `habits`, `habit_logs`, `aura_zones` (x/y son posiciones decorativas 0-100 para el mapa SVG, NO coordenadas GPS; latitude/longitude se usan únicamente para el cálculo de Haversine del check-in, implementado y verificado el 15.09.26 con radio dinámico 1-50km por `kind` de zona), `zone_checkins`. Vista `post_vote_counts` (agregada, `SECURITY INVOKER`, creada el 18.09.26): expone `(post_id, votes_real, votes_cap)` sin revelar identidad del votante — usada por `list-aura-feed.ts` del MCP. Warnings de seguridad resueltos el 18.09.26: `aura_posts` con política `FOR UPDATE USING (false)` ("Posts are immutable", lectura pública intencional conservada); `post_votes` SELECT restringida al propio voto, conteos expuestos vía `post_vote_counts`; `toggle_habit` EXECUTE revocado de anon/PUBLIC (solo `authenticated`, cambio no versionado en git). 2 warnings descartados: SECURITY DEFINER de `toggle_habit` (intencional — necesita privilegios elevados para escribir `profiles.aura`) y "profiles restricted access" (marcado "Not a vulnerability" por Lovable).
- **RPC `toggle_habit`**: creada directamente vía el SQL editor de Lovable, NO aparece en `types.ts` auto-generado — `aura-store.tsx` la llama con cast local estrecho (`ToggleHabitClient`). Tiene `SECURITY DEFINER` (necesario para escribir `profiles.aura` con privilegios elevados — intencional y auditado). `EXECUTE` revocado de `anon`/`PUBLIC` el 18.09.26 (solo `authenticated`); cambio no versionado en git (SQL editor de Lovable). Patrón a repetir si Lovable crea más objetos fuera del flujo de chat: el `types.ts` no los conocerá y habrá que tipar la llamada localmente.
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
- **Legal**: `src/lib/legal-info.ts` es la fuente única de datos del titular (nombre, NIF, dirección, emails de contacto/reportes) consumida por `src/routes/privacidad.tsx` y `src/routes/terminos.tsx` vía `src/components/LegalLayout.tsx`.

### Environment Variables
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (cliente, en `.env` local/Codespace, y en Vercel)
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (servidor, mismo valor que las VITE_* sin prefijo — en Vercel desde 18.09.26, necesarias para server functions de Stripe)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (servidor, en Vercel desde 18.09.26 — modo Live)
- `SUPABASE_SERVICE_ROLE_KEY` (servidor, `client.server.ts` — inaccesible fuera de Lovable, nunca configurada en Vercel ni Codespace)
- `VITE_SUPABASE_PROJECT_ID` (usado en `mcp/index.ts` para construir el issuer de OAuth)

---

## Theme & Brand

Paleta de la UI: morado/violeta con gradientes hacia azul-violeta (oklch, ~300°/~255°). Se parece a la paleta "Urban Night" de VibeRadar (#1F1A23/#9947EB/#7575F0) — coincidencia de tendencia, no copia. Cambio de paleta de UI recomendado pero no aplicado (congelación estética activa).
Logo: hexágono facetado SVG inline (`src/components/AuraFarmLogo.tsx`), 4 polígonos en paleta cálida ámbar/coral/magenta (#ffa931, #fe874d, #ff6951, #ff3c76) — intencionalmente distinta de VibeRadar. OG image en `public/og-image.png` (1200×630), URL absoluta de producción hardcodeada en `__root.tsx`. Nota: `public/icon-512-maskable.png` referenciado en `manifest.webmanifest` pero pendiente de crear y commitear.