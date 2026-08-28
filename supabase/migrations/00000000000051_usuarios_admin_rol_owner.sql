-- Agrega rol 'owner' para permisos diferenciados
-- El owner de un organizador puede borrar campos de golf, mientras que
-- otros admins solo pueden añadirlos/editarlos

alter type rol_admin add value 'owner' before 'admin';
