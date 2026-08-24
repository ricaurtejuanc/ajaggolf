-- AJAG Golf — el bucket 'resultados-pdf' se creó como no-público
-- (migración 3) pero la migración 6 ya asumía lectura pública
-- (política resultados_pdf_lectura_publica) para el botón "Ver
-- clasificación". Supabase Storage solo sirve /object/public/... si el
-- bucket en sí está marcado como público, así que el enlace nunca
-- funcionaba. Se corrige aquí.

update storage.buckets set public = true where id = 'resultados-pdf';
