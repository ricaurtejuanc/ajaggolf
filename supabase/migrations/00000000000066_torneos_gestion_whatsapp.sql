-- Un torneo puede gestionar sus inscripciones fuera de la web, por
-- WhatsApp (distinto de inscripcion_url_externa, que redirige a otra
-- plataforma web): en ese caso el formulario de inscripción muestra el
-- aviso en rojo con el teléfono del organizador (configuracion.whatsapp_
-- telefono) en vez de/además de dejar inscribirse online, y sus ingresos
-- se registran a mano en la Economía del torneo (movimientos_economicos,
-- categoría "inscripciones_externas").
alter table torneos add column gestion_whatsapp boolean not null default false;
