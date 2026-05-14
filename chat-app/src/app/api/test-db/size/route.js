import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({}).select('username avatar').lean();
    const result = users.map(u => ({
      username: u.username,
      avatarSize: u.avatar ? u.avatar.length : 0,
      avatarPreview: u.avatar ? u.avatar.substring(0, 50) : 'none'
    }));
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
