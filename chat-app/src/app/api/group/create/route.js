// chat-app\src\app\api\group\create\route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Group from '@/models/Group';

export const runtime = 'nodejs';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { name, members } = await req.json();

    if (!name?.trim()) return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    if (!members || members.length < 2) return NextResponse.json({ error: 'At least 2 members required' }, { status: 400 });

    // Pastikan creator selalu ada di members & admins
    const uniqueMembers = [...new Set([...members, user.userId || user.id || user._id])];

    const group = await Group.create({
      name: name.trim(),
      members: uniqueMembers,
      admins: [user.userId || user.id || user._id],
      createdBy: user.userId || user.id || user._id,
    });

    await group.populate('members', 'username avatar email');
    await group.populate('createdBy', 'username');

    return NextResponse.json({ group }, { status: 201 });
  } catch (e) {
    console.error('[group/create]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}