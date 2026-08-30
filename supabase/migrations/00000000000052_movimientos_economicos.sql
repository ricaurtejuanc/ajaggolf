-- ERP sencillo por organizador: ingresos/gastos y beneficio, global y por
-- torneo.
--
-- Decisión de diseño: el ingreso por inscripciones NO se guarda aquí. Se
-- calcula siempre sumando inscripciones.precio_cents de las confirmadas del
-- torneo, que es el dato autoritativo y ya se mantiene solo. Duplicarlo como
-- fila manual invitaría a que ambas cifras divergieran (una inscripción
-- cancelada o un pago confirmado tarde dejarían la contabilidad mintiendo).
-- Esta tabla guarda únicamente lo que nadie más sabe: gastos (pago al club,
-- regalos, catering...) e ingresos que no pasan por la web (patrocinios,
-- cobros en mano).
--
-- torneo_id nulo = movimiento general del organizador (no imputable a un
-- torneo concreto): cuotas, seguros, gastos de estructura.

create type tipo_movimiento as enum ('ingreso', 'gasto');

create table movimientos_economicos (
  id uuid primary key default gen_random_uuid(),
  organizador_id uuid not null references organizadores(id) on delete cascade,
  torneo_id uuid references torneos(id) on delete cascade,
  tipo tipo_movimiento not null,
  -- Catálogo de categorías en la app (src/lib/economia/categorias.ts) y no
  -- como enum de Postgres: añadir una categoría nueva es entonces un cambio
  -- de una línea en TypeScript, sin migración ni redeploy de esquema.
  categoria text not null,
  concepto text not null,
  importe_cents integer not null check (importe_cents >= 0),
  fecha date not null default current_date,
  notas text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index movimientos_economicos_organizador_fecha_idx
  on movimientos_economicos (organizador_id, fecha desc);
create index movimientos_economicos_torneo_idx
  on movimientos_economicos (torneo_id);

create trigger movimientos_economicos_updated_at
  before update on movimientos_economicos
  for each row execute function set_updated_at();

-- Datos económicos: no hay lectura pública ninguna, solo el admin del
-- organizador al que pertenecen (mismo patrón scoped de la 041).
alter table movimientos_economicos enable row level security;

create policy movimientos_economicos_admin_all on movimientos_economicos
  for all using (is_admin() and organizador_id = organizador_id_actual())
  with check (is_admin() and organizador_id = organizador_id_actual());
