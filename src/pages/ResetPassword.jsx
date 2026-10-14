import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ============================================================
// RESET PASSWORD — dibuka dari link yang dikirim Supabase ke email seller.
// Supabase otomatis bikin sesi sementara (recovery), lalu kita update password.
// ============================================================

export default function ResetPassword() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase mengirim token di hash/query — SDK otomatis menangkap sesi recovery
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Kalau sesi sudah ada (token sudah diproses), langsung siap
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setReady(true)
    })
    return () => sub?.subscription?.unsubscribe?.()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (password !== confirm) {
      setError('Password dan konfirmasi tidak sama.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setInfo('Password berhasil diganti! Mengarahkan ke login...')
      await supabase.auth.signOut()
      setTimeout(() => navigate('/auth'), 1500)
    } catch (err) {
      setError(err.message || 'Gagal mengganti password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="brand">Ganti Password</h1>
        {!ready ? (
          <>
            <p className="muted">
              Membuka link reset... Kalau halaman ini tidak berubah, link mungkin
              sudah kedaluwarsa.
            </p>
            <p className="muted center">
              <Link to="/auth">← Kembali ke login</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Password Baru</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
            />
            <label>Ulangi Password Baru</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="Ulangi password"
            />
            {error && <div className="alert error">{error}</div>}
            {info && <div className="alert info">{info}</div>}
            <button className="btn primary" disabled={loading} type="submit">
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}