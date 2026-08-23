-- AJAG Golf — vista pública del cuadro de salidas
-- `inscripciones` también tiene RLS restringido a su dueño o al admin, así
-- que el embed anónimo grupo_salida_jugadores -> inscripciones -> jugadores
-- no devuelve nada para un visitante. Esta vista (propiedad de postgres)
-- hace el join completo y filtra ella misma por salidas ya publicadas, así
-- que nunca expone el borrador de una salida sin publicar.
--
-- El linter de seguridad de Supabase marca esto como "Security Definer
-- View" (nivel ERROR) porque, por construcción, cualquier vista que salte
-- el RLS de sus tablas base se marca así. Es intencional y está acotado:
-- solo expone nombre + hándicap (nunca email/teléfono/licencia/user_id) y
-- el propio WHERE de la vista impide ver una salida en borrador. No hay
-- forma de restringir columnas con una policy RLS normal (es por fila, no
-- por columna), así que este patrón —documentado por el propio
-- Supabase— es la vía correcta para "subconjunto público de una tabla
-- sensible".
create view salidas_publicadas as
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
  j.handicap
from salidas s
join grupos_salida gs on gs.salida_id = s.id
left join grupo_salida_jugadores gsj on gsj.grupo_salida_id = gs.id
left join inscripciones i on i.id = gsj.inscripcion_id
left join jugadores j on j.id = i.jugador_id
where s.estado = 'publicado';

grant select on salidas_publicadas to anon, authenticated;
