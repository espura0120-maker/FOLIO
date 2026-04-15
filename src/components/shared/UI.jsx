import AnimatedNumber from '@/components/shared/AnimatedNumber'

const F  = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
const FM = "'JetBrains Mono', monospace"

// ── Card — glass with hover glow micro-animation ─────────────────────────
export function Card({ children, style, onClick, accentColor }) {
  const glow = accentColor || 'rgba(245,200,66,0.12)'
  return (
    <div onClick={onClick} style={{
      background: 'rgba(255,255,255,0.055)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 18,
      padding: '16px 18px',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
      cursor: onClick ? 'pointer' : undefined,
      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
      fontFamily: F,
      ...style,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'
      e.currentTarget.style.boxShadow = '0 0 20px ' + glow + ', inset 0 1px 0 rgba(255,255,255,0.07)'
      if (onClick) e.currentTarget.style.transform = 'translateY(-1px)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
      e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.07)'
      e.currentTarget.style.transform = 'none'
    }}
    >
      {children}
    </div>
  )
}

// ── StatCard — animated number on load ───────────────────────────────────
export function StatCard({ label, value, sub, color = '#f5c842', accent, animate = true }) {
  const isNumeric = animate && !isNaN(parseFloat(String(value).replace(/[^0-9.-]/g, '')))
  const numericVal = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  const prefix = String(value).match(/^[^0-9-]*/)?.[0] || ''
  const suffix = String(value).match(/[^0-9.]+$/)?.[0] || ''

  return (
    <div style={{
      background: 'rgba(255,255,255,0.045)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '14px 16px',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      fontFamily: F,
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 16px rgba(245,200,66,0.08), inset 0 1px 0 rgba(255,255,255,0.06)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06)'}
    >
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      <div style={{ fontFamily: FM, fontSize: 22, fontWeight: 500, color }}>
        {isNumeric
          ? <AnimatedNumber value={numericVal} prefix={prefix} suffix={suffix} decimals={String(value).includes('.') ? 2 : 0} color={color} />
          : value
        }
      </div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{sub}</div>}
      {accent !== undefined && (
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5, overflow: 'hidden', marginTop: 9 }}>
          <div style={{ width: Math.min(accent, 100) + '%', height: '100%', background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
      )}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'default', size = 'md', fullWidth, loading, disabled, onClick, type = 'button', style }) {
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 24px' : '10px 18px'
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 14
  const v = {
    default: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' },
    gold:    { background: '#f5c842', border: '1px solid #f5c842', color: '#1a1400' },
    teal:    { background: '#3db88a', border: '1px solid #3db88a', color: '#041a12' },
    ghost:   { background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)' },
    danger:  { background: 'rgba(232,98,74,0.12)', border: '1px solid rgba(232,98,74,0.25)', color: '#f07a62' },
  }[variant] || {}

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      fontFamily: F, fontWeight: 700, borderRadius: 10, padding: pad, fontSize: fs,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled || loading ? 0.5 : 1,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'transform 0.12s, opacity 0.15s',
      ...v, ...style,
    }}
    onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(1.02)' }}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.97)' }}
    onMouseUp={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(1.02)' }}
    >
      {loading
        ? <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        : children}
    </button>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action, accentColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <div style={{ width: 3, height: 22, background: accentColor || '#f5c842', borderRadius: 99, display: 'inline-block', marginRight: 10, verticalAlign: 'middle', boxShadow: '0 0 8px ' + (accentColor || '#f5c842') }} />
        <h1 style={{ fontFamily: F, fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 2, letterSpacing: '-0.01em', display: 'inline' }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ── CardTitle ─────────────────────────────────────────────────────────────
export function CardTitle({ children }) {
  return <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{children}</div>
}

// ── ListItem ──────────────────────────────────────────────────────────────
export function ListItem({ icon, iconBg, name, sub, right, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: 10, marginBottom: 6, border: '1px solid rgba(255,255,255,0.07)', fontFamily: F, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
    >
      {icon && <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg || 'rgba(255,255,255,0.08)', fontSize: 16, border: '1px solid rgba(255,255,255,0.07)' }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{name}</div>
        {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>{right}</div>}
      {onDelete && (
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 18, lineHeight: 1, padding: '2px 4px', borderRadius: 4, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = '#f07a62'}
          onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>x</button>
      )}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 20px', color: 'rgba(255,255,255,0.30)', fontFamily: F }}>
      {icon && <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  )
}

// ── Grid ──────────────────────────────────────────────────────────────────
export function Grid({ cols = 2, gap = 12, children, style }) {
  return (
    <>
      <style>{`.fg-${cols}{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gap}px;}@media(max-width:640px){.fg-${cols}{grid-template-columns:1fr;}}`}</style>
      <div className={'fg-' + cols} style={style}>{children}</div>
    </>
  )
}

// ── Tag ───────────────────────────────────────────────────────────────────
export function Tag({ children, selected, onClick }) {
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 11px',
      borderRadius: 99, fontSize: 12, cursor: onClick ? 'pointer' : 'default',
      margin: '2px', transition: 'all 0.15s', fontWeight: 600, fontFamily: F,
      border: selected ? '1px solid rgba(245,200,66,0.40)' : '1px solid rgba(255,255,255,0.09)',
      background: selected ? 'rgba(245,200,66,0.14)' : 'rgba(255,255,255,0.05)',
      color: selected ? '#f5c842' : 'rgba(255,255,255,0.50)',
    }}>{children}</span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = '#f5c842' }) {
  return <div style={{ width: size, height: size, border: '2px solid rgba(245,200,66,0.15)', borderTopColor: color, borderRadius: '50%', animation: 'spin 0.65s linear infinite', display: 'inline-block' }} />
}

// ── Divider ───────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '14px 0', ...style }} />
}

// ── ProgressBar ───────────────────────────────────────────────────────────
export function ProgressBar({ label, value, max = 100, color = '#f5c842', warn }) {
  const pct = Math.min((value / max) * 100, 100)
  const isOver = pct >= 90
  const barColor = warn && isOver ? '#f07a62' : color
  return (
    <div style={{ marginBottom: 12, fontFamily: F }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{label}</span>
        <span style={{ fontSize: 12, color: barColor, fontWeight: 700 }}>{Math.round(pct)}%{warn && isOver ? ' ⚠️' : ''}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 7, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: barColor, borderRadius: 99, transition: 'width 0.6s ease, background 0.3s' }} />
      </div>
    </div>
  )
}
