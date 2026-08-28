-- campos_golf es un catálogo compartido entre todos los organizadores (no
-- tiene organizador_id, a propósito: son campos de golf reales, no algo
-- de un club en particular), así que actualizar/borrar sigue sin
-- escoparse por organizador, igual que ya hacía el insert. Solo faltaban
-- estas dos políticas: hasta ahora un admin podía añadir campos nuevos
-- pero no editar/borrar ninguno.
create policy campos_golf_update_admin
  on campos_golf for update
  using (is_admin())
  with check (is_admin());

create policy campos_golf_delete_admin
  on campos_golf for delete
  using (is_admin());
