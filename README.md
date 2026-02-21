# COSMED Chat App

Web pribadi berbasis **Next.js** yang terintegrasi dengan **MongoDB** sebagai database.

Project ini terdiri dari dua folder utama:

```
COSMED/
 ├── chat-app   → Aplikasi Next.js (Frontend + API Routes)
 └── mongodb    → Konfigurasi Docker untuk MongoDB
```

MongoDB dijalankan menggunakan **Docker Compose**, sedangkan Next.js dijalankan menggunakan **npm**.

---

# 📦 Tech Stack

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

## 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd COSMED
```

Atau jika sudah punya foldernya, cukup masuk ke directory project:

```bash
cd nama-folder-project
```

---

# 🐳 Menjalankan MongoDB (Docker)

Masuk ke folder mongodb:

```bash
cd mongodb
```

Pastikan terdapat file `docker-compose.yml`, lalu jalankan:

```bash
docker-compose up -d
```

Cek apakah container sudah berjalan:

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
cd ../chat-app
```

## Install Dependencies

Jika pertama kali menjalankan project:

```bash
npm install
```

Jika perlu install manual dependency tambahan:

```bash
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/js-cookie @types/node @types/react @types/react-dom typescript tailwindcss @tailwindcss/postcss
```

```bash
npm install uuid
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

Buat file `.env.local` di dalam folder `chat-app`, lalu isi:

```
MONGODB_URI=mongodb://localhost:27017/nama_database
JWT_SECRET=your_secret_key
```

Sesuaikan `nama_database` dengan konfigurasi di `docker-compose.yml`.

---

# 📌 Catatan Penting

* Pastikan Docker sudah aktif sebelum menjalankan MongoDB.
* Pastikan MongoDB container berjalan sebelum menjalankan Next.js.
* Jika terjadi error koneksi database:

  * Cek status container (`docker ps`)
  * Cek port MongoDB
  * Cek `MONGODB_URI`