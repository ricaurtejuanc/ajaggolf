-- Premios "por hoyo" (drive más largo, bola más cercana...) son una
-- categoría de premio distinta a las de handicap/posición: no se ganan por
-- clasificación sino por golpe en un hoyo concreto, y puede haber varios
-- del mismo tipo (uno por cada par 3, por ejemplo). Se guardan aparte de
-- "premios" (categorías por handicap) para poder mostrarlos en su propia
-- sección con el hoyo como dato propio, no como texto suelto en el nombre.
alter table torneos
  add column premios_hoyo jsonb not null default '[]'::jsonb;
