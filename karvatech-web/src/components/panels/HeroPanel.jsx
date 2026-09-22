import { MessageCircle, ArrowUpRight, Smartphone, Globe, Boxes } from 'lucide-react'
import TechCanvas from '../TechCanvas'
import { useJourney, TALK_INDEX } from '../../journey'

const features = [
  {
    icon: Smartphone,
    n: '01',
    title: 'Apps a medida',
    d: 'Aplicaciones móviles para tu negocio y para nuevas ideas.',
  },
  {
    icon: Globe,
    n: '02',
    title: 'Plataformas web',
    d: 'Productos que lanzan servicios, venden y conectan usuarios.',
  },
  {
    icon: Boxes,
    n: '03',
    title: 'CRM · ERP · IA',
    d: 'Sistemas de gestión e inteligencia artificial para tu empresa.',
  },
]

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

        <p className="ix-lede">
          Apps, plataformas y sistemas de gestión a medida para lanzar nuevos
          negocios y transformar los que ya están en marcha.
        </p>

        <div className="ix-hero-feats">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <button
                key={f.n}
                type="button"
                className="ix-hero-feat"
                onClick={() => goTo(1)}
              >
                <span className="ix-hero-feat-top">
                  <span className="ix-hero-feat-icon">
                    <Icon size={19} strokeWidth={2.1} />
                  </span>
                  <small>{f.n}</small>
                </span>
                <strong>{f.title}</strong>
                <span className="ix-hero-feat-d">{f.d}</span>
              </button>
            )
          })}
        </div>

        <div className="ix-hero-bottom">
          <button className="ix-button ix-button-solid" onClick={() => goTo(TALK_INDEX)}>
            <MessageCircle size={18} />
            Hablemos de tu proyecto
          </button>
          <button className="ix-text-link" onClick={() => goTo(1)}>
            <span>Explorar qué construimos</span>
            <ArrowUpRight size={17} />
          </button>
          <p className="ix-hero-note">
            Agenda una llamada. Respuesta en menos de 24 h hábiles.
          </p>
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