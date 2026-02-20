// chat-app\src\app\api\group\[id]\messages\route.js
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

// GET /api/group/[id]/messages
export async function GET(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const userId = user.userId || user.id || user._id;

    // Pastikan user adalah member
    const group = await Group.findOne({ _id: id, members: userId });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const messages = await GroupMessage.find({
      groupId: id,
      deletedForEveryone: false,
      deletedFor: { $nin: [userId] },
    })
      .populate('senderId', 'username avatar')
      .sort({ createdAt: 1 });

    const formatted = messages.map(msg => ({
      _id: msg._id,
      groupId: msg.groupId,
      senderId: msg.senderId?._id || msg.senderId,
      sender: msg.senderId,
      content: msg.content,
      fileUrl: msg.fileUrl,
      fileType: msg.fileType,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({ messages: formatted });
  } catch (e) {
    console.error('[group/messages GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/group/[id]/messages
export async function POST(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const userId = user.userId || user.id || user._id;

    const group = await Group.findOne({ _id: id, members: userId });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Cek permission onlyAdmins
    if (group.onlyAdmins && !group.admins.map(a => a.toString()).includes(userId.toString())) {
      return NextResponse.json({ error: 'Only admins can send messages in this group' }, { status: 403 });
    }

    const body = await req.json();
    const { content, fileUrl, fileType, fileName, fileSize } = body;

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: 'Content or file required' }, { status: 400 });
    }

    const message = await GroupMessage.create({
      groupId: id,
      senderId: userId,
      content: content || '',
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
    });

    // Update lastMessage di grup
    await Group.findByIdAndUpdate(id, {
      lastMessage: { content: content || `📎 ${fileName}`, senderId: userId },
      updatedAt: new Date(),
    });

    await message.populate('senderId', 'username avatar');

    const formatted = {
      _id: message._id,
      groupId: message.groupId,
      senderId: message.senderId?._id || message.senderId,
      sender: message.senderId,
      content: message.content,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
      fileName: message.fileName,
      fileSize: message.fileSize,
      createdAt: message.createdAt,
    };

    return NextResponse.json({ message: formatted }, { status: 201 });
  } catch (e) {
    console.error('[group/messages POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/group/[id]/messages?messageId=xxx&deleteType=self|everyone
export async function DELETE(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const userId = user.userId || user.id || user._id;
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const deleteType = searchParams.get('deleteType') || 'self';

    const message = await GroupMessage.findOne({ _id: messageId, groupId: id });
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    if (deleteType === 'everyone') {
      // Hanya sender atau admin yang boleh delete for everyone
      const group = await Group.findById(id);
      const isAdmin = group?.admins.map(a => a.toString()).includes(userId.toString());
      const isSender = message.senderId.toString() === userId.toString();
      if (!isAdmin && !isSender) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
      await GroupMessage.findByIdAndUpdate(messageId, { deletedForEveryone: true });
    } else {
      // Delete for self only
      await GroupMessage.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: userId } });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[group/messages DELETE]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}