export function useConfetti() {
  function burst(x, y, count = 40) {
    const colors = ['#f5c842','#fae090','#f7d060','#e8994a','#ffffff','#ffd700','#f5c842']
    const container = document.getElementById('confetti-root')
    if (!container) return
    for (let i = 0; i < count; i++) {
      const el    = document.createElement('div')
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size  = Math.random() * 8 + 4
      const vx    = (Math.random() - 0.5) * 340
      const vy    = -(Math.random() * 300 + 80)
      const rot   = Math.random() * 720 - 360
      const shape = Math.random() > 0.5 ? '50%' : '2px'
      el.style.cssText = `position:fixed;width:${size}px;height:${size*(Math.random()*0.6+0.4)}px;background:${color};border-radius:${shape};left:${x}px;top:${y}px;pointer-events:none;z-index:9998;`
      container.appendChild(el)
      const start = performance.now()
      const dur   = 900 + Math.random() * 600
      const tick  = now => {
        const t = (now - start) / dur
        if (t >= 1) { el.remove(); return }
        el.style.left      = x + vx * t + 'px'
        el.style.top       = y + vy * t + 420 * t * t + 'px'
        el.style.opacity   = 1 - t * t
        el.style.transform = `rotate(${rot * t}deg)`
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
  }
  return {
    fromCenter: (count=55) => burst(window.innerWidth/2, window.innerHeight*0.3, count),
    fromElement: (el, count=34) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      burst(r.left + r.width/2, r.top + r.height/2, count)
    }
  }
}

export function ConfettiRoot() {
  return <div id="confetti-root" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9998 }} />
}
