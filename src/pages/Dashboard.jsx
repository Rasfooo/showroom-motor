import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, formatRupiah, slugify } from '../lib/supabase'

const emptyForm = {
  title: '',
  brand: '',
  year: '',
  price: '',
  condition: 'used',
  description: '',
}

export default function Dashboard() {
  const { session, profile, loading, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [motos, setMotos] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    showroom_name: '',
    whatsapp: '',
    location: '',
    logo: null,
  })

  useEffect(() => {
    if (!loading && !session) navigate('/auth')
  }, [loading, session])

  useEffect(() => {
    if (session) loadMotos()
  }, [session])

  useEffect(() => {
    if (profile) {
      setProfileForm({
        showroom_name: profile.showroom_name || '',
        whatsapp: profile.whatsapp || '',
        location: profile.location || '',
        logo: null,
      })
    }
  }, [profile])

  async function loadMotos() {
    const { data } = await supabase
      .from('motos')
      .select('*')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false })
    setMotos(data || [])
  }

  function onFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function uploadImage() {
    if (!file) return null
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${session.user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('motor-images')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('motor-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      let image_url = editingId ? motos.find((m) => m.id === editingId)?.image_url : null
      if (file) image_url = await uploadImage()

      const payload = {
        seller_id: session.user.id,
        title: form.title,
        brand: form.brand || null,
        year: form.year ? parseInt(form.year, 10) : null,
        price: parseInt(String(form.price).replace(/[^0-9]/g, ''), 10) || 0,
        condition: form.condition,
        description: form.description || null,
        image_url,
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
      setForm(emptyForm)
      setEditingId(null)
      setFile(null)
      setPreview(null)
      await loadMotos()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(m) {
    setEditingId(m.id)
    setForm({
      title: m.title,
      brand: m.brand || '',
      year: m.year || '',
      price: m.price,
      condition: m.condition,
      description: m.description || '',
    })
    setPreview(m.image_url)
    setFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function removeMoto(id) {
    if (!confirm('Hapus motor ini?')) return
    const { error } = await supabase.from('motos').delete().eq('id', id)
    if (error) return setErr(error.message)
    setMsg('Motor dihapus')
    loadMotos()
  }

  async function toggleAvail(m) {
    await supabase
      .from('motos')
      .update({ is_available: !m.is_available })
      .eq('id', m.id)
    loadMotos()
  }

  async function saveProfile(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    try {
      let logo_url = profile.logo_url
      if (profileForm.logo) {
        const f = profileForm.logo
        const path = `${session.user.id}/logo-${Date.now()}.png`
        const { error } = await supabase.storage
          .from('motor-images')
          .upload(path, f, { upsert: true, contentType: f.type })
        if (error) throw error
        logo_url = supabase.storage.from('motor-images').getPublicUrl(path).data.publicUrl
      }
      const { error } = await supabase
        .from('sellers')
        .update({
          showroom_name: profileForm.showroom_name,
          whatsapp: profileForm.whatsapp.replace(/[^0-9]/g, ''),
          location: profileForm.location,
          logo_url,
        })
        .eq('id', session.user.id)
      if (error) throw error
      await refreshProfile()
      setMsg('Profil showroom disimpan')
      setShowProfile(false)
    } catch (e) {
      setErr(e.message)
    }
  }

  if (loading) return <div className="center-page">Memuat...</div>
  if (!session) return null

  const publicUrl = profile?.slug
    ? `${window.location.origin}/?toko=${profile.slug}`
    : ''

  return (
    <div className="container">
      <header className="dash-header">
        <div>
          <h1>Dashboard Showroom</h1>
          <p className="muted">
            {profile?.showroom_name} {profile?.location ? `· ${profile.location}` : ''}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={() => setShowProfile((v) => !v)}>
            ⚙️ Profil
          </button>
          <a className="btn ghost" href={publicUrl} target="_blank" rel="noreferrer">
            Lihat Katalog ↗
          </a>
          <button
            className="btn ghost"
            onClick={async () => {
              await signOut()
              navigate('/auth')
            }}
          >
            Keluar
          </button>
        </div>
      </header>

      {msg && <div className="alert info">{msg}</div>}
      {err && <div className="alert error">{err}</div>}

      {/* Profil showroom */}
      {showProfile && (
        <form className="panel" onSubmit={saveProfile}>
          <h3>Profil Showroom</h3>
          <label>Nama Showroom</label>
          <input
            value={profileForm.showroom_name}
            onChange={(e) => setProfileForm({ ...profileForm, showroom_name: e.target.value })}
            required
          />
          <label>Nomor WhatsApp (format 62xxx)</label>
          <input
            value={profileForm.whatsapp}
            onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
            required
          />
          <label>Lokasi</label>
          <input
            value={profileForm.location}
            onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
          />
          <label>Logo Showroom</label>
          <input type="file" accept="image/*" onChange={(e) =>
            setProfileForm({ ...profileForm, logo: e.target.files?.[0] || null })
          } />
          {profile?.logo_url && (
            <img src={profile.logo_url} alt="logo" className="logo-preview" />
          )}
          <button className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      )}

      {/* Form tambah/edit motor */}
      <form className="panel" onSubmit={handleSubmit}>
        <h3>{editingId ? '✏️ Edit Motor' : '➕ Tambah Motor'}</h3>
        <div className="form-grid">
          <div>
            <label>Nama Motor *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Honda Vario 160 2023"
              required
            />
          </div>
          <div>
            <label>Merek</label>
            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Honda"
            />
          </div>
          <div>
            <label>Tahun</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2023"
            />
          </div>
          <div>
            <label>Harga (Rp) *</label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="17500000"
              required
            />
          </div>
          <div>
            <label>Kondisi</label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            >
              <option value="used">Bekas</option>
              <option value="new">Baru</option>
            </select>
          </div>
          <div>
            <label>Foto Motor</label>
            <input type="file" accept="image/*" onChange={onFileChange} />
          </div>
        </div>
        <label>Deskripsi</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Pajak panjang, servis rutin, pajak hidup..."
        />
        {preview && <img src={preview} alt="preview" className="img-preview" />}
        <div className="form-actions">
          <button className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Motor'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
                setPreview(null)
                setFile(null)
              }}
            >
              Batal
            </button>
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
              <tr>
                <th>Foto</th>
                <th>Nama</th>
                <th>Harga</th>
                <th>Kondisi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {motos.map((m) => (
                <tr key={m.id} className={!m.is_available ? 'dim' : ''}>
                  <td>
                    {m.image_url ? (
                      <img src={m.image_url} className="thumb" alt="" />
                    ) : (
                      <span className="thumb no-img-sm">🏍️</span>
                    )}
                  </td>
                  <td>
                    <strong>{m.title}</strong>
                    <div className="muted small">
                      {m.brand}
                      {m.year ? ` · ${m.year}` : ''}
                    </div>
                  </td>
                  <td>{formatRupiah(m.price)}</td>
                  <td>{m.condition === 'new' ? 'Baru' : 'Bekas'}</td>
                  <td>
                    <button
                      className={`btn tiny ${m.is_available ? 'green' : 'grey'}`}
                      onClick={() => toggleAvail(m)}
                    >
                      {m.is_available ? 'Tersedia' : 'Terjual'}
                    </button>
                  </td>
                  <td className="actions">
                    <button className="btn tiny ghost" onClick={() => startEdit(m)}>
                      Edit
                    </button>
                    <button className="btn tiny danger" onClick={() => removeMoto(m.id)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
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
