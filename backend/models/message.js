const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  seenBy: { type: [String], default: null }, // assuming an array of userIds who have seen the message; adjust if different
  reactions: { type: [mongoose.Schema.Types.Mixed], default: [] }, // generic array, change schema if needed
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'message',
});

module.exports = mongoose.model('Message', messageSchema);
