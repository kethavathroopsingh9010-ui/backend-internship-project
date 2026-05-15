const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  value: { type: Number, default: 0 },
  category: { type: String, enum: ['stats', 'activity', 'finance'] }
}, { timestamps: true });

module.exports = mongoose.model('Dashboard', dashboardSchema);