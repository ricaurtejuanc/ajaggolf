-- Causa real del error "new row violates row-level security policy for
-- table torneos" al crear un torneo en TGEA: organizador_id en torneos (y
-- en ligas_pool, patrocinadores, configuracion, consultas_contacto,
-- jugadores, usuarios_admin) tenía un DEFAULT heredado de cuando solo
-- existía AJAG, fijo al id de AJAG. Como crearTorneo() nunca lo indicaba
-- explícitamente (confiaba en el default), cualquier organizador que no
-- fuera AJAG insertaba con organizador_id de AJAG — pasaba desapercibido
-- hasta que el WITH CHECK (organizador_id = organizador_id_actual())
-- lo rechazaba por no coincidir con el organizador real del admin.
--
-- El código ya se ha corregido para indicar siempre organizador_id
-- explícitamente en estos inserts; quitar el default hace que, si algún
-- insert se le vuelve a olvidar en el futuro, falle alto y claro (RLS o
-- not-null) en vez de colar en silencio el organizador de AJAG.
alter table torneos alter column organizador_id drop default;
alter table ligas_pool alter column organizador_id drop default;
alter table patrocinadores alter column organizador_id drop default;
alter table configuracion alter column organizador_id drop default;
alter table consultas_contacto alter column organizador_id drop default;
alter table jugadores alter column organizador_id drop default;
alter table usuarios_admin alter column organizador_id drop default;
