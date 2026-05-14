import { useState, useEffect, useRef, useCallback } from "react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Bell, Plus, Search, ChevronRight, AlertTriangle, CheckCircle, Clock,
  Circle, FileText, AlertCircle, Layers, Building2, BarChart2, User,
  Download, Upload, Link2, ExternalLink, X, Calendar, Map, Settings,
  PanelLeftClose, PanelLeftOpen, LogOut, MessageSquare, Send, Paperclip,
  AtSign, Hash, Users, UserPlus, Trash2, CheckSquare, Zap, Flame,
  Droplets, Radio, Leaf, ChevronDown, MoreVertical
} from "lucide-react";
import { useAuth } from './hooks/useAuth.jsx'
import { COMPANY } from './lib/constants.js'
import LoginPage from './pages/LoginPage.jsx'
import { listenProjects, updateProject, createProject, listenMessages, sendMessage as dbSendMsg, deleteMessage as dbDeleteMsg, deleteProject, checkAccess, initAccessControl, requestAccess, approveAccess, rejectAccess, listenPendingRequests, createShareLink, getSharedProject, listenNotes, createNote, deleteNote, getOwnerEmail } from './lib/db.js'
import { sendMentionEmail } from './lib/emailService.js'

/* ─── THEME ─────────────────────────────────────────────────────────────────── */
const DARK = {
  bg:"#0d0f12",sidebar:"#111318",panel:"#161b22",panelHov:"#1c2230",
  border:"#21262d",borderLt:"#30363d",
  text:"#e6edf3",textMd:"#8b949e",textDim:"#484f58",
  accent:"#58a6ff",accentBg:"#58a6ff14",accentLt:"#79c0ff",
  green:"#3fb950",greenBg:"#3fb95014",
  amber:"#d29922",amberBg:"#d2992214",
  red:"#f85149",redBg:"#f8514914",
  blue:"#58a6ff",purple:"#bc8cff",
  shadow:"0 8px 32px rgba(0,0,0,.55)",shadowLg:"0 24px 64px rgba(0,0,0,.75)",
};
const LIGHT = {
  bg:"#f6f8fa",sidebar:"#ffffff",panel:"#ffffff",panelHov:"#f6f8fa",
  border:"#d0d7de",borderLt:"#c6cdd5",
  text:"#24292f",textMd:"#57606a",textDim:"#8c959f",
  accent:"#0969da",accentBg:"#0969da0f",accentLt:"#0550ae",
  green:"#1a7f37",greenBg:"#1a7f3710",
  amber:"#9a6700",amberBg:"#9a670010",
  red:"#cf222e",redBg:"#cf222e10",
  blue:"#0969da",purple:"#8250df",
  shadow:"0 4px 16px rgba(0,0,0,.10)",shadowLg:"0 16px 48px rgba(0,0,0,.16)",
};

/* ─── PROJECT TYPES ─────────────────────────────────────────────────────────── */
const PROJECT_TYPES = [
  { id: 'arhitectura', label: 'Arhitectură',    color: '#f85149' },
  { id: 'urbanism',    label: 'Urbanism',        color: '#3fb950' },
  { id: 'design',      label: 'Design Interior', color: '#bc8cff' },
]
const projTypeColor = (type) => PROJECT_TYPES.find(t=>t.id===type)?.color || '#58a6ff'
const projTypeLabel = (type) => PROJECT_TYPES.find(t=>t.id===type)?.label || 'Arhitectură'

/* ─── CONSTANTS ─────────────────────────────────────────────────────────────── */
const GC = {CU:"#d29922",Avize:"#58a6ff",PT:"#bc8cff",AC:"#3fb950"};
const STATUS_META = {
  pending:    {label:"De făcut",   Icon:Circle,      color:"#484f58"},
  in_progress:{label:"În lucru",   Icon:Clock,       color:"#d29922"},
  submitted:  {label:"Depus",      Icon:FileText,    color:"#58a6ff"},
  approved:   {label:"Finalizat",  Icon:CheckCircle, color:"#3fb950"},
  rejected:   {label:"Respins",    Icon:AlertCircle, color:"#f85149"},
};
const CHANNELS = [
  {id:"general",label:"General",   Icon:MessageSquare},
  {id:"cu",     label:"CU",        Icon:FileText},
  {id:"avize",  label:"Avize",     Icon:Building2},
  {id:"pt",     label:"PT",        Icon:Layers},
  {id:"ac",     label:"Dosar AC",  Icon:CheckCircle},
];
const AVATAR_COLORS = [
  "#58a6ff","#3fb950","#d29922","#bc8cff","#f0883e",
  "#39d353","#ff7b72","#79c0ff","#ffa657","#56d364",
];
const INST = [
  {id:"electrica",name:"Electrica / E.ON / CEZ",  short:"Electrică", Icon:Zap,      color:"#d29922"},
  {id:"gaz",      name:"Distrigaz / E.ON Gaz",    short:"Gaz",       Icon:Flame,    color:"#f0883e"},
  {id:"apa",      name:"Apă-Canal (RAJAC)",        short:"Apă-Canal", Icon:Droplets, color:"#58a6ff"},
  {id:"telecom",  name:"Telecom",                  short:"Telecom",   Icon:Radio,    color:"#bc8cff"},
  {id:"mediu",    name:"APM — Mediu",              short:"Mediu",     Icon:Leaf,     color:"#3fb950"},
  {id:"drumuri",  name:"DRDP / Drumuri",           short:"Drumuri",   Icon:Map,      color:"#8b949e"},
];

/* ─── DEMO MEMBERS ───────────────────────────────────────────────────────────── */
const MEMBERS = [
  {id:"m1", name:"Ion Popescu",    email:"ion@studiokolectiv.ro",   role:"owner"},
  {id:"m2", name:"Maria Ionescu",  email:"maria@studiokolectiv.ro", role:"member"},
  {id:"m3", name:"Alexandru Mureșan", email:"alex.muresan@gmail.com", role:"member"},
  {id:"m4", name:"Oana Silaghi",   email:"oana@studiokolectiv.ro",  role:"member"},
];

/* ─── DEMO MESSAGES (per channel) ───────────────────────────────────────────── */
const makeMsgs = (channel) => {
  const base = {
    general: [
      {id:"g1",uid:"m1",text:"Am încărcat documentația CU finalizată. Vă rog să verificați.",attachments:[{id:"a1",name:"Documentatie_CU_v2.pdf",url:"#"}],ts:new Date("2025-01-05T09:15:00")},
      {id:"g2",uid:"m2",text:"Am verificat, arată bine! @Ion Popescu poți să depui la primărie azi?",attachments:[],ts:new Date("2025-01-05T09:32:00")},
      {id:"g3",uid:"m1",text:"Da, mă duc după-amiaza. @Alexandru Mureșan ai trimis planșele actualizate?",attachments:[],ts:new Date("2025-01-05T09:45:00")},
      {id:"g4",uid:"m3",text:"Da, linkul la Drive: https://drive.google.com/folder/floresti",attachments:[{id:"a2",name:"Planșe_PT_v3 — Drive",url:"https://drive.google.com",external:true}],ts:new Date("2025-01-05T10:02:00")},
      {id:"g5",uid:"m4",text:"Am primit avizul de la APM! 🟢 Îl urc în secțiunea Avize.",attachments:[{id:"a3",name:"Aviz_APM_CJ204.pdf",url:"#"}],ts:new Date("2025-01-05T11:20:00")},
    ],
    avize: [
      {id:"av1",uid:"m2",text:"Status avize actualizat: Electrică ✓, Gaz ✓, Apă-Canal în așteptare.",attachments:[],ts:new Date("2025-01-04T14:10:00")},
      {id:"av2",uid:"m3",text:"@Maria Ionescu am sunat la RAJAC, cer documentație suplimentară geotehnică.",attachments:[],ts:new Date("2025-01-04T15:30:00")},
      {id:"av3",uid:"m1",text:"Ok, trimiteți studiul geotehnic cât mai repede. @Alexandru Mureșan poți coordona?",attachments:[],ts:new Date("2025-01-05T08:00:00")},
    ],
    cu:[
      {id:"cu1",uid:"m1",text:"CU nr. 142/2024 a fost emis! Data de azi.",attachments:[{id:"a4",name:"CU_142_2024.pdf",url:"#"}],ts:new Date("2024-10-20T13:00:00")},
    ],
    pt:[],ac:[],
  };
  return (base[channel]||[]).map(m=>({...m,displayName:MEMBERS.find(mb=>mb.id===m.uid)?.name||"?"}));
};

/* ─── HELPERS ────────────────────────────────────────────────────────────────── */
const uid   = () => Math.random().toString(36).slice(2,8);
const TODAY = new Date().toISOString().slice(0,10);
const diffD = (a,b)=>Math.round((new Date(b)-new Date(a))/86400000);
const fmt   = d=>d?new Date(d).toLocaleDateString("ro-RO",{day:"2-digit",month:"short",year:"numeric"}):"—";
const fmtS  = d=>d?new Date(d).toLocaleDateString("ro-RO",{day:"2-digit",month:"short"}):"—";
const fmtT  = d=>d instanceof Date?d.toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"}):"—";
const pctOf = phases=>phases.length?Math.round(phases.filter(p=>p.status==="approved").length/phases.length*100):0;

const avatarColor = (str="")=>AVATAR_COLORS[str.split("").reduce((a,c)=>a+c.charCodeAt(0),0)%AVATAR_COLORS.length];

/* ─── DEMO PROJECTS ──────────────────────────────────────────────────────────── */
const mkPhases=(start,statuses)=>{
  const tpl=[
    {id:"cu_doc",  name:"Elaborare documentație CU",   group:"CU",   dur:14},
    {id:"cu_dep",  name:"Depunere cerere CU",          group:"CU",   dur:3},
    {id:"cu_emit", name:"Emitere CU",                  group:"CU",   dur:30},
    {id:"av_doc",  name:"Elaborare documentații avize",group:"Avize",dur:21},
    {id:"av_dep",  name:"Depunere avize instituții",   group:"Avize",dur:7},
    {id:"av_obt",  name:"Obținere avize",              group:"Avize",dur:45},
    {id:"pt_doc",  name:"Elaborare PT",                group:"PT",   dur:30},
    {id:"pt_ver",  name:"Verificare proiect",          group:"PT",   dur:14},
    {id:"ac_dep",  name:"Depunere dosar AC",           group:"AC",   dur:5},
    {id:"ac_emit", name:"Emitere AC",                  group:"AC",   dur:30},
  ];
  let cur=new Date(start);
  return tpl.map((t,i)=>{
    const s=cur.toISOString().slice(0,10);
    cur=new Date(cur.getTime()+t.dur*86400000);
    return{...t,phaseId:`ph_${t.id}`,status:statuses[i]||"pending",startDate:s,endDate:cur.toISOString().slice(0,10),attachments:[]};
  });
};
const mkAvize=(start,sts={})=>INST.map(inst=>({
  instId:inst.id,avizId:`av_${inst.id}`,status:sts[inst.id]||"pending",
  dosarNr:sts[inst.id]==="approved"?`${inst.short.slice(0,3).toUpperCase()}-2024-${Math.floor(Math.random()*900+100)}`:"",
  contactName:"",note:"",attachments:[],
  steps:inst.Icon?[
    {stepId:uid(),name:`Solicitare aviz ${inst.short.toLowerCase()}`,status:["approved","in_progress","submitted"].includes(sts[inst.id])?"approved":"pending",date:start},
    {stepId:uid(),name:"Depunere documentație",status:sts[inst.id]==="approved"?"approved":"pending",date:new Date(new Date(start).getTime()+14*86400000).toISOString().slice(0,10)},
    {stepId:uid(),name:`Obținere aviz`,status:sts[inst.id]==="approved"?"approved":"pending",date:new Date(new Date(start).getTime()+28*86400000).toISOString().slice(0,10)},
  ]:[],
}));

const INIT_PROJECTS=[
  {id:"p1",name:"Locuință P+1E — Florești",client:"Familia Mureșan Alexandru",location:"Florești, jud. Cluj",startDate:"2024-09-01",
    phases:mkPhases("2024-09-01",["approved","approved","approved","approved","approved","in_progress","pending","pending","pending","pending"]),
    avize:mkAvize("2024-11-20",{electrica:"approved",gaz:"approved",apa:"in_progress",telecom:"submitted",mediu:"approved",drumuri:"pending"}),
    members:[...MEMBERS],acAttachments:[]},
  {id:"p2",name:"Sediu firmă S+P+2E — Cluj",client:"SC Tehno Construct SRL",location:"Cluj-Napoca, Calea Turzii",startDate:"2024-11-15",
    phases:mkPhases("2024-11-15",["approved","approved","in_progress","pending","pending","pending","pending","pending","pending","pending"]),
    avize:mkAvize("2025-01-26",{}),
    members:[MEMBERS[0],MEMBERS[1]],acAttachments:[]},
  {id:"p3",name:"Amenajare mansardă — Turda",client:"Familia Oana Silaghi",location:"Turda, str. Avram Iancu",startDate:"2025-01-10",
    phases:mkPhases("2025-01-10",["in_progress","pending","pending","pending","pending","pending","pending","pending","pending","pending"]),
    avize:mkAvize("2025-03-23",{}),
    members:[MEMBERS[0],MEMBERS[3]],acAttachments:[]},
];

/* ─── MICRO ATOMS ────────────────────────────────────────────────────────────── */
const Avatar=({name="?",email="",size=28,style={}})=>{
  const initials=name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");
  const bg=avatarColor(email||name);
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.36,fontWeight:700,flexShrink:0,letterSpacing:"-.5px",userSelect:"none",border:`2px solid ${bg}55`,...style}}>
      {initials||"?"}
    </div>
  );
};

const Chip=({label,color,T})=>(
  <span style={{fontSize:10,fontWeight:600,color,background:`${color}18`,border:`1px solid ${color}30`,borderRadius:4,padding:"1px 7px",whiteSpace:"nowrap",letterSpacing:.2}}>{label}</span>
);

const MiniProg=({val,color,w=56,T})=>(
  <div style={{display:"flex",alignItems:"center",gap:6}}>
    <div style={{width:w,height:3,background:T.border,borderRadius:2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${val}%`,background:color,borderRadius:2,transition:"width .5s"}}/>
    </div>
    <span style={{fontSize:11,color:T.textMd,fontWeight:600,minWidth:26}}>{val}%</span>
  </div>
);

const StatusDot=({status})=>{
  const s=STATUS_META[status]||STATUS_META.pending;
  return <s.Icon size={11} color={s.color}/>;
};

/* ─── MESSAGE TEXT with @mention highlight ───────────────────────────────────── */
const MsgText=({text,T})=>{
  const parts=text.split(/(@[\w][\w\s]*?)(?=\s@|\s[^@]|$)/g);
  return(
    <span>
      {parts.map((p,i)=>p.startsWith("@")
        ?<span key={i} style={{color:T.accent,fontWeight:600,background:`${T.accent}18`,borderRadius:3,padding:"0 3px"}}>{p}</span>
        :<span key={i}>{p}</span>
      )}
    </span>
  );
};
/* ─── GANTT ──────────────────────────────────────────────────────────────────── */
const Gantt=({phases,T})=>{
  const total=Math.max(1,diffD(phases[0].startDate,phases[phases.length-1].endDate));
  const tp=Math.min(100,Math.max(0,diffD(phases[0].startDate,TODAY)/total*100));
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:540}}>
        <div style={{display:"flex",paddingLeft:188,marginBottom:8}}>
          <span style={{fontSize:10,color:T.textDim,flex:1}}>{fmt(phases[0].startDate)}</span>
          <span style={{fontSize:10,color:T.textDim}}>{fmt(phases[phases.length-1].endDate)}</span>
        </div>
        {phases.map(ph=>{
          const l=diffD(phases[0].startDate,ph.startDate)/total*100;
          const w=Math.max(.8,diffD(ph.startDate,ph.endDate)/total*100);
          const c=GC[ph.group]||T.accent;
          return(
            <div key={ph.phaseId} style={{display:"flex",alignItems:"center",marginBottom:5}}>
              <div style={{width:188,flexShrink:0,paddingRight:10}}>
                <div style={{fontSize:11,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ph.name}</div>
                <Chip label={ph.group} color={c} T={T}/>
              </div>
              <div style={{flex:1,height:20,background:T.border,borderRadius:3,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",left:`${l}%`,width:`${w}%`,height:"100%",background:ph.status==="approved"?c:`${c}44`,border:`1px solid ${c}66`,borderRadius:3}}/>
                <div style={{position:"absolute",left:`${tp}%`,top:0,bottom:0,width:1.5,background:T.red,zIndex:2}}/>
              </div>
              <div style={{width:44,textAlign:"right",fontSize:10,color:ph.status==="approved"?T.green:T.textDim,paddingLeft:8}}>
                {ph.status==="approved"?<CheckCircle size={11} color={T.green}/>:fmtS(ph.endDate)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── MULTI PROGRESS ─────────────────────────────────────────────────────────── */
const MultiProg=({phases,T})=>{
  const groups=["CU","Avize","PT","AC"];
  const pct=pctOf(phases);
  return(
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      {groups.map(g=>{
        const gp=phases.filter(p=>p.group===g),gd=gp.filter(p=>p.status==="approved").length;
        return(
          <div key={g} style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:9,fontWeight:700,color:GC[g],letterSpacing:.8,textTransform:"uppercase"}}>{g}</span>
              <span style={{fontSize:9,color:T.textDim}}>{gd}/{gp.length}</span>
            </div>
            <div style={{height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${gp.length?gd/gp.length*100:0}%`,background:GC[g],borderRadius:2,transition:"width .6s"}}/>
            </div>
          </div>
        );
      })}
      <div style={{minWidth:42,textAlign:"right"}}>
        <span style={{fontSize:22,fontWeight:800,color:T.text,lineHeight:1}}>{pct}</span>
        <span style={{fontSize:11,color:T.textDim}}>%</span>
      </div>
    </div>
  );
};

/* ─── SHARED PROJECT VIEW ────────────────────────────────────────────────────── */
const SharedView = ({ token }) => {
  const [data, setData] = useState(null)
  const [err,  setErr]  = useState(false)
  const T = DARK

  useEffect(() => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(token))))
      setData({ project: { name: decoded.n, client: decoded.c, location: decoded.l, startDate: decoded.s, phases: decoded.ph||[], avize: decoded.av||[] }, config: decoded.cfg || {faze:true,avize:true} })
    } catch(e) {
      // fallback: try Firestore
      getSharedProject(token).then(r => { if(r) setData(r); else setErr(true) }).catch(()=>setErr(true))
    }
  }, [token])

  if (err) return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <div style={{color:T.red,fontSize:14,fontWeight:600}}>Link invalid sau expirat.</div>
    </div>
  )
  if (!data) return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:T.textDim,fontSize:13}}>Se încarcă…</div>
    </div>
  )
  const { project: p, config } = data
  const phases = p.phases || []
  const avize  = p.avize  || []
  return (
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"'Geist','Helvetica Neue',sans-serif",padding:'0 0 40px'}}>
      <style>{`*{box-sizing:border-box;}body{margin:0;}`}</style>
      <header style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:'14px 28px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <span style={{fontSize:14,fontWeight:700,color:T.text}}>ArchPlan</span>
        <span style={{fontSize:11,color:T.textDim,marginLeft:4}}>— Vizualizare proiect</span>
      </header>
      <div style={{maxWidth:900,margin:'32px auto',padding:'0 20px'}}>
        <h1 style={{fontSize:22,fontWeight:800,color:T.text,margin:'0 0 6px'}}>{p.name}</h1>
        <div style={{fontSize:12,color:T.textDim,marginBottom:28,display:'flex',gap:16}}>
          {p.client&&<span>Client: {p.client}</span>}
          {p.location&&<span>Locație: {p.location}</span>}
        </div>
        {config.faze && (
          <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMd,textTransform:'uppercase',letterSpacing:.8,marginBottom:14}}>Faze proiect</div>
            {phases.map(ph => (
              <div key={ph.phaseId} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                <div style={{flex:1,fontSize:13,color:T.text}}>{ph.name}</div>
                <div style={{fontSize:11,color:T.textDim}}>{ph.startDate} → {ph.endDate}</div>
                <div style={{fontSize:11,fontWeight:600,color:STATUS_META[ph.status]?.color||T.textDim}}>{STATUS_META[ph.status]?.label||ph.status}</div>
              </div>
            ))}
          </div>
        )}
        {config.avize && (
          <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMd,textTransform:'uppercase',letterSpacing:.8,marginBottom:14}}>Avize</div>
            {avize.map(av => {
              const inst = INST.find(i=>i.id===av.instId)
              return (
                <div key={av.avizId} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                  <div style={{flex:1,fontSize:13,color:T.text}}>{inst?.name||av.instId}</div>
                  {av.dosarNr&&<div style={{fontSize:11,color:T.textDim}}>Dosar: {av.dosarNr}</div>}
                  <div style={{fontSize:11,fontWeight:600,color:STATUS_META[av.status]?.color||T.textDim}}>{STATUS_META[av.status]?.label||av.status}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── CHAT COMPONENT ─────────────────────────────────────────────────────────── */
const Chat=({project,T,currentUser,showToast})=>{
  const [channel,   setChannel]   = useState("general");
  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState("");
  const [mentionQ,  setMentionQ]  = useState(null);
  const [mentionPos,setMentionPos]= useState(0);
  const [pendingAtt,setPendingAtt]= useState([]);
  const [showLink,  setShowLink]  = useState(false);
  const [extUrl,    setExtUrl]    = useState("");
  const [extName,   setExtName]   = useState("");
  const [showMems,  setShowMems]  = useState(false);
  const [newMemName,setNewMemName]= useState("");
  const [newMemEmail,setNewMemEmail]=useState("");
  const [showNewMem,setShowNewMem]= useState(false);
  const [members,   setMembers]   = useState(project.members||[]);
  const { user } = useAuth();
  const bottomRef = useRef();
  const inputRef  = useRef();

  useEffect(()=>{
    setMembers(project.members||[]);
  },[project.members]);

  useEffect(()=>{
    if (!user) return;
    const unsub = listenMessages(user.uid, project.id, channel, (msgs)=>{
      setMessages(msgs.map(m=>({...m, ts: m.createdAt?.toDate?.() ?? m.ts})));
    });
    return unsub;
  },[user, project.id, channel]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages]);

  const handleTextChange=(e)=>{
    const val=e.target.value;setText(val);
    const cursor=e.target.selectionStart;
    const before=val.slice(0,cursor);
    const m=before.match(/@([\w][\w\s]*)$/);
    if(m){setMentionQ(m[1]);setMentionPos(before.lastIndexOf("@"));}
    else setMentionQ(null);
  };

  const selectMention=(member)=>{
    const before=text.slice(0,mentionPos);
    const after=text.slice(inputRef.current?.selectionStart||text.length);
    setText(`${before}@${member.name} ${after}`);
    setMentionQ(null);inputRef.current?.focus();
  };

  const handleSend=()=>{
    if(!text.trim()&&!pendingAtt.length) return;
    if(!user) return;
    dbSendMsg(user.uid, project.id, channel, {
      uid: currentUser.id,
      displayName: currentUser.name,
      text: text.trim(),
      attachments: [...pendingAtt],
    });
    const mentioned=[...new Set((text.match(/@([\w][\w\s]*)/g)||[]).map(m=>m.slice(1).trim()))];
    mentioned.forEach(name=>{
      const m=members.find(mb=>mb.name.toLowerCase()===name.toLowerCase());
      if(m&&m.email!==currentUser.email){
        sendMentionEmail({toEmail:m.email,toName:m.name,mentionedBy:currentUser.name,projectName:project.name,channel,messageText:text.trim(),projectId:project.id});
        showToast(`📧 Email trimis la ${m.email} — @menționare`,T.green);
      }
    });
    setText("");setPendingAtt([]);
  };

  const deleteMsg=(msgId)=>{
    if(!user) return;
    dbDeleteMsg(user.uid, project.id, channel, msgId);
  };

  const addExtLink=()=>{
    if(!extUrl.trim()) return;
    setPendingAtt(a=>[...a,{id:uid(),name:extName||extUrl,url:extUrl,external:true}]);
    setExtUrl("");setExtName("");setShowLink(false);
  };

  const addMember=()=>{
    if(!newMemName.trim()||!newMemEmail.trim()||!user) return;
    const newMem={id:uid(),name:newMemName.trim(),email:newMemEmail.trim(),role:"member"};
    const updatedMems=[...members,newMem];
    setMembers(updatedMems);
    updateProject(user.uid, project.id, {members:updatedMems});
    setNewMemName("");setNewMemEmail("");setShowNewMem(false);
    showToast(`👤 ${newMemName} adăugat în proiect`,T.green);
  };

  const filteredMembers=mentionQ!==null?members.filter(m=>m.name.toLowerCase().includes(mentionQ.toLowerCase())).slice(0,5):[];
  const ChanIcon=CHANNELS.find(c=>c.id===channel)?.Icon||Hash;
  const chanLabel=CHANNELS.find(c=>c.id===channel)?.label||channel;

  const inp={background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:7,padding:"7px 10px",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit"};

  return(
    <div style={{display:"flex",height:"calc(100vh - 260px)",minHeight:480,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",background:T.panel}}>

      {/* Channel sidebar */}
      <div style={{width:176,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"12px 12px 8px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:T.textDim,textTransform:"uppercase",letterSpacing:.9}}>Canale</div>
        </div>
        <div style={{flex:1,padding:"6px"}}>
          {CHANNELS.map(ch=>{
            const unread=0;
            return(
              <button key={ch.id} onClick={()=>setChannel(ch.id)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"7px 10px",borderRadius:7,
                  background:channel===ch.id?`${T.accent}14`:"transparent",
                  color:channel===ch.id?T.text:T.textMd,
                  border:`1px solid ${channel===ch.id?T.accent+"33":"transparent"}`,
                  cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:channel===ch.id?600:400,
                  textAlign:"left",transition:"all .12s",justifyContent:"space-between"}}
                onMouseEnter={e=>{if(channel!==ch.id)e.currentTarget.style.background=T.panelHov}}
                onMouseLeave={e=>{if(channel!==ch.id)e.currentTarget.style.background="transparent"}}>
                <span style={{display:"flex",alignItems:"center",gap:7}}><ch.Icon size={12}/>{ch.label}</span>
                {unread>0&&<span style={{width:6,height:6,borderRadius:"50%",background:T.accent,flexShrink:0}}/>}
              </button>
            );
          })}
        </div>
        {/* Members toggle */}
        <div style={{padding:"6px",borderTop:`1px solid ${T.border}`}}>
          <button onClick={()=>setShowMems(s=>!s)}
            style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"7px 10px",borderRadius:7,
              background:showMems?T.accentBg:"transparent",color:showMems?T.accentLt:T.textMd,
              border:`1px solid ${showMems?T.accent+"33":"transparent"}`,
              cursor:"pointer",fontFamily:"inherit",fontSize:12,justifyContent:"space-between"}}>
            <span style={{display:"flex",alignItems:"center",gap:6}}><Users size={12}/>Membrii</span>
            <span style={{fontSize:10,color:T.textDim,background:T.border,borderRadius:8,padding:"1px 5px"}}>{members.length}</span>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        {showMems?(
          /* Members panel */
          <div style={{flex:1,overflowY:"auto"}}>
            {/* header */}
            <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <Users size={13} color={T.textMd}/>
                <span style={{fontSize:13,fontWeight:700,color:T.text}}>Membrii proiectului</span>
                <span style={{fontSize:10,color:T.textDim,background:T.border,borderRadius:10,padding:"1px 6px"}}>{members.length}</span>
              </div>
              <button onClick={()=>setShowNewMem(s=>!s)}
                style={{display:"flex",alignItems:"center",gap:4,background:T.accentBg,border:`1px solid ${T.accent}44`,color:T.accentLt,borderRadius:6,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
                <UserPlus size={11}/>Adaugă
              </button>
            </div>
            {showNewMem&&(
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,background:T.bg}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <input value={newMemName} onChange={e=>setNewMemName(e.target.value)} placeholder="Nume complet" style={{flex:1,minWidth:120,...inp,boxSizing:"border-box"}}/>
                  <input type="email" value={newMemEmail} onChange={e=>setNewMemEmail(e.target.value)} placeholder="Email" style={{flex:2,minWidth:160,...inp,boxSizing:"border-box"}} onKeyDown={e=>e.key==="Enter"&&addMember()}/>
                  <button onClick={addMember} style={{background:T.accent,border:"none",borderRadius:7,padding:"7px 14px",color:"#fff",fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Adaugă</button>
                  <button onClick={()=>setShowNewMem(false)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",color:T.textDim,cursor:"pointer",display:"flex"}}><X size={13}/></button>
                </div>
                <div style={{fontSize:10,color:T.textDim,marginTop:5}}>Membrul va primi email când este @menționat în chat.</div>
              </div>
            )}
            <div style={{padding:"8px"}}>
              {members.map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.panelHov}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Avatar name={m.name} email={m.email} size={36}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.text}}>{m.name}</div>
                    <div style={{fontSize:10,color:T.textDim}}>{m.email}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {m.role==="owner"&&<Chip label="Owner" color={T.amber} T={T}/>}
                    <div style={{display:"flex",gap:-4}}>
                      {/* Avatar color preview */}
                      <div style={{width:10,height:10,borderRadius:"50%",background:avatarColor(m.email)}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ):(
          <>
            {/* Channel header */}
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8,background:T.sidebar,flexShrink:0}}>
              <ChanIcon size={13} color={T.textMd}/>
              <span style={{fontSize:13,fontWeight:700,color:T.text}}>{chanLabel}</span>
              <span style={{fontSize:11,color:T.textDim,marginLeft:2}}>— {project.name}</span>
              {/* Member avatars in header */}
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center"}}>
                {members.slice(0,4).map((m,i)=>(
                  <Avatar key={m.id} name={m.name} email={m.email} size={22}
                    style={{marginLeft:i===0?0:-6,border:`2px solid ${T.sidebar}`,zIndex:4-i}}/>
                ))}
                {members.length>4&&<span style={{fontSize:10,color:T.textDim,marginLeft:4}}>+{members.length-4}</span>}
              </div>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"12px 16px"}}>
              {messages.length===0&&(
                <div style={{textAlign:"center",padding:"40px 0",color:T.textDim}}>
                  <MessageSquare size={26} color={T.borderLt} style={{display:"block",margin:"0 auto 10px"}}/>
                  <div style={{fontSize:13,marginBottom:3}}>Niciun mesaj în #{chanLabel}</div>
                  <div style={{fontSize:11}}>Fii primul care scrie ceva</div>
                </div>
              )}
              {messages.map((msg,i)=>{
                const member=members.find(m=>m.id===msg.uid);
                const name=member?.name||msg.displayName||"?";
                const email=member?.email||"";
                const isMine=msg.uid===currentUser.id;
                const [showDel,setShowDel]=useState(false);
                return(
                  <div key={msg.id} style={{display:"flex",gap:10,padding:"5px 0",position:"relative",alignItems:"flex-start"}}
                    onMouseEnter={()=>setShowDel(true)} onMouseLeave={()=>setShowDel(false)}>
                    <Avatar name={name} email={email} size={30}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.text}}>{name}</span>
                        <span style={{fontSize:10,color:T.textDim}}>{fmtT(msg.ts)}</span>
                        {isMine&&<Chip label="tu" color={T.textDim} T={T}/>}
                      </div>
                      {msg.text&&(
                        <div style={{fontSize:13,color:T.textMd,lineHeight:1.55,wordBreak:"break-word"}}>
                          <MsgText text={msg.text} T={T}/>
                        </div>
                      )}
                      {(msg.attachments||[]).map(att=>(
                        <div key={att.id} style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:5,background:T.panelHov,border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 10px",maxWidth:300}}>
                          {att.external?<Link2 size={12} color={T.textMd}/>:<FileText size={12} color={T.textMd}/>}
                          <a href={att.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:T.blue,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{att.name}</a>
                          {att.external&&<Chip label="link" color={T.amber} T={T}/>}
                          <ExternalLink size={10} color={T.textDim}/>
                        </div>
                      ))}
                    </div>
                    {isMine&&showDel&&(
                      <button onClick={()=>deleteMsg(msg.id)}
                        style={{position:"absolute",right:0,top:4,background:T.redBg,border:`1px solid ${T.red}44`,borderRadius:5,padding:"3px 7px",cursor:"pointer",display:"flex",alignItems:"center",gap:3,color:T.red,fontSize:10,fontFamily:"inherit"}}>
                        <Trash2 size={10}/>Șterge
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Pending attachments */}
            {pendingAtt.length>0&&(
              <div style={{padding:"6px 16px",borderTop:`1px solid ${T.border}`,display:"flex",gap:6,flexWrap:"wrap",background:T.panelHov}}>
                {pendingAtt.map(att=>(
                  <div key={att.id} style={{display:"inline-flex",alignItems:"center",gap:5,background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",fontSize:11,color:T.textMd}}>
                    {att.external?<Link2 size={11}/>:<FileText size={11}/>}
                    <span style={{maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{att.name}</span>
                    <button onClick={()=>setPendingAtt(a=>a.filter(x=>x.id!==att.id))} style={{background:"transparent",border:"none",color:T.textDim,cursor:"pointer",padding:0,display:"flex"}}><X size={11}/></button>
                  </div>
                ))}
              </div>
            )}

            {/* Link form */}
            {showLink&&(
              <div style={{padding:"8px 16px",borderTop:`1px solid ${T.border}`,background:T.bg,display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-end"}}>
                <div style={{flex:2,minWidth:180}}>
                  <div style={{fontSize:9,color:T.textDim,marginBottom:3,textTransform:"uppercase",letterSpacing:.6}}>URL (Drive / Dropbox)</div>
                  <input value={extUrl} onChange={e=>setExtUrl(e.target.value)} placeholder="https://drive.google.com/…" style={{...inp,width:"100%",boxSizing:"border-box"}}/>
                </div>
                <div style={{flex:1,minWidth:110}}>
                  <div style={{fontSize:9,color:T.textDim,marginBottom:3,textTransform:"uppercase",letterSpacing:.6}}>Denumire</div>
                  <input value={extName} onChange={e=>setExtName(e.target.value)} placeholder="Document…" style={{...inp,width:"100%",boxSizing:"border-box"}}/>
                </div>
                <button onClick={addExtLink} style={{background:T.accent,border:"none",borderRadius:7,padding:"7px 14px",color:"#fff",fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:"inherit",flexShrink:0}}>Adaugă</button>
                <button onClick={()=>setShowLink(false)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",color:T.textDim,cursor:"pointer",display:"flex",flexShrink:0}}><X size={13}/></button>
              </div>
            )}

            {/* Input */}
            <div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`,flexShrink:0,position:"relative"}}>
              {/* @mention dropdown */}
              {mentionQ!==null&&filteredMembers.length>0&&(
                <div style={{position:"absolute",bottom:"100%",left:16,right:16,background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:9,padding:4,marginBottom:4,boxShadow:T.shadowLg,zIndex:50}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.textDim,textTransform:"uppercase",letterSpacing:.8,padding:"4px 8px 6px"}}>Menționează</div>
                  {filteredMembers.map(m=>(
                    <div key={m.id} onClick={()=>selectMention(m)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:7,cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.panelHov}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <Avatar name={m.name} email={m.email} size={24}/>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:T.text}}>{m.name}</div>
                        <div style={{fontSize:10,color:T.textDim}}>{m.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{display:"flex",alignItems:"flex-end",gap:8,background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:9,padding:"8px 10px"}}>
                {/* Action buttons */}
                <div style={{display:"flex",gap:2,alignSelf:"flex-end",paddingBottom:1}}>
                  <button onClick={()=>{ setPendingAtt(a=>[...a,{id:uid(),name:`Fisier_demo_${uid()}.pdf`,url:"#"}]); showToast("📎 Fișier atașat (demo)",T.textMd); }}
                    title="Upload fișier" style={{background:"transparent",border:"none",color:T.textMd,cursor:"pointer",padding:"3px",borderRadius:5,display:"flex"}}>
                    <Paperclip size={15}/>
                  </button>
                  <button onClick={()=>setShowLink(s=>!s)} title="Link Drive/Dropbox"
                    style={{background:"transparent",border:"none",color:showLink?T.accent:T.textMd,cursor:"pointer",padding:"3px",borderRadius:5,display:"flex"}}>
                    <Link2 size={15}/>
                  </button>
                  <button onClick={()=>{setText(t=>t+"@");setTimeout(()=>inputRef.current?.focus(),0);}} title="Menționează"
                    style={{background:"transparent",border:"none",color:T.textMd,cursor:"pointer",padding:"3px",borderRadius:5,display:"flex"}}>
                    <AtSign size={15}/>
                  </button>
                </div>
                <textarea ref={inputRef} value={text} onChange={handleTextChange}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&mentionQ===null){e.preventDefault();handleSend();}}}
                  placeholder={`Scrie în #${chanLabel}… Enter trimite · @ menționează`}
                  rows={1} style={{flex:1,background:"transparent",border:"none",color:T.text,fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5,maxHeight:100,overflowY:"auto"}}
                  onInput={e=>{e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px";}}/>
                <button onClick={handleSend} disabled={!text.trim()&&!pendingAtt.length}
                  style={{background:(text.trim()||pendingAtt.length)?T.accent:T.border,border:"none",borderRadius:7,padding:"6px 10px",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",flexShrink:0,transition:"background .15s"}}>
                  <Send size={14}/>
                </button>
              </div>
              <div style={{fontSize:10,color:T.textDim,marginTop:4,paddingLeft:2}}>Enter = trimite · Shift+Enter = linie nouă · @ = menționează · notificare email automată</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── PHASES VIEW ────────────────────────────────────────────────────────────── */
const PhasesView=({project,onUpdate,T})=>{
  const [openPh,setOpenPh]=useState(null);
  const [addingLink,setAddingLink]=useState(null);
  const [linkUrl,setLinkUrl]=useState('');
  const [linkName,setLinkName]=useState('');
  const cols="12px 1fr 76px 76px 130px 62px 44px";
  return(
    <div style={{border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:cols,gap:8,padding:"8px 16px",background:T.sidebar,borderBottom:`1px solid ${T.border}`}}>
        {["","Fază","Start","Termen","Status","Avans","Zile"].map(h=><div key={h} style={{fontSize:10,fontWeight:600,color:T.textDim,textTransform:"uppercase",letterSpacing:.7}}>{h}</div>)}
      </div>
      {project.phases.map((ph,i)=>{
        const dl=diffD(TODAY,ph.endDate),ov=dl<0&&ph.status!=="approved";
        const c=GC[ph.group]||T.accent;
        const pv={approved:100,submitted:75,in_progress:40,pending:0}[ph.status]||0;
        const isOpen=openPh===ph.phaseId;
        return(
          <div key={ph.phaseId}>
            <div onClick={()=>setOpenPh(isOpen?null:ph.phaseId)}
              style={{display:"grid",gridTemplateColumns:cols,gap:8,alignItems:"center",padding:"9px 16px",borderBottom:`1px solid ${T.border}`,cursor:"pointer",background:ov?`${T.red}06`:"transparent",transition:"background .12s"}}
              onMouseEnter={e=>e.currentTarget.style.background=ov?`${T.red}0c`:T.panelHov}
              onMouseLeave={e=>e.currentTarget.style.background=ov?`${T.red}06`:"transparent"}>
              <div style={{width:8,height:8,borderRadius:"50%",background:STATUS_META[ph.status]?.color||T.textDim,flexShrink:0}}/>
              <div>
                <div style={{fontSize:12,color:T.text,fontWeight:500}}>{ph.name}</div>
                {ov&&<div style={{display:"flex",alignItems:"center",gap:3,marginTop:2}}><AlertTriangle size={10} color={T.red}/><span style={{fontSize:10,color:T.red}}>{-dl}z întârziat</span></div>}
              </div>
              <span style={{fontSize:11,color:T.textDim}}>{fmtS(ph.startDate)}</span>
              <span style={{fontSize:11,color:ov?T.red:dl<7?T.amber:T.textDim}}>{fmtS(ph.endDate)}</span>
              <div style={{display:"flex",alignItems:"center",gap:5}} onClick={e=>e.stopPropagation()}>
                <StatusDot status={ph.status}/>
                <select value={ph.status} onChange={e=>onUpdate(ph.phaseId,{status:e.target.value})}
                  style={{background:"transparent",border:"none",color:STATUS_META[ph.status]?.color||T.text,fontSize:11,fontWeight:500,cursor:"pointer",outline:"none",fontFamily:"inherit"}}>
                  {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k} style={{background:T.panel,color:v.color}}>{v.label}</option>)}
                </select>
              </div>
              <MiniProg val={pv} color={c} T={T}/>
              <div style={{fontSize:11,fontWeight:600,textAlign:"right",color:ph.status==="approved"?T.green:ov?T.red:dl<7?T.amber:T.textDim}}>
                {ph.status==="approved"?<CheckCircle size={12} color={T.green}/>:`${dl}z`}
              </div>
            </div>
            {isOpen&&(
              <div style={{padding:"10px 36px 14px",borderBottom:`1px solid ${T.border}`,background:T.panelHov}}>
                <div style={{fontSize:10,fontWeight:600,color:T.textDim,textTransform:"uppercase",letterSpacing:.7,marginBottom:7,display:"flex",alignItems:"center",gap:5}}><Link2 size={11}/>Documente (linkuri cloud)</div>
                {(ph.attachments||[]).map(att=>(
                  <div key={att.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",background:T.bg,borderRadius:6,border:`1px solid ${T.border}`,marginBottom:4}}>
                    <FileText size={12} color={T.textMd}/>
                    <a href={att.url} target="_blank" rel="noreferrer" style={{flex:1,fontSize:11,color:T.blue,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{att.name||att.url}</a>
                    <button onClick={()=>onUpdate(ph.phaseId,{attachments:(ph.attachments||[]).filter(a=>a.id!==att.id)})}
                      style={{background:"transparent",border:"none",color:T.textDim,cursor:"pointer",padding:2,display:"flex",alignItems:"center",flexShrink:0}}>
                      <X size={12}/>
                    </button>
                  </div>
                ))}
                {addingLink===ph.phaseId?(
                  <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:6}}>
                    <input value={linkName} onChange={e=>setLinkName(e.target.value)} placeholder="Nume document (ex: Plan parter v2)"
                      style={{background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:6,padding:"5px 9px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
                    <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="Link Google Drive / Dropbox / OneDrive…"
                      style={{background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:6,padding:"5px 9px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{
                        if(!linkUrl.trim()) return
                        onUpdate(ph.phaseId,{attachments:[...(ph.attachments||[]),{id:uid(),name:linkName.trim()||linkUrl,url:linkUrl.trim(),addedAt:TODAY}]})
                        setLinkUrl('');setLinkName('');setAddingLink(null)
                      }} style={{background:T.accent,border:"none",borderRadius:6,padding:"5px 12px",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Salvează</button>
                      <button onClick={()=>{setAddingLink(null);setLinkUrl('');setLinkName('');}}
                        style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",color:T.textMd,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Anulează</button>
                    </div>
                  </div>
                ):(
                  <button onClick={()=>setAddingLink(ph.phaseId)}
                    style={{display:"inline-flex",alignItems:"center",gap:5,background:T.accentBg,border:`1px solid ${T.accent}44`,color:T.accentLt,borderRadius:7,padding:"5px 11px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
                    <Plus size={11}/>Adaugă link document
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── AVIZE VIEW ─────────────────────────────────────────────────────────────── */
const AvizeView=({project,onUpdate,T})=>{
  const [open,setOpen]=useState(null);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {project.avize.map(av=>{
        const inst=INST.find(i=>i.id===av.instId);if(!inst)return null;
        const ds=av.steps.filter(s=>s.status==="approved").length;
        const pv=Math.round(ds/av.steps.length*100);
        const isOpen=open===av.avizId;
        return(
          <div key={av.avizId} style={{border:`1px solid ${isOpen?inst.color+"44":T.border}`,borderRadius:10,overflow:"hidden",background:T.panel,transition:"border-color .2s"}}>
            <div onClick={()=>setOpen(isOpen?null:av.avizId)}
              style={{display:"grid",gridTemplateColumns:"36px 1fr 130px 100px 110px 28px",gap:8,alignItems:"center",padding:"11px 16px",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.panelHov}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:32,height:32,borderRadius:8,background:`${inst.color}18`,border:`1px solid ${inst.color}30`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <inst.Icon size={16} color={inst.color}/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.text}}>{inst.name}</div>
                <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                  {av.dosarNr&&<Chip label={`Nr. ${av.dosarNr}`} color={T.blue} T={T}/>}
                  {(av.attachments||[]).length>0&&<Chip label={`${av.attachments.length} fișier${av.attachments.length>1?"e":""}`} color={T.green} T={T}/>}
                </div>
              </div>
              <MiniProg val={pv} color={inst.color} w={70} T={T}/>
              <span style={{fontSize:11,color:T.textDim}}>{ds}/{av.steps.length} pași</span>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <StatusDot status={av.status}/>
                <span style={{fontSize:11,color:STATUS_META[av.status]?.color,fontWeight:500}}>{STATUS_META[av.status]?.label}</span>
              </div>
              {isOpen?<ChevronDown size={14} color={T.textDim}/>:<ChevronRight size={14} color={T.textDim}/>}
            </div>
            {isOpen&&(
              <div style={{borderTop:`1px solid ${T.border}`,padding:"12px 16px 14px"}}>
                {/* Emission & expiry dates */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12,padding:'10px 0 12px',borderBottom:`1px solid ${T.border}`}}>
                  <div>
                    <div style={{fontSize:9,fontWeight:700,color:T.textDim,textTransform:'uppercase',letterSpacing:.7,marginBottom:5}}>Dată emitere</div>
                    <input type="date" value={av.emissionDate||''} onChange={e=>{
                      const ed=e.target.value
                      onUpdate(av.avizId,{emissionDate:ed, expiryDate:av.expiryDate||''})
                    }} style={{width:'100%',background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:6,padding:'5px 8px',color:T.text,fontSize:11,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <div style={{fontSize:9,fontWeight:700,color:T.textDim,textTransform:'uppercase',letterSpacing:.7,marginBottom:5}}>
                      Dată expirare
                      {av.expiryDate&&diffD(TODAY,av.expiryDate)<=20&&diffD(TODAY,av.expiryDate)>=0&&(
                        <span style={{marginLeft:6,color:T.red,fontWeight:700}}>⚠ {diffD(TODAY,av.expiryDate)}z</span>
                      )}
                    </div>
                    <div style={{display:'flex',gap:4,alignItems:'center'}}>
                      <input type="date" value={av.expiryDate||''} onChange={e=>onUpdate(av.avizId,{expiryDate:e.target.value})}
                        style={{flex:1,background:T.bg,border:`1px solid ${av.expiryDate&&diffD(TODAY,av.expiryDate)<=20&&diffD(TODAY,av.expiryDate)>=0?T.red:T.borderLt}`,borderRadius:6,padding:'5px 8px',color:av.expiryDate&&diffD(TODAY,av.expiryDate)<=20&&diffD(TODAY,av.expiryDate)>=0?T.red:T.text,fontSize:11,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
                    </div>
                    {av.emissionDate&&(
                      <div style={{display:'flex',gap:4,marginTop:4}}>
                        {[12,24].map(m=>(
                          <button key={m} onClick={()=>{
                            const base=new Date(av.emissionDate)
                            base.setMonth(base.getMonth()+m)
                            onUpdate(av.avizId,{expiryDate:base.toISOString().slice(0,10)})
                          }} style={{flex:1,background:T.accentBg,border:`1px solid ${T.accent}33`,borderRadius:5,padding:'3px 0',color:T.accentLt,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
                            +{m} luni
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Steps */}
                {av.steps.map((step,si)=>{
                  const dl=step.date?diffD(TODAY,step.date):null;
                  return(
                    <div key={step.stepId} style={{display:"grid",gridTemplateColumns:"20px 1fr 110px 46px",gap:8,alignItems:"center",padding:"7px 0",borderBottom:si<av.steps.length-1?`1px solid ${T.border}`:"none"}}>
                      <div onClick={()=>{
                        const ns=av.steps.map(s=>s.stepId===step.stepId?{...s,status:s.status==="approved"?"pending":"approved"}:s);
                        onUpdate(av.avizId,{steps:ns,status:ns.every(s=>s.status==="approved")?"approved":av.status});
                      }} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${step.status==="approved"?inst.color:T.borderLt}`,background:step.status==="approved"?inst.color:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>
                        {step.status==="approved"&&<CheckCircle size={10} color="#fff"/>}
                      </div>
                      <span style={{fontSize:12,color:step.status==="approved"?T.textDim:T.text,textDecoration:step.status==="approved"?"line-through":"none"}}>{step.name}</span>
                      <span style={{fontSize:10,color:T.textDim}}>{fmt(step.date)}</span>
                      <span style={{fontSize:10,fontWeight:600,textAlign:"right",color:step.status==="approved"?T.green:dl===null?T.textDim:dl<0?T.red:dl<5?T.amber:T.textDim}}>
                        {step.status==="approved"?<CheckCircle size={11} color={T.green}/>:dl===null?"—":`${dl}z`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── TABS ───────────────────────────────────────────────────────────────────── */
const TABS=[
  {id:"faze",     label:"Faze",     I:Layers},
  {id:"avize",    label:"Avize",    I:Building2},
  {id:"gantt",    label:"Timeline", I:BarChart2},
  {id:"chat",     label:"Chat",     I:MessageSquare},
  {id:"contract", label:"Contract", I:FileText},
];

/* ─── CONTRACT VIEW ─────────────────────────────────────────────────────────── */
const ContractView = ({project, onUpdate, T}) => {
  const c = project.contract || {}
  const facturi = project.facturi || []
  const [showAddF, setShowAddF] = useState(false)
  const [newF, setNewF] = useState({nr:'',data:'',suma:'',status:'emisa'})
  const inp = {background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:7,padding:'7px 10px',color:T.text,fontSize:12,outline:'none',fontFamily:'inherit',width:'100%',boxSizing:'border-box'}
  const upd = (field, val) => onUpdate({contract:{...c,[field]:val}})
  const addFactura = () => {
    if(!newF.nr||!newF.suma) return
    onUpdate({facturi:[...facturi,{...newF,id:Math.random().toString(36).slice(2)}]})
    setNewF({nr:'',data:'',suma:'',status:'emisa'})
    setShowAddF(false)
  }
  const delFactura = (id) => onUpdate({facturi:facturi.filter(f=>f.id!==id)})
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      {/* Contract info */}
      <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:11,fontWeight:700,color:T.textMd,textTransform:'uppercase',letterSpacing:.8,marginBottom:16}}>Date contract</div>
        {[['Nr. contract','nr'],['Data contract','dataContract'],['Valoare totală (RON)','valoare'],['Termen plată','termenPlata'],['Observații','obs']].map(([label,field])=>(
          <div key={field} style={{marginBottom:12}}>
            <div style={{fontSize:10,color:T.textDim,marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>{label}</div>
            {field==='obs'
              ? <textarea value={c[field]||''} onChange={e=>upd(field,e.target.value)} rows={3} style={{...inp,resize:'vertical'}}/>
              : <input value={c[field]||''} onChange={e=>upd(field,e.target.value)} style={inp}/>
            }
          </div>
        ))}
      </div>
      {/* Invoices */}
      <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:T.textMd,textTransform:'uppercase',letterSpacing:.8,flex:1}}>Facturi</div>
          <button onClick={()=>setShowAddF(s=>!s)} style={{background:T.accentBg,border:`1px solid ${T.accent}44`,borderRadius:6,padding:'4px 10px',color:T.accent,fontSize:11,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
            <Plus size={11}/>Adaugă
          </button>
        </div>
        {showAddF&&(
          <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:12,marginBottom:12}}>
            {[['Nr. factură','nr'],['Data','data'],['Sumă (RON)','suma']].map(([label,field])=>(
              <div key={field} style={{marginBottom:8}}>
                <div style={{fontSize:9,color:T.textDim,marginBottom:3,textTransform:'uppercase',letterSpacing:.5}}>{label}</div>
                <input value={newF[field]} onChange={e=>setNewF(f=>({...f,[field]:e.target.value}))} style={inp}/>
              </div>
            ))}
            <div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:T.textDim,marginBottom:3,textTransform:'uppercase',letterSpacing:.5}}>Status</div>
              <select value={newF.status} onChange={e=>setNewF(f=>({...f,status:e.target.value}))} style={inp}>
                <option value="emisa">Emisă</option>
                <option value="incasata">Încasată</option>
                <option value="restanta">Restantă</option>
              </select>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={addFactura} style={{flex:1,background:T.accent,border:'none',borderRadius:6,padding:'6px',color:'#fff',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Salvează</button>
              <button onClick={()=>setShowAddF(false)} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,padding:'6px 10px',color:T.textMd,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Anulează</button>
            </div>
          </div>
        )}
        {facturi.length===0&&!showAddF&&<div style={{fontSize:12,color:T.textDim,textAlign:'center',padding:'20px 0'}}>Nicio factură adăugată</div>}
        {facturi.map(f=>(
          <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text}}>Factura #{f.nr}</div>
              <div style={{fontSize:10,color:T.textDim}}>{f.data} · {f.suma} RON</div>
            </div>
            <div style={{fontSize:10,fontWeight:600,color:f.status==='incasata'?T.green:f.status==='restanta'?T.red:T.amber,background:f.status==='incasata'?T.greenBg:f.status==='restanta'?T.redBg:T.amberBg,borderRadius:4,padding:'2px 7px'}}>
              {f.status==='incasata'?'Încasată':f.status==='restanta'?'Restantă':'Emisă'}
            </div>
            <button onClick={()=>delFactura(f.id)} style={{background:'transparent',border:'none',color:T.textDim,cursor:'pointer',padding:2,display:'flex',alignItems:'center'}}>
              <Trash2 size={12}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── CALENDAR ──────────────────────────────────────────────────────────────── */
const CalendarWidget = ({projects, T, month, onPrev, onNext, notes=[], onAddNote, onDeleteNote}) => {
  const year  = month.getFullYear()
  const mon   = month.getMonth()
  const first = new Date(year, mon, 1).getDay()
  const days  = new Date(year, mon+1, 0).getDate()
  const start = first === 0 ? 6 : first - 1

  const events = {}
  const addEv = (dateStr, label, color, projName, type='event') => {
    if(!dateStr) return
    const d = dateStr.slice(8,10).replace(/^0/,'')
    const m = parseInt(dateStr.slice(5,7))-1
    const y = parseInt(dateStr.slice(0,4))
    if(y===year && m===mon) {
      if(!events[d]) events[d]=[]
      events[d].push({label, color, projName, type})
    }
  }
  projects.forEach(p=>{
    (p.phases||[]).forEach(ph=>{
      if(ph.status!=='approved') addEv(ph.endDate, ph.name, '#d29922', p.name)
    });
    (p.avize||[]).forEach(av=>{
      if(av.status!=='approved')(av.steps||[]).forEach(s=>{
        if(s.status!=='approved') addEv(s.date, `Aviz`, '#58a6ff', p.name)
      })
      if(av.expiryDate) addEv(av.expiryDate, `Exp. aviz`, '#f85149', p.name)
    })
  })
  notes.forEach(n=>{
    if(!n.date) return
    const d = n.date.slice(8,10).replace(/^0/,'')
    const m = parseInt(n.date.slice(5,7))-1
    const y = parseInt(n.date.slice(0,4))
    if(y===year && m===mon) {
      if(!events[d]) events[d]=[]
      events[d].push({label:n.text, color:'#bc8cff', projName:'Notă', type:'note', noteId:n.id})
    }
  })

  const todayD  = new Date().getDate()
  const todayM  = new Date().getMonth()
  const todayY  = new Date().getFullYear()
  const isToday = (d) => d==todayD && mon==todayM && year==todayY

  const mNames = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
  const dNames = ['Lu','Ma','Mi','Jo','Vi','Sâ','Du']

  const [selDay, setSelDay] = useState(null)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const selDateStr = selDay ? `${year}-${String(mon+1).padStart(2,'0')}-${String(selDay).padStart(2,'0')}` : null
  const selEvs = selDay ? (events[String(selDay)]||[]) : []

  return (
    <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
      <div style={{display:'flex',alignItems:'center',marginBottom:12}}>
        <button onClick={onPrev} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:T.textMd,flexShrink:0}}>‹</button>
        <div style={{flex:1,textAlign:'center',fontSize:13,fontWeight:700,color:T.text}}>{mNames[mon]} {year}</div>
        <button onClick={onNext} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:T.textMd,flexShrink:0}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
        {dNames.map(d=><div key={d} style={{textAlign:'center',fontSize:9,fontWeight:700,color:T.textDim,textTransform:'uppercase',padding:'4px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
        {Array.from({length:start}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:days}).map((_,i)=>{
          const d = i+1
          const evs = events[String(d)]||[]
          const today = isToday(d)
          const sel = selDay===d
          return (
            <div key={d} onClick={()=>{setSelDay(sel?null:d);setAddingNote(false);setNewNote('');}}
              style={{borderRadius:6,padding:'4px 2px',minHeight:36,cursor:'pointer',background:today?`${T.accent}18`:sel?T.panelHov:'transparent',border:`1px solid ${today?T.accent:sel?T.borderLt:'transparent'}`,position:'relative'}}>
              <div style={{textAlign:'center',fontSize:11,fontWeight:today?700:400,color:today?T.accent:T.text,marginBottom:2}}>{d}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:1,justifyContent:'center'}}>
                {evs.slice(0,3).map((ev,j)=>(
                  <div key={j} style={{width:5,height:5,borderRadius:'50%',background:ev.color}}/>
                ))}
                {evs.length>3&&<div style={{width:5,height:5,borderRadius:'50%',background:T.textDim}}/>}
              </div>
            </div>
          )
        })}
      </div>
      {selDay && (
        <div style={{marginTop:12,background:T.bg,borderRadius:8,padding:10,border:`1px solid ${T.border}`}}>
          <div style={{display:'flex',alignItems:'center',marginBottom:6}}>
            <div style={{fontSize:10,fontWeight:700,color:T.textDim,textTransform:'uppercase',letterSpacing:.6,flex:1}}>{selDay} {mNames[mon]}</div>
            {onAddNote&&<button onClick={()=>setAddingNote(s=>!s)}
              style={{background:addingNote?T.accentBg:'transparent',border:`1px solid ${addingNote?T.accent:T.border}`,borderRadius:5,padding:'2px 8px',color:addingNote?T.accent:T.textDim,fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>
              + Notă
            </button>}
          </div>
          {addingNote&&(
            <div style={{display:'flex',gap:5,marginBottom:8}}>
              <input value={newNote} onChange={e=>setNewNote(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&newNote.trim()){onAddNote(selDateStr,newNote.trim());setNewNote('');setAddingNote(false);}}}
                placeholder="Adaugă notă sau reminder…"
                autoFocus
                style={{flex:1,background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:6,padding:'5px 8px',color:T.text,fontSize:11,outline:'none',fontFamily:'inherit'}}/>
              <button onClick={()=>{if(newNote.trim()){onAddNote(selDateStr,newNote.trim());setNewNote('');setAddingNote(false);}}}
                style={{background:T.accent,border:'none',borderRadius:6,padding:'5px 10px',color:'#fff',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Sal.</button>
            </div>
          )}
          {selEvs.length===0&&!addingNote&&<div style={{fontSize:11,color:T.textDim}}>Niciun eveniment. Adaugă o notă.</div>}
          {selEvs.map((ev,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'4px 0',borderBottom:i<selEvs.length-1?`1px solid ${T.border}`:'none'}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:ev.color,flexShrink:0}}/>
              <div style={{fontSize:11,color:T.text,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.label}</div>
              {ev.type!=='note'&&<div style={{fontSize:10,color:T.textDim,flexShrink:0}}>{ev.projName}</div>}
              {ev.type==='note'&&onDeleteNote&&(
                <button onClick={()=>onDeleteNote(ev.noteId)}
                  style={{background:'transparent',border:'none',color:T.textDim,cursor:'pointer',padding:0,display:'flex',alignItems:'center',flexShrink:0}}>
                  <X size={11}/>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── MAIN APP ───────────────────────────────────────────────────────────────── */
export default function App(){
  const { user, loading, logout } = useAuth();
  const [accessStatus, setAccessStatus] = useState('approved')
  const [pendingRequests, setPendingRequests] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const [themeMode,setThemeMode]=useState("dark");
  const sysDark=window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const T=themeMode==="dark"||(themeMode==="auto"&&sysDark)?DARK:LIGHT;

  const CURRENT_USER = user ? {
    id: user.uid,
    name: user.displayName || user.email.split('@')[0],
    email: user.email,
    role: 'owner',
  } : null;

  const [projects,setProjects]=useState([]);
  const [selId,setSelId]=useState(null);
  const [tab,setTab]=useState("faze");
  const [showRem,setShowRem]=useState(false);
  const [search,setSearch]=useState("");
  const [coll,setColl]=useState(false);
  const [toast,setToast]=useState(null);
  const [uMenu,setUMenu]=useState(false);
  const [showNewProj,setShowNewProj]=useState(false);
  const [newProjName,setNewProjName]=useState("");
  const [newProjClient,setNewProjClient]=useState("");
  const [newProjLoc,setNewProjLoc]=useState("");
  const [newProjStart,setNewProjStart]=useState(TODAY);
  const [newProjType,setNewProjType]=useState('arhitectura');
  const [navSection, setNavSection] = useState('toate')
  const [showEditProj, setShowEditProj] = useState(false)
  const [editProjData, setEditProjData] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareTargetProj, setShareTargetProj] = useState(null)
  const [shareConfig, setShareConfig] = useState({faze:true,avize:true,gantt:false})
  const [shareToken, setShareToken] = useState(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetProj, setDeleteTargetProj] = useState(null)
  const [projMenuId, setProjMenuId] = useState(null)
  const [calMonth, setCalMonth] = useState(()=>new Date())
  const [notes, setNotes] = useState([])
  const ganttRef = useRef(null)

  useEffect(()=>{
    if(!user) return;
    const unsub=listenProjects(user.uid, setProjects);
    return unsub;
  },[user]);

  useEffect(()=>{
    if(!user) return;
    const unsub=listenNotes(user.uid, setNotes);
    return unsub;
  },[user]);

  useEffect(()=>{
    if(!user) { setAccessStatus('checking'); return; }
    checkAccess(user.email).then(async status => {
      if(status === 'first_user') {
        try { await initAccessControl(user.email) } catch(e) { console.error('initAccessControl:', e) }
        setAccessStatus('approved')
      } else if(status === 'approved') {
        setAccessStatus('approved')
      } else {
        // Auto-submit access request so owner is notified immediately
        requestAccess(user.email, user.displayName||user.email.split('@')[0]).catch(()=>{})
        setAccessStatus('not_approved')
      }
    }).catch(err => {
      console.error('checkAccess error:', err)
      setAccessStatus('approved')
    })
  },[user])

  useEffect(()=>{
    if(accessStatus !== 'approved' || !user) return
    const unsub = listenPendingRequests(setPendingRequests)
    return unsub
  },[accessStatus, user])

  useEffect(()=>{
    const close = ()=>{ setProjMenuId(null); setUMenu(false); }
    document.addEventListener('click', close)
    return ()=>document.removeEventListener('click', close)
  },[])

  const showToast=useCallback((msg,c)=>{setToast({msg,c:c||T.green});setTimeout(()=>setToast(null),3500);},[T]);

  const sel=projects.find(p=>p.id===selId);
  const filt=projects.filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())||(p.client||"").toLowerCase().includes(search.toLowerCase()));
  const alerts=projects.flatMap(p=>(p.phases||[]).filter(ph=>ph.status!=="approved"&&ph.status!=="rejected"&&diffD(TODAY,ph.endDate)>=0&&diffD(TODAY,ph.endDate)<=7).map(ph=>({pn:p.name,ph:ph.name,d:diffD(TODAY,ph.endDate)})));

  const updPhase=(projId,phId,data)=>{
    const proj=projects.find(p=>p.id===projId);
    if(!proj||!user) return;
    const newPhases=(proj.phases||[]).map(ph=>ph.phaseId!==phId?ph:{...ph,...data});
    setProjects(ps=>ps.map(p=>p.id!==projId?p:{...p,phases:newPhases}));
    updateProject(user.uid,projId,{phases:newPhases});
  };
  const updAviz=(projId,avId,data)=>{
    const proj=projects.find(p=>p.id===projId);
    if(!proj||!user) return;
    const newAvize=(proj.avize||[]).map(av=>av.avizId!==avId?av:{...av,...data});
    setProjects(ps=>ps.map(p=>p.id!==projId?p:{...p,avize:newAvize}));
    updateProject(user.uid,projId,{avize:newAvize});
  };

  const handleNewProject=async()=>{
    if(!newProjName.trim()||!user) return;
    const start=newProjStart||TODAY;
    const projName=newProjName.trim();
    const newProj={
      name:projName,
      client:newProjClient.trim(),
      location:newProjLoc.trim(),
      startDate:start,
      type:newProjType,
      phases:mkPhases(start,Array(10).fill("pending")),
      avize:mkAvize(start),
      members:[{id:user.uid,name:CURRENT_USER.name,email:CURRENT_USER.email,role:"owner"}],
      acAttachments:[],
    };
    setShowNewProj(false);
    setNewProjName("");setNewProjClient("");setNewProjLoc("");setNewProjStart(TODAY);setNewProjType('arhitectura');
    showToast(`Proiect "${projName}" creat`,T.green);
    try { await createProject(user.uid,newProj) } catch(e) { console.error(e) }
  };

  const handleEditProject = async () => {
    if(!editProjData||!user) return
    setShowEditProj(false)
    showToast('Proiect actualizat', T.green)
    try {
      await updateProject(user.uid, editProjData.id, {
        name: editProjData.name,
        client: editProjData.client,
        location: editProjData.location,
        startDate: editProjData.startDate,
        type: editProjData.type,
      })
    } catch(e) { console.error(e) }
  }

  const handleDeleteProject = async () => {
    if(!deleteTargetProj||!user) return
    await deleteProject(user.uid, deleteTargetProj.id)
    if(selId === deleteTargetProj.id) setSelId(null)
    setShowDeleteConfirm(false)
    setDeleteTargetProj(null)
    showToast('Proiect șters', T.red)
  }

  const handleGenerateShare = () => {
    if(!shareTargetProj) return
    const data = {
      n: shareTargetProj.name,
      c: shareTargetProj.client,
      l: shareTargetProj.location,
      s: shareTargetProj.startDate,
      ph: shareConfig.faze ? shareTargetProj.phases : [],
      av: shareConfig.avize ? shareTargetProj.avize : [],
      cfg: shareConfig,
    }
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
      setShareToken(encoded)
    } catch(e) {
      showToast('Eroare la generarea linkului', T.red)
    }
  }

  const themeIcon=themeMode==="dark"?<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>:themeMode==="light"?<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>:<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>;

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;}
    body{margin:0;font-family:'Geist','Helvetica Neue',sans-serif;}
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:${T.borderLt};border-radius:2px;}
    select option{background:${T.panel};}
    input[type=date]::-webkit-calendar-picker-indicator{filter:${T===DARK?"invert(.4)":"invert(.5)"};cursor:pointer;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    .fade-up{animation:fadeUp .18s ease;}
    .fade-in{animation:fadeIn .15s ease;}
    textarea{scrollbar-width:thin;}
  `;

  const urlShare = new URLSearchParams(window.location.search).get('share')
  if(urlShare) return <SharedView token={urlShare}/>

  if(loading) return(
    <div style={{minHeight:"100vh",background:DARK.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:DARK.textDim,fontSize:13}}>Se încarcă…</div>
    </div>
  );

  if(!user) return <LoginPage T={T} />;

  if(accessStatus === 'not_approved') return (
    <div style={{minHeight:'100vh',background:DARK.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:24}}>
      <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#0969da,#8250df)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:700,color:DARK.text,marginBottom:8}}>Acces în așteptare</div>
        <div style={{fontSize:13,color:DARK.textDim,maxWidth:380,lineHeight:1.6}}>
          Cererea ta de acces a fost trimisă automat proprietarului.<br/>
          Vei putea intra în aplicație după ce ești aprobat.<br/><br/>
          Cont: <strong style={{color:DARK.text}}>{user.email}</strong>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,background:`${DARK.green}14`,border:`1px solid ${DARK.green}44`,borderRadius:8,padding:'10px 18px',fontSize:12,color:DARK.green}}>
        <CheckCircle size={14}/>Cerere trimisă — așteptați aprobarea
      </div>
      <button onClick={logout} style={{background:'transparent',border:`1px solid ${DARK.border}`,borderRadius:8,padding:'8px 18px',color:DARK.textMd,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
        Deconectare
      </button>
    </div>
  );

  return(
    <div style={{fontFamily:"'Geist','Helvetica Neue',sans-serif",background:T.bg,height:"100vh",color:T.text,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{css}</style>

      {/* ── TOP BAR ── */}
      <header style={{height:46,background:T.sidebar,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 16px",gap:10,flexShrink:0,zIndex:20}}>
        <button onClick={()=>{setSelId(null);setShowRem(false);}} style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,background:"none",border:"none",cursor:"pointer",padding:0}}>
          <div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${T.accent}44`}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span style={{fontSize:14,fontWeight:700,color:T.text,letterSpacing:"-.3px"}}>ArchPlan</span>
        </button>
        <div style={{width:1,height:18,background:T.border}}/>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:4,minWidth:0,overflowX:'auto'}}>
          {sel&&!showRem ? (
            <>
              <button onClick={()=>{setSelId(null);setShowRem(false);}} style={{background:"none",border:"none",padding:0,cursor:"pointer",fontSize:12,color:T.textDim,fontFamily:"inherit",flexShrink:0}}>Proiecte</button>
              <ChevronRight size={12} color={T.textDim}/>
              <span style={{fontSize:12,color:T.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.name}</span>
            </>
          ) : showRem ? (
            <>
              <button onClick={()=>{setSelId(null);setShowRem(false);}} style={{background:"none",border:"none",padding:0,cursor:"pointer",fontSize:12,color:T.textDim,fontFamily:"inherit",flexShrink:0}}>Proiecte</button>
              <ChevronRight size={12} color={T.textDim}/>
              <span style={{fontSize:12,color:T.text,fontWeight:500}}>Remindere</span>
            </>
          ) : (
            <div style={{display:'flex',gap:3}}>
              {[
                {id:'toate',    label:'Toate'},
                {id:'arhitectura', label:'Arhitectură', color:'#f85149'},
                {id:'urbanism',    label:'Urbanism',    color:'#3fb950'},
                {id:'avize',       label:'Avize',       color:'#58a6ff'},
                {id:'financiar',   label:'Financiar',   color:'#d29922'},
              ].map(s=>(
                <button key={s.id} onClick={()=>setNavSection(s.id)}
                  style={{background:navSection===s.id?(s.color?`${s.color}18`:T.accentBg):'transparent',
                    border:`1px solid ${navSection===s.id?(s.color||T.accent)+'44':'transparent'}`,
                    borderRadius:6,padding:'4px 10px',
                    color:navSection===s.id?(s.color||T.accent):T.textDim,
                    cursor:'pointer',fontSize:11,fontWeight:navSection===s.id?600:400,
                    fontFamily:'inherit',transition:'all .12s',whiteSpace:'nowrap'}}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {alerts.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:5,background:T.amberBg,border:`1px solid ${T.amber}44`,borderRadius:6,padding:"3px 10px",flexShrink:0}}>
            <AlertTriangle size={11} color={T.amber}/>
            <span style={{fontSize:11,color:T.amber,fontWeight:600}}>{alerts.length} termen{alerts.length>1?"e":""}</span>
          </div>
        )}
        <button onClick={()=>{if(sel){setTab('chat')}else{showToast('Selectează un proiect pentru chat',T.amber)}}}
          style={{display:"flex",alignItems:"center",justifyContent:"center",background:sel&&tab==='chat'?T.accentBg:"transparent",border:`1px solid ${sel&&tab==='chat'?T.accent:T.border}`,borderRadius:7,width:32,height:32,color:sel&&tab==='chat'?T.accent:T.textMd,cursor:"pointer"}}
          title="Chat proiect">
          <MessageSquare size={14}/>
        </button>
        <button onClick={()=>setThemeMode(m=>m==="dark"?"light":m==="light"?"auto":"dark")}
          style={{display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,width:32,height:32,color:T.textMd,cursor:"pointer"}}
          title={`Temă: ${themeMode}`}>{themeIcon}</button>
        <button onClick={()=>setShowNewProj(true)} style={{display:"flex",alignItems:"center",gap:5,background:T.accent,border:"none",borderRadius:7,padding:"6px 13px",color:"#fff",fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
          <Plus size={13}/>Proiect nou
        </button>
        {pendingRequests.length>0&&(
          <button onClick={()=>setShowRequests(true)}
            style={{position:'relative',background:T.amberBg,border:`1px solid ${T.amber}44`,borderRadius:7,padding:'5px 10px',color:T.amber,cursor:'pointer',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:5,fontFamily:'inherit'}}>
            <Users size={12}/>
            {pendingRequests.length} cerere{pendingRequests.length>1?'i':''}
            <span style={{position:'absolute',top:-4,right:-4,width:8,height:8,borderRadius:'50%',background:T.red}}/>
          </button>
        )}
        {/* User avatar */}
        <div style={{position:"relative",flexShrink:0}}>
          <div onClick={e=>{e.stopPropagation();setUMenu(s=>!s);}} style={{cursor:"pointer"}}>
            <Avatar name={CURRENT_USER.name} email={CURRENT_USER.email} size={30}/>
          </div>
          {uMenu&&(
            <div className="fade-up" onClick={e=>e.stopPropagation()} style={{position:"absolute",top:38,right:0,background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:12,padding:0,minWidth:260,boxShadow:T.shadowLg,zIndex:100,overflow:"hidden"}}>
              {/* Header profil */}
              <div style={{padding:"16px 16px 12px",background:`linear-gradient(135deg,${T.accent}18,${T.purple}18)`,borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <Avatar name={CURRENT_USER.name} email={CURRENT_USER.email} size={44}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{CURRENT_USER.name}</div>
                    <div style={{fontSize:11,color:T.textDim,marginTop:2}}>{CURRENT_USER.email}</div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:5,background:`${T.green}18`,border:`1px solid ${T.green}30`,borderRadius:4,padding:"1px 7px"}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:T.green}}/>
                      <span style={{fontSize:10,fontWeight:600,color:T.green}}>Owner · Activ</span>
                    </div>
                  </div>
                </div>
                {/* Statistici rapide */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[
                    {l:"Proiecte",v:projects.length},
                    {l:"Active",v:projects.filter(p=>pctOf(p.phases)<100).length},
                    {l:"Avize",v:projects.reduce((s,p)=>(p.avize||[]).filter(a=>a.status==="approved").length+s,0)},
                  ].map(s=>(
                    <div key={s.l} style={{background:T.bg,borderRadius:7,padding:"7px 8px",textAlign:"center",border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:16,fontWeight:800,color:T.accent}}>{s.v}</div>
                      <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Actiuni */}
              <div style={{padding:6}}>
                <div style={{padding:"7px 12px",fontSize:11,color:T.textDim,display:"flex",alignItems:"center",gap:6}}>
                  <Settings size={11}/>{COMPANY.name}
                </div>
                <button onClick={()=>{setUMenu(false);logout();}} style={{width:"100%",background:"transparent",border:"none",padding:"8px 12px",color:T.red,cursor:"pointer",fontSize:12,textAlign:"left",borderRadius:7,fontFamily:"inherit",display:"flex",alignItems:"center",gap:7}}>
                  <LogOut size={13}/>Deconectare
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* ── SIDEBAR ── */}
        <aside style={{width:coll?48:252,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,transition:"width .2s",overflow:"hidden"}}>
          <div style={{padding:"8px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6}}>
            {!coll&&(
              <div style={{flex:1,display:"flex",alignItems:"center",gap:7,background:T.panel,border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 10px"}}>
                <Search size={12} color={T.textDim}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Caută…"
                  style={{flex:1,background:"transparent",border:"none",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
              </div>
            )}
            <button onClick={()=>setColl(s=>!s)} style={{background:"transparent",border:"none",color:T.textDim,cursor:"pointer",padding:4,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {coll?<PanelLeftOpen size={15}/>:<PanelLeftClose size={15}/>}
            </button>
          </div>
          {!coll&&<div style={{padding:"8px 14px 2px",fontSize:9,fontWeight:700,color:T.textDim,textTransform:"uppercase",letterSpacing:1}}>Proiecte ({filt.length})</div>}
          <div style={{overflowY:"auto",flex:1,paddingBottom:8}}>
            {filt.map(p=>{
              const pc=pctOf(p.phases),next=p.phases.find(ph=>ph.status!=="approved"&&ph.status!=="rejected"),ov=next&&diffD(TODAY,next.endDate)<0;
              const avDone=(p.avize||[]).filter(av=>av.status==="approved").length;
              if(coll) return(
                <div key={p.id} onClick={()=>{setSelId(p.id);setTab("faze");setShowRem(false);}} title={p.name}
                  style={{padding:8,display:"flex",justifyContent:"center",cursor:"pointer",borderRadius:7,margin:"2px 6px",background:selId===p.id&&!showRem?`${T.accent}14`:"transparent"}}>
                  <div style={{width:28,height:28,borderRadius:7,background:T.panel,border:`1px solid ${selId===p.id?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.textMd,fontWeight:700}}>
                    {p.name.slice(0,2).toUpperCase()}
                  </div>
                </div>
              );
              return(
                <div key={p.id} onClick={()=>{setSelId(p.id);setTab("faze");setShowRem(false);}}
                  style={{padding:"10px 12px",borderRadius:8,margin:"1px 6px",cursor:"pointer",background:selId===p.id&&!showRem?`${T.accent}14`:"transparent",borderLeft:`2px solid ${selId===p.id&&!showRem?T.accent:"transparent"}`,transition:"background .12s",position:'relative'}}
                  onMouseEnter={e=>{if(!(selId===p.id&&!showRem))e.currentTarget.style.background=T.panelHov}}
                  onMouseLeave={e=>{e.currentTarget.style.background=selId===p.id&&!showRem?`${T.accent}14`:"transparent"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,alignItems:"center"}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,flex:1,minWidth:0,paddingRight:6}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:projTypeColor(p.type),flexShrink:0}}/>
                      <div style={{fontSize:12,fontWeight:700,color:T.text,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:700,color:ov?T.red:pc===100?T.green:T.textDim,flexShrink:0}}>{pc}%</span>
                    <button onClick={e=>{e.stopPropagation();setProjMenuId(projMenuId===p.id?null:p.id);}}
                      style={{background:'transparent',border:'none',color:T.textDim,cursor:'pointer',padding:2,display:'flex',alignItems:'center',flexShrink:0,borderRadius:4,opacity:.6}}
                      onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.6'}>
                      <MoreVertical size={13}/>
                    </button>
                  </div>
                  {projMenuId===p.id&&(
                    <div style={{position:'absolute',right:8,top:36,background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:8,padding:4,minWidth:160,boxShadow:T.shadowLg,zIndex:200}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>{setEditProjData({...p});setShowEditProj(true);setProjMenuId(null);}}
                        style={{width:'100%',background:'transparent',border:'none',padding:'7px 10px',color:T.text,cursor:'pointer',fontSize:12,textAlign:'left',borderRadius:5,fontFamily:'inherit',display:'flex',alignItems:'center',gap:7}}>
                        <Settings size={12}/>Editează proiect
                      </button>
                      <button onClick={()=>{setShareTargetProj(p);setShareToken(null);setShareConfig({faze:true,avize:true,gantt:false});setShowShareModal(true);setProjMenuId(null);}}
                        style={{width:'100%',background:'transparent',border:'none',padding:'7px 10px',color:T.text,cursor:'pointer',fontSize:12,textAlign:'left',borderRadius:5,fontFamily:'inherit',display:'flex',alignItems:'center',gap:7}}>
                        <Link2 size={12}/>Link share client
                      </button>
                      <button onClick={()=>{setDeleteTargetProj(p);setShowDeleteConfirm(true);setProjMenuId(null);}}
                        style={{width:'100%',background:'transparent',border:'none',padding:'7px 10px',color:T.red,cursor:'pointer',fontSize:12,textAlign:'left',borderRadius:5,fontFamily:'inherit',display:'flex',alignItems:'center',gap:7}}>
                        <Trash2 size={12}/>Șterge proiect
                      </button>
                    </div>
                  )}
                  {p.client&&<div style={{fontSize:10,color:T.textDim,marginBottom:3,display:"flex",alignItems:"center",gap:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><User size={9}/>{p.client}</div>}
                  {/* Member avatars */}
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:5}}>
                    <div style={{display:"flex",alignItems:"center"}}>
                      {(p.members||[]).slice(0,3).map((m,i)=>(
                        <Avatar key={m.id} name={m.name} email={m.email} size={16} style={{marginLeft:i===0?0:-4,border:`1.5px solid ${T.sidebar}`}}/>
                      ))}
                    </div>
                    <span style={{flex:1}}/>
                    <Chip label={`${avDone}/${(p.avize||[]).length}`} color={avDone===(p.avize||[]).length&&p.avize.length>0?T.green:T.blue} T={T}/>
                  </div>
                  <div style={{height:2,background:T.border,borderRadius:1,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pc}%`,background:ov?T.red:pc===100?T.green:T.accent,borderRadius:1,transition:"width .4s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
          {!coll&&<div style={{padding:"8px 14px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6}}>
            <Calendar size={11} color={T.textDim}/><span style={{fontSize:10,color:T.textDim}}>{fmt(TODAY)}</span>
          </div>}
        </aside>

        {/* ── MAIN ── */}
        <main style={{flex:1,overflowY:"auto",background:T.bg,padding:20}} className="fade-in">
          {!sel?(
            /* Dashboard */
            <div className="fade-in">
              <div style={{marginBottom:20}}>
                <div style={{fontSize:21,fontWeight:800,color:T.text,marginBottom:4,letterSpacing:"-.4px"}}>Dashboard</div>
                <div style={{fontSize:13,color:T.textDim}}>Studio Office Kolectiv — {fmt(TODAY)}</div>
              </div>
              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
                {[
                  {l:"Total proiecte", v:projects.length,                                          c:T.accent, I:Layers,       ns:'toate'},
                  {l:"Active",         v:projects.filter(p=>pctOf(p.phases)<100).length,           c:T.amber,  I:Clock,        ns:'active'},
                  {l:"Finalizate",     v:projects.filter(p=>pctOf(p.phases)===100).length,         c:T.green,  I:CheckCircle,  ns:'finalizate'},
                  {l:"Întârziate",     v:projects.filter(p=>(p.phases||[]).some(ph=>ph.status!=='approved'&&ph.status!=='rejected'&&diffD(TODAY,ph.endDate)<0)).length, c:T.red, I:AlertTriangle, ns:'intarziate'},
                ].map(k=>(
                  <div key={k.l} onClick={()=>setNavSection(k.ns)}
                    style={{background:T.panel,border:`1px solid ${navSection===k.ns?k.c:T.border}`,borderRadius:10,padding:"15px 18px",display:"flex",alignItems:"flex-start",gap:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=k.c}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=navSection===k.ns?k.c:T.border}>
                    <div style={{width:36,height:36,borderRadius:9,background:`${k.c}14`,border:`1px solid ${k.c}28`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><k.I size={17} color={k.c}/></div>
                    <div><div style={{fontSize:26,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div><div style={{fontSize:11,color:T.textDim,marginTop:3}}>{k.l}</div></div>
                  </div>
                ))}
              </div>
              {(()=>{
                const dashProjects = navSection==='toate' ? projects
                  : navSection==='arhitectura' ? projects.filter(p=>p.type==='arhitectura')
                  : navSection==='urbanism' ? projects.filter(p=>p.type==='urbanism')
                  : navSection==='active' ? projects.filter(p=>pctOf(p.phases)<100)
                  : navSection==='finalizate' ? projects.filter(p=>pctOf(p.phases)===100)
                  : navSection==='intarziate' ? projects.filter(p=>(p.phases||[]).some(ph=>ph.status!=='approved'&&ph.status!=='rejected'&&diffD(TODAY,ph.endDate)<0))
                  : projects
                return navSection==='avize' ? (
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Toate avizele</div>
                    {projects.flatMap(p=>(p.avize||[]).map(av=>({...av,projName:p.name}))).map((av,i)=>{
                      const inst=INST.find(x=>x.id===av.instId)
                      return (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:T.panel,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:6}}>
                          {inst&&<inst.Icon size={14} color={inst.color}/>}
                          <span style={{flex:1,fontSize:12,color:T.text}}>{inst?.name||av.instId}</span>
                          <span style={{fontSize:11,color:T.textDim}}>{av.projName}</span>
                          <span style={{fontSize:11,fontWeight:600,color:STATUS_META[av.status]?.color||T.textDim}}>{STATUS_META[av.status]?.label}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : navSection==='financiar' ? (
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Situație financiară</div>
                    {projects.map(p=>{
                      const facturi=p.facturi||[]
                      const total=facturi.reduce((s,f)=>s+(parseFloat(f.suma)||0),0)
                      const incasat=facturi.filter(f=>f.status==='incasata').reduce((s,f)=>s+(parseFloat(f.suma)||0),0)
                      return (
                        <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:T.panel,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:600,color:T.text}}>{p.name}</div>
                            <div style={{fontSize:11,color:T.textDim}}>{facturi.length} facturi</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:13,fontWeight:700,color:T.accent}}>{total.toLocaleString()} RON total</div>
                            <div style={{fontSize:11,color:T.green}}>{incasat.toLocaleString()} RON încasat</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (()=>{
                  const grouped = PROJECT_TYPES.map(pt=>({
                    ...pt,
                    items: dashProjects.filter(p=>p.type===pt.id||((!p.type)&&pt.id==='arhitectura'))
                  })).filter(g=>g.items.length>0)
                  if(grouped.length===0) return <div style={{fontSize:12,color:T.textDim,textAlign:'center',padding:'40px 0'}}>Niciun proiect în această categorie</div>
                  return grouped.map(g=>(
                    <div key={g.id} style={{marginBottom:24}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                        <div style={{width:10,height:10,borderRadius:'50%',background:g.color}}/>
                        <span style={{fontSize:12,fontWeight:700,color:g.color,textTransform:'uppercase',letterSpacing:.8}}>{g.label}</span>
                        <span style={{fontSize:11,color:T.textDim}}>({g.items.length})</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                        {g.items.map(p=>{
                          const pc=pctOf(p.phases),next=(p.phases||[]).find(ph=>ph.status!=="approved"&&ph.status!=="rejected"),ov=next&&diffD(TODAY,next.endDate)<0;
                          const tc=projTypeColor(p.type)
                          return(
                            <div key={p.id} onClick={()=>{setSelId(p.id);setTab("faze");}}
                              style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:16,cursor:"pointer",transition:"border-color .15s,box-shadow .15s",borderTop:`3px solid ${tc}`}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor=`${tc}88`;e.currentTarget.style.boxShadow=T.shadow;}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.borderTopColor=tc;e.currentTarget.style.boxShadow="none";}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                                <div style={{fontSize:13,fontWeight:700,color:T.text,flex:1,paddingRight:8,lineHeight:1.3}}>{p.name}</div>
                                <span style={{fontSize:14,fontWeight:800,color:ov?T.red:pc===100?T.green:tc,flexShrink:0}}>{pc}%</span>
                              </div>
                              <div style={{fontSize:11,color:T.textDim,marginBottom:6,display:"flex",alignItems:"center",gap:4}}><User size={11}/>{p.client}</div>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                                {(p.members||[]).slice(0,4).map((m,i)=>(<Avatar key={m.id} name={m.name} email={m.email} size={20} style={{marginLeft:i===0?0:-4}}/>))}
                              </div>
                              <div style={{height:3,background:T.border,borderRadius:2,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${pc}%`,background:ov?T.red:pc===100?T.green:tc,borderRadius:2,transition:"width .5s"}}/>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()
              })()}
              <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,marginTop:20}}>
                {/* Today's events */}
                <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.textMd,textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Azi — {fmt(TODAY)}</div>
                  {(()=>{
                    const projEvs={}
                    projects.forEach(p=>{
                      const evs=[]
                      ;(p.phases||[]).forEach(ph=>{
                        if(ph.status!=='approved'&&ph.status!=='rejected'){
                          const d=diffD(TODAY,ph.endDate)
                          if(d>=0&&d<=7) evs.push({type:'faza',label:ph.name,d,color:'#d29922'})
                        }
                      });
                      ;(p.avize||[]).forEach(av=>{
                        if(av.status!=='approved'){
                          const inst=INST.find(i=>i.id===av.instId)
                          ;(av.steps||[]).forEach(s=>{
                            if(s.status!=='approved'&&s.date){
                              const d=diffD(TODAY,s.date)
                              if(d>=0&&d<=7) evs.push({type:'aviz',label:`Aviz ${inst?.short||av.instId}`,d,color:'#58a6ff'})
                            }
                          })
                        }
                      })
                      if(evs.length>0) projEvs[p.id]={name:p.name,color:projTypeColor(p.type),evs:evs.sort((a,b)=>a.d-b.d)}
                    })
                    const projIds=Object.keys(projEvs)
                    if(projIds.length===0) return <div style={{fontSize:12,color:T.textDim,textAlign:'center',padding:'20px 0'}}>Niciun termen în următoarele 7 zile 🎉</div>
                    return projIds.map((pid,pi)=>(
                      <div key={pid} style={{marginBottom:pi<projIds.length-1?10:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,paddingBottom:4,borderBottom:`1px solid ${T.border}`}}>
                          <div style={{width:7,height:7,borderRadius:'50%',background:projEvs[pid].color,flexShrink:0}}/>
                          <span style={{fontSize:11,fontWeight:700,color:projEvs[pid].color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{projEvs[pid].name}</span>
                        </div>
                        {projEvs[pid].evs.map((ev,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0 4px 14px',borderBottom:i<projEvs[pid].evs.length-1?`1px solid ${T.border}33`:'none'}}>
                            <div style={{width:5,height:5,borderRadius:'50%',background:ev.color,flexShrink:0}}/>
                            <div style={{flex:1,fontSize:12,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.label}</div>
                            <div style={{fontSize:10,fontWeight:600,color:ev.d===0?T.red:ev.d<=2?T.amber:T.textMd,flexShrink:0}}>
                              {ev.d===0?'Azi':ev.d===1?'Mâine':`${ev.d}z`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  })()}
                </div>
                <CalendarWidget projects={projects} T={T} month={calMonth}
                  onPrev={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))}
                  onNext={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))}
                  notes={notes}
                  onAddNote={(date, text)=>{ if(user) createNote(user.uid, {date, text, type:'note'}) }}
                  onDeleteNote={(noteId)=>{ if(user) deleteNote(user.uid, noteId) }}/>
              </div>
            </div>
          ):(
            /* Project detail */
            <div className="fade-in">
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{margin:"0 0 6px",fontSize:21,fontWeight:800,color:T.text,letterSpacing:"-.4px"}}>{sel.name}</h1>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                      {sel.client&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:T.textDim}}><User size={11}/>{sel.client}</span>}
                      {sel.location&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:T.textDim}}><Map size={11}/>{sel.location}</span>}
                      <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:T.textDim}}><Calendar size={11}/>{fmt(sel.startDate)}</span>
                      {/* member avatars in header */}
                      <div style={{display:"flex",alignItems:"center",marginLeft:4}}>
                        {(sel.members||[]).slice(0,5).map((m,i)=>(
                          <Avatar key={m.id} name={m.name} email={m.email} size={20} style={{marginLeft:i===0?0:-5,border:`1.5px solid ${T.bg}`}} title={m.name}/>
                        ))}
                        {sel.members?.length>5&&<span style={{fontSize:10,color:T.textDim,marginLeft:4}}>+{sel.members.length-5}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",background:T.sidebar,borderRadius:8,padding:3,border:`1px solid ${T.border}`,gap:2}}>
                    {TABS.map(t=>(
                      <button key={t.id} onClick={()=>setTab(t.id)}
                        style={{display:"flex",alignItems:"center",gap:5,background:tab===t.id?T.panel:"transparent",border:`1px solid ${tab===t.id?T.border:"transparent"}`,borderRadius:6,padding:"5px 11px",color:tab===t.id?T.text:T.textDim,cursor:"pointer",fontSize:11,fontWeight:tab===t.id?600:400,fontFamily:"inherit",transition:"all .12s"}}>
                        <t.I size={12}/>{t.label}
                        {t.id==="chat"&&<span style={{width:6,height:6,borderRadius:"50%",background:T.accent,display:"block"}}/>}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{background:T.panel,borderRadius:9,padding:"12px 18px",border:`1px solid ${T.border}`}}>
                  <MultiProg phases={sel.phases} T={T}/>
                </div>
              </div>

              {tab==="faze"&&<PhasesView project={sel} onUpdate={(phId,data)=>updPhase(sel.id,phId,data)} T={T}/>}
              {tab==="avize"&&<AvizeView project={sel} onUpdate={(avId,data)=>updAviz(sel.id,avId,data)} T={T}/>}
              {tab==="gantt"&&(
                <div style={{background:T.panel,borderRadius:10,padding:20,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <BarChart2 size={14} color={T.textDim}/>
                    <span style={{fontSize:11,fontWeight:600,color:T.textDim,textTransform:"uppercase",letterSpacing:.8}}>Timeline — Faze principale</span>
                    <button onClick={async()=>{
                      if(!ganttRef.current) return
                      showToast('Se generează PDF…', T.textMd)
                      try {
                        const canvas = await html2canvas(ganttRef.current, {
                          backgroundColor: T===DARK?'#161b22':'#ffffff',
                          scale: 2,
                          useCORS: true,
                        })
                        const pdf = new jsPDF({orientation:'landscape',unit:'mm',format:'a3'})
                        const pw = pdf.internal.pageSize.getWidth()
                        const ph = pdf.internal.pageSize.getHeight()
                        const ratio = Math.min(pw/canvas.width, ph/canvas.height)
                        const iw = canvas.width*ratio
                        const ih = canvas.height*ratio
                        const mx = (pw-iw)/2
                        const my = (ph-ih)/2
                        pdf.addImage(canvas.toDataURL('image/png'),'PNG',mx,my,iw,ih)
                        pdf.save(`${sel.name.replace(/[^a-zA-Z0-9]/g,'_')}_Gantt.pdf`)
                        showToast('PDF exportat!', T.green)
                      } catch(e) {
                        console.error(e)
                        showToast('Eroare la export PDF', T.red)
                      }
                    }} style={{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:5,background:T.greenBg,border:`1px solid ${T.green}44`,color:T.green,borderRadius:7,padding:"5px 11px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      <Download size={11}/>Export PDF A3
                    </button>
                  </div>
                  <div ref={ganttRef} style={{background:T.panel,padding:8,borderRadius:8}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12,padding:'0 4px'}}>{sel.name} — Timeline</div>
                    <Gantt phases={sel.phases} T={T}/>
                  </div>
                </div>
              )}
              {tab==="chat"&&<Chat project={sel} T={T} currentUser={CURRENT_USER} showToast={showToast}/>}
              {tab==="contract"&&<ContractView project={sel} T={T} onUpdate={(data)=>{
                if(!user) return
                updateProject(user.uid,sel.id,data)
                setProjects(ps=>ps.map(p=>p.id!==sel.id?p:{...p,...data}))
              }}/>}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={{height:36,background:T.sidebar,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:14,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:18,height:18,borderRadius:4,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <span style={{fontSize:11,fontWeight:700,color:T.text}}>Studio Office Kolectiv</span>
          <span style={{fontSize:10,color:T.textDim}}>CUI 32238680</span>
        </div>
        <div style={{height:12,width:1,background:T.border}}/>
        <span style={{fontSize:10,color:T.textDim}}>Arhitectură · Urbanism · Design</span>
        <div style={{marginLeft:"auto",display:"flex",gap:14,alignItems:"center"}}>
          <a href="https://www.studiokolectiv.ro" target="_blank" rel="noreferrer" style={{fontSize:10,color:T.blue,textDecoration:"none",fontWeight:500}}>studiokolectiv.ro</a>
          <span style={{fontSize:10,color:T.textDim}}>office@studiokolectiv.ro</span>
          <span style={{fontSize:10,color:T.textDim}}>© 2025 ArchPlan</span>
        </div>
      </footer>

      {/* Modal editare proiect */}
      {showEditProj&&editProjData&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}} onClick={()=>setShowEditProj(false)}>
          <div style={{background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:14,padding:28,width:420,boxShadow:T.shadowLg}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:18}}>Editează proiect</div>
            {[['Nume proiect','name'],['Client','client'],['Locație','location']].map(([label,field])=>(
              <div key={field} style={{marginBottom:12}}>
                <div style={{fontSize:10,color:T.textDim,marginBottom:4,textTransform:'uppercase',letterSpacing:.6}}>{label}</div>
                <input value={editProjData[field]||''} onChange={e=>setEditProjData(d=>({...d,[field]:e.target.value}))}
                  style={{width:'100%',background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:7,padding:'8px 11px',color:T.text,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.textDim,marginBottom:4,textTransform:'uppercase',letterSpacing:.6}}>Dată start</div>
              <input type="date" value={editProjData.startDate||''} onChange={e=>setEditProjData(d=>({...d,startDate:e.target.value}))}
                style={{width:'100%',background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:7,padding:'8px 11px',color:T.text,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{fontSize:10,color:T.textDim,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:.6}}>Tip proiect</label>
              <div style={{display:'flex',gap:6}}>
                {PROJECT_TYPES.map(pt=>(
                  <button key={pt.id} onClick={()=>setEditProjData(d=>({...d,type:pt.id}))}
                    style={{flex:1,background:(editProjData.type||'arhitectura')===pt.id?`${pt.color}20`:'transparent',border:`1.5px solid ${(editProjData.type||'arhitectura')===pt.id?pt.color:T.border}`,borderRadius:7,padding:'6px 4px',color:(editProjData.type||'arhitectura')===pt.id?pt.color:T.textDim,cursor:'pointer',fontSize:11,fontWeight:(editProjData.type||'arhitectura')===pt.id?700:400,fontFamily:'inherit',transition:'all .12s'}}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowEditProj(false)} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:7,padding:'7px 16px',color:T.textMd,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Anulează</button>
              <button onClick={handleEditProject} style={{background:T.accent,border:'none',borderRadius:7,padding:'7px 18px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Salvează</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal share link */}
      {showShareModal&&shareTargetProj&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}} onClick={()=>{setShowShareModal(false);setShareToken(null);}}>
          <div style={{background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:14,padding:28,width:440,boxShadow:T.shadowLg}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>Link share client</div>
            <div style={{fontSize:12,color:T.textDim,marginBottom:18}}>{shareTargetProj.name}</div>
            {!shareToken?(
              <>
                <div style={{fontSize:11,fontWeight:600,color:T.textMd,marginBottom:10}}>Selectează ce vede clientul:</div>
                {[['faze','Faze proiect'],['avize','Avize'],['gantt','Grafic Gantt']].map(([key,label])=>(
                  <label key={key} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,cursor:'pointer'}}>
                    <input type="checkbox" checked={shareConfig[key]} onChange={e=>setShareConfig(c=>({...c,[key]:e.target.checked}))}/>
                    <span style={{fontSize:12,color:T.text}}>{label}</span>
                  </label>
                ))}
                <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:18}}>
                  <button onClick={()=>setShowShareModal(false)} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:7,padding:'7px 16px',color:T.textMd,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Anulează</button>
                  <button onClick={handleGenerateShare} disabled={shareLoading} style={{background:T.accent,border:'none',borderRadius:7,padding:'7px 18px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
                    {shareLoading?'Se generează…':'Generează link'}
                  </button>
                </div>
              </>
            ):(
              <>
                <div style={{fontSize:11,color:T.textDim,marginBottom:8}}>Link generat — copiază și trimite clientului:</div>
                <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,padding:'10px 12px',fontSize:12,color:T.accent,wordBreak:'break-all',marginBottom:14}}>
                  {window.location.origin}/?share={shareToken}
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/?share=${shareToken}`);showToast('Link copiat!',T.green);}}
                    style={{background:T.accentBg,border:`1px solid ${T.accent}44`,borderRadius:7,padding:'7px 16px',color:T.accent,cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:600}}>Copiază</button>
                  <button onClick={()=>setShowShareModal(false)} style={{background:T.accent,border:'none',borderRadius:7,padding:'7px 16px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Gata</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal confirmare ștergere proiect */}
      {showDeleteConfirm&&deleteTargetProj&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}} onClick={()=>setShowDeleteConfirm(false)}>
          <div style={{background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:14,padding:28,width:380,boxShadow:T.shadowLg}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:8}}>Șterge proiect</div>
            <div style={{fontSize:13,color:T.textDim,marginBottom:20}}>Ești sigur că vrei să ștergi <strong style={{color:T.text}}>{deleteTargetProj.name}</strong>? Această acțiune nu poate fi anulată.</div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowDeleteConfirm(false)} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:7,padding:'7px 16px',color:T.textMd,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Anulează</button>
              <button onClick={handleDeleteProject} style={{background:T.red,border:'none',borderRadius:7,padding:'7px 18px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Șterge</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cereri de acces */}
      {showRequests&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}} onClick={()=>setShowRequests(false)}>
          <div style={{background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:14,padding:28,width:440,maxHeight:'80vh',overflow:'auto',boxShadow:T.shadowLg}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:18}}>Cereri de acces</div>
            {pendingRequests.length===0&&<div style={{fontSize:12,color:T.textDim,textAlign:'center',padding:'20px 0'}}>Nicio cerere în așteptare</div>}
            {pendingRequests.map(r=>(
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{r.name||r.email}</div>
                  <div style={{fontSize:11,color:T.textDim}}>{r.email}</div>
                </div>
                <button onClick={()=>approveAccess(r.email).then(()=>showToast(`${r.email} aprobat`,T.green))}
                  style={{background:T.greenBg,border:`1px solid ${T.green}44`,borderRadius:6,padding:'5px 12px',color:T.green,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Aprobă</button>
                <button onClick={()=>rejectAccess(r.email).then(()=>showToast(`${r.email} respins`,T.red))}
                  style={{background:T.redBg,border:`1px solid ${T.red}44`,borderRadius:6,padding:'5px 12px',color:T.red,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Respinge</button>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
              <button onClick={()=>setShowRequests(false)} style={{background:T.accent,border:'none',borderRadius:7,padding:'7px 18px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Închide</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal proiect nou */}
      {showNewProj&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={()=>setShowNewProj(false)}>
          <div style={{background:T.panel,border:`1px solid ${T.borderLt}`,borderRadius:14,padding:28,width:420,boxShadow:T.shadowLg}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:18}}>Proiect nou</div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,color:T.textDim,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:.6}}>Tip proiect</label>
              <div style={{display:'flex',gap:6}}>
                {PROJECT_TYPES.map(pt=>(
                  <button key={pt.id} onClick={()=>setNewProjType(pt.id)}
                    style={{flex:1,background:newProjType===pt.id?`${pt.color}20`:'transparent',border:`1.5px solid ${newProjType===pt.id?pt.color:T.border}`,borderRadius:7,padding:'6px 4px',color:newProjType===pt.id?pt.color:T.textDim,cursor:'pointer',fontSize:11,fontWeight:newProjType===pt.id?700:400,fontFamily:'inherit',transition:'all .12s'}}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
            {[
              ["Nume proiect *","text",newProjName,setNewProjName,"ex: Locuință P+1E — Cluj"],
              ["Client","text",newProjClient,setNewProjClient,"ex: Familia Ionescu"],
              ["Locație","text",newProjLoc,setNewProjLoc,"ex: Cluj-Napoca, str. Memorandumului"],
            ].map(([label,type,val,set,ph])=>(
              <div key={label} style={{marginBottom:12}}>
                <div style={{fontSize:10,color:T.textDim,marginBottom:4,textTransform:"uppercase",letterSpacing:.6}}>{label}</div>
                <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                  style={{width:"100%",background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:7,padding:"8px 11px",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:T.textDim,marginBottom:4,textTransform:"uppercase",letterSpacing:.6}}>Dată start</div>
              <input type="date" value={newProjStart} onChange={e=>setNewProjStart(e.target.value)}
                style={{width:"100%",background:T.bg,border:`1px solid ${T.borderLt}`,borderRadius:7,padding:"8px 11px",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowNewProj(false)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 16px",color:T.textMd,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Anulează</button>
              <button onClick={handleNewProject} style={{background:T.accent,border:"none",borderRadius:7,padding:"7px 18px",color:"#fff",fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Creează</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&(
        <div className="fade-up" style={{position:"fixed",bottom:20,right:20,background:T.panel,border:`1px solid ${toast.c}44`,borderRadius:9,padding:"10px 16px",boxShadow:T.shadowLg,zIndex:999,display:"flex",alignItems:"center",gap:8,maxWidth:360}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:toast.c,flexShrink:0}}/>
          <span style={{fontSize:12,color:T.text,fontWeight:500}}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
