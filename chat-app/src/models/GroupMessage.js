// chat-app\src\models\GroupMessage.js
import mongoose from 'mongoose';

const GroupMessageSchema = new mongoose.Schema({
  groupId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:    { type: String, default: '' },
  fileUrl:    { type: String, default: null },
  fileType:   { type: String, default: null },
  fileName:   { type: String, default: null },
  fileSize:   { type: Number, default: null },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedForEveryone: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.GroupMessage || mongoose.model('GroupMessage', GroupMessageSchema);