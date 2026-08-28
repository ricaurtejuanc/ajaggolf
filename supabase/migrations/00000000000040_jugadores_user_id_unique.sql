-- Bug en producción: jugadores.user_id no tenía restricción unique, así
-- que una carrera en asegurarJugadorParaUsuario() (llamada sin bloqueo
-- desde más de una página/acción — "Mi cuenta", inscripción...) podía
-- crear varias fichas de jugador para el mismo usuario autenticado. La
-- página "Mi cuenta" mostraba entonces una cualquiera de ellas (a veces
-- con el nombre mal repartido entre nombre/apellidos), y guardar el
-- perfil (que actualiza por user_id) tocaba TODAS las duplicadas a la
-- vez — poner la misma licencia_federativa en más de una fila dentro del
-- mismo UPDATE viola su restricción unique, que es el error "duplicate
-- key" que vio un usuario real.

-- Limpieza de las duplicadas ya creadas por este bug: nos quedamos con la
-- fila más completa de cada usuario (la más antigua si empatan) y
-- borramos el resto. No hace falta reasignar inscripciones/resultados
-- antes de borrar: se comprobó que ninguna fila sobrante tenía ninguno.
delete from jugadores
where id in (
  select id from (
    select
      id,
      row_number() over (
        partition by user_id
        order by
          (licencia_federativa is not null) desc,
          (handicap is not null) desc,
          (sexo is not null) desc,
          (telefono is not null) desc,
          created_at asc
      ) as prioridad
    from jugadores
    where user_id is not null
  ) t
  where prioridad > 1
);

alter table jugadores add constraint jugadores_user_id_key unique (user_id);
