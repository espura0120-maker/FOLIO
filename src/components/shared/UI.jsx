// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, glow }) {
  return (
    <div onClick={onClick} style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 18,
      padding: '16px 18px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      cursor: onClick ? 'pointer' : undefined,
      boxShadow: glow ? '0 0 30px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.06)',
      transition: 'all 0.2s',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'var(--text)', accent }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '14px 16px',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
      {accent !== undefined && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 4, overflow: 'hidden', marginTop: 8 }}>
          <div style={{ width: `${Math.min(accent, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s', boxShadow: `0 0 8px ${color}` }} />
        </div>
      )}
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'default', size = 'md', fullWidth, loading, disabled, onClick, type = 'button', style }) {
  const pad  = size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 24px' : '10px 18px'
  const fs   = size === 'sm' ? 13 : size === 'lg' ? 15 : 14

  const vars = {
    default: {
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: 'var(--text)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    },
    gold: {
      background: 'linear-gradient(135deg, #c9993a 0%, #e8b85a 100%)',
      border: '1px solid rgba(232,184,90,0.4)',
      color: '#1a1200',
      boxShadow: '0 0 20px rgba(201,153,58,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
    },
    teal: {
      background: 'linear-gradient(135deg, #3db88a 0%, #5dd4a6 100%)',
      border: '1px solid rgba(93,212,166,0.4)',
      color: '#041a12',
      boxShadow: '0 0 20px rgba(61,184,138,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid transparent',
      color: 'var(--text2)',
      boxShadow: 'none',
    },
    danger: {
      background: 'rgba(217,100,74,0.12)',
      border: '1px solid rgba(217,100,74,0.25)',
      color: 'var(--coral2)',
      boxShadow: 'none',
    },
  }

  const v = vars[variant] || vars.default

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      fontFamily: 'inherit', fontWeight: 500, borderRadius: 10,
      padding: pad, fontSize: fs,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled || loading ? 0.5 : 1,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      transition: 'all 0.2s',
      ...v, ...style,
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
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, fontWeight: 400, marginBottom: 2, color: 'var(--text)' }}>{title}</h1>
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 10, marginBottom: 6,
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      {icon && (
        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg || 'rgba(255,255,255,0.07)', fontSize: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>{name}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>{right}</div>}
      {onDelete && (
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: '2px 5px', borderRadius: 4, cursor: 'pointer', transition: 'color 0.15s' }}
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
  return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '14px 0', ...style }} />
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ children, selected, onClick, color }) {
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 11px',
      borderRadius: 99, fontSize: 12, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s', margin: '2px',
      border: `1px solid ${selected ? (color || 'rgba(201,153,58,0.5)') : 'rgba(255,255,255,0.08)'}`,
      background: selected ? `${color || 'rgba(201,153,58,0.15)'}` : 'rgba(255,255,255,0.04)',
      color: selected ? (color ? color : 'var(--gold2)') : 'var(--text2)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>{children}</span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--gold)' }) {
  return <div style={{ width: size, height: size, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.65s linear infinite', display: 'inline-block' }} />
}
