import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil'
  });
  
  response.cookies.delete('token');
  
  return response;
}