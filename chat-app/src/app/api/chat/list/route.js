//chat-app\src\app\api\chat\list\route.js
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    // Cari semua chat yang melibatkan user
    const chats = await Chat.find({
      members: decoded.id
    })
    .populate('members', 'username avatar status')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'senderId',
        select: 'username avatar'
      }
    })
    .sort({ updatedAt: -1 });

    // Format response dengan otherUser yang lengkap
    const formattedChats = await Promise.all(chats.map(async (chat) => {
      const chatObj = chat.toObject();
      
      // Cari other user (bukan current user)
      const otherUser = chatObj.members?.find(
        member => member._id.toString() !== decoded.id
      );

      // Jika otherUser tidak ditemukan di populate, cari manual
      if (!otherUser) {
        const otherUserId = chatObj.members?.find(
          id => id.toString() !== decoded.id
        );
        
        if (otherUserId) {
          const userData = await User.findById(otherUserId).select('username avatar status');
          return {
            ...chatObj,
            otherUser: userData || { 
              _id: otherUserId, 
              username: 'Unknown User',
              avatar: null
            }
          };
        }
      }

      return {
        ...chatObj,
        otherUser: otherUser || null
      };
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error('Error loading chats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}