// chat-app\src\app\api\user\me\route.js
// PATCH untuk update username & avatar (edit profil)
import { NextResponse } from 'next/server';
import { cookies }      from 'next/headers';
import jwt              from 'jsonwebtoken';
import connectDB        from '@/lib/db';
import User             from '@/models/User';

export const runtime = 'nodejs';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
}

// GET /api/user/me — ambil data user yang sedang login
export async function GET() {
  try {
    const auth = await getUser();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const userId = auth.userId || auth.id || auth._id;
    const user   = await User.findById(userId).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (e) {
    console.error('[user/me GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/user/me — update username dan/atau avatar
export async function PATCH(req) {
  try {
    const auth = await getUser();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const userId = auth.userId || auth.id || auth._id;
    const body   = await req.json();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (body.username !== undefined) {
      const uname = body.username.trim();
      if (!uname) return NextResponse.json({ error: 'Username tidak boleh kosong' }, { status: 400 });
      if (uname.length < 2) return NextResponse.json({ error: 'Username minimal 2 karakter' }, { status: 400 });
      const existing = await User.findOne({ username: uname, _id: { $ne: userId } });
      if (existing) return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 409 });
      user.username = uname;
    }
    
    if (body.avatar !== undefined) user.avatar = body.avatar;
    if (body.bio !== undefined) {
      user.bio = body.bio.trim().substring(0, 160);
      console.log(`[API] Updating bio for ${user.username} to: "${user.bio}"`);
    }
    if (body.showOnlineStatus !== undefined) user.showOnlineStatus = !!body.showOnlineStatus;

    await user.save();
    console.log(`[API] User ${user.username} updated successfully.`);
    
    return NextResponse.json({ user: user.toObject() });
  } catch (e) {
    console.error('[user/me PATCH]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}