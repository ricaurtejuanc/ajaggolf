alter table ligas_pool
  drop constraint ligas_pool_modo_puntuacion_check;
alter table ligas_pool
  add constraint ligas_pool_modo_puntuacion_check
  check (modo_puntuacion in ('tabla_puntos', 'suma_stableford', 'suma_medal_handicap'));

-- Si se rellena, la puntuación final de cada jugador es la suma de sus X
-- mejores resultados (no todos los torneos jugados). Null = cuentan todos.
alter table ligas_pool
  add column mejores_n_torneos integer;
alter table ligas_pool
  add constraint ligas_pool_mejores_n_torneos_check
  check (mejores_n_torneos is null or mejores_n_torneos > 0);
