//chat-app\src\app\api\chat\create\route.js
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Validasi target user exists
    const targetUser = await User.findById(targetUserId).select('username avatar status');
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Cek apakah chat sudah ada
    let chat = await Chat.findOne({
      members: { 
        $all: [decoded.id, targetUserId],
        $size: 2
      }
    }).populate('members', 'username avatar status');

    if (!chat) {
      // Buat chat baru
      chat = await Chat.create({
        members: [decoded.id, targetUserId]
      });
      
      // Populate members setelah create
      chat = await Chat.findById(chat._id)
        .populate('members', 'username avatar status');
    }

    // Format response dengan otherUser yang lengkap
    const chatObj = chat.toObject();
    
    // Cari other user
    const otherUser = chatObj.members?.find(
      member => member._id.toString() !== decoded.id
    );

    // Dapatkan data current user
    const currentUser = await User.findById(decoded.id).select('username avatar status');

    return NextResponse.json({ 
      chat: {
        ...chatObj,
        otherUser: otherUser || targetUser, // Gunakan targetUser sebagai fallback
        currentUser: currentUser
      }
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}