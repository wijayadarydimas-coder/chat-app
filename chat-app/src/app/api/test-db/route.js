import dbConnect from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ 
      success: true, 
      message: '✅ MongoDB connected!',
      db: process.env.DB_MONGO_NAME || 'cosmed'
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}