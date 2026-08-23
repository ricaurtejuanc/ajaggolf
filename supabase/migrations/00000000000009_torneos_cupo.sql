-- AJAG Golf — vista pública del recuento de inscritos por torneo
-- `inscripciones` tiene RLS restringido a su dueño o al admin, así que
-- contar inscritos de TODOS los jugadores (para el cupo máximo y las
-- plazas disponibles) no funciona con el cliente normal: cada visitante
-- solo ve sus propias filas. Esta vista (propiedad de postgres) agrega el
-- recuento sin exponer ninguna fila ni dato personal, solo el total por
-- torneo, así que es segura para lectura pública.
create view torneos_cupo as
select
  torneo_id,
  count(*) filter (where estado in ('pendiente_pago', 'confirmada'))::int as inscritos
from inscripciones
group by torneo_id;

grant select on torneos_cupo to anon, authenticated;
