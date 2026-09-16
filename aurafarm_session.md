# AuraFarm — Session State
_Última actualización: 16.09.26_

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
- **Secretos con dos niveles de acceso:** VITE_* (cliente) y su equivalente sin prefijo (servidor) deben estar AMBOS en .env del Codespace si se quiere probar desde ahí. En Vercel solo se han configurado las dos variables VITE_* (Environment Variables del proyecto en Vercel, no en .env) — las de Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) NO están en Vercel, son secretos de servidor usados solo en las Edge Functions de Lovable. SUPABASE_SERVICE_ROLE_KEY NUNCA es accesible, ni pidiéndosela a Lovable — confirmado explícitamente el 08.09.26.
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

### Sesión 16.09.26 (sexta sesión)
- Migración del entorno de desarrollo a local en Windows (D:\_JLM_\Proyectos\aurafarm), motivada por el agotamiento de la cuota gratuita de GitHub Codespaces (resetea el 01.10.26): instalación de Node/npm/Git en Windows, clonado del repo, `npm install`, recreación manual de `.env` (gitignored, no viaja con el clon) con VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
- Bug de compatibilidad Windows encontrado y parcheado en `@lovable.dev/mcp-js`: la función `assertContains` en `node_modules/@lovable.dev/mcp-js/dist/stacks/tanstack/vite.js` comparaba rutas usando el separador nativo del SO sin normalizar barras, lo que la hacía fallar en Windows (rutas con `\`) aunque el propio archivo ya definía una función `normalizePath` sin usar para ese fin. Parcheado localmente haciendo que `assertContains` normalice ambas rutas con esa `normalizePath` ya existente antes de compararlas. Cambio NO versionado (vive dentro de `node_modules`) — hay que repetirlo manualmente cada vez que se borre `node_modules` y se reinstale desde cero en Windows.
- Instalación de Claude Code CLI en local y login correcto.

---

## 🔴 PENDIENTES — Alta prioridad
- Google OAuth en getaurafarmapp.com: (a) crear credenciales OAuth propias en Google Cloud Console, (b) modificar auth.tsx para que el login de Google llame directamente a supabase.auth.signInWithOAuth() en vez de a lovable.auth.signInWithOAuth() (bypaseando el broker de Lovable), usando como Authorized redirect URI la URL nativa de Supabase (https://ybvcomzfinoezonipbde.supabase.co/auth/v1/callback), (c) introducir esas credenciales propias en Cloud → Users → Google → "Your own credentials" del editor de Lovable. Mientras tanto, Google login solo es fiable en aura-sync-playground.lovable.app; email/contraseña funciona correctamente en ambos dominios.
- Decidir a qué dominio debe apuntar el webhook de Stripe ahora que el frontend de producción real vive en Vercel/getaurafarmapp.com (actualmente sigue apuntando a *.lovable.app; ese proyecto de Lovable nunca se ha publicado con el rebrand/cambios recientes, por lo que el webhook seguiría devolviendo comportamiento inconsistente si se prueba desde ahí).

---

## 🟡 PENDIENTES — Media prioridad
- Corregir warnings de seguridad preexistentes de RLS: posts legibles por cualquier usuario autenticado, datos de zonas legibles por usuarios anónimos, votos legibles por cualquier usuario autenticado.
- Revisar/ampliar el límite de gasto de GitHub Codespaces si se quiere seguir usando antes del 01.10.26.

---

## 🔵 PENDIENTES — Baja prioridad / post-launch
- Cambiar paleta de color de AuraFarm para diferenciarla de VibeRadar.
- Evaluar LOVABLE_DB_MIGRATION_URL (Enterprise).
- Activar Stripe en modo live (KYC) cuando se decida publicar.
- Empaquetado Android (Capacitor vs TWA), cuenta Google Play Developer, política de privacidad/términos.

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

---

## 📋 PRÓXIMA TAREA PRIORITARIA
Implementar el bypass del broker de Lovable para Google OAuth en getaurafarmapp.com (credenciales propias de Google Cloud Console + supabase.auth.signInWithOAuth() directo en auth.tsx). Después, decidir el destino del webhook de Stripe y corregir los warnings de RLS pendientes. Requiere desarrollo local o clon del repo, dado el agotamiento de cuota de Codespaces hasta el 01.10.26.

---

## 🔖 ÚLTIMO COMMIT
docs: cierre de sesion 16.09.26 - migracion a entorno local Windows, parche de mcp-js para rutas Windows, Claude Code CLI instalado — 9c2d559