import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback(({ message, type = 'info', duration = 3500, undo }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, undo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const colors = {
    info:    { bg: 'rgba(74,123,224,0.18)',  border: 'rgba(74,123,224,0.35)',  text: '#6a96f0' },
    success: { bg: 'rgba(61,184,138,0.18)',  border: 'rgba(61,184,138,0.35)',  text: '#5dd4a6' },
    error:   { bg: 'rgba(232,98,74,0.18)',   border: 'rgba(232,98,74,0.35)',   text: '#f07a62' },
    warning: { bg: 'rgba(245,200,66,0.18)',  border: 'rgba(245,200,66,0.35)',  text: '#f5c842' },
  }

  return (
    <ToastCtx.Provider value={{ add, remove }}>
      {children}
      <div style={{ position:'fixed', bottom:80, right:20, zIndex:999, display:'flex', flexDirection:'column', gap:8, maxWidth:320 }}>
        {toasts.map(t => {
          const c = colors[t.type] || colors.info
          return (
            <div key={t.id} style={{
              background: c.bg, border: '1px solid ' + c.border,
              borderRadius: 12, padding: '11px 16px',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              display: 'flex', alignItems: 'center', gap: 10,
              animation: 'fadeUp 0.25s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              <span style={{ fontSize: 13, color: '#fff', flex: 1 }}>{t.message}</span>
              {t.undo && (
                <button onClick={() => { t.undo(); remove(t.id) }} style={{ background: 'none', border: '1px solid ' + c.border, borderRadius: 6, color: c.text, fontSize: 12, fontWeight: 700, padding: '3px 9px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  Undo
                </button>
              )}
              <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.40)', fontSize: 16, cursor: 'pointer', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>x</button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
