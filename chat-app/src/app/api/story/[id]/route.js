import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Story from '@/models/Story';

export const runtime = 'nodejs';

async function getAuth(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); } catch { return null; }
}

// DELETE /api/story/[id] - Hapus cerita sendiri
export async function DELETE(request, { params }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const story = await Story.findById(id);
    if (!story) return NextResponse.json({ error: 'Cerita tidak ditemukan' }, { status: 404 });

    // Pastikan hanya pemilik yang bisa menghapus
    if (story.userId.toString() !== auth.id && story.userId.toString() !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Story.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Cerita berhasil dihapus' });
  } catch (e) {
    console.error('[Story DELETE]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
