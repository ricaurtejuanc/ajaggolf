import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manual de usuario · Admin" };

type Seccion = {
  id: string;
  titulo: string;
  contenido: React.ReactNode;
};

const claseLista = "mt-2 list-disc space-y-1.5 pl-5 text-sm text-ajag-gris-500";
const claseParrafo = "text-sm text-ajag-gris-500";
const claseSubtitulo = "mt-4 text-sm font-semibold text-ajag-verde-900";

const secciones: Seccion[] = [
  {
    id: "introduccion",
    titulo: "Qué es esta plataforma",
    contenido: (
      <>
        <p className={claseParrafo}>
          Es el sistema con el que tu club gestiona su calendario de torneos, inscripciones,
          pagos, cuadros de salida, resultados y clasificaciones, sin depender de hojas de
          cálculo ni de grupos de WhatsApp para cada torneo.
        </p>
        <p className={`${claseParrafo} mt-2`}>
          La plataforma es multi-club: cada club (&quot;organizador&quot;) tiene su propio
          dominio, su marca (logo y color) y sus propios torneos, jugadores y pagos,
          totalmente independientes de los demás clubes que usen la misma plataforma. Todo lo
          que ves en <code>/admin</code> pertenece únicamente a tu club.
        </p>
        <p className={`${claseParrafo} mt-2`}>
          Hay dos zonas separadas: la web pública (calendario, inscripción, cuenta del
          jugador) y el panel <code>/admin</code> que estás leyendo ahora, donde gestionas todo
          lo de tu club.
        </p>
      </>
    ),
  },
  {
    id: "torneos",
    titulo: "Torneos",
    contenido: (
      <>
        <p className={claseParrafo}>
          Desde <strong>Torneos</strong> creas y gestionas cada prueba. Un torneo recién creado
          nace en <strong>Borrador</strong> (invisible en la web pública) hasta que lo pasas a
          <strong> Publicado</strong>.
        </p>
        <p className={claseSubtitulo}>Datos principales</p>
        <ul className={claseLista}>
          <li>Nombre, fecha, hora, campo/recorrido, cartel (imagen) y descripción.</li>
          <li>
            Precio de inscripción, y opcionalmente un precio distinto para socios del club.
          </li>
          <li>Cupo máximo de plazas (opcional): al llenarse, la web deja de admitir inscripciones.</li>
          <li>
            Formato de puntuación (Stableford, Medal Play, Mejor bola, Scramble, Match Play) y
            si se juega individual o por parejas.
          </li>
          <li>Cómo se paga: al organizador (Bizum/transferencia) o directamente en el club.</li>
          <li>Premios por categoría de hándicap y premios por hoyo (drive más largo, bola más cercana...).</li>
          <li>
            Normas del torneo (opcional): un texto tan largo como haga falta que en la ficha
            pública se muestra en una ventana emergente, no en la propia página.
          </li>
        </ul>
        <p className={claseSubtitulo}>Inscripciones fuera de la web</p>
        <p className={claseParrafo}>
          Si un torneo se inscribe en otra plataforma (Golfdirecto, la web del propio campo...),
          activa <em>&quot;Inscripciones en plataforma externa&quot;</em> y pon esa URL: el botón
          &quot;Inscribirme&quot; llevará directamente allí.
        </p>
        <p className={`${claseParrafo} mt-2`}>
          Si en cambio gestionas las inscripciones tú mismo por WhatsApp (sin formulario web),
          activa <em>&quot;Gestionar inscripciones por WhatsApp&quot;</em>: el formulario de
          inscripción mostrará un aviso en rojo con tu teléfono de WhatsApp (configúralo una vez
          en <a href="/admin/configuracion" className="text-ajag-verde-700 underline">Configuración</a>).
          Como estas inscripciones no pasan por el formulario, sus ingresos no se calculan solos:
          añádelos a mano en la <a href="#economia" className="text-ajag-verde-700 underline">Economía</a>{" "}
          de ese torneo, categoría &quot;Inscripciones cobradas aparte&quot;.
        </p>
        <p className={claseSubtitulo}>Compartir por WhatsApp</p>
        <p className={claseParrafo}>
          Un torneo publicado tiene, en el listado de <strong>Torneos</strong>, un botón{" "}
          <em>&quot;Compartir&quot;</em> que abre WhatsApp con un mensaje ya redactado (fecha,
          campo, precio, cupo y el link a la ficha del torneo) para que elijas a qué grupo o
          difusión de tu comunidad enviarlo. No se envía nada automáticamente ni hace falta
          darse de alta en ningún sitio — tú decides el destino cada vez.
        </p>
        <p className={claseSubtitulo}>Estados de un torneo</p>
        <ul className={claseLista}>
          <li><strong>Borrador</strong>: oculto en la web pública, para prepararlo con calma.</li>
          <li><strong>Publicado</strong>: visible y con inscripción abierta.</li>
          <li><strong>Completo</strong>: visible, pero sin admitir más inscripciones.</li>
          <li><strong>Finalizado</strong>: el torneo ya se jugó.</li>
          <li><strong>Cancelado</strong>: se muestra con un aviso rojo grande en su ficha.</li>
        </ul>
      </>
    ),
  },
  {
    id: "inscritos-pagos",
    titulo: "Inscritos y Pagos",
    contenido: (
      <>
        <p className={claseParrafo}>
          Desde <strong>Inscritos</strong> (dentro de cada torneo) ves la lista de jugadores
          apuntados, su hándicap, si son socios, el precio y el estado del pago. Puedes cancelar
          la inscripción de un jugador: queda marcada &quot;Cancelada&quot; en la tabla (no se
          borra) y su plaza se libera automáticamente. También puedes exportar la lista a XLS.
        </p>
        <p className={claseSubtitulo}>Confirmar pagos</p>
        <p className={claseParrafo}>
          Cuando un jugador se inscribe y paga por Bizum/transferencia, su pedido queda{" "}
          <em>&quot;Pendiente&quot;</em> hasta que marca &quot;Ya he pagado&quot; desde su cuenta
          (pasa a <em>&quot;Marcado como pagado&quot;</em>) y tú lo revisas en{" "}
          <strong>Pagos</strong> (menú general o dentro del propio torneo): <em>Confirmar</em>{" "}
          da la inscripción por buena; <em>Cancelar</em> la deja marcada &quot;Cancelado&quot; en
          el historial y libera la plaza; <em>Eliminar</em> la borra por completo (solo para
          duplicados o pruebas).
        </p>
      </>
    ),
  },
  {
    id: "horarios",
    titulo: "Horarios (cuadros de salida)",
    contenido: (
      <>
        <p className={claseParrafo}>
          Genera automáticamente los grupos de salida de un torneo repartiendo a los inscritos en
          grupos de 3-4, por hándicap o a mano, respetando las peticiones de &quot;quiero jugar
          con...&quot; que haya indicado cada jugador al inscribirse.
        </p>
        <ul className={claseLista}>
          <li><strong>Consecutivo</strong>: salidas escalonadas cada pocos minutos, uno o varios tees.</li>
          <li><strong>Shotgun</strong>: todos salen a la vez desde distintos hoyos.</li>
          <li><strong>Shotgun silencioso</strong>: igual, sin ceremonia de salida.</li>
        </ul>
        <p className={`${claseParrafo} mt-2`}>
          También puedes subir un cuadro de salidas ya hecho en PDF si lo prefieres a generarlo
          aquí.
        </p>
      </>
    ),
  },
  {
    id: "resultados",
    titulo: "Resultados",
    contenido: (
      <>
        <p className={claseParrafo}>Hay tres formas de meter los resultados de un torneo, y las tres acaban en la misma tabla:</p>
        <ul className={claseLista}>
          <li><strong>Manual</strong>: tabla editable, jugador a jugador.</li>
          <li><strong>PDF o foto</strong>: subes la clasificación oficial y el sistema intenta rellenar la tabla solo.</li>
          <li><strong>XLS</strong>: descargas la tabla, la editas fuera y la vuelves a subir.</li>
        </ul>
        <p className={`${claseParrafo} mt-2`}>
          Un jugador retirado o no presentado no cuenta como un 0 en la clasificación de liga,
          aunque en la tabla se vea un &quot;0&quot; por claridad.
        </p>
      </>
    ),
  },
  {
    id: "ligas",
    titulo: "Ligas y ranking",
    contenido: (
      <>
        <p className={claseParrafo}>
          Puedes crear tantas ligas o pools como quieras: una liga anual, un ranking de
          verano, una liga de parejas... cada una es independiente, con su propio nombre y su
          propia clasificación. Al crear o editar un torneo, lo asignas a una liga desde su
          propio formulario — un torneo pertenece a una liga o a ninguna, nunca a varias.
        </p>
        <p className={claseSubtitulo}>Cómo se calcula la clasificación</p>
        <p className={claseParrafo}>
          En cuanto publicas los resultados de un torneo de la liga, su clasificación se
          recalcula sola, de principio a fin, sumando los resultados publicados de todos sus
          torneos. Hay tres formas de puntuar, que eliges al crear la liga:
        </p>
        <ul className={claseLista}>
          <li><strong>Tabla de puntos</strong>: cada posición final da unos puntos fijos (1º más que 2º, etc.), y se suman.</li>
          <li><strong>Suma de Stableford</strong>: se suman directamente los puntos Stableford de cada torneo.</li>
          <li><strong>Suma de golpes netos</strong> (medal play): se suman los golpes netos (menos es mejor).</li>
        </ul>
        <p className={claseSubtitulo}>Mejores N pruebas</p>
        <p className={claseParrafo}>
          Si tu liga tiene muchas pruebas, puedes limitar el cálculo final a los N mejores
          resultados de cada jugador (por ejemplo, &quot;los 5 mejores de 8 torneos&quot;) — así
          un mal resultado puntual, o no poder jugar alguna prueba, no penaliza el ranking de
          toda la temporada. Con ese límite activado, la clasificación muestra dos columnas:{" "}
          <strong>Puntos totales</strong> (solo con las N mejores, es la que decide el orden) y{" "}
          <strong>Mejores Resultados</strong> (la suma de todo lo jugado, a modo informativo).
          Sin límite activado, ambas columnas coincidirían, así que solo se muestra una.
        </p>
        <p className={claseSubtitulo}>Editar a mano</p>
        <p className={claseParrafo}>
          Puedes tocar la clasificación a mano (por ejemplo para corregir un caso puntual) y
          descargarla/subirla en XLS, igual que con los resultados de un torneo. Ten en cuenta
          que es un ajuste temporal: en cuanto se publiquen o modifiquen resultados de
          cualquier torneo de esa liga, se recalcula desde cero y ese ajuste manual se pierde.
        </p>
      </>
    ),
  },
  {
    id: "economia",
    titulo: "Economía",
    contenido: (
      <>
        <p className={claseParrafo}>
          Resumen de ingresos y gastos, general del club y por torneo. Se activa/desactiva desde
          el resumen general (si tu club no la usa, ni siquiera aparece en el menú).
        </p>
        <p className={claseSubtitulo}>Qué se calcula solo y qué se añade a mano</p>
        <p className={claseParrafo}>
          El ingreso por inscripciones se calcula automáticamente sumando las inscripciones
          confirmadas de cada torneo — nunca lo edites a mano, siempre refleja el estado real.
          Todo lo demás (pago al club, catering, regalos y trofeos, patrocinios, y las
          inscripciones que gestiones por WhatsApp) se añade como un &quot;movimiento&quot;
          manual, de ingreso o gasto, con su categoría, importe y fecha.
        </p>
      </>
    ),
  },
  {
    id: "campos",
    titulo: "Campos de golf",
    contenido: (
      <>
        <p className={claseParrafo}>
          Catálogo de clubes, recorridos y barras (tees) con su Course Rating, Slope y par —
          alimenta la calculadora de hándicap pública y el desplegable de campo al crear un
          torneo. Cada barra se muestra con su color real (blanca, amarilla o roja) para que se
          reconozca de un vistazo, igual que en la tarjeta física del campo.
        </p>
      </>
    ),
  },
  {
    id: "patrocinadores",
    titulo: "Patrocinadores",
    contenido: (
      <p className={claseParrafo}>
        Logos y enlaces de los patrocinadores del club, mostrados en la web pública.
      </p>
    ),
  },
  {
    id: "consultas",
    titulo: "Consultas",
    contenido: (
      <p className={claseParrafo}>
        Mensajes recibidos desde el formulario de contacto público de tu web. Puedes responder
        por email directamente, marcarlas como leídas o eliminarlas.
      </p>
    ),
  },
  {
    id: "usuarios",
    titulo: "Usuarios",
    contenido: (
      <p className={claseParrafo}>
        Listado de jugadores con cuenta creada en tu club (nombre, contacto, hándicap). Puedes
        desvincular la cuenta de un jugador (conserva su historial de torneos) o eliminar su
        ficha si nunca llegó a inscribirse en nada.
      </p>
    ),
  },
  {
    id: "configuracion",
    titulo: "Configuración",
    contenido: (
      <ul className={claseLista}>
        <li><strong>Número de Bizum</strong>: el que ven los jugadores al pagar su inscripción.</li>
        <li><strong>Teléfono de WhatsApp</strong>: para los torneos que gestiones por WhatsApp (ver &quot;Torneos&quot; arriba).</li>
        <li><strong>Categorías extra</strong>: categorías de hándicap adicionales para premios, además de las estándar.</li>
      </ul>
    ),
  },
  {
    id: "administradores",
    titulo: "Administradores",
    contenido: (
      <p className={claseParrafo}>
        Añade a más personas de tu club como administradoras, por su email — solo hace falta que
        esa persona haya iniciado sesión una vez en la web (con Google o email) antes de darla de
        alta aquí.
      </p>
    ),
  },
  {
    id: "experiencia-jugador",
    titulo: "Qué ve el jugador",
    contenido: (
      <>
        <p className={claseParrafo}>
          Útil para entender de qué te hablan cuando te escriben con una duda:
        </p>
        <ul className={claseLista}>
          <li>
            <strong>Calendario</strong>: torneos publicados, con ficha, precio, cupo y botón de
            inscripción.
          </li>
          <li>
            <strong>Inscripción</strong>: con cuenta o como invitado (sin registrarse); si no
            tiene licencia federativa, se le genera un código propio automáticamente.
          </li>
          <li>
            <strong>Mi cuenta</strong>: tres pestañas — Mis Datos (su perfil), Mis Inscripciones
            (historial de pedidos y pagos) y Mis Rondas (hándicaps guardados). La ficha de un
            jugador es propia de tu club: si juega también en otro club de la plataforma, tiene
            allí una ficha distinta.
          </li>
          <li>
            <strong>Calculadora de hándicap</strong> (pública, sin necesidad de estar inscrito en
            nada): calcula hándicap de juego, resultado neto, puntos Stableford y differential, a
            partir del catálogo oficial de la RFEG o de datos escritos a mano. Con sesión
            iniciada, puede guardar la ronda en su historial.
          </li>
          <li>
            <strong>Clasificaciones</strong>: la clasificación de cada torneo y el ranking
            oficial de cada liga, públicas para cualquiera, sin necesidad de cuenta.
          </li>
          <li>
            <strong>Patrocinadores</strong>: también ve, en la web pública, los logos y enlaces
            de los patrocinadores de tu club.
          </li>
        </ul>
      </>
    ),
  },
];

export default function ManualAdminPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
        Manual de usuario
      </h1>
      <p className="mt-1 text-sm text-ajag-gris-500">
        Guía rápida de cada sección del panel de administración.
      </p>

      <nav className="card-ajag mt-6 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ajag-gris-500">
          Contenido
        </p>
        <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {secciones.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-ajag-verde-700 hover:underline">
                {s.titulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 flex flex-col gap-4">
        {secciones.map((s) => (
          <section key={s.id} id={s.id} className="card-ajag scroll-mt-24 p-6">
            <h2 className="font-display text-lg font-semibold text-ajag-verde-900">
              {s.titulo}
            </h2>
            <div className="mt-2">{s.contenido}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
