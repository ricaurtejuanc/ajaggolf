-- Igual que se hizo para usuarios_admin: jugadores_select_own/update_own/
-- admin_delete comprobaban is_admin() en global, así que cualquier admin de
-- cualquier organizador podía ver/editar/borrar jugadores de cualquier
-- otro. Necesario ahora que se va a construir un panel admin de usuarios
-- registrados (que expone email/teléfono) — se escoge por organizador_id.
drop policy if exists jugadores_select_own on jugadores;
create policy jugadores_select_own on jugadores
  for select using (auth.uid() = user_id or (is_admin() and organizador_id = organizador_id_actual()));

drop policy if exists jugadores_update_own on jugadores;
create policy jugadores_update_own on jugadores
  for update using (auth.uid() = user_id or (is_admin() and organizador_id = organizador_id_actual()))
  with check (auth.uid() = user_id or (is_admin() and organizador_id = organizador_id_actual()));

drop policy if exists jugadores_admin_delete on jugadores;
create policy jugadores_admin_delete on jugadores
  for delete using (is_admin() and organizador_id = organizador_id_actual());
