import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'

const ROUTE_COLORS = {
  '/':          { a:'#f5c842', b:'#e8994a', glow:'rgba(245,200,66,0.22)' },
  '/schedule':  { a:'#3db88a', b:'#5dd4a6', glow:'rgba(61,184,138,0.20)' },
  '/finance':   { a:'#f5c842', b:'#f7d060', glow:'rgba(245,200,66,0.22)' },
  '/nutrition': { a:'#e8624a', b:'#f07a62', glow:'rgba(232,98,74,0.20)'  },
  '/wellness':  { a:'#4a7be0', b:'#6a96f0', glow:'rgba(74,123,224,0.20)' },
  '/workout':   { a:'#8a6ed8', b:'#a88ef0', glow:'rgba(138,110,216,0.20)'},
  '/journal':   { a:'#f5c842', b:'#fae090', glow:'rgba(245,200,66,0.22)' },
  '/cycle':     { a:'#d4537e', b:'#ed93b1', glow:'rgba(212,83,126,0.22)' },
  '/settings':  { a:'#888780', b:'#b4b2a9', glow:'rgba(136,135,128,0.16)'},
}

function getColors(pathname) {
  const match = Object.keys(ROUTE_COLORS)
    .filter(k => k !== '/')
    .find(k => pathname.startsWith(k))
  return ROUTE_COLORS[match] || ROUTE_COLORS[pathname] || ROUTE_COLORS['/']
}

export default function DynamicWave() {
  const location = useLocation()
  const colors   = useMemo(() => getColors(location.pathname), [location.pathname])
  const { a, b, glow } = colors

  return (
    <div style={{
      position:'fixed', bottom:-10, left:'-10%', width:'120%', height:300,
      pointerEvents:'none', zIndex:1,
      transition:'all 0.8s ease',
    }}>
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv3 9s ease-in-out infinite', opacity:0.09 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wgA3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={a} stopOpacity="0"/>
            <stop offset="35%"  stopColor={a} stopOpacity="1"/>
            <stop offset="65%"  stopColor={b} stopOpacity="1"/>
            <stop offset="100%" stopColor={a} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,180 C150,120 250,200 400,160 S650,80 800,140 S1050,200 1200,150 L1200,280 L0,280 Z" fill="url(#wgA3)"/>
      </svg>

      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv2 7s ease-in-out infinite', opacity:0.15 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wgA2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={a} stopOpacity="0"/>
            <stop offset="25%"  stopColor={a} stopOpacity="1"/>
            <stop offset="60%"  stopColor={b} stopOpacity="1"/>
            <stop offset="100%" stopColor={b} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,200 C100,150 200,240 350,180 S600,100 750,170 S1000,230 1200,170 L1200,280 L0,280 Z" fill="url(#wgA2)"/>
      </svg>

      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv1 5.5s ease-in-out infinite', opacity:0.24 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wgA1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={a} stopOpacity="0"/>
            <stop offset="20%"  stopColor={a} stopOpacity="1"/>
            <stop offset="55%"  stopColor={b} stopOpacity="1"/>
            <stop offset="80%"  stopColor={b} stopOpacity="0.8"/>
            <stop offset="100%" stopColor={a} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,220 C80,170 180,250 320,200 S550,120 700,190 S950,250 1200,195 L1200,280 L0,280 Z" fill="url(#wgA1)"/>
      </svg>

      <div style={{
        position:'absolute', bottom:-30, left:'50%', transform:'translateX(-50%)',
        width:600, height:160,
        background:`radial-gradient(ellipse, ${glow} 0%, transparent 70%)`,
        borderRadius:'50%',
        animation:'gp 6s ease-in-out infinite',
        transition:'background 0.8s ease',
      }} />
    </div>
  )
}
