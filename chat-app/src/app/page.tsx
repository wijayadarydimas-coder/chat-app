// src/app/page.jsx - COPY PASTE
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah login
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user/me');
        const data = await res.json();
        
        if (data.user) {
          // Kalau sudah login, redirect ke chat
          router.push('/chat');
        } else {
          // Kalau belum login, redirect ke lobby
          router.push('/lobby');
        }
      } catch (error) {
        // Kalau error, redirect ke lobby
        router.push('/lobby');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>
  );
}