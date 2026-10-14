import { Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PublicCatalog from './pages/PublicCatalog'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PublicCatalog />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="*"
          element={
            <div className="center-page">
              <p>Halaman tidak ditemukan.</p>
              <Link className="btn primary" to="/">
                ← Kembali
              </Link>
            </div>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
