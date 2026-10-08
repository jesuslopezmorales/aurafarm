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
- `src/integrations/supabase/types.ts`, `client.ts` (excepción documentada: `flowType: 'pkce'` añadido a mano el 08.10.26, commit 2584a35 — el repo no se sincroniza con Lovable, así que el cambio no se pierde; no tocar nada más), `client.server.ts`, `auth-attacher.ts`, `auth-middleware.ts`, `cron-auth.ts`, `previewAuthStorage.ts`
- `src/integrations/lovable/index.ts` — broker de OAuth (`@lovable.dev/cloud-auth-js`); el bypass para Google en dominio propio ya se realizó en `auth.tsx` (17.09.26: llamada directa a `supabase.auth.signInWithOAuth()`, import de lovable eliminado), no en este archivo

---

## Notas de infraestructura críticas

- **Backend**: Lovable Cloud (Supabase gestionado por Lovable, proxy propio en dominio *.lovable.cloud, no *.supabase.co). Sin dashboard de supabase.com. Sin acceso SQL directo salvo plan Enterprise de Lovable (LOVABLE_DB_MIGRATION_URL, en "Secretos de compilación").
- **Hosting de producción del frontend real**: Vercel (proyecto "aurafarm", plan gratuito), conectado directamente al repo de GitHub (jesuslopezmorales/aurafarm) — deploy automático en cada push a main. Variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) configuradas en Vercel → Environment Variables, no se leen del `.env` del repo (gitignored, solo existe localmente/Codespace). Dominio: getaurafarmapp.com y www.getaurafarmapp.com, DNS en Squarespace apuntando a Vercel (A @ → 216.198.79.1, CNAME www → el valor exacto que indique el panel de Vercel, no el preset legacy automático de Squarespace). El proyecto de Lovable (editor propio, aura-sync-playground.lovable.app) mantiene una copia de frontend independiente y desactualizada desde el rebrand — se usa únicamente como backend (Supabase/Lovable Cloud) y como panel de administración de Auth/Database/Edge Functions, nunca como fuente del frontend de producción.
- **Cambios de esquema de base de datos** (columnas o tablas nuevas) solo vía chat de IA de Lovable — consumen créditos. Dividir siempre cualquier objetivo en "parte sin coste" (usa el esquema ya existente) y "parte bloqueada" (requiere créditos).
- **Auth**: email/contraseña funcional y verificado en ambos dominios (Vercel/getaurafarmapp.com y Lovable/aura-sync-playground.lovable.app). **Google OAuth bypass del broker de Lovable completado el 17.09.26**: `auth.tsx` llama directamente a `supabase.auth.signInWithOAuth()` (import de lovable eliminado); credenciales OAuth propias creadas en Google Cloud Console (proyecto "AuraFarm", id `aurafarm-508811`, cliente "AuraFarm Web") e introducidas en Cloud → Users → Authentication → Google → "Your own credentials" del editor de Lovable. Authorized redirect URI en Google Cloud Console: `https://ybvcomzflnoezonipbde.supabase.co/auth/v1/callback` (URL nativa de GoTrue/Supabase — no el dominio proxy *.lovable.cloud) + las URIs del broker de Lovable (`oauth.lovable.app/callback` y `aura-sync-playground.lovable.app/~oauth/callback`). Verificado en local (localhost:8080) y en producción (getaurafarmapp.com — 18.09.26). **Flujo PKCE desde el 08.10.26** (`flowType: 'pkce'` en `client.ts`): el retorno de Google llega con `?code=` y ya no deja `access_token`/`refresh_token` en el hash ni en el historial. Efecto colateral: el enlace de confirmación de email solo inicia sesión automáticamente en el mismo navegador donde se hizo el registro. El login no funciona desde la URL `*.app.github.dev` del Codespace (no está en Redirect URLs de Lovable Cloud) — probar login en producción. Nota histórica: el broker `@lovable.dev/cloud-auth-js` redirige a rutas `/~oauth/initiate`, `/~oauth/callback` que solo existen en dominios servidos por la infraestructura de Lovable — falla con 404 en Vercel y cualquier hosting externo.
- **Variables de entorno (Codespace/local)**: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en `.env` (gitignored). Si faltan en un Codespace nuevo, recuperarlas inspeccionando la pestaña Network del navegador en una vista previa de Lovable que sí funcione (URL de la petición = SUPABASE_URL, cabecera `apikey` = publishable key).
- **Dominio**: getaurafarmapp.com (Squarespace) — DNS de hosting web configurado y funcional (Vercel) desde el 15.09.26. Email corporativo vía Zoho Mail sigue en el mismo dominio, registros MX/TXT intactos y sin relación con los registros de hosting.
- **Stripe**: **modo Live activo desde 18.09.26**. Webhook Live (`aurafarm-stripe-webhook-live`) apuntando a `https://www.getaurafarmapp.com/api/public/stripe-webhook` (con `www` obligatorio — Vercel emite 308 en el apex que Stripe no sigue). `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` configurados en Vercel (Production). Price IDs Live: Aura Pass `price_1UGfIzE832UCdFMQYMTjjRhk`, Aura Master `price_1UGfItE832UCdFMQ4E2bNUnL`. El webhook de modo Test (`aurafarm-stripe-webhook`, `we_1UDN4BCce8fDVXouWxBMkRZV`) apuntaba a `*.lovable.app` y queda obsoleto para producción. `stripe-checkout.functions.ts` usa el cliente `supabase` autenticado del usuario (no `supabaseAdmin`) para leer/escribir `profiles.stripe_customer_id` — esto evita la dependencia de `SUPABASE_SERVICE_ROLE_KEY`, que es inaccesible fuera de Lovable. `SUPABASE_SERVICE_ROLE_KEY` tampoco está disponible en Vercel: no usar `supabaseAdmin` en producción bajo ningún flujo. `stripe-webhook.ts` (commit 442df8d, 21.09.26) sigue el mismo patrón — llama a la RPC `apply_stripe_pass` (Postgres, `SECURITY DEFINER`, protegida con el secreto compartido `STRIPE_RPC_SECRET` en Vercel Production) en vez de tocar `profiles` directamente. Esa RPC quedó versionada el 23.09.26 en `drizzle/migrations/manual/0001_apply_stripe_pass.sql` (secreto real sustituido por `REEMPLAZA_CON_EL_SECRETO`). Portal de clientes (`src/lib/stripe-portal.functions.ts`, `createPortalSession`, mismo patrón sin `supabaseAdmin`) completado el 23.09.26, con botón "Gestionar suscripción" en `aura-pass.tsx` visible solo si `multiplier > 1`. Pago real, portal y referidos verificados end-to-end en producción el 24.09.26. Ojo: `multiplier > 1` también es cierto con el pass gratis de referido (sin cliente Stripe → `NO_STRIPE_CUSTOMER`), pendiente de corregir.

**Estado general al 08.10.26** (ver `aurafarm_session.md` para detalle completo): completados y verificados en producción — pago real de Aura Pass, portal de clientes y sistema de referidos end-to-end (24.09.26); feed persistido en `aura_posts`/`post_votes` vía RPCs `get_feed`/`create_post`/`set_post_vote` (24.09.26, migración 0005); reportes de contenido, expiración del pass gratis de referidos, PKCE, racha real, estadísticas reales del Perfil y handles únicos (08.10.26, migraciones 0006-0010). **Bloqueante antes de facturar de verdad**: fiscalidad de las suscripciones (indieprof.com respondió que no gestiona suscripciones recurrentes; alta y OSS de IVA sin resolver; Stripe Tax desactivado). Pendientes no bloqueantes principales: herramientas MCP desalineadas con las RPCs de servidor (`list-aura-feed` muestra posts ocultos, `log_aura_action` salta `create_post` y suma `streak` +1, `log_habit` salta `toggle_habit`), `set_post_vote` permite votar posts ocultos, botón "Gestionar suscripción" visible también con pass gratis de referido sin cliente Stripe, 12 vulnerabilidades de `npm audit`.
- **Esquema de base de datos ya existente**: `profiles` (id, display_name, handle, aura, streak, multiplier, pass_active, avatar_url, bio, stripe_customer_id, latitude, longitude). RLS de `profiles` restringido a `auth.uid() = id` (corregido 09.09.26 — antes cualquier usuario autenticado podía leer todas las filas, incluido `stripe_customer_id`); datos públicos (display_name, handle, aura, streak, multiplier, avatar_url, bio) expuestos solo vía una vista separada con `SECURITY INVOKER` (corregida el mismo día, estaba con `SECURITY DEFINER`, crítico). `aura_posts` (con `hidden_at`: post oculto por reportes, no se borra), `post_votes`, `post_reports` (un reporte por usuario y post, RLS solo SELECT propio), `habits`, `habit_logs`, `aura_zones` (x/y son posiciones decorativas 0-100 para el mapa SVG, NO coordenadas GPS; latitude/longitude se usan únicamente para el cálculo de Haversine del check-in, implementado y verificado el 15.09.26 con radio dinámico 1-50km por `kind` de zona), `zone_checkins`. Vista `post_vote_counts` (agregada, `SECURITY INVOKER`, creada el 18.09.26): expone `(post_id, votes_real, votes_cap)` sin revelar identidad del votante — usada por `list-aura-feed.ts` del MCP. Warnings de seguridad resueltos el 18.09.26: `aura_posts` con política `FOR UPDATE USING (false)` ("Posts are immutable", lectura pública intencional conservada); `post_votes` SELECT restringida al propio voto, conteos expuestos vía `post_vote_counts`; `toggle_habit` EXECUTE revocado de anon/PUBLIC (solo `authenticated`, cambio no versionado en git). 2 warnings descartados: SECURITY DEFINER de `toggle_habit` (intencional — necesita privilegios elevados para escribir `profiles.aura`) y "profiles restricted access" (marcado "Not a vulnerability" por Lovable).
- **Migraciones manuales** (`drizzle/migrations/manual/`, ejecutadas a mano en el SQL editor de Lovable Cloud, versionadas solo como registro): 0001 `apply_stripe_pass`; 0002-0004 referidos; 0005 feed persistido (`get_feed`, `create_post` con límite de 3 pruebas/día sin pass, `set_post_vote`); 0006 `post_reports` + `report_post` (`SECURITY DEFINER`, umbral de 3 reportes: oculta el post y resta al autor los puntos positivos ganados; `get_feed` excluye ocultos y ya reportados por el usuario); 0007 expiración del pass gratis de referidos (`expire_free_passes()`, sin permisos para clientes; `apply_stripe_pass` limpia `pass_expires_at`); 0008 racha (`compute_streak` interna, `toggle_habit` devuelve `(new_aura, new_streak)` y recalcula `profiles.streak`, `refresh_my_streak(p_today)` al cargar el perfil; racha = días consecutivos con al menos un hábito `kind` habit, viva si el último es hoy o ayer); 0009 `get_my_stats(p_today)` → `week_aura` (desde el lunes, hora Madrid, con el multiplicador actual — aproximado si cambió en la semana) y `proofs_count`; 0010 trigger `ensure_unique_handle` (normaliza, genera `aura`+8 caracteres del id si viene vacío o "aura", sufijo ante colisión) + índice único sobre `lower(handle)`. Para parchear una función desplegada que contiene secretos (p. ej. `apply_stripe_pass`), partir de `pg_get_functiondef` en vez del SQL versionado.
- **pg_cron** activado (08.10.26): job `expire-free-passes` cada hora en el minuto 7 (llama a `expire_free_passes()`); ejecuciones visibles en `cron.job_run_details`.
- **RPC `toggle_habit`**: creada directamente vía el SQL editor de Lovable, NO aparece en `types.ts` auto-generado — `aura-store.tsx` la llama con cast local estrecho (`ToggleHabitClient`). Tiene `SECURITY DEFINER` (necesario para escribir `profiles.aura` con privilegios elevados — intencional y auditado). `EXECUTE` revocado de `anon`/`PUBLIC` el 18.09.26 (solo `authenticated`); cambio no versionado en git (SQL editor de Lovable). Patrón a repetir si Lovable crea más objetos fuera del flujo de chat: el `types.ts` no los conocerá y habrá que tipar la llamada localmente.
- **GitHub Codespaces**: acceso recuperado el 08.10.26 (codespace "opulent lamp", carpeta `/workspaces/aurasync` por el nombre antiguo del repo; `.env` idéntico al local). Cuota gratuita de 120 core-hours/mes — vigilar el consumo (se agotó el 15.09.26). Alternativas: clon local de Windows (`D:\_JLM_\Proyectos\aurafarm`, hacer `git pull` + `npm install` al volver a usarlo) o github.dev (sin terminal, solo ediciones puntuales).

---

## Architecture Overview

**AuraFarm** — PWA de desarrollo personal gamificado: pruebas de Aura, rangos, rachas, hábitos/deslices, zonas con multiplicador, Aura Pass.

### Stack
- **TanStack Start** (React 19) sobre Vite 8 — versiones fijadas sin `^` desde el 08.10.26 (CVE-2026-102989 bloqueaba el build en Vercel): `@tanstack/react-start` 1.168.60, `@tanstack/react-router` 1.170.41 (versión exacta que exige react-start), `@tanstack/router-plugin` 1.168.42. No ejecutar `npm audit fix --force`.
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