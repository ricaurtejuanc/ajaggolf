-- Separa "modalidad" (individual / por parejas) del "formato" en sí: la
-- modalidad decide qué formatos tienen sentido ofrecer (individual:
-- stableford, medal play, match play; por parejas: mejor bola, scramble,
-- match play), evitando combinaciones sin sentido como "por parejas" +
-- "stableford" sin más contexto.
alter table torneos
  add column modo_juego text not null default 'individual'
  check (modo_juego in ('individual', 'parejas'));
