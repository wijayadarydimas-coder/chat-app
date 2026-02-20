import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('🔵 API Login dipanggil!'); // <-- LOG
  
  try {
    console.log('1. Mencoba konek DB...');
    await dbConnect();
    console.log('2. DB Connected!');
    
    const body = await request.json();
    console.log('3. Request body:', body);
    
    const { email, password } = body;
    
    // Cari user
    console.log('4. Mencari user dengan email:', email);
    const user = await User.findOne({ email });
    console.log('5. User ditemukan:', user ? '✅ Ya' : '❌ Tidak');
    
    if (!user) {
      console.log('6. User tidak ditemukan, return 401');
      return NextResponse.json(
        { error: 'Email tidak ditemukan' },
        { status: 401 }
      );
    }
    
    // Cek password
    console.log('6. Mengecek password...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('7. Password valid:', isValid ? '✅ Ya' : '❌ Tidak');
    
    if (!isValid) {
      console.log('8. Password salah, return 401');
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }
    
    // Buat token
    console.log('9. Membuat token JWT...');
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
    console.log('10. Set cookie token');
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    });
    
    console.log('11. Login sukses!');
    return response;
    
  } catch (error) {
    console.error('❌ ERROR di API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Login API is ready',
    method: 'POST',
    endpoint: '/api/auth/login'
  });
}