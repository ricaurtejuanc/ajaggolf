-- pedidos_pago_select_own / update_own / delete_admin comprobaban el
-- organizador SOLO vía las inscripciones ligadas (pedidos_pago no tenía
-- torneo_id cuando se escribieron). Desde la migración de "pagos por
-- torneo" (00000000000063) cada pedido nuevo lleva su propio
-- pedidos_pago.torneo_id, pero la policy nunca se actualizó para usarlo.
--
-- Esto rompía el borrado en dos pasos que hace la acción "Eliminar" del
-- admin (borrar primero las inscripciones, luego el pedido): al borrar
-- las inscripciones, el EXISTS que buscaba el organizador vía
-- inscripciones ya no encontraba nada y el delete del pedido quedaba
-- bloqueado por RLS sin dar error — el pedido se quedaba huérfano en vez
-- de desaparecer. Añadir el camino directo por torneo_id hace la
-- comprobación independiente de si las inscripciones siguen existiendo.
drop policy if exists pedidos_pago_select_own on pedidos_pago;
create policy pedidos_pago_select_own on pedidos_pago
  for select using (
    auth.uid() = user_id
    or (is_admin() and (
      exists (
        select 1 from torneos t
        where t.id = pedidos_pago.torneo_id and t.organizador_id = organizador_id_actual()
      )
      or exists (
        select 1 from inscripciones i join torneos t on t.id = i.torneo_id
        where i.pedido_pago_id = pedidos_pago.id and t.organizador_id = organizador_id_actual()
      )
    ))
  );

drop policy if exists pedidos_pago_update_own on pedidos_pago;
create policy pedidos_pago_update_own on pedidos_pago
  for update using (
    auth.uid() = user_id
    or (is_admin() and (
      exists (
        select 1 from torneos t
        where t.id = pedidos_pago.torneo_id and t.organizador_id = organizador_id_actual()
      )
      or exists (
        select 1 from inscripciones i join torneos t on t.id = i.torneo_id
        where i.pedido_pago_id = pedidos_pago.id and t.organizador_id = organizador_id_actual()
      )
    ))
  )
  with check (
    auth.uid() = user_id
    or (is_admin() and (
      exists (
        select 1 from torneos t
        where t.id = pedidos_pago.torneo_id and t.organizador_id = organizador_id_actual()
      )
      or exists (
        select 1 from inscripciones i join torneos t on t.id = i.torneo_id
        where i.pedido_pago_id = pedidos_pago.id and t.organizador_id = organizador_id_actual()
      )
    ))
  );

drop policy if exists pedidos_pago_delete_admin on pedidos_pago;
create policy pedidos_pago_delete_admin on pedidos_pago
  for delete using (
    is_admin() and (
      exists (
        select 1 from torneos t
        where t.id = pedidos_pago.torneo_id and t.organizador_id = organizador_id_actual()
      )
      or exists (
        select 1 from inscripciones i join torneos t on t.id = i.torneo_id
        where i.pedido_pago_id = pedidos_pago.id and t.organizador_id = organizador_id_actual()
      )
    )
  );
