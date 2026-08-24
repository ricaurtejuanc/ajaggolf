-- Distingue las filas de "resultados" que forman parte de la clasificación
-- general publicada de un torneo (subida a mano, fila a fila) de las que
-- solo existen para marcar el puesto de un jugador que puntúa para una
-- liga/pool ("Puestos que puntúan para la liga"). Antes ambas se guardaban
-- igual y la web pública mostraba como "clasificación general" una tabla
-- con solo 10 posiciones (las que puntúan para la liga), que no es lo
-- mismo que la clasificación completa del torneo.
alter table resultados
  add column es_clasificacion_general boolean not null default true;

-- Los datos ya existentes en este proyecto de pruebas son únicamente los
-- puestos generados para la liga (no una clasificación general subida a
-- mano), así que se marcan como tal.
update resultados set es_clasificacion_general = false;
