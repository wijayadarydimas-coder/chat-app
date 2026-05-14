'use client';
// chat-app\src\app\lobby\page.jsx

import Link from 'next/link';
import { useEffect, useState } from 'react';

const features = [
  { 
    icon: '💬', 
    title: 'Private Chat', 
    desc: 'Chat pribadi real-time yang mudah digunakan. Hubungi teman atau keluarga dengan satu klik.' 
  },
  { 
    icon: '👥', 
    title: 'Group Chat', 
    desc: 'Wadah buat kumpulin circle kamu. Tempat paling pas buat para silent reader, tukang nyimak, atau orang-orang yang hobinya cuma nge-read doang.' 
  },
  { 
    icon: '📞', 
    title: 'Voice Call', 
    desc: 'Panggilan suara seadanya. Kualitasnya sangat bergantung pada mood provider internet dan amal ibadah masing-masing.'
  },
  { 
    icon: '✨', 
    title: 'Sticker (Coming Soon)', 
    desc: 'Sabar ya, fitur stiker masih dalam tahap pemikiran mendalam. Untuk sekarang, silakan pakai emoji bawaan HP atau kata-kata puitis dulu.' 
  },
  { 
    icon: '🚀', 
    title: 'File Sharing', 
    desc: 'Kirim dokumen atau foto tanpa drama. Meskipun aplikasinya masih minimalis, tapi semangat kami buat ngalahin raksasa teknologi tetap ada (tapi bohong).' 
  },
  { 
    icon: '🧘‍♂️', 
    title: 'Bukan Fitur: Salam Bang Der', 
    desc: 'Gak butuh pujian apalagi dikasihanin, Bang Der cuma butuh ketenangan batin. Aplikasi ini rakitan tangan sendiri, jadi tolong dipake ya biar begadangku ada gunanya sedikit.' 
  }
];

export default function LobbyPage() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('cosmed_theme') || 'dark';
    setTheme(saved);
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('cosmed_theme', newTheme);
    if (newTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  };

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        .hero-title { animation: fadeUp 0.5s ease 0.1s both; }
        .hero-sub   { animation: fadeUp 0.5s ease 0.2s both; }
        .hero-cta   { animation: fadeUp 0.5s ease 0.3s both; }
        .feat-cards { animation: fadeUp 0.5s ease 0.4s both; }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,229,195,0.3); }
        .btn-ghost:hover   { background: var(--bg-elevated) !important; }
        .feat-card:hover   { border-color: var(--border-accent) !important; transform: translateY(-3px); }
        .nav-link:hover    { color: var(--text-primary) !important; }
        .theme-toggle-lobby {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 12px;
          background: var(--bg-surface); border: 1px solid var(--border);
          color: var(--text-primary); cursor: pointer; transition: all 0.2s;
        }
        .theme-toggle-lobby:hover { border-color: var(--accent); background: var(--bg-elevated); transform: scale(1.05); }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(0,229,195,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'pulse 6s ease infinite' }} />

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-surface)', opacity: 0.95, backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/Logo.png" alt="Cosmed Logo" style={{ width: 38, height: 38, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>COSMED</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="theme-toggle-lobby" onClick={toggleTheme} title="Ganti Tema">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
            <Link href="/login" className="nav-link" style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, padding: '7px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'color 0.15s' }}>
              Login
            </Link>
            <Link href="/register" className="btn-primary" style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'all 0.2s', display: 'inline-block' }}>
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 100, padding: '5px 14px', marginBottom: 28, fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 6px var(--accent)' }} />
          Realtime • Gratis • Cepat
        </div>

        <h1 className="hero-title" style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
          Chat dengan Teman,<br />
          <span style={{ color: 'var(--accent)' }}>Kapan & Di Mana Saja</span>
        </h1>

        <p className="hero-sub" style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Aplikasi chat modern dengan fitur — private chat, group chat, dan voice call berkualitas tinggi.
        </p>

        <div className="hero-cta" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn-primary" style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 15, fontWeight: 700, padding: '13px 28px', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'all 0.2s', display: 'inline-block', boxShadow: 'var(--shadow-glow)' }}>
            Mulai Sekarang →
          </Link>
          <Link href="/login" className="btn-ghost" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, padding: '13px 28px', borderRadius: 'var(--radius-md)', textDecoration: 'none', border: '1px solid var(--border)', transition: 'all 0.2s', display: 'inline-block' }}>
            Login
          </Link>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="feat-cards" style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' }}>
        {/* Section label */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Fitur</div>
          <div style={{ width: 40, height: 2, background: 'var(--accent)', margin: '0 auto', borderRadius: 2 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="feat-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', transition: 'all 0.2s ease', cursor: 'default' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 18 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>© {new Date().getFullYear()} COSMED — Dibuat dengan 💚 oleh Tim Kami</span>
      </footer>
    </div>
  );
}