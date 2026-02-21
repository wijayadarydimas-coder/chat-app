```markdown
# 🚀 Cosmed Chat App

Ini adalah proyek web pribadi (Chat App) yang dibangun menggunakan **Next.js**, **TypeScript**, dan **Tailwind CSS**. Data disimpan di **MongoDB** yang dijalankan melalui **Docker**.

---

## 📂 Struktur Proyek

Proyek ini terbagi menjadi dua folder utama:
* `chat-app/` : Aplikasi Next.js (Frontend & API).
* `MongoDB/` : Konfigurasi database menggunakan Docker Compose.

---

## 🛠️ Prasyarat

Sebelum menjalankan aplikasi, pastikan Anda sudah menginstall:
* [Node.js](https://nodejs.org/) (Rekomendasi versi LTS)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* NPM (Sudah termasuk saat install Node.js)

---

## 🚀 Cara Menjalankan Aplikasi

Ikuti urutan langkah di bawah ini:

### 1. Menjalankan Database (Docker)
Buka terminal, arahkan ke folder `MongoDB`, lalu jalankan container:
```bash
cd MongoDB
docker-compose up -d

```

*Database akan berjalan di `localhost:27017` secara default.*

### 2. Instalasi Dependency (Next.js)

Buka terminal baru, masuk ke folder `chat-app`, dan jalankan perintah berikut:

**Instalasi Library Utama:**

```bash
cd chat-app
npm install uuid

```

**Instalasi Development Tools (Typescript & Tailwind):**

```bash
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/js-cookie @types/node @types/react @types/react-dom typescript tailwindcss @tailwindcss/postcss

```

### 3. Menjalankan Server Development

Di dalam folder `chat-app`, jalankan perintah berikut:

```bash
npm run dev

```

Buka browser dan akses: [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)

---

## 📦 Stack Teknologi

| Komponen | Teknologi |
| --- | --- |
| **Framework** | Next.js (App Router) |
| **Bahasa** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | MongoDB |
| **Container** | Docker |
| **Auth** | JWT & BcryptJS |

---

## 📝 Catatan Penting

* Pastikan file `.env` sudah dikonfigurasi di dalam folder `chat-app` (misal: `MONGODB_URI`).
* Jika ingin menghentikan database, gunakan command `docker-compose down` di dalam folder `MongoDB`.

---

**Dibuat oleh [ME]*