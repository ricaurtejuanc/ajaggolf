-- Catálogo oficial de valoraciones de campo (RFEG): CR/Slope por barra y la
-- tarjeta hoyo a hoyo. Alimenta la calculadora de hándicap, que hasta ahora
-- obligaba al jugador a teclear a mano el CR, el slope y el par.
--
-- Es tabla de referencia global, no de un organizador: los datos son de la
-- federación y los mismos para todos los clubes de la plataforma (igual
-- criterio que `campos_golf`, que ya es global). Por eso la lectura es
-- pública y la escritura no se abre a los admins: se carga por migración.
--
-- Los hoyos cuelgan del tee, no del recorrido, porque los metros cambian de
-- una barra a otra; el par y el índice se repiten, pero separarlos obligaría
-- a un join más en la única consulta que importa.
create table campo_tees (
  id uuid primary key default gen_random_uuid(),
  federacion text not null,
  club_code text not null,
  club_nombre text not null,
  recorrido text not null,
  tee text not null,
  -- 'H' / 'M': una misma barra tiene valoración distinta según el género.
  genero text not null check (genero in ('H', 'M')),
  -- Valoración del campo (Course Rating) y de la pendiente (Slope). El suelo
  -- nominal del WHS es 55, pero el catálogo oficial trae un 54 en un
  -- recorrido de pares 3: manda el dato real.
  cr numeric(4,1) not null,
  slope integer not null check (slope between 50 and 155),
  par integer not null,
  created_at timestamptz not null default now(),
  unique (club_code, recorrido, tee, genero)
);

create index campo_tees_club_idx on campo_tees (club_nombre);

create table campo_hoyos (
  campo_tee_id uuid not null references campo_tees(id) on delete cascade,
  hoyo integer not null check (hoyo between 1 and 18),
  metros integer not null,
  par integer not null,
  -- Índice de hándicap del hoyo: 1 el más difícil, 18 el más fácil. Es lo
  -- que decide en qué hoyos recibe golpes el jugador.
  hcp integer not null check (hcp between 1 and 18),
  primary key (campo_tee_id, hoyo)
);

alter table campo_tees enable row level security;
alter table campo_hoyos enable row level security;

create policy campo_tees_select_publico on campo_tees for select using (true);
create policy campo_hoyos_select_publico on campo_hoyos for select using (true);
