// src/app/api/group/[groupId]/messages/route.js — FIXED
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Group from '@/models/Group';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// GET /api/group/[groupId]/messages
export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { groupId } = await params;
    if (!groupId) return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });

    const group = await Group.findOne({ _id: groupId, members: decoded.id });
    if (!group) return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 });

    const messages = await Message.find({ groupId })
      .populate('senderId', 'username avatar')
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      return {
        ...msgObj,
        senderId: msgObj.senderId?._id || msgObj.senderId,
        sender: msgObj.senderId,
        isVoice: msgObj.isVoice || false,
        voiceDuration: msgObj.voiceDuration || 0,
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error loading group messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/group/[groupId]/messages
export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { groupId } = await params;
    const body = await request.json();
    const { content, fileUrl, fileType, fileName, fileSize, isVoice, voiceDuration } = body;

    if (!groupId) return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    if (!content || !content.trim()) return NextResponse.json({ error: 'Message content is required' }, { status: 400 });

    const group = await Group.findOne({ _id: groupId, members: decoded.id });
    if (!group) return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 });

    // Cek onlyAdmins
    if (group.onlyAdmins) {
      const adminIds = (group.admins || []).map(a =>
        (typeof a === 'object' ? a._id : a)?.toString()
      );
      if (!adminIds.includes(decoded.id)) {
        return NextResponse.json({ error: 'Hanya admin yang bisa mengirim pesan' }, { status: 403 });
      }
    }

    const message = await Message.create({
      groupId,
      senderId: decoded.id,
      content: content.trim(),
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      isVoice: isVoice === true,
      voiceDuration: voiceDuration || 0,
      readBy: [decoded.id],
    });

    // Update lastMessage di Group
    await Group.findByIdAndUpdate(groupId, { lastMessage: message._id });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username avatar');

    const responseMessage = {
      ...populatedMessage.toObject(),
      senderId: populatedMessage.senderId?._id || populatedMessage.senderId,
      sender: populatedMessage.senderId,
      isVoice: populatedMessage.isVoice || false,
      voiceDuration: populatedMessage.voiceDuration || 0,
    };

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error('Error saving group message:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/group/[groupId]/messages?messageId=xxx&deleteType=self|everyone
export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const deleteType = searchParams.get('deleteType') || 'self';

    if (!messageId) return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });

    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    if (message.senderId.toString() !== decoded.id)
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });

    if (deleteType === 'everyone') {
      await Message.findByIdAndDelete(messageId);
    } else {
      await Message.findByIdAndDelete(messageId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group message:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}