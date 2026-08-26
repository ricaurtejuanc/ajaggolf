-- Añade el total de puntos en bruto (todos los resultados sumados, sin
-- limitar a los mejores N) a la clasificación global de cada liga, para
-- poder mostrarlo junto a la columna oficial "Mejores Resultados" (que
-- sigue siendo puntos_totales: la que decide el orden del ranking cuando
-- la liga limita a los mejores N).
alter table clasificacion_global
  add column puntos_totales_brutos numeric(8, 2) not null default 0;

drop view if exists clasificacion_publica;
create view clasificacion_publica as
select
  cg.liga_pool_id,
  cg.jugador_id,
  j.nombre,
  j.apellidos,
  j.handicap,
  cg.puntos_totales,
  cg.puntos_totales_brutos,
  cg.eventos_jugados
from clasificacion_global cg
join jugadores j on j.id = cg.jugador_id;

grant select on clasificacion_publica to anon, authenticated;
