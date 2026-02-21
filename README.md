# COSMED Chat App

Web pribadi berbasis **Next.js** yang terintegrasi dengan **MongoDB** sebagai database.
Project ini dipisahkan menjadi dua folder utama:

```
C:\Users\daryd\ITSME\Programming\COSMED\
│
├── chat-app      → Aplikasi Next.js (Frontend + API Routes)
└── MongoDB       → Konfigurasi Docker untuk MongoDB
```

MongoDB dijalankan menggunakan **Docker Compose**, sedangkan Next.js dijalankan menggunakan **npm**.

---

## 📦 Tech Stack

* Next.js
* TypeScript
* Tailwind CSS
* MongoDB
* Docker
* bcryptjs
* jsonwebtoken
* js-cookie
* uuid

---

# 🚀 Cara Menjalankan Project

## 1️⃣ Clone / Siapkan Folder

Pastikan struktur folder seperti berikut:

```
COSMED/
 ├── chat-app
 └── MongoDB
```

---

# 🐳 Menjalankan MongoDB (Docker)

Masuk ke folder MongoDB:

```bash
cd C:\Users\daryd\ITSME\Programming\COSMED\MongoDB
```

Pastikan sudah terdapat file `docker-compose.yml`.

Lalu jalankan:

```bash
docker-compose up -d
```

Untuk mengecek container berjalan:

```bash
docker ps
```

Untuk menghentikan MongoDB:

```bash
docker-compose down
```

---

# 🌐 Menjalankan Next.js App

Masuk ke folder chat-app:

```bash
cd C:\Users\daryd\ITSME\Programming\COSMED\chat-app
```

## Install Dependencies

### Install Type Definitions & Tailwind

```bash
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/js-cookie @types/node @types/react @types/react-dom typescript tailwindcss @tailwindcss/postcss
```

### Install UUID

```bash
npm install uuid
```

Atau jika belum pernah install dependency sama sekali:

```bash
npm install
```

---

## Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di:

```
http://localhost:3000
```

---

# ⚙️ Environment Configuration

Pastikan file `.env.local` di dalam folder `chat-app` sudah dikonfigurasi, contoh:

```
MONGODB_URI=mongodb://localhost:27017/nama_database
JWT_SECRET=your_secret_key
```

Sesuaikan dengan konfigurasi yang ada di docker-compose.

---

# 📌 Catatan Penting

* Pastikan Docker sudah berjalan sebelum menjalankan MongoDB.
* Pastikan MongoDB container aktif sebelum menjalankan Next.js.
* Jika terjadi error koneksi database, cek kembali:

  * Port MongoDB
  * MONGODB_URI
  * Status container Docker

---

# 🛠 Development Mode

Untuk development:

* MongoDB → Docker Compose
* Next.js → `npm run dev`

Project ini masih berjalan dalam mode development.