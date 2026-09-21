import { useEffect, useRef } from 'react'

const COLORS = ['#16a34a', '#dc2626', '#f59e0b']
const GLYPHS = ['</>', '{ }', '< />', '{}', '=>', '();', '=+', '&&']

export default function TechCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let w = 0
    let h = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    let nodes = []
    let symbols = []

    function parentSize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      return { w: rect.width || window.innerWidth, h: rect.height || window.innerHeight }
    }

    function resize() {
      const s = parentSize()
      w = s.w
      h = s.h
      canvas.width = w * DPR
      canvas.height = h * DPR
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    function build() {
      const count = Math.min(66, Math.max(24, Math.floor((w * h) / 16000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1.4,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
      symbols = Array.from({ length: Math.max(6, Math.floor(count / 4)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: -(Math.random() * 0.3 + 0.12),
        size: Math.random() * 12 + 11,
        alpha: 0.1 + Math.random() * 0.14,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < -12) n.x = w + 12
        if (n.x > w + 12) n.x = -12
        if (n.y < -12) n.y = h + 12
        if (n.y > h + 12) n.y = -12
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 15000) {
            ctx.strokeStyle = `rgba(15, 23, 42, ${0.09 * (1 - d2 / 15000)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        ctx.globalAlpha = 0.8
        ctx.fillStyle = n.c
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const s of symbols) {
        s.y += s.vy
        if (s.y < -40) {
          s.y = h + 40
          s.x = Math.random() * w
        }
        ctx.globalAlpha = s.alpha
        ctx.fillStyle = s.c
        ctx.font = `${s.size}px 'Sora', monospace`
        ctx.fillText(s.glyph, s.x, s.y)
      }

      ctx.globalAlpha = 1
    }

    function loop() {
      draw()
      raf = requestAnimationFrame(loop)
    }

    resize()
    build()
    if (reduce) {
      draw()
    } else {
      loop()
    }

    const onResize = () => {
      resize()
      build()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={ref} className="tech-canvas" aria-hidden="true" />
}