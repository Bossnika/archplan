import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './hooks/useAuth.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'
import App from './App.jsx'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </AuthProvider>
)
