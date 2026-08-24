-- AJAG Golf — nombre del ganador/es de cada premio (drive más largo, par 3
-- más cercano, etc.), que se rellena junto a la clasificación de cada
-- torneo. Clave "{indiceCategoria}-{indicePremio}" -> nombre del ganador.

alter table torneos add column premios_ganadores jsonb not null default '{}'::jsonb;
