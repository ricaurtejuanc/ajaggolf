-- AJAG Golf — punto focal del póster (en % del ancho/alto de la imagen),
-- para que el organizador controle qué parte se ve cuando el póster se
-- recorta en miniatura (tarjetas del calendario, cabecera de la ficha).
alter table torneos
  add column poster_focal_x integer not null default 50,
  add column poster_focal_y integer not null default 50;
