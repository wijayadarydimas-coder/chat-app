import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }],
  lastMessage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true // Ini akan menambah createdAt dan updatedAt otomatis
});

// Hindari model compilation error di development (karena hot reload)
export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);