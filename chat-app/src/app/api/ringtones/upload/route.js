// src/app/api/ringtones/upload/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RINGTONE_DIR = path.join(process.cwd(), 'public', 'uploads', 'ringtone');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/x-m4a', 'audio/mp4'];

export async function POST(request) {
  try {
    if (!fs.existsSync(RINGTONE_DIR)) fs.mkdirSync(RINGTONE_DIR, { recursive: true });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) return NextResponse.json({ error: 'Tidak ada file' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File terlalu besar (max 5MB)' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 });

    const ext = file.name.split('.').pop().toLowerCase();
    const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 50);
    const filename = `${safeName}_${Date.now()}.${ext}`;
    const filepath = path.join(RINGTONE_DIR, filename);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(arrayBuffer));

    return NextResponse.json({
      ringtone: {
        name: safeName || filename,
        url: `/uploads/ringtone/${filename}`,
        filename,
      }
    });
  } catch (e) {
    console.error('Ringtone upload error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}