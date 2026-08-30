-- Rondas guardadas por cada jugador desde la calculadora de hándicap.
--
-- Los datos del campo y del tee se guardan copiados (course_rating, slope,
-- par, nombre del campo) en vez de referenciados: una ronda es un hecho
-- histórico y tiene que seguir leyéndose igual dentro de años, aunque el
-- campo se remida y cambie su valoración, o aunque se borre del catálogo.
-- Es el mismo criterio que ya usa inscripciones.handicap_snapshot.
create table rondas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Club desde cuyo sitio se guardó. Informativo: la ronda es del jugador,
  -- no del club, así que si el organizador desaparece la ronda se queda.
  organizador_id uuid references organizadores(id) on delete set null,

  fecha date not null default current_date,
  campo text not null,
  recorrido text,
  tee text,

  course_rating numeric(4,1) not null,
  slope_rating integer not null check (slope_rating between 55 and 155),
  par integer not null,

  handicap_index numeric(4,1) not null,
  modalidad numeric(3,2) not null default 1,
  handicap_juego integer not null,

  bruto integer not null,
  pcc integer not null default 0,
  golpes_recibidos integer not null,
  neto integer not null,
  puntos_stableford integer not null,
  differential numeric(4,1) not null,

  created_at timestamptz not null default now()
);

create index rondas_user_fecha_idx on rondas (user_id, fecha desc);

-- Una ronda es privada de quien la juega: ni otros jugadores ni los admins
-- del club la ven. No hay política para is_admin() a propósito.
alter table rondas enable row level security;

create policy rondas_propias_select on rondas
  for select using (user_id = auth.uid());

create policy rondas_propias_insert on rondas
  for insert with check (user_id = auth.uid());

create policy rondas_propias_delete on rondas
  for delete using (user_id = auth.uid());
