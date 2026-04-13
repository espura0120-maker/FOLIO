const F = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
const FM = "'JetBrains Mono', monospace"

// ── Card — glass with subtle transparency ────────────────────────────────────
export function Card({ children, style, onClick }) {
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
      transition: 'border-color 0.18s, background 0.18s',
      fontFamily: F,
      ...style,
    }}
    onMouseEnter={onClick ? e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)' : undefined}
    onMouseLeave={onClick ? e => e.currentTarget.style.background = 'rgba(255,255,255,0.055)' : undefined}
    >
      {children}
    </div>
  )
}

// ── StatCard — glass stat tile ───────────────────────────────────────────────
export function StatCard({ label, value, sub, color = '#f5c842', accent }) {
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
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      <div style={{ fontFamily: FM, fontSize: 22, fontWeight: 500, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{sub}</div>}
      {accent !== undefined && (
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5, overflow: 'hidden', marginTop: 9 }}>
          <div style={{ width: Math.min(accent, 100) + '%', height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
      )}
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'default', size = 'md', fullWidth, loading, disabled, onClick, type = 'button', style }) {
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 24px' : '10px 18px'
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 14
  const v = {
    default: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' },
    gold:    { background: '#f5c842', border: '1px solid #f5c842', color: '#1a1400', backdropFilter: 'none' },
    teal:    { background: '#3db88a', border: '1px solid #3db88a', color: '#041a12', backdropFilter: 'none' },
    ghost:   { background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', backdropFilter: 'none' },
    danger:  { background: 'rgba(232,98,74,0.12)', border: '1px solid rgba(232,98,74,0.25)', color: '#f07a62', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' },
  }[variant] || {}
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      fontFamily: F, fontWeight: 700, borderRadius: 10, padding: pad, fontSize: fs,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled || loading ? 0.5 : 1,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      ...v, ...style,
    }}>
      {loading ? <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> : children}
    </button>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h1 style={{ fontFamily: F, fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 2, letterSpacing: '-0.01em' }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ── CardTitle ─────────────────────────────────────────────────────────────────
export function CardTitle({ children }) {
  return <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{children}</div>
}

// ── ListItem ──────────────────────────────────────────────────────────────────
export function ListItem({ icon, iconBg, name, sub, right, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: 10, marginBottom: 6, border: '1px solid rgba(255,255,255,0.07)', fontFamily: F }}>
      {icon && <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg || 'rgba(255,255,255,0.08)', fontSize: 16, border: '1px solid rgba(255,255,255,0.07)' }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{name}</div>
        {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>{right}</div>}
      {onDelete && (
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 18, lineHeight: 1, padding: '2px 4px', borderRadius: 4, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = '#f07a62'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>x</button>
      )}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 20px', color: 'rgba(255,255,255,0.30)', fontFamily: F }}>
      {icon && <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  )
}

// ── Grid ──────────────────────────────────────────────────────────────────────
export function Grid({ cols = 2, gap = 12, children, style }) {
  return (
    <>
      <style>{`.fg-${cols}{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gap}px;}@media(max-width:640px){.fg-${cols}{grid-template-columns:1fr;}}`}</style>
      <div className={'fg-' + cols} style={style}>{children}</div>
    </>
  )
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ children, selected, onClick }) {
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 11px',
      borderRadius: 99, fontSize: 12, cursor: onClick ? 'pointer' : 'default',
      margin: '2px', transition: 'all 0.15s', fontWeight: 600, fontFamily: F,
      border: selected ? '1px solid rgba(245,200,66,0.40)' : '1px solid rgba(255,255,255,0.09)',
      background: selected ? 'rgba(245,200,66,0.14)' : 'rgba(255,255,255,0.05)',
      color: selected ? '#f5c842' : 'rgba(255,255,255,0.50)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    }}>{children}</span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = '#f5c842' }) {
  return <div style={{ width: size, height: size, border: '2px solid rgba(245,200,66,0.15)', borderTopColor: color, borderRadius: '50%', animation: 'spin 0.65s linear infinite', display: 'inline-block' }} />
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '14px 0', ...style }} />
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ label, value, max = 100, color = '#f5c842' }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ marginBottom: 12, fontFamily: F }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 7, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}
