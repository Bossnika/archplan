import React, { useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const T = {
  bg:'#0d0f12', sidebar:'#111318', panel:'#161b22',
  border:'#21262d', text:'#e6edf3', textDim:'#484f58',
  accent:'#58a6ff', green:'#3fb950', amber:'#d29922', red:'#f85149',
}

export default function App() {
  const [dark, setDark] = useState(true)
  const theme = dark ? T : { ...T, bg:'#f6f8fa', sidebar:'#fff', panel:'#fff', border:'#d0d7de', text:'#24292f', textDim:'#8c959f' }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 40, textAlign: 'center', maxWidth: 500 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📐</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>ArchPlan</h1>
        <p style={{ color: theme.textDim, marginBottom: 20 }}>Studio Office Kolectiv — Project Manager</p>
        <div style={{ background: `${theme.green}18`, border: `1px solid ${theme.green}44`, borderRadius: 10, padding: 16, color: theme.green, fontSize: 14 }}>
          ✅ Aplicația este live pe internet!<br/>
          Adresa: archplan.vercel.app
        </div>
        <button onClick={() => setDark(d => !d)}
          style={{ marginTop: 20, background: theme.accent, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {dark ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
      </div>
    </div>
  )
}
