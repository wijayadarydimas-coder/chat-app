// chat-app\src\app\api\group\list\route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Group from '@/models/Group';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const userId = user.userId || user.id || user._id;

    const groups = await Group.find({ members: userId })
      .populate('members', 'username avatar email')
      .populate('admins', 'username')
      .populate('createdBy', 'username')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ groups });
  } catch (e) {
    console.error('[group/list]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}