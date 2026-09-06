const mongoose = require('mongoose');

const riskZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    district: { type: String, required: true },
    level: { type: String, enum: ['Critical', 'High', 'Moderate', 'Watch'], required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    road: { type: String, required: true },
    rainfall: { type: String, required: true },
    mapPosition: {
      x: { type: String, required: true },
      y: { type: String, required: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.RiskZone || mongoose.model('RiskZone', riskZoneSchema);
