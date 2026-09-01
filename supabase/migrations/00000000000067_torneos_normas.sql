-- Normas del torneo: texto largo, opcional, que el admin escribe al crear
-- o editar un torneo y que en la ficha pública se muestra en una ventana
-- emergente (NormasModal) en vez de inline, para no alargar la página con
-- un bloque de texto largo cuando el jugador no necesita leerlo.
alter table torneos add column normas text;
