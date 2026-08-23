-- AJAG Golf — esquema inicial
-- Convenciones: nombres de tablas y columnas en español, snake_case.
-- Los importes se guardan en céntimos de euro (integer) para evitar errores de coma flotante.

-- =========================================================
-- EXTENSIONES
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- TIPOS ENUMERADOS
-- =========================================================
create type sexo_jugador as enum ('masculino', 'femenino');

create type formato_puntuacion as enum ('stableford', 'medal_play');

create type modo_salida as enum ('consecutivo', 'shotgun');

create type modo_asignacion_salida as enum ('handicap', 'manual', 'mixto');

create type estado_torneo as enum ('borrador', 'publicado', 'cerrado', 'finalizado');

create type estado_inscripcion as enum ('carrito', 'pendiente_pago', 'confirmada', 'cancelada');

create type metodo_pago as enum ('bizum', 'stripe');

create type estado_pedido_pago as enum (
  'pendiente_confirmacion', -- pedido creado, esperando bizum
  'marcado_pagado',         -- el usuario ha marcado "ya he pagado"
  'confirmado',             -- el admin ha confirmado el ingreso
  'rechazado',              -- el admin ha revisado y no encuentra el pago
  'cancelado'                -- el usuario o admin cancela el pedido
);

create type estado_salida as enum ('borrador', 'publicado');

create type estado_resultado as enum ('preview', 'publicado');

create type estado_pdf_resultados as enum ('preview', 'publicado', 'descartado');

create type rol_admin as enum ('admin');

-- =========================================================
-- USUARIOS_ADMIN
-- Usuarios con acceso al panel de administración (3-4 personas).
-- Se vincula 1-a-1 con auth.users. El login individual permite trazabilidad.
-- =========================================================
create table usuarios_admin (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  rol rol_admin not null default 'admin',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table usuarios_admin is 'Personas con acceso al panel de administración de AJAG Golf.';

-- =========================================================
-- CONFIGURACION
-- Clave/valor editable desde el panel admin (ej. número de Bizum).
-- =========================================================
create table configuracion (
  clave text primary key,
  valor jsonb not null,
  actualizado_por uuid references usuarios_admin (id),
  updated_at timestamptz not null default now()
);

insert into configuracion (clave, valor) values
  ('bizum_numero', '"633 88 10 27 4"'),
  ('tabla_puntos_defecto', '{"1":25,"2":20,"3":18,"4":16,"5":14,"6":12,"7":10,"8":8,"9":6,"10":4}');

-- =========================================================
-- JUGADORES
-- Registro/histórico de jugadores (no todos tienen cuenta: p.ej. acompañantes
-- añadidos por otro jugador en el formulario de inscripción).
-- =========================================================
create table jugadores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  nombre text not null,
  email text,
  licencia_federativa text,
  sexo sexo_jugador,
  handicap numeric(4, 1),
  telefono text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index jugadores_licencia_federativa_key
  on jugadores (licencia_federativa)
  where licencia_federativa is not null;

create index jugadores_user_id_idx on jugadores (user_id);
create index jugadores_email_idx on jugadores (email);

-- =========================================================
-- LIGAS_POOL
-- Una liga/pool agrupa varios torneos; la clasificación global es la suma
-- de puntos por posición obtenidos en cada evento que la compone.
-- =========================================================
create table ligas_pool (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  descripcion text,
  temporada text,
  tabla_puntos jsonb not null default '{"1":25,"2":20,"3":18,"4":16,"5":14,"6":12,"7":10,"8":8,"9":6,"10":4}',
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================
-- TORNEOS
-- =========================================================
create table torneos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  descripcion text,
  info_adicional text,
  campo_golf text not null,
  tees text[] not null default '{}',
  fecha date not null,
  hora_inicio time,
  poster_url text,
  precio_cents integer not null default 0,
  cupo_maximo integer,
  formato_puntuacion formato_puntuacion not null default 'stableford',
  modo_salida modo_salida not null default 'consecutivo',
  modo_asignacion_salida modo_asignacion_salida not null default 'handicap',
  liga_pool_id uuid references ligas_pool (id) on delete set null,
  estado estado_torneo not null default 'borrador',
  created_by uuid references usuarios_admin (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index torneos_fecha_idx on torneos (fecha);
create index torneos_estado_idx on torneos (estado);
create index torneos_liga_pool_id_idx on torneos (liga_pool_id);

-- =========================================================
-- PEDIDOS_PAGO
-- Un pedido puede agrupar varias inscripciones (p.ej. te inscribes tú y
-- pagas también la de un acompañante en el mismo carrito).
-- El método de pago es un campo, no lógica hardcodeada: añadir Stripe en el
-- futuro es un método de pago más, sin tocar el resto del flujo.
-- =========================================================
create table pedidos_pago (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  metodo_pago metodo_pago not null default 'bizum',
  estado estado_pedido_pago not null default 'pendiente_confirmacion',
  total_cents integer not null default 0,
  referencia_pago text,
  notas_admin text,
  marcado_pagado_at timestamptz,
  confirmado_at timestamptz,
  confirmado_por uuid references usuarios_admin (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pedidos_pago_user_id_idx on pedidos_pago (user_id);
create index pedidos_pago_estado_idx on pedidos_pago (estado);

-- =========================================================
-- INSCRIPCIONES
-- Una fila por jugador y torneo. "juega_con_licencias" recoge lo indicado
-- en el formulario ("¿Juegas con alguien en la partida?"); el motor de
-- salidas (fase 2) la usa para generar avisos si entra en conflicto con el
-- criterio de agrupación elegido, pero nunca decide solo.
-- =========================================================
create table inscripciones (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos (id) on delete cascade,
  jugador_id uuid not null references jugadores (id) on delete restrict,
  pedido_pago_id uuid references pedidos_pago (id) on delete set null,
  sexo sexo_jugador,
  licencia_federativa text,
  handicap_snapshot numeric(4, 1),
  juega_con_licencias text[] not null default '{}',
  precio_cents integer not null default 0,
  estado estado_inscripcion not null default 'carrito',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (torneo_id, jugador_id)
);

create index inscripciones_torneo_id_idx on inscripciones (torneo_id);
create index inscripciones_jugador_id_idx on inscripciones (jugador_id);
create index inscripciones_pedido_pago_id_idx on inscripciones (pedido_pago_id);
create index inscripciones_estado_idx on inscripciones (estado);

-- =========================================================
-- SALIDAS
-- Una salida por torneo (el cuadro completo). Guarda el modo elegido y su
-- configuración específica:
--  - consecutivo: { "hora_inicio": "08:00", "intervalo_minutos": 10 }
--  - shotgun: { "hoyos_salida": [1,10], "hoyos_doblados": [1,10] }
-- =========================================================
create table salidas (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null unique references torneos (id) on delete cascade,
  modo modo_salida not null,
  config jsonb not null default '{}',
  modo_asignacion modo_asignacion_salida not null,
  estado estado_salida not null default 'borrador',
  generado_at timestamptz,
  publicado_at timestamptz,
  created_by uuid references usuarios_admin (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- GRUPOS_SALIDA
-- Grupos de 3-4 jugadores dentro de una salida.
-- =========================================================
create table grupos_salida (
  id uuid primary key default gen_random_uuid(),
  salida_id uuid not null references salidas (id) on delete cascade,
  numero_grupo integer not null,
  hoyo_salida integer not null default 1,
  hora_salida time,
  notas text,
  created_at timestamptz not null default now(),
  unique (salida_id, numero_grupo)
);

-- Tabla puente (no listada explícitamente en el brief, pero necesaria para
-- poder editar/consultar qué jugador está en qué grupo sin depender de un
-- jsonb difícil de mantener desde el panel admin).
create table grupo_salida_jugadores (
  id uuid primary key default gen_random_uuid(),
  grupo_salida_id uuid not null references grupos_salida (id) on delete cascade,
  inscripcion_id uuid not null references inscripciones (id) on delete cascade,
  orden integer not null default 1,
  conflicto_juega_con boolean not null default false,
  conflicto_detalle text,
  created_at timestamptz not null default now(),
  unique (grupo_salida_id, inscripcion_id),
  unique (inscripcion_id)
);

create index grupo_salida_jugadores_grupo_idx on grupo_salida_jugadores (grupo_salida_id);

-- =========================================================
-- RESULTADOS_PDF_UPLOADS
-- Guarda el PDF original subido (auditoría) y el mapeo de columnas usado
-- para esa importación concreta, antes de confirmar la publicación.
-- =========================================================
create table resultados_pdf_uploads (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos (id) on delete cascade,
  storage_path text not null,
  nombre_archivo text not null,
  proveedor_origen text, -- 'golfshot' | 'buk' | 'rfeg' | 'otro' (informativo)
  mapeo_columnas jsonb not null default '{}',
  filas_extraidas jsonb not null default '[]',
  estado estado_pdf_resultados not null default 'preview',
  subido_por uuid references usuarios_admin (id),
  created_at timestamptz not null default now(),
  publicado_at timestamptz
);

create index resultados_pdf_uploads_torneo_id_idx on resultados_pdf_uploads (torneo_id);

-- =========================================================
-- RESULTADOS
-- =========================================================
create table resultados (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos (id) on delete cascade,
  jugador_id uuid references jugadores (id) on delete set null,
  inscripcion_id uuid references inscripciones (id) on delete set null,
  posicion integer,
  nombre_mostrado text not null,
  licencia_federativa text,
  handicap numeric(4, 1),
  puntos numeric(6, 2),
  golpes numeric(6, 2),
  estado estado_resultado not null default 'preview',
  pdf_origen_id uuid references resultados_pdf_uploads (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resultados_torneo_id_idx on resultados (torneo_id);
create index resultados_jugador_id_idx on resultados (jugador_id);
create index resultados_estado_idx on resultados (estado);

-- =========================================================
-- LIGA_POOL_EVENTOS
-- Tabla puente entre ligas_pool y torneos (qué eventos componen una liga).
-- =========================================================
create table liga_pool_eventos (
  id uuid primary key default gen_random_uuid(),
  liga_pool_id uuid not null references ligas_pool (id) on delete cascade,
  torneo_id uuid not null references torneos (id) on delete cascade,
  orden integer,
  created_at timestamptz not null default now(),
  unique (liga_pool_id, torneo_id)
);

-- =========================================================
-- CLASIFICACION_GLOBAL
-- Caché recalculada cuando se publican resultados de un torneo de la liga.
-- =========================================================
create table clasificacion_global (
  id uuid primary key default gen_random_uuid(),
  liga_pool_id uuid not null references ligas_pool (id) on delete cascade,
  jugador_id uuid not null references jugadores (id) on delete cascade,
  puntos_totales numeric(8, 2) not null default 0,
  eventos_jugados integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (liga_pool_id, jugador_id)
);

create index clasificacion_global_liga_pool_id_idx on clasificacion_global (liga_pool_id);

-- =========================================================
-- VISITAS_WEB
-- Contador propio de visitas (analítica básica, sin GA).
-- =========================================================
create table visitas_web (
  id bigint generated always as identity primary key,
  ruta text not null,
  referrer text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index visitas_web_ruta_idx on visitas_web (ruta);
create index visitas_web_created_at_idx on visitas_web (created_at);

-- =========================================================
-- CONSULTAS_CONTACTO
-- =========================================================
create table consultas_contacto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  mensaje text not null,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

create index consultas_contacto_leido_idx on consultas_contacto (leido);

-- =========================================================
-- FUNCIONES AUXILIARES
-- =========================================================

-- Comprueba si el usuario autenticado actual es un admin activo.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuarios_admin
    where user_id = auth.uid() and activo = true
  );
$$;

-- Mantiene updated_at al día en cada UPDATE.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_jugadores_updated_at before update on jugadores
  for each row execute function set_updated_at();
create trigger trg_torneos_updated_at before update on torneos
  for each row execute function set_updated_at();
create trigger trg_pedidos_pago_updated_at before update on pedidos_pago
  for each row execute function set_updated_at();
create trigger trg_inscripciones_updated_at before update on inscripciones
  for each row execute function set_updated_at();
create trigger trg_salidas_updated_at before update on salidas
  for each row execute function set_updated_at();
create trigger trg_resultados_updated_at before update on resultados
  for each row execute function set_updated_at();
