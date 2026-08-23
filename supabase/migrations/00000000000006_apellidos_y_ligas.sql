-- AJAG Golf — apellidos + limpieza de ligas/pool
--
-- 1) Separa nombre/apellidos en jugadores (el brief original ya lo pedía;
--    se simplificó a un solo campo "nombre" en la Fase 1 por error).
alter table jugadores add column apellidos text not null default '';
alter table jugadores alter column apellidos drop default;

-- 2) `liga_pool_eventos` era una tabla puente que nunca se llegó a rellenar
--    (el formulario de torneos siempre usó torneos.liga_pool_id). Tener dos
--    mecanismos para la misma relación es la fuente del bug por el que la
--    página de una liga nunca mostraba sus torneos. Se elimina y
--    torneos.liga_pool_id queda como única fuente de verdad.
drop table if exists liga_pool_eventos;

-- 3) Permite lectura pública del PDF/foto de clasificación ya publicado
--    (para el botón "Ver clasificación" en la ficha del torneo).
create policy resultados_pdf_uploads_select_publicado on resultados_pdf_uploads
  for select using (estado = 'publicado' or is_admin());

-- 4) El bucket de storage de esos documentos también debe poder leerse
--    públicamente (misma postura que "posters": la escritura sigue
--    restringida a admin).
create policy resultados_pdf_lectura_publica on storage.objects
  for select using (bucket_id = 'resultados-pdf');
