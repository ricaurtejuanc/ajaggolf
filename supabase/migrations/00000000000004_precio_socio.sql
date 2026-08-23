-- AJAG Golf — precio diferenciado socio / no socio
-- precio_socio_cents es opcional: si es null, el torneo solo tiene el
-- precio general (precio_cents) y el formulario de inscripción no muestra
-- el selector de socio/no socio.

alter table torneos
  add column precio_socio_cents integer;

alter table inscripciones
  add column es_socio boolean not null default false;

comment on column torneos.precio_cents is 'Precio general / no socio.';
comment on column torneos.precio_socio_cents is 'Precio para socios del club, si el torneo distingue. Null = precio único.';
comment on column inscripciones.es_socio is 'Si el jugador se inscribió como socio del club (precio_socio_cents aplicado).';
