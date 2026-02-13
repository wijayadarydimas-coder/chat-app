import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { email, password } = await request.json();
    
    // Cari user
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan' },
        { status: 401 }
      );
    }
    
    // Cek password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }
    
    // Buat token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update status
    user.status = 'online';
    await user.save();
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
    
    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    });
    
    return response;
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}