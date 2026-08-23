-- AJAG Golf — modo de pago del torneo
-- El organizador elige, al crear/editar un torneo, si el pago se hace a
-- través suyo (Bizum, requiere que un admin confirme el ingreso a mano) o
-- directamente en el club el día del torneo. En este segundo caso la
-- inscripción queda confirmada de inmediato, sin pasar por "pendiente de
-- pago".
create type modo_pago_torneo as enum ('organizador', 'club');

alter table torneos
  add column modo_pago modo_pago_torneo not null default 'organizador';

-- Nuevo método de pago para pedidos_pago cuando el torneo es "pago en
-- club" (no se usa en esta misma migración, así que es seguro añadirlo
-- fuera de una transacción que ya lo necesite).
alter type metodo_pago add value 'club';
