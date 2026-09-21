import { Layers, CodeXml, Workflow, ArrowUpRight } from 'lucide-react'
import { useJourney, TALK_INDEX } from '../../journey'

const cards = [
  {
    num: '01',
    title: 'Estrategia',
    heading: 'Primero, un plan claro.',
    desc: 'Estrategia, alcance y arquitectura para tu idea o negocio.',
    icon: Layers,
  },
  {
    num: '02',
    title: 'Construcción',
    heading: 'Después, hacerlo funcionar.',
    desc: 'Aplicaciones, plataformas, CRMs, ERPs e integraciones a medida.',
    icon: CodeXml,
  },
  {
    num: '03',
    title: 'Evolución',
    heading: 'Y un equipo que se queda.',
    desc: 'Mejoras continuas y soporte mientras tu negocio crece.',
    icon: Workflow,
  },
]

export default function HowPanel() {
  const { goTo } = useJourney()

  return (
    <section className="ix-panel ix-how" id="como-trabajamos">
      <div className="ix-pad ix-how-wrap">
        <div className="ix-how-head">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            CÓMO TRABAJAMOS
          </p>
          <h2 className="ix-title">
            Entender. Construir.
            <span>Seguir mejorando.</span>
          </h2>
        </div>

        <div className="ix-how-grid">
          {cards.map((c) => (
            <article key={c.num} className="ix-how-card">
              <p className="ix-eyebrow">
                {c.num} / {c.title.toUpperCase()}
              </p>
              <div className="ix-how-icon" style={{ background: c.num === '02' ? 'var(--red)' : 'var(--green)' }}>
                <c.icon size={22} />
              </div>
              <h3>{c.heading}</h3>
              <p className="ix-how-desc">{c.desc}</p>
              <button className="ix-text-link" onClick={() => goTo(TALK_INDEX)}>
                <span>Explorar</span>
                <ArrowUpRight size={17} />
              </button>
            </article>
          ))}
        </div>

        <div className="ix-art-strip">
          <div className="ix-art ix-art-banner">
            <img
              src="/images/art-how.jpg"
              alt="Reunión de definición de alcance y estrategia en KARVATECH"
              loading="lazy"
            />
            <span className="ix-art-tag">Estrategia → Construcción → Evolución</span>
          </div>
        </div>
      </div>
    </section>
  )
}