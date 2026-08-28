-- Orden manual de patrocinadores (antes solo alfabético). Se rellena con
-- el orden alfabético actual por organizador para no cambiar nada a la
-- vista la primera vez que se despliega esto.
alter table patrocinadores add column orden integer not null default 0;

with numerados as (
  select id, row_number() over (partition by organizador_id order by nombre) as posicion
  from patrocinadores
)
update patrocinadores p
set orden = numerados.posicion
from numerados
where numerados.id = p.id;
