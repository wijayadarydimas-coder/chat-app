'use client';
// chat-app\src\app\login\page.jsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error. Cek middleware.');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      router.push('/chat');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name) => ({
    width: '100%',
    padding: '11px 14px',
    background: 'var(--bg-elevated)',
    border: `1px solid ${focused === name ? 'var(--border-accent)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .theme-toggle { 
          position: fixed; top: 24px; right: 24px; 
          background: var(--bg-surface); border: 1px solid var(--border); 
          color: var(--text-primary); border-radius: 12px; width: 44px; height: 44px; 
          display: flex; alignItems: center; justifyContent: center; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); zIndex: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-size: 20px;
        }
        .theme-toggle:hover { 
          background: var(--bg-elevated); 
          border-color: var(--accent); 
          transform: rotate(15deg) scale(1.1);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        .auth-card { animation: fadeUp 0.3s ease; }
        ::placeholder { color: var(--text-muted); }
      `}</style>

      <button className="theme-toggle" onClick={toggleTheme} title="Ganti Tema">
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>

      <div className="auth-card" style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo / App name */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'transparent', marginBottom: 16 }}>
            <img src="/Logo.png" alt="Cosmed Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', zIndex: -1 }}>
              <span style={{ fontSize: 24 }}>💬</span>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>COSMED</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Selamat datang</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Daftar</Link>
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px 28px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
          {error && (
            <div style={{ background: 'var(--danger-muted)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Email</label>
              <input
                name="email" type="email" required
                value={formData.email} onChange={handleChange}
                style={inputStyle('email')}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                placeholder="bangder@email.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
              <input
                name="password" type="password" required
                value={formData.password} onChange={handleChange}
                style={inputStyle('password')}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px', marginTop: 4,
                background: loading ? 'var(--accent-muted)' : 'var(--accent)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                color: loading ? 'var(--accent)' : '#0a0c10',
                fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : 'var(--shadow-glow)',
              }}
            >
              {loading && <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}