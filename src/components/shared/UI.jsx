// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 18px',
      cursor: onClick ? 'pointer' : undefined, ...style,
    }}>
      {children}
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'var(--text)', accent }) {
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
      {accent !== undefined && (
        <div style={{ background: 'var(--bg4)', borderRadius: 99, height: 4, overflow: 'hidden', marginTop: 8 }}>
          <div style={{ width: `${Math.min(accent, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s' }} />
        </div>
      )}
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'default', size = 'md', fullWidth, loading, disabled, onClick, type = 'button', style }) {
  const pad  = size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 22px' : '9px 16px'
  const fs   = size === 'sm' ? 13 : size === 'lg' ? 15 : 14
  const vars = {
    default: { background: 'var(--bg3)', borderColor: 'var(--border2)', color: 'var(--text)' },
    gold:    { background: 'var(--gold)',  borderColor: 'var(--gold)',   color: '#1a1200' },
    teal:    { background: 'var(--teal)',  borderColor: 'var(--teal)',   color: '#041a12' },
    ghost:   { background: 'transparent', borderColor: 'transparent',   color: 'var(--text2)' },
    danger:  { background: 'rgba(217,100,74,0.15)', borderColor: 'rgba(217,100,74,0.3)', color: 'var(--coral2)' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      fontFamily: 'inherit', fontWeight: 500, border: '1px solid',
      borderRadius: 'var(--radius-sm)', padding: pad, fontSize: fs,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled || loading ? 0.5 : 1,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      ...vars[variant], ...style,
    }}>
      {loading
        ? <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        : children}
    </button>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, fontWeight: 400, marginBottom: 2 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'var(--text3)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ── CardTitle ─────────────────────────────────────────────────────────────────
export function CardTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>{children}</div>
}

// ── ListItem ──────────────────────────────────────────────────────────────────
export function ListItem({ icon, iconBg, name, sub, right, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', marginBottom: 6, border: '1px solid var(--border)' }}>
      {icon && <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg || 'var(--bg4)', fontSize: 16 }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>{right}</div>}
      {onDelete && (
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: '2px 5px', borderRadius: 4, cursor: 'pointer' }}
          onMouseEnter={e => e.target.style.color = 'var(--coral2)'}
          onMouseLeave={e => e.target.style.color = 'var(--text3)'}>×</button>
      )}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--text3)' }}>
      {icon && <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  )
}

// ── Grid ──────────────────────────────────────────────────────────────────────
export function Grid({ cols = 2, gap = 12, children, style }) {
  return (
    <>
      <style>{`
        .folio-grid-${cols} {
          display: grid;
          grid-template-columns: repeat(${cols}, minmax(0, 1fr));
          gap: ${gap}px;
        }
        @media (max-width: 640px) {
          .folio-grid-${cols} { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className={`folio-grid-${cols}`} style={style}>
        {children}
      </div>
    </>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0', ...style }} />
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ children, selected, onClick, color }) {
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 12,
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s', margin: '2px',
      border: `1px solid ${selected ? (color || 'var(--gold)') : 'transparent'}`,
      background: selected ? `${color || 'var(--gold)'}18` : 'var(--bg4)',
      color: selected ? (color || 'var(--gold2)') : 'var(--text2)',
    }}>{children}</span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--gold)' }) {
  return <div style={{ width: size, height: size, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.65s linear infinite', display: 'inline-block' }} />
}
