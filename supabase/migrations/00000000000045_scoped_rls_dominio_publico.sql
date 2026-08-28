-- Seguía habiendo un hueco real: las políticas "públicas" (torneos ya
-- publicados, ligas activas, patrocinadores, resultados/salidas
-- publicados, configuración...) tenían un OR sin ningún filtro de
-- organizador ("estado = 'publicado' OR ...", "activa = true OR ...",
-- "true" a secas en patrocinadores/configuracion/clasificacion_global).
-- Es justo lo que necesita CUALQUIER visitante anónimo (nunca tuvo
-- organizador_id_actual(), porque no es admin de nada), pero esa misma
-- rama, sin más, dejaba pasar TODOS los organizadores mezclados — el panel
-- admin de TGEA, aunque ya entraba correctamente como admin de TGEA
-- (fix anterior), seguía viendo los torneos/ligas ya publicados de AJAG
-- porque esa rama "pública" del OR los admitía sin mirar de quién eran.
--
-- organizador_id_dominio() añade lo que faltaba: lee el organizador
-- resuelto por dominio (cabecera x-organizador-id, la misma que ya usa
-- organizador_id_actual()) SIN comprobar que quien pregunta sea admin de
-- nada — vale para acotar qué es "público aquí", no para autorizar
-- escritura. Sin cabecera (API directa, tests) no filtra, igual que antes.
create or replace function organizador_id_dominio()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.headers', true)::json->>'x-organizador-id', '')::uuid;
$$;

-- torneos
drop policy if exists torneos_select_publicados on torneos;
create policy torneos_select_publicados on torneos
  for select using (
    (estado in ('publicado', 'cerrado', 'finalizado')
      and (organizador_id_dominio() is null or organizador_id = organizador_id_dominio()))
    or (is_admin() and organizador_id = organizador_id_actual())
  );

-- ligas_pool
drop policy if exists ligas_pool_select on ligas_pool;
create policy ligas_pool_select on ligas_pool
  for select using (
    (activa = true and (organizador_id_dominio() is null or organizador_id = organizador_id_dominio()))
    or (is_admin() and organizador_id = organizador_id_actual())
  );

-- patrocinadores
drop policy if exists patrocinadores_select_publico on patrocinadores;
create policy patrocinadores_select_publico on patrocinadores
  for select using (organizador_id_dominio() is null or organizador_id = organizador_id_dominio());

-- configuracion
drop policy if exists configuracion_select on configuracion;
create policy configuracion_select on configuracion
  for select using (organizador_id_dominio() is null or organizador_id = organizador_id_dominio());

-- clasificacion_global (vía ligas_pool.organizador_id)
drop policy if exists clasificacion_global_select on clasificacion_global;
create policy clasificacion_global_select on clasificacion_global
  for select using (
    organizador_id_dominio() is null
    or exists (
      select 1 from ligas_pool lp
      where lp.id = clasificacion_global.liga_pool_id and lp.organizador_id = organizador_id_dominio()
    )
  );

-- resultados (vía torneos.organizador_id)
drop policy if exists resultados_select on resultados;
create policy resultados_select on resultados
  for select using (
    (estado = 'publicado' and exists (
      select 1 from torneos t
      where t.id = resultados.torneo_id
        and (organizador_id_dominio() is null or t.organizador_id = organizador_id_dominio())
    ))
    or (is_admin() and exists (
      select 1 from torneos t
      where t.id = resultados.torneo_id and t.organizador_id = organizador_id_actual()
    ))
  );

-- resultados_pdf_uploads (vía torneos.organizador_id)
drop policy if exists resultados_pdf_uploads_select_publicado on resultados_pdf_uploads;
create policy resultados_pdf_uploads_select_publicado on resultados_pdf_uploads
  for select using (
    (estado = 'publicado' and exists (
      select 1 from torneos t
      where t.id = resultados_pdf_uploads.torneo_id
        and (organizador_id_dominio() is null or t.organizador_id = organizador_id_dominio())
    ))
    or (is_admin() and exists (
      select 1 from torneos t
      where t.id = resultados_pdf_uploads.torneo_id and t.organizador_id = organizador_id_actual()
    ))
  );

-- salidas (vía torneos.organizador_id)
drop policy if exists salidas_select on salidas;
create policy salidas_select on salidas
  for select using (
    (estado = 'publicado' and exists (
      select 1 from torneos t
      where t.id = salidas.torneo_id
        and (organizador_id_dominio() is null or t.organizador_id = organizador_id_dominio())
    ))
    or (is_admin() and exists (
      select 1 from torneos t
      where t.id = salidas.torneo_id and t.organizador_id = organizador_id_actual()
    ))
  );

-- grupos_salida (vía salidas -> torneos.organizador_id)
drop policy if exists grupos_salida_select on grupos_salida;
create policy grupos_salida_select on grupos_salida
  for select using (
    exists (
      select 1 from salidas s join torneos t on t.id = s.torneo_id
      where s.id = grupos_salida.salida_id
        and s.estado = 'publicado'
        and (organizador_id_dominio() is null or t.organizador_id = organizador_id_dominio())
    )
    or (is_admin() and exists (
      select 1 from salidas s join torneos t on t.id = s.torneo_id
      where s.id = grupos_salida.salida_id and t.organizador_id = organizador_id_actual()
    ))
  );

-- grupo_salida_jugadores (vía grupos_salida -> salidas -> torneos.organizador_id)
drop policy if exists grupo_salida_jugadores_select on grupo_salida_jugadores;
create policy grupo_salida_jugadores_select on grupo_salida_jugadores
  for select using (
    exists (
      select 1 from grupos_salida g
      join salidas s on s.id = g.salida_id
      join torneos t on t.id = s.torneo_id
      where g.id = grupo_salida_jugadores.grupo_salida_id
        and s.estado = 'publicado'
        and (organizador_id_dominio() is null or t.organizador_id = organizador_id_dominio())
    )
    or (is_admin() and exists (
      select 1 from grupos_salida g
      join salidas s on s.id = g.salida_id
      join torneos t on t.id = s.torneo_id
      where g.id = grupo_salida_jugadores.grupo_salida_id and t.organizador_id = organizador_id_actual()
    ))
  );

-- consultas_contacto: solo tenía is_admin() a secas (cualquier admin veía
-- las consultas de cualquier organizador) — tiene organizador_id propio.
drop policy if exists consultas_contacto_select_admin on consultas_contacto;
create policy consultas_contacto_select_admin on consultas_contacto
  for select using (is_admin() and organizador_id = organizador_id_actual());

drop policy if exists consultas_contacto_update_admin on consultas_contacto;
create policy consultas_contacto_update_admin on consultas_contacto
  for update using (is_admin() and organizador_id = organizador_id_actual())
  with check (is_admin() and organizador_id = organizador_id_actual());

drop policy if exists consultas_contacto_delete_admin on consultas_contacto;
create policy consultas_contacto_delete_admin on consultas_contacto
  for delete using (is_admin() and organizador_id = organizador_id_actual());

-- inscripciones: la rama de admin era is_admin() a secas (cualquier admin
-- veía/editaba inscripciones de cualquier organizador) — sin
-- organizador_id propio, se escoge vía torneo_id -> torneos.organizador_id.
drop policy if exists inscripciones_select_own on inscripciones;
create policy inscripciones_select_own on inscripciones
  for select using (
    (is_admin() and exists (
      select 1 from torneos t where t.id = inscripciones.torneo_id and t.organizador_id = organizador_id_actual()
    ))
    or exists (select 1 from jugadores j where j.id = inscripciones.jugador_id and j.user_id = auth.uid())
  );

drop policy if exists inscripciones_insert_own on inscripciones;
create policy inscripciones_insert_own on inscripciones
  for insert with check (
    (is_admin() and exists (
      select 1 from torneos t where t.id = inscripciones.torneo_id and t.organizador_id = organizador_id_actual()
    ))
    or exists (select 1 from jugadores j where j.id = inscripciones.jugador_id and j.user_id = auth.uid())
  );

drop policy if exists inscripciones_update_own on inscripciones;
create policy inscripciones_update_own on inscripciones
  for update using (
    (is_admin() and exists (
      select 1 from torneos t where t.id = inscripciones.torneo_id and t.organizador_id = organizador_id_actual()
    ))
    or exists (select 1 from jugadores j where j.id = inscripciones.jugador_id and j.user_id = auth.uid())
  )
  with check (
    (is_admin() and exists (
      select 1 from torneos t where t.id = inscripciones.torneo_id and t.organizador_id = organizador_id_actual()
    ))
    or exists (select 1 from jugadores j where j.id = inscripciones.jugador_id and j.user_id = auth.uid())
  );

drop policy if exists inscripciones_admin_delete on inscripciones;
create policy inscripciones_admin_delete on inscripciones
  for delete using (is_admin() and exists (
    select 1 from torneos t where t.id = inscripciones.torneo_id and t.organizador_id = organizador_id_actual()
  ));

-- pedidos_pago y visitas_web quedan pendientes (no auditadas todavía):
-- pedidos_pago no tiene enlace directo a torneo/organizador (solo
-- user_id — un pedido puede agrupar inscripciones de varios torneos vía
-- el carrito) y visitas_web no guarda organizador_id en absoluto. Ambas
-- necesitan más que una política — la primera decidir cómo repartir un
-- pedido que mezclara organizadores, la segunda una columna nueva
-- rellenada al registrar la visita.
