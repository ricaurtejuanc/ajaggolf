-- AJAG Golf — imagen y reglas para ligas/pool.

alter table ligas_pool add column imagen_url text;
alter table ligas_pool add column reglas text;

insert into storage.buckets (id, name, public)
values ('ligas', 'ligas', true)
on conflict (id) do nothing;

create policy ligas_imagenes_public_read on storage.objects
  for select using (bucket_id = 'ligas');

create policy ligas_imagenes_admin_write on storage.objects
  for insert with check (bucket_id = 'ligas' and is_admin());

create policy ligas_imagenes_admin_update on storage.objects
  for update using (bucket_id = 'ligas' and is_admin())
  with check (bucket_id = 'ligas' and is_admin());

create policy ligas_imagenes_admin_delete on storage.objects
  for delete using (bucket_id = 'ligas' and is_admin());
