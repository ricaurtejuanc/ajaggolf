# AfterGolf

Plataforma SaaS mobile-first para clubes y asociaciones de golf amateur:
calendario de torneos, inscripciones, pagos por Bizum, generación de
cuadros de salidas, entrada de resultados (manual, PDF/foto o XLS),
clasificaciones de liga/ranking, cuadro de honor y panel de administración.
Multi-tenant: cada club/asociación es un "organizador" con su propio
dominio, marca y contenido, aislados por Row Level Security en Supabase.

**Stack**: Next.js 16 (App Router, Turbopack) · Supabase (Postgres + Auth +
Storage + RLS) · Tailwind CSS v4 · Vercel.

## Funcionalidad

- Resolución de tenant por dominio (`src/proxy.ts`): cada organizador tiene
  su propio dominio/subdominio; el dominio "paraguas" muestra una landing
  de producto en vez del sitio de un organizador concreto.
- Auth con Google y enlace mágico por email (Supabase Auth).
- Calendario público de torneos + ficha de torneo, con inscripción (cuenta
  o invitado) y carrito de compra multi-torneo.
- Checkout con instrucciones de Bizum (número configurable por el admin),
  marcado "ya he pagado" por el usuario y confirmación manual por el
  admin. El método de pago está abstraído (`src/lib/pagos`) para poder
  añadir otros proveedores sin tocar el resto del flujo.
- Motor de generación de cuadros de salida: agrupa por hándicap o
  manualmente, respeta las peticiones de "quiero jugar con" entre
  jugadores, y exporta a PDF/XLS.
- Entrada de resultados por tres vías que confluyen en la misma tabla:
  manual, extracción automática desde un PDF/foto de clasificación
  subido, o descarga/edición/re-subida en XLS.
- Clasificación de liga/ranking, con dos modos de puntuación (tabla de
  puntos por posición, o suma directa de puntos Stableford) y cálculo de
  posiciones por categoría de hándicap con desempate.
- Cuadro de honor: premios por categoría de hándicap y premios por hoyo
  (drive más largo, bola más cercana...) de forma independiente.
- Formulario de contacto y panel de gestión de consultas (responder,
  marcar leída, eliminar), con email personalizado por organizador.
- Panel admin por organizador (`/admin`): torneos, ligas, patrocinadores,
  pedidos, consultas, configuración. Panel "god" (`/god`, solo
  super-admins) para dar de alta y gestionar organizadores.
- Analítica de visitas propia + Vercel Analytics y Speed Insights.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

Crea un proyecto en [supabase.com](https://supabase.com) y aplica las
migraciones de `supabase/migrations/` en orden (por ejemplo desde el SQL
Editor del panel de Supabase, o con la CLI: `supabase db push`).

Esto crea todas las tablas, las políticas de RLS y los buckets de Storage.

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project
  Settings → API en Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: secreta, solo para operaciones de servidor
  que deban saltarse RLS (ej. inscripción de invitados sin cuenta).
- `NEXT_PUBLIC_SITE_URL`: URL pública del sitio (usada en los redirects de
  login).
- `VISIT_IP_SALT`: cualquier cadena aleatoria, para anonimizar IPs en el
  contador de visitas.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM`:
  cuenta de correo real para el envío de emails (inscripciones, contacto,
  respuestas). Sin esto no se envía ningún email.

### 3. Configurar Google OAuth (opcional pero recomendado)

En Supabase: Authentication → Providers → Google, con las credenciales de
un proyecto de Google Cloud. La URL de redirect a autorizar en Google es
`https://<tu-proyecto>.supabase.co/auth/v1/callback`.

### 4. Dar de alta el primer organizador y su equipo admin

Un super-admin da de alta el organizador desde el panel `/god`. El equipo
de ese club/asociación necesita una fila en `usuarios_admin` para acceder
a `/admin`. Primero deben iniciar sesión una vez en la web (Google o
email) y luego, desde el SQL Editor de Supabase:

```sql
insert into usuarios_admin (user_id, nombre, email, organizador_id)
values ('<auth.users.id del usuario>', 'Nombre Apellido', 'email@ejemplo.com', '<organizadores.id>');
```

El primer super-admin (acceso a `/god`) se da de alta igual, en
`super_admins`.

### 5. Instalar dependencias y arrancar

```bash
npm install
npm run dev
```

## Despliegue

Pensado para desplegar en [Vercel](https://vercel.com): importa el
repositorio, añade las mismas variables de entorno del paso 2 y despliega.

## Estructura relevante

```
supabase/migrations/   Esquema SQL (tablas, RLS, storage), aplicado en orden numérico
src/types/database.ts  Tipos TypeScript del esquema (Database) — mantenidos a mano
src/proxy.ts            Resolución de tenant por dominio + sesión de Supabase Auth
src/lib/supabase/      Clientes de Supabase (browser/server/proxy/admin con service role)
src/lib/pagos/         Abstracción de método de pago (Bizum hoy, ampliable)
src/lib/salidas/       Motor de generación de cuadros de salida
src/lib/resultados/    Extracción de resultados desde PDF/foto
src/lib/clasificacion/ Recálculo de la clasificación global de liga/ranking
src/lib/email/         Envío de emails, personalizado por organizador
src/lib/data/          Consultas de lectura reutilizadas por varias páginas
src/app/               Rutas públicas + /admin (panel por organizador) + /god (super-admin)
```
