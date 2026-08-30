-- Categoría de cada PDF/foto de clasificación subido. Antes solo cabía un
-- documento por torneo (el más reciente); ahora un torneo puede publicar un
-- documento por categoría (Primera, Segunda, Senior, Damas, Scratch o Única)
-- y el público elige cuál ver con un selector.
--
-- Las subidas que ya existen pasan a 'unica', que es exactamente lo que
-- significaban hasta ahora: la clasificación general del torneo, sin dividir.
create type categoria_clasificacion_pdf as enum (
  'primera',
  'segunda',
  'senior',
  'damas',
  'scratch',
  'unica'
);

alter table resultados_pdf_uploads
  add column categoria categoria_clasificacion_pdf not null default 'unica';

create index resultados_pdf_uploads_torneo_categoria_idx
  on resultados_pdf_uploads (torneo_id, categoria);
