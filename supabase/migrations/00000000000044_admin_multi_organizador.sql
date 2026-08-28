-- Una misma persona puede ser administrador de VARIOS organizadores (el
-- dueño de la plataforma, por ejemplo, necesita poder administrar
-- cualquiera). Hasta ahora usuarios_admin.user_id era UNIQUE a secas, así
-- que una segunda fila para el mismo user_id (aunque fuera de otro
-- organizador) chocaba con la restricción. Pasa a ser único por
-- (user_id, organizador_id): sigue sin poder haber dos filas para la misma
-- persona en el MISMO organizador, pero sí una por cada organizador que
-- administre.
alter table usuarios_admin drop constraint usuarios_admin_user_id_key;
alter table usuarios_admin add constraint usuarios_admin_user_id_organizador_id_key unique (user_id, organizador_id);

-- organizador_id_actual() hacía "limit 1" sobre las filas de usuarios_admin
-- de la persona, sin más criterio: con un solo organizador por persona
-- daba igual cuál tocara, pero con varios era arbitrario/no determinista —
-- podía devolver el organizador equivocado y filtrar mal cualquier
-- consulta de /admin (torneos, ligas, patrocinadores...). Ahora, si la
-- petición trae el organizador resuelto por dominio (cabecera
-- x-organizador-id, la misma que ya pone proxy.ts y que el cliente de
-- Supabase del servidor reenvía), se usa esa para desambiguar cuando la
-- persona administra más de un organizador — pero SOLO si de verdad es
-- admin activo de ese organizador; la cabecera nunca concede acceso por sí
-- sola, solo elige entre las filas que ya tiene esa persona. Sin cabecera
-- (llamadas directas a la API, tests...), sigue cogiendo la única/primera
-- que tenga, como antes.
create or replace function organizador_id_actual()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select ua.organizador_id
  from usuarios_admin ua
  where ua.user_id = auth.uid()
    and ua.activo = true
    and (
      nullif(current_setting('request.headers', true)::json->>'x-organizador-id', '') is null
      or ua.organizador_id::text = current_setting('request.headers', true)::json->>'x-organizador-id'
    )
  limit 1;
$$;
