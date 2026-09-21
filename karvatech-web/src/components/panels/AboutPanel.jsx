import { ArrowUpRight } from 'lucide-react'
import { useJourney, TALK_INDEX } from '../../journey'

const stats = [
  { v: '+40', l: 'Proyectos entregados' },
  { v: '15+', l: 'Rubros atendidos' },
  { v: '98%', l: 'Clientes satisfechos' },
  { v: '24/7', l: 'Soporte continuo' },
]

export default function AboutPanel() {
  const { goTo } = useJourney()

  return (
    <section className="ix-panel ix-about" id="nosotros">
      <div className="ix-pad ix-about-wrap">
        <div className="ix-about-head">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            LAS PERSONAS DETRÁS DE LA TECNOLOGÍA
          </p>
          <h2 className="ix-title">
            Un equipo que
            <span>se involucra.</span>
          </h2>
        </div>

        <div className="ix-about-body">
          <div className="ix-about-cards">
            <article className="ix-founder">
              <span className="ix-founder-av green">LV</span>
              <div>
                <h3>Luis Alberto Valle Coronado</h3>
                <p className="ix-founder-role">Fundador · CEO</p>
                <p className="ix-founder-desc">
                  Ingeniería de software y arquitectura de soluciones.
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
                </p>
              </div>
            </article>
            <button className="ix-text-link" onClick={() => goTo(TALK_INDEX)}>
              <span>La historia de KARVATECH</span>
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div className="ix-stats">
            {stats.map((s, i) => (
              <div key={i} className="ix-stat">
                <strong>{s.v}</strong>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ix-art-strip ix-about-art">
          <div className="ix-art ix-art-about">
            <img
              src="/images/art-about.jpg"
              alt="El equipo de KARVATECH trabajando junto a sus clientes"
              loading="lazy"
            />
            <span className="ix-art-tag">Somos tu equipo técnico</span>
          </div>
        </div>
      </div>
    </section>
  )
}