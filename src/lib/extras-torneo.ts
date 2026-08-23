export const CATEGORIAS_EXTRAS = [
  {
    categoria: "Premios",
    opciones: [
      { value: "premio_drive_mas_largo", label: "Drive más largo" },
      { value: "premio_bola_cercana_par3", label: "Bola más cercana en pares 3" },
      { value: "premio_bola_cercana_segundo_golpe", label: "Bola más cercana al segundo golpe" },
    ],
  },
  {
    categoria: "Ceremonia",
    opciones: [
      { value: "ceremonia_entrega_premios", label: "Entrega de premios" },
      { value: "ceremonia_sorteo_regalos", label: "Sorteo de regalos" },
      { value: "ceremonia_cocktail", label: "Cóctel" },
      { value: "ceremonia_comida", label: "Comida" },
      { value: "ceremonia_bebida", label: "Bebida" },
    ],
  },
  {
    categoria: "Inscripción",
    opciones: [{ value: "inscripcion_welcome_pack", label: "Welcome pack" }],
  },
  {
    categoria: "Avituallamiento",
    opciones: [
      { value: "avituallamiento_durante_recorrido", label: "Durante el recorrido" },
      { value: "avituallamiento_antes_torneo", label: "Antes del torneo" },
      { value: "avituallamiento_despues_torneo", label: "Después del torneo" },
    ],
  },
] as const;

export const ETIQUETAS_EXTRAS: Record<string, string> = Object.fromEntries(
  CATEGORIAS_EXTRAS.flatMap((cat) => cat.opciones.map((o) => [o.value, o.label])),
);
