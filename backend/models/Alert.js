const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Critical', 'High', 'Watch'], required: true },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    action: { type: String, required: true },
    acknowledgedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
