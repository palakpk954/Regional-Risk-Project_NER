function normalizeText(value) {
  return String(value ?? '').trim();
}

export function normalizeCompanyName(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|llc|inc|corp|corporation|co|company|plc)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeRate(part, total) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

const CORE_TOP_TECH_COMPANIES = [
  'Google', 'Alphabet', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'NVIDIA', 'AMD', 'Intel', 'Qualcomm',
  'Cisco', 'Oracle', 'IBM', 'SAP', 'Adobe', 'Salesforce', 'ServiceNow', 'Snowflake', 'Palantir', 'Atlassian',
  'Databricks', 'OpenAI', 'Anthropic', 'DeepMind', 'xAI', 'MongoDB', 'Redis', 'Cloudflare', 'Akamai', 'Stripe',
  'PayPal', 'Block', 'Visa', 'Mastercard', 'Uber', 'Lyft', 'Airbnb', 'Booking', 'Expedia', 'Netflix',
  'Spotify', 'Samsung', 'Sony', 'LG', 'Panasonic', 'Tesla', 'SpaceX', 'Blue Origin', 'Siemens', 'Bosch',
  'Schneider Electric', 'Honeywell', 'GE Digital', 'ABB', 'ASML', 'TSMC', 'Broadcom', 'Micron', 'Arm', 'KLA',
  'Synopsys', 'Cadence', 'Marvell', 'Texas Instruments', 'HPE', 'Dell Technologies', 'HP', 'Lenovo', 'Acer', 'ASUS',
  'Infosys', 'TCS', 'Wipro', 'HCLTech', 'Tech Mahindra', 'LTIMindtree', 'Mphasis', 'Cognizant', 'Capgemini', 'Accenture',
  'Deloitte', 'KPMG', 'PwC', 'EY', 'Nagarro', 'Persistent Systems', 'Hexaware', 'Birlasoft', 'KPIT', 'Oracle Financial Services',
  'Zoho', 'Freshworks', 'Razorpay', 'PhonePe', 'Paytm', 'Flipkart', 'Myntra', 'Meesho', 'Ola', 'Swiggy',
  'Zomato', 'Nykaa', 'Jio Platforms', 'Airtel Digital', 'Nokia', 'Ericsson', 'Juniper Networks', 'Fortinet', 'Palo Alto Networks', 'CrowdStrike',
  'SentinelOne', 'Datadog', 'Splunk', 'Elastic', 'Confluent', 'HashiCorp', 'GitHub', 'GitLab', 'JetBrains', 'Canva',
  'Figma', 'Notion', 'Miro', 'Twilio', 'Okta', 'Auth0', 'Coinbase', 'Binance', 'Robinhood', 'Upstox',
  'Zerodha', 'Byju\'s', 'Unacademy', 'Coursera', 'Udemy', 'Duolingo', 'Unity', 'Epic Games', 'Roblox', 'Electronic Arts',
  'Rockstar Games', 'Tencent', 'ByteDance', 'Alibaba Cloud', 'Baidu', 'Huawei', 'Xiaomi', 'OnePlus', 'Nothing', 'InMobi',
  'Acko', 'Dream11', 'ShareChat', 'Dailyhunt', 'Quora', 'Reddit', 'LinkedIn', 'X', 'Discord', 'Snap',
  'Pinterest', 'Dropbox', 'Box', 'Slack', 'Zoom', 'Asana', 'Monday.com', 'HubSpot', 'Shopify', 'Wix',
  'Squarespace', 'DocuSign', 'Intuit', 'Workday', 'Arista Networks', 'Motorola Solutions', 'Yext', 'UiPath', 'Automation Anywhere', 'Celonis',
];

const TECH_PREFIXES = [
  'Apex', 'Nova', 'Quantum', 'Vertex', 'Hyper', 'Skyline', 'Blue', 'Red', 'Green', 'Silver',
  'Golden', 'Digital', 'Cloud', 'Data', 'Neural', 'Cyber', 'Logic', 'Pixel', 'Code', 'Algo',
  'Future', 'Prime', 'Core', 'Fusion', 'Vector', 'Matrix', 'Orbit', 'Zen', 'Nexus', 'Edge',
  'Meta', 'Micro', 'Macro', 'Omni', 'Ultra', 'Nano', 'Rocket', 'Trinity', 'Signal', 'Spectrum',
  'Aurora', 'Stellar', 'Summit', 'Peak', 'Wave', 'Spark', 'Flare', 'Trail', 'Shift', 'Bridge',
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Pluto', 'Delta', 'Gamma', 'Sigma', 'Lambda',
  'Innova', 'Veda', 'Shastra', 'Kite', 'Atlas', 'Titan', 'Pioneer', 'Horizon', 'Beacon', 'Pulse',
  'Insight', 'Predict', 'Crest', 'Flow', 'Dash', 'Radar', 'Verve', 'Alpha', 'Beta', 'Omega',
  'Accel', 'Sprint', 'Crux', 'Catalyst', 'Infini', 'Terra', 'Astra', 'Volt', 'Magna', 'Vortex',
  'Parity', 'ParityX', 'Nimbus', 'Codex', 'Zenith', 'Quanta', 'Datix', 'Cyra', 'Lumina', 'Ignite',
];

const TECH_SUFFIXES = [
  'Tech', 'Technologies', 'Labs', 'Systems', 'Software', 'Digital', 'Cloud', 'AI', 'Analytics', 'Networks',
  'Platforms', 'Solutions', 'Infotech', 'Robotics', 'Cyber', 'Compute', 'Micro', 'Semiconductor', 'Automation', 'Engineering',
];

const TECH_KEYWORDS = [
  'tech', 'technology', 'software', 'cloud', 'ai', 'analytics', 'data', 'digital', 'systems', 'network',
  'platform', 'infotech', 'robotics', 'cyber', 'semiconductor', 'automation', 'compute', 'logic', 'micro', 'deep',
];

function buildCatalog() {
  const set = new Set();

  CORE_TOP_TECH_COMPANIES.forEach((name) => {
    const normalized = normalizeCompanyName(name);
    if (normalized) set.add(normalized);
  });

  TECH_PREFIXES.forEach((prefix) => {
    TECH_SUFFIXES.forEach((suffix) => {
      const spaced = normalizeCompanyName(`${prefix} ${suffix}`);
      const joined = normalizeCompanyName(`${prefix}${suffix}`);
      if (spaced) set.add(spaced);
      if (joined) set.add(joined);
    });
  });

  return set;
}

const TOP_TECH_CATALOG = buildCatalog();

export function getTopTechCatalogSize() {
  return TOP_TECH_CATALOG.size;
}

export function detectCompanyQuality(companyName) {
  const raw = normalizeText(companyName);
  const normalized = normalizeCompanyName(raw);

  if (!normalized || normalized === 'unassigned') {
    return {
      companyName: raw || 'Unassigned',
      normalizedName: normalized,
      isTopTech: false,
      score: 0,
      confidence: 'none',
    };
  }

  const inCatalog = TOP_TECH_CATALOG.has(normalized);
  const keywordHits = TECH_KEYWORDS.filter((keyword) => normalized.includes(keyword)).length;
  const score = Math.min(100, (inCatalog ? 80 : 0) + keywordHits * 8 + (normalized.split(' ').length >= 2 ? 6 : 0));
  const isTopTech = inCatalog || score >= 70;

  let confidence = 'low';
  if (score >= 90) confidence = 'high';
  else if (score >= 75) confidence = 'strong';
  else if (score >= 55) confidence = 'medium';

  return {
    companyName: raw,
    normalizedName: normalized,
    isTopTech,
    score,
    confidence,
  };
}

export function analyzeCompanyIntelligence(companyNames) {
  const uniqueNames = Array.from(
    new Set((companyNames || []).map((name) => normalizeText(name)).filter((name) => name && name.toLowerCase() !== 'unassigned')),
  );

  const detections = uniqueNames.map((name) => detectCompanyQuality(name));
  const topDetectedCompanies = detections
    .filter((item) => item.isTopTech)
    .sort((a, b) => (b.score - a.score) || a.companyName.localeCompare(b.companyName));

  return {
    catalogSize: getTopTechCatalogSize(),
    totalDistinctCompanies: uniqueNames.length,
    detectedTopTechCompanies: topDetectedCompanies.length,
    detectionRate: safeRate(topDetectedCompanies.length, uniqueNames.length),
    topDetectedCompanies: topDetectedCompanies.slice(0, 10),
    allDetections: detections,
  };
}
