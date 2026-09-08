# AuraFarm — Session State
_Última actualización: 08.09.26_

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

---

## 🔴 PENDIENTES — Alta prioridad
- Objetivo 5, terminar: pedir a Lovable que aplique en su editor el mismo aura-pass.tsx ya hecho en el Codespace, para probar el pago desde el preview de Lovable (único sitio con SUPABASE_SERVICE_ROLE_KEY).
- Realizar el primer pago de prueba (tarjeta 4242 4242 4242 4242) y confirmar que el webhook activa pass_active/multiplier en profiles.
- Revisar créditos de Lovable al abrir sesión — quedaba 1 crédito al cierre.

---

## 🟡 PENDIENTES — Media prioridad
- Objetivo 5.1 — Aura Master (14,99€/mes, x3): repetir patrón de Aura Pass. Explícitamente pospuesto por Jesús.
- Objetivo 6: confirmar si /conectar sigue con el error de carga o ya quedó resuelto.
- Verificar Google OAuth end-to-end en dominio final.
- Borrar/reutilizar OAuth App de GitHub sin usar (Client ID Ov23liIjtq7POpEfPNkN).
- Confirmar en próxima sesión que repomix-focused-*.xml quedó correctamente en .gitignore.

---

## 🔵 PENDIENTES — Baja prioridad / post-launch
- Cambiar paleta de color de AuraFarm para diferenciarla de VibeRadar.
- Arreglar "lost update" de toggleHabit con RPC atómica.
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

---

## 📋 PRÓXIMA TAREA PRIORITARIA
Pedir a Lovable que aplique el aura-pass.tsx actualizado en su propio editor para completar la prueba end-to-end del pago de Aura Pass desde el preview de Lovable. Revisar créditos disponibles antes de empezar (quedaba 1 al cierre). Después, continuar con Objetivo 5.1 (Aura Master) si hay margen, o pasar a Objetivo 6 y tareas de Media prioridad.

---

## 🔖 ÚLTIMO COMMIT
feat: integracion completa de Stripe para Aura Pass (checkout + webhook) — d19974c (fusionado de rama TERMINAL a main, pushed a origin/main)
