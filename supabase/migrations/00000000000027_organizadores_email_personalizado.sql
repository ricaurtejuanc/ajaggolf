-- Permite personalizar el remitente/marca de los emails por organizador
-- (nombre visible + responder-a), y resolver a qué organizador pertenece
-- una visita pública por dominio (de momento solo se usa para el
-- formulario de contacto).
--
-- Hasta ahora `organizadores` solo era legible por super_admins, lo que
-- impedía leerla desde páginas/acciones públicas o de admin normal (no
-- super_admin) para construir el email o resolver el dominio. Se añade
-- lectura pública de las filas activas: nombre, logo, color y contacto
-- son datos pensados para mostrarse (marca del club), no sensibles.
create policy "organizadores_select_publico"
  on organizadores for select
  using (activo = true);

-- AJAG es el único organizador real hoy: se fija su dominio de producción
-- para que la resolución por host funcione en el sitio ya publicado, y se
-- corrige el email de contacto (estaba con el correo personal usado para
-- sembrar el super_admin, no con la dirección real de consultas del club).
update organizadores
set dominio = 'torneos.aftergolf.es',
    email_contacto = 'info@aftergolf.es'
where slug = 'ajag';
