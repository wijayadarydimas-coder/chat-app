// src/app/api/calls/[callId]/route.js
import dbConnect from '@/lib/db';
import CallHistory from '@/models/CallHistory';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// PATCH /api/calls/[callId] — update status, duration, endedAt
export async function PATCH(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { callId } = await params;
    const body = await request.json();
    const { status, startedAt, endedAt, durationSeconds } = body;

    const call = await CallHistory.findByIdAndUpdate(
      callId,
      {
        ...(status && { status }),
        ...(startedAt && { startedAt }),
        ...(endedAt && { endedAt }),
        ...(durationSeconds !== undefined && { durationSeconds }),
      },
      { new: true }
    ).populate('participants', 'username avatar')
     .populate('initiatorId', 'username avatar');

    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Error updating call:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}