-- configuracion tenía clave como PK única global: bizum_numero y
-- categorias_extras eran, de hecho, un único valor compartido por TODOS
-- los organizadores (AJAG y cualquier otro daban el mismo número de Bizum
-- y las mismas categorías extra), y encima ahora incompatible con el RLS
-- ya escogido por organizador_id de la migración anterior: un segundo
-- organizador ni podría insertar su propia fila (choca con la PK de
-- clave) ni la RLS le dejaría tocar la de otro. Pasa a ser
-- (organizador_id, clave): cada organizador tiene su propio valor.
alter table configuracion alter column organizador_id set not null;
alter table configuracion drop constraint configuracion_pkey;
alter table configuracion add constraint configuracion_pkey primary key (organizador_id, clave);
