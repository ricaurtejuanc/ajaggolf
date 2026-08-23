-- AJAG Golf — vista pública de la clasificación global de una liga/pool
-- Mismo patrón que `salidas_publicadas`: clasificacion_global ya es de
-- lectura pública, pero el nombre del jugador vive en `jugadores`, que
-- tiene RLS restringido. Esta vista (propiedad de postgres) expone solo
-- nombre + apellidos + hándicap junto a los puntos ya calculados.
create view clasificacion_publica as
select
  cg.liga_pool_id,
  cg.jugador_id,
  j.nombre,
  j.apellidos,
  j.handicap,
  cg.puntos_totales,
  cg.eventos_jugados
from clasificacion_global cg
join jugadores j on j.id = cg.jugador_id;

grant select on clasificacion_publica to anon, authenticated;
