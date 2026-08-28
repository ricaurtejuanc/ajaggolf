-- Con un segundo organizador real (TGEA Golf) dado de alta, se confirma el
-- hueco que ya dejó apuntado el 035/037 (usuarios_admin/jugadores): el
-- resto de tablas con organizador_id (torneos, ligas_pool, patrocinadores)
-- seguían comprobando solo is_admin() en global, así que un admin de TGEA
-- podía leer/crear/editar/borrar torneos, ligas y patrocinadores de AJAG, y
-- viceversa. Las tablas sin organizador_id propio (resultados, salidas,
-- resultados_pdf_uploads, grupos_salida, grupo_salida_jugadores,
-- clasificacion_global) se escogen igual pero vía el torneo/liga con el
-- que enlazan.

-- torneos
drop policy if exists torneos_select_publicados on torneos;
create policy torneos_select_publicados on torneos
  for select using (
    estado in ('publicado', 'cerrado', 'finalizado')
    or (is_admin() and organizador_id = organizador_id_actual())
  );

drop policy if exists torneos_admin_write on torneos;
create policy torneos_admin_write on torneos
  for insert with check (is_admin() and organizador_id = organizador_id_actual());

drop policy if exists torneos_admin_update on torneos;
create policy torneos_admin_update on torneos
  for update using (is_admin() and organizador_id = organizador_id_actual())
  with check (is_admin() and organizador_id = organizador_id_actual());

drop policy if exists torneos_admin_delete on torneos;
create policy torneos_admin_delete on torneos
  for delete using (is_admin() and organizador_id = organizador_id_actual());

-- ligas_pool
drop policy if exists ligas_pool_select on ligas_pool;
create policy ligas_pool_select on ligas_pool
  for select using (activa = true or (is_admin() and organizador_id = organizador_id_actual()));

drop policy if exists ligas_pool_admin_write on ligas_pool;
create policy ligas_pool_admin_write on ligas_pool
  for insert with check (is_admin() and organizador_id = organizador_id_actual());

drop policy if exists ligas_pool_admin_update on ligas_pool;
create policy ligas_pool_admin_update on ligas_pool
  for update using (is_admin() and organizador_id = organizador_id_actual())
  with check (is_admin() and organizador_id = organizador_id_actual());

drop policy if exists ligas_pool_admin_delete on ligas_pool;
create policy ligas_pool_admin_delete on ligas_pool
  for delete using (is_admin() and organizador_id = organizador_id_actual());

-- patrocinadores (select público sin cambios: sigue "true", la app filtra
-- por organizador_id al listar cada sitio)
drop policy if exists patrocinadores_admin_all on patrocinadores;
create policy patrocinadores_admin_all on patrocinadores
  for all using (is_admin() and organizador_id = organizador_id_actual())
  with check (is_admin() and organizador_id = organizador_id_actual());

-- resultados (vía torneos.organizador_id)
drop policy if exists resultados_select on resultados;
create policy resultados_select on resultados
  for select using (
    estado = 'publicado'
    or (is_admin() and exists (
      select 1 from torneos t
      where t.id = resultados.torneo_id and t.organizador_id = organizador_id_actual()
    ))
  );

drop policy if exists resultados_admin_all on resultados;
create policy resultados_admin_all on resultados
  for all using (is_admin() and exists (
    select 1 from torneos t
    where t.id = resultados.torneo_id and t.organizador_id = organizador_id_actual()
  ))
  with check (is_admin() and exists (
    select 1 from torneos t
    where t.id = resultados.torneo_id and t.organizador_id = organizador_id_actual()
  ));

-- resultados_pdf_uploads (vía torneos.organizador_id)
drop policy if exists resultados_pdf_uploads_select_publicado on resultados_pdf_uploads;
create policy resultados_pdf_uploads_select_publicado on resultados_pdf_uploads
  for select using (
    estado = 'publicado'
    or (is_admin() and exists (
      select 1 from torneos t
      where t.id = resultados_pdf_uploads.torneo_id and t.organizador_id = organizador_id_actual()
    ))
  );

drop policy if exists resultados_pdf_uploads_admin_all on resultados_pdf_uploads;
create policy resultados_pdf_uploads_admin_all on resultados_pdf_uploads
  for all using (is_admin() and exists (
    select 1 from torneos t
    where t.id = resultados_pdf_uploads.torneo_id and t.organizador_id = organizador_id_actual()
  ))
  with check (is_admin() and exists (
    select 1 from torneos t
    where t.id = resultados_pdf_uploads.torneo_id and t.organizador_id = organizador_id_actual()
  ));

-- salidas (vía torneos.organizador_id)
drop policy if exists salidas_select on salidas;
create policy salidas_select on salidas
  for select using (
    estado = 'publicado'
    or (is_admin() and exists (
      select 1 from torneos t
      where t.id = salidas.torneo_id and t.organizador_id = organizador_id_actual()
    ))
  );

drop policy if exists salidas_admin_write on salidas;
create policy salidas_admin_write on salidas
  for insert with check (is_admin() and exists (
    select 1 from torneos t
    where t.id = salidas.torneo_id and t.organizador_id = organizador_id_actual()
  ));

drop policy if exists salidas_admin_update on salidas;
create policy salidas_admin_update on salidas
  for update using (is_admin() and exists (
    select 1 from torneos t
    where t.id = salidas.torneo_id and t.organizador_id = organizador_id_actual()
  ))
  with check (is_admin() and exists (
    select 1 from torneos t
    where t.id = salidas.torneo_id and t.organizador_id = organizador_id_actual()
  ));

drop policy if exists salidas_admin_delete on salidas;
create policy salidas_admin_delete on salidas
  for delete using (is_admin() and exists (
    select 1 from torneos t
    where t.id = salidas.torneo_id and t.organizador_id = organizador_id_actual()
  ));

-- grupos_salida (vía salidas -> torneos.organizador_id)
drop policy if exists grupos_salida_select on grupos_salida;
create policy grupos_salida_select on grupos_salida
  for select using (
    exists (
      select 1 from salidas s
      where s.id = grupos_salida.salida_id and s.estado = 'publicado'
    )
    or (is_admin() and exists (
      select 1 from salidas s
      join torneos t on t.id = s.torneo_id
      where s.id = grupos_salida.salida_id and t.organizador_id = organizador_id_actual()
    ))
  );

drop policy if exists grupos_salida_admin_all on grupos_salida;
create policy grupos_salida_admin_all on grupos_salida
  for all using (is_admin() and exists (
    select 1 from salidas s
    join torneos t on t.id = s.torneo_id
    where s.id = grupos_salida.salida_id and t.organizador_id = organizador_id_actual()
  ))
  with check (is_admin() and exists (
    select 1 from salidas s
    join torneos t on t.id = s.torneo_id
    where s.id = grupos_salida.salida_id and t.organizador_id = organizador_id_actual()
  ));

-- grupo_salida_jugadores (vía grupos_salida -> salidas -> torneos.organizador_id)
drop policy if exists grupo_salida_jugadores_select on grupo_salida_jugadores;
create policy grupo_salida_jugadores_select on grupo_salida_jugadores
  for select using (
    exists (
      select 1 from grupos_salida g
      join salidas s on s.id = g.salida_id
      where g.id = grupo_salida_jugadores.grupo_salida_id and s.estado = 'publicado'
    )
    or (is_admin() and exists (
      select 1 from grupos_salida g
      join salidas s on s.id = g.salida_id
      join torneos t on t.id = s.torneo_id
      where g.id = grupo_salida_jugadores.grupo_salida_id and t.organizador_id = organizador_id_actual()
    ))
  );

drop policy if exists grupo_salida_jugadores_admin_all on grupo_salida_jugadores;
create policy grupo_salida_jugadores_admin_all on grupo_salida_jugadores
  for all using (is_admin() and exists (
    select 1 from grupos_salida g
    join salidas s on s.id = g.salida_id
    join torneos t on t.id = s.torneo_id
    where g.id = grupo_salida_jugadores.grupo_salida_id and t.organizador_id = organizador_id_actual()
  ))
  with check (is_admin() and exists (
    select 1 from grupos_salida g
    join salidas s on s.id = g.salida_id
    join torneos t on t.id = s.torneo_id
    where g.id = grupo_salida_jugadores.grupo_salida_id and t.organizador_id = organizador_id_actual()
  ));

-- clasificacion_global (vía ligas_pool.organizador_id; select público sin cambios)
drop policy if exists clasificacion_global_admin_all on clasificacion_global;
create policy clasificacion_global_admin_all on clasificacion_global
  for all using (is_admin() and exists (
    select 1 from ligas_pool lp
    where lp.id = clasificacion_global.liga_pool_id and lp.organizador_id = organizador_id_actual()
  ))
  with check (is_admin() and exists (
    select 1 from ligas_pool lp
    where lp.id = clasificacion_global.liga_pool_id and lp.organizador_id = organizador_id_actual()
  ));

-- configuracion (vía organizador_id propio; select público sin cambios)
drop policy if exists configuracion_admin_write on configuracion;
create policy configuracion_admin_write on configuracion
  for insert with check (is_admin() and organizador_id = organizador_id_actual());

drop policy if exists configuracion_admin_update on configuracion;
create policy configuracion_admin_update on configuracion
  for update using (is_admin() and organizador_id = organizador_id_actual())
  with check (is_admin() and organizador_id = organizador_id_actual());
