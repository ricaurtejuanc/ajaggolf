-- Permite a los super-admins (/god) dar de alta/gestionar administradores
-- de CUALQUIER organizador, no solo consultarlos vía service role. Hasta
-- ahora usuarios_admin solo tenía políticas is_admin() (el propio admin de
-- ese organizador) — sirve para el autoservicio en /admin/administradores,
-- pero no para arrancar un organizador nuevo (que todavía no tiene ningún
-- admin) desde /god, que hoy exige un insert manual por SQL Editor. Mismo
-- patrón que ya tiene organizadores (políticas dedicadas is_super_admin()
-- además de las de is_admin(), no en su lugar). "for all" ya cubre select.
create policy usuarios_admin_all_super_admin on usuarios_admin
  for all using (is_super_admin())
  with check (is_super_admin());
