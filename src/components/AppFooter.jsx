// src/components/AppFooter.jsx
import { useTheme } from '../hooks/useTheme.jsx'
import { COMPANY }  from '../lib/constants.js'

export default function AppFooter() {
  const { T } = useTheme()
  return (
    <footer style={{height:36,background:T.sidebar,borderTop:`1px solid ${T.border}`,display:'flex',alignItems:'center',padding:'0 20px',gap:14,flexShrink:0,flexWrap:'wrap'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:18,height:18,borderRadius:5,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
        <span style={{fontSize:11,fontWeight:700,color:T.text}}>{COMPANY.name}</span>
        <span style={{fontSize:10,color:T.textDim}}>{COMPANY.cui}</span>
      </div>
      <div style={{height:12,width:1,background:T.border}}/>
      <span style={{fontSize:10,color:T.textDim}}>{COMPANY.tagline}</span>
      <div style={{marginLeft:'auto',display:'flex',gap:14,alignItems:'center'}}>
        <a href={`https://${COMPANY.site}`} target="_blank" rel="noreferrer"
          style={{fontSize:10,color:T.blue,textDecoration:'none',fontWeight:500}}>{COMPANY.site}</a>
        <a href={`mailto:${COMPANY.email}`} style={{fontSize:10,color:T.textDim,textDecoration:'none'}}>{COMPANY.email}</a>
        <span style={{fontSize:10,color:T.textDim}}>{COMPANY.phone}</span>
        <span style={{fontSize:10,color:T.textDim}}>© {new Date().getFullYear()} ArchPlan</span>
      </div>
    </footer>
  )
}
