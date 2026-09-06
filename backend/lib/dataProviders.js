const providers = {
  weather: {
    name: 'Weather / IMD',
    env: 'WEATHER_API_URL',
    async fetch() {
      return { source: process.env.WEATHER_API_URL ? 'configured-weather-provider' : 'demo-weather', readings: [{ district: 'Sikkim', rainfallMm6h: 118, forecast: 'Heavy rain likely' }, { district: 'Meghalaya', rainfallMm6h: 86, forecast: 'Intense showers expected' }] };
    },
  },
  sensors: {
    name: 'Soil and weather sensors',
    env: 'MQTT_BROKER_URL',
    async fetch() {
      return { source: process.env.MQTT_BROKER_URL ? 'configured-mqtt-broker' : 'demo-sensors', readings: [{ zone: 'NH-10 · Rangpo–Gangtok', soilSaturation: 84, battery: 91 }, { zone: 'NH-6 · Jowai bypass', soilSaturation: 71, battery: 88 }] };
    },
  },
  satellite: {
    name: 'Satellite imagery / deformation',
    env: 'SATELLITE_API_URL',
    async fetch() {
      return { source: process.env.SATELLITE_API_URL ? 'configured-satellite-provider' : 'demo-satellite', observations: [{ zone: 'Dima Hasao · Haflong', movementDetected: true, confidence: 0.74 }] };
    },
  },
  terrain: {
    name: 'Terrain / DEM',
    env: 'TERRAIN_API_URL',
    async fetch() {
      return { source: process.env.TERRAIN_API_URL ? 'configured-terrain-provider' : 'demo-terrain', observations: [{ zone: 'NH-10 · Rangpo–Gangtok', slopeDegrees: 37, elevationMeters: 1540 }] };
    },
  },
  historical: {
    name: 'Historical landslide inventory',
    env: 'LANDSLIDE_DATA_URL',
    async fetch() {
      return { source: process.env.LANDSLIDE_DATA_URL ? 'configured-inventory' : 'demo-inventory', events: [{ zone: 'NH-10 · Rangpo–Gangtok', eventsLast5Years: 6 }, { zone: 'Dima Hasao · Haflong', eventsLast5Years: 4 }] };
    },
  },
  roads: {
    name: 'Road authority status',
    env: 'ROAD_STATUS_API_URL',
    async fetch() {
      return { source: process.env.ROAD_STATUS_API_URL ? 'configured-road-provider' : 'demo-road-status', routes: [{ name: 'NH-10 · Sikkim', status: 'Blocked' }, { name: 'NH-6 · Meghalaya', status: 'Limited' }] };
    },
  },
};

async function fetchAllProviders() {
  const entries = await Promise.all(Object.entries(providers).map(async ([key, provider]) => [key, await provider.fetch()]));
  return Object.fromEntries(entries);
}

module.exports = { providers, fetchAllProviders };
