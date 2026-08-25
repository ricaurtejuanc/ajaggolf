create policy consultas_contacto_delete_admin on consultas_contacto
  for delete using (is_admin());
