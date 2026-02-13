import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastMessage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message' 
  }
});

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);