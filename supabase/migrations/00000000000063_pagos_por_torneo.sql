-- Migración: Pagos por torneo
-- Anteriormente los pedidos de pago eran genéricos. Ahora cada pedido está
-- asociado a un torneo específico para poder filtrar y gestionar pagos por torneo.

alter table pedidos_pago
add column torneo_id uuid references torneos (id) on delete cascade;

-- Crear índice para consultas rápidas por torneo
create index pedidos_pago_torneo_id_idx on pedidos_pago (torneo_id);

-- Actualizar políticas RLS para que los pagos también estén scoped por organizador a través del torneo
-- (Se hará en una migración de RLS si es necesario, aunque actualmente pedidos_pago
-- tiene RLS por user_id/super_admin, no por organizador_id)
