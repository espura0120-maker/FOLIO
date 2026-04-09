import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--gold2)' }}>FOLIO</div>
        <div style={{ width: 28, height: 28, border: '2px solid var(--gold)30', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.65s linear infinite' }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  return children
}
