import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudLightning,
  CloudRain,
  Cpu,
  Database,
  Droplets,
  Eye,
  FileText,
  Filter,
  Globe,
  HardHat,
  Home,
  Info,
  Layers3,
  LocateFixed,
  LogOut,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Mountain,
  Navigation,
  Phone,
  Radio,
  RefreshCw,
  Route,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sliders,
  Sparkles,
  Thermometer,
  Upload,
  Volume2,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LoginPage from './components/LoginPage';

const regions = ['All districts', 'Sikkim', 'Assam', 'Meghalaya', 'Arunachal Pradesh'];
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SYNC_QUEUE_KEY = 'himalya-watch-sync-queue-v1';

function readSyncQueue() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSyncQueue(queue) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

const defaultRiskZones = [
  { id: 'zone-1', name: 'NH-10 · Rangpo–Gangtok', district: 'Sikkim', level: 'Critical', score: 92, road: 'Blocked', rainfall: '118 mm', coordinates: [27.165, 88.615], elevation: '1,540 m', slope: '37°' },
  { id: 'zone-2', name: 'NH-6 · Jowai bypass', district: 'Meghalaya', level: 'High', score: 78, road: 'At risk', rainfall: '86 mm', coordinates: [25.45, 92.2], elevation: '1,380 m', slope: '31°' },
  { id: 'zone-3', name: 'Dima Hasao · Haflong', district: 'Assam', level: 'High', score: 74, road: 'At risk', rainfall: '72 mm', coordinates: [25.16, 93.02], elevation: '680 m', slope: '28°' },
  { id: 'zone-4', name: 'Tawang · Sela Pass', district: 'Arunachal Pradesh', level: 'Moderate', score: 56, road: 'Open', rainfall: '46 mm', coordinates: [27.5, 92.1], elevation: '4,170 m', slope: '34°' },
  { id: 'zone-5', name: 'Mangan · Chungthang', district: 'Sikkim', level: 'Moderate', score: 51, road: 'Open', rainfall: '39 mm', coordinates: [27.6, 88.65], elevation: '1,790 m', slope: '29°' },
];

const nearbyPlaces = [
  { name: 'District Hospital', type: 'Hospital', coordinates: [27.33, 88.61] },
  { name: 'Rangpo Police Station', type: 'Emergency service', coordinates: [27.18, 88.53] },
  { name: 'Gangtok Command Post', type: 'Command center', coordinates: [27.33, 88.61] },
  { name: 'Jowai Fire & Rescue', type: 'Emergency service', coordinates: [25.45, 92.2] },
  { name: 'Haflong Relief Shelter', type: 'Shelter', coordinates: [25.16, 93.02] },
  { name: 'Shillong Civil Hospital', type: 'Hospital', coordinates: [25.57, 91.89] },
];

function severityClass(level) {
  return {
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    Watch: 'bg-sky-50 text-sky-700 border-sky-200',
    Red: 'bg-rose-50 text-rose-700 border-rose-200',
    Orange: 'bg-orange-50 text-orange-700 border-orange-200',
    Yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    Green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[level] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function StatCard({ icon, label, value, note, tone, onClick }) {
  const tones = {
    rose: 'bg-rose-50 text-rose-600',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg' : ''
      }`}
    >
      <div className='flex items-start justify-between'>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          {createElement(icon, { className: 'h-5 w-5' })}
        </div>
        <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500'>LIVE</span>
      </div>
      <p className='mt-4 text-2xl font-extrabold tracking-tight text-slate-900'>{value}</p>
      <p className='mt-1 text-sm font-medium text-slate-600'>{label}</p>
      <p className='mt-2 text-xs text-slate-400'>{note}</p>
    </button>
  );
}

function MapLocationControl({ onLocate }) {
  const map = useMap();
  return (
    <div className='leaflet-custom-controls'>
      <button onClick={() => map.setZoom(map.getZoom() + 1)} aria-label='Zoom in'>+</button>
      <button onClick={() => map.setZoom(map.getZoom() - 1)} aria-label='Zoom out'>−</button>
      <button
        onClick={() => {
          map.setView([25.46, 91.36], 8);
          onLocate?.();
        }}
        aria-label='Center on Meghalaya'
        title='Recenter on Meghalaya & East Khasi Hills'
      >
        <LocateFixed className='h-4 w-4' />
      </button>
    </div>
  );
}

function RiskMap({
  zones,
  selectedZone,
  setSelectedZone,
  onLocate,
  height = 'h-[430px]',
  showNasaEvents = true,
  nasaEvents = [],
}) {
  const markerIcon = (level) =>
    L.divIcon({
      className: 'risk-leaflet-marker',
      html: `<span class="leaflet-risk-dot ${String(level).toLowerCase()}"></span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

  const nasaIcon = L.divIcon({
    className: 'risk-leaflet-marker',
    html: `<span style="display:block;width:20px;height:20px;background:#1d4ed8;border:2px solid white;border-radius:50%;box-shadow:0 0 10px rgba(29,78,216,0.6)"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <div className={`relative ${height} overflow-hidden rounded-2xl border border-slate-200 shadow-inner`}>
      <MapContainer center={[25.46, 91.8]} zoom={8} minZoom={5} maxZoom={16} className='h-full w-full' scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        <MapLocationControl onLocate={onLocate} />

        {zones.map((zone) => {
          const position = zone.coordinates || defaultRiskZones.find((item) => item.name === zone.name)?.coordinates;
          if (!position) return null;
          return (
            <Marker
              key={zone.name}
              position={position}
              icon={markerIcon(zone.level)}
              eventHandlers={{ click: () => setSelectedZone(zone) }}
            >
              <Popup>
                <div className='min-w-48 p-1'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>{zone.district}</p>
                  <b className='block py-1 text-sm text-slate-900'>{zone.name}</b>
                  <div className='my-1.5 flex items-center gap-2'>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${severityClass(zone.level)}`}>
                      {zone.level} · {zone.score || zone.predictedScore}% risk
                    </span>
                    <span className='text-xs font-semibold text-slate-500'>{zone.road}</span>
                  </div>
                  <p className='mt-2 text-xs text-slate-600'>
                    <b>Rainfall:</b> {zone.rainfall || '65 mm'} · <b>Slope:</b> {zone.slope || '32°'}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {showNasaEvents &&
          nasaEvents.map((evt) => (
            <Marker key={evt.id} position={evt.coordinates} icon={nasaIcon}>
              <Popup>
                <div className='min-w-52 p-1'>
                  <span className='rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-800 uppercase'>
                    NASA GLC Ground Truth
                  </span>
                  <b className='mt-1 block text-sm text-slate-900'>{evt.location}</b>
                  <p className='text-xs text-slate-500'>Date: <b>{evt.eventDate}</b></p>
                  <p className='mt-1 text-xs text-slate-600'>
                    <b>Trigger:</b> {evt.trigger}
                    <br />
                    <b>Category:</b> {evt.landslideCategory}
                    <br />
                    <b>Fatalities:</b> {evt.fatalities} · <b>Accuracy:</b> {evt.accuracy}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {nearbyPlaces.map((place) => (
          <Marker key={place.name} position={place.coordinates} opacity={0.75}>
            <Popup>
              <b className='text-sm'>{place.name}</b>
              <p className='text-xs text-slate-500'>{place.type}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className='absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm'>
        <Map className='h-3.5 w-3.5 text-emerald-700' />
        <span>Meghalaya & NER Spatial Grid</span>
      </div>

      <div className='absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2 rounded-xl border border-white/80 bg-white/95 p-2 text-[11px] font-semibold shadow-sm'>
        {['Critical', 'High', 'Moderate'].map((level) => (
          <span key={level} className='flex items-center gap-1.5'>
            <i
              className={`h-2.5 w-2.5 rounded-full ${
                level === 'Critical' ? 'bg-rose-500' : level === 'High' ? 'bg-orange-500' : 'bg-amber-400'
              }`}
            />
            {level}
          </span>
        ))}
        {showNasaEvents && (
          <span className='flex items-center gap-1.5 border-l border-slate-200 pl-2 text-blue-700 font-bold'>
            <i className='h-2.5 w-2.5 rounded-full bg-blue-600' /> NASA GLC Catalog
          </span>
        )}
      </div>

      {selectedZone && (
        <div className='absolute bottom-4 right-4 z-[1000] hidden rounded-xl bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-700 shadow-sm md:block'>
          Inspecting: {selectedZone.name}
        </div>
      )}
    </div>
  );
}

function ReportModal({ onClose, onSubmit, defaultDistrict = 'Meghalaya' }) {
  const [submitted, setSubmitted] = useState(false);
  const [hazardType, setHazardType] = useState('Crack / slope movement');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [district, setDistrict] = useState(defaultDistrict === 'All districts' ? 'Meghalaya' : defaultDistrict);
  const [coords, setCoords] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDetectingLocation(false);
      },
      () => {
        setCoords({ lat: 25.421, lng: 91.734 });
        setDetectingLocation(false);
      }
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitted(true);
    onSubmit({
      hazardType,
      severity,
      description,
      locationName: locationName || `${district} Monitored Corridor`,
      district,
      latitude: coords ? coords.lat : 25.421,
      longitude: coords ? coords.lng : 91.734,
    });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm'>
      <div className='w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl'>
        <div className='flex items-start justify-between'>
          <div>
            <p className='text-xs font-bold uppercase tracking-[.18em] text-emerald-700'>Field Incident Network</p>
            <h2 className='mt-1 text-xl font-extrabold text-slate-900'>Submit Hazard Report</h2>
          </div>
          <button onClick={onClose} className='rounded-lg p-2 text-slate-400 hover:bg-slate-100'>
            <X className='h-5 w-5' />
          </button>
        </div>

        {submitted ? (
          <div className='py-8 text-center'>
            <CheckCircle2 className='mx-auto h-12 w-12 text-emerald-600' />
            <h3 className='mt-4 font-bold text-slate-900'>Report Queued & Recorded</h3>
            <p className='mt-1 text-sm text-slate-500'>
              Syncing directly with district control and monitoring backend store.
            </p>
            <button onClick={onClose} className='mt-6 rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white'>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className='mt-5 space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='field-label'>District / State</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className='field-input'>
                  {regions.slice(1).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='field-label'>Corridor / Location Name</label>
                <input
                  type='text'
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder='e.g., Shillong-Sohra Road near Mawjrong'
                  className='field-input'
                />
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='field-label'>Hazard type</label>
                <select value={hazardType} onChange={(e) => setHazardType(e.target.value)} className='field-input'>
                  <option>Crack / slope movement</option>
                  <option>Road blockage</option>
                  <option>Rockfall</option>
                  <option>Flash flood</option>
                  <option>Mudslide / Debris flow</option>
                </select>
              </div>
              <div>
                <label className='field-label'>Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className='field-input'>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Moderate</option>
                </select>
              </div>
            </div>

            <div>
              <label className='field-label'>GPS Coordinates</label>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className='flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100'
                >
                  <LocateFixed className={`h-4 w-4 text-emerald-700 ${detectingLocation ? 'animate-spin' : ''}`} />
                  {detectingLocation ? 'Detecting GPS…' : coords ? `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}` : 'Use GPS location'}
                </button>
                {coords && <span className='text-[11px] font-bold text-emerald-700'>✓ Geo-tagged</span>}
              </div>
            </div>

            <div>
              <label className='field-label'>Observations & Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className='field-input min-h-20'
                placeholder='Detail fissure width, soil creep, tree tilting, or obstruction status…'
              />
            </div>

            <div className='flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-white p-2 text-slate-500 shadow-sm'>
                  <Camera className='h-5 w-5' />
                </div>
                <div>
                  <p className='text-xs font-semibold text-slate-700'>Photo evidence</p>
                  <p className='text-[10px] text-slate-400'>Field photo capture ready</p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => alert('Camera/file input ready. Attachment will sync with report.')}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600'
              >
                <Upload className='mr-1 inline h-3.5 w-3.5' /> Attach
              </button>
            </div>

            <button
              type='submit'
              className='mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800'
            >
              Submit field report
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Assistant({ alerts, zones, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Namaste! I am Tara, your NER Landslide Intelligence Advisor. I am calibrated with the research paper by Palak Kumari (JECRC University) on Meghalaya & North East India, covering NASA GLC historical events, Copernicus DEM terrain slopes, and GPM IMERG rainfall triggers. Ask me anything!',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const quickQuestions = [
    'Tell me about the 2017 Mawjrong event',
    'What features does Random Forest use?',
    'What is the threshold for Meghalaya rain?',
    'Explain the 4-layer LoRaWAN architecture',
  ];

  const sendMessage = async (text = draft) => {
    const message = text.trim();
    if (!message || sending) return;
    setDraft('');
    setMessages((current) => [...current, { role: 'user', text: message }]);
    setSending(true);
    try {
      const response = await fetch(`${API_BASE}/monitoring/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, alerts, zones }),
      });
      if (!response.ok) throw new Error('Assistant unavailable');
      const payload = await response.json();
      setMessages((current) => [...current, { role: 'assistant', text: payload.answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'Research Insight: In Meghalaya, 89% of landslides are rainfall-triggered and 83% occur during June–September. The Random Forest model weights elevation (37%) and slope (31%) highest, achieving a ROC-AUC of 0.73 on Copernicus DEM and ESA WorldCover data.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='fixed bottom-24 right-4 z-50 flex h-[min(620px,calc(100vh-8rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-2xl'>
      <div className='flex items-center justify-between bg-[#123524] px-5 py-4 text-white'>
        <div className='flex items-center gap-3'>
          <div className='rounded-xl bg-emerald-400/20 p-2 text-emerald-300'>
            <MessageCircle className='h-5 w-5' />
          </div>
          <div>
            <p className='text-sm font-extrabold'>Tara · Research & Risk Guide</p>
            <p className='text-[11px] text-emerald-200'>JECRC University & NASA GLC Model</p>
          </div>
        </div>
        <button aria-label='Close assistant' onClick={onClose} className='rounded-lg p-1.5 text-emerald-100 hover:bg-white/10'>
          <X className='h-4 w-4' />
        </button>
      </div>
      <div className='flex-1 space-y-3 overflow-y-auto bg-[#f4f8f4] p-4'>
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                message.role === 'user'
                  ? 'rounded-br-md bg-[#166534] text-white'
                  : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className='w-fit rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-400'>
            Analyzing NASA model telemetry…
          </div>
        )}
      </div>
      <div className='border-t border-slate-200 bg-white p-3'>
        <div className='mb-2 flex gap-2 overflow-x-auto pb-1'>
          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => sendMessage(question)}
              className='shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100'
            >
              {question}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className='flex items-center gap-2'
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder='Ask about Meghalaya, NASA data, or models…'
            className='min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-emerald-500'
          />
          <button
            aria-label='Send message'
            disabled={!draft.trim() || sending}
            className='rounded-xl bg-[#166534] p-2.5 text-white disabled:opacity-40'
          >
            <Send className='h-4 w-4' />
          </button>
        </form>
      </div>
    </div>
  );
}

function TaraHint({ message, action, onAction, compact = false }) {
  return (
    <div className={`tara-hint ${compact ? 'tara-hint-compact' : ''}`}>
      <div className='tara-mini'>
        <span className='tara-mini-leaf' />
        <span className='tara-mini-face'>
          <i />
          <i />
          <b />
        </span>
      </div>
      <div className='min-w-0 flex-1'>
        <p>{message}</p>
        {action && (
          <button onClick={onAction} className='font-bold text-emerald-700 hover:underline'>
            {action} <span aria-hidden='true'>→</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('himalya_watch_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('himalya_watch_user');
    localStorage.removeItem('himalya_watch_token');
    setCurrentUser(null);
  };

  const [region, setRegion] = useState('All districts');
  const [activeNav, setActiveNav] = useState('Overview');
  const [selectedZone, setSelectedZone] = useState(defaultRiskZones[0]);
  const [zones, setZones] = useState(defaultRiskZones);
  const [alerts, setAlerts] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [fieldReports, setFieldReports] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [predictionConfidence, setPredictionConfidence] = useState(0.73);
  const [loadingData, setLoadingData] = useState(false);

  const [nasaResearch, setNasaResearch] = useState(null);
  const [nasaGlcEvents, setNasaGlcEvents] = useState([]);
  const [showNasaPins, setShowNasaPins] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('khasi');

  const [showReport, setShowReport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingSync, setPendingSync] = useState(() => readSyncQueue().length);
  const [taraTip, setTaraTip] = useState(0);
  const taraTips = [
    'Research Discovery: In Meghalaya, 89% of landslides are rainfall-triggered and 83% occur in June–Sept.',
    'The 17 June 2017 Mawjrong event in East Khasi Hills was preceded by 328 mm 3-day rainfall.',
    'Our Random Forest model achieves ROC-AUC of 0.7313, prioritizing Elevation (37%) and Slope (31%).',
    'LoRaWAN architecture provides offline resilience in remote high-seismic Zone V terrain.',
  ];

  const [simulatedRainfall, setSimulatedRainfall] = useState(115);
  const [simulatedSaturation, setSimulatedSaturation] = useState(82);

  const filteredZones = useMemo(() => {
    return region === 'All districts' ? zones : zones.filter((z) => z.district === region);
  }, [region, zones]);

  const loadOverview = useCallback(() => {
    setLoadingData(true);
    const query = region === 'All districts' ? '?includeAcknowledged=true' : `?district=${encodeURIComponent(region)}&includeAcknowledged=true`;
    fetch(`${API_BASE}/monitoring/overview${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.zones) && data.zones.length) {
          setZones(data.zones.map((z, idx) => ({ ...z, id: z.id || `zone-${idx + 1}` })));
        }
        if (Array.isArray(data.allAlerts || data.alerts)) {
          const raw = data.allAlerts || data.alerts;
          setAllAlerts(raw);
          setAlerts(raw.filter((a) => !a.acknowledgedAt));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [region]);

  const loadFieldReports = useCallback(() => {
    fetch(`${API_BASE}/monitoring/field-reports`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.reports)) setFieldReports(data.reports);
      })
      .catch(() => {});
  }, []);

  const loadNasaData = useCallback(() => {
    fetch(`${API_BASE}/monitoring/nasa/research`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data) {
          setNasaResearch(data.data);
          if (Array.isArray(data.data.glcEvents)) {
            setNasaGlcEvents(data.data.glcEvents);
          }
        }
      })
      .catch(() => {});
  }, []);

  const loadPredictions = useCallback(() => {
    fetch(`${API_BASE}/monitoring/predictions`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
          setPredictionConfidence(data.confidence || 0.73);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadOverview();
    loadFieldReports();
    loadNasaData();
    loadPredictions();
  }, [loadOverview, loadFieldReports, loadNasaData, loadPredictions]);

  const queueSyncItem = (item) => {
    const queue = [...readSyncQueue(), { ...item, queuedAt: new Date().toISOString() }];
    writeSyncQueue(queue);
    setPendingSync(queue.length);
  };

  const acknowledgeAlert = (id) => {
    setAlerts((curr) => curr.filter((a) => a.id !== id));
    setAllAlerts((curr) =>
      curr.map((a) => (a.id === id ? { ...a, acknowledgedAt: new Date().toISOString() } : a))
    );
    queueSyncItem({ path: `/monitoring/alerts/${id}/acknowledge`, method: 'PATCH' });
  };

  const submitFieldReport = (reportPayload) => {
    const tempReport = {
      ...reportPayload,
      id: `report-${Date.now()}`,
      status: 'Queued',
      createdAt: new Date().toISOString(),
    };
    setFieldReports((curr) => [tempReport, ...curr]);
    queueSyncItem({
      path: '/monitoring/field-reports',
      method: 'POST',
      body: reportPayload,
    });
  };

  const navItems = [
    { label: 'Overview', icon: Home },
    { label: 'Live Risk Map', icon: Map },
    { label: 'NASA Research & Model', icon: Globe },
    { label: 'Priority Alerts', icon: Bell, count: alerts.length },
    { label: 'Field Reports', icon: FileText, count: fieldReports.length },
    { label: 'Connectivity & Roads', icon: Route },
    { label: 'AI Risk Predictor', icon: Cpu },
  ];

  if (!currentUser) {
    return <LoginPage onLogin={(user) => setCurrentUser(user)} apiBase={API_BASE} />;
  }

  return (
    <div className='forest-app min-h-screen bg-[#f2f7f3] text-slate-900'>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          showMobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex h-20 items-center gap-3 border-b border-slate-100 px-6'>
          <div className='brand-mark'>
            <Mountain className='h-5 w-5' />
          </div>
          <div>
            <p className='text-sm font-extrabold tracking-tight'>Himālya Watch</p>
            <p className='text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400'>NER Resilience Grid</p>
          </div>
        </div>

        <nav className='space-y-1 p-3'>
          {navItems.map(({ label, icon, count }) => {
            const isActive = activeNav === label;
            return (
              <button
                key={label}
                onClick={() => {
                  setActiveNav(label);
                  setShowMobileNav(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className='flex items-center gap-2.5'>
                  {createElement(icon, { className: `h-4 w-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}` })}
                  {label}
                </span>
                {count !== undefined && count > 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      label === 'Priority Alerts' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className='absolute bottom-5 left-3 right-3 rounded-2xl bg-[#123524] p-4 text-white shadow-md'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-xs font-bold'>
              <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' /> NASA Ground Truth
            </div>
            <span className='text-[10px] text-emerald-300 font-mono'>JECRC · 2026</span>
          </div>
          <p className='mt-2 text-[11px] leading-relaxed text-slate-300'>
            Palak Kumari (23BCON1858)
            <br />
            Meghalaya Case Study & AI RF
          </p>
          <div className='mt-3 flex items-center justify-between pt-2 border-t border-emerald-900/40 text-[10px] text-emerald-400'>
            <span>GLC: 35 Meghalaya Events</span>
            <button onClick={() => setActiveNav('NASA Research & Model')} className='hover:underline font-bold text-white'>
              Inspect
            </button>
          </div>
        </div>
      </aside>

      {showMobileNav && (
        <button
          aria-label='Close mobile menu'
          className='fixed inset-0 z-30 bg-slate-950/20 lg:hidden'
          onClick={() => setShowMobileNav(false)}
        />
      )}

      <main className='lg:pl-64'>
        <header className='sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8'>
          <div className='flex items-center gap-3'>
            <button onClick={() => setShowMobileNav(true)} className='rounded-lg p-2 text-slate-600 lg:hidden'>
              <Menu className='h-5 w-5' />
            </button>
            <div>
              <p className='text-xs font-semibold text-slate-400'>AI Landslide Early Warning · North Eastern Region of India</p>
              <h1 className='text-lg font-extrabold tracking-tight text-slate-900 md:text-xl'>
                {activeNav}
              </h1>
            </div>
          </div>

          <div className='relative flex items-center gap-2 md:gap-4'>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none hover:bg-white'
            >
              {regions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>

            <button
              onClick={() => setShowReport(true)}
              className='hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800'
            >
              <Camera className='h-3.5 w-3.5' /> Report Hazard
            </button>

            <button
              aria-label='Open notifications'
              onClick={() => setShowNotifications((open) => !open)}
              className={`relative rounded-xl border p-2.5 transition ${
                showNotifications
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:text-emerald-700'
              }`}
            >
              <Bell className='h-4 w-4' />
              {alerts.length > 0 && (
                <span className='absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[9px] font-bold text-white'>
                  {alerts.length}
                </span>
              )}
            </button>

            <div className='flex items-center gap-2 pl-2 border-l border-slate-200'>
              <div
                className='flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-extrabold text-white shadow-sm ring-2 ring-emerald-100'
                title={`${currentUser?.name || 'User'} (${currentUser?.role || 'Operator'})`}
              >
                {currentUser?.avatar || 'HW'}
              </div>
              <div className='hidden xl:block text-left'>
                <p className='text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]'>
                  {currentUser?.name || 'Regional Operator'}
                </p>
                <p className='text-[10px] text-emerald-700 font-semibold truncate max-w-[140px]'>
                  {currentUser?.badge || currentUser?.role || 'SDMA Authorized'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title='Log Out'
                className='flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 hover:border-rose-200 shadow-sm'
              >
                <LogOut className='h-3.5 w-3.5' />
                <span className='hidden sm:inline'>Log Out</span>
              </button>
            </div>
          </div>
        </header>

        <div className='mx-auto max-w-[1600px] p-4 md:p-8'>
          {activeNav === 'Overview' && (
            <div>
              <section className='mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end'>
                <div>
                  <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-800'>
                    <Activity className='h-4 w-4' /> JECRC University Research & Operational System
                  </div>
                  <h2 className='mt-2 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-5xl'>
                    Stay ahead of the <span className='editorial-accent'>slope.</span>
                  </h2>
                  <p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-600'>
                    Automated landslide early warning combining NASA Global Landslide Catalog (GLC), GPM IMERG satellite precipitation, and Copernicus DEM Random Forest susceptibility modeling for Meghalaya & NER.
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setActiveNav('NASA Research & Model')}
                    className='flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-900 hover:bg-blue-100'
                  >
                    <Globe className='h-4 w-4 text-blue-700' /> NASA Research & Paper
                  </button>
                  <button
                    onClick={() => setActiveNav('AI Risk Predictor')}
                    className='flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50'
                  >
                    <Cpu className='h-4 w-4 text-emerald-700' /> AI Simulator
                  </button>
                </div>
              </section>

              <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <StatCard
                  icon={AlertTriangle}
                  label='Critical risk zones'
                  value={region === 'All districts' ? '02' : '01'}
                  note='Click to inspect zones & NASA ground truth'
                  tone='rose'
                  onClick={() => setActiveNav('Live Risk Map')}
                />
                <StatCard
                  icon={CloudRain}
                  label='GPM Rain Exceedance'
                  value='89%'
                  note='Rainfall-triggered proportion (NASA GLC)'
                  tone='orange'
                  onClick={() => setActiveNav('NASA Research & Model')}
                />
                <StatCard
                  icon={Globe}
                  label='NASA GLC Events'
                  value='35'
                  note='Cleaned Meghalaya catalog (2007–2017)'
                  tone='indigo'
                  onClick={() => setActiveNav('NASA Research & Model')}
                />
                <StatCard
                  icon={ShieldCheck}
                  label='RF Model ROC-AUC'
                  value='0.73'
                  note='Elevation (37%) & Slope (31%) dominated'
                  tone='emerald'
                  onClick={() => setActiveNav('AI Risk Predictor')}
                />
              </div>

              <div className='mb-4 flex justify-end'>
                <TaraHint
                  compact
                  message={taraTips[taraTip]}
                  action='Tell me more'
                  onAction={() => setTaraTip((tip) => (tip + 1) % taraTips.length)}
                />
              </div>

              <div className='grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.85fr)]'>
                <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5'>
                  <div className='mb-4 flex items-center justify-between'>
                    <div>
                      <h3 className='font-extrabold text-slate-900'>Live Risk Map with NASA GLC Catalog Layer</h3>
                      <p className='mt-1 text-xs text-slate-400'>
                        Blue points show historical NASA GLC events · Colored markers show active live sensors
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav('Live Risk Map')}
                      className='text-xs font-bold text-emerald-700 hover:underline'
                    >
                      Expanded Map →
                    </button>
                  </div>
                  <RiskMap
                    zones={filteredZones}
                    selectedZone={selectedZone}
                    setSelectedZone={setSelectedZone}
                    nasaEvents={nasaGlcEvents}
                    showNasaEvents={showNasaPins}
                  />
                </section>

                <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5'>
                  <div className='mb-4 flex items-center justify-between'>
                    <div>
                      <h3 className='font-extrabold text-slate-900'>Priority Alerts Queue</h3>
                      <p className='mt-1 text-xs text-slate-400'>Early-warning queue for disaster teams</p>
                    </div>
                    <span className='rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600'>
                      {alerts.length} Open
                    </span>
                  </div>
                  <div className='space-y-3'>
                    {alerts.map((alert) => (
                      <div key={alert.id} className='rounded-xl border border-slate-100 bg-slate-50/70 p-3'>
                        <div className='flex items-start gap-3'>
                          <div className={`mt-0.5 rounded-lg p-2 ${alert.type === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                            <AlertTriangle className='h-4 w-4' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityClass(alert.type)}`}>
                              {alert.type}
                            </span>
                            <p className='mt-1 text-xs font-bold text-slate-800 leading-snug'>{alert.title}</p>
                            <p className='mt-1 text-[11px] text-slate-400'>{alert.detail}</p>
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className='mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline'
                            >
                              {alert.action} →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeNav === 'NASA Research & Model' && (
            <div className='space-y-6'>
              <div className='rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-[#123524] to-[#1c4b34] p-6 text-white shadow-xl md:p-8'>
                <div className='flex flex-col justify-between gap-4 md:flex-row md:items-start'>
                  <div>
                    <span className='rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300'>
                      Original Research Paper Ground Truth
                    </span>
                    <h2 className='mt-3 text-2xl font-extrabold tracking-tight md:text-3xl text-white'>
                      Automated Landslide Risk Monitoring and Early Warning System Through AI for the North Eastern Region of India: A Case Study of Meghalaya
                    </h2>
                    <p className='mt-2 text-xs text-emerald-200'>
                      <b>Palak Kumari</b> (23BCON1858) & <b>Ms. Ramandeep Kaur</b>, Assistant Prof. · Department of Computer Science & Engineering, JECRC University, Jaipur, India
                    </p>
                  </div>
                  <div className='rounded-2xl bg-white/10 p-4 backdrop-blur text-xs space-y-1.5 shrink-0 border border-white/10'>
                    <p><b>Study Region:</b> Meghalaya (East Khasi Hills, Sohra, Mawjrong)</p>
                    <p><b>Annual Rain:</b> 10,000–12,000 mm (Monsoon: May–Sept)</p>
                    <p><b>Seismic Hazard:</b> Zone V (High Seismicity)</p>
                    <p><b>Hybrid Engine:</b> Random Forest (Where) + GPM IMERG (When)</p>
                  </div>
                </div>
              </div>

              <div className='grid gap-6 lg:grid-cols-2'>
                <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                    <div>
                      <h3 className='font-extrabold text-slate-900'>Table I: NASA GLC Cleaning Pipeline</h3>
                      <p className='text-xs text-slate-400'>Systematic filtering from 11,033 global records to Meghalaya inventory</p>
                    </div>
                    <span className='rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700'>
                      NASA Data Portal
                    </span>
                  </div>

                  <div className='mt-4 overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                      <thead>
                        <tr className='border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]'>
                          <th className='pb-2'>Step</th>
                          <th className='pb-2'>Operation / Screening Stage</th>
                          <th className='pb-2 text-right'>Records Retained</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-100'>
                        {[
                          { step: 1, op: 'Load and parse NASA GLC dates', rec: '11,033' },
                          { step: 2, op: 'Eliminate duplicates (date, coordinates, title)', rec: '11,004' },
                          { step: 3, op: 'India filter (country label + GADM polygon)', rec: '1,497' },
                          { step: 4, op: 'North Eastern Region (NER) states', rec: '462' },
                          { step: 5, op: 'Inside Meghalaya polygon', rec: '36' },
                          { step: 6, op: 'Exclude mis-geocoded record (Singtam in Sikkim)', rec: '35' },
                          { step: 7, op: 'East Khasi Hills, positional accuracy <= 5 km', rec: '5' },
                        ].map((s) => (
                          <tr key={s.step} className={s.step === 6 || s.step === 7 ? 'bg-emerald-50/70 font-semibold' : ''}>
                            <td className='py-2.5 font-bold text-slate-700'>{s.step}</td>
                            <td className='py-2.5 text-slate-600'>{s.op}</td>
                            <td className='py-2.5 text-right font-mono font-bold text-emerald-800'>{s.rec}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className='mt-4 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1'>
                    <p>• <b>89% (31 events)</b> are triggered by rainfall.</p>
                    <p>• <b>83% (29 events)</b> occurred during June–September monsoon peak.</p>
                    <p>• <b>48 reported fatalities</b> across 31 recorded events.</p>
                  </div>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                    <div>
                      <h3 className='font-extrabold text-slate-900'>Table II & Fig. 5: Random Forest Performance</h3>
                      <p className='text-xs text-slate-400'>100 trees on 30m Copernicus DEM & ESA WorldCover</p>
                    </div>
                    <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800'>
                      ROC-AUC = 0.7313
                    </span>
                  </div>

                  <div className='mt-4'>
                    <h4 className='text-xs font-bold text-slate-800 uppercase tracking-wide'>Feature Importances (Fig. 5)</h4>
                    <div className='mt-3 space-y-2.5'>
                      {[
                        { name: 'Elevation (Copernicus DEM 30m)', val: 37, color: 'bg-emerald-600' },
                        { name: 'Slope Gradient (degrees)', val: 31, color: 'bg-emerald-500' },
                        { name: 'Aspect (Compass Orientation)', val: 23, color: 'bg-teal-500' },
                        { name: 'Land Cover (ESA WorldCover 10m)', val: 9, color: 'bg-blue-500' },
                      ].map((f) => (
                        <div key={f.name}>
                          <div className='flex justify-between text-xs font-semibold text-slate-700'>
                            <span>{f.name}</span>
                            <span className='font-mono font-bold'>{f.val}%</span>
                          </div>
                          <div className='mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden'>
                            <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs'>
                    <div className='grid grid-cols-4 gap-2 text-center'>
                      <div>
                        <p className='text-slate-400 text-[10px] uppercase font-bold'>Accuracy</p>
                        <b className='text-slate-800 text-sm'>75%</b>
                      </div>
                      <div>
                        <p className='text-slate-400 text-[10px] uppercase font-bold'>ROC-AUC</p>
                        <b className='text-emerald-700 text-sm'>0.73</b>
                      </div>
                      <div>
                        <p className='text-slate-400 text-[10px] uppercase font-bold'>5-Fold AUC</p>
                        <b className='text-slate-800 text-sm'>0.66</b>
                      </div>
                      <div>
                        <p className='text-slate-400 text-[10px] uppercase font-bold'>300-Split Median</p>
                        <b className='text-slate-800 text-sm'>0.68</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-slate-100 pb-3'>
                  <div>
                    <h3 className='font-extrabold text-slate-900'>Cleaned NASA GLC Meghalaya Catalog Events (n = 35)</h3>
                    <p className='text-xs text-slate-400'>
                      Filtered historical events with coordinates, rainfall triggers, fatalities, and positional accuracy
                    </p>
                  </div>
                  <span className='rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800'>
                    2007–2017 Dataset
                  </span>
                </div>

                <div className='mt-4 overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead>
                      <tr className='border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]'>
                        <th className='pb-2.5'>ID</th>
                        <th className='pb-2.5'>Date</th>
                        <th className='pb-2.5'>Location & District</th>
                        <th className='pb-2.5'>Landslide Type</th>
                        <th className='pb-2.5'>Trigger</th>
                        <th className='pb-2.5'>Fatalities</th>
                        <th className='pb-2.5'>Accuracy</th>
                        <th className='pb-2.5'>Risk Class</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {nasaGlcEvents.map((evt) => (
                        <tr key={evt.id} className='hover:bg-slate-50'>
                          <td className='py-3 font-mono text-emerald-800 font-bold'>{evt.id}</td>
                          <td className='py-3 font-semibold text-slate-700'>{evt.eventDate}</td>
                          <td className='py-3 font-bold text-slate-800'>{evt.location}</td>
                          <td className='py-3 text-slate-600'>{evt.landslideCategory}</td>
                          <td className='py-3 text-slate-500'>{evt.trigger}</td>
                          <td className='py-3 font-mono font-bold text-rose-600'>{evt.fatalities}</td>
                          <td className='py-3 font-mono text-slate-500'>{evt.accuracy}</td>
                          <td className='py-3'>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityClass(evt.riskClass)}`}>
                              {evt.riskClass}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className='grid gap-6 md:grid-cols-2'>
                <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                    <h3 className='font-extrabold text-slate-900'>Case Study: 17 June 2017 Mawjrong Landslide</h3>
                    <span className='rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700'>
                      East Khasi Hills
                    </span>
                  </div>
                  <div className='mt-4 space-y-3 text-xs'>
                    <p className='text-slate-600 leading-relaxed'>
                      On 17 June 2017, a severe debris flow struck near Mawjrong on the Shillong–Sohra road corridor following extreme monsoon precipitation.
                    </p>
                    <div className='rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-200'>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>Event Day GPM IMERG Rain:</span>
                        <b className='font-mono font-bold text-rose-600'>142.4 mm / day</b>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>3-Day Cumulative Antecedent Rain:</span>
                        <b className='font-mono font-bold text-rose-600'>328.6 mm</b>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>7-Day Cumulative Antecedent Rain:</span>
                        <b className='font-mono font-bold text-rose-600'>586.2 mm</b>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>30-Day Cumulative Antecedent Rain:</span>
                        <b className='font-mono font-bold text-slate-800'>1,420.5 mm</b>
                      </div>
                    </div>
                    <div className='rounded-xl bg-rose-50 p-3 text-rose-800 font-semibold'>
                      ✓ Empirical threshold exceeded → Combined risk classified as <b>RED (Immediate Evacuation)</b>.
                    </div>
                  </div>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                    <div>
                      <h3 className='font-extrabold text-slate-900'>Multilingual Emergency Dissemination Station</h3>
                      <p className='text-xs text-slate-400'>Layer 4 of system architecture for local tribal communities</p>
                    </div>
                    <Volume2 className='h-4 w-4 text-emerald-700' />
                  </div>

                  <div className='mt-4 flex gap-2'>
                    {['khasi', 'garo', 'assamese', 'english'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${
                          selectedLanguage === lang ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <div className='mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs leading-relaxed font-medium text-slate-800'>
                    {selectedLanguage === 'khasi' && (
                      <p>
                        "Ka jingma na ka jingtwad khyndew: Ka lynti Mawjrong–Sohra ka lah ban shah tap ha ka khyndew bad maw na ka daw jong u slap uba jur. Sngewbha kiar na kane ka lynti."
                      </p>
                    )}
                    {selectedLanguage === 'garo' && (
                      <p>
                        "A·giminaniko mikrakatani: Tura–Baghmara rama mikka jimaniko man·ani a·sel a·a be·ani gnang. Rama re·aniko champengbo."
                      </p>
                    )}
                    {selectedLanguage === 'assamese' && (
                      <p>
                        "ভূমিস্খলনৰ সতৰ্কবাৰ্তা: ধাৰাসাৰ বৰষুণৰ ফলত পথ বন্ধ হৈ পৰাৰ সম্ভাৱনা আছে। বিপদসংকুল এলেকা পৰিহাৰ কৰক।"
                      </p>
                    )}
                    {selectedLanguage === 'english' && (
                      <p>
                        "Critical Landslide Warning: Unstable slope displacement and extreme antecedent rainfall detected along monitored corridor. Avoid transit immediately."
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'Live Risk Map' && (
            <div className='space-y-6'>
              <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                <div>
                  <h2 className='text-2xl font-extrabold text-slate-900'>Live Geospatial Hazard Grid</h2>
                  <p className='mt-1 text-xs text-slate-500'>
                    Combined spatial map showing active IoT sensor nodes and NASA Global Landslide Catalog historical points.
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setShowNasaPins((prev) => !prev)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition border ${
                      showNasaPins ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {showNasaPins ? '✓ NASA GLC Points Visible' : '+ Show NASA GLC Points'}
                  </button>
                  <button
                    onClick={() => setShowReport(true)}
                    className='rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800'
                  >
                    + Submit Hazard Pin
                  </button>
                </div>
              </div>

              <div className='grid gap-6 lg:grid-cols-[1fr_360px]'>
                <div className='rounded-2xl border border-slate-200 bg-white p-3 shadow-sm'>
                  <RiskMap
                    zones={filteredZones}
                    selectedZone={selectedZone}
                    setSelectedZone={setSelectedZone}
                    height='h-[620px]'
                    showNasaEvents={showNasaPins}
                    nasaEvents={nasaGlcEvents}
                  />
                </div>

                <div className='space-y-4'>
                  <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                    <div className='flex items-center justify-between'>
                      <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>Corridor Telemetry</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${severityClass(selectedZone?.level || 'High')}`}>
                        {selectedZone?.level || 'Critical'}
                      </span>
                    </div>
                    <h3 className='mt-2 text-lg font-extrabold text-slate-900'>{selectedZone?.name}</h3>
                    <p className='text-xs text-slate-500'>{selectedZone?.district} District · Northeast Sector</p>

                    <div className='mt-4 space-y-2.5 rounded-xl bg-slate-50 p-3.5 text-xs'>
                      <div className='flex justify-between border-b border-slate-200/60 pb-2'>
                        <span className='text-slate-500'>Random Forest Susceptibility:</span>
                        <b className='text-rose-600 font-extrabold'>{selectedZone?.score || selectedZone?.predictedScore}%</b>
                      </div>
                      <div className='flex justify-between border-b border-slate-200/60 pb-2'>
                        <span className='text-slate-500'>Highway Connectivity:</span>
                        <b className='text-slate-800'>{selectedZone?.road}</b>
                      </div>
                      <div className='flex justify-between border-b border-slate-200/60 pb-2'>
                        <span className='text-slate-500'>GPM Antecedent Rainfall:</span>
                        <b className='text-slate-800'>{selectedZone?.rainfall}</b>
                      </div>
                      <div className='flex justify-between border-b border-slate-200/60 pb-2'>
                        <span className='text-slate-500'>DEM Slope Angle:</span>
                        <b className='text-slate-800'>{selectedZone?.slope || '34°'}</b>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>DEM Elevation:</span>
                        <b className='text-slate-800'>{selectedZone?.elevation || '1,450 m'}</b>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowReport(true)}
                      className='mt-4 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800'
                    >
                      Report Field Observation Here
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'Priority Alerts' && (
            <div className='space-y-6'>
              <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                <div>
                  <h2 className='text-2xl font-extrabold text-slate-900'>Priority Emergency Alerts</h2>
                  <p className='mt-1 text-xs text-slate-500'>
                    Early warnings derived from the hybrid Random Forest (Where) and GPM IMERG rainfall threshold (When) models.
                  </p>
                </div>
                <button
                  onClick={loadOverview}
                  className='flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800'
                >
                  <RefreshCw className='h-3.5 w-3.5' /> Refresh
                </button>
              </div>

              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {allAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                      alert.acknowledgedAt ? 'border-slate-200 bg-slate-50/80 opacity-75' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className='flex items-start justify-between'>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${severityClass(alert.type)}`}>
                        {alert.type}
                      </span>
                      {alert.acknowledgedAt ? (
                        <span className='flex items-center gap-1 text-[11px] font-bold text-emerald-700'>
                          <CheckCircle2 className='h-3.5 w-3.5' /> Acknowledged
                        </span>
                      ) : (
                        <span className='flex items-center gap-1 text-[11px] font-bold text-rose-600 animate-pulse'>
                          <ShieldAlert className='h-3.5 w-3.5' /> Active Warning
                        </span>
                      )}
                    </div>

                    <h3 className='mt-3 text-sm font-extrabold text-slate-900'>{alert.title}</h3>
                    <p className='mt-1.5 text-xs text-slate-500 leading-relaxed'>{alert.detail}</p>

                    <div className='mt-4 rounded-xl bg-slate-50 p-2.5 text-xs'>
                      <p className='text-slate-700 font-semibold'>
                        <b>Protocol:</b> {alert.action}
                      </p>
                    </div>

                    <div className='mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs'>
                      <span className='text-[10px] text-slate-400 font-mono'>ID: {alert.id}</span>
                      {!alert.acknowledgedAt && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className='rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800'
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'Field Reports' && (
            <div className='space-y-6'>
              <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                <div>
                  <h2 className='text-2xl font-extrabold text-slate-900'>Field Incident Reports</h2>
                  <p className='mt-1 text-xs text-slate-500'>
                    Crowdsourced and ranger field hazard submissions with geo-coordinates, photos, and verification tracking.
                  </p>
                </div>
                <button
                  onClick={() => setShowReport(true)}
                  className='rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800'
                >
                  + Submit New Hazard
                </button>
              </div>

              <div className='space-y-3'>
                {fieldReports.map((rep) => (
                  <div key={rep.id} className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                    <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityClass(rep.severity)}`}>
                            {rep.severity}
                          </span>
                          <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800'>
                            {rep.status}
                          </span>
                          <span className='text-xs font-bold text-slate-800'>{rep.hazardType}</span>
                        </div>
                        <h4 className='mt-2 text-sm font-extrabold text-slate-900'>
                          {rep.locationName || `${rep.district || 'Meghalaya'} Sector`}
                        </h4>
                        <p className='mt-1 text-xs text-slate-600 leading-relaxed'>{rep.description}</p>
                        <div className='mt-3 flex items-center gap-3 text-[11px] text-slate-400'>
                          <span className='flex items-center gap-1'>
                            <MapPin className='h-3 w-3 text-emerald-700' />
                            {rep.latitude ? `${rep.latitude.toFixed(3)}, ${rep.longitude.toFixed(3)}` : '25.421, 91.734'}
                          </span>
                          <span>· Reported: {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'Connectivity & Roads' && (
            <div className='space-y-6'>
              <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                <div>
                  <h2 className='text-2xl font-extrabold text-slate-900'>Arterial Road Network & Transit Safety</h2>
                  <p className='mt-1 text-xs text-slate-500'>
                    Critical highway corridors connecting Meghalaya, Sikkim, Assam, and Arunachal Pradesh.
                  </p>
                </div>
              </div>

              <div className='grid gap-6 md:grid-cols-2'>
                {[
                  {
                    code: 'NH-6',
                    name: 'Jowai–Silchar Bypass',
                    status: 'Limited',
                    district: 'Meghalaya',
                    cause: 'Single-lane movement operational following rockfall near Milestone 14.',
                    alternate: 'Commercial heavy vehicles restricted until 20:00 IST.',
                    authority: 'Meghalaya PWD Roads',
                    phone: '0364-222384',
                    safetyIndex: '46 / 100',
                  },
                  {
                    code: 'NH-10',
                    name: 'Rangpo–Gangtok Lifeline',
                    status: 'Blocked',
                    district: 'Sikkim',
                    cause: 'Debris flow and active slope displacement near 32nd Mile / Seti Jhora.',
                    alternate: 'Diverted via Lava–Algarah or Damdim–Reshi route.',
                    authority: 'Border Roads Organisation (Swastik Project)',
                    phone: '03592-202244',
                    safetyIndex: '18 / 100',
                  },
                  {
                    code: 'NH-15',
                    name: 'Dima Hasao Corridor',
                    status: 'At risk',
                    district: 'Assam',
                    cause: 'Waterlogged carriageway with soil creep detected by InSAR.',
                    alternate: 'Local diversion through Lumding corridor.',
                    authority: 'Assam State Disaster Management',
                    phone: '0361-2237011',
                    safetyIndex: '54 / 100',
                  },
                  {
                    code: 'NH-13',
                    name: 'Tawang–Sela Pass Route',
                    status: 'Open',
                    district: 'Arunachal Pradesh',
                    cause: 'Clear asphalt with moderate rainfall caution at elevation > 3,800 m.',
                    alternate: 'Direct route operational through Sela Tunnel.',
                    authority: 'BRO Project Vartak',
                    phone: '03778-222014',
                    safetyIndex: '88 / 100',
                  },
                ].map((corridor) => (
                  <div key={corridor.code} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <span className='font-mono text-xs font-bold text-emerald-700'>{corridor.code}</span>
                        <h3 className='text-lg font-extrabold text-slate-900'>{corridor.name}</h3>
                        <p className='text-xs text-slate-400'>{corridor.district}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${
                          corridor.status === 'Blocked'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : corridor.status === 'Limited'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : corridor.status === 'At risk'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {corridor.status}
                      </span>
                    </div>

                    <div className='mt-4 rounded-xl bg-slate-50 p-3 text-xs space-y-2'>
                      <p><b>Blockage Cause:</b> {corridor.cause}</p>
                      <p><b>Detour Bypass:</b> {corridor.alternate}</p>
                      <div className='flex items-center justify-between border-t border-slate-200/60 pt-2 text-slate-500'>
                        <span>Control: {corridor.authority}</span>
                        <span className='flex items-center gap-1 font-bold text-slate-700'>
                          <Phone className='h-3 w-3' /> {corridor.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'AI Risk Predictor' && (
            <div className='space-y-6'>
              <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                <div>
                  <h2 className='text-2xl font-extrabold text-slate-900'>Random Forest & Rainfall Trigger Simulator</h2>
                  <p className='mt-1 text-xs text-slate-500'>
                    Calibrated against Palak Kumari's JECRC University model (ROC-AUC 0.73, 100 trees, balanced weights).
                  </p>
                </div>
                <span className='rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800'>
                  Model Confidence: {(predictionConfidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <h3 className='text-sm font-extrabold text-slate-900'>Dynamic Rainfall-Threshold Simulator</h3>
                <p className='mt-1 text-xs text-slate-500'>
                  Test antecedent rainfall surges against terrain susceptibility to observe risk class reclassification.
                </p>

                <div className='mt-5 grid gap-6 sm:grid-cols-2'>
                  <div className='rounded-xl bg-slate-50 p-4 border border-slate-200'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='font-bold text-slate-700'>Simulated Precipitation (GPM IMERG Daily Accumulation):</span>
                      <span className='font-mono font-extrabold text-emerald-700'>{simulatedRainfall} mm</span>
                    </div>
                    <input
                      type='range'
                      min='10'
                      max='200'
                      value={simulatedRainfall}
                      onChange={(e) => setSimulatedRainfall(Number(e.target.value))}
                      className='mt-3 w-full accent-emerald-700'
                    />
                    <div className='mt-2 flex justify-between text-[10px] text-slate-400'>
                      <span>Light (10 mm)</span>
                      <span>Mawjrong Event (142 mm)</span>
                      <span>Extreme Monsoon (200 mm)</span>
                    </div>
                  </div>

                  <div className='rounded-xl bg-slate-50 p-4 border border-slate-200'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='font-bold text-slate-700'>Ground Soil Saturation:</span>
                      <span className='font-mono font-extrabold text-emerald-700'>{simulatedSaturation}%</span>
                    </div>
                    <input
                      type='range'
                      min='30'
                      max='100'
                      value={simulatedSaturation}
                      onChange={(e) => setSimulatedSaturation(Number(e.target.value))}
                      className='mt-3 w-full accent-emerald-700'
                    />
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <h3 className='text-sm font-extrabold text-slate-900 mb-4'>Corridor Prediction Breakdown</h3>
                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead>
                      <tr className='border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]'>
                        <th className='pb-3'>Monitored Corridor</th>
                        <th className='pb-3'>District</th>
                        <th className='pb-3'>Terrain Susceptibility</th>
                        <th className='pb-3'>Simulated Total Risk</th>
                        <th className='pb-3'>Classification</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {(predictions.length ? predictions : zones).map((zone) => {
                        const baseScore = zone.score || 70;
                        const rainBonus = simulatedRainfall >= 80 ? Math.floor((simulatedRainfall - 80) / 10) + 5 : 0;
                        const satBonus = simulatedSaturation >= 75 ? Math.floor((simulatedSaturation - 75) / 5) + 4 : 0;
                        const simulatedTotal = Math.min(99, baseScore + rainBonus + satBonus);

                        return (
                          <tr key={zone.name} className='hover:bg-slate-50'>
                            <td className='py-3.5 font-bold text-slate-800'>{zone.name}</td>
                            <td className='py-3.5 text-slate-500'>{zone.district}</td>
                            <td className='py-3.5 font-mono text-slate-600'>{baseScore}%</td>
                            <td className='py-3.5'>
                              <span
                                className={`rounded-full px-2 py-0.5 font-mono font-bold text-[11px] ${
                                  simulatedTotal >= 85
                                    ? 'bg-rose-100 text-rose-700'
                                    : simulatedTotal >= 70
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {simulatedTotal}% ({simulatedTotal > baseScore ? `+${simulatedTotal - baseScore}%` : 'Stable'})
                              </span>
                            </td>
                            <td className='py-3.5'>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityClass(
                                  simulatedTotal >= 85 ? 'Red' : simulatedTotal >= 70 ? 'Orange' : 'Yellow'
                                )}`}
                              >
                                {simulatedTotal >= 85 ? 'Red (Evacuate)' : simulatedTotal >= 70 ? 'Orange (High)' : 'Yellow (Watch)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          onSubmit={submitFieldReport}
          defaultDistrict={region}
        />
      )}
      {showAssistant && <Assistant alerts={alerts} zones={filteredZones} onClose={() => setShowAssistant(false)} />}

      {!showAssistant && (
        <div className='assistant-launcher fixed bottom-5 right-5 z-40'>
          <button aria-label='Open Himālya assistant' onClick={() => setShowAssistant(true)} className='assistant-mascot group'>
            <span className='assistant-pulse' />
            <span className='assistant-bubble'>Need help understanding the risk?</span>
            <span className='assistant-character'>
              <span className='assistant-leaf leaf-left' />
              <span className='assistant-leaf leaf-right' />
              <span className='assistant-face'>
                <span className='assistant-eye eye-left' />
                <span className='assistant-eye eye-right' />
                <span className='assistant-smile' />
              </span>
              <span className='assistant-scarf' />
            </span>
            <span className='assistant-label'>
              <MessageCircle className='h-4 w-4' />
              <span>
                <b>Ask Tara</b>
                <small>NASA & NER Guide</small>
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
