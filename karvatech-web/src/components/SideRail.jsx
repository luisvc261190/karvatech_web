import { useEffect, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useJourney, PANELS, TALK_INDEX } from '../journey'

export default function SideRail() {
  const { goTo, index } = useJourney()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const goto = (i) => {
    setOpen(false)
    goTo(i)
  }

  return (
    <>
      <aside className="ix-rail">
        <button className="ix-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <span />
          <span />
          <small>MENÚ</small>
        </button>

        <button className="ix-logo" onClick={() => goto(0)} aria-label="Ir al inicio">
          <span className="ix-logo-mark">K</span>
          <span className="ix-logo-text">
            KARVA<span className="ix-logo-accent">TECH</span>
          </span>
        </button>

        <button className="ix-talk" onClick={() => goto(TALK_INDEX)}>
          <MessageCircle size={17} />
          <span>Hablemos</span>
        </button>
      </aside>

      {open && (
        <div className="ix-menu" role="dialog" aria-modal="true" aria-label="Explora KARVATECH">
          <div className="ix-menu-top">
            <span>
              KARVATECH<span> / EXPLORA</span>
            </span>
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú">
              <X size={20} />
            </button>
          </div>

          <nav className="ix-menu-nav" aria-label="Explora KARVATECH">
            {PANELS.map((p) => (
              <button
                key={p.id}
                className={`ix-menu-link ${index === Number(p.num) ? 'active' : ''}`}
                onClick={() => goto(Number(p.num))}
              >
                <small>{p.num}</small>
                {p.nav}
              </button>
            ))}
          </nav>

          <div className="ix-menu-foot">
            <p>contacto@karvatech.com</p>
            <p>+51 999 999 999 · Lima, Perú</p>
          </div>
        </div>
      )}

      {open && <div className="ix-menu-backdrop" onClick={() => setOpen(false)} />}
    </>
  )
}