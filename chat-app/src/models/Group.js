// chat-app\src\models\Group.js
import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  photo:       { type: String, default: null },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  onlyAdmins:  { type: Boolean, default: false },
  lastMessage: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);