// src/models/Story.js
import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['image', 'video', 'text'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  backgroundColor: { 
    type: String, 
    default: '#00bfa5' 
  },
  viewers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expires: 0 } // TTL Index: Dokumen dihapus saat waktu sekarang >= expiresAt
  }
}, { timestamps: true });

export default mongoose.models.Story || mongoose.model('Story', StorySchema);
