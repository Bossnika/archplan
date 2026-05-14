// src/pages/LoginPage.jsx
import React from 'react'
import { useState } from 'react'
import { useAuth }  from '../hooks/useAuth.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { COMPANY }  from '../lib/constants.js'
import { LogIn, UserPlus, Chrome, AlertCircle } from 'lucide-react'

export default function LoginPage({ T: propT }) {
  const { loginGoogle, loginEmail, registerEmail } = useAuth()
  const themeCtx = useTheme()
  const T = themeCtx?.T ?? propT ?? { bg:'#0d0f12', sidebar:'#111318', panel:'#161b22', panelHov:'#1c2230', border:'#21262d', borderLt:'#30363d', text:'#e6edf3', textMd:'#8b949e', textDim:'#484f58', accent:'#58a6ff', accentBg:'#58a6ff14', accentLt:'#79c0ff', green:'#3fb950', greenBg:'#3fb95014', amber:'#d29922', amberBg:'#d2992214', red:'#f85149', redBg:'#f8514914', blue:'#58a6ff', purple:'#bc8cff', shadow:'0 8px 32px rgba(0,0,0,.55)', shadowLg:'0 24px 64px rgba(0,0,0,.75)' }
  const [tab,    setTab]    = useState('login')
  const [email,  setEmail]  = useState('')
  const [pass,   setPass]   = useState('')
  const [name,   setName]   = useState('')
  const [err,    setErr]    = useState('')
  const [loading,setLoading]= useState(false)

  const handle = async (fn) => {
    setErr(''); setLoading(true)
    try { await fn() }
    catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  const inp = {
    width:'100%', background:T.bg, border:`1px solid ${T.borderLt}`,
    borderRadius:8, padding:'9px 12px', color:T.text, fontSize:13,
    outline:'none', transition:'border-color .15s', fontFamily:'inherit',
    boxSizing:'border-box',
  }

  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <header style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:'14px 28px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 2px 8px ${T.accent}44`}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.text,letterSpacing:'-.3px'}}>ArchPlan</div>
          <div style={{fontSize:10,color:T.textDim,letterSpacing:'.8px',textTransform:'uppercase'}}>{COMPANY.tagline}</div>
        </div>
        <div style={{marginLeft:'auto',textAlign:'right'}}>
          <div style={{fontSize:12,fontWeight:600,color:T.textMd}}>{COMPANY.name}</div>
          <div style={{fontSize:10,color:T.textDim}}>{COMPANY.site}</div>
        </div>
      </header>

      {/* Main */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{width:'100%',maxWidth:420}}>
          <div style={{background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:14,padding:32,boxShadow:T.shadowLg}}>
            {/* Logo */}
            <div style={{textAlign:'center',marginBottom:28}}>
              <div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:14,boxShadow:`0 8px 32px ${T.accent}44`}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div style={{fontSize:22,fontWeight:800,color:T.text,letterSpacing:'-.4px'}}>ArchPlan</div>
              <div style={{fontSize:12,color:T.textDim,marginTop:4}}>{COMPANY.name}</div>
            </div>

            {/* Tab toggle */}
            <div style={{display:'flex',background:T.bg,borderRadius:9,padding:3,marginBottom:22,border:`1px solid ${T.border}`,gap:2}}>
              {[['login','Autentificare'],['register','Cont nou']].map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t)}
                  style={{flex:1,background:tab===t?T.panel:'transparent',border:`1px solid ${tab===t?T.border:'transparent'}`,borderRadius:7,padding:'7px',color:tab===t?T.text:T.textDim,cursor:'pointer',fontSize:12,fontWeight:tab===t?600:400,fontFamily:'inherit',transition:'all .12s'}}>
                  {l}
                </button>
              ))}
            </div>

            {/* Google */}
            <button onClick={()=>handle(loginGoogle)}
              style={{width:'100%',background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:10,padding:'10px',color:T.text,cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:16,fontFamily:'inherit',transition:'border-color .15s'}}
              onMouseEnter={e=>e.target.style.borderColor=T.accent} onMouseLeave={e=>e.target.style.borderColor=T.borderLt}>
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.2-11.3-7.9l-6.5 5C9.7 39.7 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.2 5.2C41.5 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
              Continuă cu Google
            </button>

            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{flex:1,height:1,background:T.border}}/><span style={{fontSize:11,color:T.textDim}}>sau cu email</span><div style={{flex:1,height:1,background:T.border}}/>
            </div>

            {tab==='register'&&(
              <div style={{marginBottom:11}}>
                <label style={{fontSize:10,color:T.textDim,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:.6}}>Nume complet</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ion Popescu" style={inp}
                  onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.borderLt}/>
              </div>
            )}
            <div style={{marginBottom:11}}>
              <label style={{fontSize:10,color:T.textDim,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:.6}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ion@studiokolectiv.ro" style={inp}
                onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.borderLt}/>
            </div>
            <div style={{marginBottom:err?12:20}}>
              <label style={{fontSize:10,color:T.textDim,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:.6}}>Parolă</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={inp}
                onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.borderLt}
                onKeyDown={e=>{ if(e.key==='Enter') tab==='login'?handle(()=>loginEmail(email,pass)):handle(()=>registerEmail(email,pass,name)) }}/>
            </div>

            {err&&(
              <div style={{display:'flex',alignItems:'center',gap:8,background:T.redBg,border:`1px solid ${T.red}44`,borderRadius:8,padding:'9px 12px',fontSize:12,color:T.red,marginBottom:14}}>
                <AlertCircle size={14}/>{err}
              </div>
            )}

            <button onClick={()=>tab==='login'?handle(()=>loginEmail(email,pass)):handle(()=>registerEmail(email,pass,name))}
              disabled={loading}
              style={{width:'100%',background:T.accent,border:'none',borderRadius:9,padding:'11px',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:7,opacity:loading?.7:1,fontFamily:'inherit',transition:'opacity .15s'}}>
              {tab==='login'?<LogIn size={14}/>:<UserPlus size={14}/>}
              {loading?'Se procesează…':tab==='login'?'Autentificare':'Creează cont'}
            </button>
          </div>

          <div style={{textAlign:'center',marginTop:20,fontSize:11,color:T.textDim}}>
            {COMPANY.name} · {COMPANY.cui} ·{' '}
            <a href={`https://${COMPANY.site}`} target="_blank" rel="noreferrer" style={{color:T.accent,textDecoration:'none'}}>{COMPANY.site}</a>
          </div>
        </div>
      </div>
    </div>
  )
}
