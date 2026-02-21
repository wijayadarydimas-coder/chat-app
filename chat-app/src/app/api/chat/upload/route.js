// src/app/api/chat/upload/route.js — FIXED untuk production
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// WAJIB: paksa Node.js runtime agar fs/path bisa dipakai di production build
export const runtime = 'nodejs';
// Nonaktifkan body parser bawaan Next.js untuk multipart
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const chatId = formData.get('chatId');

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!chatId) return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });

    const fileType = file.type || '';
    const isImage = fileType.startsWith('image/');
    const isAudio = fileType.startsWith('audio/') || fileType.includes('audio');
    const isPdf   = fileType === 'application/pdf';
    const isDoc   = fileType.includes('word') || fileType === 'text/plain';

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav',
    ];

    const isAllowed = allowedTypes.some(t => fileType.startsWith(t.split(';')[0]))
      || isImage || isAudio;

    if (!isAllowed) {
      return NextResponse.json({ error: `Tipe file tidak didukung: ${fileType}` }, { status: 400 });
    }

    // Ukuran max
    let maxSize = 5 * 1024 * 1024; // 5MB default
    if (isImage) maxSize = 10 * 1024 * 1024;   // 10MB
    if (isAudio) maxSize = 25 * 1024 * 1024;   // 25MB

    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return NextResponse.json({ error: `File terlalu besar (max ${maxMB}MB)` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name || 'file';
    let fileExtension = path.extname(originalName);

    if (!fileExtension || fileExtension === '.') {
      if (fileType.includes('webm')) fileExtension = '.webm';
      else if (fileType.includes('ogg')) fileExtension = '.ogg';
      else if (fileType.includes('mp4')) fileExtension = '.mp4';
      else if (fileType.includes('mpeg')) fileExtension = '.mp3';
      else if (fileType.includes('wav')) fileExtension = '.wav';
      else fileExtension = '.bin';
    }

    const fileName = `${uuidv4()}${fileExtension}`;

    // Gunakan process.cwd() agar path benar baik di dev maupun production
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath  = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    console.log('✅ Upload berhasil:', {
      originalName, fileName, fileUrl,
      type: fileType,
      size: `${(file.size / 1024).toFixed(1)}KB`,
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: originalName,
      fileType,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}