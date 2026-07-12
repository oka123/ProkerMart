<div align="center">

# <img width="36" height="36" alt="favicon-96x96" src="https://github.com/user-attachments/assets/257d3dd4-b0d0-4318-8d62-d00a8942633b" /> ProkerMart

**Digital Marketplace Ecosystem untuk Organisasi Mahasiswa**

Platform marketplace eksklusif yang memungkinkan organisasi mahasiswa (Ormawa) menjual merchandise, makanan, dan layanan melalui toko digital berbasis program kerja (Proker).

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Struktur Folder](#-struktur-folder)
- [Skema Database](#-skema-database)
- [Cara Setup](#-cara-setup)
- [Environment Variables](#-environment-variables)
- [Skrip yang Tersedia](#-skrip-yang-tersedia)
- [Peran Pengguna](#-peran-pengguna)
- [Alur Pembayaran](#-alur-pembayaran)
- [Kontribusi](#-kontribusi)

---

## 🎯 Tentang Proyek

**ProkerMart** adalah ekosistem marketplace digital yang dirancang khusus untuk organisasi mahasiswa (Ormawa). Setiap organisasi dapat memiliki **Toko** utama, dan setiap Toko dapat memiliki beberapa **Sub-Toko** yang mewakili program kerja (Proker) spesifik seperti bazar, penjualan merchandise, atau layanan jasa.

### Latar Belakang

Selama ini, kegiatan penggalian dana Ormawa masih dilakukan secara manual, yaitu mencatat pesanan di buku, mengelola stok di spreadsheet, dan mengonfirmasi pembayaran lewat chat. ProkerMart hadir untuk mendigitalisasi seluruh proses ini dalam satu platform yang terstruktur dan akuntabel.

---

## ✨ Fitur Utama

### 👤 Untuk Pembeli (Mahasiswa)

- 🔍 **Jelajahi toko** organisasi di kampus
- 🛒 **Keranjang belanja** dengan multi-toko
- 📦 **Sistem pesanan** dengan pelacakan status real-time
- 💳 **Pembayaran online** via Midtrans (QRIS)
- 📍 **Peta toko terdekat** berbasis geolokasi (Leaflet.js)
- 🔔 **Push notification** untuk update status pesanan
- ⭐ **Ulasan & rating** sub-toko
- 🎟️ **Voucher diskon** dari toko

### 🏪 Untuk Panitia / Proker (Sub-Toko)

- 📊 **Dashboard penjualan** dengan rekap real-time
- 📦 **Manajemen produk** (stok, harga, pre-order)
- 🚀 **Manajemen pesanan** (konfirmasi, proses, kirim)
- 🛵 **Sistem delivery** dengan tracking kurir panitia
- 💬 **Chat langsung** dengan pembeli
- 📝 **Rekap penjualan offline** (untuk booth fisik)
- 👥 **Manajemen tim** dengan role dan undangan
- 💰 **Penarikan saldo** ke rekening bank

### 🏢 Untuk Organisasi (Toko Utama)

- 🏗️ **Kelola sub-toko** (daftar semua Proker)
- 👥 **Manajemen anggota** organisasi
- 📊 **Agregat laporan** penjualan seluruh Proker
- ⚙️ **Pengaturan toko** dan verifikasi

### 🛡️ Untuk Admin Platform

- ✅ **Verifikasi organisasi** (approve/reject/suspend)
- 📢 **Undangan pendaftaran** organisasi via email
- 💬 **Chat dukungan** (sistem percakapan)
- 👁️ **Pantau seluruh aktivitas** platform

---

## 🧰 Tech Stack

| Kategori       | Teknologi                                            | Versi  |
| -------------- | ---------------------------------------------------- | ------ |
| **Framework**  | [Next.js](https://nextjs.org/) (App Router)          | 16.2.x |
| **Library UI** | [React](https://react.dev/)                          | 19.x   |
| **Bahasa**     | [TypeScript](https://www.typescriptlang.org/)        | 5.x    |
| **Styling**    | [Tailwind CSS](https://tailwindcss.com/) v4          | 4.x    |
| **Animasi**    | [Framer Motion](https://www.framer.com/motion/)      | 12.x   |
| **Ikon**       | [Lucide React](https://lucide.dev/)                  | 1.x    |
| **Database**   | [Supabase](https://supabase.com/) (PostgreSQL 17)    | —      |
| **Auth**       | Supabase Auth                                        | —      |
| **Storage**    | Supabase Storage                                     | —      |
| **Peta**       | [Leaflet.js](https://leafletjs.com/) + React Leaflet | 1.9.x  |
| **Pembayaran** | [Midtrans](https://midtrans.com/)                    | —      |
| **Email**      | Nodemailer (SMTP)                                    | 9.x    |
| **Push Notif** | Web Push API + VAPID                                 | —      |
| **QR Code**    | html5-qrcode + qrcode.react                          | —      |
| **Tanggal**    | date-fns                                             | 4.x    |
| **Deploy**     | [Vercel](https://vercel.com/)                        | —      |

---

## 🏗️ Arsitektur Sistem

```
ProkerMart
├── Frontend (Next.js App Router)
│   ├── Server Components (SSR/SSG)
│   ├── Client Components (interaktif)
│   └── API Routes (/api/*)
│
├── Backend (Supabase)
│   ├── PostgreSQL Database
│   ├── Row Level Security (RLS)
│   ├── Edge Functions (Triggers)
│   └── Realtime (WebSocket)
│
├── Storage (Supabase Storage)
│   ├── foto_produk/
│   ├── logo_organisasi/
│   └── profil_pengguna/
│
├── Pembayaran (Midtrans)
│   ├── Snap.js (checkout UI)
│   └── Webhook (konfirmasi)
│
└── Notifikasi
    ├── Web Push API (browser push)
    └── Supabase Trigger → Webhook
```

### Hierarki Toko

```
Platform (Admin)
└── Organisasi (Ketua Ormawa)
    └── Toko (satu per Organisasi)
        ├── Sub-Toko A (Proker Bazar Makanan)
        │   ├── Produk
        │   ├── Pesanan
        │   └── Tim Panitia
        ├── Sub-Toko B (Proker Merchandise)
        └── Sub-Toko C (Proker Jasa)
```

---

## 📁 Struktur Folder

```
Web-ProkerMart/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page / Home
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Global styles
│   │   │
│   │   ├── auth/                     # Halaman autentikasi
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── callback/             # OAuth callback
│   │   │
│   │   ├── explore/                  # Jelajahi toko & produk
│   │   ├── cart/                     # Keranjang belanja
│   │   ├── checkout/                 # Proses checkout
│   │   ├── user/                     # Profil & pesanan pembeli
│   │   ├── invite/                   # Halaman penerimaan undangan
│   │   ├── organizations/            # Direktori organisasi publik
│   │   │
│   │   ├── dashboard/                # Dashboard Panitia (Sub-Toko)
│   │   │   ├── page.tsx              # Ringkasan & statistik
│   │   │   ├── products/             # Kelola produk
│   │   │   ├── orders/               # Kelola pesanan
│   │   │   ├── delivery/             # Sistem delivery
│   │   │   ├── pickup/               # Sistem pickup
│   │   │   ├── team/                 # Manajemen tim
│   │   │   ├── reports/              # Laporan & rekap
│   │   │   ├── chat/                 # Chat dengan pembeli
│   │   │   ├── notifikasi/           # Notifikasi
│   │   │   ├── settings/             # Pengaturan toko
│   │   │   ├── akun/                 # Profil akun
│   │   │   └── bantuan/              # Bantuan & dukungan
│   │   │
│   │   ├── org-dashboard/            # Dashboard Organisasi (Ketua)
│   │   │   ├── page.tsx              # Overview organisasi
│   │   │   ├── stores/               # Kelola sub-toko
│   │   │   ├── members/              # Kelola anggota
│   │   │   ├── agregat/              # Laporan agregat
│   │   │   ├── settings/             # Pengaturan organisasi
│   │   │   ├── account/              # Profil akun
│   │   │   ├── bantuan/              # Bantuan
│   │   │   └── notifications/        # Notifikasi
│   │   │
│   │   └── api/                      # API Routes
│   │       ├── payment/              # Midtrans payment
│   │       ├── webhooks/             # Supabase webhooks
│   │       ├── push-notification/    # Web Push
│   │       ├── send-invite/          # Kirim undangan email
│   │       └── ...
│   │
│   ├── components/                   # Komponen reusable
│   │   ├── Navbar.tsx                # Navigasi utama
│   │   ├── ChatPopup.tsx             # Chat popup UI
│   │   ├── MapArea.tsx               # Peta interaktif
│   │   ├── PushNotificationManager.tsx
│   │   ├── PwaInstallPrompt.tsx      # PWA install banner
│   │   ├── ui/                       # Primitive UI components
│   │   ├── org/                      # Komponen organisasi
│   │   ├── user/                     # Komponen profil user
│   │   ├── explore/                  # Komponen halaman explore
│   │   └── delivery/                 # Komponen delivery
│   │
│   └── lib/                          # Utilities & konfigurasi
│       ├── supabase/                 # Supabase clients
│       ├── midtrans/                 # Midtrans config
│       ├── types/                    # TypeScript type definitions
│       ├── context/                  # React context providers
│       ├── notifications.ts          # Push notification helper
│       ├── email.ts                  # Email helper
│       └── utils.ts                  # General utilities
│
├── supabase/
│   └── migrations/
│       └── 20260713000000_full_schema.sql  # ← Migration lengkap
│
├── public/                           # Static assets
├── .env.example                      # Template environment variables
├── next.config.ts                    # Next.js konfigurasi
├── package.json
└── tsconfig.json
```

---

## 🗄️ Skema Database

Database menggunakan **PostgreSQL** via Supabase dengan **26 tabel** dan **RLS (Row Level Security)** aktif di semua tabel.

### Tabel Utama

| Tabel                  | Deskripsi                                |
| ---------------------- | ---------------------------------------- |
| `pengguna`             | Akun pengguna (mirror dari `auth.users`) |
| `organisasi`           | Data organisasi mahasiswa                |
| `toko`                 | Toko utama per-organisasi                |
| `sub_toko`             | Sub-toko per-proker                      |
| `sub_toko_member`      | Tim panitia sub-toko                     |
| `produk`               | Produk yang dijual                       |
| `pesanan`              | Transaksi pembelian                      |
| `detail_pesanan`       | Item dalam pesanan                       |
| `pembayaran`           | Rekam pembayaran                         |
| `notifikasi`           | In-app notifications                     |
| `keranjang`            | Shopping cart                            |
| `voucher`              | Voucher diskon                           |
| `chat_toko`            | Chat room toko-pembeli                   |
| `rekap_jualan_offline` | Rekap penjualan fisik                    |
| `penarikan_saldo`      | Request penarikan dana                   |

### Replikasi Database

Gunakan file migration lengkap yang telah tersedia:

```bash
# Via Supabase Dashboard > SQL Editor
# Paste dan jalankan isi file:
supabase/migrations/20260713000000_full_schema.sql

# Atau via Supabase CLI:
npm run db:push
```

### Enum Types

```sql
user_role          -- pembeli | organisasi | proker | admin
order_status       -- menunggu_pembayaran | diproses | selesai | ...
payment_method     -- qris | cod
active_status      -- active | inactive | suspended
sub_toko_role_enum -- KetuaProker | BendaharaProker | ...
member_role        -- ketua | wakil_ketua | sekretaris | ...
```

---

## 🚀 Cara Setup

### Prasyarat

- **Node.js** >= 18.x
- **npm** >= 9.x
- Akun **Supabase** (gratis)
- Akun **Midtrans** (Sandbox untuk development)
- SMTP Email (Gmail / Mailtrap untuk dev)
- VAPID Key pair (untuk Web Push)

### 1. Clone Repository

```bash
git clone https://github.com/Arxy-Wins/Web-ProkerMart.git
cd Web-ProkerMart
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
# Salin template env
cp .env.example .env.local

# Edit .env.local dengan nilai yang sesuai
# (lihat bagian Environment Variables di bawah)
```

### 4. Setup Database Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** di Dashboard Supabase
3. Paste dan jalankan seluruh isi file:
   ```
   supabase/migrations/20260713000000_full_schema.sql
   ```
4. Pastikan semua tabel, fungsi, dan RLS policy terbuat dengan sukses

> **⚠️ Catatan:** Sebelum menjalankan migration, update URL webhook pada trigger `"Notifikasi Perubahan Status Pesanan"` di akhir file ke URL deployment Anda.

### 5. Generate VAPID Keys (Push Notification)

```bash
npx web-push generate-vapid-keys
```

Salin output `Public Key` dan `Private Key` ke `.env.local`.

### 6. Jalankan Development Server

```bash
# Standard (HTTP)
npm run dev

# HTTPS (diperlukan untuk Web Push & Geolocation)
npm run dev-https
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 7. (Opsional) Expose ke Internet dengan Tunnel

Diperlukan untuk testing Midtrans webhook dan push notification:

```bash
# Cloudflare Tunnel
npm run tunnel

# Atau gunakan ngrok
npx ngrok http 3000
```

---

## 🔐 Environment Variables

Buat file `.env.local` di root project dan isi variabel berikut:

```env
# ============================================================
# SUPABASE
# Dapatkan dari: https://app.supabase.com/project/_/settings/api
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================================
# MIDTRANS (Payment Gateway)
# Dapatkan dari: https://dashboard.midtrans.com
# Gunakan kunci Sandbox untuk development
# ============================================================
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx

# ============================================================
# EMAIL (SMTP)
# Untuk development: gunakan Mailtrap (https://mailtrap.io)
# Untuk production: gunakan Gmail, SendGrid, dll.
# ============================================================
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_PORT=587

# ============================================================
# WEB PUSH NOTIFICATION (VAPID)
# Generate dengan: npx web-push generate-vapid-keys
# ============================================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-vapid-key
VAPID_PRIVATE_KEY=your-private-vapid-key
VAPID_SUBJECT=mailto:email-anda@gmail.com

# ============================================================
# APP URL
# Gunakan URL publik saat development dengan tunnel
# ============================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📜 Skrip yang Tersedia

```bash
# Development
npm run dev              # HTTP dev server (localhost:3000)
npm run dev-https        # HTTPS dev server (untuk Push & Geolocation)
npm run dev-local        # HTTP terbatas ke localhost (tanpa network)
npm run dev-https-local  # HTTPS terbatas ke localhost

# Build & Production
npm run build            # Build production bundle
npm run start            # Jalankan production server

# Database
npm run db:push          # Push migration ke Supabase (perlu Supabase CLI)

# Tools
npm run lint             # ESLint check
npm run tunnel           # Expose ke internet via Cloudflare Tunnel
```

---

## 👥 Peran Pengguna

| Role         | Deskripsi                  | Akses Utama                                  |
| ------------ | -------------------------- | -------------------------------------------- |
| `pembeli`    | Mahasiswa / pelanggan umum | Explore, Cart, Checkout, Pesanan             |
| `proker`     | Panitia program kerja      | Dashboard penjualan, Kelola produk & pesanan |
| `organisasi` | Pengurus inti Ormawa       | Org Dashboard, Kelola sub-toko & anggota     |
| `admin`      | Admin platform ProkerMart  | Verifikasi org, Undangan, Chat dukungan      |

### Alur Registrasi Role

```
Pembeli     → Daftar mandiri (self-register)
Organisasi  → Mendapat undangan dari Admin → Daftar dengan link khusus
Proker      → Mendapat undangan dari Ketua Organisasi/Sub-Toko
Admin       → Mendapat undangan dari Admin yang sudah ada
```

---

## 💳 Alur Pembayaran

```
Pembeli checkout
      ↓
Buat pesanan (status: menunggu_pembayaran)
      ↓
Pilih metode: QRIS / COD
      ↓
[Online - Midtrans Snap]         
      ↓                                 
Midtrans payment page                   [COD]
      ↓                                   ↓
Midtrans webhook                Pembayaran diterima
      ↓                                   ↓
status: menunggu_konfirmasi → diproses → siap_diambil/dikirim → selesai
```

---

## 🗺️ Fitur Geolokasi & Peta

- **Peta toko terdekat** menggunakan [Leaflet.js](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/)
- **Algoritma Haversine** di database untuk query sub-toko terdekat
- **Tracking kurir** real-time saat status pesanan `dikirim`
- Memerlukan izin lokasi browser dan **HTTPS** untuk akses geolokasi

---

## 📱 Progressive Web App (PWA)

ProkerMart mendukung instalasi sebagai PWA:

- **Install prompt** otomatis di mobile browser
- **Offline support** via Service Worker
- **Push notification** via Web Push API (VAPID)
- **App icon** dan splash screen

---

## 🤝 Kontribusi

1. **Fork** repository ini
2. Buat **branch fitur**: `git checkout -b feat/nama-fitur`
3. **Commit** perubahan: `git commit -m "feat: tambah fitur X"`
4. **Push** ke branch: `git push origin feat/nama-fitur`
5. Buat **Pull Request**

### Konvensi Kode

- **Bahasa kode**: English (variabel, fungsi, komentar)
- **Bahasa UI**: Bahasa Indonesia
- **Commit format**: [Conventional Commits](https://www.conventionalcommits.org/)
- **Komponen maksimal**: 300 baris per file
- **Error handling**: Selalu gunakan `try-catch` dengan log informatif

---

<div align="center">

Dibuat oleh Kelompok 1 Kelas A Informatika 2024

</div>
