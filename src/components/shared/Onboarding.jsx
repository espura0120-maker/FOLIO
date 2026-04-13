import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'

const STEPS = ['Welcome', 'Profile', 'Goals', 'Ready']

export default function Onboarding({ onComplete }) {
  const { profile, updateProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    cal_goal: 2000,
    weight_unit: 'kg',
    currency: 'EUR',
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function finish() {
    await updateProfile({ ...form, onboarded: true })
    onComplete()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'#0e0f16', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:460 }}>

        {/* Steps indicator */}
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:32 }}>
          {STEPS.map((s,i) => (
            <div key={i} style={{ height:4, borderRadius:99, transition:'all 0.3s', flex:1, background: i<=step ? '#f5c842' : 'rgba(255,255,255,0.10)' }} />
          ))}
        </div>

        <div style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:22, padding:'32px 28px', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)' }}>

          {step === 0 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>✦</div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:30, fontWeight:800, color:'#f5c842', marginBottom:8 }}>Welcome to FOLIO</div>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.55)', lineHeight:1.7, marginBottom:28 }}>
                Your all-in-one digital bullet journal for finance, nutrition, wellness, workouts and more.
              </div>
              <button onClick={() => setStep(1)} style={{ width:'100%', padding:'13px', background:'#f5c842', border:'none', borderRadius:12, color:'#1a1400', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Let's get started →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:6 }}>About you</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.40)', marginBottom:24 }}>This helps personalise your experience</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:6, fontWeight:700 }}>Your name</label>
                  <input value={form.full_name} onChange={set('full_name')} placeholder="What should we call you?" />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:8, fontWeight:700 }}>Currency</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[['EUR','€'],['USD','$'],['JPY','¥']].map(([code,sym]) => (
                      <button key={code} onClick={() => setForm(f=>({...f,currency:code}))} style={{ flex:1, padding:'10px', background:form.currency===code?'rgba(245,200,66,0.15)':'rgba(255,255,255,0.06)', border:form.currency===code?'1px solid rgba(245,200,66,0.40)':'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:form.currency===code?'#f5c842':'rgba(255,255,255,0.55)', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>
                        {sym} {code}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:8, fontWeight:700 }}>Weight unit</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {['kg','lbs'].map(u => (
                      <button key={u} onClick={() => setForm(f=>({...f,weight_unit:u}))} style={{ flex:1, padding:'10px', background:form.weight_unit===u?'rgba(245,200,66,0.15)':'rgba(255,255,255,0.06)', border:form.weight_unit===u?'1px solid rgba(245,200,66,0.40)':'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:form.weight_unit===u?'#f5c842':'rgba(255,255,255,0.55)', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setStep(2)} style={{ width:'100%', marginTop:22, padding:'13px', background:'#f5c842', border:'none', borderRadius:12, color:'#1a1400', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:6 }}>Nutrition goal</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.40)', marginBottom:24 }}>Set your daily calorie target</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:6, fontWeight:700 }}>Daily calorie goal</label>
                  <input type="number" value={form.cal_goal} onChange={set('cal_goal')} min={800} max={9000} step={50} />
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[[1500,'Cut'],[2000,'Maintain'],[2500,'Bulk'],[3000,'Active']].map(([cal,label]) => (
                    <button key={cal} onClick={() => setForm(f=>({...f,cal_goal:cal}))} style={{ padding:'8px 14px', background:form.cal_goal===cal?'rgba(245,200,66,0.15)':'rgba(255,255,255,0.06)', border:form.cal_goal===cal?'1px solid rgba(245,200,66,0.40)':'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:form.cal_goal===cal?'#f5c842':'rgba(255,255,255,0.55)', fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                      {cal} — {label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(3)} style={{ width:'100%', marginTop:22, padding:'13px', background:'#f5c842', border:'none', borderRadius:12, color:'#1a1400', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Continue →
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:8 }}>You're all set{form.full_name ? ', ' + form.full_name.split(' ')[0] : ''}!</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.50)', lineHeight:1.7, marginBottom:28 }}>
                Your FOLIO is ready. Start by logging a transaction, checking off a wellness goal, or writing a journal entry.
              </div>
              <button onClick={finish} style={{ width:'100%', padding:'13px', background:'#f5c842', border:'none', borderRadius:12, color:'#1a1400', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Open FOLIO →
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:'rgba(255,255,255,0.20)' }}>
          Step {step + 1} of {STEPS.length}
        </div>
      </div>
    </div>
  )
}
