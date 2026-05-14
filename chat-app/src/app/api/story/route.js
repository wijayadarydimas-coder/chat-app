// src/app/api/story/route.js
import { NextResponse } from 'next/server';
import { cookies }      from 'next/headers';
import jwt              from 'jsonwebtoken';
import dbConnect        from '@/lib/db';
import User             from '@/models/User';
import Story            from '@/models/Story';

export const runtime = 'nodejs';

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
}

// GET /api/story — Ambil semua story aktif, dikelompokkan per user
export async function GET() {
  try {
    const auth = await getAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    
    // Ambil semua story yang belum expired
    const now = new Date();
    const stories = await Story.find({ expiresAt: { $gt: now } })
      .populate('userId', 'username avatar')
      .sort({ createdAt: 1 });

    // Kelompokkan per user
    const grouped = {};
    stories.forEach(s => {
      const uid = s.userId._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: s.userId,
          stories: []
        };
      }
      grouped[uid].stories.push(s);
    });

    return NextResponse.json({ stories: Object.values(grouped) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/story — Upload story baru
export async function POST(req) {
  try {
    const auth = await getAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, content, backgroundColor } = body;

    if (!type || !content) {
      return NextResponse.json({ error: 'Tipe dan konten diperlukan' }, { status: 400 });
    }

    await dbConnect();

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Jam

    const story = await Story.create({
      userId: auth.userId || auth.id,
      type,
      content,
      backgroundColor,
      expiresAt
    });

    return NextResponse.json({ success: true, story });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
