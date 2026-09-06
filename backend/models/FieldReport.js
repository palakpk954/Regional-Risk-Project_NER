const mongoose = require('mongoose');

const fieldReportSchema = new mongoose.Schema(
  {
    hazardType: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'High', 'Moderate'], required: true },
    description: { type: String, required: true, maxlength: 2000 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    mediaUrl: String,
    status: { type: String, enum: ['Queued', 'Verified', 'Resolved'], default: 'Queued' },
  },
  { timestamps: true },
);

module.exports = mongoose.models.FieldReport || mongoose.model('FieldReport', fieldReportSchema);
