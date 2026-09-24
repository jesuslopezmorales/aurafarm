# AuraFarm — Session State
_Última actualización: 24.09.26_

---

## Stack
TanStack Start (React 19) · TypeScript · Tailwind CSS v4 · Supabase JS (vía Lovable Cloud, backend gestionado — sin dashboard directo en supabase.com) · Vite 8 · Shadcn UI (Radix) · lucide-react · Stripe (checkout + webhooks de suscripción).
Repo: jesuslopezmorales/aurafarm. Codespace: /workspaces/aurasync (nombre de carpeta heredado, el repo y el proyecto ya se llaman aurafarm) — **cuota mensual de Codespaces agotada al 100% el 15.09.26, resetea el 01.10.26; hasta entonces, desarrollo local o github.dev (sin terminal)**.
Hosting de producción del frontend real: **Vercel** (proyecto "aurafarm", plan gratuito), no Lovable Hosting (requiere plan Pro 25€/mes). Dominio: getaurafarmapp.com / www.getaurafarmapp.com (Squarespace, DNS apuntando a Vercel desde 15.09.26; email corporativo vía Zoho Mail sigue en el mismo dominio, registros MX/TXT intactos).

**PASO 0 OBLIGATORIO — antes de cualquier acción:**
npx repomix --output "repomix-focused-$(date +%d.%m.%y)_1.xml" --include "src/**/*.ts,src/**/*.tsx"
Adjuntar XML a Claude Chat antes de tocar código.

---

## ⚠️ ARQUITECTURA CRÍTICA — LEER ANTES DE TOCAR CÓDIGO

**Lovable NO sincroniza con el repo de GitHub.** Se probó conectar Git nativo de Lovable (Configuración → Git → GitHub) y Lovable indica explícitamente: "connecting creates a new repository for this project — importing an existing repo isn't supported". Por tanto:

- El **frontend** (componentes .tsx) vive en DOS copias independientes que no se sincronizan solas: 1) el repo real (jesuslopezmorales/aurafarm, editado desde el Codespace, **desplegado en producción vía Vercel en getaurafarmapp.com**) — esta es la fuente de verdad del frontend y lo que ven los usuarios reales; 2) el proyecto interno de Lovable (editor propio, publicado en aura-sync-playground.lovable.app) — desactualizado respecto al repo real desde el rebrand a AuraFarm, solo se actualiza si se le pide explícitamente por su chat.
- El **backend** (Supabase/Lovable Cloud: tablas, columnas, Edge Functions, secretos, configuración de Auth) es único y compartido — cualquier cambio de esquema, backend o Auth se hace vía el chat/panel de Lovable, y aplica sea cual sea el frontend usado (Vercel o Lovable).
- Tras cualquier cambio de esquema o backend pedido a Lovable, hay que sincronizar manualmente al Codespace/repo: copiar types.ts y los archivos de backend nuevos desde el panel de código de Lovable (panel derecho, buscador de archivos) y pegarlos — git pull NO trae estos cambios porque Lovable no hace push al repo real.
- **Secretos con dos niveles de acceso:** VITE_* (cliente) y su equivalente sin prefijo (servidor) deben estar AMBOS en .env del Codespace si se quiere probar desde ahí. En Vercel (Production) están configuradas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (cliente), `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (servidor, mismo valor sin prefijo), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (añadidas el 18.09.26). `SUPABASE_SERVICE_ROLE_KEY` NUNCA es accesible fuera de Lovable — confirmado explícitamente el 08.09.26.
- **Broker de auth de Lovable (@lovable.dev/cloud-auth-js, src/integrations/lovable/index.ts) solo funciona en dominios servidos por la infraestructura de Lovable** (published *.lovable.app, o un dominio custom conectado a través de Lovable, que requiere plan Pro). Redirige a rutas propias (/~oauth/initiate, /~oauth/callback) que no existen fuera de ese hosting — en Vercel devuelven 404. Detalle completo en PENDIENTES.

---

## ✅ TAREAS COMPLETADAS

### Sesión 08.09.26 (segunda sesión)
- Objetivo 3, Parte B — COMPLETADO: columnas avatar_url y bio añadidas a profiles vía chat de Lovable (migración add_profile_avatar_bio). aura-store.tsx: campos avatarUrl/bio en el store, funciones updateAvatarUrl/updateBio (mismo patrón que updateDisplayName). perfil.tsx: edición inline de avatar (URL de imagen) y bio, congelación estética respetada. types.ts sincronizado manualmente vía copia desde panel de código de Lovable (editor VS Code, no terminal — el pegado por terminal truncó el archivo la primera vez, 123 errores de sintaxis; corregido pegando en el editor).
- Objetivo 4, Parte B — marcado como completado en esta sesión (INCORRECTO, ver sesión 11.09.26 y 15.09.26): columnas latitude/longitude añadidas a aura_zones vía chat de Lovable (migración add_zone_coordinates). El checkInZone real con Haversine NO llegó a implementarse pese a documentarse aquí como hecho.
- Objetivo 5 — Stripe/Aura Pass, backend COMPLETADO, frontend Codespace completado, PENDIENTE DE PROBAR: cuenta Stripe creada con admin@getaurafarmapp.com, modo test, live NO activado. Producto "Aura Pass" 6,99€/mes, price_id = price_1UDMkCCce8fDVXouqcJEhGYn. Backend vía Lovable: create-checkout-session (Stripe Customer vinculado a profiles.stripe_customer_id, sesión Checkout modo subscription) y stripe-webhook (verifica firma, escucha checkout.session.completed/customer.subscription.created/updated/deleted, actualiza profiles.pass_active/multiplier). Migración add_stripe_customer_id_to_profiles aplicada. Webhook configurado (aurafarm-stripe-webhook, ID we_1UDN4BCce8fDVXouWxBMkRZV), 4 eventos. Los 4 archivos de backend copiados manualmente al Codespace y commiteados. aura-pass.tsx actualizado: botón "Activar Aura Pass" llama a createCheckoutSession() real; NPC/Aura Master siguen simulados (explícitamente pospuesto). Prueba end-to-end BLOQUEADA: SUPABASE_SERVICE_ROLE_KEY nunca accesible fuera de Lovable — ningún pago de prueba realizado todavía.
- Rama de git incorrecta detectada y corregida: los 3 commits de la sesión se hicieron sin darse cuenta en rama local TERMINAL (no main); fusionada con git merge TERMINAL desde main y publicada con éxito.
- Infraestructura de email corporativo: Zoho Mail (Forever Free) para getaurafarmapp.com. 5 cuentas: admin@, hello@, reports@, support@, noreply@getaurafarmapp.com. DNS en Squarespace: 3x MX, TXT verificación, TXT SPF fusionado, TXT DKIM. Todo verificado y funcional.

### Sesión 09.09.26 (tercera sesión)
- Objetivo 5 — Stripe/Aura Pass: COMPLETADO Y VERIFICADO DE EXTREMO A EXTREMO. aura-pass.tsx del Codespace confirmado idéntico al de Lovable (solo diferencia cosmética de orden de props, sin impacto). Proyecto publicado por primera vez en Lovable (URL gratuita aura-sync-playground.lovable.app) para poder probar el webhook, que apuntaba a esa URL y devolvía 404 mientras el proyecto no estaba publicado. Pago de prueba realizado con tarjeta 4242 4242 4242 4242, webhook devuelve 200 OK, profiles.pass_active/multiplier se actualizan correctamente en Supabase.
- Bug crítico encontrado y corregido en Lovable: aura-store.tsx nunca consultaba el perfil real del usuario autenticado (la función de carga simplemente no existía en el código) — por eso la app siempre mostraba datos de invitado (8420 Aura, racha 37d, multiplicador x1) sin importar login ni pagos. Corregido por Lovable; verificado en la app publicada: ahora carga el perfil real (100 Aura, 0d racha, NPC, multiplicador x2 con Aura Pass activo).
- Dos hallazgos de seguridad corregidos vía chat de Lovable antes de publicar: (1) política RLS de profiles permitía a cualquier usuario autenticado leer todas las filas de todos los usuarios incluyendo stripe_customer_id — corregida a auth.uid() = id, con una vista pública separada solo para datos no sensibles (display_name, handle, aura, streak, multiplier, avatar_url, bio); (2) esa vista pública quedó creada con SECURITY DEFINER (crítico, se saltaba RLS) — corregida a SECURITY INVOKER.
- Quedan 4 warnings de seguridad preexistentes sin tocar (fuera de alcance de esta sesión): Stripe billing identifiers junto a datos de perfil ampliamente legibles, posts legibles por cualquier usuario autenticado, datos de zonas legibles por usuarios anónimos, votos legibles por cualquier usuario autenticado.

### Sesión 11.09.26 (cuarta sesión)
- Sincronización handle real de perfil en aura-store.tsx (addPost usaba "Tú"/"@tuaura" hardcodeados, ahora usa displayName/handle reales) — commit c417bfc.
- Objetivo 5.1 completado y verificado end-to-end: Aura Master (14,99€/mes, x3), price_id price_1UEQe7Cce8fDVXouLngpzqBo. Backend generalizado: stripe.server.ts (AURA_MASTER_PRICE_ID, PLAN_MULTIPLIERS), stripe-checkout.functions.ts (createCheckoutSession ahora recibe planId: "plus" | "master"), stripe-webhook.ts (multiplicador resuelto dinámicamente por price_id en vez de hardcodeado a 2) — commit 324fa18. Sincronizado y probado en Lovable con pago test, Perfil y Pass reflejan x3 correctamente.
- Objetivo 6 (ruta /conectar) verificado: carga sin error, detecta sesión activa, lista las 6 herramientas MCP. Sin acción necesaria.
- .gitignore verificado: repomix-focused-*.xml y .env correctamente excluidos.
- Bug "lost update" de toggleHabit corregido y verificado en producción: nueva función RPC toggle_habit(p_habit_id, p_done, p_logged_on) creada vía SQL editor de Lovable (update atómico de profiles.aura + habit_logs en una sola transacción de servidor, evita condición de carrera con toggles rápidos). aura-store.tsx actualizado para llamarla vía un cast local (ToggleHabitClient) porque la función no está en types.ts (creada por SQL directo, no por migración de chat, por lo que el types.ts auto-generado no la conoce) — commit 8b6023c. Sincronizado en Lovable, publicado y probado: marcar/desmarcar un hábito varias veces rápido funciona sin pérdida de puntos ni desincronización tras recargar.
- Hallazgo importante: checkInZone (aura-store.tsx) NO implementaba ninguna validación real de distancia (Haversine/radio dinámico 1-50km) pese a que la documentación previa (sesión 08.09.26) daba el Objetivo 4B por completado con esa lógica. Solo validaba que no hubiera check-in duplicado el mismo día. Resuelto en sesión 15.09.26.
- Probado en producción tras publicar: mapa de Zonas apareció en blanco en el primer intento de carga, coincidiendo con el popup de permiso de geolocalización del navegador; en los intentos siguientes cargó correctamente con los pines. No reproducido con certeza en esta sesión. Descartado como bug estable en sesión 15.09.26 (ver abajo).
- UX pendiente en Zonas: el check-in bloqueaba duplicados en el backend correctamente, pero el botón "Hacer check-in" no cambiaba de estado tras usarlo. Resuelto en sesión 15.09.26.

### Sesión 15.09.26 (quinta sesión)
- Créditos de Lovable: 1,10 disponibles, sin cambios desde el 11.09.26 (no se ha consumido nada, todo el trabajo de código de esta sesión fue en el repo/Codespace, sin tocar el chat de Lovable).
- Validación geoespacial real implementada en checkInZone (aura-store.tsx): fórmula de Haversine + radio dinámico por kind de zona (Evento=1km, Patrocinado=5km, Zona salvaje=50km), usando aura_zones.latitude/longitude y navigator.geolocation capturado en zonas.tsx (antes se descartaba tras "calentar" el permiso) — commit b32f547.
- UI de Zonas refleja el check-in ya hecho hoy: nuevo estado checkedInZoneIds en el store (cargado desde zone_checkins al iniciar sesión, junto con hábitos/logs del día), botón deshabilitado y marcador visual (icono Check en vez de MapPin/Zap) en mapa y lista cuando ya hay check-in — commit b0996d5.
- Mapa en blanco en el primer load de Zonas (reportado 11.09.26): NO reproducido tras 5-6 recargas manuales en esta sesión. Lo que se observó siempre fue el estado de carga correcto ("Cargando zonas…"), no un bug. Sin acción de código; probablemente fue una carrera puntual entre el popup del navegador y el primer render, no un bug estable.
- Hallazgo: no existía NINGÚN botón ni lógica de cerrar sesión en toda la app (cero llamadas a supabase.auth.signOut() en el repo). Añadido: isAuthenticated y signOut() en aura-store.tsx, botón "Cerrar sesión" en perfil.tsx (visible solo si isAuthenticated) — commit 80b47db.
- Google OAuth verificado end-to-end en https://aura-sync-playground.lovable.app (dominio publicado de Lovable): funciona correctamente.
- Borrada la OAuth App de GitHub sin usar "AuraFarm" (Client ID Ov23liIjtq7POpEfPNkN, 0 users, nunca usada) — limpieza en github.com/settings/developers.
- Hosting del frontend real configurado en Vercel: proyecto "aurafarm" importado desde jesuslopezmorales/aurafarm (GitHub App con acceso restringido solo a ese repo), variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY configuradas en Environment Variables de Vercel, deploy en producción funcionando en aurafarm-topaz.vercel.app.
- Dominio getaurafarmapp.com conectado a Vercel (no a Lovable Hosting, que exige plan Pro 25€/mes — descartado por coste). DNS en Squarespace: eliminado el bloque "Ajustes predeterminados de DNS" (A/CNAME/HTTPS por defecto de Squarespace hacia su propio parking, y el preset automático "Vercel" que generó Squarespace al añadir el dominio usaba un CNAME legacy `cname.vercel-dns.com`), sustituido a mano en "Registros personalizados" por A @ 216.198.79.1 y CNAME www 166163d75f3ecd0a.vercel-dns-017.com — el valor exacto recomendado por Vercel. Los 6 registros de Zoho Mail (3x MX, 3x TXT) y el CNAME _domainconnect quedaron intactos. Ambos dominios (getaurafarmapp.com, www.getaurafarmapp.com) con "Valid Configuration" en Vercel. Verificado en navegador: la app carga el código real (branding AuraFarm, MCP endpoint correcto), login por email/contraseña funciona con datos reales del backend.
- Añadidos https://www.getaurafarmapp.com/** y https://getaurafarmapp.com/** a los Redirect URLs de Supabase Auth (Lovable editor → Cloud → Users → Authentication settings → Advanced).
- Login con Google en www.getaurafarmapp.com falla con 404 en /~oauth/initiate. Causa raíz confirmada leyendo src/integrations/lovable/index.ts: el broker @lovable.dev/cloud-auth-js redirige a rutas (/~oauth/initiate, /~oauth/callback) que solo intercepta la infraestructura de hosting propia de Lovable — no existen en Vercel, el fallo ocurre antes de llegar a Supabase, independiente de los Redirect URLs configurados. Se exploró Cloud → Users → Google → "Your own credentials": el panel sigue ofreciendo únicamente callbacks propios de Lovable (oauth.lovable.app/callback, aura-sync-playground.lovable.app/~oauth/callback) — no resuelve el problema por sí solo. Solución identificada, no implementada: ver PENDIENTES.
- GitHub Codespaces: cuota mensual agotada al 100% (5$/5$) el 15.09.26, resetea el 01.10.26. Hasta entonces, desarrollo vía clon local o github.dev (editor sin terminal, solo sirve para ediciones de texto con commit/push desde la UI, no para cambios de código que necesiten typecheck/build).

### Sesión 18.09.26 (continuación — tarde)
- Warnings de seguridad RLS revisados vía Lovable Cloud → Seguridad (cambios de BD no versionados en git salvo `list-aura-feed.ts`):
  - `aura_posts`: sin cambio en política de lectura — el feed sigue público para cualquier autenticado a propósito (lo requiere `list_aura_feed` del MCP). Se añadió política explícita `FOR UPDATE USING (false)` ("Posts are immutable"): no existía ninguna política UPDATE y el linter de Lovable lo señalaba como warning.
  - `post_votes`: eliminada la política SELECT abierta a todos los autenticados; ahora solo el propio voto es legible vía la política ALL existente (`user_id = auth.uid()`). Creada vista `post_vote_counts` (agregada, `SECURITY INVOKER`) para exponer conteos sin revelar identidad del votante. `src/lib/mcp/tools/list-aura-feed.ts` actualizado para leer de esa vista en vez de la tabla cruda — commit d81c24a (+ c9785f2 que elimina el archivo `type` residual).
  - `toggle_habit` (RPC): revocado `EXECUTE` de `anon`/`PUBLIC` en SQL editor de Lovable (cambio no versionado en git); ahora solo el rol `authenticated` puede ejecutarla.
  - 2 warnings descartados con "Ignore issue" en Lovable: (1) "Signed-In Users Can Execute SECURITY DEFINER Function" — `toggle_habit` necesita `SECURITY DEFINER` para escribir `profiles.aura` con privilegios elevados, intencional y auditado; (2) "profiles restricted access" — el propio linter de Lovable lo etiqueta "Not a vulnerability".
- Logo de AuraFarm completado end-to-end:
  - Concepto: hexágono facetado diseñado en Illustrator; paleta cálida ámbar/coral/magenta (#ffa931, #fe874d, #ff6951, #ff3c76) elegida intencionalmente para diferenciarse de la paleta morada de VibeRadar.
  - Assets desplegados en `public/`: `favicon.png`, `icon-192.png`, `icon-512.png`, `og-image.png` — commit 625daf3. Asset de trabajo `aurafarm-iconos-preview.png` eliminado — commit f9e1a53.
  - `manifest.webmanifest` actualizado — incluye referencia a `icon-512-maskable.png` (purpose: maskable), pero **ese archivo no existe en el repo** (referenciado pero no commiteado — bloqueante para PWA en Android, ver PENDIENTES).
  - `src/routes/__root.tsx`: añadidas meta tags `og:image` (1200×630), `og:image:width/height` y `twitter:image` con URL absoluta de producción (`https://www.getaurafarmapp.com/og-image.png`) — commit 625daf3.
  - `src/components/AuraFarmLogo.tsx`: nuevo componente SVG inline (4 polígonos, hexágono facetado) — commit 2c79b95.
  - `src/components/AppShell.tsx`: icono provisional `Sparkles` sustituido por `<AuraFarmLogo className="size-5" />` en el badge del header — commit 2c79b95.

### Sesión 18.09.26 (octava sesión)
- Login con Google verificado funcionando en producción (getaurafarmapp.com/auth) — objetivo de la sesión anterior cerrado.
- Stripe configurado end-to-end en modo **Live**:
  - Cuenta Stripe activada en Live (particular/Vendedor, categoría Software, transferencias a Revolut EUR, estado fiscal "todavía no estoy vendiendo").
  - Webhook Live creado (`aurafarm-stripe-webhook-live`) apuntando a `https://www.getaurafarmapp.com/api/public/stripe-webhook` (con `www`, necesario por el 308 redirect permanente que Vercel emite en el dominio sin prefijo).
  - Variables de entorno añadidas en Vercel (Production): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (las dos últimas son las mismas claves que `VITE_SUPABASE_*` pero sin prefijo, necesarias para las server functions).
  - Fix en `src/lib/stripe-checkout.functions.ts` (commit b063350): sustituido `supabaseAdmin` (requería `SUPABASE_SERVICE_ROLE_KEY`, nunca accesible fuera de Lovable) por el cliente `supabase` ya autenticado del usuario, para leer y actualizar `stripe_customer_id` sin necesitar esa clave.
  - Fix en `src/lib/stripe.server.ts` (commit ebb7aa0): `AURA_PASS_PRICE_ID` y `AURA_MASTER_PRICE_ID` actualizados de IDs de modo Test (`price_1UDMkCCce8fDVXouqcJEhGYn`, `price_1UEQe7Cce8fDVXouLngpzqBo`) a los IDs reales de Live (`price_1UGfIzE832UCdFMQYMTjjRhk` y `price_1UGfItE832UCdFMQ4E2bNUnL`).
  - Verificado: el botón "Activar Aura Pass" en producción llega correctamente a la pantalla de Checkout de Stripe con formulario de pago real.

### Sesión 17.09.26 (séptima sesión)
- Bypass del broker legacy de OAuth de Lovable completado: `@lovable.dev/cloud-auth-js` dependía de rutas `~oauth/*` que solo existen en dominios servidos por la infraestructura de Lovable, causando 404 en producción (Vercel/getaurafarmapp.com). Sustituida en `src/routes/auth.tsx` la llamada `lovable.auth.signInWithOAuth()` por `supabase.auth.signInWithOAuth()` nativo, e import de lovable eliminado — commit 791401c.
- Credenciales OAuth propias creadas en Google Cloud Console (proyecto "AuraFarm", id `aurafarm-508811`, cliente "AuraFarm Web") e introducidas en el editor de Lovable (Cloud → Users → Authentication → Google → "Your own credentials").
- URI de redirección correcta para Google Cloud Console: `https://ybvcomzflnoezonipbde.supabase.co/auth/v1/callback` (URL nativa de GoTrue, no el dominio proxy `c--...-prod.lovable.cloud`). Registradas también las URIs del broker de Lovable (`oauth.lovable.app/callback` y `aura-sync-playground.lovable.app/~oauth/callback`) para no romper el login en el editor.
- Login con Google verificado y funcionando en local (localhost:8080) y posteriormente en producción (getaurafarmapp.com/auth — confirmado en sesión 18.09.26).

### Sesión 16.09.26 (sexta sesión)
- Migración del entorno de desarrollo a local en Windows (D:\_JLM_\Proyectos\aurafarm), motivada por el agotamiento de la cuota gratuita de GitHub Codespaces (resetea el 01.10.26): instalación de Node/npm/Git en Windows, clonado del repo, `npm install`, recreación manual de `.env` (gitignored, no viaja con el clon) con VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
- Bug de compatibilidad Windows encontrado y parcheado en `@lovable.dev/mcp-js`: la función `assertContains` en `node_modules/@lovable.dev/mcp-js/dist/stacks/tanstack/vite.js` comparaba rutas usando el separador nativo del SO sin normalizar barras, lo que la hacía fallar en Windows (rutas con `\`) aunque el propio archivo ya definía una función `normalizePath` sin usar para ese fin. Parcheado localmente haciendo que `assertContains` normalice ambas rutas con esa `normalizePath` ya existente antes de compararlas. Cambio NO versionado (vive dentro de `node_modules`) — hay que repetirlo manualmente cada vez que se borre `node_modules` y se reinstale desde cero en Windows.
- Instalación de Claude Code CLI en local y login correcto.

### Sesión 21.09.26
- Verificado en producción: favicon en pestaña (/ y /auth), metatags og:image/twitter:image (URLs absolutas, charset utf-8 correcto), header con el logo real, Facebook Sharing Debugger OK (los avisos por og:url y fb:app_id no requieren acción; no se añade og:url en `__root.tsx` porque se heredaría en todas las rutas), "Añadir a pantalla de inicio" en Android con icono maskable y pantalla de arranque correctos.
- Bloqueo resuelto: `icon-512-maskable.png` nunca se había commiteado (el manifest apuntaba a un 404). Regenerado desde `icon-512.png` (fondo #14111C a sangre, hexágono de 352 px de alto dentro de la zona segura), commit d5fd25f, verificado 200 image/png.
- Stripe webhook (commit 442df8d): `src/routes/api/public/stripe-webhook.ts` ya no usa `supabaseAdmin` (`SUPABASE_SERVICE_ROLE_KEY` no existe en Vercel); llama a la RPC `apply_stripe_pass` (Postgres, `SECURITY DEFINER`, `EXECUTE` solo para `anon`, protegida con secreto compartido `STRIPE_RPC_SECRET` en Vercel Production). Un error de RPC devuelve 500 para que Stripe reintente; 0 filas afectadas se registra en logs y devuelve 200. Verificado: endpoint 400 sin firma, RPC devuelve 28000 unauthorized con secreto incorrecto, webhook Live con 6 eventos (checkout.session.completed, customer.subscription.created/updated/deleted, invoice.payment_failed/succeeded). IMPORTANTE: la función SQL se creó en el editor SQL de Lovable y NO está versionada en git.
- Páginas legales (commit 3d1a6e9): `src/routes/privacidad.tsx`, `src/routes/terminos.tsx` (con política de desistimiento de 14 días y reembolso completo, cancelación al final del periodo), `src/components/LegalLayout.tsx`, `src/lib/legal-info.ts` (fuente única de datos del titular; `ownerTaxId` y `ownerAddress` en `null` por decisión de Jesús; contacto hello@getaurafarmapp.com, reportes reports@getaurafarmapp.com). `routeTree.gen.ts` se versiona y se regenera arrancando `npm run dev`. Textos redactados como base, pendientes de revisión de un gestor o abogado antes de cobrar.
- Google OAuth: URLs de /privacidad y /terminos pegadas en la pantalla de marca (sin logotipo, a propósito: subirlo obliga a verificar la marca), sin permisos sensibles ni restringidos, app publicada en "En producción".
- Datos: perfil e5724e27… (jlopezmorales@hotmail.com) reseteado por SQL a `pass_active=false`, `multiplier=1`, `stripe_customer_id=NULL`, `aura=400` conservado (residuo de pruebas en modo test). Cambio hecho en el editor SQL, no versionado.
- Stripe portal de clientes Live: configuración guardada (`bpc_1UI7bxE832UCdFMQft5t9ZvA`), cancelación permitida al final del periodo con motivo, cambio de plan y de cantidad desactivados; URLs de privacidad y condiciones y correo de soporte hello@getaurafarmapp.com guardados en datos públicos de empresa. Aún no hay código que abra el portal (sin llamadas a `billingPortal` en el repo).
- Guarda anti-doble-suscripción (commit d68e04b): `src/lib/stripe-checkout.functions.ts` consulta las suscripciones del cliente en Stripe y lanza `ALREADY_SUBSCRIBED` si hay una en estado `active`, `trialing`, `past_due` o `unpaid`. Deploy Ready en producción. Sin verificar todavía en producción que el checkout sigue redirigiendo a Stripe para un usuario sin suscripción.

### Sesión 23.09.26 (novena sesión)
- **PRIORIDAD 1 — Checkout sin pago: verificado en producción.** Con jesuslopezmorales@gmail.com en /aura-pass, "Activar Aura Pass" redirige a Stripe con el importe correcto (6,99€). Guarda anti-doble-suscripción del commit d68e04b funcionando (no se ofrece checkout duplicado a quien ya tiene suscripción activa).
- **PRIORIDAD 2 — Portal de clientes Stripe: completado.** Nuevo `src/lib/stripe-portal.functions.ts` (`createPortalSession`, mismo patrón que `stripe-checkout.functions.ts`: cliente `supabase` autenticado del usuario, sin `supabaseAdmin`). Botón "Gestionar suscripción" añadido en `aura-pass.tsx`, visible solo si `multiplier > 1`. Mensaje de error específico para `ALREADY_SUBSCRIBED` en vez del genérico "No se pudo iniciar el pago". Verificación completa (redirección real al portal de Stripe) pendiente hasta tener una suscripción activa — coincide con el PUNTO 7.
- **PRIORIDAD 3 — SQL de `apply_stripe_pass` versionado.** La función RPC solo existía en Lovable Cloud (creada por SQL editor, nunca en git — ver sesión 21.09.26). Versionada en `drizzle/migrations/manual/0001_apply_stripe_pass.sql` con `REEMPLAZA_CON_EL_SECRETO` como placeholder en vez del valor real de `STRIPE_RPC_SECRET`.
- **HALLAZGO — Supabase Auth exige `127.0.0.1` en vez de `localhost` en Redirect URLs.** Añadido `http://127.0.0.1:8080/**` en Lovable Cloud → Users → Authentication settings. Para testear login local hay que acceder vía `http://127.0.0.1:8080`, no `localhost:8080` (con `localhost` el login falla silenciosamente al no matchear ningún Redirect URL permitido).
- **PUNTO 5 — NIF y domicilio.** `legal-info.ts` actualizado: `ownerName` "Jesús López Morales", `ownerTaxId` "53234969C", `ownerAddress` "Calle Leandro Gras Limiñana 16, 03670 Monforte del Cid, Alicante, España" (antes `null` por decisión pendiente, ver sesión 21.09.26). Dirección de soporte ya guardada también en Stripe → Empresa → Datos de la cuenta. Fiscalidad de las suscripciones: sin gestor propio, se envió consulta a indieprof.com (info@indieprof.com) preguntando si gestionan suscripciones recurrentes vía Stripe y el régimen OSS de IVA — **pendiente de respuesta**.
- **PUNTO 6 — Sistema de referidos: diseño e implementación completos.**
  - Paso A (migración `drizzle/migrations/manual/0002_referral_system.sql`, ejecutada en Lovable Cloud): columnas `profiles.referral_code` / `referred_by_code` / `pass_expires_at`, tabla `referrals`, RPCs `get_or_create_referral_code` / `apply_referral_code` / `complete_referral_if_pending`. `toggle_habit` modificada para disparar la finalización del referido en el primer hábito marcado por el amigo referido.
  - Paso B: captura de `?ref=` en `auth.tsx` (guardado en `localStorage`), aplicación automática vía `apply_referral_code` en `aura-store.tsx` al cargar el perfil.
  - Paso C: sección "Promociona" en `perfil.tsx` — código propio, botón compartir (Web Share API con fallback a copiar al portapapeles), lista de amigos referidos con nombre y estado (vía RPC `get_my_referrals`, migración `drizzle/migrations/manual/0003_referral_status_rpc.sql`).
  - Paso D: cupón Stripe 100% descuento (`duration: once`) para referidores que ya son suscriptores de pago cuando su amigo completa el referido. Migración `drizzle/migrations/manual/0004_referral_stripe_coupons.sql` (RPCs `get_pending_stripe_coupons` / `mark_referral_stripe_rewarded`, protegidas con `STRIPE_RPC_SECRET`). Nuevo server function `src/lib/process-referral-rewards.functions.ts`, llamado en fire-and-forget desde `aura-store.tsx` tras cada `toggle_habit` exitoso.
  - Reglas de negocio: 1 recompensa máxima por referidor. Si el referidor es gratis → pass 2x gratis 30 días directo (`pass_expires_at`). Si ya paga → cupón Stripe 100% en el siguiente ciclo.
  - **PENDIENTE: verificación end-to-end completa** (requiere un referidor con suscripción de pago real — coincide con el PUNTO 7).
  - **LIMITACIÓN CONOCIDA sin blindar**: si el referidor tiene varias suscripciones o cambia de plan entre que se genera el `stripe_coupon_pending` y se procesa, el comportamiento no está cubierto (volumen bajo, aceptable por ahora).
  - **LIMITACIÓN CONOCIDA sin implementar**: expiración automática de `pass_expires_at` — el pass gratis de 30 días no se revierte solo cuando caduca; falta lógica de comprobación/expiración, no implementada esta sesión.
- **HALLAZGO CRÍTICO (persiste, no resuelto esta sesión)** — el feed de posts en `aura-store.tsx` sigue sin usar las tablas reales `aura_posts`/`post_votes` (existen en el esquema pero no se usan): `initialPosts` sigue siendo un array mock, `addPost` solo modifica estado local en memoria. Bloqueante antes de abrir la app a usuarios reales, independiente del PUNTO 4.
- **PUNTO 4 — Flujo de reporte de contenido**: en pausa, bloqueado por el hallazgo del feed no persistido (no tiene sentido reportar posts que no viven en BD). Diseño ya decidido para cuando se retome: tabla `reports` (`reporter_id`, `entity_type='post'`, `entity_id`, `reason`, `details`, `status`), sin política SELECT para usuarios normales, solo revisión manual vía SQL editor.
- **PUNTO 7 — Prueba de pago real**: sin empezar.
- Hallazgos menores sin tocar (congelación estética, no urgente, sin cambios esta sesión): icono Sparkles provisional en `/auth`, footer sin enlaces a `/privacidad` y `/terminos`.

### Sesión 24.09.26 (décima sesión)
- **PUNTO 7 — Pago real de Aura Pass: completado y verificado en producción.** Con jesuslopezmorales@gmail.com (perfil `bd5cad45-2dc2-4580-9e33-18eade3d038c`, `cus_VHWIV9HkDCws2F`): el checkout Live reutiliza el customer existente, el webhook responde OK, `profiles.pass_active=true` y `multiplier=2` confirmados en BD, sin carrera entre el redirect `?checkout=success` y el webhook. Portal de clientes funcional (`return_url` a `/aura-pass`). Suscripción `sub_1UJ950E832UCdFMQPVg5BNZx` cancelada inmediatamente desde el Dashboard con reembolso de 6,99€; `customer.subscription.deleted` entregado con 200 y el perfil vuelto a `pass_active=false`, `multiplier=1` (`apply_stripe_pass` fuerza `multiplier=1` al desactivar).
- Portal de clientes Stripe confirmado en Live: configuración `bpc_1UI7bxE832UCdFMQft5t9ZvA` con métodos de pago y cancelación activos, modo "al final del periodo".
- **PUNTO 6 — Sistema de referidos: verificado end-to-end.** Enlace `https://www.getaurafarmapp.com/auth?ref=F7129FD` → registro de cuenta de prueba `jesuslopezmorales+ref1@gmail.com` (perfil `07a62b55-c319-4d6b-9e2e-343d71bd8dbb`, `referred_by_code=F7129FD`, el ref sobrevive a la confirmación por email) → primer hábito marcado → cupón Stripe `EvNBdrwu` (100%, once, `max_redemptions=1`) aplicado a la suscripción del referidor; fila `referrals` con `status=rewarded`, `reward_type=stripe_coupon_applied`.
- Fix en el webhook (commit a0d8521): `src/routes/api/public/stripe-webhook.ts` — reintento en `setPass` (3 intentos, backoff 750 ms) ante el error transitorio "JWT issued at future" de la pasarela de Supabase (desfase de reloj con claves `sb_publishable_`), detectado por un 500 en el primer `customer.subscription.created`. Incluye también un fix de tipado en `src/routes/[.]lovable.oauth.consent.tsx` (redirect a `/auth` con `ref: null`).
- **PUNTO 3 — Feed persistido: completado (commits 006d3e1 y 2cf80e6).**
  - Migración `drizzle/migrations/manual/0005_feed_persistence.sql` ejecutada en Lovable Cloud: RPCs `SECURITY DEFINER` `get_feed(p_limit)`, `create_post(p_action, p_detail, p_category)`, `set_post_vote(p_post_id, p_vote)`, solo para `authenticated`.
  - `create_post` deriva los puntos de la categoría (±120, Desliz negativo) × multiplicador del perfil, suma Aura de forma atómica y aplica el límite de 3 pruebas diarias (hora Madrid) a cuentas sin pass.
  - `set_post_vote`: votar/cambiar/quitar voto, impide votar posts propios, devuelve contadores.
  - `src/lib/aura-store.tsx`: feed real vía `get_feed` para usuarios con sesión, posts mock solo para visitantes; `addPost` ahora async sin parámetro `points`; votos optimistas con reconciliación; estado inicial neutro para evitar parpadeo de datos demo.
  - `src/routes/index.tsx`: adaptado a la nueva firma de `addPost`, sin estado `points`.
  - Verificado: feed vacío inicial, publicación +120, persistencia tras F5, votos entre cuentas, bloqueo de voto propio, límite diario.
- **HALLAZGO CRÍTICO DE SESIONES ANTERIORES: RESUELTO.** El feed de posts ya usa las tablas reales `aura_posts`/`post_votes` (ver PUNTO 3 arriba) — deja de ser bloqueante para usuarios reales.
- Hallazgos nuevos, no bloqueantes (sin acción esta sesión): token de acceso visible en el hash de la URL (`#access_token=...`) tras login con Google; `handle='aura'` repetido en todos los perfiles (sin unicidad); `profiles.updated_at` no se actualiza en UPDATE (falta trigger); estadísticas mock en Perfil ("+1.2k esta semana", "184 pruebas"); la racha no sube al completar hábitos (`toggle_habit` no toca `streak`); email de confirmación en inglés con remitente de Lovable (`lovable-app.email`); nombre de facturación en Stripe = `display_name` por defecto "Aura Farmer"; cliente duplicado en Stripe del 18.09 (intento de checkout fallido con `resource_missing` price); cierre de sesión inesperado de la cuenta `+ref1` durante las pruebas (causa sin determinar); el referido solo se completa al marcar hábitos, no al publicar pruebas; Stripe Tax desactivado (`automatic_tax.enabled=false`), pendiente de la respuesta fiscal.
- Cuenta de prueba usada esta sesión: `jesuslopezmorales+ref1@gmail.com` (display_name "Jesús", 3 posts de prueba del día en `aura_posts`: "Prueba feed persistido", "Límite 2", "Límite 3").
- indieprof.com: sigue sin respuesta a la consulta sobre suscripciones recurrentes y régimen OSS de IVA.

---

## 🔴 PENDIENTES — Alta prioridad
- **PUNTO 4 — Flujo de reporte de contenido**: no existe nada (ni tablas ni funciones). Ya no está bloqueado por el feed (PUNTO 3, resuelto 24.09.26). Diseño ya decidido: tabla `post_reports` con RLS, RPC `report_post` con umbral de ocultación, ajuste de `get_feed`, botón "Reportar" en tarjeta de post (requiere autorización explícita por congelación estética).
- Verificar en producción tras el deploy: favicon en pestaña del navegador, "Añadir a pantalla de inicio" en móvil (iconos correctos), header mostrando el logo real, og:image en Facebook Sharing Debugger / Twitter Card Validator (ojo con cache de scrapers sociales).
- `public/icon-512-maskable.png`: referenciado en `manifest.webmanifest` (purpose: maskable) pero no existe en el repo — bloqueante antes de dar el logo por terminado y antes de que usuarios instalen la PWA en Android.

---

## 🟡 PENDIENTES — Media prioridad
- **PUNTO 5 — Expiración automática de `pass_expires_at`**: el pass gratis de 30 días concedido por referido no se revierte solo cuando caduca; falta lógica de comprobación/expiración.
- Fiscalidad de las suscripciones: consulta enviada a indieprof.com (info@indieprof.com) sobre gestión de suscripciones recurrentes vía Stripe y régimen OSS de IVA — pendiente de respuesta. Bloquea activar Stripe Tax (`automatic_tax.enabled`).
- Lost update en `aura-store.tsx`: `toggleHabit` escribe `profiles.aura` como valor absoluto calculado en cliente — pendiente mover a RPC atómica en Postgres para eliminar la condición de carrera con actualizaciones concurrentes del Aura desde otras fuentes.
- Hallazgos menores del 24.09.26 sin priorizar aún: token de acceso visible en el hash de la URL tras login con Google; `handle='aura'` repetido sin unicidad; `profiles.updated_at` sin trigger; estadísticas mock en Perfil; la racha no sube al completar hábitos; email de confirmación en inglés con remitente de Lovable; nombre de facturación por defecto "Aura Farmer"; cliente duplicado en Stripe del 18.09; el referido solo se completa marcando hábitos, no publicando pruebas.
- Revisar/ampliar el límite de gasto de GitHub Codespaces si se quiere seguir usando antes del 01.10.26.

---

## 🔵 PENDIENTES — Baja prioridad / post-launch
- Cambiar paleta de color de AuraFarm para diferenciarla de VibeRadar.
- Evaluar LOVABLE_DB_MIGRATION_URL (Enterprise).
- Activar Stripe KYC completo (verificación de identidad para recibir pagos reales).
- Empaquetado Android (Capacitor vs TWA), cuenta Google Play Developer, política de privacidad/términos.

---

## 🎨 Hallazgos pendientes de decisión (congelación estética)
- La pantalla /auth sigue con el icono provisional Sparkles.
- El footer de la app no enlaza a /privacidad ni a /terminos (Google lo pide si algún día se sube el logo).

Ninguno se toca sin autorización explícita.

---

## 🧠 APRENDIZAJES TÉCNICOS

### Sesión 08.09.26
- Lovable no soporta conectar Git a un repo existente, solo crear uno nuevo — el frontend vive en dos copias que requieren sincronización manual.
- El pegado por terminal (heredoc) puede truncar archivos largos sin dar error hasta compilar — para archivos que reemplazan contenido existente y largo, pegar en el editor de VS Code es más fiable que la terminal.
- Funciones de servidor (createServerFn) necesitan variables SIN prefijo VITE_, distintas de las del cliente — ambos pares deben estar en .env si se prueba localmente.
- SUPABASE_SERVICE_ROLE_KEY en Lovable Cloud es inaccesible por diseño, ni para el propio dueño del proyecto — funciones con supabaseAdmin solo se prueban dentro de Lovable.
- Zoho Mail Free requiere MX + SPF + DKIM además del TXT de verificación; el SPF puede chocar con uno previo del proveedor de dominio y hay que fusionarlos.
- Verificar git branch --show-current al abrir sesión — es fácil commitear varias sesiones en una rama que no es main sin darse cuenta.
- Agrupar varias migraciones en una sola petición a Lovable maximiza créditos limitados.

### Sesión 09.09.26
- Un pago de Stripe correcto y un webhook con 200 OK no garantizan que el frontend refleje el cambio: si la lógica de carga de datos del usuario autenticado tiene un bug (o falta directamente), la app puede seguir mostrando datos de invitado indefinidamente sin ningún error visible en consola ni en Network — hay que verificar explícitamente que existe una petición real a la tabla relevante, no solo que el backend respondió bien.
- El webhook de Stripe apunta a la URL de publicación de Lovable (*.lovable.app), no a la URL de preview del editor — sin publicar el proyecto al menos una vez, el webhook recibe 404 aunque el resto del flujo esté bien configurado.
- Tras cualquier corrección de seguridad o de lógica en el editor de Lovable, hay que republicar explícitamente para que el sitio público sirva el cambio — publicar no es automático.
- La sesión de Supabase Auth no se comparte entre el preview del editor de Lovable y el sitio publicado (dominios distintos) — hay que loguearse por separado en cada uno al probar.
- GitHub Codespaces (cuenta personal, gratis): 120 core-hours/mes de cómputo compartidas entre todos los repos — en máquina de 2 núcleos equivale a 60h reales. Se agotan sin previo aviso claro; conviene configurar un "Default idle timeout" bajo (se dejó en 60 min esta sesión, antes en 240) para no desperdiciar horas con el Codespace abierto sin uso.
- El desglose exacto de consumo de Codespaces (cómputo vs almacenamiento, por repositorio) está en GitHub → Settings → Billing and licensing → Usage, con "Group by: Products" o "Group by: Repositories".

### Sesión 11.09.26
- Patrón repetido de esta sesión: al pedir "sincroniza X con este contenido exacto" en el chat de Lovable, el pegado se corrompió 2 de 3 veces (mismo problema de truncado ya documentado con types.ts en sesión 08.09.26), y Lovable reconstruyó el JSX por su cuenta sin avisar hasta que se le pidió explícitamente el contenido resultante para comparar. Cada vez que esto pasó, la reconstrucción de Lovable tenía déficits funcionales reales respecto al original. Nunca asumir "typecheck en verde" como equivalente a "funcionalidad intacta" tras una reconstrucción de Lovable — siempre pedir el contenido final y diff explícito antes de publicar.
- Créditos de Lovable: quedaron en 1,10 al cierre de esta sesión (empezó con 10; los 3 ciclos de reconstrucción/typecheck consumieron la mayoría).

### Sesión 15.09.26
- Editar código directamente en el Codespace (sin pasar por el chat de Lovable) no consume créditos de Lovable — toda la sesión de hoy (Haversine, UI de check-in, botón de logout) se hizo así, créditos intactos.
- El preset automático "Vercel" que ofrece Squarespace al añadir un dominio en Vercel puede usar un CNAME legacy (cname.vercel-dns.com) en vez del valor exacto y más reciente que Vercel recomienda para ese proyecto concreto (166163d75f3ecd0a.vercel-dns-017.com) — ambos "funcionan" (Vercel los valida), pero conviene usar el recomendado en vez del preset automático.
- El broker de auth propio de Lovable (@lovable.dev/cloud-auth-js) está fuertemente acoplado a la infraestructura de hosting de Lovable — un dominio propio en hosting externo (Vercel, Netlify, etc.) rompe el login social (Google) aunque el resto del backend (Supabase Auth, RLS, tablas) sea completamente compartido y funcional. Verificar esto ANTES de mover el hosting, no después, en futuros proyectos con el mismo patrón (Lovable Cloud + hosting externo).
- GitHub Codespaces gratuito puede agotarse en menos de una semana con uso intensivo de terminal (varios `npx tsc --noEmit`, `npm run dev` sesiones largas) — vigilar el aviso de GitHub al 75% con más margen, no esperar al 100%.

### Sesión 16.09.26
- Al reinstalar dependencias en Windows (`npm install` tras clonar o tras borrar `node_modules`), verificar y, si hace falta, reaplicar como primer paso el parche de `assertContains`/`normalizePath` en `node_modules/@lovable.dev/mcp-js/dist/stacks/tanstack/vite.js` (ver Sesión 16.09.26 arriba) — el paquete no es compatible con separadores de ruta de Windows tal cual viene publicado, y el fallo solo se manifiesta al arrancar el servidor MCP, no en la instalación.

### Sesión 17.09.26
- El endpoint de callback real que usa GoTrue (Supabase) es `https://<project-ref>.supabase.co/auth/v1/callback`, NO el dominio proxy que expone Lovable (`c--...-prod.lovable.cloud`). El proxy de Lovable redirige internamente pero registrarlo en Google Cloud Console como callback no funciona con el flujo PKCE nativo — hay que poner siempre la URL directa de GoTrue.
- Al bypasear el broker de Lovable se pierde automáticamente el soporte para Apple y Microsoft OAuth (que el broker sí manejaba). Si esos proveedores son necesarios en el futuro, habrá que añadir credenciales propias para cada uno de forma análoga al flujo de Google implementado aquí.
- El editor de Lovable muestra callbacks propios del broker (`oauth.lovable.app/callback`, `<proyecto>.lovable.app/~oauth/callback`) en el panel de configuración de Google — son los que usa el broker para el editor/frontend de Lovable. Registrarlos también en Google Cloud Console evita romper el login en el editor de Lovable (útil para probar el backend) mientras la app real usa el callback de Supabase.

### Sesión 18.09.26 (continuación — tarde)
- Un warning de RLS de tipo "missing UPDATE policy" no significa que la tabla sea escribible sin control — en Supabase, si no existe ninguna política UPDATE, la operación falla para todos los roles (deny-by-default). Añadir `FOR UPDATE USING (false)` es un patrón explícito para silenciar el linter cuando la intención es exactamente esa (tabla inmutable en producción), sin cambiar el comportamiento real.
- Si una vista con `SECURITY INVOKER` agrega datos de una tabla con RLS restrictiva, los usuarios que no tienen acceso SELECT a la tabla sí pueden leer la vista siempre que el owner de la vista tenga ese acceso y la vista solo exponga columnas calculadas (no filas individuales identificables) — este es el patrón de `post_vote_counts`: los votantes individuales no son visibles, solo los conteos.
- Cambios de permisos sobre RPCs en Lovable (REVOKE EXECUTE) no generan migración y no aparecen en el historial de git — documentarlos en el session log es la única fuente de verdad.

### Sesión 18.09.26
- El webhook de Stripe en Vercel debe apuntar siempre al dominio con `www` (`https://www.getaurafarmapp.com/...`), no al apex (`https://getaurafarmapp.com/...`), porque Vercel emite un 308 en el apex que Stripe no sigue — el webhook llega a 308 y marca el evento como fallido.
- `SUPABASE_SERVICE_ROLE_KEY` sigue siendo inaccesible en Vercel (y en cualquier hosting externo a Lovable), pero las server functions del checkout (`stripe-checkout.functions.ts`) no la necesitan si se usa el cliente Supabase autenticado del usuario en lugar de `supabaseAdmin` — el cliente autenticado tiene los permisos correctos para leer/escribir la propia fila de `profiles` gracias a la política RLS `auth.uid() = id`.
- Al activar Stripe Live, los `price_id` cambian completamente respecto al modo Test — son IDs distintos, no el mismo ID en dos entornos. Hay que actualizar `stripe.server.ts` con los IDs Live antes de cualquier pago real; los IDs Test siguen siendo válidos para el entorno Test de Stripe pero nunca para cobros reales.

### Sesión 23.09.26
- Supabase Auth (GoTrue) valida los Redirect URLs contra `127.0.0.1`, no contra `localhost`, aunque ambos apunten al mismo servidor de desarrollo — con `localhost:8080` el login falla sin matchear ningún Redirect URL permitido aunque `http://localhost:8080/**` no esté ni siquiera en la lista, y sin un error explícito que lo delate como problema de Redirect URL. Para testear login local siempre usar `http://127.0.0.1:8080` y tener esa URL (no `localhost`) dada de alta en Lovable Cloud → Users → Authentication settings.

### Sesión 24.09.26
- Un pago Live real puede disparar en el webhook un error transitorio "JWT issued at future" (desfase de reloj de la pasarela de Supabase con claves `sb_publishable_`) que provoca un 500 en el primer `customer.subscription.created` aunque el pago en Stripe sea correcto — no es un fallo de lógica de negocio. Mitigado con reintento (3 intentos, backoff 750 ms) en la llamada que aplica el pase (`setPass`), no con manejo de errores genérico.
- Verificar `pass_active`/`multiplier` en BD inmediatamente tras el redirect `?checkout=success` puede dar una condición de carrera si el webhook aún no procesó el evento — conviene comprobar explícitamente que la UI no depende de una lectura optimista inmediata tras el redirect, sino del estado ya persistido por el webhook.
- Cancelar una suscripción Live desde el Dashboard de Stripe con reembolso es una forma segura y rápida de cerrar una prueba de pago real de extremo a extremo sin dejar cargos pendientes ni datos de prueba contaminando cuentas reales de Stripe.

---

## 📋 PRÓXIMA TAREA PRIORITARIA
1. **PUNTO 4 — Flujo de reporte de contenido**: ya no bloqueado (el feed está persistido desde el 24.09.26). Diseño ya decidido, ver sesión 24.09.26 — requiere autorización explícita antes de tocar UI por la congelación estética.
2. **PUNTO 5 — Expiración automática de `pass_expires_at`**: implementar la comprobación/expiración del pase gratis de 30 días por referido, que hoy no se revierte solo.
3. Fiscalidad de las suscripciones: esperar respuesta de indieprof.com (info@indieprof.com) y aplicar sus recomendaciones (régimen OSS de IVA, activar `automatic_tax` en Stripe).
4. Revisar y priorizar los hallazgos menores no bloqueantes listados en Media prioridad (racha que no sube, token en hash de URL, `handle` sin unicidad, etc.).

---

## 🔖 ÚLTIMO COMMIT
docs: cierre de sesion 24.09.26 (pendiente de hash tras el push — ver `git log`)