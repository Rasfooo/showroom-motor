import { useEffect, useRef, useState } from 'react'

// ============================================================
// Carousel foto motor — auto-slide + indikator dot + swipe.
// images: array URL string. interval: ms antar slide (default 3.5s).
// ============================================================
export default function PhotoCarousel({ images = [], interval = 3500, alt = '' }) {
  const list = (images || []).filter(Boolean)
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)
  const touchX = useRef(null)

  // Auto-slide
  useEffect(() => {
    if (list.length <= 1) return
    timer.current = setInterval(() => {
      setIdx((i) => (i + 1) % list.length)
    }, interval)
    return () => clearInterval(timer.current)
  }, [list.length, interval])

  // Reset index kalau gambar berubah
  useEffect(() => {
    if (idx >= list.length) setIdx(0)
  }, [list.length, idx])

  if (list.length === 0) {
    return <div className="no-img"></div>
  }

  const go = (n) => setIdx((n + list.length) % list.length)

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1)
    touchX.current = null
  }

  return (
    <div
      className="carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => clearInterval(timer.current)}
      onMouseLeave={() => {
        if (list.length > 1) {
          timer.current = setInterval(() => setIdx((i) => (i + 1) % list.length), interval)
        }
      }}
    >
      {list.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={`${alt} ${i + 1}`}
          className={`carousel-slide ${i === idx ? 'active' : ''}`}
          loading="lazy"
        />
      ))}

      {list.length > 1 && (
        <>
          <div className="carousel-dots">
            {list.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === idx ? 'active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
          <button className="carousel-nav prev" onClick={() => go(idx - 1)} aria-label="Sebelumnya">‹</button>
          <button className="carousel-nav next" onClick={() => go(idx + 1)} aria-label="Berikutnya">›</button>
          <span className="carousel-count">{idx + 1}/{list.length}</span>
        </>
      )}
    </div>
  )
}
