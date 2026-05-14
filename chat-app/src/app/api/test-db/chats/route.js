import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await dbConnect();
    const chats = await Chat.find({});
    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
