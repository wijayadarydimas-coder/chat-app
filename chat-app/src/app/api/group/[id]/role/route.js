// chat-app\src\app\api\group\[id]\role\route.js
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

// PATCH /api/group/[id]/role — promote/demote member
export async function PATCH(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const userId = user.userId || user.id || user._id;

    const group = await Group.findById(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (!group.admins.map(a => a.toString()).includes(userId.toString())) {
      return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 });
    }

    const { userId: targetId, role } = await req.json();
    if (!targetId || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Jangan hapus admin terakhir
    if (role === 'member' && group.admins.length === 1 && group.admins[0].toString() === targetId.toString()) {
      return NextResponse.json({ error: 'Group must have at least one admin' }, { status: 400 });
    }

    let updated;
    if (role === 'admin') {
      updated = await Group.findByIdAndUpdate(id, { $addToSet: { admins: targetId } }, { new: true })
        .populate('members', 'username avatar email')
        .populate('admins', 'username')
        .populate('createdBy', 'username');
    } else {
      updated = await Group.findByIdAndUpdate(id, { $pull: { admins: targetId } }, { new: true })
        .populate('members', 'username avatar email')
        .populate('admins', 'username')
        .populate('createdBy', 'username');
    }

    return NextResponse.json({ group: updated });
  } catch (e) {
    console.error('[group/role PATCH]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}