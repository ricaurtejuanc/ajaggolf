-- AJAG Golf — premios estructurados por categoría/hándicap, y horarios en
-- PDF para torneos disputados (cuando el club manda el cuadro en PDF en
-- vez de generarlo la propia app).

alter table torneos add column premios jsonb not null default '[]'::jsonb;
alter table torneos add column horarios_pdf_url text;

insert into storage.buckets (id, name, public)
values ('horarios', 'horarios', true)
on conflict (id) do nothing;

create policy horarios_public_read on storage.objects
  for select using (bucket_id = 'horarios');

create policy horarios_admin_write on storage.objects
  for insert with check (bucket_id = 'horarios' and is_admin());

create policy horarios_admin_update on storage.objects
  for update using (bucket_id = 'horarios' and is_admin())
  with check (bucket_id = 'horarios' and is_admin());

create policy horarios_admin_delete on storage.objects
  for delete using (bucket_id = 'horarios' and is_admin());
