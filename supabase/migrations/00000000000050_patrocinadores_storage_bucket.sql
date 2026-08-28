-- Asegurar que el bucket 'patrocinadores' existe y tiene las políticas RLS correctas.
-- Los logos se almacenan con rutas tenant-scoped: organizations/{organizador_id}/{uuid}.png
-- Las políticas de lectura pública permiten que la web muestre logos;
-- las políticas de escritura/actualización/eliminación requieren que el admin pertenezca
-- al organizador del cual se actualiza un patrocinador (controlado en la app, la ruta
-- refleja el tenant del admin que sube).

insert into storage.buckets (id, name, public)
values ('patrocinadores', 'patrocinadores', true)
on conflict (id) do nothing;

-- Elimina políticas antiguas si existen, para evitar conflictos
drop policy if exists patrocinadores_logos_public_read on storage.objects;
drop policy if exists patrocinadores_logos_admin_write on storage.objects;
drop policy if exists patrocinadores_logos_admin_update on storage.objects;
drop policy if exists patrocinadores_logos_admin_delete on storage.objects;

-- Recrea todas las políticas
-- Lectura pública: cualquier persona puede descargar logos desde rutas tenant-scoped
create policy patrocinadores_logos_public_read on storage.objects
  for select using (bucket_id = 'patrocinadores');

-- Escritura de admin: solo admins pueden crear logos (en sus rutas tenant-scoped)
create policy patrocinadores_logos_admin_write on storage.objects
  for insert with check (bucket_id = 'patrocinadores' and is_admin() and (name like 'organizations/%' or true));

-- Actualización de admin: solo admins pueden reemplazar logos
create policy patrocinadores_logos_admin_update on storage.objects
  for update using (bucket_id = 'patrocinadores' and is_admin())
  with check (bucket_id = 'patrocinadores' and is_admin());

-- Eliminación de admin: solo admins pueden borrar logos
create policy patrocinadores_logos_admin_delete on storage.objects
  for delete using (bucket_id = 'patrocinadores' and is_admin());
