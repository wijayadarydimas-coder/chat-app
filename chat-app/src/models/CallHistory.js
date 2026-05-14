// src/models/CallHistory.js
import mongoose from 'mongoose';

const CallHistorySchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  callType: {
    type: String,
    enum: ['audio', 'video'],
    required: true,
  },
  callMode: {
    type: String,
    enum: ['private', 'group'],
    default: 'private',
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null,
  },
  groupName: {
    type: String,
    default: null,
  },
  initiatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['missed', 'answered', 'declined'],
    default: 'missed',
  },
  startedAt: {
    type: Date,
    default: null,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index agar query per-user cepat
CallHistorySchema.index({ participants: 1, createdAt: -1 });

export default mongoose.models.CallHistory || mongoose.model('CallHistory', CallHistorySchema);