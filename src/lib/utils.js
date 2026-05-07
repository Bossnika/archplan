// src/lib/utils.js
import { format, differenceInDays, addDays as _addDays, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'
import { PHASE_TPL, INSTITUTIONS } from './constants.js'

export const uid = () => Math.random().toString(36).slice(2, 9)
export const today = () => new Date().toISOString().slice(0, 10)

export const diffDays = (a, b) =>
  differenceInDays(
    typeof b === 'string' ? parseISO(b) : b,
    typeof a === 'string' ? parseISO(a) : a
  )

export const addDays = (d, n) =>
  _addDays(typeof d === 'string' ? parseISO(d) : d, n).toISOString().slice(0, 10)

export const fmt = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'd MMM yyyy', { locale: ro }) }
  catch { return '—' }
}

export const fmtShort = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'd MMM', { locale: ro }) }
  catch { return '—' }
}

// ── Build phases from start date ─────────────────────────────────────────────
export const buildPhases = (startDate) => {
  let cursor = typeof startDate === 'string' ? parseISO(startDate) : startDate
  return PHASE_TPL.map(t => {
    const start = cursor.toISOString().slice(0, 10)
    cursor = _addDays(cursor, t.dur)
    return {
      ...t,
      phaseId:     uid(),
      status:      'pending',
      startDate:   start,
      endDate:     cursor.toISOString().slice(0, 10),
      notes:       '',
      attachments: [],
    }
  })
}

// ── Build avize block ─────────────────────────────────────────────────────────
export const buildAvize = (avizStart) =>
  INSTITUTIONS.map(inst => ({
    instId:      inst.id,
    avizId:      uid(),
    status:      'pending',
    steps:       inst.steps.map((nm, i) => ({
      stepId: uid(),
      name:   nm,
      status: 'pending',
      date:   addDays(avizStart, i * 14),
      note:   '',
    })),
    contactName:  '',
    contactPhone: '',
    dosarNr:      '',
    note:         '',
    attachments:  [],
  }))

// ── Empty beneficiar ──────────────────────────────────────────────────────────
export const emptyBeneficiar = () => ({
  // Personal
  nume: '', prenume: '', cnp: '', telefon: '', email: '',
  // Domiciliu (CI/buletin)
  adresaDomiciliu: '', localitateDomiciliu: '', judetDomiciliu: '',
  // Amplasament (poate diferi!)
  adresaAmplasament: '', localitateAmplasament: '', judetAmplasament: '', siruta: '',
  // Teren
  nrCadastral: '', nrCF: '', suprafata: '', zonaUTR: '',
  // Doc links (Drive / Dropbox)
  docLinks: [],
})

// ── Project completion % ──────────────────────────────────────────────────────
export const projectPct = (phases) => {
  if (!phases?.length) return 0
  return Math.round(phases.filter(p => p.status === 'approved').length / phases.length * 100)
}

// ── Resolve theme object from mode + system preference ────────────────────────
export const resolveTheme = (mode, DARK, LIGHT) => {
  const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return mode === 'dark' || (mode === 'auto' && sysDark) ? DARK : LIGHT
}
