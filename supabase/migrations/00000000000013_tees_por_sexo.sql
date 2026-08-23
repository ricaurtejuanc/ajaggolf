-- AJAG Golf — tees de salida separados por sexo (p.ej. "Caballeros: Tee 54
-- · Damas: Tee 51"), en vez de una única lista común.
alter table torneos
  add column tees_masculino text[] not null default '{}',
  add column tees_femenino text[] not null default '{}';

-- Migra los datos existentes (no se sabía a qué sexo pertenecían) a ambas
-- columnas para no perderlos; el organizador los separa a mano si hace falta.
update torneos set tees_masculino = tees, tees_femenino = tees where tees <> '{}';

alter table torneos drop column tees;
