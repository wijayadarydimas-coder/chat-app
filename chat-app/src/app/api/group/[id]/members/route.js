// chat-app\src\app\api\group\[id]\members\route.js
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

// DELETE /api/group/[id]/members — kick member
export async function DELETE(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const userId = user.userId || user.id || user._id;

    const group = await Group.findById(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (!group.admins.map(a => a.toString()).includes(userId.toString())) {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
    }

    const { userId: targetId } = await req.json();
    if (!targetId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // Tidak boleh kick creator
    if (group.createdBy.toString() === targetId.toString()) {
      return NextResponse.json({ error: 'Cannot remove the group creator' }, { status: 400 });
    }

    const updated = await Group.findByIdAndUpdate(id,
      { $pull: { members: targetId, admins: targetId } },
      { new: true }
    )
      .populate('members', 'username avatar email')
      .populate('admins', 'username')
      .populate('createdBy', 'username');

    return NextResponse.json({ group: updated });
  } catch (e) {
    console.error('[group/members DELETE]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/group/[id]/members — add member
export async function POST(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const userId = user.userId || user.id || user._id;

    const group = await Group.findById(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (!group.admins.map(a => a.toString()).includes(userId.toString())) {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    const { userId: newMemberId } = await req.json();
    if (!newMemberId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const updated = await Group.findByIdAndUpdate(id,
      { $addToSet: { members: newMemberId } },
      { new: true }
    )
      .populate('members', 'username avatar email')
      .populate('admins', 'username')
      .populate('createdBy', 'username');

    return NextResponse.json({ group: updated });
  } catch (e) {
    console.error('[group/members POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}