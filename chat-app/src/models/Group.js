import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  admins: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  avatar: { 
    type: String, 
    default: '/default-group.png' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);