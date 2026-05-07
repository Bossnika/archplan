// src/App.jsx
import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  Bell, Plus, Search, ChevronRight, AlertTriangle, CheckCircle, Clock,
  Circle, FileText, AlertCircle, Layers, Building2, BarChart2, User,
  Download, Upload, Link2, ExternalLink, X, Calendar, Map, Settings,
  PanelLeftClose, PanelLeftOpen, LogOut, MessageSquare, Zap, Flame,
  Droplets, Radio, Leaf, Paperclip, CheckSquare, TrendingUp
} from 'lucide-react'
import { useAuth }    from './hooks/useAuth.jsx'
import { useTheme }   from './hooks/useTheme.jsx'
import LoginPage      from './pages/LoginPage.jsx'
import AppHeader      from './components/AppHeader.jsx'
import AppFooter      from './components/AppFooter.jsx'
import BeneficiarView from './components/BeneficiarView.jsx'
import AttachmentUploader from './components/AttachmentUploader.jsx'
import ProjectChat    from './components/ProjectChat.jsx'
import { listenProjects, createProject, updateProject, listenReminders, createReminder, updateReminder, deleteReminder } from './lib/db.js'
import { buildPhases, buildAvize, uid, today, diffDays, fmt, fmtShort, addDays, projectPct } from './lib/utils.js'
import { exportGanttPDF } from './lib/exportGantt.js'
import { checkLocalDeadlines, requestNotificationPermission } from './lib/notifications.js'
import { STATUS, GC, INSTITUTIONS } from './lib/constants.js'

/* ── Institution icon resolver ───────────────────────────────────────────────*/
const INST_ICONS = { Zap, Flame, Droplets, Radio, Leaf, Map }
const getInstIcon = (name) => INST_ICONS[name] || Building2

/* ── Tiny shared atoms ───────────────────────────────────────────────────────*/
const StatusIcon = ({ status, size = 12 }) => {
  const icons = { pending: Circle, in_progress: Clock, submitted: FileText, approved: CheckCircle, rejected: AlertCircle }
  const I = icons[status] || Circle
  return <I size={size} color={STATUS[status]?.color || '#484f58'} />
}

const Chip = ({ label, color, style = {} }) => (
  <span className="chip" style={{ color, background: `${color}18`, borderColor: `${color}30`, ...style }}>
    {label}
  </span>
)

const MiniProg = ({ val, color, w = 56, T }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{ width: w, height: 3, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 2, transition: 'width .5s' }} />
    </div>
    <span style={{ fontSize: 11, color: T.textMd, fontWeight: 600, minWidth: 26 }}>{val}%</span>
  </div>
)

/* ── Multi-group progress ────────────────────────────────────────────────────*/
const MultiProg = ({ phases, T }) => {
  const groups = ['CU', 'Avize', 'PT', 'AC']
  const total = phases.length
  const done = phases.filter(p => p.status === 'approved').length
  const pct = total ? Math.round(done / total * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {groups.map(g => {
        const gp = phases.filter(p => p.group === g)
        const gd = gp.filter(p => p.status === 'approved').length
        return (
          <div key={g} style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: GC[g], letterSpacing: .8, textTransform: 'uppercase' }}>{g}</span>
              <span style={{ fontSize: 9, color: T.textDim }}>{gd}/{gp.length}</span>
            </div>
            <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${gp.length ? gd / gp.length * 100 : 0}%`, background: GC[g], borderRadius: 2, transition: 'width .6s' }} />
            </div>
          </div>
        )
      })}
      <div style={{ textAlign: 'right', minWidth: 42, paddingLeft: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1 }}>{pct}</span>
        <span style={{ fontSize: 11, color: T.textDim, fontWeight: 500 }}>%</span>
      </div>
    </div>
  )
}

/* ── KPI strip ───────────────────────────────────────────────────────────────*/
const KPIStrip = ({ projects, T }) => {
  const kpis = [
    { l: 'Total proiecte', v: projects.length, c: T.accent, I: Layers },
    { l: 'Active', v: projects.filter(p => !p.archived).length, c: T.amber, I: Clock },
    { l: 'Finalizate', v: projects.filter(p => (p.phases || []).every(ph => ph.status === 'approved')).length, c: T.green, I: CheckCircle },
    { l: 'Întârziate', v: projects.filter(p => { const n = (p.phases || []).find(ph => ph.status !== 'approved' && ph.status !== 'rejected'); return n && diffDays(today(), n.endDate) < 0 }).length, c: T.red, I: AlertTriangle },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
      {kpis.map(k => (
        <div key={k.l} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: '15px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${k.c}14`, border: `1px solid ${k.c}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <k.I size={17} color={k.c} />
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.c, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>{k.l}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Gantt ───────────────────────────────────────────────────────────────────*/
const GanttView = ({ phases, T }) => {
  if (!phases.length) return null
  const totalDays = Math.max(1, diffDays(phases[0].startDate, phases[phases.length - 1].endDate))
  const todayPct = Math.min(100, Math.max(0, diffDays(phases[0].startDate, today()) / totalDays * 100))
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 560 }}>
        <div style={{ display: 'flex', paddingLeft: 188, marginBottom: 9 }}>
          <span style={{ fontSize: 10, color: T.textDim, flex: 1 }}>{fmt(phases[0].startDate)}</span>
          <span style={{ fontSize: 10, color: T.textDim }}>{fmt(phases[phases.length - 1].endDate)}</span>
        </div>
        {phases.map(ph => {
          const l = diffDays(phases[0].startDate, ph.startDate) / totalDays * 100
          const w = Math.max(0.8, diffDays(ph.startDate, ph.endDate) / totalDays * 100)
          const c = GC[ph.group] || T.accent
          const done = ph.status === 'approved'
          const active = ph.status === 'in_progress'
          return (
            <div key={ph.phaseId} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ width: 188, flexShrink: 0, paddingRight: 12 }}>
                <div style={{ fontSize: 11, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: done ? 400 : 500 }}>{ph.name}</div>
                <Chip label={ph.group} color={c} />
              </div>
              <div style={{ flex: 1, height: 22, background: T.border, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: `${l}%`, width: `${w}%`, height: '100%', background: done ? c : active ? `${c}cc` : `${c}44`, border: `1px solid ${c}${done ? '' : '66'}`, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 5, overflow: 'hidden', transition: 'width .3s' }}>
                  {done && <CheckCircle size={9} color="#fff" />}
                </div>
                <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 1.5, background: T.red, zIndex: 2 }} />
              </div>
              <div style={{ width: 44, textAlign: 'right', fontSize: 10, paddingLeft: 8 }}>
                {done ? <CheckCircle size={12} color={T.green} /> : <span style={{ color: T.textDim }}>{fmtShort(ph.endDate)}</span>}
              </div>
            </div>
          )
        })}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingLeft: 188, alignItems: 'center' }}>
          {Object.entries(GC).map(([g, c]) => (
            <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 14, height: 3, background: c, borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: T.textDim }}>{g}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 1.5, height: 12, background: T.red }} />
            <span style={{ fontSize: 10, color: T.textDim }}>Astăzi</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Phases table ────────────────────────────────────────────────────────────*/
const PhasesView = ({ project, onUpdatePhase, T }) => {
  const [openPh, setOpenPh] = useState(null)
  const cols = '12px 1fr 76px 76px 132px 62px 44px'
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, padding: '8px 16px', background: T.sidebar, borderBottom: `1px solid ${T.border}` }}>
        {['', 'Fază', 'Start', 'Termen', 'Status', 'Avans', 'Zile'].map(h => (
          <div key={h} style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: .7 }}>{h}</div>
        ))}
      </div>
      {project.phases.map((ph, i) => {
        const dl = diffDays(today(), ph.endDate)
        const ov = dl < 0 && ph.status !== 'approved'
        const c = GC[ph.group] || T.accent
        const pv = { approved: 100, submitted: 75, in_progress: 40, pending: 0, rejected: 0 }[ph.status] || 0
        const isOpen = openPh === ph.phaseId
        return (
          <div key={ph.phaseId}>
            <div onClick={() => setOpenPh(isOpen ? null : ph.phaseId)}
              style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, alignItems: 'center', padding: '9px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: ov ? `${T.red}06` : 'transparent', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = ov ? `${T.red}0c` : T.panelHov}
              onMouseLeave={e => e.currentTarget.style.background = ov ? `${T.red}06` : 'transparent'}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS[ph.status]?.color || T.textDim, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500, lineHeight: 1.4 }}>{ph.name}</div>
                {ov && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <AlertTriangle size={10} color={T.red} />
                    <span style={{ fontSize: 10, color: T.red }}>
                      {String(-dl)} zile întârziat
                    </span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, color: T.textDim }}>{fmtShort(ph.startDate)}</span>
              <span style={{ fontSize: 11, color: ov ? T.red : dl < 7 ? T.amber : T.textDim }}>{fmtShort(ph.endDate)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={e => e.stopPropagation()}>
                <StatusIcon status={ph.status} size={11} />
                <select value={ph.status} onChange={e => onUpdatePhase(ph.phaseId, { status: e.target.value })}
                  style={{ background: 'transparent', border: 'none', color: STATUS[ph.status]?.color || T.text, fontSize: 11, fontWeight: 500, cursor: 'pointer', outline: 'none', fontFamily: 'inherit', flex: 1 }}>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <option key={k} value={k} style={{ background: T.panel, color: v.color }}>{v.label}</option>
                  ))}
                </select>
              </div>
              <MiniProg val={pv} color={c} T={T} />
              <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right', color: ph.status === 'approved' ? T.green : ov ? T.red : dl < 7 ? T.amber : T.textDim }}>
                {ph.status === 'approved' ? <CheckCircle size={13} color={T.green} /> : `${dl}z`}
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: '11px 38px 14px', borderBottom: `1px solid ${T.border}`, background: T.panelHov }} className="fade-in">
                <AttachmentUploader
                  attachments={ph.attachments || []}
                  projectId={project.id}
                  context={`faze/${ph.phaseId}`}
                  label="Documente fază"
                  onAdd={att => onUpdatePhase(ph.phaseId, { attachments: [...(ph.attachments || []), att] })}
                  onRemove={attId => onUpdatePhase(ph.phaseId, { attachments: (ph.attachments || []).filter(a => a.id !== attId) })}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Avize view ──────────────────────────────────────────────────────────────*/
const AvizeView = ({ project, onUpdateAviz, T }) => {
  const [open, setOpen] = useState(null)
  const [edit, setEdit] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {project.avize.map(av => {
        const inst = INSTITUTIONS.find(i => i.id === av.instId)
        if (!inst) return null
        const InstIcon = getInstIcon(inst.icon)
        const ds = av.steps.filter(s => s.status === 'approved').length
        const pv = Math.round(ds / av.steps.length * 100)
        const isOpen = open === av.avizId
        const isEdit = edit === av.avizId
        return (
          <div key={av.avizId} style={{ border: `1px solid ${isOpen ? inst.color + '44' : T.border}`, borderRadius: 10, overflow: 'hidden', background: T.panel, transition: 'border-color .2s' }}>
            <div onClick={() => setOpen(isOpen ? null : av.avizId)}
              style={{ display: 'grid', gridTemplateColumns: '36px 1fr 140px 108px 118px 28px', gap: 8, alignItems: 'center', padding: '11px 16px', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = T.panelHov}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${inst.color}18`, border: `1px solid ${inst.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InstIcon size={16} color={inst.color} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{inst.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                  {av.dosarNr && <Chip label={`Nr. ${av.dosarNr}`} color={T.blue} />}
                  {av.contactName && <span style={{ fontSize: 10, color: T.textDim, display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} />{av.contactName}</span>}
                  {(av.attachments || []).length > 0 && <Chip label={`${av.attachments.length} fișier${av.attachments.length > 1 ? 'e' : ''}`} color={T.green} />}
                </div>
              </div>
              <MiniProg val={pv} color={inst.color} w={72} T={T} />
              <span style={{ fontSize: 11, color: T.textDim }}>{ds}/{av.steps.length} pași</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <StatusIcon status={av.status} size={11} />
                <span style={{ fontSize: 11, color: STATUS[av.status]?.color || T.textDim, fontWeight: 500 }}>{STATUS[av.status]?.label}</span>
              </div>
              <ChevronRight size={14} color={T.textDim} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
            </div>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: '13px 16px 16px' }} className="fade-in">
                {av.steps.map((step, si) => {
                  const dl = step.date ? diffDays(today(), step.date) : null
                  const done = step.status === 'approved'
                  return (
                    <div key={step.stepId} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 118px 46px', gap: 8, alignItems: 'center', padding: '7px 0', borderBottom: si < av.steps.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <div onClick={() => {
                        const ns = av.steps.map(s => s.stepId === step.stepId ? { ...s, status: done ? 'pending' : 'approved' } : s)
                        onUpdateAviz(av.avizId, { steps: ns, status: ns.every(s => s.status === 'approved') ? 'approved' : av.status })
                      }} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${done ? inst.color : T.borderLt}`, background: done ? inst.color : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
                        {done && <CheckCircle size={10} color="#fff" />}
                      </div>
                      <span style={{ fontSize: 12, color: done ? T.textDim : T.text, textDecoration: done ? 'line-through' : 'none' }}>{step.name}</span>
                      <span style={{ fontSize: 10, color: T.textDim }}>{fmt(step.date)}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'right', color: done ? T.green : dl === null ? T.textDim : dl < 0 ? T.red : dl < 5 ? T.amber : T.textDim }}>
                        {done ? <CheckCircle size={11} color={T.green} /> : dl === null ? '—' : `${dl}z`}
                      </span>
                    </div>
                  )
                })}
                <div style={{ padding: '12px 0', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, marginBottom: 12, marginTop: 12 }}>
                  <AttachmentUploader
                    attachments={av.attachments || []}
                    projectId={project.id}
                    context={`avize/${av.instId}`}
                    label={`Aviz ${inst.short} — documente`}
                    onAdd={att => onUpdateAviz(av.avizId, { attachments: [...(av.attachments || []), att] })}
                    onRemove={attId => onUpdateAviz(av.avizId, { attachments: (av.attachments || []).filter(a => a.id !== attId) })}
                  />
                </div>
                {isEdit ? (
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }} className="fade-in">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                      {[{ l: 'Persoană contact', k: 'contactName' }, { l: 'Telefon', k: 'contactPhone' }, { l: 'Nr. dosar depus', k: 'dosarNr' }].map(f => (
                        <div key={f.k}>
                          <label style={{ fontSize: 9, color: T.textDim, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: .6 }}>{f.l}</label>
                          <input value={av[f.k] || ''} onChange={e => onUpdateAviz(av.avizId, { [f.k]: e.target.value })}
                            style={{ width: '100%', background: T.panel, border: `1px solid ${T.borderLt}`, borderRadius: 6, padding: '7px 10px', color: T.text, fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                      <select value={av.status} onChange={e => onUpdateAviz(av.avizId, { status: e.target.value })}
                        style={{ background: T.panel, border: `1px solid ${T.borderLt}`, borderRadius: 6, padding: '6px 10px', color: STATUS[av.status]?.color || T.text, fontSize: 11, outline: 'none', fontFamily: 'inherit' }}>
                        {Object.entries(STATUS).map(([k, v]) => (
                          <option key={k} value={k} style={{ background: T.panel, color: v.color }}>{v.label}</option>
                        ))}
                      </select>
                      <button onClick={() => setEdit(null)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.green, border: 'none', borderRadius: 6, padding: '7px 16px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                        <CheckCircle size={12} />Salvează
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEdit(av.avizId)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.panelHov, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', color: T.textMd, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                    <Settings size={11} />Editează detalii & status
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Reminders ───────────────────────────────────────────────────────────────*/
const RemindersPanel = ({ reminders, projects, onAdd, onToggle, onDelete, T }) => {
  const [text, setText] = useState('')
  const [date, setDate] = useState(today())
  const [projId, setProjId] = useState('')
  const urgent = reminders.filter(r => !r.done && r.date && diffDays(today(), r.date) <= 1 && diffDays(today(), r.date) >= 0).length
  const add = () => { if (!text.trim()) return; onAdd({ id: uid(), text, date, projectId: projId, done: false, createdAt: today() }); setText('') }
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', background: T.panel }}>
      <div style={{ padding: '13px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, background: T.sidebar }}>
        <Bell size={14} color={T.textMd} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Remindere</span>
        {urgent > 0 && <Chip label={`${urgent} urgent${urgent > 1 ? 'e' : ''}`} color={T.red} />}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: T.textDim }}>{reminders.filter(r => !r.done).length} active</span>
      </div>
      <div style={{ padding: 14, borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Adaugă reminder…" onKeyDown={e => e.key === 'Enter' && add()}
            style={{ flex: 1, background: T.panel, border: `1px solid ${T.borderLt}`, borderRadius: 7, padding: '7px 11px', color: T.text, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ background: T.panel, border: `1px solid ${T.borderLt}`, borderRadius: 7, padding: '7px 10px', color: T.textMd, fontSize: 11, outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }} />
          <select value={projId} onChange={e => setProjId(e.target.value)}
            style={{ background: T.panel, border: `1px solid ${T.borderLt}`, borderRadius: 7, padding: '7px 10px', color: T.textDim, fontSize: 11, outline: 'none', maxWidth: 135, fontFamily: 'inherit' }}>
            <option value=''>Fără proiect</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name.slice(0, 22)}</option>)}
          </select>
          <button onClick={add} style={{ width: 34, height: 34, background: T.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {reminders.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: T.textDim, fontSize: 12 }}>Niciun reminder</div>}
        {[...reminders].sort((a, b) => (a.done ? 1 : -1) || (a.date > b.date ? 1 : -1)).map(r => {
          const dl = r.date ? diffDays(today(), r.date) : null
          const urg = dl !== null && dl <= 1 && !r.done
          const proj = projects.find(p => p.id === r.projectId)
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: urg ? `${T.red}08` : T.bg, borderRadius: 8, border: `1px solid ${urg ? T.red + '44' : T.border}`, opacity: r.done ? .5 : 1, transition: 'opacity .2s' }}>
              <div onClick={() => onToggle(r.id)}
                style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${r.done ? T.green : T.borderLt}`, background: r.done ? T.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                {r.done && <CheckCircle size={10} color="#fff" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: r.done ? T.textDim : T.text, textDecoration: r.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
                  {r.date && <span style={{ fontSize: 10, color: urg ? T.red : T.textDim, display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={9} />{fmt(r.date)}</span>}
                  {proj && <Chip label={proj.name.slice(0, 22)} color={T.blue} />}
                </div>
              </div>
              {dl !== null && !r.done && <Chip label={dl < 0 ? `${-dl}z întârziat` : dl === 0 ? 'Astăzi' : `${dl}z`} color={dl < 0 ? T.red : dl === 0 ? T.amber : T.textDim} />}
              <button onClick={() => onDelete(r.id)} style={{ background: 'transparent', border: 'none', color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}><X size={14} /></button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── New project modal ───────────────────────────────────────────────────────*/
const NewModal = ({ onClose, onSave, T }) => {
  const [f, setF] = useState({ name: '', client: '', location: '', start: today() })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const inp = { width: '100%', background: T.bg, border: `1px solid ${T.borderLt}`, borderRadius: 8, padding: '9px 12px', color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s' }
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 460 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.accentBg, border: `1px solid ${T.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={15} color={T.blue} />
          </div>
          Proiect nou
        </div>
        {[{ l: 'Denumire proiect *', k: 'name', ph: 'ex: Locuință P+1 Florești' }, { l: 'Beneficiar / Client', k: 'client', ph: 'Numele clientului' }, { l: 'Adresă / Localitate', k: 'location', ph: 'ex: Cluj-Napoca, str. ...' }].map(fd => (
          <div key={fd.k} style={{ marginBottom: 11 }}>
            <label style={{ fontSize: 10, color: T.textDim, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .6 }}>{fd.l}</label>
            <input value={f[fd.k]} onChange={e => set(fd.k, e.target.value)} placeholder={fd.ph} style={inp}
              onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.borderLt} />
          </div>
        ))}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 10, color: T.textDim, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .6 }}>Data de start</label>
          <input type="date" value={f.start} onChange={e => set('start', e.target.value)} style={{ ...inp, width: 'auto', colorScheme: 'dark' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 18px', color: T.textDim, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Anulează</button>
          <button onClick={() => {
            if (!f.name.trim()) return
            const avizStart = addDays(f.start, 14 + 3 + 30 + 21)
            onSave({ name: f.name, client: f.client, location: f.location, startDate: f.start, phases: buildPhases(f.start), avize: buildAvize(avizStart), beneficiar: null, archived: false })
            onClose()
          }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.accent, border: 'none', borderRadius: 8, padding: '8px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            <Plus size={13} />Creează proiect
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Sidebar item ────────────────────────────────────────────────────────────*/
const SideItem = ({ p, active, onClick, T }) => {
  const pc = projectPct(p.phases || [])
  const next = (p.phases || []).find(ph => ph.status !== 'approved' && ph.status !== 'rejected')
  const ov = next && diffDays(today(), next.endDate) < 0
  const avD = (p.avize || []).filter(av => av.status === 'approved').length
  return (
    <div onClick={onClick}
      style={{ padding: '10px 12px', borderRadius: 8, margin: '1px 6px', cursor: 'pointer', background: active ? `${T.accent}14` : 'transparent', borderLeft: `2px solid ${active ? T.accent : 'transparent'}`, transition: 'background .12s' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.panelHov }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? T.text : T.textMd, flex: 1, paddingRight: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: ov ? T.red : pc === 100 ? T.green : T.textDim, flexShrink: 0 }}>{pc}%</span>
      </div>
      {p.client && <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><User size={9} />{p.client}</div>}
      <div style={{ display: 'flex', gap: 5, marginBottom: 5, alignItems: 'center' }}>
        {next && <span style={{ fontSize: 10, color: ov ? T.red : T.textDim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.name}</span>}
        <Chip label={`${avD}/${(p.avize || []).length}`} color={avD === (p.avize || []).length && (p.avize || []).length > 0 ? T.green : T.blue} />
      </div>
      <div style={{ height: 2, background: T.border, borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pc}%`, background: ov ? T.red : pc === 100 ? T.green : T.accent, borderRadius: 1, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

/* ── TABS ────────────────────────────────────────────────────────────────────*/
const TABS = [
  { id: 'faze', label: 'Faze', I: Layers },
  { id: 'avize', label: 'Avize', I: Building2 },
  { id: 'gantt', label: 'Timeline', I: BarChart2 },
  { id: 'beneficiar', label: 'Beneficiar', I: User },
  { id: 'ac', label: 'Dosar AC', I: FileText },
  { id: 'chat', label: 'Chat', I: MessageSquare },
]

/* ── MAIN ────────────────────────────────────────────────────────────────────*/
export default function App() {
  const { user, loading } = useAuth()
  const { T } = useTheme()
  const [projects, setProjects] = useState([])
  const [reminders, setReminders] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('faze')
  const [showNew, setShowNew] = useState(false)
  const [showRem, setShowRem] = useState(false)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!user) return
    const u1 = listenProjects(user.uid, setProjects)
    const u2 = listenReminders(user.uid, setReminders)
    return () => { u1(); u2() }
  }, [user])

  useEffect(() => {
    if (!user) return
    requestNotificationPermission().then(p => { if (p === 'granted') checkLocalDeadlines(projects, reminders) })
  }, [user, projects, reminders])

  const showToast = useCallback((msg, c) => { setToast({ msg, c: c || T.green }); setTimeout(() => setToast(null), 3000) }, [T])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg, color: T.textDim, fontSize: 13, gap: 8 }}>
      <div style={{ width: 16, height: 16, border: `2px solid ${T.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Se încarcă…
    </div>
  )
  if (!user) return <LoginPage />

  const selProj = projects.find(p => p.id === selected)
  const urgentRem = reminders.filter(r => !r.done && r.date && diffDays(today(), r.date) <= 1 && diffDays(today(), r.date) >= 0).length
  const alerts = projects.flatMap(p => (p.phases || []).filter(ph => ph.status !== 'approved' && ph.status !== 'rejected' && ph.endDate && diffDays(today(), ph.endDate) >= 0 && diffDays(today(), ph.endDate) <= 7).map(ph => ({ projectName: p.name, phaseName: ph.name, daysLeft: diffDays(today(), ph.endDate) })))
  const filtered = projects.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.client || '').toLowerCase().includes(search.toLowerCase()))

  const doCreate = async (data) => { const ref = await createProject(user.uid, data); setSelected(ref.id); setTab('faze'); setShowRem(false); showToast('Proiect creat') }
  const doUpdate = (projectId, data) => updateProject(user.uid, projectId, data)
  const updPhase = (projectId, phaseId, data) => { const p = projects.find(x => x.id === projectId); if (!p) return; doUpdate(projectId, { phases: p.phases.map(ph => ph.phaseId === phaseId ? { ...ph, ...data } : ph) }) }
  const updAviz = (projectId, avizId, data) => { const p = projects.find(x => x.id === projectId); if (!p) return; doUpdate(projectId, { avize: p.avize.map(av => av.avizId === avizId ? { ...av, ...data } : av) }) }

  const handleExport = async () => { if (!selProj) return; setExporting(true); try { await exportGanttPDF(selProj) } finally { setExporting(false) } }

  return (
    <div style={{ fontFamily: "'Geist','Helvetica Neue',sans-serif", background: T.bg, height: '100vh', color: T.text, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <AppHeader selectedProject={selProj} showRem={showRem} setShowRem={setShowRem}
        setShowNew={setShowNew} alerts={alerts} urgentRem={urgentRem} setSelected={setSelected} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width: collapsed ? 48 : 252, background: T.sidebar, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width .2s', overflow: 'hidden' }}>
          <div style={{ padding: '8px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            {!collapsed && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 10px' }}>
                <Search size={12} color={T.textDim} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută…"
                  style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            )}
            <button onClick={() => setCollapsed(s => !s)} style={{ background: 'transparent', border: 'none', color: T.textDim, cursor: 'pointer', padding: 4, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          </div>
          {!collapsed && <div style={{ padding: '8px 14px 2px', fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Proiecte ({filtered.length})</div>}
          <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 8 }}>
            {filtered.length === 0 && !collapsed && <div style={{ padding: 20, textAlign: 'center', color: T.textDim, fontSize: 12 }}>{projects.length === 0 ? 'Niciun proiect' : 'Niciun rezultat'}</div>}
            {filtered.map(p => collapsed ? (
              <div key={p.id} onClick={() => { setSelected(p.id); setShowRem(false) }} title={p.name}
                style={{ padding: 8, display: 'flex', justifyContent: 'center', cursor: 'pointer', borderRadius: 7, margin: '2px 6px', background: selected === p.id && !showRem ? `${T.accent}14` : 'transparent' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: T.panel, border: `1px solid ${selected === p.id ? T.accent : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: T.textMd, fontWeight: 700 }}>
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
            ) : (
              <SideItem key={p.id} p={p} active={selected === p.id && !showRem} onClick={() => { setSelected(p.id); setShowRem(false) }} T={T} />
            ))}
          </div>
          {!collapsed && (
            <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={11} color={T.textDim} />
              <span style={{ fontSize: 10, color: T.textDim }}>{fmt(today())}</span>
            </div>
          )}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', background: T.bg, padding: 20 }} className="fade-in">
          {showRem ? (
            <RemindersPanel reminders={reminders} projects={projects} T={T}
              onAdd={r => createReminder(user.uid, r)}
              onToggle={id => updateReminder(user.uid, id, { done: !reminders.find(r => r.id === id)?.done })}
              onDelete={id => deleteReminder(user.uid, id)} />
          ) : !selProj ? (
            <div className="fade-in">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 21, fontWeight: 800, color: T.text, marginBottom: 4, letterSpacing: '-.4px' }}>Dashboard</div>
                <div style={{ fontSize: 13, color: T.textDim }}>Studio Office Kolectiv — {fmt(today())}</div>
              </div>
              <KPIStrip projects={projects} T={T} />
              {alerts.length > 0 && (
                <div style={{ background: T.panel, border: `1px solid ${T.amber}44`, borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <AlertTriangle size={14} color={T.amber} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>Termene în 7 zile</span>
                  </div>
                  {alerts.map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < alerts.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Chip label={a.projectName.slice(0, 22)} color={T.accent} />
                        <span style={{ fontSize: 12, color: T.textMd }}>— {a.phaseName}</span>
                      </div>
                      <Chip label={a.daysLeft === 0 ? 'Astăzi' : `${a.daysLeft} zile`} color={a.daysLeft === 0 ? T.red : T.amber} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {projects.map(p => {
                  const pc = projectPct(p.phases || [])
                  const next = (p.phases || []).find(ph => ph.status !== 'approved' && ph.status !== 'rejected')
                  const ov = next && diffDays(today(), next.endDate) < 0
                  const avD = (p.avize || []).filter(av => av.status === 'approved').length
                  return (
                    <div key={p.id} onClick={() => setSelected(p.id)}
                      style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'border-color .15s,box-shadow .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.accent}66`; e.currentTarget.style.boxShadow = T.shadow }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, flex: 1, paddingRight: 8, lineHeight: 1.3 }}>{p.name}</div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: ov ? T.red : pc === 100 ? T.green : T.accent, flexShrink: 0 }}>{pc}%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8, fontSize: 11, color: T.textDim }}><User size={11} />{p.client}</div>
                      {next && <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9, fontSize: 10, color: ov ? T.red : T.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><ChevronRight size={10} />{next.name}</div>}
                      <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${pc}%`, background: ov ? T.red : pc === 100 ? T.green : T.accent, borderRadius: 2, transition: 'width .5s' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Chip label={`${avD}/${(p.avize || []).length} avize`} color={avD === (p.avize || []).length && p.avize.length > 0 ? T.green : T.blue} />
                        {ov && <Chip label="Întârziat" color={T.red} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="fade-in">
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: T.text, letterSpacing: '-.4px' }}>{selProj.name}</h1>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      {selProj.client && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.textDim }}><User size={11} />{selProj.client}</span>}
                      {selProj.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.textDim }}><Map size={11} />{selProj.location}</span>}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.textDim }}><Calendar size={11} />{fmt(selProj.startDate)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {tab === 'gantt' && (
                      <button onClick={handleExport} disabled={exporting}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.greenBg, border: `1px solid ${T.green}44`, color: T.green, borderRadius: 7, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: exporting ? .7 : 1 }}>
                        <Download size={12} />{exporting ? 'Se exportă…' : 'Export PDF A1'}
                      </button>
                    )}
                    <div style={{ display: 'flex', background: T.sidebar, borderRadius: 8, padding: 3, border: `1px solid ${T.border}`, gap: 2 }}>
                      {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: tab === t.id ? T.panel : 'transparent', border: `1px solid ${tab === t.id ? T.border : 'transparent'}`, borderRadius: 6, padding: '5px 11px', color: tab === t.id ? T.text : T.textDim, cursor: 'pointer', fontSize: 11, fontWeight: tab === t.id ? 600 : 400, fontFamily: 'inherit', transition: 'all .12s' }}>
                          <t.I size={12} />{t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ background: T.panel, borderRadius: 9, padding: '12px 18px', border: `1px solid ${T.border}` }}>
                  <MultiProg phases={selProj.phases} T={T} />
                </div>
              </div>

              {tab === 'faze' && <PhasesView project={selProj} onUpdatePhase={(phId, data) => { updPhase(selProj.id, phId, data); showToast('Status actualizat') }} T={T} />}
              {tab === 'avize' && <AvizeView project={selProj} onUpdateAviz={(avId, data) => updAviz(selProj.id, avId, data)} T={T} />}
              {tab === 'gantt' && (
                <div style={{ background: T.panel, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarChart2 size={14} color={T.textDim} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: .8 }}>Timeline — Faze principale</span>
                  </div>
                  <GanttView phases={selProj.phases} T={T} />
                </div>
              )}
              {tab === 'beneficiar' && <BeneficiarView project={selProj} onUpdate={b => doUpdate(selProj.id, { beneficiar: b })} />}
              {tab === 'ac' && (
                <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.greenBg, border: `1px solid ${T.green}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} color={T.green} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Dosar Autorizație de Construire</div>
                      <div style={{ fontSize: 11, color: T.textDim }}>Avize finale, PT verificat, toate documentele pentru depunere AC</div>
                    </div>
                  </div>
                  <AttachmentUploader
                    attachments={selProj.acAttachments || []}
                    projectId={selProj.id} context="ac" label="Documente AC"
                    onAdd={att => doUpdate(selProj.id, { acAttachments: [...(selProj.acAttachments || []), att] })}
                    onRemove={attId => doUpdate(selProj.id, { acAttachments: (selProj.acAttachments || []).filter(a => a.id !== attId) })}
                  />
                </div>
              )}
              {tab === 'chat' && (
                <div style={{ height: 'calc(100vh - 280px)', minHeight: 500 }}>
                  <ProjectChat project={selProj} T={T} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <AppFooter />

      {showNew && <NewModal onClose={() => setShowNew(false)} onSave={doCreate} T={T} />}

      {toast && (
        <div className="toast" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, borderColor: `${toast.c}44` }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: toast.c, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}
