import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, formatRupiah } from '../lib/supabase'
import { THEMES, applyTheme } from '../lib/themes'

const emptyForm = {
  title: '', brand: '', year: '', price: '',
  condition: 'used', description: '',
}

export default function Dashboard() {
  const { session, profile, loading, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [motos, setMotos] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [files, setFiles] = useState([])            // File[] multi-foto
  const [previews, setPreviews] = useState([])      // URL[] preview lokal
  const [existingImages, setExistingImages] = useState([]) // URL[] saat edit
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    showroom_name: '', whatsapp: '', location: '', logo: null, theme: 'dark',
  })

  useEffect(() => { if (!loading && !session) navigate('/auth') }, [loading, session])
  useEffect(() => { if (session) loadMotos() }, [session])
  useEffect(() => {
    if (profile) {
      setProfileForm({
        showroom_name: profile.showroom_name || '',
        whatsapp: profile.whatsapp || '',
        location: profile.location || '',
        logo: null,
        theme: profile.theme || 'dark',
      })
      applyTheme(profile.theme || 'dark')
    }
  }, [profile])

  async function loadMotos() {
    const { data } = await supabase
      .from('motos').select('*')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false })
    setMotos(data || [])
  }

  // Multi-file picker
  function onFilesChange(e) {
    const arr = Array.from(e.target.files || [])
    setFiles(arr)
    setPreviews(arr.map((f) => URL.createObjectURL(f)))
  }

  // Upload beberapa file → array URL
  async function uploadFiles() {
    if (!files.length) return []
    const urls = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${session.user.id}/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage
        .from('motor-images')
        .upload(path, f, { upsert: true, contentType: f.type })
      if (error) throw error
      urls.push(supabase.storage.from('motor-images').getPublicUrl(path).data.publicUrl)
    }
    return urls
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setMsg(''); setSaving(true)
    try {
      // gabung foto lama (edit) + foto baru
      const newUrls = await uploadFiles()
      const images = [...existingImages, ...newUrls]
      const payload = {
        seller_id: session.user.id,
        title: form.title,
        brand: form.brand || null,
        year: form.year ? parseInt(form.year, 10) : null,
        price: parseInt(String(form.price).replace(/[^0-9]/g, ''), 10) || 0,
        condition: form.condition,
        description: form.description || null,
        images,
        image_url: images[0] || null, // kompatibilitas: foto pertama
      }
      if (editingId) {
        const { error } = await supabase.from('motos').update(payload).eq('id', editingId)
        if (error) throw error
        setMsg('Motor berhasil diperbarui')
      } else {
        const { error } = await supabase.from('motos').insert(payload)
        if (error) throw error
        setMsg('Motor berhasil ditambahkan')
      }
      setForm(emptyForm); setEditingId(null)
      setFiles([]); setPreviews([]); setExistingImages([])
      await loadMotos()
    } catch (e) { setErr(e.message) } finally { setSaving(false) }
  }

  function startEdit(m) {
    setEditingId(m.id)
    setForm({
      title: m.title, brand: m.brand || '', year: m.year || '',
      price: m.price, condition: m.condition, description: m.description || '',
    })
    const imgs = (m.images?.length ? m.images : [m.image_url]).filter(Boolean)
    setExistingImages(imgs)
    setPreviews(imgs)
    setFiles([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeExistingImg(url) {
    setExistingImages((a) => a.filter((u) => u !== url))
    setPreviews((a) => a.filter((u) => u !== url))
  }

  async function removeMoto(id) {
    if (!confirm('Hapus motor ini?')) return
    const { error } = await supabase.from('motos').delete().eq('id', id)
    if (error) return setErr(error.message)
    setMsg('Motor dihapus'); loadMotos()
  }

  async function toggleAvail(m) {
    await supabase.from('motos').update({ is_available: !m.is_available }).eq('id', m.id)
    loadMotos()
  }

  async function saveProfile(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try {
      let logo_url = profile.logo_url
      if (profileForm.logo) {
        const f = profileForm.logo
        const path = `${session.user.id}/logo-${Date.now()}.png`
        const { error } = await supabase.storage
          .from('motor-images').upload(path, f, { upsert: true, contentType: f.type })
        if (error) throw error
        logo_url = supabase.storage.from('motor-images').getPublicUrl(path).data.publicUrl
      }
      const { error } = await supabase.from('sellers').update({
        showroom_name: profileForm.showroom_name,
        whatsapp: profileForm.whatsapp.replace(/[^0-9]/g, ''),
        location: profileForm.location,
        logo_url,
        theme: profileForm.theme,
      }).eq('id', session.user.id)
      if (error) throw error
      await refreshProfile()
      applyTheme(profileForm.theme)
      setMsg('Profil showroom disimpan')
    } catch (e) { setErr(e.message) }
  }

  if (loading) return <div className="center-page">Memuat...</div>
  if (!session) return null

  const publicUrl = profile?.slug ? `${window.location.origin}/?toko=${profile.slug}` : ''

  return (
    <div className="container">
      <header className="dash-header">
        <div className="dash-brand">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="logo" className="dash-logo" />
          ) : (
            <span className="dash-logo placeholder">🏍️</span>
          )}
          <div>
            <h1>{profile?.showroom_name || 'Showroom Saya'}</h1>
            <p className="muted">
              {profile?.location ? `📍 ${profile.location}` : 'Lengkapi profil showroom'}
              {profile?.slug ? ` · /${profile.slug}` : ''}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={() => setShowProfile((v) => !v)}>Profil & Tema</button>
          <a className="btn ghost" href={publicUrl} target="_blank" rel="noreferrer">Lihat Katalog ↗</a>
          <button className="btn ghost" onClick={async () => { await signOut(); navigate('/auth') }}>Keluar</button>
        </div>
      </header>

      {msg && <div className="alert info">{msg}</div>}
      {err && <div className="alert error">{err}</div>}

      {/* Aksi utama: tambah motor */}
      <div className="dash-cta">
        <a className="btn primary lg" href="#form-motor">
          + Tambah Motor
        </a>
        <span className="muted small">
          {motos.length} motor · {motos.filter((m) => m.is_available).length} tersedia
        </span>
      </div>


      {/* Profil + Tema showroom */}
      {showProfile && (
        <form className="panel" onSubmit={saveProfile}>
          <h3>Profil Showroom</h3>
          <label>Nama Showroom</label>
          <input value={profileForm.showroom_name}
            onChange={(e) => setProfileForm({ ...profileForm, showroom_name: e.target.value })} required />
          <label>Nomor WhatsApp (format 62xxx)</label>
          <input value={profileForm.whatsapp}
            onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })} required />
          <label>Lokasi</label>
          <input value={profileForm.location}
            onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} />

          {/* PILIH TEMA */}
          <label>Tema Katalog</label>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`theme-card ${profileForm.theme === t.id ? 'active' : ''}`}
                onClick={() => setProfileForm({ ...profileForm, theme: t.id })}
              >
                <span className="theme-swatch" style={{ background: t.colors.brand }}>
                  <i style={{ background: t.colors.bg }} />
                </span>
                <span className="theme-name">{t.name}</span>
                <span className="theme-desc">{t.desc}</span>
              </button>
            ))}
          </div>

          <label>Logo Showroom</label>
          <input type="file" accept="image/*"
            onChange={(e) => setProfileForm({ ...profileForm, logo: e.target.files?.[0] || null })} />
          {profile?.logo_url && <img src={profile.logo_url} alt="logo" className="logo-preview" />}
          <button className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      )}

      {/* Form tambah/edit motor */}
      <form className="panel" id="form-motor" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit Motor' : 'Tambah Motor'}</h3>
        <div className="form-grid">
          <div>
            <label>Nama Motor *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Honda Vario 160 2023" required />
          </div>
          <div>
            <label>Merek</label>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Honda" />
          </div>
          <div>
            <label>Tahun</label>
            <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2023" />
          </div>
          <div>
            <label>Harga (Rp) *</label>
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="17500000" required />
          </div>
          <div>
            <label>Kondisi</label>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              <option value="used">Bekas</option>
              <option value="new">Baru</option>
            </select>
          </div>
          <div>
            <label>Foto Motor (bisa pilih banyak)</label>
            <input type="file" accept="image/*" multiple onChange={onFilesChange} />
          </div>
        </div>
        <label>Deskripsi</label>
        <textarea rows={3} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Pajak panjang, servis rutin, pajak hidup..." />

        {/* Preview semua foto (existing + baru) */}
        {previews.length > 0 && (
          <div className="preview-row">
            {previews.map((src, i) => (
              <div className="preview-item" key={src + i}>
                <img src={src} alt={`foto ${i + 1}`} />
                {existingImages.includes(src) ? (
                  <button type="button" className="preview-x" onClick={() => removeExistingImg(src)}>×</button>
                ) : (
                  <span className="preview-new">baru</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Motor'}
          </button>
          {editingId && (
            <button type="button" className="btn ghost" onClick={() => {
              setEditingId(null); setForm(emptyForm)
              setPreviews([]); setFiles([]); setExistingImages([])
            }}>Batal</button>
          )}
        </div>
      </form>

      {/* Daftar motor */}
      <h3 className="section-title">Motor Saya ({motos.length})</h3>
      {motos.length === 0 ? (
        <p className="muted">Belum ada motor. Tambahkan lewat form di atas.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Foto</th><th>Nama</th><th>Harga</th><th>Kondisi</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {motos.map((m) => {
                const imgs = (m.images?.length ? m.images : [m.image_url]).filter(Boolean)
                return (
                  <tr key={m.id} className={!m.is_available ? 'dim' : ''}>
                    <td>
                      {imgs[0] ? <img src={imgs[0]} className="thumb" alt="" />
                        : <span className="thumb no-img-sm"></span>}
                      {imgs.length > 1 && <span className="photo-count">+{imgs.length - 1}</span>}
                    </td>
                    <td>
                      <strong>{m.title}</strong>
                      <div className="muted small">{m.brand}{m.year ? ` · ${m.year}` : ''}</div>
                    </td>
                    <td>{formatRupiah(m.price)}</td>
                    <td>{m.condition === 'new' ? 'Baru' : 'Bekas'}</td>
                    <td>
                      <button className={`btn tiny ${m.is_available ? 'green' : 'grey'}`}
                        onClick={() => toggleAvail(m)}>
                        {m.is_available ? 'Tersedia' : 'Terjual'}
                      </button>
                    </td>
                    <td className="actions">
                      <button className="btn tiny ghost" onClick={() => startEdit(m)}>Edit</button>
                      <button className="btn tiny danger" onClick={() => removeMoto(m.id)}>Hapus</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted center" style={{ marginTop: 32 }}>
        <Link to="/">← Kembali ke katalog publik</Link>
      </p>
    </div>
  )
}
