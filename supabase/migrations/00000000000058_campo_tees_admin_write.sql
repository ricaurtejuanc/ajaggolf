-- El catálogo de valoraciones se cargó por migración desde los ficheros de la
-- federación, así que solo tenía lectura pública. Ahora se mantiene también
-- desde /admin/campos: mismas políticas que campos_golf, que es el otro
-- catálogo compartido entre organizadores (sin organizador_id a propósito:
-- los campos y sus valoraciones son los mismos para todos los clubes, así que
-- cualquier admin mantiene el catálogo común).
create policy campo_tees_insert_admin on campo_tees for insert with check (is_admin());
create policy campo_tees_update_admin on campo_tees for update using (is_admin()) with check (is_admin());
create policy campo_tees_delete_admin on campo_tees for delete using (is_admin());

-- Los hoyos cuelgan del tee y se borran con él (on delete cascade); se
-- permite mantenerlos por si un club corrige su tarjeta.
create policy campo_hoyos_insert_admin on campo_hoyos for insert with check (is_admin());
create policy campo_hoyos_update_admin on campo_hoyos for update using (is_admin()) with check (is_admin());
create policy campo_hoyos_delete_admin on campo_hoyos for delete using (is_admin());
