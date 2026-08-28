-- current_setting('request.headers', true) puede devolver '' (no solo
-- NULL) si el GUC está definido pero vacío; '' ::json revienta antes de
-- que el nullif de más arriba pueda hacer nada. Se protege con un nullif
-- previo al cast, en las dos funciones que lo usan.
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
      nullif(nullif(current_setting('request.headers', true), '')::json->>'x-organizador-id', '') is null
      or ua.organizador_id::text = nullif(current_setting('request.headers', true), '')::json->>'x-organizador-id'
    )
  limit 1;
$$;

create or replace function organizador_id_dominio()
returns uuid
language sql
stable
as $$
  select nullif(
    nullif(current_setting('request.headers', true), '')::json->>'x-organizador-id',
    ''
  )::uuid;
$$;
