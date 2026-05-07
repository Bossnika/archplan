// src/hooks/useTheme.js
import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'
import { THEME_DARK, THEME_LIGHT } from '../lib/constants.js'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('arch_theme') || 'dark')

  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark  = mode === 'dark' || (mode === 'auto' && sysDark)
  const T       = isDark ? THEME_DARK : THEME_LIGHT

  useEffect(() => {
    localStorage.setItem('arch_theme', mode)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [mode, isDark])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (mode === 'auto') document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, T }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
