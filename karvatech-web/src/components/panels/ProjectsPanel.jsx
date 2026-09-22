import { useEffect, useState } from 'react'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { useJourney, TALK_INDEX } from '../../journey'

const STATUS_LABEL = {
  publicado: 'En línea',
  en_curso: 'En curso',
  entregado: 'Entregado',
}

export default function ProjectsPanel() {
  const { goTo } = useJourney()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [broken, setBroken] = useState({})

  useEffect(() => {
    let alive = true
    fetch('/api/projects')
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar los proyectos')
        return r.json()
      })
      .then((data) => {
        if (alive) {
          setItems(data.items || [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (alive) {
          setError(true)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [])

  const hideImage = (id) => setBroken((b) => ({ ...b, [id]: true }))

  return (
    <section className="ix-panel ix-projects" id="proyectos">
      <div className="ix-pad ix-projects-wrap">
        <div className="ix-projects-head">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            PROYECTOS REALIZADOS
          </p>
          <h2 className="ix-title">
            Soluciones reales,<span>no promesas.</span>
          </h2>
        </div>

        {loading ? (
          <p className="ix-projects-state">
            <Loader2 className="ix-spin" size={16} />
            Cargando proyectos…
          </p>
        ) : error || items.length === 0 ? (
          <div className="ix-projects-empty">
            <strong>Pronto más historias</strong>
            <p>
              Estamos acondicionando este escaparate. Mientras tanto, cuéntanos qué
              necesitas construir.
            </p>
            <button className="ix-button ix-button-solid" onClick={() => goTo(TALK_INDEX)}>
              Hablemos
              <ArrowUpRight size={16} />
            </button>
          </div>
        ) : (
          <div className="ix-projects-grid">
            {items.map((p) => {
              const showImg = p.imageUrl && !broken[p.id]
              return (
                <article key={p.id} className="ix-proj-card">
                  <div className="ix-proj-media" style={{ background: p.accent }}>
                    {showImg ? (
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        loading="lazy"
                        onError={() => hideImage(p.id)}
                      />
                    ) : (
                      <span className="ix-proj-mark">{p.title.charAt(0)}</span>
                    )}
                    {p.category && <span className="ix-proj-cat">{p.category}</span>}
                    {STATUS_LABEL[p.status] && (
                      <span className="ix-proj-status">{STATUS_LABEL[p.status]}</span>
                    )}
                  </div>

                  <div className="ix-proj-body">
                    {p.year && <span className="ix-proj-year">{p.year}</span>}
                    <h3>{p.title}</h3>
                    {p.subtitle && <p className="ix-proj-sub">{p.subtitle}</p>}
                    {p.quote && <blockquote>“{p.quote}”</blockquote>}
                    {p.tags.length > 0 && (
                      <div className="ix-proj-tags">
                        {p.tags.slice(0, 4).map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    )}
                    <button className="ix-text-link" onClick={() => goTo(TALK_INDEX)}>
                      Quiero algo así
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}