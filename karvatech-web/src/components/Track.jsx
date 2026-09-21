import { useEffect, useRef, useState, useCallback } from 'react'
import { TrackProvider, PANELS } from '../journey'
import SideRail from './SideRail'

export default function Track({ children }) {
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)

  const goTo = useCallback((i) => {
    const t = trackRef.current
    if (!t) return
    const target = Math.max(0, Math.min(PANELS.length - 1, i))
    t.scrollTo({ left: target * t.clientWidth, behavior: 'smooth' })
  }, [])

  const next = useCallback(() => {
    const t = trackRef.current
    if (!t) return
    const i = Math.round(t.scrollLeft / t.clientWidth)
    goTo(i + 1)
  }, [goTo])

  useEffect(() => {
    const t = trackRef.current
    const indexRef = { current: 0 }
    const clamp = (i) => Math.max(0, Math.min(PANELS.length - 1, i))

    const update = () => {
      if (!t.clientWidth) return
      const i = clamp(Math.round(t.scrollLeft / t.clientWidth))
      indexRef.current = i
      setIndex(i)
    }

    let acc = 0
    let accTimer = null

    const onWheel = (e) => {
      const el = e.target.closest('.ix-panel')
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 33
      else if (e.deltaMode === 2) dy *= Math.max(1, Math.round(window.innerHeight))

      const overflow = !!(el && el.scrollHeight > el.clientHeight + 1)
      const atTop = !el || el.scrollTop <= 0
      const atBottom = !el || el.scrollTop + el.clientHeight >= el.scrollHeight - 1

      if (overflow && dy > 0 && !atBottom) return
      if (overflow && dy < 0 && !atTop) return

      e.preventDefault()
      if (e.deltaX !== 0 && Math.abs(e.deltaX) > Math.abs(dy)) {
        if (e.deltaX > 0) next()
        else goTo(indexRef.current - 1)
        return
      }
      if (dy === 0) return

      acc += dy
      clearTimeout(accTimer)
      accTimer = setTimeout(() => {
        acc = 0
      }, 550)

      if (Math.abs(acc) >= 55) {
        if (dy < 0) goTo(indexRef.current - 1)
        else next()
        acc = 0
      }
    }

    const onKey = (e) => {
      if (document.body.classList.contains('ix-modal-open')) return
      const map = {
        ArrowRight: () => next(),
        ArrowDown: () => next(),
        ArrowLeft: () => goTo(indexRef.current - 1),
        ArrowUp: () => goTo(indexRef.current - 1),
        PageDown: () => next(),
        PageUp: () => goTo(indexRef.current - 1),
        Home: () => goTo(0),
        End: () => goTo(PANELS.length - 1),
      }
      if (map[e.key]) {
        e.preventDefault()
        map[e.key]()
      }
    }

    t.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    t.addEventListener('wheel', onWheel, { passive: false })
    document.addEventListener('keydown', onKey)
    update()
    return () => {
      t.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      t.removeEventListener('wheel', onWheel)
      document.removeEventListener('keydown', onKey)
      clearTimeout(accTimer)
    }
  }, [goTo, next])

  const value = { index, goTo, next, total: PANELS.length }

  return (
    <TrackProvider value={value}>
      <div className="ix-site">
        <SideRail />

        <div className="ix-track" ref={trackRef}>
          {children}
        </div>

        <div className="ix-meta" aria-hidden="true">
          <span className="ix-meta-num">
            {String(index).padStart(2, '0')}
          </span>
          <span className="ix-meta-line">
            <span style={{ height: `${((index + 1) / PANELS.length) * 100}%` }} />
          </span>
          <span className="ix-meta-num">
            {String(PANELS.length - 1).padStart(2, '0')}
          </span>
        </div>
      </div>
    </TrackProvider>
  )
}