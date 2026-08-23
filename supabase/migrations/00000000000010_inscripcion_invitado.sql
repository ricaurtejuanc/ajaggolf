-- AJAG Golf — inscripción de invitado sin cuenta
-- `pedidos_pago.user_id` era NOT NULL porque todo pedido se creaba desde
-- una sesión autenticada. Ahora un visitante puede inscribirse sin crear
-- ninguna cuenta (ni siquiera anónima): el servidor inserta el jugador,
-- la inscripción y el pedido directamente con la service role key,
-- saltándose RLS igual que hace el panel de admin. Ese pedido no tiene
-- usuario detrás, así que user_id debe admitir null.
alter table pedidos_pago alter column user_id drop not null;
