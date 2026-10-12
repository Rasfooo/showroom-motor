import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, slugify } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showroom, setShowroom] = useState('')
  const [wa, setWa] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/dashboard')
      } else {
        // Daftar: buat akun auth dulu
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        const uid = data.user?.id
        if (!uid) {
          setInfo('Cek email kamu untuk konfirmasi, lalu login.')
          setLoading(false)
          return
        }
        // Buat profil showroom
        const slug = slugify(showroom) || `toko-${uid.slice(0, 6)}`
        const { error: pErr } = await supabase.from('sellers').insert({
          id: uid,
          email,
          showroom_name: showroom,
          slug,
          whatsapp: wa.replace(/[^0-9]/g, ''),
          location,
        })
        if (pErr && pErr.code !== '23505') throw pErr // 23505 = slug sudah dipakai
        // Auto login
        const { error: lErr } = await signIn(email, password)
        if (lErr) throw lErr
        navigate('/dashboard')
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
        <h1 className="brand">🏍️ Showroom Motor</h1>
        <p className="muted">
          {mode === 'signin'
            ? 'Masuk ke dashboard showroom kamu'
            : 'Buat akun & showroom baru'}
        </p>

        <div className="tabs">
          <button
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => setMode('signin')}
            type="button"
          >
            Masuk
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
            type="button"
          >
            Daftar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="toko@email.com"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Minimal 6 karakter"
          />

          {mode === 'signup' && (
            <>
              <label>Nama Showroom</label>
              <input
                type="text"
                value={showroom}
                onChange={(e) => setShowroom(e.target.value)}
                required
                placeholder="Contoh: Motor Jaya Abadi"
              />
              <label>Nomor WhatsApp</label>
              <input
                type="tel"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
                required
                placeholder="6281234567890"
              />
              <label>Lokasi</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kota, contoh: Bekasi"
              />
            </>
          )}

          {error && <div className="alert error">{error}</div>}
          {info && <div className="alert info">{info}</div>}

          <button className="btn primary" disabled={loading} type="submit">
            {loading ? 'Memproses...' : mode === 'signin' ? 'Masuk' : 'Buat Showroom'}
          </button>
        </form>

        <p className="muted center">
          {mode === 'signin' ? (
            <>
              Belum punya akun?{' '}
              <a onClick={() => setMode('signup')}>Daftar di sini</a>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <a onClick={() => setMode('signin')}>Masuk</a>
            </>
          )}
        </p>
        <p className="muted center">
          <Link to="/">← Lihat katalog publik</Link>
        </p>
      </div>
    </div>
  )
}
