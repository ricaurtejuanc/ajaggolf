-- Backfill de la columna `categoria` (00000000000060) para resultados
-- guardados antes de que existiera: todos quedaron en 'unica' por defecto,
-- aunque el torneo sí tuviera categorías de premios con tramos de hándicap
-- (Primera/Segunda). El nombre de esas categorías casi nunca es literal
-- ("Categoría 1", "Hasta 12"...), así que se adivina por palabra clave y, si
-- no hay ninguna coincidencia y son exactamente dos tramos, se asume la
-- convención habitual: tramo de hándicap más bajo = Primera, más alto =
-- Segunda. Solo toca filas todavía en 'unica' (nunca pisa una categoría ya
-- elegida a mano) y solo cuando el torneo tiene tramos reales configurados.
with categorias_ordenadas as (
  select t.id as torneo_id,
         p->>'nombre' as nombre_categoria,
         (p->>'handicap_desde')::numeric as handicap_desde,
         (p->>'handicap_hasta')::numeric as handicap_hasta,
         row_number() over (partition by t.id order by (p->>'handicap_desde')::numeric nulls last) as orden,
         count(*) over (partition by t.id) as total
  from torneos t, jsonb_array_elements(t.premios) as p
  where coalesce((p->>'categoria_unica')::boolean, false) = false
    and (p->>'handicap_desde' is not null or p->>'handicap_hasta' is not null)
),
match_por_resultado as (
  select r.id as resultado_id,
         co.nombre_categoria, co.orden, co.total,
         row_number() over (
           partition by r.id
           order by
             case when (co.handicap_desde is null or r.handicap >= co.handicap_desde)
                   and (co.handicap_hasta is null or r.handicap <= co.handicap_hasta)
                  then 0 else 1 end,
             least(coalesce(abs(r.handicap - co.handicap_desde),1e9), coalesce(abs(r.handicap - co.handicap_hasta),1e9))
         ) as rn
  from resultados r
  join categorias_ordenadas co on co.torneo_id = r.torneo_id
  where r.categoria = 'unica' and r.es_clasificacion_general and r.handicap is not null
)
update resultados r
set categoria = (
  case
    when mp.nombre_categoria ilike '%dama%' then 'damas'
    when mp.nombre_categoria ilike '%senior%' or mp.nombre_categoria ilike '%sénior%' or mp.nombre_categoria ilike '%veterano%' then 'senior'
    when mp.nombre_categoria ilike '%scratch%' then 'scratch'
    when mp.nombre_categoria ilike '%segunda%' then 'segunda'
    when mp.nombre_categoria ilike '%primera%' then 'primera'
    when mp.total = 2 and mp.orden = 1 then 'primera'
    when mp.total = 2 and mp.orden = 2 then 'segunda'
    else 'unica'
  end
)::categoria_clasificacion_pdf
from match_por_resultado mp
where mp.resultado_id = r.id and mp.rn = 1;
