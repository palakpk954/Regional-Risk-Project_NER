const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDirectory, 'monitoring.json');

function loadStore(seed) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    if (parsed && Array.isArray(parsed.zones) && Array.isArray(parsed.alerts) && Array.isArray(parsed.reports)) return parsed;
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`Persistent monitoring data could not be read: ${error.message}`);
  }
  const initial = { zones: seed.zones, alerts: seed.alerts, reports: [], dataSnapshots: {}, predictionRuns: [] };
  saveStore(initial);
  return initial;
}

function saveStore(store) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(temporaryFile, dataFile);
}

module.exports = { loadStore, saveStore, dataFile };
