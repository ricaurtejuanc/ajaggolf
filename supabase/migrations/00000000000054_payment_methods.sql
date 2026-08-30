-- Actualizar tipo enum metodo_pago para incluir transferencia y tarjeta
alter type metodo_pago add value 'transferencia' before 'stripe';
alter type metodo_pago add value 'tarjeta' before 'stripe';

-- Agregar campos de pago a organizadores
alter table organizadores add column bizum_numero text;
alter table organizadores add column bizum_nombre text;
alter table organizadores add column transferencia_numero text;
alter table organizadores add column transferencia_nombre text;
