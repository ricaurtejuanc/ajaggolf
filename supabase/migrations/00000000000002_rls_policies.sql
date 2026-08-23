-- AJAG Golf — Row Level Security
-- Regla general: lectura pública de lo publicado; escritura de datos propios
-- para usuarios autenticados; acceso total para admins (is_admin()).

alter table usuarios_admin enable row level security;
alter table configuracion enable row level security;
alter table jugadores enable row level security;
alter table ligas_pool enable row level security;
alter table torneos enable row level security;
alter table pedidos_pago enable row level security;
alter table inscripciones enable row level security;
alter table salidas enable row level security;
alter table grupos_salida enable row level security;
alter table grupo_salida_jugadores enable row level security;
alter table resultados_pdf_uploads enable row level security;
alter table resultados enable row level security;
alter table liga_pool_eventos enable row level security;
alter table clasificacion_global enable row level security;
alter table visitas_web enable row level security;
alter table consultas_contacto enable row level security;

-- ---------------------------------------------------------
-- USUARIOS_ADMIN: solo los propios admins pueden verse/gestionarse.
-- ---------------------------------------------------------
create policy usuarios_admin_select on usuarios_admin
  for select using (is_admin());
create policy usuarios_admin_all on usuarios_admin
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------
-- CONFIGURACION: lectura pública (ej. número de bizum en el checkout),
-- escritura solo admin.
-- ---------------------------------------------------------
create policy configuracion_select on configuracion
  for select using (true);
create policy configuracion_admin_write on configuracion
  for insert with check (is_admin());
create policy configuracion_admin_update on configuracion
  for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------
-- JUGADORES: cada usuario ve/edita su propio registro de jugador; admin ve todo.
-- El insert también lo hacen usuarios autenticados (para darse de alta o
-- registrar acompañantes en una inscripción).
-- ---------------------------------------------------------
create policy jugadores_select_own on jugadores
  for select using (auth.uid() = user_id or is_admin());
create policy jugadores_insert_auth on jugadores
  for insert with check (auth.uid() is not null);
create policy jugadores_update_own on jugadores
  for update using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());
create policy jugadores_admin_delete on jugadores
  for delete using (is_admin());

-- ---------------------------------------------------------
-- LIGAS_POOL: lectura pública si activa, gestión solo admin.
-- ---------------------------------------------------------
create policy ligas_pool_select on ligas_pool
  for select using (activa = true or is_admin());
create policy ligas_pool_admin_write on ligas_pool
  for insert with check (is_admin());
create policy ligas_pool_admin_update on ligas_pool
  for update using (is_admin()) with check (is_admin());
create policy ligas_pool_admin_delete on ligas_pool
  for delete using (is_admin());

-- ---------------------------------------------------------
-- TORNEOS: lectura pública de publicados; admin ve/gestiona todo.
-- ---------------------------------------------------------
create policy torneos_select_publicados on torneos
  for select using (estado = 'publicado' or estado = 'cerrado' or estado = 'finalizado' or is_admin());
create policy torneos_admin_write on torneos
  for insert with check (is_admin());
create policy torneos_admin_update on torneos
  for update using (is_admin()) with check (is_admin());
create policy torneos_admin_delete on torneos
  for delete using (is_admin());

-- ---------------------------------------------------------
-- PEDIDOS_PAGO: el usuario ve/gestiona los suyos; admin ve/gestiona todos.
-- ---------------------------------------------------------
create policy pedidos_pago_select_own on pedidos_pago
  for select using (auth.uid() = user_id or is_admin());
create policy pedidos_pago_insert_own on pedidos_pago
  for insert with check (auth.uid() = user_id);
create policy pedidos_pago_update_own on pedidos_pago
  for update using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

-- ---------------------------------------------------------
-- INSCRIPCIONES: visibles/gestionables por el dueño del jugador o admin.
-- ---------------------------------------------------------
create policy inscripciones_select_own on inscripciones
  for select using (
    is_admin()
    or exists (
      select 1 from jugadores j
      where j.id = inscripciones.jugador_id and j.user_id = auth.uid()
    )
  );
create policy inscripciones_insert_own on inscripciones
  for insert with check (
    is_admin()
    or exists (
      select 1 from jugadores j
      where j.id = inscripciones.jugador_id and j.user_id = auth.uid()
    )
  );
create policy inscripciones_update_own on inscripciones
  for update using (
    is_admin()
    or exists (
      select 1 from jugadores j
      where j.id = inscripciones.jugador_id and j.user_id = auth.uid()
    )
  )
  with check (
    is_admin()
    or exists (
      select 1 from jugadores j
      where j.id = inscripciones.jugador_id and j.user_id = auth.uid()
    )
  );
create policy inscripciones_admin_delete on inscripciones
  for delete using (is_admin());

-- ---------------------------------------------------------
-- SALIDAS / GRUPOS_SALIDA: lectura pública solo si la salida está publicada;
-- gestión completa solo admin.
-- ---------------------------------------------------------
create policy salidas_select on salidas
  for select using (estado = 'publicado' or is_admin());
create policy salidas_admin_write on salidas
  for insert with check (is_admin());
create policy salidas_admin_update on salidas
  for update using (is_admin()) with check (is_admin());
create policy salidas_admin_delete on salidas
  for delete using (is_admin());

create policy grupos_salida_select on grupos_salida
  for select using (
    is_admin()
    or exists (select 1 from salidas s where s.id = grupos_salida.salida_id and s.estado = 'publicado')
  );
create policy grupos_salida_admin_all on grupos_salida
  for all using (is_admin()) with check (is_admin());

create policy grupo_salida_jugadores_select on grupo_salida_jugadores
  for select using (
    is_admin()
    or exists (
      select 1 from grupos_salida g
      join salidas s on s.id = g.salida_id
      where g.id = grupo_salida_jugadores.grupo_salida_id and s.estado = 'publicado'
    )
  );
create policy grupo_salida_jugadores_admin_all on grupo_salida_jugadores
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------
-- RESULTADOS_PDF_UPLOADS: solo admin (material de trabajo interno).
-- ---------------------------------------------------------
create policy resultados_pdf_uploads_admin_all on resultados_pdf_uploads
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------
-- RESULTADOS: lectura pública solo publicados; gestión solo admin.
-- ---------------------------------------------------------
create policy resultados_select on resultados
  for select using (estado = 'publicado' or is_admin());
create policy resultados_admin_all on resultados
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------
-- LIGA_POOL_EVENTOS: lectura pública, gestión solo admin.
-- ---------------------------------------------------------
create policy liga_pool_eventos_select on liga_pool_eventos
  for select using (true);
create policy liga_pool_eventos_admin_all on liga_pool_eventos
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------
-- CLASIFICACION_GLOBAL: lectura pública, escritura solo admin/servidor.
-- ---------------------------------------------------------
create policy clasificacion_global_select on clasificacion_global
  for select using (true);
create policy clasificacion_global_admin_all on clasificacion_global
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------
-- VISITAS_WEB: inserción pública (contador anónimo), lectura solo admin.
-- ---------------------------------------------------------
create policy visitas_web_insert_public on visitas_web
  for insert with check (true);
create policy visitas_web_select_admin on visitas_web
  for select using (is_admin());

-- ---------------------------------------------------------
-- CONSULTAS_CONTACTO: inserción pública, lectura/gestión solo admin.
-- ---------------------------------------------------------
create policy consultas_contacto_insert_public on consultas_contacto
  for insert with check (true);
create policy consultas_contacto_select_admin on consultas_contacto
  for select using (is_admin());
create policy consultas_contacto_update_admin on consultas_contacto
  for update using (is_admin()) with check (is_admin());
