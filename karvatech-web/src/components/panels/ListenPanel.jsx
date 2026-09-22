import { ArrowUpRight, CodeXml, Server, Headphones } from 'lucide-react'
import { useJourney } from '../../journey'

const points = [
  {
    icon: CodeXml,
    title: 'Software a medida',
    desc: 'Apps, plataformas y sistemas de gestión hechos para tu operación.',
  },
  {
    icon: Server,
    title: 'Servidores y equipos',
    desc: 'Te conectamos con proveedores de hosting y hardware cuando tu proyecto lo necesita.',
  },
  {
    icon: Headphones,
    title: 'Soporte que se queda',
    desc: 'Acompañamos tu negocio en cada etapa, desde la idea hasta la operación.',
  },
]

export default function ListenPanel() {
  const { goTo } = useJourney()

  return (
    <section className="ix-panel ix-listen" id="escuchar">
      <span className="ix-ghost" aria-hidden="true">
        ESCUCHAR
      </span>

      <div className="ix-pad ix-listen-copy">
        <div className="ix-listen-text">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            TU SOCIO TECNOLÓGICO
          </p>
          <h2 className="ix-title">
            Nuestra primera herramienta
            <span>es escuchar.</span>
          </h2>
          <p className="ix-lede">
            Desarrollamos tu software y te conectamos con proveedores de
            servidores y equipos cuando tu proyecto lo necesita.
          </p>

          <ul className="ix-listen-points">
            {points.map((p) => {
              const Icon = p.icon
              return (
                <li key={p.title}>
                  <span className="ix-listen-point-icon">
                    <Icon size={18} strokeWidth={2.1} />
                  </span>
                  <span className="ix-listen-point-copy">
                    <strong>{p.title}</strong>
                    <small>{p.desc}</small>
                  </span>
                </li>
              )
            })}
          </ul>

          <button className="ix-text-link" onClick={() => goTo(4)}>
            <span>Explorar cómo trabajamos</span>
            <ArrowUpRight size={17} />
          </button>
        </div>

        <div className="ix-listen-video">
          <video
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            poster="/images/art-listen.jpg"
            aria-label="Desarrollador de software escribiendo código junto a su pantalla"
          >
            <source src="/video/programacion.mp4" type="video/mp4" />
          </video>
          <span className="ix-art-tag">Así construimos tu software</span>
        </div>
      </div>
    </section>
  )
}