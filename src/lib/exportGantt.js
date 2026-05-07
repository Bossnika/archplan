// src/lib/exportGantt.js
import jsPDF from 'jspdf'
import { fmt, diffDays } from './utils.js'
import { GC, STATUS, COMPANY } from './constants.js'

/**
 * Export Gantt chart as A1 landscape PDF
 * A1 = 841 × 594 mm → at 72dpi = 2384 × 1684 px (jsPDF uses mm)
 */
export async function exportGanttPDF(project) {
  const { phases, name, client, startDate } = project

  // A1 landscape dimensions in mm
  const W = 841, H = 594
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a1' })

  // ── Fonts & colors ──────────────────────────────────────────────────────────
  const COL = {
    bg:      [13, 15, 18],
    panel:   [22, 27, 34],
    border:  [33, 38, 45],
    text:    [230, 237, 243],
    textDim: [72, 79, 88],
    accent:  [88, 166, 255],
    green:   [63, 185, 80],
    amber:   [210, 153, 34],
    red:     [248, 81, 73],
  }

  const groupHex = { CU: [247,183,49], Avize: [61,158,255], PT: [198,120,221], AC: [0,201,141] }

  // ── Background ──────────────────────────────────────────────────────────────
  pdf.setFillColor(...COL.bg)
  pdf.rect(0, 0, W, H, 'F')

  // ── Header band ─────────────────────────────────────────────────────────────
  pdf.setFillColor(...COL.panel)
  pdf.rect(0, 0, W, 28, 'F')
  pdf.setFillColor(...COL.accent)
  pdf.rect(0, 0, 6, 28, 'F')

  // Logo text
  pdf.setTextColor(228, 230, 235)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ARCHPLAN', 12, 11)

  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...COL.textDim)
  pdf.text(COMPANY.name.toUpperCase(), 12, 17)
  pdf.text(`${COMPANY.cui}  ·  ${COMPANY.site}`, 12, 22)

  // Project info (center)
  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...COL.text)
  pdf.text(name, W / 2, 12, { align: 'center' })
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...COL.textDim)
  if (client) pdf.text(`Beneficiar: ${client}`, W / 2, 18, { align: 'center' })
  pdf.text(`Start: ${fmt(startDate)}  ·  Export: ${fmt(new Date())}`, W / 2, 23, { align: 'center' })

  // Right: legend
  const legendX = W - 160
  pdf.setFontSize(7)
  Object.entries(GC).forEach(([g, hex], i) => {
    const rgb = groupHex[g]
    const lx  = legendX + i * 38
    pdf.setFillColor(...rgb)
    pdf.roundedRect(lx, 8, 4, 4, 0.5, 0.5, 'F')
    pdf.setTextColor(...COL.textDim)
    pdf.text(g, lx + 6, 12)
  })

  // ── Layout constants ────────────────────────────────────────────────────────
  const marginL = 12, marginR = 12
  const labelW  = 110   // phase name column width
  const chartX  = marginL + labelW + 4
  const chartW  = W - chartX - marginR
  const rowH    = 14
  const headerH = 28
  const tableTop = headerH + 12

  // ── Date axis ───────────────────────────────────────────────────────────────
  const firstDate = phases[0]?.startDate
  const lastDate  = phases[phases.length - 1]?.endDate
  const totalDays = Math.max(1, diffDays(firstDate, lastDate))

  // Draw month labels on axis
  if (firstDate && lastDate) {
    let cursor = new Date(firstDate)
    const endDt = new Date(lastDate)
    pdf.setFontSize(6)
    pdf.setTextColor(...COL.textDim)
    while (cursor <= endDt) {
      const pct = diffDays(firstDate, cursor.toISOString().slice(0,10)) / totalDays
      const x   = chartX + pct * chartW
      const label = cursor.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' })
      pdf.setDrawColor(...COL.border)
      pdf.setLineWidth(0.2)
      pdf.line(x, tableTop - 2, x, tableTop + phases.length * rowH)
      pdf.text(label, x + 1, tableTop - 4)
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    }
  }

  // ── TODAY line ───────────────────────────────────────────────────────────────
  const todayPct = Math.min(1, Math.max(0, diffDays(firstDate, new Date().toISOString().slice(0,10)) / totalDays))
  const todayX   = chartX + todayPct * chartW
  pdf.setDrawColor(255, 82, 82)
  pdf.setLineWidth(0.6)
  pdf.line(todayX, tableTop - 6, todayX, tableTop + phases.length * rowH + 2)
  pdf.setFontSize(6)
  pdf.setTextColor(255, 82, 82)
  pdf.text('AZI', todayX + 1, tableTop - 7)

  // ── Phase rows ───────────────────────────────────────────────────────────────
  phases.forEach((ph, i) => {
    const y    = tableTop + i * rowH
    const rgb  = groupHex[ph.group] || [124, 77, 255]
    const done = ph.status === 'approved'

    // Alternating row bg
    if (i % 2 === 0) {
      pdf.setFillColor(255, 255, 255)
      pdf.setGlobalAlpha(0.02)
      pdf.rect(marginL, y, W - marginL - marginR, rowH, 'F')
      pdf.setGlobalAlpha(1)
    }

    // Group dot
    pdf.setFillColor(...rgb)
    pdf.circle(marginL + 3, y + rowH / 2, 1.5, 'F')

    // Phase name
    pdf.setFontSize(7.5)
    pdf.setFont('helvetica', done ? 'normal' : 'bold')
    if (done) { pdf.setTextColor(COL.textDim[0], COL.textDim[1], COL.textDim[2]) }
    else { pdf.setTextColor(COL.text[0], COL.text[1], COL.text[2]) }
    const nameText = ph.name.length > 32 ? ph.name.slice(0, 30) + '…' : ph.name
    pdf.text(nameText, marginL + 7, y + 6)

    // Group tag
    pdf.setFontSize(5.5)
    pdf.setTextColor(...rgb)
    pdf.text(ph.group, marginL + 7, y + 10.5)

    // Status
    const st = STATUS[ph.status]
    pdf.setFontSize(6)
    if (done) { pdf.setTextColor(COL.green[0], COL.green[1], COL.green[2]) } else { pdf.setTextColor(COL.textDim[0], COL.textDim[1], COL.textDim[2]) }
    pdf.text(st?.label || '', marginL + 72, y + 7)

    // Dates
    pdf.setFontSize(5.5)
    pdf.setTextColor(...COL.textDim)
    pdf.text(`${fmt(ph.startDate)} → ${fmt(ph.endDate)}`, marginL + 7, y + rowH - 2)

    // Bar background
    pdf.setFillColor(...COL.panel)
    pdf.roundedRect(chartX, y + 2, chartW, rowH - 4, 1, 1, 'F')

    // Bar fill
    const barLeft  = diffDays(firstDate, ph.startDate) / totalDays
    const barWidth = Math.max(0.5, diffDays(ph.startDate, ph.endDate) / totalDays)
    const bx = chartX + barLeft * chartW
    const bw = barWidth * chartW

    pdf.setFillColor(rgb[0], rgb[1], rgb[2])
    pdf.roundedRect(bx, y + 3, bw, rowH - 6, 1, 1, 'F')

    if (done) {
      pdf.setFontSize(6)
      pdf.setTextColor(0, 0, 0)
      pdf.text('✓', bx + bw / 2, y + rowH / 2 + 1, { align: 'center' })
    }

    // Row separator
    pdf.setDrawColor(...COL.border)
    pdf.setLineWidth(0.1)
    pdf.line(marginL, y + rowH, W - marginR, y + rowH)
  })

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = H - 10
  pdf.setFillColor(...COL.panel)
  pdf.rect(0, footerY - 6, W, 16, 'F')
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COL.textDim)
  pdf.text(`${COMPANY.name}  ·  ${COMPANY.cui}  ·  ${COMPANY.site}  ·  ${COMPANY.email}`, W / 2, footerY, { align: 'center' })
  pdf.text(`Document generat automat de ArchPlan  ·  ${new Date().toLocaleString('ro-RO')}`, W / 2, footerY + 5, { align: 'center' })

  // ── Save ────────────────────────────────────────────────────────────────────
  const fileName = `Gantt_${name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`
  pdf.save(fileName)
}
