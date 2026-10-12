// ============================================================
// SEO helper — set meta tags dinamis + schema JSON-LD (Google rich result).
// Dipanggil dari PublicCatalog saat data berubah.
// ============================================================

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Hapus JSON-LD lama biar gak numpuk
function clearJsonLd(id) {
  document.querySelectorAll(`script#${id}`).forEach((n) => n.remove())
}

function injectJsonLd(id, obj) {
  clearJsonLd(id)
  const s = document.createElement('script')
  s.type = 'application/ld+json'
  s.id = id
  s.textContent = JSON.stringify(obj)
  document.head.appendChild(s)
}

/**
 * Set SEO untuk halaman katalog.
 * @param {Object} p - { sellers, motos, activeSlug, heroName, heroLocation }
 */
export function injectCatalogSEO({ sellers, motos, activeSlug, heroName, heroLocation }) {
  const origin = window.location.origin
  const canonicalUrl = activeSlug ? `${origin}/?toko=${activeSlug}` : `${origin}/`

  const baseTitle = heroName
    ? `${heroName} — Katalog Motor${heroLocation ? ` ${heroLocation}` : ''}`
    : 'Katalog Motor Bekas & Baru — Showroom Motor Online'
  const desc = heroName
    ? `Lihat ${motos.length} motor tersedia di ${heroName}${heroLocation ? `, ${heroLocation}` : ''}. Harga transparan, chat WhatsApp langsung ke penjual.`
    : `Katalog ${motos.length} motor bekas & baru dari showroom terpercaya. Filter merek & harga, chat WhatsApp penjual langsung.`

  // Title + meta
  document.title = baseTitle
  setMeta('name', 'description', desc)
  setMeta('property', 'og:title', baseTitle)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:url', canonicalUrl)
  setMeta('property', 'og:site_name', heroName || 'Katalog Motor')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', baseTitle)
  setMeta('name', 'twitter:description', desc)
  setLink('canonical', canonicalUrl)

  // Schema.org — ItemList of Product (Google rich result eligible)
  const items = motos.slice(0, 50).map((m) => ({
    '@type': 'ListItem',
    position: motos.indexOf(m) + 1,
    item: {
      '@type': 'Product',
      name: m.title,
      brand: m.brand ? { '@type': 'Brand', name: m.brand } : undefined,
      description: m.description || undefined,
      image: (m.images?.length ? m.images : [m.image_url]).filter(Boolean).slice(0, 5),
      offers: {
        '@type': 'Offer',
        price: m.price,
        priceCurrency: 'IDR',
        availability: m.is_available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    },
  })).filter((i) => i.item)

  injectJsonLd('ld-catalog', {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: baseTitle,
    numberOfItems: motos.length,
    itemListElement: items,
  })

  // Breadcrumb
  injectJsonLd('ld-breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: origin },
      ...(heroName
        ? [{ '@type': 'ListItem', position: 2, name: heroName, item: canonicalUrl }]
        : []),
    ],
  })
}
