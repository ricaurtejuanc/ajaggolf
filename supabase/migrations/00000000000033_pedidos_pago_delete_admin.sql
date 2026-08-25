create policy pedidos_pago_delete_admin on pedidos_pago
  for delete using (is_admin());
