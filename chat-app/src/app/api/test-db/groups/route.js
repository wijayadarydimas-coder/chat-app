import dbConnect from '@/lib/db';
import Group from '@/models/Group';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await dbConnect();
    const groups = await Group.find({});
    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
