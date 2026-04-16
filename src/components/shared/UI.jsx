import { useEffect, useRef, useState } from 'react'

const F  = "'Plus Jakarta Sans',system-ui,sans-serif"
const FS = "'DM Serif Display',Georgia,serif"
const FM = "'JetBrains Mono',monospace"

// ── Animated Number ────────────────────────────────────────────────────────
export function AnimatedNumber({ value, duration=900, prefix='', suffix='', decimals=0, color, style }) {
  const [display, setDisplay]  = useState(0)
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
    const ease = t => 1 - Math.pow(1 - t, 3)
    const tick = ts => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      setDisplay(from + (to - from) * ease(p))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])
  const fmt = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()
  return <span style={{ color, fontFamily: FM, ...style }}>{prefix}{fmt}{suffix}</span>
}

// ── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ width='100%', height=18, radius=8, style }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative', ...style }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%)', animation:'shimmer 1.6s ease-in-out infinite' }} />
    </div>
  )
}

export function SkeletonCard({ rows=3 }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.045)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'16px 18px' }}>
      <Skeleton height={12} width="40%" radius={6} style={{ marginBottom:16 }} />
      {Array.from({length:rows}).map((_,i) => (
        <Skeleton key={i} height={14} width={i===rows-1?'60%':'100%'} radius={6} style={{ marginBottom: i < rows-1 ? 10 : 0 }} />
      ))}
    </div>
  )
}

// ── Page wrapper with per-page accent glow ─────────────────────────────────
export function PageWrapper({ children, accent='#f5c842', style }) {
  return (
    <div style={{ position:'relative', ...style }}>
      {/* Top-right accent glow */}
      <div style={{
        position:'fixed', top:-120, right:-120,
        width:420, height:420,
        background: `radial-gradient(circle, ${accent}18 0%, ${accent}08 40%, transparent 70%)`,
        borderRadius:'50%', pointerEvents:'none', zIndex:0,
        animation:'gp 8s ease-in-out infinite',
      }} />
      <div style={{ position:'relative', zIndex:1 }}>{children}</div>
    </div>
  )
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, accent }) {
  const glow = accent ? accent + '20' : 'rgba(245,200,66,0.10)'
  return (
    <div onClick={onClick} style={{
      background:'rgba(255,255,255,0.052)',
      border:'1px solid rgba(255,255,255,0.085)',
      borderRadius:18, padding:'16px 18px',
      backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
      boxShadow:'inset 0 1px 0 rgba(255,255,255,0.065)',
      cursor:onClick?'pointer':undefined,
      transition:'border-color 0.2s, box-shadow 0.22s, transform 0.15s',
      position:'relative', overflow:'hidden',
      fontFamily:F, ...style,
    }}
    onMouseEnter={e=>{
      e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'
      e.currentTarget.style.boxShadow=`0 0 24px ${glow}, inset 0 1px 0 rgba(255,255,255,0.09)`
      if (onClick) e.currentTarget.style.transform='translateY(-2px)'
    }}
    onMouseLeave={e=>{
      e.currentTarget.style.borderColor='rgba(255,255,255,0.085)'
      e.currentTarget.style.boxShadow='inset 0 1px 0 rgba(255,255,255,0.065)'
      e.currentTarget.style.transform='none'
    }}>
      {/* Shimmer sweep on hover */}
      <div className="card-shimmer" style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)', pointerEvents:'none', transition:'left 0.5s ease' }} />
      {children}
    </div>
  )
}

// ── StatCard ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color='#f5c842', accent, animate=true }) {
  const raw = String(value).replace(/[^0-9.-]/g,'')
  const num = parseFloat(raw)
  const isNum = animate && !isNaN(num)
  const prefix = String(value).match(/^[€$¥£]*/)?.[0] || ''
  const suffix = String(value).match(/[^0-9.]+$/)?.[0] || ''
  return (
    <div style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 16px', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', fontFamily:F, transition:'box-shadow 0.2s' }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 18px ${color}18`}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:7 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:500, color }}>
        {isNum
          ? <AnimatedNumber value={num} prefix={prefix} suffix={suffix} decimals={String(value).includes('.')?2:0} color={color} />
          : <span style={{ fontFamily:FM, color }}>{value}</span>
        }
      </div>
      {sub && <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:3 }}>{sub}</div>}
      {accent !== undefined && (
        <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:5, overflow:'hidden', marginTop:10 }}>
          <div style={{ width:Math.min(accent,100)+'%', height:'100%', background:color, borderRadius:99, transition:'width 0.9s cubic-bezier(0.34,1.2,0.64,1)' }} />
        </div>
      )}
    </div>
  )
}

// ── Button ──────────────────────────────────────────────────────────────────
export function Button({ children, variant='default', size='md', fullWidth, loading, disabled, onClick, type='button', style }) {
  const pad = size==='sm'?'7px 14px':size==='lg'?'13px 24px':'10px 18px'
  const fs  = size==='sm'?12:size==='lg'?15:14
  const v = {
    default:{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.11)', color:'rgba(255,255,255,0.72)' },
    gold:   { background:'#f5c842', border:'1px solid #f5c842', color:'#1a1400' },
    teal:   { background:'#3db88a', border:'1px solid #3db88a', color:'#041a12' },
    ghost:  { background:'transparent', border:'1px solid rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.48)' },
    danger: { background:'rgba(232,98,74,0.11)', border:'1px solid rgba(232,98,74,0.24)', color:'#f07a62' },
  }[variant]||{}
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
      fontFamily:F, fontWeight:700, borderRadius:10, padding:pad, fontSize:fs,
      width:fullWidth?'100%':undefined,
      opacity:disabled||loading?0.45:1,
      cursor:disabled||loading?'not-allowed':'pointer',
      transition:'transform 0.12s, opacity 0.15s, box-shadow 0.15s',
      ...v, ...style,
    }}
    onMouseEnter={e=>{ if(!disabled&&!loading){ e.currentTarget.style.transform='scale(1.025)'; if(variant==='gold') e.currentTarget.style.boxShadow='0 0 16px rgba(245,200,66,0.35)' }}}
    onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}
    onMouseDown={e=>{ if(!disabled&&!loading) e.currentTarget.style.transform='scale(0.97)' }}
    onMouseUp={e=>{ if(!disabled&&!loading) e.currentTarget.style.transform='scale(1.025)' }}
    >
      {loading ? <span style={{ width:13, height:13, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block' }} /> : children}
    </button>
  )
}

// ── SectionHeader with serif title + accent bar ─────────────────────────────
export function SectionHeader({ title, sub, action, accent='#f5c842' }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: sub ? 4 : 0 }}>
          <div style={{ width:4, height:28, background:`linear-gradient(180deg, ${accent}, ${accent}44)`, borderRadius:99, flexShrink:0, boxShadow:`0 0 10px ${accent}60` }} />
          <h1 style={{ fontFamily:FS, fontSize:28, fontWeight:400, color:'#fff', letterSpacing:'-0.01em', lineHeight:1 }}>{title}</h1>
        </div>
        {sub && <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginLeft:14, fontFamily:F }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ── CardTitle ───────────────────────────────────────────────────────────────
export function CardTitle({ children }) {
  return <div style={{ fontFamily:F, fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)', marginBottom:12 }}>{children}</div>
}

// ── ListItem ─────────────────────────────────────────────────────────────────
export function ListItem({ icon, iconBg, name, sub, right, onDelete }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.038)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', borderRadius:10, marginBottom:6, border:'1px solid rgba(255,255,255,0.065)', fontFamily:F, transition:'background 0.15s, border-color 0.15s' }}
      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.065)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.11)' }}
      onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.038)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.065)' }}>
      {icon && <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:iconBg||'rgba(255,255,255,0.07)', fontSize:16, border:'1px solid rgba(255,255,255,0.07)' }}>{icon}</div>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'#fff' }}>{name}</div>
        {sub && <div style={{ fontSize:12, color:'rgba(255,255,255,0.36)', marginTop:1 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft:'auto', textAlign:'right', flexShrink:0 }}>{right}</div>}
      {onDelete && (
        <button onClick={onDelete} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.22)', fontSize:18, lineHeight:1, padding:'2px 4px', borderRadius:4, cursor:'pointer', transition:'color 0.15s' }}
          onMouseEnter={e=>e.target.style.color='#f07a62'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.22)'}>x</button>
      )}
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign:'center', padding:'36px 20px', color:'rgba(255,255,255,0.28)', fontFamily:F }}>
      {icon && <div style={{ fontSize:32, marginBottom:10, filter:'grayscale(0.3)' }}>{icon}</div>}
      <div style={{ fontSize:13 }}>{message}</div>
    </div>
  )
}

// ── Grid ─────────────────────────────────────────────────────────────────────
export function Grid({ cols=2, gap=12, children, style }) {
  return (
    <>
      <style>{`.fg-${cols}{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gap}px;}@media(max-width:640px){.fg-${cols}{grid-template-columns:1fr;}}`}</style>
      <div className={'fg-'+cols} style={style}>{children}</div>
    </>
  )
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children, selected, onClick }) {
  return (
    <span onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', padding:'4px 11px', borderRadius:99,
      fontSize:12, cursor:onClick?'pointer':'default', margin:'2px', transition:'all 0.15s', fontWeight:600, fontFamily:F,
      border:selected?'1px solid rgba(245,200,66,0.40)':'1px solid rgba(255,255,255,0.09)',
      background:selected?'rgba(245,200,66,0.14)':'rgba(255,255,255,0.04)',
      color:selected?'#f5c842':'rgba(255,255,255,0.48)',
    }}>{children}</span>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size=20, color='#f5c842' }) {
  return <div style={{ width:size, height:size, border:'2px solid rgba(245,200,66,0.14)', borderTopColor:color, borderRadius:'50%', animation:'spin 0.65s linear infinite', display:'inline-block' }} />
}

// ── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.065)', margin:'14px 0', ...style }} />
}

// ── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ label, value, max=100, color='#f5c842', warn }) {
  const pct = Math.min((value/max)*100, 100)
  const c   = warn && pct >= 90 ? '#f07a62' : color
  return (
    <div style={{ marginBottom:12, fontFamily:F }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:13, color:'rgba(255,255,255,0.62)' }}>{label}</span>
        <span style={{ fontSize:12, color:c, fontWeight:700 }}>{Math.round(pct)}%{warn&&pct>=90?' ⚠️':''}</span>
      </div>
      <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:7, overflow:'hidden' }}>
        <div style={{ width:pct+'%', height:'100%', background:c, borderRadius:99, transition:'width 0.7s cubic-bezier(0.34,1.2,0.64,1)', boxShadow:pct>0?`0 0 8px ${c}60`:'' }} />
      </div>
    </div>
  )
}

// ── GradientText ─────────────────────────────────────────────────────────────
export function GradientText({ children, from='#f5c842', to='#fff', style }) {
  return (
    <span style={{ background:`linear-gradient(135deg, ${from}, ${to})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', ...style }}>
      {children}
    </span>
  )
}
