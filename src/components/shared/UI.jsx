import { useEffect, useRef, useState } from 'react'

const FS = "'DM Serif Display',Georgia,serif"
const F  = "'Plus Jakarta Sans',system-ui,sans-serif"
const FM = "'JetBrains Mono',monospace"

// ── Animated counter hook ─────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const end   = parseFloat(String(target).replace(/[^0-9.-]/g,'')) || 0
    const diff  = end - start
    if (diff === 0) return
    const startTime = performance.now()
    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(start + diff * ease)
      if (progress < 1) requestAnimationFrame(tick)
      else { setVal(end); prev.current = end }
    }
    requestAnimationFrame(tick)
  }, [target])
  return val
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────
export function Shimmer({ width = '100%', height = 18, radius = 8, style }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmerSlide 1.4s ease-in-out infinite',
      ...style
    }} />
  )
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <Card>
      <Shimmer width="40%" height={10} style={{ marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Shimmer key={i} width={i === rows-1 ? '60%' : '100%'} height={14} style={{ marginBottom: 10 }} />
      ))}
    </Card>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, accent, glow }) {
  const [hovered, setHovered] = useState(false)
  const glowColor = accent || '#f5c842'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.042)',
        border: `1px solid ${hovered ? glowColor+'30' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 18,
        padding: '16px 18px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: hovered && onClick
          ? `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${glowColor}18, inset 0 1px 0 rgba(255,255,255,0.08)`
          : glow
          ? `0 0 32px ${glowColor}18, inset 0 1px 0 rgba(255,255,255,0.07)`
          : 'inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s',
        transform: hovered && onClick ? 'translateY(-1px)' : 'none',
        ...style,
      }}>
      {/* Top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${glowColor}25 50%, transparent 100%)`,
        pointerEvents: 'none',
      }} />
      {/* Noise texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        borderRadius: 18,
      }} />
      {children}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = '#f5c842', accent }) {
  const isNumeric = !isNaN(parseFloat(String(value).replace(/[^0-9.-]/g,'')))
  const raw = parseFloat(String(value).replace(/[^0-9.-]/g,'')) || 0
  const animated = useCountUp(isNumeric ? raw : 0)
  const prefix = String(value).match(/^[^0-9-]*/)?.[0] || ''
  const suffix = String(value).match(/[^0-9.]*$/)?.[0] || ''
  const displayVal = isNumeric
    ? prefix + (Number.isInteger(raw) ? Math.round(animated) : animated.toFixed(1)) + suffix
    : value

  return (
    <div style={{
      background: 'rgba(255,255,255,0.042)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '16px 18px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px ${color}08`,
      position: 'relative', overflow: 'hidden',
      transition: 'box-shadow 0.3s',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 28px ${color}20`}
    onMouseLeave={e => e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px ${color}08`}
    >
      {/* Subtle corner glow */}
      <div style={{ position:'absolute', top:-20, right:-20, width:60, height:60, borderRadius:'50%', background:`radial-gradient(circle, ${color}18, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{
        fontFamily: FM, fontSize: 24, fontWeight: 500, color,
        textShadow: `0 0 20px ${color}50`,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>{displayVal}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 4 }}>{sub}</div>}
      {accent !== undefined && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 3, overflow: 'hidden', marginTop: 10 }}>
          <div style={{ width: Math.min(accent, 100) + '%', height: '100%', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 99, transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 8px ${color}80` }} />
        </div>
      )}
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{
          fontFamily: FS, fontSize: 28, fontWeight: 400,
          background: `linear-gradient(135deg, #fff 0%, ${accent || '#f5c842'} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 3, lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.01em' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ── CardTitle ─────────────────────────────────────────────────────────────
export function CardTitle({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 14 }}>
      {children}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'default', size = 'md', fullWidth, loading, disabled, onClick, type = 'button', style }) {
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '14px 26px' : '10px 20px'
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 13

  const variants = {
    default: { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.11)', color:'rgba(255,255,255,0.70)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.07)' },
    gold:    { background:'linear-gradient(135deg,#b8852a,#f5c842,#c9993a)', border:'1px solid rgba(245,200,66,0.35)', color:'#1a1000', boxShadow:'0 0 22px rgba(245,200,66,0.35), inset 0 1px 0 rgba(255,255,255,0.22)' },
    teal:    { background:'linear-gradient(135deg,#3db88a,#5dd4a6)', border:'1px solid rgba(93,212,166,0.35)', color:'#041a12', boxShadow:'0 0 18px rgba(61,184,138,0.28), inset 0 1px 0 rgba(255,255,255,0.20)' },
    ghost:   { background:'transparent', border:'1px solid transparent', color:'rgba(255,255,255,0.40)', boxShadow:'none' },
    danger:  { background:'rgba(240,122,98,0.10)', border:'1px solid rgba(240,122,98,0.22)', color:'#f07a62', boxShadow:'none' },
  }
  const v = variants[variant] || variants.default

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
      fontWeight: 600, borderRadius: 10, padding: pad, fontSize: fs,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled || loading ? 0.5 : 1,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      fontFamily: F, transition: 'all 0.18s', letterSpacing: '0.01em',
      ...v, ...style,
    }}
    onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.opacity = '0.85' }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
      {loading
        ? <span style={{ width:13, height:13, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block' }} />
        : children}
    </button>
  )
}

// ── ListItem ──────────────────────────────────────────────────────────────
export function ListItem({ icon, iconBg, name, sub, right, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
      background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
      borderRadius:11, marginBottom:5,
      border:`1px solid ${hov ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
      transition:'all 0.15s',
    }}>
      {icon && (
        <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:iconBg||'rgba(255,255,255,0.07)', fontSize:16, border:'1px solid rgba(255,255,255,0.08)' }}>{icon}</div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'rgba(255,255,255,0.82)' }}>{name}</div>
        {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft:'auto', textAlign:'right', flexShrink:0 }}>{right}</div>}
      {onDelete && (
        <button onClick={onDelete} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.22)', fontSize:16, lineHeight:1, padding:'2px 5px', borderRadius:5, cursor:'pointer', transition:'color 0.15s' }}
          onMouseEnter={e=>e.target.style.color='#f07a62'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.22)'}>×</button>
      )}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({ icon, message, action, onAction }) {
  return (
    <div style={{ textAlign:'center', padding:'36px 20px' }}>
      {icon && (
        <div style={{ fontSize:40, marginBottom:12, opacity:0.25, filter:'grayscale(0.3)' }}>{icon}</div>
      )}
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.35)', fontWeight:500, marginBottom: action ? 16 : 0, lineHeight:1.6 }}>{message}</div>
      {action && onAction && (
        <button onClick={onAction} style={{ marginTop:8, background:'rgba(245,200,66,0.12)', border:'1px solid rgba(245,200,66,0.25)', borderRadius:10, color:'#f5c842', fontSize:13, fontWeight:700, padding:'8px 20px', cursor:'pointer', fontFamily:F }}>
          {action}
        </button>
      )}
    </div>
  )
}

// ── Grid ──────────────────────────────────────────────────────────────────
export function Grid({ cols = 2, gap = 12, children, style }) {
  return (
    <>
      <style>{`
        .fg-${cols}{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gap}px;}
        @media(max-width:640px){.fg-${cols}{grid-template-columns:1fr;}}
      `}</style>
      <div className={'fg-'+cols} style={style}>{children}</div>
    </>
  )
}

// ── Tag ───────────────────────────────────────────────────────────────────
export function Tag({ children, selected, onClick, color }) {
  const c = color || '#f5c842'
  return (
    <span onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', padding:'4px 11px',
      borderRadius:99, fontSize:12, cursor:onClick?'pointer':'default', margin:'2px',
      transition:'all 0.15s',
      border: selected ? `1px solid ${c}55` : '1px solid rgba(255,255,255,0.08)',
      background: selected ? `${c}14` : 'rgba(255,255,255,0.04)',
      color: selected ? c : 'rgba(255,255,255,0.45)',
    }}>{children}</span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = '#f5c842' }) {
  return (
    <div style={{ width:size, height:size, border:`2px solid ${color}25`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.65s linear infinite', display:'inline-block' }} />
  )
}

// ── Divider ───────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.07)', margin:'14px 0', ...style }} />
}

// ── StaggeredList ─────────────────────────────────────────────────────────
// Wrap any list of items to get staggered fade-in
export function StaggeredList({ children, baseDelay = 0 }) {
  return (
    <>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div key={i} style={{ animation: `fadeUp 0.3s ease both`, animationDelay: `${baseDelay + i * 50}ms` }}>
              {child}
            </div>
          ))
        : children}
    </>
  )
}
