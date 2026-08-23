-- AJAG Golf — añade apellidos a la vista pública de salidas
-- (se añade al final: CREATE OR REPLACE VIEW no permite insertar una
-- columna en medio de las existentes, solo añadir al final o al principio
-- del SELECT si no reordena las que ya había).
create or replace view salidas_publicadas as
select
  s.torneo_id,
  s.id as salida_id,
  s.modo,
  gs.id as grupo_salida_id,
  gs.numero_grupo,
  gs.hoyo_salida,
  gs.hora_salida,
  gsj.id as grupo_salida_jugador_id,
  j.nombre,
  j.handicap,
  j.apellidos
from salidas s
join grupos_salida gs on gs.salida_id = s.id
left join grupo_salida_jugadores gsj on gsj.grupo_salida_id = gs.id
left join inscripciones i on i.id = gsj.inscripcion_id
left join jugadores j on j.id = i.jugador_id
where s.estado = 'publicado';
