-- Revierte el backfill de 00000000000061: el reparto Primera/Segunda por
-- tramo de hándicap (sin nombre explícito en la categoría de premios) no
-- coincidía con el reparto real que el club maneja. Se quita la lógica de
-- adivinar por posición del tramo (solo queda el reconocimiento por nombre
-- explícito: "Damas", "Senior", "Scratch", "Primera", "Segunda"), y aquí se
-- revierte el único dato que quedó mal categorizado por ese motivo, para que
-- el admin lo reparta a mano fila a fila desde el panel.
update resultados
set categoria = 'unica'
where torneo_id = '688210b4-1477-40d3-be37-10452570bbbf'
  and categoria in ('primera', 'segunda');
