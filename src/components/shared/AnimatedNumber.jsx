import { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, duration = 800, prefix = '', suffix = '', decimals = 0, color, style }) {
  const [display, setDisplay] = useState(0)
  const startRef   = useRef(null)
  const prevRef    = useRef(0)
  const rafRef     = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to   = parseFloat(value) || 0
    prevRef.current = to
    if (from === to) { setDisplay(to); return }

    cancelAnimationFrame(rafRef.current)
    startRef.current = null

    function easeOut(t) { return 1 - Math.pow(1 - t, 3) }

    function tick(ts) {
      if (!startRef.current) startRef.current = ts
      const elapsed  = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const current  = from + (to - from) * easeOut(progress)
      setDisplay(current)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString()

  return (
    <span style={{ color, ...style }}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
