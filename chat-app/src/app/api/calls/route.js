// src/app/api/calls/route.js
import dbConnect from '@/lib/db';
import CallHistory from '@/models/CallHistory';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// GET /api/calls — ambil call history user yang login
export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const calls = await CallHistory.find({
      participants: decoded.id,
    })
      .populate('participants', 'username avatar')
      .populate('initiatorId', 'username avatar')
      .populate('groupId', 'name photo')
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ calls });
  } catch (error) {
    console.error('Error loading call history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/calls — buat record call baru (dipanggil saat call dimulai)
export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const body = await request.json();
    const { participants, callType, callMode, groupId, groupName, initiatorId } = body;

    const call = await CallHistory.create({
      participants,
      callType,
      callMode: callMode || 'private',
      groupId: groupId || null,
      groupName: groupName || null,
      initiatorId: initiatorId || decoded.id,
      status: 'missed',
      startedAt: null,
    });

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Error creating call record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}