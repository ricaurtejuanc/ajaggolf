-- AJAG Golf — (1) categorías/checkboxes de "información adicional" de
-- torneos editables desde Configuración en vez de estar fijas en el
-- código; (2) patrocinadores (logo + enlace a web o teléfono).

insert into configuracion (clave, valor) values
  ('categorias_extras', '[
    {
      "categoria": "Premios",
      "opciones": [
        {"value": "premio_drive_mas_largo", "label": "Drive más largo"},
        {"value": "premio_bola_cercana_par3", "label": "Bola más cercana en pares 3"},
        {"value": "premio_bola_cercana_segundo_golpe", "label": "Bola más cercana al segundo golpe"}
      ]
    },
    {
      "categoria": "Ceremonia",
      "opciones": [
        {"value": "ceremonia_entrega_premios", "label": "Entrega de premios"},
        {"value": "ceremonia_sorteo_regalos", "label": "Sorteo de regalos"},
        {"value": "ceremonia_cocktail", "label": "Cóctel"},
        {"value": "ceremonia_comida", "label": "Comida"},
        {"value": "ceremonia_bebida", "label": "Bebida"}
      ]
    },
    {
      "categoria": "Inscripción",
      "opciones": [
        {"value": "inscripcion_welcome_pack", "label": "Welcome pack"}
      ]
    },
    {
      "categoria": "Avituallamiento",
      "opciones": [
        {"value": "avituallamiento_durante_recorrido", "label": "Durante el recorrido"},
        {"value": "avituallamiento_antes_torneo", "label": "Antes del torneo"},
        {"value": "avituallamiento_despues_torneo", "label": "Después del torneo"}
      ]
    }
  ]'::jsonb)
on conflict (clave) do nothing;

create table patrocinadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  logo_url text not null,
  web text,
  telefono text,
  created_at timestamptz not null default now()
);

alter table patrocinadores enable row level security;

create policy "patrocinadores_select_publico"
  on patrocinadores for select
  using (true);

create policy "patrocinadores_admin_all"
  on patrocinadores for all
  using (is_admin())
  with check (is_admin());

insert into storage.buckets (id, name, public)
values ('patrocinadores', 'patrocinadores', true)
on conflict (id) do nothing;

create policy patrocinadores_logos_public_read on storage.objects
  for select using (bucket_id = 'patrocinadores');

create policy patrocinadores_logos_admin_write on storage.objects
  for insert with check (bucket_id = 'patrocinadores' and is_admin());

create policy patrocinadores_logos_admin_update on storage.objects
  for update using (bucket_id = 'patrocinadores' and is_admin())
  with check (bucket_id = 'patrocinadores' and is_admin());

create policy patrocinadores_logos_admin_delete on storage.objects
  for delete using (bucket_id = 'patrocinadores' and is_admin());

-- Patrocinador de ejemplo para probar la sección (reemplázalo/bórralo
-- desde el panel admin por uno real).
insert into patrocinadores (nombre, logo_url, web, telefono) values
  ('Bahía Verde Golf (ejemplo — Málaga)', '/patrocinadores/ejemplo-malaga.svg', 'https://example.com', null);
