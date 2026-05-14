import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function proxy(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;
  
  // ⚠️ IMPORTANT: API routes should NOT be redirected to pages
  const isApiRoute = path.startsWith('/api/');
  const isPublicPath = path === '/login' || 
                       path === '/register' || 
                       path === '/lobby' ||
                       path === '/';
  
  // ✅ JANGAN redirect API routes! Biarkan mereka return JSON
  if (isApiRoute) return NextResponse.next();
  let isTokenValid = false;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      isTokenValid = true;
    } catch (e) {
      console.log('❌ Token invalid:', e.message);
    }
  }

  // Guest (atau token invalid) hanya bisa akses public paths
  if (!isTokenValid && !isPublicPath) {
    console.log('❌ Redirect ke lobby (karena token missing/invalid)');
    // Penting: Hapus cookie jika invalid untuk stop loop
    const response = NextResponse.redirect(new URL('/lobby', request.url));
    if (token) response.cookies.delete('token');
    return response;
  }
  
  // User yang sudah login (token valid) tidak bisa akses halaman login/register/lobby
  if (isTokenValid && (path === '/login' || path === '/register' || path === '/lobby')) {
    console.log('✅ Token valid - Redirect ke chat');
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