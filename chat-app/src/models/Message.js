// src/models/Message.js — FIXED: tambah isVoice + voiceDuration
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    index: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  fileUrl: {
    type: String,
    default: null,
  },
  fileType: {
    type: String,
    default: null,
  },
  fileName: {
    type: String,
    default: null,
  },
  fileSize: {
    type: Number,
    default: null,
  },
  // ── Voice note fields ──
  isVoice: {
    type: Boolean,
    default: false,
  },
  voiceDuration: {
    type: Number,
    default: 0,
  },
  // ─────────────────────
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  read: {
    type: Boolean,
    default: false,
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);