-- AJAG Golf / AfterGolf Torneos — primeros cimientos multi-tenant.
--
-- Objetivo de esta migración: preparar el esquema para que la app deje de
-- ser "solo AJAG" y pase a soportar N organizadores (clubs/asociaciones),
-- SIN romper nada de lo que ya funciona en producción hoy:
--   - Se añade `organizador_id` como columna NULLABLE con DEFAULT al
--     organizador AJAG, así el código actual (que todavía no lo envía en
--     sus inserts) sigue funcionando exactamente igual.
--   - No se toca ninguna política RLS existente todavía: is_admin() sigue
--     igual de restrictiva que antes (solo admins), simplemente ahora sus
--     filas también quedan etiquetadas con el organizador.
--   - No hay resolución de tenant por dominio/subdominio todavía; eso es
--     un paso posterior (middleware) que se hará con más calma.
--
-- Tablas que NO llevan organizador_id (a propósito):
--   - campos_golf: catálogo genérico de campos de España, compartido por
--     todos los organizadores.
--   - inscripciones, pedidos_pago, salidas, grupos_salida,
--     grupo_salida_jugadores, resultados, resultados_pdf_uploads,
--     clasificacion_global, visitas_web: se derivan de torneos/jugadores,
--     que ya llevan organizador_id — no hace falta denormalizar todavía.

-- =========================================================
-- ORGANIZADORES
-- =========================================================
create table organizadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  logo_url text,
  color_primario text,
  dominio text,
  email_contacto text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table organizadores enable row level security;

-- =========================================================
-- SUPER_ADMINS (panel "god", gestiona organizadores)
-- =========================================================
create table super_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  nombre text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table super_admins enable row level security;

create or replace function is_super_admin() returns boolean
language sql security definer stable
set search_path = 'public'
as $$
  select exists (
    select 1 from super_admins where user_id = auth.uid()
  );
$$;

create policy "super_admins_select_propio"
  on super_admins for select
  using (is_super_admin());

create policy "organizadores_select_super_admin"
  on organizadores for select
  using (is_super_admin());

create policy "organizadores_insert_super_admin"
  on organizadores for insert
  with check (is_super_admin());

create policy "organizadores_update_super_admin"
  on organizadores for update
  using (is_super_admin())
  with check (is_super_admin());

insert into storage.buckets (id, name, public)
values ('organizadores', 'organizadores', true)
on conflict (id) do nothing;

create policy organizadores_logos_public_read on storage.objects
  for select using (bucket_id = 'organizadores');

create policy organizadores_logos_super_admin_write on storage.objects
  for insert with check (bucket_id = 'organizadores' and is_super_admin());

create policy organizadores_logos_super_admin_update on storage.objects
  for update using (bucket_id = 'organizadores' and is_super_admin())
  with check (bucket_id = 'organizadores' and is_super_admin());

create policy organizadores_logos_super_admin_delete on storage.objects
  for delete using (bucket_id = 'organizadores' and is_super_admin());

-- =========================================================
-- Sembrar AJAG como organizador inicial y dar de alta al super admin
-- (mismo usuario que ya es admin único de AJAG).
-- =========================================================
insert into organizadores (nombre, slug, activo, email_contacto)
values ('AJAG', 'ajag', true, 'ricaurtejuanc@gmail.com');

insert into super_admins (user_id, nombre, email)
select ua.user_id, ua.nombre, ua.email
from usuarios_admin ua
where ua.email = 'ricaurtejuanc@gmail.com';

-- =========================================================
-- organizador_id (nullable, default = AJAG) en las tablas de contenido
-- propio de cada organizador. Backfill inmediato de lo ya existente.
-- =========================================================
do $$
declare
  ajag_id uuid;
begin
  select id into ajag_id from organizadores where slug = 'ajag';

  execute format(
    'alter table usuarios_admin add column organizador_id uuid references organizadores(id) default %L',
    ajag_id
  );
  execute format(
    'alter table torneos add column organizador_id uuid references organizadores(id) default %L',
    ajag_id
  );
  execute format(
    'alter table ligas_pool add column organizador_id uuid references organizadores(id) default %L',
    ajag_id
  );
  execute format(
    'alter table jugadores add column organizador_id uuid references organizadores(id) default %L',
    ajag_id
  );
  execute format(
    'alter table patrocinadores add column organizador_id uuid references organizadores(id) default %L',
    ajag_id
  );
  execute format(
    'alter table configuracion add column organizador_id uuid references organizadores(id) default %L',
    ajag_id
  );
  execute format(
    'alter table consultas_contacto add column organizador_id uuid references organizadores(id) default %L',
    ajag_id
  );

  update usuarios_admin set organizador_id = ajag_id where organizador_id is null;
  update torneos set organizador_id = ajag_id where organizador_id is null;
  update ligas_pool set organizador_id = ajag_id where organizador_id is null;
  update jugadores set organizador_id = ajag_id where organizador_id is null;
  update patrocinadores set organizador_id = ajag_id where organizador_id is null;
  update configuracion set organizador_id = ajag_id where organizador_id is null;
  update consultas_contacto set organizador_id = ajag_id where organizador_id is null;
end $$;

create index torneos_organizador_id_idx on torneos (organizador_id);
create index ligas_pool_organizador_id_idx on ligas_pool (organizador_id);
create index jugadores_organizador_id_idx on jugadores (organizador_id);
create index usuarios_admin_organizador_id_idx on usuarios_admin (organizador_id);
