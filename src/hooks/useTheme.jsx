import React, { createContext, useContext, useState, useEffect } from 'react'

const DARK = {
  bg:'#0d0f12', sidebar:'#111318', panel:'#161b22', panelHov:'#1c2230',
  border:'#21262d', borderLt:'#30363d',
  text:'#e6edf3', textMd:'#8b949e', textDim:'#484f58',
  accent:'#58a6ff', accentBg:'#58a6ff14', accentLt:'#79c0ff',
  green:'#3fb950', greenBg:'#3fb95014',
  amber:'#d29922', amberBg:'#d2992214',
  red:'#f85149', redBg:'#f8514914',
  blue:'#58a6ff', purple:'#bc8cff',
  shadow:'0 8px 32px rgba(0,0,0,.55)',
  shadowLg:'0 24px 64px rgba(0,0,0,.75)',
}

const ThemeContext = createContext({ mode:'dark', setMode:()=>{}, isDark:true, T:DARK })

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark')
  const T = DARK
  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark:true, T }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
