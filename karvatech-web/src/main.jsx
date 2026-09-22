import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './admin/admin.css'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'

function isAdminRoute() {
  return window.location.hash.toLowerCase().startsWith('#/admin')
}

function Root() {
  const [admin, setAdmin] = useState(isAdminRoute)

  useEffect(() => {
    const onHash = () => setAdmin(isAdminRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return admin ? <AdminApp /> : <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)