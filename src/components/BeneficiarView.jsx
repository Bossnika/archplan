// src/components/BeneficiarView.jsx
import React from 'react'
import { useState } from 'react'
import { User, Home, Building2, FolderOpen, Link2, FileText, ExternalLink, Plus, X, Edit2 } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'
import { emptyBeneficiar, uid } from '../lib/utils.js'

const FIELDS_PERSONAL = [
  {l:'Nume',k:'nume',span:2},{l:'Prenume',k:'prenume',span:2},{l:'CNP / CUI',k:'cnp',span:2},
  {l:'Telefon',k:'telefon',span:2},{l:'Email',k:'email',span:4},
]
const FIELDS_DOMICILIU = [
  {l:'Adresă domiciliu (CI/buletin)',k:'adresaDomiciliu',span:6},
  {l:'Localitate',k:'localitateDomiciliu',span:3},{l:'Județ',k:'judetDomiciliu',span:3},
]
const FIELDS_AMPLASAMENT = [
  {l:'Adresă amplasament (teren)',k:'adresaAmplasament',span:6},
  {l:'Localitate amplasament',k:'localitateAmplasament',span:3},
  {l:'Județ amplasament',k:'judetAmplasament',span:2},{l:'Cod SIRUTA',k:'siruta',span:1},
]
const FIELDS_TEREN = [
  {l:'Nr. cadastral',k:'nrCadastral',span:2},{l:'Nr. CF',k:'nrCF',span:2},
  {l:'Suprafață (m²)',k:'suprafata',span:1},{l:'Zonă UTR',k:'zonaUTR',span:1},
]

export default function BeneficiarView({ project, onUpdate }) {
  const { T }       = useTheme()
  const [editing, setEditing] = useState(false)
  const [local,   setLocal]   = useState(project.beneficiar || emptyBeneficiar())
  const [newLink, setNewLink] = useState({name:'',url:''})
  const [showLF,  setShowLF]  = useState(false)

  const hasData = Object.values(local).some(v => v && !(Array.isArray(v) && v.length===0))

  const inp = {width:'100%',background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:7,padding:'8px 11px',color:T.text,fontSize:12,outline:'none',boxSizing:'border-box',fontFamily:'inherit',transition:'border-color .15s'}
  const focusIn  = e => e.target.style.borderColor=T.accent
  const focusOut = e => e.target.style.borderColor=T.borderLt

  const Section = ({icon:Icon,label,accent,children}) => (
    <div style={{padding:'14px 20px',borderBottom:`1px solid ${T.border}`}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:11}}>
        <div style={{width:26,height:26,borderRadius:7,background:accent?`${accent}18`:T.accentBg,border:`1px solid ${accent?accent+'30':T.accent+'30'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon size={13} color={accent||T.blue}/>
        </div>
        <span style={{fontSize:12,fontWeight:600,color:accent||T.text}}>{label}</span>
      </div>
      {children}
    </div>
  )

  const FieldGrid = ({fields}) => (
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:9}}>
      {fields.map(f=>(
        <div key={f.k} style={{gridColumn:`span ${f.span}`}}>
          <label style={{fontSize:9,color:T.textDim,display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:.6}}>{f.l}</label>
          <input value={local[f.k]||''} onChange={e=>setLocal(l=>({...l,[f.k]:e.target.value}))} style={inp} onFocus={focusIn} onBlur={focusOut}/>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{border:`1px solid ${T.border}`,borderRadius:10,overflow:'hidden',background:T.panel}}>
      {/* toolbar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderBottom:`1px solid ${T.border}`,background:T.sidebar}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.text}}>Fișă beneficiar / proprietar</div>
          <div style={{fontSize:11,color:T.textDim,marginTop:2}}>Adresa amplasamentului poate diferi față de domiciliu — câmp separat utilizat la avize</div>
        </div>
        {!editing&&(
          <button onClick={()=>setEditing(true)}
            style={{display:'inline-flex',alignItems:'center',gap:5,background:T.accentBg,border:`1px solid ${T.accent}44`,color:T.accentLt,borderRadius:7,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
            <Edit2 size={12}/>{hasData?'Modifică':'Completează fișa'}
          </button>
        )}
      </div>

      {editing ? (
        <div style={{padding:'0 0 0 0'}}>
          <Section icon={User} label="Date personale"><FieldGrid fields={FIELDS_PERSONAL}/></Section>
          <Section icon={Home} label="Domiciliu (conform CI / Buletin)"><FieldGrid fields={FIELDS_DOMICILIU}/></Section>
          <Section icon={Building2} label="Adresă amplasament — utilizată la avize" accent={T.amber}>
            <div style={{display:'flex',alignItems:'center',gap:7,background:T.amberBg,border:`1px solid ${T.amber}44`,borderRadius:7,padding:'7px 11px',marginBottom:10,fontSize:11,color:T.amber}}>
              <Building2 size={12}/>Această adresă va apărea în toate cererile de avize
            </div>
            <FieldGrid fields={FIELDS_AMPLASAMENT}/>
          </Section>
          <Section icon={FolderOpen} label="Date cadastrale"><FieldGrid fields={FIELDS_TEREN}/></Section>
          <Section icon={Link2} label="Documente primite (linkuri Drive / Dropbox)">
            {(local.docLinks||[]).map(dl=>(
              <div key={dl.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:T.bg,borderRadius:6,border:`1px solid ${T.border}`,marginBottom:5}}>
                <Link2 size={12} color={T.textMd}/>
                <a href={dl.url} target="_blank" rel="noreferrer" style={{flex:1,fontSize:11,color:T.blue,textDecoration:'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dl.name||dl.url}</a>
                <button onClick={()=>setLocal(l=>({...l,docLinks:(l.docLinks||[]).filter(d=>d.id!==dl.id)}))} style={{background:'transparent',border:'none',color:T.textDim,cursor:'pointer',display:'flex'}}><X size={13}/></button>
              </div>
            ))}
            {showLF?(
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'flex-end'}}>
                <input value={newLink.name} onChange={e=>setNewLink(l=>({...l,name:e.target.value}))} placeholder="Denumire document"
                  style={{flex:1,minWidth:140,...inp,marginBottom:0}}/>
                <input value={newLink.url} onChange={e=>setNewLink(l=>({...l,url:e.target.value}))} placeholder="https://drive.google.com/…"
                  style={{flex:2,minWidth:200,...inp,marginBottom:0}}/>
                <button onClick={()=>{if(newLink.url.trim()){setLocal(l=>({...l,docLinks:[...(l.docLinks||[]),{id:uid(),...newLink}]}));setNewLink({name:'',url:''});setShowLF(false);}}}
                  style={{background:T.accent,border:'none',borderRadius:7,padding:'8px 14px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Adaugă</button>
                <button onClick={()=>setShowLF(false)} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:7,padding:'8px 10px',color:T.textDim,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center'}}><X size={13}/></button>
              </div>
            ):(
              <button onClick={()=>setShowLF(true)}
                style={{display:'inline-flex',alignItems:'center',gap:5,background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,padding:'6px 11px',color:T.textDim,cursor:'pointer',fontSize:11,fontFamily:'inherit',marginTop:4}}>
                <Plus size={12}/>Adaugă link document
              </button>
            )}
          </Section>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',padding:'14px 20px',borderTop:`1px solid ${T.border}`}}>
            <button onClick={()=>setEditing(false)} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:8,padding:'8px 18px',color:T.textDim,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Anulează</button>
            <button onClick={()=>{onUpdate(local);setEditing(false);}}
              style={{background:T.accent,border:'none',borderRadius:8,padding:'8px 20px',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Salvează fișa</button>
          </div>
        </div>
      ) : !hasData ? (
        <div style={{textAlign:'center',padding:'36px 0',color:T.textDim}}>
          <User size={28} color={T.borderLt} style={{marginBottom:10}}/>
          <div style={{fontSize:13}}>Nicio dată completată</div>
        </div>
      ) : (
        <div>
          {/* personal */}
          <div style={{padding:'14px 20px',borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
              <User size={13} color={T.textDim}/><span style={{fontSize:11,fontWeight:600,color:T.textMd}}>Date personale</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:9}}>
              {FIELDS_PERSONAL.concat(FIELDS_TEREN).filter(f=>local[f.k]).map(f=>(
                <div key={f.k} style={{background:T.bg,borderRadius:7,padding:'9px 12px',border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:9,color:T.textDim,textTransform:'uppercase',letterSpacing:.6,marginBottom:3}}>{f.l}</div>
                  <div style={{fontSize:12,color:T.text,fontWeight:500}}>{local[f.k]}</div>
                </div>
              ))}
            </div>
          </div>
          {/* addresses */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:`1px solid ${T.border}`}}>
            <div style={{padding:'14px 20px',borderRight:`1px solid ${T.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}><Home size={13} color={T.textDim}/><span style={{fontSize:11,fontWeight:600,color:T.textMd}}>Domiciliu (buletin)</span></div>
              <div style={{fontSize:12,color:T.text,lineHeight:1.6}}>{[local.adresaDomiciliu,local.localitateDomiciliu,local.judetDomiciliu].filter(Boolean).join(', ')||'—'}</div>
            </div>
            <div style={{padding:'14px 20px',background:T.amberBg,borderLeft:`2px solid ${T.amber}66`}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}><Building2 size={13} color={T.amber}/><span style={{fontSize:11,fontWeight:600,color:T.amber}}>Amplasament (avize)</span></div>
              <div style={{fontSize:12,color:T.text,lineHeight:1.6}}>{[local.adresaAmplasament,local.localitateAmplasament,local.judetAmplasament].filter(Boolean).join(', ')||'—'}</div>
              {local.siruta&&<span style={{fontSize:10,color:T.amber,fontWeight:600}}>SIRUTA: {local.siruta}</span>}
            </div>
          </div>
          {/* doc links */}
          {(local.docLinks||[]).length>0&&(
            <div style={{padding:'14px 20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:9}}><FolderOpen size={13} color={T.textDim}/><span style={{fontSize:11,fontWeight:600,color:T.textMd}}>Documente primite</span></div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {local.docLinks.map(dl=>(
                  <a key={dl.id} href={dl.url} target="_blank" rel="noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:5,background:T.accentBg,border:`1px solid ${T.accent}44`,borderRadius:6,padding:'4px 10px',fontSize:11,color:T.blue,textDecoration:'none',fontWeight:500}}>
                    <FileText size={11}/>{dl.name||'Document'}<ExternalLink size={10}/>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
