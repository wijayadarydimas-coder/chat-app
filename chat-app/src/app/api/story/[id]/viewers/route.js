// src/app/api/story/[id]/viewers/route.js
import { NextResponse } from 'next/server';
import { cookies }      from 'next/headers';
import jwt              from 'jsonwebtoken';
import dbConnect        from '@/lib/db';
import Story            from '@/models/Story';

export const runtime = 'nodejs';

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
}

export async function GET(req, { params }) {
  try {
    const auth = await getAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const story = await Story.findById(id)
      .populate('viewers.userId', 'username avatar');
    
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    const userId = auth.userId || auth.id;
    if (story.userId.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ viewers: story.viewers });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
