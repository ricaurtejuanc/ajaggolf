-- AJAG Golf — extras informativos del torneo (premios, ceremonia, welcome
-- pack...) que el organizador marca con checkboxes al crear/editar el
-- torneo y que se muestran como información en su página pública.
alter table torneos
  add column extras text[] not null default '{}';
