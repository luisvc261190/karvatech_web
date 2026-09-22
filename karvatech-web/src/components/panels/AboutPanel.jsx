import { ArrowUpRight, Code, Handshake, Quote, Rocket, Target } from 'lucide-react'
import { useJourney, TALK_INDEX } from '../../journey'

const milestones = [
  {
    y: '2019',
    t: 'Nace KARVATECH',
    d: 'Comenzamos con una convicción: las empresas necesitan tecnología que entienda realmente cómo funciona su negocio.',
  },
  {
    y: '2021',
    t: 'Primeras soluciones',
    d: 'Comenzamos a desarrollar aplicaciones y sistemas personalizados para diferentes necesidades empresariales.',
  },
  {
    y: '2022',
    t: 'Soluciones integrales',
    d: 'Ampliamos nuestro trabajo hacia plataformas web, sistemas de gestión, infraestructura y soporte tecnológico.',
  },
  {
    y: '2023',
    t: 'Automatización e inteligencia artificial',
    d: 'Incorporamos nuevas herramientas de automatización e inteligencia artificial para resolver procesos cada vez más complejos.',
  },
  {
    y: 'Hoy',
    t: 'Seguimos construyendo',
    d: 'Continuamos desarrollando soluciones para empresas que buscan digitalizarse, optimizar su operación y crecer con tecnología.',
  },
]

const vision = {
  icon: Rocket,
  title: 'Nuestra visión',
  focus: 'Ser un socio tecnológico de confianza para empresas que quieren crecer.',
  d: 'Queremos que la tecnología sea una herramienta para avanzar: soluciones escalables, mantenibles y diseñadas alrededor de las necesidades reales de cada negocio.',
}

const mission = {
  icon: Target,
  title: 'Nuestra misión',
  focus: 'Escuchar, entender y transformar.',
  d: 'Convertimos procesos manuales, problemas operativos e ideas de negocio en soluciones tecnológicas funcionales, acompañando cada proyecto desde la primera conversación hasta su evolución.',
}

const trust = [
  {
    icon: Code,
    title: 'Software a medida',
    d: 'Nada genérico: cada solución se diseña alrededor de cómo opera tu negocio.',
  },
  {
    icon: Handshake,
    title: 'Acompañamiento cercano',
    d: 'Estamos contigo desde la primera conversación hasta la puesta en producción.',
  },
]

const gifs = [
  {
    src: '/images/gifs/dev-code.gif',
    tag: 'Desarrollo de software',
    d: 'Sistemas personalizados para administrar y optimizar la operación de tu empresa.',
  },
  {
    src: '/images/apps_plataformas.jpg',
    tag: 'Apps y plataformas',
    d: 'Plataformas web y aplicaciones que conectan clientes, equipos y procesos.',
  },
  {
    src: '/images/inteligencia-artificial.png',
    tag: 'Inteligencia artificial',
    d: 'IA integrada en procesos para automatizar, analizar y mejorar la interacción.',
  },
  {
    src: '/images/automatizacion.jpg',
    tag: 'Automatización y datos',
    d: 'Procesos y datos conectados para reducir tareas manuales y decidir mejor.',
  },
]

export default function AboutPanel() {
  const { goTo } = useJourney()

  return (
    <section className="ix-panel ix-about" id="nosotros">
      <span className="ix-ghost" aria-hidden="true">
        HISTORIA
      </span>

      <div className="ix-pad ix-about-wrap">
        <header className="ix-history-head">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            LA HISTORIA DE KARVATECH
          </p>
          <h2 className="ix-title">
            Tecnología que nace de
            <span>entender tu negocio.</span>
          </h2>
          <p className="ix-lede">
            KARVATECH nació con una idea sencilla: el software debe adaptarse al
            negocio, no obligar al negocio a adaptarse al software.
          </p>
        </header>

        <div className="ix-history-grid">
          <div className="ix-story">
            <p>
              Desde nuestros primeros proyectos trabajamos junto a empresas que
              necesitan digitalizar procesos, mejorar su operación y convertir
              sus ideas en soluciones tecnológicas reales.
            </p>
            <p>
              Nuestro enfoque es directo: primero escuchamos, luego entendemos
              cómo funciona tu negocio y finalmente construimos la tecnología
              que realmente necesitas.
            </p>
            <p>
              Hoy desarrollamos software a medida, plataformas web, aplicaciones,
              automatizaciones e inteligencia artificial, trabajando de cerca
              con cada cliente desde la planificación hasta la puesta en
              producción.
            </p>

            <blockquote className="ix-quote">
              <Quote size={20} aria-hidden="true" />
              <p>
                «No vendemos soluciones genéricas: construimos la tecnología que
                tu negocio necesita y te acompañamos para hacerla evolucionar.»
              </p>
            </blockquote>

            <button className="ix-text-link" onClick={() => goTo(TALK_INDEX)}>
              <span>La historia continúa contigo</span>
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div className="ix-mv">
            <article className="ix-mv-card">
              <span className="ix-mv-icon">
                <Rocket size={20} strokeWidth={2.1} />
              </span>
              <h3>{vision.title}</h3>
              <strong>{vision.focus}</strong>
              <p>{vision.d}</p>
            </article>
            <article className="ix-mv-card">
              <span className="ix-mv-icon">
                <Target size={20} strokeWidth={2.1} />
              </span>
              <h3>{mission.title}</h3>
              <strong>{mission.focus}</strong>
              <p>{mission.d}</p>
            </article>
          </div>
        </div>

        <ol className="ix-timeline">
          {milestones.map((m) => (
            <li key={m.y}>
              <span className="ix-timeline-dot" aria-hidden="true" />
              <span className="ix-timeline-year">{m.y}</span>
              <div className="ix-timeline-copy">
                <h3>{m.t}</h3>
                <p>{m.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="ix-about-body">
          <div className="ix-about-cards">
            <article className="ix-founder">
              <span className="ix-founder-av green">LV</span>
              <div>
                <h3>Luis Alberto Valle Coronado</h3>
                <p className="ix-founder-role">Fundador · CEO</p>
                <p className="ix-founder-desc">
                  Desarrollo de software y arquitectura de soluciones. Convierte
                  las necesidades del negocio en tecnología funcional, escalable
                  y mantenible.
                </p>
              </div>
            </article>
            <article className="ix-founder">
              <span className="ix-founder-av red">KA</span>
              <div>
                <h3>Karla Elizabeth Albites Palomino</h3>
                <p className="ix-founder-role">Cofundadora · COO</p>
                <p className="ix-founder-desc">
                  Estrategia de producto, procesos y experiencia de cliente.
                  Conecta cada necesidad con un proyecto claro, ordenado y
                  orientado a resultados.
                </p>
              </div>
            </article>
          </div>

          <div className="ix-trust">
            {trust.map((t) => (
              <article className="ix-trust-card" key={t.title}>
                <span className="ix-trust-icon">
                  <t.icon size={17} strokeWidth={2.1} />
                </span>
                <h3>{t.title}</h3>
                <p>{t.d}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="ix-gif-strip">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            LO QUE HACEMOS, EN MOVIMIENTO
          </p>
          <div className="ix-gif-grid">
            {gifs.map((g) => (
              <figure className="ix-gif-card" key={g.tag}>
                <img
                  src={g.src}
                  alt={g.tag}
                  loading="lazy"
                />
                <figcaption>
                  <span className="ix-art-tag">{g.tag}</span>
                  <p>{g.d}</p>
                </figcaption>
              </figure>
            ))}
          </div>

<br />
          
        </div>
      </div>
    </section>
  )
}