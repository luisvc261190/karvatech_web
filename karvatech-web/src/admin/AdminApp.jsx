import { useEffect, useState } from 'react'
import {
  ExternalLink,
  FolderKanban,
  KeyRound,
  Loader2,
  LogOut,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react'
import { http, logout } from './api'
import ChangePassword from './ChangePassword'
import Login from './Login'
import MessagesView from './Messages'
import ProjectsView from './Projects'

export default function AdminApp() {
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('mensajes')
  const [passOpen, setPassOpen] = useState(false)

  useEffect(() => {
    let alive = true
    http
      .get('/api/admin/me')
      .then((data) => alive && setUser(data.user))
      .catch(() => alive && setUser(false))
      .finally(() => alive && setLoaded(true))
    return () => {
      alive = false
    }
  }, [])

  const leave = async () => {
    await logout()
    setUser(false)
  }

  if (!loaded) {
    return (
      <div className="kt-loading">
        <Loader2 className="kt-spin" size={22} />
        <span>Cargando panel…</span>
      </div>
    )
  }

  if (!user) return <Login onSuccess={setUser} />

  return (
    <div className="kt">
      <aside className="kt-side">
        <a className="kt-logo" href="#/">
          <span className="kt-brand-mark">K</span>
          <span className="kt-logo-text">
            KARVA<span>TECH</span>
          </span>
        </a>

        <nav className="kt-nav" aria-label="Secciones del panel">
          <button
            className={`kt-nav-btn ${view === 'mensajes' ? 'active' : ''}`}
            onClick={() => setView('mensajes')}
          >
            <MessageSquareText size={17} />
            Mensajes
          </button>
          <button
            className={`kt-nav-btn ${view === 'proyectos' ? 'active' : ''}`}
            onClick={() => setView('proyectos')}
          >
            <FolderKanban size={17} />
            Proyectos
          </button>
        </nav>

        <div className="kt-side-foot">
          <div className="kt-user">
            <span className="kt-avatar">{String(user.username || 'A').slice(0, 1).toUpperCase()}</span>
            <span>{user.username}</span>
          </div>
          <a className="kt-side-link" href="#/">
            <ExternalLink size={14} />
            Ver sitio
          </a>
          <button className="kt-side-link" onClick={() => setPassOpen(true)}>
            <KeyRound size={14} />
            Cambiar contraseña
          </button>
          <button className="kt-side-link kt-danger" onClick={leave}>
            <LogOut size={14} />
            Cerrar sesión
          </button>
          <p className="kt-side-note">
            <ShieldCheck size={12} />
            Sesión protegida · CSRF activo
          </p>
        </div>
      </aside>

      <main className="kt-main">
        {view === 'mensajes' ? <MessagesView /> : <ProjectsView />}
      </main>

      {passOpen && (
        <ChangePassword
          onClose={() => setPassOpen(false)}
          onChanged={() => {
            setPassOpen(false)
            setUser(false)
          }}
        />
      )}
    </div>
  )
}