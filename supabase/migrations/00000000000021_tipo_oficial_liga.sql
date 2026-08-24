-- AJAG Golf — marca explícita de qué liga es "el Ranking oficial" y cuál
-- es "el Pool oficial", desacoplado del nombre/slug (antes se detectaba
-- por slug = 'ranking'/'pool', que se rompía en cuanto alguien nombraba
-- la liga de otra forma).

alter table ligas_pool add column tipo_oficial text check (tipo_oficial in ('ranking', 'pool'));

create unique index ligas_pool_tipo_oficial_unq
  on ligas_pool (tipo_oficial)
  where tipo_oficial is not null;

update ligas_pool set tipo_oficial = 'ranking' where slug = 'ranking';
