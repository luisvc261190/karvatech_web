import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Download,
  ArrowUpRight,
  Mail,
} from 'lucide-react'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const SLOTS = []
for (let h = 9; h <= 18; h++) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h !== 18) SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}
SLOTS.pop()

const EVENT_TEXT = 'Reunión con KARVATECH'
const EVENT_LOCATION = 'Videollamada (Google Meet)'
const DURATION_MIN = 60

const fmtDay = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const stamp = (d) => {
  const u = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return u.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
}

const pad2 = (n) => String(n).padStart(2, '0')

const gcalUrl = (name, email, details, start, end) => {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TEXT,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `Participante: ${name} (${email})\n\nNotas:\n${details || 'Sin notas'}`,
    location: EVENT_LOCATION,
    add: 'contacto@karvatech.com',
  })
  return 'https://calendar.google.com/calendar/render?' + p.toString()
}

const downloadIcs = (name, email, details, start, end) => {
  const escapeText = (s) => s.replace(/\n/g, '\\n').replace(/,/g, '\\,')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KARVATECH//Reuniones//ES',
    'BEGIN:VEVENT',
    `UID:${start.getTime()}@karvatech.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${EVENT_TEXT}`,
    `LOCATION:${EVENT_LOCATION}`,
    `DESCRIPTION:${escapeText(`Participante: ${name} (${email})\n\n${details || 'Sin notas'}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'reunion-karvatech.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ScheduleModal({
  open,
  onClose,
  defaultName = '',
  defaultEmail = '',
  defaultDetails = '',
}) {
  const today = new Date()
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selDate, setSelDate] = useState(null)
  const [selSlot, setSelSlot] = useState(null)
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [details, setDetails] = useState(defaultDetails)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    const now = new Date()
    setView(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelDate(null)
    setSelSlot(null)
    setDone(false)
    document.body.classList.add('ix-modal-open')

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('ix-modal-open')
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const cells = useMemo(() => {
    const y = view.getFullYear()
    const m = view.getMonth()
    const startOffset = new Date(y, m, 1).getDay()
    const st = startOffset === 0 ? 6 : startOffset - 1
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const out = []
    for (let i = 0; i < st; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(y, m, d))
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [view])

  const prevMonth = view.getMonth() === today.getMonth() && view.getFullYear() === today.getFullYear()

  const dateKey = selDate && fmtDay(selDate.getFullYear(), selDate.getMonth(), selDate.getDate())
  const todayKey = fmtDay(today.getFullYear(), today.getMonth(), today.getDate())

  const start = useMemo(() => {
    if (!selDate || !selSlot) return null
    const [hh, mm] = selSlot.split(':').map(Number)
    return new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), hh, mm)
  }, [selDate, selSlot])

  const end = start && new Date(start.getTime() + DURATION_MIN * 60000)

  const valid = start && name.trim().length >= 2 && /.+@.+\..+/.test(email)

  const onConfirm = () => {
    if (!valid) return
    setDone(true)
  }

  if (!open) return null

  const slots = SLOTS.map((s) => {
    if (dateKey === todayKey) {
      const [hh, mm] = s.split(':').map(Number)
      const nowMin = today.getHours() * 60 + today.getMinutes()
      const slotStart = hh * 60 + mm + DURATION_MIN
      return { s, disabled: slotStart <= nowMin }
    }
    return { s, disabled: false }
  })

  const summaryTime = (() => {
    if (!start) return ''
    return `${start.toLocaleDateString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })} · ${pad2(start.getHours())}:${pad2(start.getMinutes())} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
  })()

  const year = view.getFullYear()
  const month = view.getMonth()

  return createPortal(
    <div className="ix-modal" role="dialog" aria-modal="true" aria-label="Agendar reunión con KARVATECH">
      <div className="ix-modal-backdrop" onClick={onClose} />

      <div className="ix-modal-card">
        <div className="ix-modal-head">
          <div>
            <p className="ix-eyebrow">
              <span aria-hidden="true" />
              REUNIÓN DE 60 MINUTOS
            </p>
            <h3>Agenda tu reunión con KARVATECH</h3>
          </div>
          <button className="ix-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="ix-modal-done">
            <div className="ix-form-done-icon">
              <CalendarCheck size={40} />
            </div>
            <h4>¡Tu horario está listo!</h4>
            <p className="ix-modal-done-time">{summaryTime}</p>
            <p className="ix-modal-done-copy">
              Confirma el evento en
              <b> Google Calendar</b> para guardarlo en tu agenda. También puedes
              descargarlo como archivo .ics.
            </p>
            <a
              className="ix-button ix-button-solid ix-modal-gcal"
              href={start && gcalUrl(name, email, details, start, end)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CalendarCheck size={18} /> Abrir Google Calendar
              <ArrowUpRight size={15} />
            </a>
            <button
              type="button"
              className="ix-button ix-button-ghost"
              onClick={() => downloadIcs(name, email, details, start, end)}
            >
              <Download size={17} /> Descargar invitación (.ics)
            </button>
            <button type="button" className="ix-link-btn" onClick={() => setDone(false)}>
              Cambiar fecha y hora
            </button>
          </div>
        ) : (
          <>
            <div className="ix-modal-body">
              <div className="ix-modal-col">
                <div className="ix-modal-sub">
                  <span>1</span> Elige el día
                </div>
                <div className="ix-month-bar">
                  <button
                    onClick={() => setView(new Date(year, month - 1, 1))}
                    disabled={prevMonth}
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <strong>
                    {MONTHS[month]} {year}
                  </strong>
                  <button
                    onClick={() => setView(new Date(year, month + 1, 1))}
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="ix-cal-grid">
                  {WEEKDAYS.map((w) => (
                    <span key={w} className="ix-cal-dow">{w}</span>
                  ))}
                  {cells.map((d, i) =>
                    d ? (
                      <button
                        key={i}
                        type="button"
                        className={`ix-cal-cell${fmtDay(d.getFullYear(), d.getMonth(), d.getDate()) === todayKey ? ' today' : ''}${dateKey === fmtDay(d.getFullYear(), d.getMonth(), d.getDate()) ? ' sel' : ''}`}
                        disabled={d < new Date(today.getFullYear(), today.getMonth(), today.getDate())}
                        onClick={() => {
                          setSelDate(d)
                          setSelSlot(null)
                        }}
                      >
                        {d.getDate()}
                      </button>
                    ) : (
                      <span key={i} className="ix-cal-cell empty" />
                    ),
                  )}
                </div>
              </div>

              <div className="ix-modal-col">
                <div className="ix-modal-sub">
                  <span>2</span> Elige la hora
                </div>
                <div className="ix-slot-grid">
                  {!dateKey &&
                    Array.from({ length: 16 }).map((_, i) => <span key={i} className="ix-slot ghost" />)}
                  {dateKey &&
                    slots.map(({ s, disabled }) => (
                      <button
                        key={s}
                        type="button"
                        className={`ix-slot${selSlot === s ? ' sel' : ''}`}
                        disabled={disabled}
                        onClick={() => setSelSlot(s)}
                      >
                        {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="ix-modal-fields">
              <label>
                <span>Tu nombre *</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                  disabled={done}
                />
              </label>
              <label>
                <span>Tu correo *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  disabled={done}
                />
              </label>
              <label className="ix-modal-field-wide">
                <span>Notas para la reunión</span>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Cuéntanos brevemente sobre tu proyecto"
                  disabled={done}
                />
              </label>
            </div>

            <div className="ix-modal-summary">
              <CalendarCheck size={18} />
              <span>{summaryTime || 'Selecciona fecha y hora'}</span>
            </div>

            <div className="ix-modal-foot">
              <button type="button" className="ix-link-btn" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="ix-button ix-button-solid"
                disabled={!valid}
                onClick={onConfirm}
              >
                <CalendarCheck size={17} /> Agendar en mi Google Calendar
              </button>
            </div>
            <p className="ix-modal-note">
              <Mail size={13} /> Al confirmar se abre Google Calendar con el evento precargado: solo
              tienes que guardarlo.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}