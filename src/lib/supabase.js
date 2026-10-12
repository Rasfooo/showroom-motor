// Supabase client — ambil dari environment variable (Vite).
// Di Cloudflare Pages, set di Dashboard -> Settings -> Environment Variables:
//   VITE_SUPABASE_URL = https://gizwojnypljuvtahiiop.supabase.co
//   VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_...
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  // Beri pesan jelas kalau env belum di-set (jangan commit key ke kode).
  console.error(
    'Supabase env belum di-set. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.'
  )
}

export const supabase = createClient(url ?? '', key ?? '')

// Helper format harga Rupiah
export const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)

// Helper bikin slug unik dari nama showroom
export const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Helper bikin link WhatsApp seller (nomor sudah format 62xxx)
export const waLink = (phone, text) => {
  const clean = (phone ?? '').replace(/[^0-9]/g, '')
  const msg = encodeURIComponent(text ?? '')
  return `https://wa.me/${clean}${msg ? `?text=${msg}` : ''}`
}
