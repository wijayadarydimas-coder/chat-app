// chat-app\src\app\api\group\[id]\route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import GroupMessage from '@/models/GroupMessage';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

// GET /api/group/[id] — detail grup
export async function GET(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const userId = user.userId || user.id || user._id;

    const group = await Group.findOne({ _id: id, members: userId })
      .populate('members', 'username avatar email')
      .populate('admins', 'username')
      .populate('createdBy', 'username');

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    return NextResponse.json({ group });
  } catch (e) {
    console.error('[group/id GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/group/[id] — edit nama, foto, onlyAdmins
export async function PATCH(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const userId = user.userId || user.id || user._id;

    const group = await Group.findById(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Hanya admin yang boleh edit
    if (!group.admins.map(a => a.toString()).includes(userId.toString())) {
      return NextResponse.json({ error: 'Only admins can edit this group' }, { status: 403 });
    }

    const body = await req.json();
    const updates = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.photo !== undefined) updates.photo = body.photo;
    if (body.onlyAdmins !== undefined) updates.onlyAdmins = body.onlyAdmins;

    const updated = await Group.findByIdAndUpdate(id, updates, { new: true })
      .populate('members', 'username avatar email')
      .populate('admins', 'username')
      .populate('createdBy', 'username');

    return NextResponse.json({ group: updated });
  } catch (e) {
    console.error('[group/id PATCH]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/group/[id] — hapus grup
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
      return NextResponse.json({ error: 'Only admins can delete this group' }, { status: 403 });
    }

    // Hapus semua pesan dulu, baru grup
    await GroupMessage.deleteMany({ groupId: id });
    await Group.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[group/id DELETE]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}