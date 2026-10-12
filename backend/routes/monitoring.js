const express = require('express');
const mongoose = require('mongoose');
const RiskZone = require('../models/RiskZone');
const Alert = require('../models/Alert');
const FieldReport = require('../models/FieldReport');
const { loadStore, saveStore } = require('../lib/persistentStore');
const { providers, fetchAllProviders } = require('../lib/dataProviders');

const router = express.Router();

const seedZones = [
  { name: 'NH-10 · Rangpo–Gangtok', district: 'Sikkim', level: 'Critical', score: 92, road: 'Blocked', rainfall: '118 mm', mapPosition: { x: '63%', y: '30%' } },
  { name: 'NH-6 · Jowai bypass', district: 'Meghalaya', level: 'High', score: 78, road: 'At risk', rainfall: '86 mm', mapPosition: { x: '43%', y: '58%' } },
  { name: 'Dima Hasao · Haflong', district: 'Assam', level: 'High', score: 74, road: 'At risk', rainfall: '72 mm', mapPosition: { x: '57%', y: '69%' } },
  { name: 'Tawang · Sela Pass', district: 'Arunachal Pradesh', level: 'Moderate', score: 56, road: 'Open', rainfall: '46 mm', mapPosition: { x: '78%', y: '20%' } },
  { name: 'Mangan · Chungthang', district: 'Sikkim', level: 'Moderate', score: 51, road: 'Open', rainfall: '39 mm', mapPosition: { x: '71%', y: '42%' } },
];

const seedAlerts = [
  { id: 'alert-1', type: 'Critical', title: 'NH-10 blocked near 32nd Mile', detail: 'Debris reported by field unit · 18 min ago', action: 'Deploy response team' },
  { id: 'alert-2', type: 'High', title: 'Rainfall threshold crossed in Jowai', detail: '86 mm in the last 6 hours · 42 min ago', action: 'Review evacuation plan' },
  { id: 'alert-3', type: 'Watch', title: 'Slope movement detected at Haflong', detail: 'Satellite pass + sensor correlation · 1 hr ago', action: 'Request field verification' },
];

const persistentStore = loadStore({
  zones: seedZones.map((zone, index) => ({ ...zone, id: `zone-${index + 1}` })),
  alerts: seedAlerts,
});
persistentStore.dataSnapshots = persistentStore.dataSnapshots || {};
persistentStore.predictionRuns = persistentStore.predictionRuns || [];

function databaseReady() {
  return mongoose.connection.readyState === 1;
}

router.get('/overview', async (req, res, next) => {
  try {
    const district = req.query.district;
    const includeAcknowledged = req.query.includeAcknowledged === 'true';
    const zones = databaseReady()
      ? await RiskZone.find(district ? { district } : {}).lean()
      : persistentStore.zones.filter((zone) => !district || zone.district === district);
    const alerts = databaseReady()
      ? await Alert.find(includeAcknowledged ? {} : { acknowledgedAt: null }).sort({ createdAt: -1 }).lean()
      : persistentStore.alerts.filter((alert) => includeAcknowledged || !alert.acknowledgedAt);
    return res.json({ ok: true, source: databaseReady() ? 'mongodb' : 'memory', zones, alerts, allAlerts: persistentStore.alerts, generatedAt: new Date().toISOString() });
  } catch (error) {
    return next(error);
  }
});

router.get('/field-reports', async (req, res, next) => {
  try {
    const reports = databaseReady()
      ? await FieldReport.find().sort({ createdAt: -1 }).lean()
      : (persistentStore.reports || []);
    return res.json({ ok: true, reports });
  } catch (error) {
    return next(error);
  }
});

router.post('/field-reports', async (req, res, next) => {
  try {
    const { hazardType, severity, description, latitude, longitude, mediaUrl, district, locationName } = req.body || {};
    if (!hazardType || !severity || !description) {
      return res.status(400).json({ ok: false, message: 'hazardType, severity, and description are required.' });
    }
    const reportData = { hazardType, severity, description, latitude, longitude, mediaUrl, district: district || 'Sikkim', locationName: locationName || 'Monitored Sector', status: 'Queued', createdAt: new Date().toISOString() };
    const report = databaseReady() ? await FieldReport.create(reportData) : { ...reportData, id: `report-${Date.now()}` };
    if (!databaseReady()) {
      persistentStore.reports = persistentStore.reports || [];
      persistentStore.reports.unshift(report);
      saveStore(persistentStore);
    }
    return res.status(201).json({ ok: true, report });
  } catch (error) {
    return next(error);
  }
});

router.patch('/field-reports/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ ok: false, message: 'status is required.' });
    const report = databaseReady()
      ? await FieldReport.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean()
      : (persistentStore.reports || []).find((item) => item.id === req.params.id);
    if (!report) return res.status(404).json({ ok: false, message: 'Report not found.' });
    if (!databaseReady()) {
      report.status = status;
      saveStore(persistentStore);
    }
    return res.json({ ok: true, report });
  } catch (error) {
    return next(error);
  }
});

router.patch('/alerts/:id/acknowledge', async (req, res, next) => {
  try {
    const alert = databaseReady()
      ? await Alert.findByIdAndUpdate(req.params.id, { acknowledgedAt: new Date() }, { new: true }).lean()
      : persistentStore.alerts.find((item) => item.id === req.params.id);
    if (!alert) return res.status(404).json({ ok: false, message: 'Alert not found.' });
    if (!databaseReady()) {
      alert.acknowledgedAt = new Date().toISOString();
      saveStore(persistentStore);
    }
    return res.json({ ok: true, alert });
  } catch (error) {
    return next(error);
  }
});

router.post('/alerts/reset', (req, res) => {
  persistentStore.alerts = seedAlerts.map((item) => ({ ...item, acknowledgedAt: null }));
  saveStore(persistentStore);
  return res.json({ ok: true, alerts: persistentStore.alerts });
});

router.post('/chat', (req, res) => {
  const question = String(req.body?.message || '').trim().toLowerCase();
  if (!question) return res.status(400).json({ ok: false, message: 'message is required.' });

  let answer = 'I can explain risk levels, alerts, road connectivity, rainfall signals, field reports, and what to do during a landslide warning. Try asking about a specific district or alert.';
  if (question.includes('critical') || question.includes('high risk')) {
    answer = 'Critical risk means immediate action is needed. Avoid the affected corridor, keep people away from unstable slopes, and follow district administration or emergency service instructions. High risk areas should be monitored closely and response teams should verify conditions.';
  } else if (question.includes('landslide') || question.includes('slope')) {
    answer = 'A landslide warning combines rainfall intensity, soil saturation, terrain slope, historical incidents, and field or satellite observations. If you see fresh cracks, tilting trees, unusual sounds, or moving soil, move away from the slope and submit a geo-tagged field report.';
  } else if (question.includes('alert') || question.includes('notification')) {
    answer = 'Priority alerts are ranked by severity and urgency. Open the bell icon for active notifications, then use Acknowledge after your response team has reviewed the alert.';
  } else if (question.includes('rain') || question.includes('weather')) {
    answer = 'Rainfall is a major trigger for slope failure. The dashboard highlights rainfall-linked alerts and shows when monitored corridors cross their warning thresholds. Treat intense or sustained rain as a reason to avoid vulnerable roads.';
  } else if (question.includes('road') || question.includes('connectivity')) {
    answer = 'Use Connectivity to check whether a corridor is open, limited, at risk, or blocked. Do not travel through a blocked route; check with the district control room for an alternate route.';
  } else if (question.includes('report') || question.includes('photo')) {
    answer = 'Use Report hazard to submit cracks, slope movement, rockfall, flooding, or road blockages. Add the location, severity, description, and a photo if safe. Reports are queued offline and sync when connectivity returns.';
  }
  return res.json({ ok: true, answer, source: 'monitoring-assistant' });
});

router.get('/sources/status', (req, res) => {
  return res.json({
    ok: true,
    providers: Object.entries(providers).map(([key, provider]) => ({
      key,
      name: provider.name,
      configured: Boolean(process.env[provider.env]),
      environmentVariable: provider.env,
    })),
  });
});

async function ingestProviderData(req, res, next) {
  try {
    const snapshots = await fetchAllProviders();
    persistentStore.dataSnapshots = { ...snapshots, ingestedAt: new Date().toISOString() };
    saveStore(persistentStore);
    return res.json({ ok: true, snapshots, ingestedAt: persistentStore.dataSnapshots.ingestedAt });
  } catch (error) {
    return next(error);
  }
}

router.get('/ingest', ingestProviderData);
router.post('/ingest', ingestProviderData);

router.get('/predictions', (req, res) => {
  const zones = persistentStore.zones.map((zone) => {
    const sensor = persistentStore.dataSnapshots.sensors?.readings?.find((item) => item.zone === zone.name);
    const satellite = persistentStore.dataSnapshots.satellite?.observations?.find((item) => item.zone === zone.name);
    const terrain = persistentStore.dataSnapshots.terrain?.observations?.find((item) => item.zone === zone.name);
    const history = persistentStore.dataSnapshots.historical?.events?.find((item) => item.zone === zone.name);
    const rainfall = persistentStore.dataSnapshots.weather?.readings?.find((item) => item.district === zone.district);
    let score = Number(zone.score || 0);
    if (sensor?.soilSaturation >= 80) score += 5;
    if (satellite?.movementDetected) score += 6;
    if (terrain?.slopeDegrees >= 30) score += 4;
    if (history?.eventsLast5Years >= 4) score += 3;
    if ((rainfall?.rainfallMm6h || 0) >= 80) score += 5;
    score = Math.min(99, score);
    return { ...zone, predictedScore: score, confidence: persistentStore.dataSnapshots.ingestedAt ? 0.73 : 0.68, drivers: { rainfall, sensor, satellite, terrain, history } };
  });
  return res.json({ ok: true, source: persistentStore.dataSnapshots.ingestedAt ? 'ingested-adapters' : 'seed-data', generatedAt: new Date().toISOString(), predictions: zones });
});

router.get('/nasa/research', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const nasaData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'nasa_glc_meghalaya.json'), 'utf8'));
    return res.json({ ok: true, data: nasaData });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

router.get('/nasa/glc-events', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const nasaData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'nasa_glc_meghalaya.json'), 'utf8'));
    return res.json({ ok: true, events: nasaData.glcEvents || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
