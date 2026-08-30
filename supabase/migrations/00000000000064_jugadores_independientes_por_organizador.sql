-- Cada jugador es independiente por organizador: el mismo usuario (o la
-- misma licencia federativa) puede tener una ficha distinta en cada club
-- (nombre, hándicap, contacto, historial...). Antes user_id y
-- licencia_federativa eran únicos GLOBALMENTE, así que el mismo
-- usuario/licencia quedaba pegado para siempre al primer organizador en
-- el que jugó, y su ficha (con datos de ese club) se reutilizaba sin
-- querer en cualquier otro. Los datos de Campos, Tees y Slopes siguen
-- siendo compartidos entre todos los organizadores (no se tocan aquí).

alter table jugadores drop constraint jugadores_user_id_key;
alter table jugadores add constraint jugadores_user_id_organizador_id_key unique (user_id, organizador_id);

drop index jugadores_licencia_federativa_key;
create unique index jugadores_licencia_federativa_organizador_id_key
  on jugadores (licencia_federativa, organizador_id)
  where licencia_federativa is not null;
