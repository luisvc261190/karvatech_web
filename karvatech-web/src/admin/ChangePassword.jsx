import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, X } from 'lucide-react'
import { changePassword, logout } from './api'

export default function ChangePassword({ onClose, onChanged }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (next !== confirm) {
      setError('La confirmación no coincide con la nueva contraseña.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await changePassword(current, next)
      await logout()
      onChanged()
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.')
      setBusy(false)
    }
  }

  const toggle = (e) => {
    e.preventDefault()
    setShow((s) => !s)
  }

  return (
    <div className="kt-modal">
      <div className="kt-modal-backdrop" onClick={busy ? undefined : onClose} />

      <form className="kt-modal-card kt-modal-card-sm" onSubmit={submit} noValidate>
        <div className="kt-modal-head">
          <div>
            <p className="kt-eyebrow">SEGURIDAD DE LA CUENTA</p>
            <h2>Cambiar contraseña</h2>
          </div>
          <button
            type="button"
            className="kt-icon-btn"
            aria-label="Cerrar"
            disabled={busy}
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <p className="kt-modal-note">
          <ShieldCheck size={14} />
          Al guardar, la sesión se cierra y deberás entrar de nuevo con la nueva
          contraseña.
        </p>

        <label className="kt-field">
          <span>
            <KeyRound size={13} />
            Contraseña actual
          </span>
          <div className="kt-input-wrap kt-pw">
            <input
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button type="button" className="kt-pw-toggle" tabIndex={-1} onClick={toggle}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </label>

        <label className="kt-field">
          <span>Nueva contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
          />
        </label>

        <label className="kt-field">
          <span>Confirmar nueva contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la nueva contraseña"
            required
            minLength={8}
          />
        </label>

        {error && (
          <p className="kt-error" role="alert">
            {error}
          </p>
        )}

        <div className="kt-modal-foot">
          <button type="button" className="kt-btn" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button className="kt-btn kt-btn-primary" disabled={busy} type="submit">
            {busy ? <Loader2 className="kt-spin" size={15} /> : <ShieldCheck size={15} />}
            {busy ? 'Guardando…' : 'Guardar y cerrar sesión'}
          </button>
        </div>
      </form>
    </div>
  )
}