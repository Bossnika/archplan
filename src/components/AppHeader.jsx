// src/components/AppHeader.jsx
import React from 'react'
import { useState } from 'react'
import { useAuth }  from '../hooks/useAuth.jsx'
import { Avatar }   from './ProjectChat.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { COMPANY }  from '../lib/constants.js'
import {
  Bell, Plus, Sun, Moon, Monitor, LogOut, User,
  ChevronRight, AlertTriangle, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'

export default function AppHeader({ selectedProject, showRem, setShowRem, setShowNew, alerts, urgentRem, setSelected }) {
  const { user, logout }      = useAuth()
  const { mode, setMode, T }  = useTheme()
  const [userMenu, setUserMenu] = useState(false)

  const themeIcon = mode==='dark' ? <Moon size={13}/> : mode==='light' ? <Sun size={13}/> : <Monitor size={13}/>
  const nextTheme = mode==='dark' ? 'light' : mode==='light' ? 'auto' : 'dark'

  return (
    <header style={{height:46,background:T.sidebar,borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0,zIndex:20}}>

      {/* Logo */}
      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        <div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 2px 8px ${T.accent}44`}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <span style={{fontSize:14,fontWeight:700,color:T.text,letterSpacing:'-.3px'}}>ArchPlan</span>
      </div>

      <div style={{width:1,height:18,background:T.border,flexShrink:0}}/>

      {/* Breadcrumb */}
      <div style={{flex:1,display:'flex',alignItems:'center',gap:5,minWidth:0}}>
        <button onClick={()=>{ setSelected(null); setShowRem(false); }}
          style={{background:'none',border:'none',padding:0,cursor:'pointer',fontSize:12,color:T.textDim,fontFamily:'inherit'}}>
          Proiecte
        </button>
        {selectedProject&&!showRem&&<>
          <ChevronRight size={12} color={T.textDim}/>
          <span style={{fontSize:12,color:T.text,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selectedProject.name}</span>
        </>}
        {showRem&&<>
          <ChevronRight size={12} color={T.textDim}/>
          <span style={{fontSize:12,color:T.text,fontWeight:500}}>Remindere</span>
        </>}
      </div>

      {/* Alerts */}
      {alerts.length>0&&(
        <div style={{display:'flex',alignItems:'center',gap:5,background:T.amberBg,border:`1px solid ${T.amber}44`,borderRadius:6,padding:'3px 10px',flexShrink:0}}>
          <AlertTriangle size={11} color={T.amber}/>
          <span style={{fontSize:11,color:T.amber,fontWeight:600}}>{alerts.length} termen{alerts.length>1?'e':''}</span>
        </div>
      )}

      {/* Reminders */}
      <button onClick={()=>{ setShowRem(s=>!s); setSelected(null); }}
        style={{position:'relative',display:'flex',alignItems:'center',gap:5,background:showRem?T.accentBg:'transparent',border:`1px solid ${showRem?T.accent:T.border}`,borderRadius:7,padding:'5px 11px',color:showRem?T.accentLt:T.textMd,cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:500}}>
        <Bell size={13}/><span>Remindere</span>
        {urgentRem>0&&<span style={{position:'absolute',top:-4,right:-4,background:T.red,color:'#fff',borderRadius:10,fontSize:9,fontWeight:700,padding:'1px 5px',lineHeight:1.5}}>{urgentRem}</span>}
      </button>

      {/* Theme */}
      <button onClick={()=>setMode(nextTheme)} title={`Temă: ${mode}`}
        style={{display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${T.border}`,borderRadius:7,width:32,height:32,color:T.textMd,cursor:'pointer'}}>
        {themeIcon}
      </button>

      {/* New project */}
      <button onClick={()=>setShowNew(true)}
        style={{display:'flex',alignItems:'center',gap:5,background:T.accent,border:'none',borderRadius:7,padding:'6px 13px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
        <Plus size={13}/>Proiect nou
      </button>

      {/* User */}
      <div style={{position:'relative',flexShrink:0}}>
        <div onClick={()=>setUserMenu(s=>!s)} style={{cursor:'pointer'}}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:`1.5px solid ${T.accent}`}}/>
            : <Avatar name={user?.displayName||user?.email||'U'} email={user?.email||''} size={30}/>
          }
        </div>
        {userMenu&&(
          <div className="fade-up" style={{position:'absolute',top:38,right:0,background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:10,padding:6,minWidth:200,boxShadow:T.shadowLg,zIndex:100}}>
            <div style={{padding:'8px 12px',borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text}}>{user?.displayName||'Utilizator'}</div>
              <div style={{fontSize:10,color:T.textDim}}>{user?.email}</div>
            </div>
            <button onClick={()=>{ logout(); setUserMenu(false); }}
              style={{width:'100%',background:'transparent',border:'none',padding:'7px 12px',color:T.red,cursor:'pointer',fontSize:12,textAlign:'left',borderRadius:6,fontFamily:'inherit',display:'flex',alignItems:'center',gap:7}}>
              <LogOut size={13}/>Deconectare
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
