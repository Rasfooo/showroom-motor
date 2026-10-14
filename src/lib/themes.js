// ============================================================
// TEMA KATALOG — 12 tema modern, dipilih seller di dashboard.
// Setiap tema = token OKLCH (bg, panel, brand, text, accent) + mood.
// Dipakai di PublicCatalog (katalog publik) & Dashboard (preview).
// Tambah tema baru: tambah entri di THEMES — CSS otomatis menyusul.
// ============================================================

export const THEMES = [
  // ---------- GELAP / PREMIUM ----------
  {
    id: 'dark',
    name: 'Midnight',
    mood: 'Gelap',
    desc: 'Gelap modern, foto motor jadi bintangnya.',
    colors: {
      bg: 'oklch(0.16 0.02 260)', panel: 'oklch(0.21 0.025 260)',
      brand: 'oklch(0.72 0.16 55)', text: 'oklch(0.93 0.01 260)', accent: 'oklch(0.80 0.15 65)',
    },
  },
  {
    id: 'gold',
    name: 'Gold Luxe',
    mood: 'Premium',
    desc: 'Hitam pekat + emas, kesan showroom eksklusif.',
    colors: {
      bg: 'oklch(0.15 0.015 80)', panel: 'oklch(0.20 0.02 82)',
      brand: 'oklch(0.78 0.15 90)', text: 'oklch(0.95 0.02 95)', accent: 'oklch(0.85 0.14 95)',
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    mood: 'Minimal',
    desc: 'Abu-abu arang netral, minimalis & bersih.',
    colors: {
      bg: 'oklch(0.17 0.008 260)', panel: 'oklch(0.22 0.01 260)',
      brand: 'oklch(0.85 0.02 260)', text: 'oklch(0.95 0.005 260)', accent: 'oklch(0.90 0.02 260)',
    },
  },
  {
    id: 'carbon',
    name: 'Carbon Red',
    mood: 'Sport',
    desc: 'Gelap + merah racing, kesan speed & agresif.',
    colors: {
      bg: 'oklch(0.15 0.03 20)', panel: 'oklch(0.20 0.045 22)',
      brand: 'oklch(0.62 0.21 25)', text: 'oklch(0.95 0.01 20)', accent: 'oklch(0.72 0.17 35)',
    },
  },

  // ---------- CERAH / BERSIH ----------
  {
    id: 'light',
    name: 'Clean White',
    mood: 'Terang',
    desc: 'Putih bersih + biru, kesan showroom resmi.',
    colors: {
      bg: 'oklch(0.97 0.005 90)', panel: 'oklch(1 0 0)',
      brand: 'oklch(0.55 0.19 255)', text: 'oklch(0.20 0.02 260)', accent: 'oklch(0.48 0.20 258)',
    },
  },
  {
    id: 'cream',
    name: 'Cream Soft',
    mood: 'Terang',
    desc: 'Krem hangat + cokelat, cozy & ramah.',
    colors: {
      bg: 'oklch(0.96 0.02 85)', panel: 'oklch(0.99 0.01 85)',
      brand: 'oklch(0.45 0.10 60)', text: 'oklch(0.25 0.03 60)', accent: 'oklch(0.55 0.12 55)',
    },
  },
  {
    id: 'mint',
    name: 'Mint Fresh',
    mood: 'Terang',
    desc: 'Putih + hijau mint, sejuk & kekinian.',
    colors: {
      bg: 'oklch(0.97 0.02 155)', panel: 'oklch(1 0 0)',
      brand: 'oklch(0.55 0.15 160)', text: 'oklch(0.22 0.03 155)', accent: 'oklch(0.62 0.15 165)',
    },
  },

  // ---------- BERANI / BERWARNA ----------
  {
    id: 'ocean',
    name: 'Ocean Blue',
    mood: 'Berani',
    desc: 'Biru laut dalam, adem & kekinian.',
    colors: {
      bg: 'oklch(0.17 0.035 235)', panel: 'oklch(0.22 0.045 237)',
      brand: 'oklch(0.75 0.14 230)', text: 'oklch(0.95 0.02 230)', accent: 'oklch(0.85 0.11 225)',
    },
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    mood: 'Berani',
    desc: 'Ungu royal, berani & beda dari yang lain.',
    colors: {
      bg: 'oklch(0.17 0.04 300)', panel: 'oklch(0.22 0.05 300)',
      brand: 'oklch(0.68 0.20 300)', text: 'oklch(0.95 0.02 300)', accent: 'oklch(0.78 0.16 310)',
    },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    mood: 'Berani',
    desc: 'Hijau rimba pekat, natural & tenang.',
    colors: {
      bg: 'oklch(0.16 0.035 150)', panel: 'oklch(0.21 0.045 148)',
      brand: 'oklch(0.72 0.17 150)', text: 'oklch(0.95 0.02 145)', accent: 'oklch(0.82 0.14 155)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    mood: 'Berani',
    desc: 'Oranye senja, hangat & energik.',
    colors: {
      bg: 'oklch(0.18 0.03 45)', panel: 'oklch(0.23 0.04 45)',
      brand: 'oklch(0.75 0.17 50)', text: 'oklch(0.96 0.02 45)', accent: 'oklch(0.82 0.15 55)',
    },
  },
  {
    id: 'neon',
    name: 'Neon Cyber',
    mood: 'Modern',
    desc: 'Gelap + sian neon, futuristik ala cyberpunk.',
    colors: {
      bg: 'oklch(0.15 0.03 250)', panel: 'oklch(0.20 0.04 250)',
      brand: 'oklch(0.80 0.16 195)', text: 'oklch(0.95 0.02 250)', accent: 'oklch(0.85 0.15 320)',
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

// Turunkan muted dari warna teks (konstan)
function mixMuted(text) {
  return text.replace(/oklch\(([\d.]+) /, (_, L) => `oklch(${Math.max(0, parseFloat(L) - 0.28).toFixed(2)} `)
}

// Border = panel diset lightness-nya
function mixBorder(panel) {
  return panel.replace(/oklch\(([\d.]+) /, (_, L) => `oklch(${Math.min(1, parseFloat(L) + 0.10).toFixed(2)} `)
}
