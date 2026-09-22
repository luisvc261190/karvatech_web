import { useEffect, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Inbox,
  Loader2,
  Mail,
  NotebookPen,
  Send,
  Trash2,
  User,
} from 'lucide-react'
import { http } from './api'

const STATUS_CFG = {
  nuevo: { label: 'Nuevo', cls: 'nu' },
  contactado: { label: 'Contactado', cls: 'co' },
  cerrado: { label: 'Cerrado', cls: 'ce' },
}

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'nuevo', label: 'Nuevos' },
  { key: 'contactado', label: 'Contactados' },
  { key: 'cerrado', label: 'Cerrados' },
]

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageCard({ m, busy, onRemove, onSave, onSend }) {
  const [reply, setReply] = useState(m.replyBody || '')
  const [notes, setNotes] = useState(m.adminNotes || '')
  const [status, setStatus] = useState(m.status)
  const [flash, setFlash] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const savedNotice = (label) => {
    setFlash(label)
    setTimeout(() => setFlash(''), 2600)
  }

  const cfg = STATUS_CFG[m.status] || STATUS_CFG.nuevo
  const fullName = [m.name, m.lastName].filter(Boolean).join(' ')
  const first = m.name || 'Cliente'

  const mailtoHref = [
    `mailto:${encodeURIComponent(m.email || '')}`,
    `?subject=${encodeURIComponent('Respuesta de KARVATECH')}`,
    `&body=${encodeURIComponent(
      `Hola ${first},\n\n${reply}\n\n\n--\nEquipo KARVATECH\ncontacto@karvatech.com`,
    )}`,
  ].join('')

  const send = async () => {
    if (sending) return
    if (!reply.trim()) {
      setSendError('Escribe la respuesta antes de enviar.')
      return
    }
    setSending(true)
    setSendError('')
    try {
      await onSend(reply)
      savedNotice('Respuesta enviada y guardada')
    } catch (err) {
      setSendError(err.message || 'No se pudo enviar. Usa “Abrir en tu correo”.')
    } finally {
      setSending(false)
    }
  }

  return (
    <article className="kt-msg">
      <div className="kt-msg-head">
        <span className={`kt-badge ${cfg.cls}`}>{cfg.label}</span>
        <span className="kt-msg-who">{fullName || 'Sin nombre'}</span>
        <span className="kt-msg-date">{fmtDate(m.createdAt)}</span>
      </div>

      <div className="kt-msg-meta">
        {m.email && (
          <span>
            <Mail size={13} />
            <a href={`mailto:${m.email}`}>{m.email}</a>
          </span>
        )}
        {m.company && (
          <span>
            <Building2 size={13} />
            {[m.company, m.position].filter(Boolean).join(' · ')}
          </span>
        )}
        {[m.sector, m.employees, m.country].filter(Boolean).length > 0 && (
          <span>
            <User size={13} />
            {[m.sector, m.employees, m.country].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      <p className="kt-msg-pain">{m.pain}</p>

      <div className="kt-msg-actions">
        <label className="kt-select">
          <span>Estado</span>
          <select
            value={status}
            disabled={busy}
            onChange={(e) => {
              setStatus(e.target.value)
              onSave({ status: e.target.value })
            }}
          >
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </label>
        <button
          className="kt-btn kt-btn-ghost-red"
          disabled={busy}
          onClick={() => onRemove(m.id)}
        >
          <Trash2 size={15} />
          Eliminar
        </button>
      </div>

      <div className="kt-msg-notes">
        <label className="kt-field">
          <span>
            <Send size={13} />
            Respuesta al cliente
          </span>
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Redacta la respuesta que enviarás a este cliente…"
          />
          <div className="kt-reply-actions">
            <button className="kt-btn kt-btn-primary" disabled={sending} onClick={send}>
              {sending ? <Loader2 className="kt-spin" size={15} /> : <Send size={15} />}
              {sending ? 'Enviando…' : 'Enviar respuesta'}
            </button>
            {m.email && reply.trim() ? (
              <a className="kt-btn" href={mailtoHref} target="_blank" rel="noreferrer">
                <Mail size={15} />
                Abrir en tu correo
              </a>
            ) : null}
            <button
              className="kt-btn kt-btn-ghost"
              disabled={busy}
              onClick={() => {
                onSave({ replyBody: reply })
                savedNotice('Respuesta guardada')
              }}
            >
              Guardar borrador
            </button>
          </div>
          {sendError && <p className="kt-error">{sendError}</p>}
          {m.replySentAt && (
            <span className="kt-msg-sent">
              <CheckCircle2 size={13} />
              Respondido el {fmtDate(m.replySentAt)}
            </span>
          )}
        </label>

        <label className="kt-field">
          <span>
            <NotebookPen size={13} />
            Notas internas
          </span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas solo para tu equipo…"
          />
          <button
            className="kt-btn kt-btn-ghost"
            disabled={busy}
            onClick={() => {
              onSave({ adminNotes: notes })
              savedNotice('Notas guardadas')
            }}
          >
            Guardar notas
          </button>
        </label>
      </div>

      {flash && <p className="kt-flash">{flash}</p>}
    </article>
  )
}

export default function MessagesView() {
  const PAGE = 50
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [moreError, setMoreError] = useState('')
  const [filter, setFilter] = useState('todos')
  const [busy, setBusy] = useState(false)

  const hasMore = total > items.length

  const fetchPage = (reset, statusFilter, offset) => {
    const status = statusFilter && statusFilter !== 'todos' ? statusFilter : ''
    const params = new URLSearchParams({ limit: String(PAGE) })
    if (!reset) params.set('offset', String(offset))
    if (status) params.set('status', status)

    if (reset) {
      setLoading(true)
      setError(false)
    } else {
      setLoadingMore(true)
      setMoreError('')
    }

    return http
      .get(`/api/admin/messages?${params.toString()}`)
      .then((data) => {
        const chunk = data.items || []
        setItems(reset ? chunk : (prev) => [...prev, ...chunk])
        setTotal(data.total || 0)
        setCounts(data.counts || {})
      })
      .catch(() => {
        if (reset) setError(true)
        else setMoreError('No pudimos cargar más mensajes.')
      })
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }

  const reload = () => fetchPage(true, filter)

  useEffect(() => {
    fetchPage(true, filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    fetchPage(false, filter, items.length)
  }

  const savePatch = async (id, patch) => {
    setBusy(true)
    try {
      await http.patch(`/api/admin/messages/${id}`, patch)
      reload()
    } finally {
      setBusy(false)
    }
  }

  const sendReply = async (id, replyBody) => {
    setBusy(true)
    try {
      await http.post(`/api/admin/messages/${id}/reply`, { replyBody })
      reload()
    } finally {
      setBusy(false)
    }
  }

  const removeMessage = async (id) => {
    if (busy) return
    if (!window.confirm('¿Eliminar este mensaje de forma permanente?')) return
    setBusy(true)
    try {
      await http.del(`/api/admin/messages/${id}`)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="kt-view">
      <header className="kt-view-head">
        <div>
          <p className="kt-eyebrow">BANDEJA DE ENTRADA</p>
          <h1>Solicitudes de clientes</h1>
        </div>
        <div className="kt-stats">
          <span className="kt-stat">
            <strong>{counts.nuevo || 0}</strong>
            Nuevos
          </span>
          <span className="kt-stat">
            <strong>{counts.contactado || 0}</strong>
            Contactados
          </span>
          <span className="kt-stat">
            <strong>{counts.cerrado || 0}</strong>
            Cerrados
          </span>
        </div>
      </header>

      <div className="kt-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`kt-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="kt-empty">
          <Loader2 className="kt-spin" size={22} />
          Cargando mensajes…
        </div>
      ) : error ? (
        <div className="kt-empty">
          <p>No pudimos cargar la bandeja.</p>
          <button className="kt-btn kt-btn-primary" onClick={reload}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="kt-empty">
          <Inbox size={34} />
          <p>No hay mensajes en este filtro.</p>
        </div>
      ) : (
        <>
          <div className="kt-msg-list">
            {items.map((m) => (
              <MessageCard
                key={m.id}
                m={m}
                busy={busy}
                onRemove={removeMessage}
                onSave={(patch) => savePatch(m.id, patch)}
                onSend={(replyBody) => sendReply(m.id, replyBody)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="kt-more">
              <button className="kt-btn kt-btn-ghost" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="kt-spin" size={15} /> : null}
                {loadingMore
                  ? 'Cargando más…'
                  : `Cargar más (${items.length} de ${total})`}
              </button>
              {moreError && <p className="kt-error kt-more-error">{moreError}</p>}
            </div>
          )}
        </>
      )}
    </section>
  )
}