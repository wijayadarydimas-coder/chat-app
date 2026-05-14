// src/app/api/ringtones/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const RINGTONE_DIR = path.join(process.cwd(), 'public', 'uploads', 'ringtone');

function ensureDir() {
  if (!fs.existsSync(RINGTONE_DIR)) fs.mkdirSync(RINGTONE_DIR, { recursive: true });
}

// GET /api/ringtones — list semua ringtone yang diupload
export async function GET() {
  try {
    ensureDir();
    const files = fs.readdirSync(RINGTONE_DIR).filter(f =>
      /\.(mp3|ogg|wav|webm|aac|m4a)$/i.test(f)
    );
    const ringtones = files.map(f => ({
      name: f.replace(/\.[^.]+$/, ''),
      url: `/uploads/ringtone/${f}`,
      filename: f,
    }));
    return NextResponse.json({ ringtones });
  } catch (e) {
    return NextResponse.json({ ringtones: [], error: e.message });
  }
}