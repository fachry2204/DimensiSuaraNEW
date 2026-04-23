# Dimensi Suara CMS

Aplikasi CMS untuk manajemen distribusi musik, royalti, dan katalog lagu.

## Persyaratan Sistem

Sebelum memulai, pastikan komputer Anda telah terinstal:

1.  **Node.js** (versi 16 atau lebih baru)
2.  **MySQL Server** (Pastikan service MySQL berjalan)

## Instalasi dari Awal

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan aplikasi:

### 1. Clone Repository (Jika belum)
```bash
git clone <repository-url>
cd DimensiSuaraNEW
```

### 2. Install Dependencies
Install semua library yang dibutuhkan untuk frontend dan backend:
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasinya:
```bash
cp .env.example .env
```
Atau buat file `.env` baru dengan isi sebagai berikut:
```env
# Konfigurasi Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=dimensi_suara_db

# Konfigurasi Server
PORT=3000
JWT_SECRET=rahasia_super_aman_ganti_ini
```
*Catatan: Pastikan `DB_PASSWORD` sesuai dengan password root MySQL di komputer Anda.*

### 4. Setup Database
Jalankan perintah ini untuk membuat database dan tabel-tabel yang diperlukan:
```bash
npm run db:init
```
*Jika berhasil, akan muncul pesan "Database initialized successfully!".*

### 5. Menjalankan Aplikasi

Anda perlu menjalankan dua terminal terpisah:

**Terminal 1 (Backend Server):**
```bash
npm run server
```
Server akan berjalan di `http://localhost:3000`.

**Terminal 2 (Frontend React):**
```bash
npm run dev
```
Aplikasi web akan berjalan di `http://localhost:5173`.

## Akun Default
- **Username:** admin
- **Password:** admin123

## Struktur Folder
- `/server`: Kode backend (Node.js + Express)
- `/screens`: Halaman frontend (React)
- `/components`: Komponen UI reusable
- `/utils`: Fungsi bantuan dan konfigurasi API

## Cara Install di Plesk (Hosting)

Jika Anda menggunakan hosting dengan panel Plesk, ikuti langkah berikut:

### 1. Persiapan di Hosting
1.  Pastikan hosting Anda mendukung **Node.js**.
2.  Masuk ke Plesk, pilih menu **Node.js**.
3.  Aktifkan Node.js untuk subdomain **cms.dimensisuara.id**.
4.  Buat database MySQL baru di menu **Databases** (sesuai langkah sebelumnya).

### 2. Upload File
Karena Anda menggunakan subdomain, lokasi folder biasanya bukan di `httpdocs`, melainkan di folder dengan nama subdomain tersebut (misal: `/cms.dimensisuara.id`).

**Cara A: Menggunakan Git (Recomended)**
1.  Pastikan project sudah di-push ke GitHub/GitLab.
2.  Masuk ke Plesk, pilih menu **Git**.
3.  Tambahkan repository Anda.
4.  Plesk akan otomatis clone file. Pastikan target direktorinya adalah root dari subdomain Anda (misal: `/cms.dimensisuara.id`).
5.  Setiap ada update, cukup klik **Pull Updates** di Plesk.

**Cara B: Upload Manual (ZIP)**
1.  Di komputer lokal, jalankan `npm run build`.
2.  Compress/ZIP folder project (kecuali `node_modules` dan `.git`).
3.  Upload ZIP ke File Manager Plesk (masuk ke folder subdomain: `/cms.dimensisuara.id`).
4.  Extract file ZIP tersebut.

### 3. Konfigurasi Node.js di Plesk
Setelah file terupload, masuk ke menu **Node.js** di Plesk dan atur:
-   **Document Root:** `/cms.dimensisuara.id` (atau sesuai nama folder subdomain Anda)
-   **Application Mode:** `Production`
-   **Application Startup File:** `server/index.js`
-   **Package Manager:** `npm`

Klik tombol **NPM Install** untuk menginstall dependencies di server.

### 4. Setting Environment Variables
Di menu Node.js, klik tombol **Environment Variables** (atau edit file `.env` secara manual di File Manager jika tombol tidak ada). Tambahkan:

```
DB_HOST=localhost
DB_USER=nama_user_db_plesk
DB_PASSWORD=password_db_plesk
DB_NAME=cmsdimensi
PORT=3000
JWT_SECRET=rahasia_aman_123
```

### 5. Import Database
Karena database Anda bernama `cmsdimensi`, kita import tabelnya secara manual:

1.  Buka **phpMyAdmin** di Plesk.
2.  Pilih database **cmsdimensi**.
3.  Klik tab **Import**.
4.  Upload file `server/schema.sql` dari folder project Anda.
5.  Klik **Go/Kirim**.

### 6. Restart App
Kembali ke menu Node.js di Plesk, klik tombol **Restart Application**.

Aplikasi Anda sekarang sudah online!

