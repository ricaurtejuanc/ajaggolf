-- AJAG Golf — tee(s) de salida por defecto cuando el torneo es de modo
-- "consecutivo" (Tee 1, Tee 10 o ambos). Se guarda como preferencia del
-- torneo, igual que modo_salida/modo_asignacion_salida, y se usa para
-- preseleccionar las casillas al generar el cuadro de salidas.
alter table torneos
  add column tees_consecutivo integer[] not null default '{1}';
