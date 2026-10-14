import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import PasswordInput from '../components/PasswordInput'

// ============================================================
// LOGIN SELLER — pakai USERNAME (dibuat admin), bukan daftar sendiri.
// Reset password -> Supabase kirim link ke email seller.
// ============================================================

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'forgot'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  // username -> email (via RPC supaya bisa dipanggil sebelum login)
  const emailOf = async (uname) => {
    const { data, error } = await supabase.rpc('email_of_username', { uname })
    if (error) throw new Error('Gagal mencari username: ' + error.message)
    if (!data) throw new Error('Username tidak ditemukan.')
    return data
  }

  // Bersihkan karakter aneh yang sering nyempil dari keyboard/autofill HP
  // (mis. tanda kutip guillemet « » atau zero-width space)
  const clean = (s) =>
    String(s)
      .replace(/[\u00AB\u00BB\u201C\u201D\u2018\u2019\u200B-\u200D\uFEFF]/g, '')
      .trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const uname = clean(username)
        const email = await emailOf(uname)
        // Coba password apa adanya dulu; kalau gagal, coba versi bersih
        let { error } = await signIn(email, password)
        if (error && clean(password) !== password) {
          const retry = await signIn(email, clean(password))
          error = retry.error
        }
        if (error) throw new Error('Password salah. Coba lagi.')
        // Admin langsung ke Panel Admin; seller ke dashboard showroom-nya
        const { data: admin } = await supabase.rpc('is_admin')
        navigate(admin ? '/admin' : '/dashboard')
      } else {
        // Lupa password: kirim link reset ke email seller
        const email = await emailOf(username.trim())
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setInfo(
          `Link reset password sudah dikirim ke email seller (${maskEmail(email)}). Cek inbox / spam.`
        )
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="brand">Showroom Motor</h1>
        <p className="muted">
          {mode === 'signin'
            ? 'Masuk ke dashboard showroom kamu'
            : 'Masukkan username untuk reset password'}
        </p>

        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="username dari admin"
          />

          {mode === 'signin' && (
            <>
              <label>Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </>
          )}

          {error && <div className="alert error">{error}</div>}
          {info && <div className="alert info">{info}</div>}

          <button className="btn primary" disabled={loading} type="submit">
            {loading
              ? 'Memproses...'
              : mode === 'signin'
                ? 'Masuk'
                : 'Kirim Link Reset'}
          </button>
        </form>

        <p className="muted center">
          {mode === 'signin' ? (
            <a onClick={() => { setMode('forgot'); setError(''); setInfo('') }}>
              Lupa password?
            </a>
          ) : (
            <a onClick={() => { setMode('signin'); setError(''); setInfo('') }}>
              ← Kembali ke login
            </a>
          )}
        </p>
        <p className="muted center">
          <Link to="/">← Lihat katalog publik</Link>
        </p>
      </div>
    </div>
  )
}

function maskEmail(e) {
  const [u, d] = String(e).split('@')
  if (!d) return e
  const shown = u.slice(0, 2)
  return `${shown}${'*'.repeat(Math.max(1, u.length - 2))}@${d}`
}