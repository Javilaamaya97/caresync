import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { CaregiverProvider } from './context/CaregiverContext'

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <AuthProvider>
  <CaregiverProvider>
    <App />
  </CaregiverProvider>
</AuthProvider>
  </StrictMode>,
)