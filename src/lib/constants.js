// src/lib/constants.js

export const COMPANY = {
  name:    'Studio Office Kolectiv',
  cui:     'CUI 32238680',
  site:    'www.studiokolectiv.ro',
  email:   'office@studiokolectiv.ro',
  phone:   '+40 000 000 000',
  address: 'România',
  tagline: 'Arhitectură · Urbanism · Design',
}

// ── Design tokens ─────────────────────────────────────────────────────────────
export const THEME_DARK = {
  bg:'#0d0f12', sidebar:'#111318', panel:'#161b22', panelHov:'#1c2230',
  border:'#21262d', borderLt:'#30363d',
  text:'#e6edf3', textMd:'#8b949e', textDim:'#484f58',
  accent:'#58a6ff', accentBg:'#58a6ff14', accentLt:'#79c0ff',
  green:'#3fb950', greenBg:'#3fb95014',
  amber:'#d29922', amberBg:'#d2992214',
  red:'#f85149',   redBg:'#f8514914',
  blue:'#58a6ff',  purple:'#bc8cff', purpleBg:'#bc8cff14',
  shadow:'0 8px 32px rgba(0,0,0,.55)',
  shadowLg:'0 24px 64px rgba(0,0,0,.75)',
}

export const THEME_LIGHT = {
  bg:'#f6f8fa', sidebar:'#ffffff', panel:'#ffffff', panelHov:'#f6f8fa',
  border:'#d0d7de', borderLt:'#c6cdd5',
  text:'#24292f', textMd:'#57606a', textDim:'#8c959f',
  accent:'#0969da', accentBg:'#0969da0f', accentLt:'#0550ae',
  green:'#1a7f37', greenBg:'#1a7f3710',
  amber:'#9a6700', amberBg:'#9a670010',
  red:'#cf222e',   redBg:'#cf222e10',
  blue:'#0969da',  purple:'#8250df', purpleBg:'#8250df10',
  shadow:'0 4px 16px rgba(0,0,0,.10)',
  shadowLg:'0 16px 48px rgba(0,0,0,.16)',
}

// ── Group colors ──────────────────────────────────────────────────────────────
export const GC = {
  CU:    '#d29922',
  Avize: '#58a6ff',
  PT:    '#bc8cff',
  AC:    '#3fb950',
}

// ── Status (no emoji — icon name referenced from Lucide in components) ────────
export const STATUS = {
  pending:     { label: 'De făcut',   icon: 'Circle',      color: '#484f58' },
  in_progress: { label: 'În lucru',   icon: 'Clock',       color: '#d29922' },
  submitted:   { label: 'Depus',      icon: 'FileText',    color: '#58a6ff' },
  approved:    { label: 'Finalizat',  icon: 'CheckCircle', color: '#3fb950' },
  rejected:    { label: 'Respins',    icon: 'AlertCircle', color: '#f85149' },
}

// ── Institutions ──────────────────────────────────────────────────────────────
export const INSTITUTIONS = [
  { id: 'electrica', name: 'Electrica / E.ON / CEZ',               short: 'Electrică', icon: 'Zap',      color: '#d29922',
    steps: ['Solicitare aviz amplasament', 'Depunere documentație tehnică', 'Obținere aviz rețea electrică'] },
  { id: 'gaz',       name: 'Distrigaz / E.ON Gaz',                 short: 'Gaz',       icon: 'Flame',    color: '#f0883e',
    steps: ['Solicitare aviz gaz', 'Depunere documentație', 'Obținere aviz rețea gaz'] },
  { id: 'apa',       name: 'Apă-Canal (RAJAC / local)',            short: 'Apă-Canal', icon: 'Droplets', color: '#58a6ff',
    steps: ['Solicitare aviz apă-canal', 'Depunere documentație branșament', 'Obținere aviz'] },
  { id: 'telecom',   name: 'Telecom (Orange / Vodafone / Telekom)', short: 'Telecom',   icon: 'Radio',    color: '#bc8cff',
    steps: ['Solicitare aviz rețele telecom', 'Depunere documentație', 'Obținere aviz'] },
  { id: 'mediu',     name: 'APM — Protecția Mediului',             short: 'Mediu',     icon: 'Leaf',     color: '#3fb950',
    steps: ['Notificare APM', 'Evaluare impact de mediu', 'Obținere acord de mediu'] },
  { id: 'drumuri',   name: 'DRDP / Primărie — Drumuri',            short: 'Drumuri',   icon: 'Map',      color: '#8b949e',
    steps: ['Solicitare aviz acces carosabil', 'Depunere documentație', 'Obținere aviz drumuri'] },
]

// ── Phase templates ───────────────────────────────────────────────────────────
export const PHASE_TPL = [
  { id: 'cu_doc',   name: 'Elaborare documentație CU',    group: 'CU',    dur: 14 },
  { id: 'cu_dep',   name: 'Depunere cerere CU',           group: 'CU',    dur: 3  },
  { id: 'cu_emit',  name: 'Emitere CU',                   group: 'CU',    dur: 30 },
  { id: 'aviz_doc', name: 'Elaborare documentații avize', group: 'Avize', dur: 21 },
  { id: 'aviz_dep', name: 'Depunere avize instituții',    group: 'Avize', dur: 7  },
  { id: 'aviz_obt', name: 'Obținere avize',               group: 'Avize', dur: 45 },
  { id: 'pt_doc',   name: 'Elaborare PT',                 group: 'PT',    dur: 30 },
  { id: 'pt_ver',   name: 'Verificare proiect',           group: 'PT',    dur: 14 },
  { id: 'ac_dep',   name: 'Depunere dosar AC',            group: 'AC',    dur: 5  },
  { id: 'ac_emit',  name: 'Emitere AC',                   group: 'AC',    dur: 30 },
]

export const REMINDER_THRESHOLDS = [1, 3, 7]

// ── Chat channels ─────────────────────────────────────────────────────────────
export const CHAT_CHANNELS = [
  { id: 'general', label: 'General',  icon: 'MessageSquare' },
  { id: 'cu',      label: 'CU',       icon: 'FileText'      },
  { id: 'avize',   label: 'Avize',    icon: 'Building2'     },
  { id: 'pt',      label: 'PT',       icon: 'Layers'        },
  { id: 'ac',      label: 'Dosar AC', icon: 'CheckCircle'   },
]

// ── Member avatar colors (assigned by index) ─────────────────────────────────
export const AVATAR_COLORS = [
  '#58a6ff','#3fb950','#d29922','#bc8cff','#f0883e',
  '#39d353','#ff7b72','#79c0ff','#ffa657','#56d364',
]
