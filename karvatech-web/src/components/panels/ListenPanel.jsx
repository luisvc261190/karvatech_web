import { ArrowUpRight } from 'lucide-react'
import { useJourney } from '../../journey'

export default function ListenPanel() {
  const { goTo } = useJourney()

  return (
    <section className="ix-panel ix-listen" id="escuchar">
      <span className="ix-ghost" aria-hidden="true">
        ESCUCHAR
      </span>

      <div className="ix-listen-mascot" aria-hidden="true">
        <div className="ix-mascot-k">
          <span className="half-green" />
          <span className="half-red" />
          <b>K</b>
        </div>
      </div>

      <div className="ix-pad ix-listen-copy">
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
        <button className="ix-text-link" onClick={() => goTo(4)}>
          <span>Explorar cómo trabajamos</span>
          <ArrowUpRight size={17} />
        </button>
        <div className="ix-art ix-art-listen">
          <img
            src="/images/art-listen.jpg"
            alt="Primera reunión: escuchamos tu proyecto antes de construir"
            loading="lazy"
          />
          <span className="ix-art-tag">Primera reunión</span>
        </div>
      </div>
    </section>
  )
}