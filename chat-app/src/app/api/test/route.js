// src/app/api/test/route.js - COPY PASTE
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: '✅ API Test berhasil!',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: 'GET /api/test',
      testDb: 'GET /api/test-db',
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register'
    }
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: '✅ POST method works',
    timestamp: new Date().toISOString()
  });
}