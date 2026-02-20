// src/app/api/chat/upload/route.js
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const chatId = formData.get('chatId');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Validasi tipe file (opsional)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'File type not allowed. Allowed types: images, PDF, text, DOC' 
      }, { status: 400 });
    }

    // Validasi ukuran file (max 10MB untuk gambar, 5MB untuk lainnya)
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large (max ${maxSize / (1024 * 1024)}MB)` 
      }, { status: 400 });
    }

    // Konversi file ke buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Buat nama file unik
    const originalName = file.name;
    const fileExtension = path.extname(originalName);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Tentukan path penyimpanan
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const filePath = path.join(uploadDir, fileName);
    
    // Buat direktori jika belum ada
    await mkdir(uploadDir, { recursive: true });
    
    // Simpan file
    await writeFile(filePath, buffer);
    
    // URL file yang bisa diakses publik
    const fileUrl = `/uploads/${fileName}`;

    console.log('File uploaded:', {
      originalName,
      fileName,
      fileUrl,
      type: file.type,
      size: file.size
    });

    return NextResponse.json({ 
      success: true, 
      fileUrl,
      fileName: originalName,
      fileType: file.type,
      fileSize: file.size
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}