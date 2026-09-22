# CLAUDE.md — Nyambi Ngopi POS

> File ini adalah panduan untuk AI assistant (Claude/Gemini/etc.) agar tidak berasumsi
> dan selalu mengikuti konvensi proyek ini.

---

## 🎯 Tujuan Proyek

Aplikasi **Point of Sale (POS)** untuk kafe **Nyambi Ngopi Depok**. Digunakan oleh kasir di tablet
dan mobile. Terinspirasi dari sistem MokaPOS — fungsional, cepat, dan mudah digunakan.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | TailwindCSS (utility-first) |
| UI Components | Custom Radix UI primitives (Shadcn-style) |
| State Management | Zustand |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Date | date-fns |
| Print | react-to-print |

---

## 📁 Struktur Proyek

```
src/
├── components/
│   ├── layout/        # Sidebar, Header, Layout wrapper
│   ├── pos/           # Komponen halaman kasir (POS)
│   ├── menu/          # Manajemen menu & produk
│   ├── reports/       # Laporan penjualan
│   └── ui/            # Reusable UI primitives (Button, Modal, dll)
├── hooks/             # Custom React hooks (useProducts, useOrders, dll)
├── lib/
│   ├── supabase.ts    # Supabase client singleton
│   └── utils.ts       # Utility functions (cn, formatCurrency, dll)
├── pages/             # Halaman utama (POSPage, MenuPage, dll)
├── store/             # Zustand stores (cart, auth, settings)
└── types/             # TypeScript interfaces & types
supabase/
└── schema.sql         # DDL lengkap + seed data
```

---

## 🗄️ Database Schema (Supabase)

### Tabel Utama

- **profiles** — Data user/kasir (linked ke `auth.users`)
- **categories** — Kategori menu (Kopi, Non-Kopi, Makanan, dll)
- **products** — Data produk/menu dengan harga, stok, foto
- **orders** — Header transaksi (total, metode bayar, status)
- **order_items** — Detail item per transaksi
- **settings** — Konfigurasi toko (nama, alamat, pajak, dll)

### RLS (Row Level Security)
- Semua tabel memiliki RLS enabled
- Kasir hanya bisa CREATE order, tidak bisa DELETE
- Admin/Owner bisa full CRUD

---

## 🎨 Design System

### Warna (CSS Variables di index.css)
- Primary: Hijau tua (forest green, `emerald-*` scale di tailwind.config.js) — sesuai logo Nyambi Ngopi
- Background: Light mode dengan aksen hijau; Sidebar & elemen brand pakai hijau tua (`#0d3d20`)
- Surface: Card putih/soft dengan border tipis
- Logo: `src/components/ui/Logo.tsx` — mark badge "NYAMBI / コーヒー", dipakai di Sidebar & LoginPage
- Animasi: transisi halaman, modal, dan micro-interaction ada di `tailwind.config.js` (keyframes) + `src/index.css` (`.animate-*`, `.press`)

### Typography
- Font: **Inter** (dari Google Fonts)
- Heading: Semi-bold
- Body: Regular

### Responsif
- **Mobile**: < 768px — single column, bottom nav
- **Tablet**: 768px–1024px — target utama, split layout
- **Desktop**: > 1024px — full sidebar

---

## 🔧 Konvensi Koding

### TypeScript
- **SELALU** gunakan TypeScript, tidak ada `any` kecuali terpaksa
- Interface didefinisikan di `src/types/index.ts`
- Gunakan strict mode

### Komponen React
- Functional components + hooks saja (tidak ada class component)
- Props di-type dengan interface eksplisit
- Export default untuk pages, named export untuk komponen kecil

### State Management
- **Zustand** untuk global state (cart, auth, settings)
- **React Query / SWR pattern** via custom hooks untuk server state
- Jangan taruh server state di Zustand

### Naming Convention
- Komponen: PascalCase (`ProductGrid.tsx`)
- Hooks: camelCase dengan prefix `use` (`useProducts.ts`)
- Utilities: camelCase (`formatCurrency`)
- Konstanta: SCREAMING_SNAKE_CASE (`PAYMENT_METHODS`)

### Supabase
- **SELALU** handle error dari setiap query Supabase
- Gunakan `supabase.ts` singleton, jangan buat client baru
- Realtime subscription dibersihkan di useEffect cleanup

---

## 💰 Bisnis Logic

### Alur Transaksi
1. Kasir pilih produk → tambah ke keranjang
2. Atur quantity, diskon per item (opsional)
3. Tambah diskon total (opsional)
4. Pilih metode pembayaran (Cash / QRIS / Transfer)
5. Jika Cash: input nominal bayar → sistem hitung kembalian
6. Konfirmasi → order tersimpan ke DB
7. Cetak struk (opsional)

### Status Order
- `pending` — Order dibuat, belum dibayar
- `completed` — Sudah dibayar
- `cancelled` — Dibatalkan/void

### Metode Pembayaran
- `cash` — Tunai
- `qris` — QRIS / QR Code
- `transfer` — Transfer bank

### Format Mata Uang
- **IDR (Rupiah)** — format: `Rp 15.000`
- Gunakan fungsi `formatCurrency(amount)` dari `src/lib/utils.ts`
- Tidak ada desimal untuk IDR

---

## 🖨️ Cetak Struk

- Menggunakan `react-to-print` + `window.print()`
- Struk berformat thermal 58mm / 80mm
- Isi struk: Logo toko, nama toko, alamat, nomor struk, tanggal/waktu, daftar item, subtotal, diskon, pajak, total, metode bayar, kembalian (jika cash), footer
- CSS khusus print di `src/index.css` (class `.receipt-print`)

---

## 📊 Laporan

- Laporan Harian: ringkasan hari ini
- Laporan Mingguan: 7 hari terakhir
- Laporan Bulanan: bulan berjalan
- Chart: Bar chart penjualan per hari
- Top Produk: 10 produk terlaris
- Export: CSV download

---

## ⚙️ Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> File `.env` TIDAK di-commit ke git. Gunakan `.env.example` sebagai template.

---

## 🚫 Larangan (Jangan Lakukan Ini)

1. Jangan gunakan `any` di TypeScript tanpa alasan kuat
2. Jangan hardcode URL atau key Supabase — gunakan env vars
3. Jangan buat state baru di Zustand untuk server data
4. Jangan gunakan `console.log` di production code
5. Jangan hapus RLS dari tabel Supabase
6. Jangan gunakan CSS inline — gunakan Tailwind classes
7. Jangan buat komponen > 300 baris — pecah jika perlu

---

## ✅ Checklist Sebelum Commit

- [ ] `npm run build` sukses tanpa error
- [ ] `npm run lint` sukses tanpa warning kritis
- [ ] Responsif di 375px (mobile) dan 768px (tablet)
- [ ] Semua form input divalidasi
- [ ] Error dari Supabase ditangani dan ditampilkan ke user
