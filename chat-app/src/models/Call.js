import mongoose from 'mongoose';

const CallSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['private', 'group'], 
    required: true 
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: { 
    type: Date 
  },
  duration: { 
    type: Number 
  },
  status: { 
    type: String, 
    enum: ['initiated', 'ringing', 'connected', 'ended', 'failed'],
    default: 'initiated'
  }
});

export default mongoose.models.Call || mongoose.model('Call', CallSchema);