-- Algunos clubes exigen que la inscripción se haga en su propia web o en
-- una plataforma externa (Golfdirecto, NextCaddy...). Cuando está
-- rellenado, el botón "Inscribirme" lleva directamente ahí en vez de al
-- formulario de inscripción propio; su presencia (no nulo) es lo que
-- activa el modo "inscripción externa", sin necesitar una columna
-- booleana aparte.
alter table torneos add column inscripcion_url_externa text;
