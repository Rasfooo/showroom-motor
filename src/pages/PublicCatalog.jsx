import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, formatRupiah, waLink } from '../lib/supabase'
import { applyTheme } from '../lib/themes'
import PhotoCarousel from '../components/PhotoCarousel'
import MotorDetailModal from '../components/MotorDetailModal'
import { injectCatalogSEO } from '../lib/seo'

// Katalog publik: semua showroom aktif + motornya.
// Bisa diakses tanpa login. Query param ?toko=slug untuk 1 showroom tertentu.
export default function PublicCatalog() {
  const [sellers, setSellers] = useState([])
  const [motos, setMotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSlug, setActiveSlug] = useState(
    new URLSearchParams(window.location.search).get('toko')
  )
  const [selected, setSelected] = useState(null) // motor yang dibuka di modal
  const [brandFilter, setBrandFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => { load() }, [])

  // Terapkan tema: kalau 1 showroom dipilih → tema showroom itu,
  // kalau tampil semua → tema showroom pertama (atau default).
  useEffect(() => {
    const shown = activeSlug ? sellers.filter((s) => s.slug === activeSlug) : sellers
    applyTheme(shown[0]?.theme || 'dark')
  }, [activeSlug, sellers])

  async function load() {
    setLoading(true)
    const { data: s } = await supabase
      .from('sellers')
      .select('id, showroom_name, slug, whatsapp, logo_url, location, theme')
      .eq('is_active', true)
      .order('showroom_name')
    const { data: m } = await supabase
      .from('motos')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
    setSellers(s || [])
    setMotos(m || [])
    setLoading(false)
  }

  const filtered = activeSlug ? sellers.filter((s) => s.slug === activeSlug) : sellers
  const activeSellerIds = new Set(filtered.map((s) => s.id))
  const sellerById = Object.fromEntries(sellers.map((s) => [s.id, s]))

  // Filter by showroom + brand + sort
  let visibleMotos = motos.filter((m) => activeSellerIds.has(m.seller_id))
  if (brandFilter !== 'all') visibleMotos = visibleMotos.filter((m) => (m.brand || '').toLowerCase() === brandFilter)
  if (sort === 'cheap') visibleMotos = [...visibleMotos].sort((a, b) => a.price - b.price)
  else if (sort === 'expensive') visibleMotos = [...visibleMotos].sort((a, b) => b.price - a.price)
  else if (sort === 'oldest') visibleMotos = [...visibleMotos].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  // Daftar merek unik utk filter
  const brands = [...new Set(visibleMotos.map((m) => (m.brand || '').toLowerCase()).filter(Boolean))]

  // SEO: set meta + schema JSON-LD (Product list) tiap data berubah
  useEffect(() => {
    if (loading || sellers.length === 0) return
    const hero = filtered[0]
    injectCatalogSEO({
      sellers: filtered,
      motos: visibleMotos,
      activeSlug,
      heroName: hero?.showroom_name,
      heroLocation: hero?.location,
    })
  }, [loading, sellers, visibleMotos, activeSlug])

  if (loading) return <div className="center-page">Memuat katalog...</div>

  if (sellers.length === 0) {
    return (
      <div className="center-page">
        <p>Belum ada showroom yang terdaftar.</p>
        <Link className="btn primary" to="/auth">Daftar Showroom</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="pub-header">
        <div>
          <p className="eyebrow">Showroom Motor Online</p>
          <h1>Katalog Motor Bekas &amp; Baru</h1>
          <p className="muted">
            {activeSlug ? 'Showroom terpilih' : 'Semua showroom aktif'} ·{' '}
            {visibleMotos.length} motor tersedia
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn ghost" to="/auth">Masuk / Daftar</Link>
        </div>
      </header>

      {/* Showroom hero — identitas toko */}
      {(() => {
        const hero = filtered[0]
        if (!hero) return null
        const count = visibleMotos.length
        return (
          <section className="showroom-hero">
            <div className="hero-identity">
              {hero.logo_url && <img src={hero.logo_url} alt="" className="hero-logo" />}
              <div>
                <p className="eyebrow">{hero.location || 'Showroom'}</p>
                <h2 className="hero-name">{hero.showroom_name}</h2>
                <p className="muted small">{count} motor tersedia{hero.location ? ` · ${hero.location}` : ''}</p>
              </div>
            </div>
            <a
              className="btn wa"
              href={waLink(hero.whatsapp, `Halo ${hero.showroom_name}, saya mau tanya-tanya motor yang tersedia.`)}
              target="_blank" rel="noreferrer"
            >
              Chat Showroom
            </a>
          </section>
        )
      })()}

      {/* Filter showroom */}
      <div className="chip-row">
        <button className={`chip ${!activeSlug ? 'active' : ''}`} onClick={() => { setActiveSlug(null); window.history.replaceState({}, '', '/') }}>Semua</button>
        {filtered.map((s) => (
          <button key={s.id} className={`chip ${activeSlug === s.slug ? 'active' : ''}`}
            onClick={() => { setActiveSlug(s.slug); window.history.replaceState({}, '', `/?toko=${s.slug}`) }}>
            {s.logo_url && <img src={s.logo_url} alt="" className="chip-logo" />}
            {s.showroom_name}
          </button>
        ))}
      </div>

      {/* Toolbar filter: merek + urutkan */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Merek</label>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="filter-select">
            <option value="all">Semua Merek</option>
            {brands.map((b) => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Urutkan</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="filter-select">
            <option value="newest">Terbaru</option>
            <option value="cheapest">Harga Termurah</option>
            <option value="expensive">Harga Termahal</option>
          </select>
        </div>
        <div className="filter-group filter-count">
          <span className="muted small">{visibleMotos.length} hasil</span>
        </div>
      </div>

      {/* Grid motor */}
      {visibleMotos.length === 0 ? (
        <div className="center-page"><p>Tidak ada motor yang cocok dengan filter.</p></div>
      ) : (
        <div className="grid">
          {visibleMotos.map((m) => {
            const s = sellerById[m.seller_id]
            const gallery = (m.images?.length ? m.images : [m.image_url]).filter(Boolean)
            return (
              <article
                className="card card-clickable"
                key={m.id}
                onClick={() => setSelected(m)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelected(m) }}
              >
                <div className="card-img">
                  <PhotoCarousel images={gallery} alt={m.title} />
                  <span className={`badge ${m.condition}`}>{m.condition === 'new' ? 'Baru' : 'Bekas'}</span>
                  {!m.is_available && <span className="badge sold">Terjual</span>}
                  <span className="card-hint">Klik untuk detail</span>
                </div>
                <div className="card-body">
                  <h3>{m.title}</h3>
                  <p className="muted small">
                    {m.brand}{m.year ? ` · ${m.year}` : ''}{s?.location ? ` · ${s.location}` : ''}
                  </p>
                  <div className="price">{formatRupiah(m.price)}</div>
                  {m.description && <p className="desc">{m.description}</p>}
                  <div className="card-footer">
                    <span className="seller-name">
                      {s?.logo_url && <img src={s.logo_url} className="mini-logo" alt="" />}
                      <span>{s?.showroom_name}</span>
                    </span>
                    <a
                      className="btn wa"
                      href={waLink(s?.whatsapp, `Halo ${s?.showroom_name}, saya minat dengan ${m.title} (${formatRupiah(m.price)})`)}
                      target="_blank" rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Chat WA
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Modal detail */}
      {selected && (
        <MotorDetailModal
          moto={selected}
          seller={sellerById[selected.seller_id]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
