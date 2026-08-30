-- Tee genérico para los recorridos que el catálogo de la federación no
-- valora, de modo que aparezcan también en la calculadora de hándicap en vez
-- de quedar fuera.
--
-- Se crean como "PARES 3" (par 54) por decisión del cliente. Queda anotado
-- que Golf Valdecañas, La Faisanera y Naturavila son recorridos de 18 hoyos
-- par 72, así que su hándicap de juego saldrá desviado respecto al real
-- mientras no se cargue su valoración de verdad; se corrige desde
-- /admin/campos en cuanto se tengan el CR y el slope de sus tarjetas.
--
-- CR = par y slope 113 (el slope de un campo de dificultad media) dejan la
-- fórmula en hándicap de juego = hándicap index: sin valoración real, no hay
-- nada que ajustar y es preferible a inventarse una dificultad.
--
-- No se les carga tarjeta hoyo a hoyo: sin datos reales, la vista de "hoyos
-- con golpe" no se ofrece para estos recorridos.
insert into campo_tees (federacion, club_code, club_nombre, recorrido, tee, genero, cr, slope, par)
select 'Otras', c.codigo, c.club, c.recorrido, 'PARES 3', g.genero, 54.0, 113, 54
from (values
  ('AIRGOLF', 'Air Golf Club', 'Air Golf Club'),
  ('VALDECAN', 'Isla Valdecañas', 'Golf Valdecañas'),
  ('FAISANER', 'La Faisanera', 'La Faisanera'),
  ('NATURAVI', 'Naturavila', 'Naturavila')
) as c(codigo, club, recorrido)
cross join (values ('H'), ('M')) as g(genero)
on conflict (club_code, recorrido, tee, genero) do nothing;
