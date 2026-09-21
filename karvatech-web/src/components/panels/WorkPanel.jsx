import { ArrowUpRight } from 'lucide-react'
import { useJourney, TALK_INDEX } from '../../journey'

const items = [
  {
    company: 'NOVA RETAIL',
    quote:
      'KARVATECH nos construyó un CRM a medida que centralizó nuestras ventas. Hoy nuestros asesores gastan la mitad del tiempo en reportes y el doble en cerrar negocios.',
    name: 'María Cárdenas',
    role: 'Gerente Comercial · Retail',
    initials: 'MC',
    color: '#16a34a',
  },
  {
    company: 'AviLog',
    quote:
      'El ERP implementado unificó inventario y finanzas. Pasamos de hojas de Excel a decisiones en tiempo real. El soporte es excelente, siempre disponibles.',
    name: 'Jorge Ramos',
    role: 'Director · Distribuidora',
    initials: 'JR',
    color: '#dc2626',
  },
]

export default function WorkPanel() {
  const { goTo } = useJourney()

  return (
    <section className="ix-panel ix-work" id="nuestro-trabajo">
      <div className="ix-pad ix-work-wrap">
        <div className="ix-work-head">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            EN SUS PALABRAS
          </p>
          <h2 className="ix-title">
            La experiencia,
            <span>en sus palabras.</span>
          </h2>
        </div>

        <div className="ix-art-strip ix-work-art">
          <div className="ix-art ix-art-banner">
            <img
              src="/images/art-work.jpg"
              alt="Panel de gestión y analítica construido por KARVATECH"
              loading="lazy"
            />
            <span className="ix-art-tag">CRM y analítica para tu operación</span>
          </div>
        </div>

        <div className="ix-work-grid">
          {items.map((t) => (
            <article key={t.name} className="ix-work-card">
              <p className="ix-work-company">{t.company}</p>
              <blockquote>“{t.quote}”</blockquote>
              <div className="ix-work-foot">
                <span className="ix-win" style={{ background: t.color }}>
                  {t.initials}
                </span>
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                </span>
                <button className="ix-work-view" onClick={() => goTo(TALK_INDEX)}>
                  Ver proyecto <ArrowUpRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}