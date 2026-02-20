import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;
  
  // ⚠️ IMPORTANT: API routes should NOT be redirected to pages
  const isApiRoute = path.startsWith('/api/');
  const isPublicPath = path === '/login' || 
                       path === '/register' || 
                       path === '/lobby' ||
                       path === '/';
  
  console.log('=================================');
  console.log('Path:', path);
  console.log('Is API Route:', isApiRoute);
  console.log('Token:', token ? 'Ada' : 'Tidak ada');
  
  // ✅ JANGAN redirect API routes! Biarkan mereka return JSON
  if (isApiRoute) {
    console.log('✅ API Route - lanjutkan');
    return NextResponse.next();
  }
  
  // Guest hanya bisa akses public paths
  if (!token && !isPublicPath) {
    console.log('❌ Redirect ke lobby');
    return NextResponse.redirect(new URL('/lobby', request.url));
  }
  
  // User yang sudah login tidak bisa akses halaman login/register
  if (token && (path === '/login' || path === '/register')) {
    console.log('✅ Redirect ke chat');
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/lobby',
    '/chat/:path*',
    '/group/:path*',
    '/call/:path*',
    '/api/:path*'  // API routes tetap di-match tapi tidak di-redirect
  ]
};