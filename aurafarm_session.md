# AuraFarm — Session State
_Última actualización: 07.09.26_

---

## Stack
TanStack Start (React 19) · TypeScript · Tailwind CSS v4 · Supabase JS (vía Lovable Cloud, backend gestionado — sin dashboard directo en supabase.com) · Vite 8 · Shadcn UI (Radix) · lucide-react.
Repo: jesuslopezmorales/aurafarm. Codespace: /workspaces/aurasync (nombre de carpeta heredado, el repo y el proyecto ya se llaman aurafarm). Dominio comprado: getaurafarmapp.com (Squarespace, sin DNS/hosting configurado todavía).

**PASO 0 OBLIGATORIO — antes de cualquier acción:**
npx repomix --output "repomix-focused-[DD.MM.YY]_1.xml" --include "src/**/*.ts,src/**/*.tsx"
Adjuntar XML a Claude Chat antes de tocar código.

---

## ✅ TAREAS COMPLETADAS

### Sesión 07.09.26 (primera sesión)
- Objetivo 1 — Rebrand AuraSync → AuraFarm: COMPLETADO. 12 archivos (manifest.webmanifest, AppShell.tsx, mcp/index.ts, mcp/supabase.ts, __root.tsx, auth.tsx, aura-pass.tsx, zonas.tsx, conectar.tsx, perfil.tsx, [.]lovable.oauth.consent.tsx, index.tsx). drizzle/migrations intencionalmente NO tocado (tag de migración 0000_aurasync_core_schema coincide con el nombre físico del .sql, renombrarlo requiere regenerar metadatos de Drizzle — pospuesto). Verificado con grep -ri "aurasync" sin resultados fuera de drizzle/migrations. Commit 7a75227.
- Entorno: Codespace no tenía git inicializado (proyecto exportado desde Lovable como ZIP suelto). git init + commit inicial + conexión a github.com/jesuslopezmorales/aurafarm (repo ya existía con solo un README, creado desde la web de GitHub) + merge de historiales divergentes (conflicto en README.md resuelto a favor del contenido de Lovable). Claude Code instalado en el Codespace vía npm install -g @anthropic-ai/claude-code.
- Variables de entorno: el Codespace no tenía .env (Lovable las inyecta automáticamente en su propio entorno, no en Codespaces externos). SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY recuperadas inspeccionando la pestaña Network del navegador en la vista previa de Lovable (petición de signup, headers apikey y :authority). SUPABASE_URL real no es un dominio *.supabase.co sino un proxy propio de Lovable Cloud: https://c--e8a7cf70-2a10-456a-ae79-76817fff3370-prod.lovable.cloud — creado .env con VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Corregido en commit posterior: .env se coló en el primer commit por no estar en .gitignore — eliminado del tracking y añadido a .gitignore (commit 6d95eb7). La clave expuesta es la publishable/anon key, diseñada para ser pública — sin riesgo real, pero mala práctica corregida.
- Objetivo 2 — Autenticación real: email/contraseña VERIFICADO end-to-end en producción (Lovable preview): registro con jlopezmorales@hotmail.com, email de confirmación recibido y verificado, login funcional, sesión persistente. Google OAuth: implementado (usa el broker propio de Lovable, @lovable.dev/cloud-auth-js, archivo auto-generado no editable) pero NO verificado con éxito — falla en bucle en URLs de vista previa (id-preview--...lovable.app) y en el Codespace; solo debería funcionar de forma fiable en el dominio publicado final. GitHub OAuth: DESCARTADO — el broker de Lovable Cloud solo soporta "google" | "apple" | "microsoft" | "lovable" como proveedores, no GitHub (confirmado en los tipos del paquete @lovable.dev/cloud-auth-js). Se llegó a crear una OAuth App en GitHub para AuraFarm (Client ID Ov23liIjtq7POpEfPNkN) antes de descubrir la limitación — queda sin usar, se puede borrar cuando se quiera.
- Objetivo 3 — Perfil interactivo, PARTE A completada: aura-store.tsx reescrito para cargar profiles/habits/habit_logs reales de Supabase cuando hay sesión activa (antes todo era estado inventado en memoria). Nuevas funciones addHabit y updateDisplayName. perfil.tsx: nombre editable inline (icono lápiz + input + confirmar/cancelar) y formulario nuevo para crear hábitos/deslices personalizados. Verificado en producción: nombre "Jesús" persiste tras recargar, hábito "Prueba de hábito" +100 creado y marcado como hecho, Aura sube a 100 y persiste tras recargar. PARTE B pendiente (avatar_url y bio no existen como columnas en profiles — requiere migración de esquema vía chat de Lovable, bloqueado por falta de créditos en el momento del cierre).
- Objetivo 4 — Zonas con check-in real, PARTE A completada: aura_zones ahora se carga desde la base de datos real (antes era un array fijo en código) en vez de datos de ejemplo. Nueva función checkInZone en el store: inserta en zone_checkins si hay sesión, con toast de aviso si no la hay. Añadido límite de un check-in por zona y por día natural (consulta previa por rango de created_at, sin necesitar columna nueva) — con fallback "fail-open" si la consulta previa falla (deja pasar el check-in en vez de bloquear al usuario por un error transitorio). Geolocalización del navegador solicitada en segundo plano al entrar en la pantalla (permiso, sin persistir coordenadas todavía). Verificado en producción: 5 zonas reales visibles, check-in funcional, segundo check-in mismo día en la misma zona correctamente bloqueado con toast "Ya hiciste check-in aquí hoy". PARTE B pendiente (aura_zones no tiene columnas latitude/longitude reales — la validación de proximidad real con fórmula Haversine, rango dinámico 1-50 km, no se puede implementar sin ellas — requiere migración de esquema vía chat de Lovable).
- Dominio: comprado getaurafarmapp.com en Squarespace (12,60€ primer año, 18€/año renovación). Se descartaron por no disponibilidad: aurafarm.com/.io/.co/.app(coincide con una app de streaming ya existente con el mismo nombre)/.live/.me/.gg/.club/.fun/.pro/.cc/.net/.games, y variantes getaurafarm.com/myaurafarm.com/farmaura.com/aurafarming.com/aurafarmapp.com. Sin configurar DNS/hosting todavía.
- Riesgo detectado y aceptado por Jesús para más adelante: "lost update" en toggleHabit (aura-store.tsx) — escribe profiles.aura como valor absoluto calculado en el cliente, no como incremento atómico; con dos pestañas abiertas a la vez editando aura simultáneamente se puede perder un incremento. Impacto bajo (uso de un único usuario, sin corrupción de datos ni fuga entre usuarios). Solución futura: mover el cálculo a una función RPC de Postgres que haga UPDATE profiles SET aura = aura + delta de forma atómica en el servidor.
- Observación de marca pendiente de decisión: la paleta de color actual de AuraFarm (morado/violeta) se parece bastante a la paleta "Urban Night" de VibeRadar (#1F1A23/#9947EB/#7575F0) — coincidencia de tendencia visual, no copia real (Lovable no tenía acceso a VibeRadar). Recomendación pendiente de aplicar cuando se aborde diseño explícitamente: cambiar el eje de color de AuraFarm a algo fuera de morado/violeta (ej. verde-lima + naranja, o ámbar + rojo) para diferenciar el porfolio. No aplicado — congelación estética respetada.

---

## 🔴 PENDIENTES — Alta prioridad
- Objetivo 3, Parte B: añadir columnas avatar_url y bio a la tabla profiles (vía chat de Lovable, consume créditos), implementar edición de avatar y biografía en perfil.tsx.
- Objetivo 4, Parte B: añadir columnas latitude/longitude reales a aura_zones (vía chat de Lovable, consume créditos), implementar validación de proximidad real con Haversine y rango dinámico 1-50 km antes de permitir check-in.
- Confirmar que el commit del límite de check-in (uno por zona/día) quedó correctamente subido en el commit de cierre de esta sesión (se implementó y verificó en la sesión pero no se había commiteado todavía al momento de escribir este archivo).

---

## 🟡 PENDIENTES — Media prioridad
- Objetivo 5: Stripe / Aura Pass. Reutilizar profiles.pass_active y profiles.multiplier ya existentes si se aborda sin tabla nueva; si se quiere un sistema de suscripciones serio (tabla subscriptions, historial, renovaciones), es una migración de esquema aparte (mismo bloqueo de créditos de Lovable) y varias sesiones de trabajo, no una tarde.
- Objetivo 6: reparar el error crítico de carga en la sección "Conectar" (ruta /conectar) — posiblemente ya resuelto como efecto colateral de añadir las variables de entorno (SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY) en la sesión de hoy; confirmar explícitamente en la próxima sesión.
- Verificar Google OAuth end-to-end una vez la app esté publicada en su dominio final (getaurafarmapp.com), ya que en vista previa/Codespace no se pudo completar el flujo.
- Borrar (o reutilizar en otro proyecto) la OAuth App de GitHub creada para AuraFarm y ya no usada (Client ID Ov23liIjtq7POpEfPNkN).

---

## 🔵 PENDIENTES — Baja prioridad / post-launch
- Cambiar la paleta de color de AuraFarm para diferenciarla de VibeRadar (ver nota de marca en TAREAS COMPLETADAS).
- Arreglar el "lost update" de toggleHabit con una función RPC atómica en Postgres.
- Configurar DNS/hosting del dominio getaurafarmapp.com una vez la app esté lista para publicarse.
- Evaluar si merece la pena en algún momento conseguir LOVABLE_DB_MIGRATION_URL (bloqueado tras plan Enterprise de Lovable, "Secretos de compilación") para tener acceso directo de backup/exportación a la base de datos real, sin migrar fuera de Lovable Cloud.

---

## 🧠 APRENDIZAJES TÉCNICOS

### Sesión 07.09.26
- Un proyecto exportado desde Lovable como ZIP no incluye carpeta .git — hay que inicializar git desde cero en el Codespace y reconectar manualmente al repo remoto, aunque el repo de GitHub ya exista.
- Lovable Cloud es un backend gestionado (proxy propio delante de Supabase, dominio *.lovable.cloud, no *.supabase.co) — no hay dashboard de supabase.com al que acceder directamente para este tipo de proyecto, ni acceso de base de datos SQL directo salvo con plan Enterprise (LOVABLE_DB_MIGRATION_URL, bajo "Secretos de compilación").
- El broker de autenticación de Lovable (@lovable.dev/cloud-auth-js) solo soporta google/apple/microsoft/lovable como proveedores OAuth — comprobar siempre los tipos del paquete antes de asumir que un proveedor está disponible.
- Las claves publishable/anon de Supabase son seguras de tener en el cliente por diseño (protegidas por RLS) — si aparecen expuestas en un commit de git por accidente, no es una fuga crítica, pero se corrige igualmente por higiene (eliminar del tracking + .gitignore).
- Cuando faltan variables de entorno de Supabase en un entorno de desarrollo que sí funciona en otro (ej. Lovable preview), se pueden recuperar sin acceso al backend inspeccionando la pestaña Network del navegador en el entorno que sí funciona: la URL de la petición revela SUPABASE_URL, y la cabecera apikey revela la publishable key.
- Cambios de esquema de base de datos en un proyecto Lovable Cloud solo se pueden hacer vía el chat de IA de Lovable (consume créditos) — no hay vía alternativa gratuita salvo plan Enterprise. Cualquier objetivo que implique columnas o tablas nuevas debe dividirse en "parte sin coste" (lógica de aplicación contra el esquema ya existente) y "parte bloqueada" (requiere créditos).
- Antes de dar una tarea por cerrada, comprobar git status — en esta sesión el arreglo del límite de check-in se implementó y verificó funcionalmente pero se quedó sin commitear hasta el cierre.

---

## 📋 PRÓXIMA TAREA PRIORITARIA
Decidir por dónde empezar la próxima sesión: (a) Objetivo 3 y 4, Parte B juntas (añadir avatar_url/bio a profiles y latitude/longitude a aura_zones en la misma sesión de chat con Lovable, ya que ambas requieren créditos y conviene agruparlas), o (b) Objetivo 5 (Stripe/Aura Pass) si Jesús prefiere avanzar en algo que no dependa de créditos de Lovable. Confirmar con Jesús al abrir sesión.

---

## 🔖 ÚLTIMO COMMIT
fix: límite de un check-in por zona y día en checkInZone + docs: cierre sesión 07.09.26
