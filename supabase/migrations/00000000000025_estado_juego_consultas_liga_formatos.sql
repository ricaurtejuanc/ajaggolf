-- Estado de juego de un resultado: retirado o no presentado, distinto de
-- no haber introducido todavía la posición/puntos de un jugador.
alter table resultados
  add column estado_juego text;
alter table resultados
  add constraint resultados_estado_juego_check
  check (estado_juego is null or estado_juego in ('retirado', 'no_presentado'));

-- Respuesta del admin a una consulta de contacto, para poder responder
-- desde el panel sin salir a un cliente de correo aparte.
alter table consultas_contacto
  add column respuesta text,
  add column respondido_at timestamptz;

-- Una liga/pool puede repartir puntos por posición (tabla configurable,
-- como hasta ahora) o simplemente sumar los puntos stableford que cada
-- jugador hace en cada torneo.
alter table ligas_pool
  add column modo_puntuacion text not null default 'tabla_puntos';
alter table ligas_pool
  add constraint ligas_pool_modo_puntuacion_check
  check (modo_puntuacion in ('tabla_puntos', 'suma_stableford'));

-- Formatos de juego adicionales a Stableford y Medal Play.
alter type formato_puntuacion add value 'parejas';
alter type formato_puntuacion add value 'mejor_bola';
alter type formato_puntuacion add value 'scramble';
