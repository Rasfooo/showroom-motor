# 🏍️ Showroom Motor — Katalog Multi-Seller

Aplikasi web katalog motor untuk penjual (seller) yang berjualan via live TikTok.
Setiap seller punya **showroom sendiri** dengan logo, daftar motor, dan **tombol Chat WhatsApp**
yang langsung terhubung ke nomor WA penjualnya.

Dibangun dengan **React + Vite + Supabase** — siap deploy ke **Cloudflare Pages** (gratis).

---

## ✨ Fitur

### Untuk Pembeli (Publik — tanpa login)
- Katalog semua showroom aktif + motor yang tersedia
- Filter per showroom (chips di atas)
- Kartu motor: foto, nama, merek, tahun, harga (Rp), kondisi (Baru/Bekas), deskripsi
- **Tombol 💬 Chat WhatsApp** → buka `wa.me/<nomor seller>` dengan pesan otomatis (nama motor + harga)
- Akses: `/?toko=<slug-showroom>` untuk lihat 1 showroom tertentu

### Untuk Penjual (Seller — login)
- **Register / Login** (email + password, Supabase Auth)
- Auto-bikin profil showroom (nama, slug, nomor WA, lokasi)
- **Dashboard CRUD motor**: Tambah / Edit / Hapus / toggle Tersedia–Terjual
- **Upload foto motor** → Supabase Storage (folder per seller)
- **Upload logo showroom**
- Edit profil showroom (nama, WA, lokasi, logo)
- Tombol "Lihat Katalog" → buka halaman publik showroom-nya

---

## 🔐 Keamanan (Row Level Security)

Semua keamanan dijaga di **level database** (Supabase RLS), bukan cuma di tampilan:

| Aksi | Aturan |
|---|---|
| Seller baca/motornya sendiri | ✅ boleh (`auth.uid() = seller_id`) |
| Seller **update/hapus motor seller lain** | ❌ ditolak RLS |
| Publik baca motor `is_available = true` | ✅ boleh (katalog publik) |
| Publik baca showroom `is_active = true` | ✅ boleh |
| Upload foto | ✅ hanya ke folder `sellers/<uid>/` miliknya sendiri |

**Bukti teruji:** update motor seller A oleh seller B → **0 baris terpengaruh**, data tidak berubah.

---

## 🗄️ Database (Supabase)

Tabel dibuat via **SQL Editor** (sekali jalan). Lihat `setup_supabase.sql`:

- **`sellers`** — profil showroom: `id` (FK auth.users), `email`, `showroom_name`, `slug`, `whatsapp`, `logo_url`, `location`, `is_active`
- **`motos`** — katalog motor: `id`, `seller_id` (FK sellers), `title`, `brand`, `year`, `price`, `condition`, `description`, `image_url`, `is_available`
- **Storage bucket** `motor-images` (public) — foto motor + logo, folder per `seller_id`

---

## 🚀 Cara Menjalankan (Lokal)

```bash
npm install
cp .env.local .env   # atau set env var (lihat bawah)
npm run dev          # buka http://localhost:5173
```

### Environment Variables

Buat file `.env.local`:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> `VITE_` prefix = aman dibuka di browser, karena memang pakai *publishable key* + RLS.
> **Jangan pernah** taruh `sb_secret_` (service_role) di kode frontend.

---

## ☁️ Deploy ke Cloudflare Pages (Gratis)

1. Push repo ini ke GitHub
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Pilih repo ini, settings build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Environment Variables** (Settings → Environment variables → Production):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Deploy → dapat URL `https://<nama>.pages.dev`

### Custom Domain per Seller
- Beli domain → di **DNS Cloudflare** tambah record `CNAME` → `<nama>.pages.dev`
- Arahkan ke app → app membaca `window.location` / param `?toko=` untuk tampilkan showroom yang sesuai
- Alternatif ringan: pakai **1 domain** + **subdomain per seller** (`toko1.domain.com`)

---

## 📁 Struktur Proyek

```
showroom-motor/
├── public/
│   └── _redirects          # SPA fallback (semua route → index.html)
├── src/
│   ├── context/
│   │   └── AuthContext.jsx # session + profil seller
│   ├── lib/
│   │   └── supabase.js     # client Supabase + helper (formatRupiah, waLink, slugify)
│   ├── pages/
│   │   ├── PublicCatalog.jsx  # katalog publik + tombol WA
│   │   ├── Auth.jsx           # login / register
│   │   └── Dashboard.jsx      # CRUD motor + profil showroom
│   ├── App.jsx             # routing
│   ├── main.jsx            # entry point
│   └── index.css           # styling (dark theme)
├── .env.local              # config Supabase (TIDAK di-commit)
├── vite.config.js
└── package.json
```

---

## 🛠️ Stack

- **Frontend:** React 19 + React Router + Vite
- **Backend/DB:** Supabase (Postgres + Auth + Storage + RLS)
- **Hosting:** Cloudflare Pages (gratis, custom domain)
- **Chat:** WhatsApp deep-link (`wa.me`)

---

## 📌 Catatan

- **Rate limit Supabase Free:** signup email dibatasi per jam. Untuk produksi, pertimbangkan OTP WhatsApp / matikan konfirmasi email (Auth → Settings).
- **Storage Free:** 1 GB. Kompres foto motor sebelum upload (atau tambah resize otomatis).
- **Multi-tenant:** setiap seller terisolasi oleh `seller_id` + RLS. Aman untuk banyak seller.
