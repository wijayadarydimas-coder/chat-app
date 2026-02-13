// src/app/lobby/page.jsx - COPY PASTE
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LobbyPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Navbar */}
      <nav className="bg-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-white font-bold text-xl">
              ChatApp
            </div>
            <div className="space-x-4">
              <Link 
                href="/login"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md"
              >
                Login
              </Link>
              <Link 
                href="/register"
                className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Chat dengan Teman
            <br />
            <span className="text-yellow-300">Gratis & Mudah</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Aplikasi chat berbasis web dengan fitur lengkap. 
            Private chat, group chat, dan voice call.
          </p>
          <div className="space-x-4">
            <Link 
              href="/register"
              className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-300 inline-block"
            >
              Mulai Sekarang
            </Link>
            <Link 
              href="/login"
              className="bg-white/20 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white/30 inline-block"
            >
              Login
            </Link>
          </div>
        </div>
        
        {/* Fitur Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Private Chat</h3>
            <p className="text-white/80">
              Chat pribadi dengan teman, realtime dan aman
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Group Chat</h3>
            <p className="text-white/80">
              Buat grup diskusi dengan banyak anggota
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-xl font-bold mb-2">Voice Call</h3>
            <p className="text-white/80">
              Panggilan suara berkualitas tinggi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}