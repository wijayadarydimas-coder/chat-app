// src/app/api/chat/[chatId]/messages/route.js — FIXED
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Penting: paksa Node.js runtime agar fs, path, dll bisa dipakai di production
export const runtime = 'nodejs';

// GET /api/chat/[chatId]/messages
export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { chatId } = await params;
    if (!chatId) return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });

    const chat = await Chat.findOne({ _id: chatId, members: decoded.id });
    if (!chat) return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });

    const messages = await Message.find({ chatId })
      .populate('senderId', 'username avatar')
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      return {
        ...msgObj,
        senderId: msgObj.senderId?._id || msgObj.senderId,
        sender: msgObj.senderId,
        // Pastikan field voice ikut dikirim
        isVoice: msgObj.isVoice || false,
        voiceDuration: msgObj.voiceDuration || 0,
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error loading messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat/[chatId]/messages
export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { chatId } = await params;
    const body = await request.json();
    const { content, fileUrl, fileType, fileName, fileSize, isVoice, voiceDuration } = body;

    if (!chatId) return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    if (!content || !content.trim()) return NextResponse.json({ error: 'Message content is required' }, { status: 400 });

    const chat = await Chat.findOne({ _id: chatId, members: decoded.id });
    if (!chat) return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });

    const message = await Message.create({
      chatId,
      senderId: decoded.id,
      content: content.trim(),
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      // ── Voice note ──
      isVoice: isVoice === true,
      voiceDuration: voiceDuration || 0,
      // ────────────────
      readBy: [decoded.id],
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

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
    console.error('Error saving message:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chat/[chatId]/messages?messageId=xxx&deleteType=self|everyone
export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { chatId } = await params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const deleteType = searchParams.get('deleteType') || 'self';

    if (!messageId) return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    if (!chatId) return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });

    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    if (message.senderId.toString() !== decoded.id)
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    if (message.chatId.toString() !== chatId)
      return NextResponse.json({ error: 'Message does not belong to this chat' }, { status: 400 });

    if (deleteType === 'everyone') {
      await Message.findByIdAndDelete(messageId);
      const chat = await Chat.findById(chatId);
      if (chat && chat.lastMessage?.toString() === messageId) {
        const lastMessage = await Message.findOne({ chatId }).sort({ createdAt: -1 });
        chat.lastMessage = lastMessage?._id || null;
        await chat.save();
      }
    } else {
      await Message.findByIdAndDelete(messageId);
    }

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    if (error.name === 'JsonWebTokenError') return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}