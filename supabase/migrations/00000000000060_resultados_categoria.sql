-- La clasificación rellenada a mano también puede dividirse por categoría
-- (Primera, Segunda, Senior, Damas, Scratch o Única), igual que el PDF/foto
-- subido por el club. Antes esta división solo existía en el formulario del
-- admin (agrupación visual por hándicap según los premios del torneo) y no
-- se guardaba: la página pública siempre mostraba todo mezclado.
--
-- Las filas que ya existen pasan a 'unica', que es lo que significaban hasta
-- ahora: la clasificación general del torneo, sin dividir.
alter table resultados
  add column categoria categoria_clasificacion_pdf not null default 'unica';

create index resultados_torneo_categoria_idx
  on resultados (torneo_id, categoria);
