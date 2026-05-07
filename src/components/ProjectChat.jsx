// src/components/ProjectChat.jsx
import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Paperclip, Link2, X, Hash, AtSign, ChevronDown,
  FileText, Image, ExternalLink, Trash2, MessageSquare,
  Layers, Building2, CheckCircle, Plus, UserPlus, Users, Smile
} from 'lucide-react'
import { useTheme }        from '../hooks/useTheme.jsx'
import { useAuth }         from '../hooks/useAuth.jsx'
import { listenMessages, sendMessage, deleteMessage, listenMembers, addMember, removeMember } from '../lib/db.js'
import { uploadFile }      from '../lib/storageService.js'
import { sendMentionEmail } from '../lib/emailService.js'
import { CHAT_CHANNELS, AVATAR_COLORS } from '../lib/constants.js'

// ── Avatar component ─────────────────────────────────────────────────────────
export function Avatar({ name='?', email='', size=28, color, style={} }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
  const bg = color || AVATAR_COLORS[
    (email || name).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  ]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      letterSpacing: '-.5px', userSelect: 'none',
      border: `2px solid ${bg}44`, ...style
    }}>
      {initials || '?'}
    </div>
  )
}

// ── Mention parser: renders @Name as highlighted spans ────────────────────────
function MessageText({ text, T }) {
  const parts = text.split(/(@\w[\w\s]*?(?=\s@|\s|$))/g)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('@')
          ? <span key={i} style={{ color: T.accent, fontWeight: 600, background: `${T.accent}18`, borderRadius: 3, padding: '0 3px' }}>{part}</span>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg, isMine, members, canDelete, onDelete, T }) {
  const [showDel, setShowDel] = useState(false)
  const member = members.find(m => m.uid === msg.uid)
  const name   = member?.name || msg.displayName || 'Utilizator'
  const email  = member?.email || msg.email || ''

  const timeStr = msg.createdAt?.toDate
    ? msg.createdAt.toDate().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div
      style={{ display: 'flex', gap: 10, padding: '6px 0', alignItems: 'flex-start', position: 'relative' }}
      onMouseEnter={() => setShowDel(true)}
      onMouseLeave={() => setShowDel(false)}
    >
      <Avatar name={name} email={email} size={30}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{name}</span>
          <span style={{ fontSize: 10, color: T.textDim }}>{timeStr}</span>
          {msg.edited && <span style={{ fontSize: 9, color: T.textDim, fontStyle: 'italic' }}>(editat)</span>}
        </div>

        {/* Text */}
        {msg.text && (
          <div style={{ fontSize: 13, color: T.textMd, lineHeight: 1.55, wordBreak: 'break-word' }}>
            <MessageText text={msg.text} T={T}/>
          </div>
        )}

        {/* Attachments */}
        {(msg.attachments || []).map(att => (
          <div key={att.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 5,
            background: T.panelHov, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 10px', maxWidth: 300 }}>
            {att.external ? <Link2 size={12} color={T.textMd}/> : <FileText size={12} color={T.textMd}/>}
            <a href={att.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: T.blue, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {att.name}
            </a>
            <ExternalLink size={10} color={T.textDim}/>
          </div>
        ))}
      </div>

      {/* Delete button */}
      {canDelete && showDel && (
        <button onClick={() => onDelete(msg.id)}
          style={{ position: 'absolute', right: 0, top: 6, background: T.redBg, border: `1px solid ${T.red}44`,
            borderRadius: 5, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
            color: T.red, fontSize: 10 }}>
          <Trash2 size={10}/>
        </button>
      )}
    </div>
  )
}

// ── Mention dropdown ──────────────────────────────────────────────────────────
function MentionDropdown({ query, members, onSelect, T }) {
  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(query.toLowerCase()) ||
    m.email?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)

  if (!filtered.length) return null
  return (
    <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: T.panel,
      border: `1px solid ${T.borderLt}`, borderRadius: 9, padding: 4, marginBottom: 4,
      boxShadow: T.shadowLg, zIndex: 50, maxHeight: 220, overflowY: 'auto' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: .8, padding: '4px 8px 6px' }}>
        Membrii proiect
      </div>
      {filtered.map(m => (
        <div key={m.id} onClick={() => onSelect(m)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7,
            cursor: 'pointer', transition: 'background .1s' }}
          onMouseEnter={e => e.currentTarget.style.background = T.panelHov}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Avatar name={m.name} email={m.email} size={24}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{m.name}</div>
            <div style={{ fontSize: 10, color: T.textDim }}>{m.email}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Member management panel ───────────────────────────────────────────────────
function MembersPanel({ projectId, members, currentUser, onAdd, onRemove, T }) {
  const [newEmail, setNewEmail]  = useState('')
  const [newName,  setNewName]   = useState('')
  const [adding,   setAdding]    = useState(false)
  const [showForm, setShowForm]  = useState(false)

  const handleAdd = async () => {
    if (!newEmail.trim() || !newName.trim()) return
    setAdding(true)
    await onAdd({ name: newName.trim(), email: newEmail.trim(), uid: null, role: 'member' })
    setNewEmail(''); setNewName(''); setShowForm(false); setAdding(false)
  }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.sidebar,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Users size={13} color={T.textMd}/>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Membrii proiectului</span>
          <span style={{ fontSize: 10, color: T.textDim, background: T.border, borderRadius: 10, padding: '1px 6px' }}>{members.length}</span>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.accentBg, border: `1px solid ${T.accent}44`,
            color: T.accentLt, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
          <UserPlus size={11}/>Adaugă
        </button>
      </div>

      {showForm && (
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nume complet"
              style={{ flex: 1, minWidth: 120, background: T.panel, border: `1px solid ${T.borderLt}`, borderRadius: 7,
                padding: '7px 10px', color: T.text, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}/>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email"
              style={{ flex: 2, minWidth: 160, background: T.panel, border: `1px solid ${T.borderLt}`, borderRadius: 7,
                padding: '7px 10px', color: T.text, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}/>
            <button onClick={handleAdd} disabled={adding}
              style={{ background: T.accent, border: 'none', borderRadius: 7, padding: '7px 14px', color: '#fff',
                fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', opacity: adding ? .7 : 1 }}>
              {adding ? '…' : 'Adaugă'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 9px',
                color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={13}/>
            </button>
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 5 }}>
            Membrul va primi notificări email când este menționat în chat.
          </div>
        </div>
      )}

      <div style={{ padding: '8px' }}>
        {members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: T.textDim, fontSize: 12 }}>Niciun membru adăugat</div>
        )}
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            borderRadius: 8, transition: 'background .1s' }}
            onMouseEnter={e => e.currentTarget.style.background = T.panelHov}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Avatar name={m.name} email={m.email} size={32}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: T.textDim }}>{m.email}</div>
            </div>
            {m.uid !== currentUser?.uid && (
              <button onClick={() => onRemove(m.id)}
                style={{ background: 'transparent', border: 'none', color: T.textDim, cursor: 'pointer',
                  padding: 4, borderRadius: 5, display: 'flex', alignItems: 'center', opacity: 0 }}
                className="del-btn">
                <X size={13}/>
              </button>
            )}
          </div>
        ))}
      </div>
      <style>{`.del-btn { opacity: 0 !important; } div:hover > .del-btn { opacity: 1 !important; }`}</style>
    </div>
  )
}

// ── MAIN CHAT COMPONENT ───────────────────────────────────────────────────────
export default function ProjectChat({ project, T: TProp }) {
  const { T: TCtx }   = useTheme()
  const T             = TProp || TCtx
  const { user }      = useAuth()

  const [channel,   setChannel]   = useState('general')
  const [messages,  setMessages]  = useState([])
  const [members,   setMembers]   = useState([])
  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  // Mention state
  const [mentionQuery,    setMentionQuery]    = useState(null)   // null = closed
  const [mentionStart,    setMentionStart]    = useState(0)

  // Attachment state
  const [pendingAtts,  setPendingAtts]  = useState([])   // [{id,name,url,external?}]
  const [uploading,    setUploading]    = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [extUrl,       setExtUrl]       = useState('')
  const [extName,      setExtName]      = useState('')

  const bottomRef  = useRef()
  const inputRef   = useRef()
  const fileRef    = useRef()

  // Firestore listeners
  useEffect(() => {
    if (!user || !project?.id) return
    const u1 = listenMessages(user.uid, project.id, channel, setMessages)
    const u2 = listenMembers(user.uid, project.id, setMembers)
    return () => { u1(); u2() }
  }, [user, project?.id, channel])

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Text input handler — detect @mention ──────────────────────────────────
  const handleTextChange = (e) => {
    const val = e.target.value
    setText(val)
    const cursor   = e.target.selectionStart
    const before   = val.slice(0, cursor)
    const atMatch  = before.match(/@(\w[\w\s]*)$/)
    if (atMatch) {
      setMentionQuery(atMatch[1])
      setMentionStart(before.lastIndexOf('@'))
    } else {
      setMentionQuery(null)
    }
  }

  const selectMention = (member) => {
    const before = text.slice(0, mentionStart)
    const after  = text.slice(inputRef.current?.selectionStart || text.length)
    setText(`${before}@${member.name} ${after}`)
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const att = await uploadFile(user.uid, project.id, `chat/${channel}`, file, () => {})
      setPendingAtts(a => [...a, att])
    } catch(err) { console.error(err) }
    finally { setUploading(false); e.target.value = '' }
  }

  const addExtLink = () => {
    if (!extUrl.trim()) return
    setPendingAtts(a => [...a, { id: Math.random().toString(36).slice(2), name: extName || extUrl, url: extUrl, external: true }])
    setExtUrl(''); setExtName(''); setShowLinkForm(false)
  }

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if ((!text.trim() && !pendingAtts.length) || sending) return
    setSending(true)

    const msgData = {
      text:        text.trim(),
      uid:         user.uid,
      displayName: user.displayName || user.email,
      email:       user.email,
      attachments: pendingAtts,
    }

    try {
      await sendMessage(user.uid, project.id, channel, msgData)

      // Extract @mentions and send email notifications
      const mentionedNames = [...new Set((text.match(/@([\w][^\s@]*(?:\s[\w][^\s@]*)*)/g) || []).map(m => m.slice(1).trim()))]
      for (const mName of mentionedNames) {
        const member = members.find(m => m.name?.toLowerCase() === mName.toLowerCase())
        if (member?.email && member.email !== user.email) {
          await sendMentionEmail({
            toEmail:     member.email,
            toName:      member.name,
            mentionedBy: user.displayName || user.email,
            projectName: project.name,
            channel,
            messageText: text.trim(),
            projectId:   project.id,
          })
        }
      }

      setText('')
      setPendingAtts([])
    } catch(err) { console.error(err) }
    finally { setSending(false) }
  }, [text, pendingAtts, sending, user, project, channel, members])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
      e.preventDefault()
      handleSend()
    }
  }

  const channelObj = CHAT_CHANNELS.find(c => c.id === channel)

  // ── CHANNEL TAB ICONS ─────────────────────────────────────────────────────
  const ChanIcon = ({ id }) => {
    const icons = { general: MessageSquare, cu: FileText, avize: Building2, pt: Layers, ac: CheckCircle }
    const I = icons[id] || Hash
    return <I size={12}/>
  }

  const inp = {
    background: T.bg, border: `1px solid ${T.borderLt}`, borderRadius: 7,
    padding: '7px 10px', color: T.text, fontSize: 12, outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 520, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', background: T.panel }}>

      {/* ── Left: channel list ── */}
      <div style={{ width: 180, background: T.sidebar, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: .8 }}>Canale</div>
        </div>
        <div style={{ flex: 1, padding: '6px' }}>
          {CHAT_CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => setChannel(ch.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 7,
                background: channel === ch.id ? `${T.accent}14` : 'transparent',
                color: channel === ch.id ? T.text : T.textMd,
                border: `1px solid ${channel === ch.id ? T.accent + '33' : 'transparent'}`,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                fontWeight: channel === ch.id ? 600 : 400, textAlign: 'left',
                transition: 'all .12s' }}
              onMouseEnter={e => { if (channel !== ch.id) e.currentTarget.style.background = T.panelHov }}
              onMouseLeave={e => { if (channel !== ch.id) e.currentTarget.style.background = 'transparent' }}>
              <ChanIcon id={ch.id}/>
              {ch.label}
            </button>
          ))}
        </div>

        {/* Members toggle */}
        <div style={{ padding: '8px 6px', borderTop: `1px solid ${T.border}` }}>
          <button onClick={() => setShowMembers(s => !s)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 7,
              background: showMembers ? T.accentBg : 'transparent', color: showMembers ? T.accentLt : T.textMd,
              border: `1px solid ${showMembers ? T.accent + '33' : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textAlign: 'left' }}>
            <Users size={12}/>
            Membrii
            <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textDim, background: T.border, borderRadius: 8, padding: '1px 5px' }}>
              {members.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Right: main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {showMembers ? (
          /* Members panel */
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <MembersPanel
              projectId={project.id}
              members={members}
              currentUser={user}
              T={T}
              onAdd={data => addMember(user.uid, project.id, data)}
              onRemove={id => removeMember(user.uid, project.id, id)}
            />
          </div>
        ) : (
          <>
            {/* Channel header */}
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, background: T.sidebar, flexShrink: 0 }}>
              <ChanIcon id={channel}/>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{channelObj?.label}</span>
              <span style={{ fontSize: 11, color: T.textDim, marginLeft: 4 }}>— {project.name}</span>
              {/* member avatars */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                {members.slice(0, 5).map((m, i) => (
                  <Avatar key={m.id} name={m.name} email={m.email} size={22}
                    style={{ marginLeft: i === 0 ? 0 : -6, border: `2px solid ${T.sidebar}`, zIndex: 5 - i }}/>
                ))}
                {members.length > 5 && (
                  <span style={{ fontSize: 10, color: T.textDim, marginLeft: 4 }}>+{members.length - 5}</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: T.textDim }}>
                  <MessageSquare size={28} color={T.borderLt} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }}/>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>Niciun mesaj în {channelObj?.label}</div>
                  <div style={{ fontSize: 11 }}>Fii primul care scrie ceva</div>
                </div>
              )}
              {messages.map((msg, i) => {
                const prev = messages[i - 1]
                const showDate = !prev || msg.createdAt?.toDate?.().toDateString() !== prev.createdAt?.toDate?.().toDateString()
                return (
                  <div key={msg.id}>
                    {showDate && msg.createdAt?.toDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
                        <div style={{ flex: 1, height: 1, background: T.border }}/>
                        <span style={{ fontSize: 10, color: T.textDim, flexShrink: 0 }}>
                          {msg.createdAt.toDate().toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        <div style={{ flex: 1, height: 1, background: T.border }}/>
                      </div>
                    )}
                    <MessageBubble
                      msg={msg}
                      isMine={msg.uid === user?.uid}
                      members={members}
                      canDelete={msg.uid === user?.uid}
                      onDelete={id => deleteMessage(user.uid, project.id, channel, id)}
                      T={T}
                    />
                  </div>
                )
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Pending attachments preview */}
            {pendingAtts.length > 0 && (
              <div style={{ padding: '6px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 6, flexWrap: 'wrap', background: T.panelHov }}>
                {pendingAtts.map(att => (
                  <div key={att.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.bg,
                    border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, color: T.textMd }}>
                    {att.external ? <Link2 size={11}/> : <FileText size={11}/>}
                    <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                    <button onClick={() => setPendingAtts(a => a.filter(x => x.id !== att.id))}
                      style={{ background: 'transparent', border: 'none', color: T.textDim, cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <X size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* External link form */}
            {showLinkForm && (
              <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.border}`, background: T.bg, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 2, minWidth: 180 }}>
                  <div style={{ fontSize: 9, color: T.textDim, marginBottom: 3, textTransform: 'uppercase', letterSpacing: .6 }}>URL (Drive / Dropbox)</div>
                  <input value={extUrl} onChange={e => setExtUrl(e.target.value)} placeholder="https://drive.google.com/…" style={{ ...inp, width: '100%', boxSizing: 'border-box' }}/>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.textDim, marginBottom: 3, textTransform: 'uppercase', letterSpacing: .6 }}>Denumire</div>
                  <input value={extName} onChange={e => setExtName(e.target.value)} placeholder="Document…" style={{ ...inp, width: '100%', boxSizing: 'border-box' }}/>
                </div>
                <button onClick={addExtLink} style={{ background: T.accent, border: 'none', borderRadius: 7, padding: '7px 14px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', flexShrink: 0 }}>Adaugă</button>
                <button onClick={() => setShowLinkForm(false)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 9px', color: T.textDim, cursor: 'pointer', display: 'flex', flexShrink: 0 }}><X size={13}/></button>
              </div>
            )}

            {/* Input area */}
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, flexShrink: 0, position: 'relative' }}>
              {/* Mention dropdown */}
              {mentionQuery !== null && (
                <MentionDropdown query={mentionQuery} members={members} onSelect={selectMention} T={T}/>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: T.bg, border: `1px solid ${T.borderLt}`, borderRadius: 9, padding: '8px 10px' }}>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 3, alignSelf: 'flex-end', paddingBottom: 1 }}>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload fișier"
                    style={{ background: 'transparent', border: 'none', color: uploading ? T.textDim : T.textMd, cursor: 'pointer', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                    {uploading ? <span style={{ fontSize: 10 }}>…</span> : <Paperclip size={15}/>}
                  </button>
                  <button onClick={() => setShowLinkForm(s => !s)} title="Adaugă link Drive/Dropbox"
                    style={{ background: 'transparent', border: 'none', color: showLinkForm ? T.accent : T.textMd, cursor: 'pointer', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                    <Link2 size={15}/>
                  </button>
                  <button onClick={() => { setText(t => t + '@'); inputRef.current?.focus() }} title="Menționează cineva"
                    style={{ background: 'transparent', border: 'none', color: T.textMd, cursor: 'pointer', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                    <AtSign size={15}/>
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Scrie în #${channelObj?.label}… (Enter trimite, Shift+Enter linie nouă, @ menționează)`}
                  rows={1}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, fontSize: 13,
                    outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                    maxHeight: 100, overflowY: 'auto' }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                />

                {/* Send button */}
                <button onClick={handleSend} disabled={sending || (!text.trim() && !pendingAtts.length)}
                  style={{ background: (text.trim() || pendingAtts.length) && !sending ? T.accent : T.border,
                    border: 'none', borderRadius: 7, padding: '6px 10px', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'background .15s',
                    opacity: sending ? .7 : 1 }}>
                  <Send size={14}/>
                </button>
              </div>

              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg,.zip"/>

              <div style={{ fontSize: 10, color: T.textDim, marginTop: 5, paddingLeft: 2 }}>
                Enter = trimite · Shift+Enter = linie nouă · @ = menționează
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
