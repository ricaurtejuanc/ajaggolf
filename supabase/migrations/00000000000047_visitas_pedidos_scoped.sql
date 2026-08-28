-- visitas_web: no tenía organizador_id en absoluto (solo ruta/referrer),
-- así que /admin (resumen) mostraba las visitas de TODOS los
-- organizadores mezcladas. Se añade la columna (nullable: las filas
-- históricas se quedan sin organizador, ya no distinguibles con certeza)
-- y se escoge la política de admin igual que el resto.
alter table visitas_web add column organizador_id uuid references organizadores(id);

drop policy if exists visitas_web_select_admin on visitas_web;
create policy visitas_web_select_admin on visitas_web
  for select using (is_admin() and organizador_id = organizador_id_actual());

-- pedidos_pago: is_admin() a secas para la rama de admin (cualquier admin
-- veía/editaba/borraba pagos de cualquier organizador). No tiene
-- organizador_id propio ni torneo_id directo — un pedido agrupa
-- inscripciones (inscripciones.pedido_pago_id) que sí llevan a un torneo,
-- así que se escoge por ahí: visible para el admin si AL MENOS UNA de sus
-- inscripciones es de su organizador (un carrito mezclando torneos de dos
-- organizadores distintos es un caso límite que hoy el esquema no impide,
-- pero no es el caso normal).
drop policy if exists pedidos_pago_select_own on pedidos_pago;
create policy pedidos_pago_select_own on pedidos_pago
  for select using (
    auth.uid() = user_id
    or (is_admin() and exists (
      select 1 from inscripciones i
      join torneos t on t.id = i.torneo_id
      where i.pedido_pago_id = pedidos_pago.id and t.organizador_id = organizador_id_actual()
    ))
  );

drop policy if exists pedidos_pago_update_own on pedidos_pago;
create policy pedidos_pago_update_own on pedidos_pago
  for update using (
    auth.uid() = user_id
    or (is_admin() and exists (
      select 1 from inscripciones i
      join torneos t on t.id = i.torneo_id
      where i.pedido_pago_id = pedidos_pago.id and t.organizador_id = organizador_id_actual()
    ))
  )
  with check (
    auth.uid() = user_id
    or (is_admin() and exists (
      select 1 from inscripciones i
      join torneos t on t.id = i.torneo_id
      where i.pedido_pago_id = pedidos_pago.id and t.organizador_id = organizador_id_actual()
    ))
  );

drop policy if exists pedidos_pago_delete_admin on pedidos_pago;
create policy pedidos_pago_delete_admin on pedidos_pago
  for delete using (is_admin() and exists (
    select 1 from inscripciones i
    join torneos t on t.id = i.torneo_id
    where i.pedido_pago_id = pedidos_pago.id and t.organizador_id = organizador_id_actual()
  ));
