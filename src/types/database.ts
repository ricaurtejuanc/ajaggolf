// Tipos generados a mano a partir de supabase/migrations/*.sql
// Cuando el proyecto Supabase esté enlazado, se pueden regenerar con:
//   supabase gen types typescript --project-id <id> > src/types/database.ts
// (mantener la forma compatible con SupabaseClient<Database> si se regeneran).
//
// Nota: se usan `type` (no `interface`) para las filas porque
// @supabase/postgrest-js exige que cada tabla sea estructuralmente
// asignable a Record<string, unknown>, algo que solo cumplen los alias de
// tipo con forma de objeto, no las interfaces.

export type SexoJugador = "masculino" | "femenino";
export type FormatoPuntuacion =
  | "stableford"
  | "medal_play"
  | "parejas"
  | "mejor_bola"
  | "scramble";
export type ModoSalida = "consecutivo" | "shotgun";
export type ModoAsignacionSalida = "handicap" | "manual" | "mixto";
export type EstadoTorneo = "borrador" | "publicado" | "cerrado" | "finalizado";
export type EstadoInscripcion = "carrito" | "pendiente_pago" | "confirmada" | "cancelada";
export type MetodoPago = "bizum" | "stripe" | "club";
export type ModoPagoTorneo = "organizador" | "club";
export type EstadoPedidoPago =
  | "pendiente_confirmacion"
  | "marcado_pagado"
  | "confirmado"
  | "rechazado"
  | "cancelado";
export type EstadoSalida = "borrador" | "publicado";
export type EstadoResultado = "preview" | "publicado";
export type EstadoPdfResultados = "preview" | "publicado" | "descartado";

export type Organizador = {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  color_primario: string | null;
  dominio: string | null;
  email_contacto: string | null;
  activo: boolean;
  created_at: string;
};

export type SuperAdmin = {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  created_at: string;
};

export type UsuarioAdmin = {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  rol: "admin";
  activo: boolean;
  organizador_id: string | null;
  created_at: string;
};

export type Configuracion = {
  clave: string;
  valor: unknown;
  actualizado_por: string | null;
  organizador_id: string | null;
  updated_at: string;
};

export type OpcionExtra = { value: string; label: string };
export type CategoriaExtra = { categoria: string; opciones: OpcionExtra[] };

export type Patrocinador = {
  id: string;
  nombre: string;
  logo_url: string;
  web: string | null;
  telefono: string | null;
  organizador_id: string | null;
  created_at: string;
};

export type Jugador = {
  id: string;
  user_id: string | null;
  nombre: string;
  apellidos: string;
  email: string | null;
  licencia_federativa: string | null;
  sexo: SexoJugador | null;
  handicap: number | null;
  telefono: string | null;
  organizador_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TipoLigaOficial = "ranking" | "pool";

export type LigaPool = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
  reglas: string | null;
  temporada: string | null;
  tabla_puntos: Record<string, number>;
  modo_puntuacion: "tabla_puntos" | "suma_stableford";
  activa: boolean;
  tipo_oficial: TipoLigaOficial | null;
  organizador_id: string | null;
  created_at: string;
};

export type CampoGolf = {
  id: string;
  nombre: string;
  recorrido: string;
  created_at: string;
};

export type PremioCategoria = {
  nombre: string;
  categoria_unica: boolean;
  handicap_desde: number | null;
  handicap_hasta: number | null;
  premios: string[];
};

export type Torneo = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  info_adicional: string | null;
  campo_golf: string;
  recorrido: string | null;
  tees_masculino: string[];
  tees_femenino: string[];
  fecha: string;
  hora_inicio: string | null;
  poster_url: string | null;
  poster_focal_x: number;
  poster_focal_y: number;
  precio_cents: number;
  precio_socio_cents: number | null;
  cupo_maximo: number | null;
  formato_puntuacion: FormatoPuntuacion;
  modo_salida: ModoSalida;
  modo_asignacion_salida: ModoAsignacionSalida;
  tees_consecutivo: number[];
  modo_pago: ModoPagoTorneo;
  extras: string[];
  premios: PremioCategoria[];
  premios_ganadores: Record<string, string[]>;
  horarios_pdf_url: string | null;
  liga_pool_id: string | null;
  estado: EstadoTorneo;
  created_by: string | null;
  organizador_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PedidoPago = {
  id: string;
  user_id: string | null;
  metodo_pago: MetodoPago;
  estado: EstadoPedidoPago;
  total_cents: number;
  referencia_pago: string | null;
  notas_admin: string | null;
  marcado_pagado_at: string | null;
  confirmado_at: string | null;
  confirmado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type Inscripcion = {
  id: string;
  torneo_id: string;
  jugador_id: string;
  pedido_pago_id: string | null;
  sexo: SexoJugador | null;
  licencia_federativa: string | null;
  handicap_snapshot: number | null;
  juega_con_licencias: string[];
  es_socio: boolean;
  precio_cents: number;
  estado: EstadoInscripcion;
  created_at: string;
  updated_at: string;
};

export type Salida = {
  id: string;
  torneo_id: string;
  modo: ModoSalida;
  config: Record<string, unknown>;
  modo_asignacion: ModoAsignacionSalida;
  estado: EstadoSalida;
  generado_at: string | null;
  publicado_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type GrupoSalida = {
  id: string;
  salida_id: string;
  numero_grupo: number;
  hoyo_salida: number;
  hora_salida: string | null;
  notas: string | null;
  created_at: string;
};

export type GrupoSalidaJugador = {
  id: string;
  grupo_salida_id: string;
  inscripcion_id: string;
  orden: number;
  conflicto_juega_con: boolean;
  conflicto_detalle: string | null;
  created_at: string;
};

export type ResultadoPdfUpload = {
  id: string;
  torneo_id: string;
  storage_path: string;
  nombre_archivo: string;
  proveedor_origen: string | null;
  mapeo_columnas: Record<string, string>;
  filas_extraidas: unknown;
  estado: EstadoPdfResultados;
  subido_por: string | null;
  created_at: string;
  publicado_at: string | null;
};

export type Resultado = {
  id: string;
  torneo_id: string;
  jugador_id: string | null;
  inscripcion_id: string | null;
  posicion: number | null;
  nombre_mostrado: string;
  licencia_federativa: string | null;
  handicap: number | null;
  puntos: number | null;
  golpes: number | null;
  estado_juego: "retirado" | "no_presentado" | null;
  estado: EstadoResultado;
  es_clasificacion_general: boolean;
  pdf_origen_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ClasificacionGlobal = {
  id: string;
  liga_pool_id: string;
  jugador_id: string;
  puntos_totales: number;
  eventos_jugados: number;
  updated_at: string;
};

export type VisitaWeb = {
  id: number;
  ruta: string;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
};

export type ConsultaContacto = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string;
  leido: boolean;
  respuesta: string | null;
  respondido_at: string | null;
  created_at: string;
};

// Insert/Update se dejan totalmente opcionales (Partial<Row>): las columnas
// obligatorias reales las exige Postgres al insertar, no el tipo TS. Es una
// simplificación deliberada frente a un `gen types` real, que sí distingue
// columnas con default/nullable de las obligatorias.
type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type ViewDef<Row> = {
  Row: Row;
  Relationships: [];
};

export type SalidaPublicada = {
  torneo_id: string;
  salida_id: string;
  modo: ModoSalida;
  grupo_salida_id: string;
  numero_grupo: number;
  hoyo_salida: number;
  hora_salida: string | null;
  grupo_salida_jugador_id: string | null;
  nombre: string | null;
  handicap: number | null;
  apellidos: string | null;
};

export type ClasificacionPublica = {
  liga_pool_id: string;
  jugador_id: string;
  nombre: string;
  apellidos: string;
  handicap: number | null;
  puntos_totales: number;
  eventos_jugados: number;
};

export type TorneoCupo = {
  torneo_id: string;
  inscritos: number;
};

export type Database = {
  public: {
    Tables: {
      organizadores: TableDef<Organizador>;
      super_admins: TableDef<SuperAdmin>;
      usuarios_admin: TableDef<UsuarioAdmin>;
      configuracion: TableDef<Configuracion>;
      jugadores: TableDef<Jugador>;
      ligas_pool: TableDef<LigaPool>;
      torneos: TableDef<Torneo>;
      pedidos_pago: TableDef<PedidoPago>;
      inscripciones: TableDef<Inscripcion>;
      salidas: TableDef<Salida>;
      grupos_salida: TableDef<GrupoSalida>;
      grupo_salida_jugadores: TableDef<GrupoSalidaJugador>;
      resultados_pdf_uploads: TableDef<ResultadoPdfUpload>;
      resultados: TableDef<Resultado>;
      clasificacion_global: TableDef<ClasificacionGlobal>;
      visitas_web: TableDef<VisitaWeb>;
      consultas_contacto: TableDef<ConsultaContacto>;
      campos_golf: TableDef<CampoGolf>;
      patrocinadores: TableDef<Patrocinador>;
    };
    Views: {
      salidas_publicadas: ViewDef<SalidaPublicada>;
      clasificacion_publica: ViewDef<ClasificacionPublica>;
      torneos_cupo: ViewDef<TorneoCupo>;
    };
    Functions: Record<string, never>;
  };
};
