// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, glow }) {
  return (
    <div onClick={onClick} style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 18,
      padding: '16px 18px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: glow
        ? '0 0 32px rgba(201,153,58,0.14), inset 0 1px 0 rgba(255,255,255,0.07)'
        : 'inset 0 1px 0 rgba(255,255,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : undefined,
      transition: 'border-color 0.2s',
      ...style,
    }}>
      {/* shimmer highlight line on top edge */}
      <div style={{
        position: 'absolute', top: 0, height: 1,
        width: '55%', left: 0,
        background: 'linear-gradient(90deg, transparent, rgba(220,160,40,0.35), transparent)',
        animation: 'shimmer 5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = '#e8b84a', accent }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '14px 16px',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(240,232,216,0.32)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500, color, textShadow: `0 0 16px ${color}60` }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.30)', marginTop: 3 }}>{sub}</div>}
      {accent !== undefined && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 4, overflow: 'hidden', marginTop: 9 }}>
          <div style={{ width: Math.min(accent, 100) + '%', height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease', boxShadow: '0 0 8px ' + color }} />
        </div>
      )}
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'default', size = 'md', fullWidth, loading, disabled, onClick, type = 'button', style }) {
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 24px' : '10px 18px'
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 14

  const variants = {
    default: {
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.11)',
      color: 'rgba(240,232,216,0.75)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
    },
    gold: {
      background: 'linear-gradient(135deg, #b8852a 0%, #e8b84a 50%, #c9993a 100%)',
      border: '1px solid rgba(232,184,74,0.35)',
      color: '#1a1000',
      boxShadow: '0 0 22px rgba(201,153,58,0.40), 0 0 48px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.22)',
    },
    teal: {
      background: 'linear-gradient(135deg, #3db88a 0%, #5dd4a6 100%)',
      border: '1px solid rgba(93,212,166,0.35)',
      color: '#041a12',
      boxShadow: '0 0 18px rgba(61,184,138,0.28), inset 0 1px 0 rgba(255,255,255,0.2)',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid transparent',
      color: 'rgba(240,232,216,0.40)',
      boxShadow: 'none',
    },
    danger: {
      background: 'rgba(217,100,74,0.10)',
      border: '1px solid rgba(217,100,74,0.22)',
      color: '#f07a5e',
      boxShadow: 'none',
    },
  }

  const v = variants[variant] || variants.default

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      fontWeight: 500, borderRadius: 10, padding: pad, fontSize: fs,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled || loading ? 0.5 : 1,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      fontFamily: 'inherit',
      ...v, ...style,
    }}>
      {loading
        ? <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        : children
      }
    </button>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
      <div>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, fontWeight: 400, color: 'var(--text)', marginBottom: 2 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'var(--text3)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ── CardTitle ─────────────────────────────────────────────────────────────────
export function CardTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(240,232,216,0.32)', marginBottom: 12 }}>
      {children}
    </div>
  )
}

// ── ListItem ──────────────────────────────────────────────────────────────────
export function ListItem({ icon, iconBg, name, sub, right, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 10, marginBottom: 6,
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      {icon && (
        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg || 'rgba(255,255,255,0.07)', fontSize: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>{name}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>{right}</div>}
      {onDelete && (
        <button onClick={onDelete}
          style={{ background: 'none', border: 'none', color: 'rgba(240,232,216,0.25)', fontSize: 18, lineHeight: 1, padding: '2px 4px', borderRadius: 4, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = 'var(--coral2)'}
          onMouseLeave={e => e.target.style.color = 'rgba(240,232,216,0.25)'}>
          x
        </button>
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
        .fg-${cols}{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gap}px;}
        @media(max-width:640px){.fg-${cols}{grid-template-columns:1fr;}}
      `}</style>
      <div className={'fg-' + cols} style={style}>{children}</div>
    </>
  )
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ children, selected, onClick, color }) {
  const c = color || 'rgba(201,153,58,0.5)'
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 11px',
      borderRadius: 99, fontSize: 12, cursor: onClick ? 'pointer' : 'default',
      margin: '2px', transition: 'all 0.15s',
      border: selected ? '1px solid ' + c : '1px solid rgba(255,255,255,0.08)',
      background: selected ? 'rgba(201,153,58,0.12)' : 'rgba(255,255,255,0.04)',
      color: selected ? 'var(--gold2)' : 'var(--text2)',
    }}>{children}</span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--gold2)' }) {
  return (
    <div style={{ width: size, height: size, border: '2px solid rgba(201,153,58,0.2)', borderTopColor: color, borderRadius: '50%', animation: 'spin 0.65s linear infinite', display: 'inline-block' }} />
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '14px 0', ...style }} />
}
