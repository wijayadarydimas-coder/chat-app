import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;
  
  // Halaman public (tanpa login)
  const isPublicPath = path === '/login' || 
                       path === '/register' || 
                       path === '/lobby' ||
                       path === '/';
  
  // Guest hanya bisa akses lobby
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/lobby', request.url));
  }
  
  // User yang sudah login tidak bisa akses halaman login/register
  if (token && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  // Verifikasi token
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Token tidak valid
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }
  
  return NextResponse.next();
}

// Konfigurasi path yang di-protect
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/lobby',
    '/chat/:path*',
    '/group/:path*',
    '/call/:path*',
    '/api/chat/:path*',
    '/api/group/:path*',
    '/api/call/:path*'
  ]
};