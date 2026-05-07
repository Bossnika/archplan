// src/components/AttachmentUploader.jsx
import React from 'react'
import { useState, useRef } from 'react'
import { Upload, Link2, FileText, ExternalLink, X, File } from 'lucide-react'
import { uploadFile, makeExternalLink } from '../lib/storageService.js'
import { useAuth }  from '../hooks/useAuth.jsx'
import { useTheme } from '../hooks/useTheme.jsx'

export default function AttachmentUploader({ attachments=[], onAdd, onRemove, context, projectId, label='Atașamente' }) {
  const { user }   = useAuth()
  const { T }      = useTheme()
  const [progress, setProgress] = useState(null)
  const [extUrl,   setExtUrl]   = useState('')
  const [extName,  setExtName]  = useState('')
  const [showExt,  setShowExt]  = useState(false)
  const [err,      setErr]      = useState('')
  const fileRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setErr(''); setProgress(0)
    try {
      const att = await uploadFile(user.uid, projectId, context, file, setProgress)
      onAdd && onAdd(att)
    } catch (ex) { setErr('Eroare upload: ' + ex.message) }
    finally { setProgress(null); e.target.value = '' }
  }

  const addExternal = () => {
    if (!extUrl.trim()) return
    onAdd && onAdd(makeExternalLink(extName||extUrl, extUrl))
    setExtUrl(''); setExtName(''); setShowExt(false)
  }

  const iconFor = (name='') => {
    const ext = name.split('.').pop().toLowerCase()
    if (ext==='pdf') return FileText
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return File
    return FileText
  }

  return (
    <div style={{marginTop:10}}>
      <div style={{fontSize:10,fontWeight:600,color:T.textDim,textTransform:'uppercase',letterSpacing:.7,marginBottom:7}}>{label}</div>

      {attachments.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:8}}>
          {attachments.map(att => {
            const Icon = iconFor(att.name)
            return (
              <div key={att.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:T.bg,borderRadius:7,border:`1px solid ${T.border}`}}>
                {att.external ? <Link2 size={13} color={T.textMd}/> : <Icon size={13} color={T.textMd}/>}
                <a href={att.url} target="_blank" rel="noreferrer"
                  style={{flex:1,fontSize:11,color:T.blue,textDecoration:'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{att.name}</a>
                {att.external&&<span style={{fontSize:9,color:T.textDim,background:T.border,borderRadius:3,padding:'1px 5px'}}>link extern</span>}
                <span style={{fontSize:9,color:T.textDim,flexShrink:0}}>{att.uploadedAt?.slice(0,10)}</span>
                <ExternalLink size={11} color={T.textDim}/>
                {onRemove&&<button onClick={()=>onRemove(att.id)} style={{background:'transparent',border:'none',color:T.textDim,cursor:'pointer',padding:'1px',display:'flex',alignItems:'center'}}><X size={13}/></button>}
              </div>
            )
          })}
        </div>
      )}

      {progress!==null&&(
        <div style={{marginBottom:8}}>
          <div style={{fontSize:11,color:T.textDim,marginBottom:3}}>Se încarcă… {progress}%</div>
          <div className="upload-bar"><div className="upload-bar-fill" style={{width:`${progress}%`}}/></div>
        </div>
      )}

      {err&&<div style={{fontSize:11,color:T.red,marginBottom:6}}>{err}</div>}

      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        <button onClick={()=>fileRef.current?.click()}
          style={{display:'inline-flex',alignItems:'center',gap:5,background:T.accentBg,border:`1px solid ${T.accent}44`,color:T.accentLt,borderRadius:7,padding:'5px 11px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          <Upload size={12}/>Upload fișier
        </button>
        <button onClick={()=>setShowExt(s=>!s)}
          style={{display:'inline-flex',alignItems:'center',gap:5,background:T.bg,border:`1px solid ${T.borderLt}`,color:T.textDim,borderRadius:7,padding:'5px 11px',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
          <Link2 size={12}/>Drive / Dropbox
        </button>
        <input ref={fileRef} type="file" style={{display:'none'}} onChange={handleFile}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg,.rvt,.zip"/>
      </div>

      {showExt&&(
        <div style={{marginTop:8,padding:10,background:T.bg,borderRadius:8,border:`1px solid ${T.border}`,display:'flex',gap:6,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:2,minWidth:180}}>
            <label style={{fontSize:9,color:T.textDim,display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:.6}}>URL (Google Drive / Dropbox)</label>
            <input value={extUrl} onChange={e=>setExtUrl(e.target.value)} placeholder="https://drive.google.com/…"
              style={{width:'100%',background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:6,padding:'7px 10px',color:T.text,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
          </div>
          <div style={{flex:1,minWidth:120}}>
            <label style={{fontSize:9,color:T.textDim,display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:.6}}>Denumire</label>
            <input value={extName} onChange={e=>setExtName(e.target.value)} placeholder="Aviz electrică.pdf"
              style={{width:'100%',background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:6,padding:'7px 10px',color:T.text,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
          </div>
          <button onClick={addExternal}
            style={{background:T.accent,border:'none',borderRadius:6,padding:'7px 14px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,fontFamily:'inherit',flexShrink:0}}>Adaugă</button>
          <button onClick={()=>setShowExt(false)}
            style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',color:T.textDim,cursor:'pointer',fontSize:12,fontFamily:'inherit',flexShrink:0,display:'flex',alignItems:'center'}}>
            <X size={13}/>
          </button>
        </div>
      )}
    </div>
  )
}
