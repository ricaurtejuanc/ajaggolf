# AJAG Golf

Web mobile-first para la Asociación de Jugadores Amateur de Golf (AJAG):
calendario de torneos, inscripciones, pagos por Bizum, generación de
salidas, clasificaciones y panel de administración.

**Stack**: Next.js (App Router) · Supabase (Postgres + Auth + Storage) · Tailwind CSS v4 · Vercel.

## Estado del proyecto — Fase 1 (completada)

- Esquema de base de datos completo (`supabase/migrations/`), incluyendo
  tablas de fases futuras (salidas, resultados por PDF, ligas) para no tener
  que migrar más adelante.
- Auth con Google y enlace mágico por email (Supabase Auth).
- Calendario público de torneos + ficha de torneo.
- Formulario de inscripción (con la pregunta "¿juegas con alguien?") y
  carrito de compra.
- Checkout con instrucciones de Bizum (número editable desde el panel
  admin), marcado "ya he pagado" por el usuario y confirmación manual por
  el admin. El método de pago está abstraído (`src/lib/pagos`) para poder
  añadir Stripe más adelante sin tocar el resto del flujo.
- Formulario de contacto.
- Panel admin básico: CRUD de torneos (con subida de póster), confirmación
  de pagos, consultas de contacto, número de Bizum configurable, resumen
  con contadores.

**Pendiente** (fases 2-4, según el plan acordado): motor de generación de
salidas, parsing de PDF de clasificaciones, clasificación de ligas/pool
calculada a partir de resultados, analítica más completa.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

Crea un proyecto en [supabase.com](https://supabase.com) y aplica las
migraciones de `supabase/migrations/` en orden (por ejemplo desde el SQL
Editor del panel de Supabase, o con la CLI: `supabase db push`).

Esto crea todas las tablas, las políticas de RLS y los buckets de Storage
(`posters` público, `resultados-pdf` privado).

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project
  Settings → API en Supabase.
- `NEXT_PUBLIC_SITE_URL`: URL pública del sitio (usada en los redirects de
  login).
- `VISIT_IP_SALT`: cualquier cadena aleatoria, para anonimizar IPs en el
  contador de visitas.

### 3. Configurar Google OAuth (opcional pero recomendado)

En Supabase: Authentication → Providers → Google, con las credenciales de
un proyecto de Google Cloud. La URL de redirect a autorizar en Google es
`https://<tu-proyecto>.supabase.co/auth/v1/callback`.

### 4. Dar de alta a los administradores

Los 3-4 organizadores necesitan una fila en `usuarios_admin` para acceder
al panel `/admin`. Primero deben iniciar sesión una vez en la web (Google o
email) y luego, desde el SQL Editor de Supabase:

```sql
insert into usuarios_admin (user_id, nombre, email)
values ('<auth.users.id del usuario>', 'Nombre Apellido', 'email@ejemplo.com');
```

### 5. Instalar dependencias y arrancar

```bash
npm install
npm run dev
```

## Despliegue

Pensado para desplegar en [Vercel](https://vercel.com): importa el
repositorio, añade las mismas variables de entorno del paso 2 y despliega.
El middleware/proxy de Supabase Auth funciona igual en Edge Runtime.

## Estructura relevante

```
supabase/migrations/   Esquema SQL (tablas, RLS, storage)
src/types/database.ts  Tipos TypeScript del esquema (Database)
src/lib/supabase/      Clientes de Supabase (browser/server/middleware)
src/lib/pagos/         Abstracción de método de pago (Bizum hoy, Stripe después)
src/lib/data/          Consultas de lectura reutilizadas por varias páginas
src/app/               Rutas públicas + /admin (panel de administración)
```
