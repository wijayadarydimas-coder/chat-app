// src/app/api/test-db/route.js - COPY PASTE (ini yang benar untuk test DB)
import dbConnect from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🔄 Mencoba konek ke MongoDB...');
    
    await dbConnect();
    
    console.log('✅ MongoDB connected!');
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ MongoDB connected!',
      db: process.env.DB_MONGO_NAME || 'cosmed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}