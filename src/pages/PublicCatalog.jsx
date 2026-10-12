import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, formatRupiah, waLink } from '../lib/supabase'

// Katalog publik: semua showroom aktif + motornya.
// Bisa diakses tanpa login. Query param ?toko=slug untuk 1 showroom tertentu.
export default function PublicCatalog() {
  const [sellers, setSellers] = useState([])
  const [motos, setMotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSlug, setActiveSlug] = useState(
    new URLSearchParams(window.location.search).get('toko')
  )

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data: s } = await supabase
      .from('sellers')
      .select('id, showroom_name, slug, whatsapp, logo_url, location')
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

  const filtered = activeSlug
    ? sellers.filter((s) => s.slug === activeSlug)
    : sellers
  const activeSellerIds = new Set(filtered.map((s) => s.id))
  const visibleMotos = motos.filter((m) => activeSellerIds.has(m.seller_id))

  const sellerById = Object.fromEntries(sellers.map((s) => [s.id, s]))

  if (loading) return <div className="center-page">Memuat katalog...</div>

  if (sellers.length === 0) {
    return (
      <div className="center-page">
        <p>Belum ada showroom yang terdaftar.</p>
        <Link className="btn primary" to="/auth">
          Daftar Showroom
        </Link>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="pub-header">
        <div>
          <h1>🏍️ Katalog Motor</h1>
          <p className="muted">
            {activeSlug ? 'Showroom terpilih' : 'Semua showroom aktif'} ·{' '}
            {visibleMotos.length} motor tersedia
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn ghost" to="/auth">
            Masuk / Daftar
          </Link>
        </div>
      </header>

      {/* Filter showroom */}
      <div className="chip-row">
        <button
          className={`chip ${!activeSlug ? 'active' : ''}`}
          onClick={() => {
            setActiveSlug(null)
            window.history.replaceState({}, '', '/')
          }}
        >
          Semua
        </button>
        {filtered.map((s) => (
          <button
            key={s.id}
            className={`chip ${activeSlug === s.slug ? 'active' : ''}`}
            onClick={() => {
              setActiveSlug(s.slug)
              window.history.replaceState({}, '', `/?toko=${s.slug}`)
            }}
          >
            {s.logo_url && <img src={s.logo_url} alt="" className="chip-logo" />}
            {s.showroom_name}
          </button>
        ))}
      </div>

      {/* Grid motor */}
      {visibleMotos.length === 0 ? (
        <div className="center-page">
          <p>Belum ada motor tersedia di showroom ini.</p>
        </div>
      ) : (
        <div className="grid">
          {visibleMotos.map((m) => {
            const s = sellerById[m.seller_id]
            return (
              <article className="card" key={m.id}>
                <div className="card-img">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.title} />
                  ) : (
                    <div className="no-img">🏍️</div>
                  )}
                  <span className={`badge ${m.condition}`}>
                    {m.condition === 'new' ? 'Baru' : 'Bekas'}
                  </span>
                </div>
                <div className="card-body">
                  <h3>{m.title}</h3>
                  <p className="muted small">
                    {m.brand}
                    {m.year ? ` · ${m.year}` : ''}
                    {s?.location ? ` · ${s.location}` : ''}
                  </p>
                  <div className="price">{formatRupiah(m.price)}</div>
                  {m.description && (
                    <p className="desc">{m.description}</p>
                  )}
                  <div className="card-footer">
                    <span className="seller-name">
                      {s?.logo_url && <img src={s.logo_url} className="mini-logo" alt="" />}
                      {s?.showroom_name}
                    </span>
                    <a
                      className="btn wa"
                      href={waLink(
                        s?.whatsapp,
                        `Halo ${s?.showroom_name}, saya minat dengan ${m.title} (${formatRupiah(m.price)})`
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      💬 Chat WA
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
