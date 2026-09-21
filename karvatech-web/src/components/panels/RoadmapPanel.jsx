import { Layers } from 'lucide-react'
import { useJourney, TALK_INDEX } from '../../journey'

const items = [
  {
    q: '¿Tu negocio empieza con una app?',
    feature: 'Aplicaciones móviles.',
    d: 'Construimos apps de taxi, de pedidos y de nuevos servicios, desde la primera idea hasta el lanzamiento.',
  },
  {
    q: '¿Tu idea necesita una plataforma?',
    feature: 'Plataformas web.',
    d: 'Desarrollamos productos web para lanzar servicios, vender y conectar usuarios.',
  },
  {
    q: '¿Tu operación ya no cabe en planillas?',
    feature: 'Sistemas de gestión (CRM y ERP).',
    d: 'Ventas, inventario y reportes conectados en un sistema construido para tu empresa.',
  },
  {
    q: '¿Copiar datos te quita el día?',
    feature: 'Automatización de procesos.',
    d: 'Conectamos tus herramientas para eliminar tareas repetitivas y errores manuales.',
  },
  {
    q: '¿Quieres usar IA pero no sabes cómo?',
    feature: 'Inteligencia artificial.',
    d: 'Integramos asistentes y agentes de IA para atender clientes, analizar información y ejecutar tareas.',
  },
  {
    q: '¿La tecnología frena tu crecimiento?',
    feature: 'Transformación digital.',
    d: 'Conectamos estrategia, procesos y tecnología para transformar cómo trabaja tu negocio.',
  },
]

export default function RoadmapPanel() {
  const { goTo } = useJourney()

  return (
    <section className="ix-panel ix-roadmap" id="que-construimos">
      <div className="ix-pad ix-roadmap-grid">
        <div className="ix-roadmap-head">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            DE LO QUE NECESITAS A LO QUE CONSTRUIMOS
          </p>
          <h2 className="ix-title">
            Lanza tu idea.
            <span>Transforma tu empresa.</span>
          </h2>
          <p className="ix-lede">
            Desde apps y plataformas hasta sistemas de gestión e inteligencia
            artificial para tu empresa.
          </p>
          <div className="ix-meter">
            <span aria-hidden="true">
              <span />
            </span>
            Software para tu próximo negocio o su siguiente capítulo.
          </div>
        </div>

        <ol className="ix-roadmap-list">
          {items.map((it, i) => (
            <li key={i}>
              <span className="ix-roadmap-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{it.q}</h3>
                <p>
                  <strong>{it.feature}</strong> {it.d}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="ix-roadmap-actions">
          <button className="ix-button ix-button-solid" onClick={() => goTo(TALK_INDEX)}>
            <Layers size={18} />
            Reserva una conversación
          </button>
          <button className="ix-text-link" onClick={() => goTo(TALK_INDEX)}>
            <span>O pide una cotización</span>
            <Layers size={17} />
          </button>
        </div>

        <div className="ix-art-strip ix-roadmap-art">
          <div className="ix-art ix-art-banner">
            <img
              src="/images/art-software.jpg"
              alt="Desarrolladores construyendo software a medida en KARVATECH"
              loading="lazy"
            />
            <span className="ix-art-tag">Proyectos en curso</span>
          </div>
        </div>
      </div>
    </section>
  )
}