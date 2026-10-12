import { useEffect, useState, useRef } from 'react'
import { formatRupiah, waLink } from '../lib/supabase'

// ============================================================
// MODAL DETAIL MOTOR — klik kartu → tampil galeri + spec + deskripsi + CTA WA.
// Aksesible: Esc close, focus trap ringan, scroll lock body.
// ============================================================
export default function MotorDetailModal({ moto, seller, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const overlayRef = useRef(null)
  const cardRef = useRef(null)

  if (!moto) return null

  const gallery = (moto.images?.length ? moto.images : [moto.image_url]).filter(Boolean)

  // Lock scroll body + Esc handler + klik overlay close
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // focus modal
    cardRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const onOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const spec = [
    { label: 'Merek', value: moto.brand },
    { label: 'Tahun', value: moto.year },
    { label: 'Kondisi', value: moto.condition === 'new' ? 'Baru' : 'Bekas' },
    { label: 'Status', value: moto.is_available ? 'Tersedia' : 'Terjual' },
    { label: 'Lokasi', value: seller?.location },
  ].filter((s) => s.value)

  const waText = `Halo ${seller?.showroom_name || ''}, saya mau tanya-tanya ${moto.title} (${formatRupiah(moto.price)}) yang lagi dijual di katalog.`

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={onOverlayClick} role="dialog" aria-modal="true" aria-label={moto.title}>
      <div className="modal-card" ref={cardRef} tabIndex={-1}>
        <button className="modal-close" onClick={onClose} aria-label="Tutup">✕</button>

        <div className="modal-grid">
          {/* Galeri */}
          <div className="modal-gallery">
            <div className="modal-main-img">
              {gallery[activeIdx] ? (
                <img src={gallery[activeIdx]} alt={`${moto.title} foto ${activeIdx + 1}`} />
              ) : (
                <div className="no-img">Tanpa foto</div>
              )}
              {moto.condition && (
                <span className={`badge ${moto.condition}`}>
                  {moto.condition === 'new' ? 'Baru' : 'Bekas'}
                </span>
              )}
              {!moto.is_available && <span className="badge sold">Terjual</span>}
            </div>
            {gallery.length > 1 && (
              <div className="modal-thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    className={`thumb-btn ${i === activeIdx ? 'active' : ''}`}
                    onClick={() => setActiveIdx(i)}
                    aria-label={`Foto ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="modal-info">
            <p className="eyebrow">{seller?.showroom_name}{seller?.location ? ` · ${seller.location}` : ''}</p>
            <h2 className="modal-title">{moto.title}</h2>
            <div className="modal-price">{formatRupiah(moto.price)}</div>

            {/* Spec grid */}
            <div className="spec-grid">
              {spec.map((s) => (
                <div className="spec-item" key={s.label}>
                  <span className="spec-label">{s.label}</span>
                  <span className="spec-value">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Deskripsi */}
            {moto.description && (
              <div className="modal-desc">
                <h4>Deskripsi</h4>
                <p>{moto.description}</p>
              </div>
            )}

            {/* CTA */}
            <div className="modal-cta">
              <a
                className="btn wa btn-wa-lg"
                href={waLink(seller?.whatsapp, waText)}
                target="_blank"
                rel="noreferrer"
              >
                💬 Chat WhatsApp Penjual
              </a>
              <p className="muted small center">Biasanya dibalas cepat · {seller?.whatsapp}</p>
            </div>

            {/* Info penjual */}
            <div className="seller-box">
              {seller?.logo_url && <img src={seller.logo_url} alt="" className="seller-logo" />}
              <div>
                <strong>{seller?.showroom_name}</strong>
                <div className="muted small">{seller?.location || 'Showroom aktif'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
