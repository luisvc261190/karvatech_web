import { MessageCircle } from 'lucide-react'
import TechCanvas from '../TechCanvas'
import { useJourney, TALK_INDEX } from '../../journey'

const clients = ['NOVA RETAIL', 'AviLog', 'MedLive', 'EduPlus', 'CrediAndes', 'FarmaGroup']

export default function HeroPanel() {
  const { goTo, next } = useJourney()

  return (
    <section className="ix-panel ix-hero" id="inicio">
      <div className="ix-film">
        <div className="ix-film-grid" />
        <TechCanvas />
      </div>

      <div className="ix-pad ix-hero-copy">
        <p className="ix-eyebrow">
          <span aria-hidden="true" />
          DESARROLLO DE SOFTWARE · CRM · ERP
        </p>

        <h1 className="ix-display">
          Construimos software.
          <span>Transformamos negocios.</span>
        </h1>

        <div className="ix-hero-bottom">
          <p>
            Apps, plataformas y sistemas de gestión a medida para lanzar nuevos
            negocios y transformar los que ya están en marcha.
          </p>
          <button className="ix-button ix-button-solid" onClick={() => goTo(TALK_INDEX)}>
            <MessageCircle size={18} />
            Hablemos de tu proyecto
          </button>
        </div>
      </div>

      <div className="ix-proof">
        <span>TECNOLOGÍA QUE HEMOS CONSTRUIDO PARA</span>
        <div className="ix-proof-logos">
          {clients.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      </div>

      <button className="ix-scroll-hint" onClick={next}>
        Scroll para explorar
        <span className="ix-scroll-line" aria-hidden="true" />
      </button>
    </section>
  )
}