// ============================================================
// TEMA KATALOG — palet per seller, diterapkan sebagai CSS variable.
// Setiap tema = token OKLCH (bukan hex) supaya konsisten & mudah di-extend.
// Tambah tema baru: tambah entri di bawah — CSS otomatis menyusul.
// ============================================================

export const THEMES = [
  {
    id: 'dark',
    name: '🌃 Gelap (Default)',
    desc: 'Kontras tinggi, foto motor jadi bintangnya.',
    colors: {
      bg: 'oklch(0.16 0.02 260)',
      panel: 'oklch(0.21 0.025 260)',
      brand: 'oklch(0.72 0.16 55)',
      text: 'oklch(0.93 0.01 260)',
      accent: 'oklch(0.80 0.15 65)',
    },
  },
  {
    id: 'light',
    name: '☀️ Terang',
    desc: 'Putih hangat, biru tegas — kesan showroom resmi.',
    colors: {
      bg: 'oklch(0.97 0.005 90)',
      panel: 'oklch(1 0 0)',
      brand: 'oklch(0.55 0.19 255)',
      text: 'oklch(0.20 0.02 260)',
      accent: 'oklch(0.48 0.20 258)',
    },
  },
  {
    id: 'sporty',
    name: '🏁 Sporty Merah',
    desc: 'Merah pekat + aksen panas — pas buat motor sport.',
    colors: {
      bg: 'oklch(0.15 0.03 20)',
      panel: 'oklch(0.20 0.045 22)',
      brand: 'oklch(0.62 0.21 25)',
      text: 'oklch(0.95 0.01 20)',
      accent: 'oklch(0.72 0.17 35)',
    },
  },
  {
    id: 'racing',
    name: '🏎️ Racing Hijau',
    desc: 'Hijau balap, kesan ngebut & muda.',
    colors: {
      bg: 'oklch(0.15 0.035 150)',
      panel: 'oklch(0.20 0.045 148)',
      brand: 'oklch(0.72 0.19 150)',
      text: 'oklch(0.95 0.02 145)',
      accent: 'oklch(0.82 0.17 155)',
    },
  },
  {
    id: 'gold',
    name: '👑 Gold Premium',
    desc: 'Hitam pekat + emas — buat showroom eksklusif.',
    colors: {
      bg: 'oklch(0.15 0.015 80)',
      panel: 'oklch(0.20 0.02 82)',
      brand: 'oklch(0.78 0.15 90)',
      text: 'oklch(0.95 0.02 95)',
      accent: 'oklch(0.85 0.14 95)',
    },
  },
  {
    id: 'ocean',
    name: '🌊 Ocean Biru',
    desc: 'Biru laut dalam — adem, kekinian.',
    colors: {
      bg: 'oklch(0.17 0.035 235)',
      panel: 'oklch(0.22 0.045 237)',
      brand: 'oklch(0.75 0.14 230)',
      text: 'oklch(0.95 0.02 230)',
      accent: 'oklch(0.85 0.11 225)',
    },
  },
]

// Terapkan tema ke DOM (set CSS variable di :root)
export function applyTheme(themeId) {
  const t = THEMES.find((x) => x.id === themeId) || THEMES[0]
  const root = document.documentElement
  root.setAttribute('data-theme', t.id)
  root.style.setProperty('--color-bg', t.colors.bg)
  root.style.setProperty('--color-panel', t.colors.panel)
  root.style.setProperty('--color-panel-2', t.colors.panel)
  root.style.setProperty('--color-text', t.colors.text)
  root.style.setProperty('--color-brand', t.colors.brand)
  root.style.setProperty('--color-accent', t.colors.accent)
  root.style.setProperty('--color-text-muted', mixMuted(t.colors.text))
  root.style.setProperty('--color-border', mixBorder(t.colors.panel))
}

// Turunkan muted dari warna teks (lebih gelap/terang konstan)
function mixMuted(text) {
  // turunkan lightness ~28% supaya muted tetap terbaca
  return text.replace(/oklch\(([\d.]+) /, (_, L) => `oklch(${Math.max(0, parseFloat(L) - 0.28).toFixed(2)} `)
}

// Border = panel diset +8% lightness
function mixBorder(panel) {
  return panel.replace(/oklch\(([\d.]+) /, (_, L) => `oklch(${Math.min(1, parseFloat(L) + 0.10).toFixed(2)} `)
}
