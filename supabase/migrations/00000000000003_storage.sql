-- AJAG Golf — Storage buckets
-- 'posters': imágenes de torneos, público para lectura, escritura solo admin.
-- 'resultados-pdf': PDFs originales de clasificaciones, privado (solo admin).

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('resultados-pdf', 'resultados-pdf', false)
on conflict (id) do nothing;

create policy posters_public_read on storage.objects
  for select using (bucket_id = 'posters');

create policy posters_admin_write on storage.objects
  for insert with check (bucket_id = 'posters' and is_admin());

create policy posters_admin_update on storage.objects
  for update using (bucket_id = 'posters' and is_admin())
  with check (bucket_id = 'posters' and is_admin());

create policy posters_admin_delete on storage.objects
  for delete using (bucket_id = 'posters' and is_admin());

create policy resultados_pdf_admin_all on storage.objects
  for all using (bucket_id = 'resultados-pdf' and is_admin())
  with check (bucket_id = 'resultados-pdf' and is_admin());
