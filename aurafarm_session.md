# AuraFarm — Session State
_Última actualización: 11.09.26_

---

## Stack
TanStack Start (React 19) · TypeScript · Tailwind CSS v4 · Supabase JS (vía Lovable Cloud, backend gestionado — sin dashboard directo en supabase.com) · Vite 8 · Shadcn UI (Radix) · lucide-react · Stripe (checkout + webhooks de suscripción).
Repo: jesuslopezmorales/aurafarm. Codespace: /workspaces/aurasync (nombre de carpeta heredado, el repo y el proyecto ya se llaman aurafarm). Dominio comprado: getaurafarmapp.com (Squarespace, DNS configurado para email corporativo vía Zoho Mail — sin hosting web configurado todavía).

**PASO 0 OBLIGATORIO — antes de cualquier acción:**
npx repomix --output "repomix-focused-$(date +%d.%m.%y)_1.xml" --include "src/**/*.ts,src/**/*.tsx"
Adjuntar XML a Claude Chat antes de tocar código.

---

## ⚠️ ARQUITECTURA CRÍTICA — LEER ANTES DE TOCAR CÓDIGO

**Lovable NO sincroniza con el repo de GitHub.** Se probó conectar Git nativo de Lovable (Configuración → Git → GitHub) y Lovable indica explícitamente: "connecting creates a new repository for this project — importing an existing repo isn't supported". Por tanto:

- El **frontend** (componentes .tsx) vive en DOS copias independientes que no se sincronizan solas: 1) el repo real (jesuslopezmorales/aurafarm, editado desde el Codespace) — esta es la fuente de verdad del frontend; 2) el proyecto interno de Lovable (editor propio) — solo se actualiza si se le pide explícitamente por su chat.
- El **backend** (Supabase/Lovable Cloud: tablas, columnas, Edge Functions, secretos) es único y compartido — cualquier cambio de esquema o backend se hace vía el chat de Lovable, y aplica sea cual sea el frontend usado.
- Tras cualquier cambio de esquema o backend pedido a Lovable, hay que sincronizar manualmente al Codespace: copiar types.ts y los archivos de backend nuevos desde el panel de código de Lovable (panel derecho, buscador de archivos) y pegarlos en el Codespace — git pull NO trae estos cambios porque Lovable no hace push al repo real.
- **Secretos con dos niveles de acceso:** VITE_* (cliente) y su equivalente sin prefijo (servidor) deben estar AMBOS en .env del Codespace si se quiere probar desde ahí. Secretos de terceros (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) guardados en Lovable también hay que replicarlos a mano en .env del Codespace. SUPABASE_SERVICE_ROLE_KEY NUNCA es accesible, ni pidiéndosela a Lovable — confirmado explícitamente el 08.09.26. Cualquier función de servidor que use supabaseAdmin solo puede probarse dentro del preview de Lovable.
- **Consecuencia práctica:** el checkout de Stripe (createCheckoutSession, usa supabaseAdmin) está completo y correcto en el Codespace pero NO se puede probar de extremo a extremo ahí — solo en el preview de Lovable, y para eso Lovable necesita tener también el aura-pass.tsx actualizado (pendiente).

---

## ✅ TAREAS COMPLETADAS

### Sesión 08.09.26 (segunda sesión)
- Objetivo 3, Parte B — COMPLETADO: columnas avatar_url y bio añadidas a profiles vía chat de Lovable (migración add_profile_avatar_bio). aura-store.tsx: campos avatarUrl/bio en el store, funciones updateAvatarUrl/updateBio (mismo patrón que updateDisplayName). perfil.tsx: edición inline de avatar (URL de imagen) y bio, congelación estética respetada. types.ts sincronizado manualmente vía copia desde panel de código de Lovable (editor VS Code, no terminal — el pegado por terminal truncó el archivo la primera vez, 123 errores de sintaxis; corregido pegando en el editor).
- Objetivo 4, Parte B — COMPLETADO: columnas latitude/longitude añadidas a aura_zones vía chat de Lovable (migración add_zone_coordinates, misma petición que avatar/bio). Haversine implementado en aura-store.tsx. Radio dinámico 1-50 km por tipo de zona: Evento = 1 km, Patrocinado = 5 km, Zona salvaje = 50 km. checkInZone acepta coords opcionales; fail-open si falta lat/long o se deniega geolocalización. zonas.tsx: geolocalización real solicitada en el momento del check-in.
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
- Hallazgo importante sin resolver: checkInZone (aura-store.tsx) NO implementa ninguna validación real de distancia (Haversine/radio dinámico 1-50km) pese a que la documentación previa (sesión 08.09.26) daba el Objetivo 4B por completado con esa lógica. Solo valida que no haya check-in duplicado el mismo día. Pendiente de implementar de verdad en la próxima sesión — instrucción activa del usuario exige rango dinámico 1-50km según tipo de zona, descartando radios fijos.
- Probado en producción tras publicar: mapa de Zonas apareció en blanco en el primer intento de carga, coincidiendo con el popup de permiso de geolocalización del navegador; en los intentos siguientes cargó correctamente con los pines. No reproducido con certeza, revisar si se repite en la próxima sesión (posible carrera entre el popup del navegador y el primer render del mapa).
- UX pendiente en Zonas: el check-in bloquea duplicados en el backend correctamente, pero el botón "Hacer check-in" no cambia de estado tras usarlo (no indica "ya hecho hoy", no se deshabilita) — falta cargar los check-ins del día al entrar a la pantalla y reflejar el estado por zona.

---

## 🔴 PENDIENTES — Alta prioridad
- Implementar de verdad la validación geoespacial de checkInZone: Haversine + radio dinámico 1-50km según kind de zona (Evento=1km, Patrocinado=5km, Zona salvaje=50km), usando aura_zones.latitude/longitude (ya existen en el esquema) y la posición real del navigator.geolocation ya capturada en zonas.tsx (hoy se descarta, solo "calienta" el permiso).
- Reflejar en la UI de Zonas qué zonas ya tienen check-in hecho hoy (cargar zone_checkins del día al montar la pantalla, marcar/deshabilitar el botón de la zona correspondiente).
- Confirmar si el mapa en blanco al primer load (coincidiendo con el popup de geolocalización) se repite; si es reproducible, investigar causa.

---

## 🟡 PENDIENTES — Media prioridad
- Verificar Google OAuth end-to-end en dominio final.
- Borrar/reutilizar OAuth App de GitHub sin usar (Client ID Ov23liIjtq7POpEfPNkN).

---

## 🔵 PENDIENTES — Baja prioridad / post-launch
- Cambiar paleta de color de AuraFarm para diferenciarla de VibeRadar.
- Configurar DNS/hosting web de getaurafarmapp.com.
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
- Patrón repetido de esta sesión: al pedir "sincroniza X con este contenido exacto" en el chat de Lovable, el pegado se corrompió 2 de 3 veces (mismo problema de truncado ya documentado con types.ts en sesión 08.09.26), y Lovable reconstruyó el JSX por su cuenta sin avisar hasta que se le pidió explícitamente el contenido resultante para comparar. Cada vez que esto pasó, la reconstrucción de Lovable tenía déficits funcionales reales respecto al original (props reordenadas eran inofensivas; pero geolocalización, estado checkingIn anti-doble-tap y estado de carga desaparecieron en el primer intento de zonas.tsx). Nunca asumir "typecheck en verde" como equivalente a "funcionalidad intacta" tras una reconstrucción de Lovable — siempre pedir el contenido final y diff explícito antes de publicar.
- Créditos de Lovable: quedaron en 1,10 al cierre de esta sesión (empezó con 10; los 3 ciclos de reconstrucción/typecheck consumieron la mayoría). Revisar créditos disponibles al abrir la próxima sesión antes de planificar Objetivo 4B (Haversine) real, que probablemente requiera varias iteraciones de chat de Lovable.

---

## 📋 PRÓXIMA TAREA PRIORITARIA
Revisar créditos de Lovable disponibles al abrir sesión. Implementar la validación geoespacial real de checkInZone (Haversine, radio dinámico 1-50km por kind de zona) usando aura_zones.latitude/longitude y la posición ya capturada por navigator.geolocation en zonas.tsx. Pedir siempre el contenido final exacto a Lovable tras cada reconstrucción y diffearlo antes de publicar, dado el patrón de pegado corrupto de esta sesión. Después, abordar el estado de check-in en la UI de Zonas y confirmar si el mapa en blanco del primer load se repite.

---

## 🔖 ÚLTIMO COMMIT
fix: toggleHabit usa RPC atomica toggle_habit para evitar lost update — 8b6023c
