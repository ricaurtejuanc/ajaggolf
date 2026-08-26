-- Hasta ahora is_admin() (y por tanto las políticas de usuarios_admin) no
-- distinguía organizador: cualquier admin de cualquier club podía ver y
-- gestionar los admins de CUALQUIER otro club (documentado como pendiente
-- en la migración 00000000000019, cuando solo existía AJAG). Con un panel
-- de alta de administradores por organizador esto ya importa de verdad:
-- se cierra aquí.
create or replace function organizador_id_actual() returns uuid
language sql security definer stable
set search_path = 'public'
as $$
  select organizador_id from usuarios_admin
  where user_id = auth.uid() and activo = true
  limit 1;
$$;

drop policy usuarios_admin_select on usuarios_admin;
drop policy usuarios_admin_all on usuarios_admin;

create policy usuarios_admin_select on usuarios_admin
  for select using (is_admin() and organizador_id = organizador_id_actual());
create policy usuarios_admin_all on usuarios_admin
  for all using (is_admin() and organizador_id = organizador_id_actual())
  with check (is_admin() and organizador_id = organizador_id_actual());
