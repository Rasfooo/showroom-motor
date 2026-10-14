import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, slugify } from '../lib/supabase'

// ============================================================
// HALAMAN ADMIN — khusus pemilik platform.
// Admin bikin akun seller (username + email + password) sekali isi.
// Backend: Edge Function 'admin-create-seller' (service key di server).
// ============================================================

const emptyForm = {
  username: '', email: '', password: '',
  showroom_name: '', whatsapp: '', location: '', theme: 'dark',
}

export default function Admin() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(null) // null = belum dicek
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [created, setCreated] = useState([])   // hasil akun yang baru dibuat
  const [sellers, setSellers] = useState([])   // daftar seller

  useEffect(() => {
    if (!loading && !session) navigate('/auth')
  }, [loading, session, navigate])

  useEffect(() => {
    if (!session) return
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (error) return setIsAdmin(false)
      setIsAdmin(!!data)
      if (data) loadSellers()
    })
  }, [session])

  async function loadSellers() {
    const { data } = await supabase
      .from('sellers')
      .select('id,username,showroom_name,slug,location,theme,email')
      .order('showroom_name')
    setSellers(data || [])
  }

  async function handleCreate(e) {
    e.preventDefault()
    setErr(''); setMsg(''); setBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-seller', {
        body: {
          ...form,
          slug: slugify(form.showroom_name) || form.username,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setCreated((c) => [{ ...form, ...data }, ...c])
      setMsg(`Akun "${data.username}" berhasil dibuat.`)
      setForm(emptyForm)
      loadSellers()
    } catch (e) {
      setErr(e.message || 'Gagal membuat akun')
    } finally {
      setBusy(false)
    }
  }

  async function removeSeller(s) {
    if (!confirm(`Hapus akun seller "${s.showroom_name}"? Motor & datanya ikut terhapus.`)) return
    setErr(''); setMsg('')
    const { data, error } = await supabase.functions.invoke('admin-delete-seller', {
      body: { user_id: s.id },
    })
    if (error || data?.error) return setErr(error?.message || data?.error)
    setMsg(`Akun "${s.showroom_name}" dihapus.`)
    loadSellers()
  }

  if (loading || isAdmin === null) return <div className="center-page">Memuat...</div>
  if (!session) return null
  if (!isAdmin) {
    return (
      <div className="center-page">
        <p>Halaman ini khusus admin.</p>
        <Link className="btn primary" to="/dashboard">← Dashboard saya</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="dash-header">
        <div className="dash-brand">
          <span className="dash-logo placeholder">🛠️</span>
          <div>
            <h1>Panel Admin</h1>
            <p className="muted">{sellers.length} showroom terdaftar</p>
          </div>
        </div>
        <div className="header-actions">
          <Link className="btn ghost" to="/dashboard">Dashboard Saya</Link>
          <Link className="btn ghost" to="/">Katalog</Link>
        </div>
      </header>

      {msg && <div className="alert info">{msg}</div>}
      {err && <div className="alert error">{err}</div>}

      {/* Form bikin akun seller */}
      <form className="panel" onSubmit={handleCreate}>
        <h3>Bikin Akun Seller</h3>
        <p className="muted small" style={{ marginTop: -6 }}>
          Isi data, lalu kirim username + password ke seller via WhatsApp.
        </p>
        <div className="form-grid">
          <div>
            <label>Username (buat login) *</label>
            <input value={form.username} required autoCapitalize="none"
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
              placeholder="tokoamir" />
          </div>
          <div>
            <label>Email Seller (buat reset password) *</label>
            <input type="email" value={form.email} required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="amir@gmail.com" />
          </div>
          <div>
            <label>Password Awal *</label>
            <input value={form.password} required minLength={6}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="minimal 6 karakter" />
          </div>
          <div>
            <label>Nama Showroom *</label>
            <input value={form.showroom_name} required
              onChange={(e) => setForm({ ...form, showroom_name: e.target.value })}
              placeholder="Motor Jaya Abadi" />
          </div>
          <div>
            <label>Nomor WhatsApp</label>
            <input value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="6281234567890" />
          </div>
          <div>
            <label>Lokasi</label>
            <input value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Bekasi" />
          </div>
        </div>
        <button className="btn primary" disabled={busy}>
          {busy ? 'Membuat akun...' : 'Buat Akun Seller'}
        </button>
      </form>

      {/* Hasil akun baru — siap dikirim ke seller */}
      {created.length > 0 && (
        <div className="panel">
          <h3>Akun Baru Dibuat — Kirim ke Seller</h3>
          {created.map((c) => (
            <div key={c.user_id || c.email} className="cred-card">
              <div><strong>{c.showroom_name}</strong></div>
              <div className="cred-row"><span>Login</span><code>{window.location.origin}/auth</code></div>
              <div className="cred-row"><span>Username</span><code>{c.username}</code></div>
              <div className="cred-row"><span>Password</span><code>{c.password}</code></div>
              <div className="cred-row"><span>Katalog</span>
                <code>{window.location.origin}/?toko={c.slug}</code></div>
              <button className="btn tiny ghost" type="button" onClick={() => {
                const t = `Halo! Akun showroom kamu sudah siap 🏍️\n\n` +
                  `Login: ${window.location.origin}/auth\n` +
                  `Username: ${c.username}\nPassword: ${c.password}\n\n` +
                  `Katalog kamu: ${window.location.origin}/?toko=${c.slug}\n\n` +
                  `Silakan login, upload motor, dan pilih tema favoritmu!`
                navigator.clipboard?.writeText(t)
                setMsg('Teks siap kirim dicopy ke clipboard ✅')
              }}>Copy pesan WA</button>
            </div>
          ))}
        </div>
      )}

      {/* Daftar seller */}
      <h3 className="section-title">Showroom Terdaftar ({sellers.length})</h3>
      {sellers.length === 0 ? (
        <p className="muted">Belum ada seller. Buat akun pertama di form atas.</p>
      ) : (
        <div className="seller-list">
          {sellers.map((s) => (
            <div className="seller-row" key={s.id}>
              <div className="seller-info">
                <strong>{s.showroom_name}</strong>
                <span className="muted small">
                  @{s.username || '—'} · {s.location || 'tanpa lokasi'} · tema {s.theme || 'dark'}
                </span>
              </div>
              <div className="seller-actions">
                <a className="btn tiny ghost" href={`/?toko=${s.slug}`} target="_blank" rel="noreferrer">Katalog ↗</a>
                <button className="btn tiny danger" onClick={() => removeSeller(s)}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}