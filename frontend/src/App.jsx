import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  CloudRain,
  CloudLightning,
  Crosshair,
  Droplets,
  FileText,
  Home,
  Layers3,
  LocateFixed,
  Map,
  MessageCircle,
  Menu,
  Mountain,
  Navigation,
  Radio,
  RefreshCw,
  Route,
  ShieldCheck,
  Siren,
  Upload,
  WifiOff,
  X,
  Send,
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const riskZones = [
  { name: 'NH-10 · Rangpo–Gangtok', district: 'Sikkim', level: 'Critical', score: 92, road: 'Blocked', rainfall: '118 mm', coordinates: [27.165, 88.615] },
  { name: 'NH-6 · Jowai bypass', district: 'Meghalaya', level: 'High', score: 78, road: 'At risk', rainfall: '86 mm', coordinates: [25.45, 92.2] },
  { name: 'Dima Hasao · Haflong', district: 'Assam', level: 'High', score: 74, road: 'At risk', rainfall: '72 mm', coordinates: [25.16, 93.02] },
  { name: 'Tawang · Sela Pass', district: 'Arunachal Pradesh', level: 'Moderate', score: 56, road: 'Open', rainfall: '46 mm', coordinates: [27.5, 92.1] },
  { name: 'Mangan · Chungthang', district: 'Sikkim', level: 'Moderate', score: 51, road: 'Open', rainfall: '39 mm', coordinates: [27.6, 88.65] },
];

const initialAlerts = [
  { id: 1, type: 'Critical', title: 'NH-10 blocked near 32nd Mile', detail: 'Debris reported by field unit · 18 min ago', action: 'Deploy response team' },
  { id: 2, type: 'High', title: 'Rainfall threshold crossed in Jowai', detail: '86 mm in the last 6 hours · 42 min ago', action: 'Review evacuation plan' },
  { id: 3, type: 'Watch', title: 'Slope movement detected at Haflong', detail: 'Satellite pass + sensor correlation · 1 hr ago', action: 'Request field verification' },
];

function severityClass(level) {
  return {
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    Watch: 'bg-sky-50 text-sky-700 border-sky-200',
  }[level] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function StatCard({ icon, label, value, note, tone, onClick }) {
  const tones = {
    rose: 'bg-rose-50 text-rose-600',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <button onClick={onClick} className={`w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm ${onClick ? 'cursor-pointer transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg' : ''}`}>
      <div className='flex items-start justify-between'>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{createElement(icon, { className: 'h-5 w-5' })}</div>
        <span className='text-xs font-semibold text-slate-400'>LIVE</span>
      </div>
      <p className='mt-4 text-2xl font-extrabold tracking-tight text-slate-900'>{value}</p>
      <p className='mt-1 text-sm font-medium text-slate-600'>{label}</p>
      <p className='mt-2 text-xs text-slate-400'>{note}</p>
    </button>
  );
}

const nearbyPlaces = [
  { name: 'District Hospital', type: 'Hospital', coordinates: [27.33, 88.61] },
  { name: 'Rangpo Police Station', type: 'Emergency service', coordinates: [27.18, 88.53] },
  { name: 'Gangtok', type: 'Settlement', coordinates: [27.33, 88.61] },
  { name: 'Jowai', type: 'Settlement', coordinates: [25.45, 92.2] },
];

function MapLocationControl({ onLocate }) {
  const map = useMap();
  return <div className='leaflet-custom-controls'><button onClick={() => map.setZoom(map.getZoom() + 1)} aria-label='Zoom in'>+</button><button onClick={() => map.setZoom(map.getZoom() - 1)} aria-label='Zoom out'>−</button><button onClick={() => { map.setView([27.2, 89.1], 7); onLocate(); }} aria-label='Use my location'><LocateFixed className='h-4 w-4' /></button></div>;
}

function RiskMap({ zones, selectedZone, setSelectedZone, onLocate }) {
  const markerIcon = (level) => L.divIcon({ className: 'risk-leaflet-marker', html: `<span class="leaflet-risk-dot ${level.toLowerCase()}"></span>`, iconSize: [28, 28], iconAnchor: [14, 14] });
  return (
    <div className='relative h-[430px] overflow-hidden rounded-2xl border border-slate-200'>
      <MapContainer center={[27.2, 89.1]} zoom={7} minZoom={6} maxZoom={16} className='h-full w-full' scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        <MapLocationControl onLocate={onLocate} />
        {zones.map((zone) => { const position = zone.coordinates || riskZones.find((item) => item.name === zone.name)?.coordinates; return position ? <Marker key={zone.name} position={position} icon={markerIcon(zone.level)} eventHandlers={{ click: () => setSelectedZone(zone) }}><Popup><div className='min-w-44'><p className='text-[10px] font-bold uppercase text-slate-400'>{zone.district}</p><b className='block py-1 text-sm'>{zone.name}</b><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${severityClass(zone.level)}`}>{zone.level} · {zone.score}% risk</span><p className='mt-2 text-xs text-slate-500'>{zone.road} · {zone.rainfall} rainfall</p></div></Popup></Marker> : null; })}
        {nearbyPlaces.map((place) => <Marker key={place.name} position={place.coordinates} opacity={0.72}><Popup><b className='text-sm'>{place.name}</b><p className='text-xs text-slate-500'>{place.type}</p></Popup></Marker>)}
      </MapContainer>
      <div className='absolute left-4 top-4 z-[1000] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm'><div className='flex items-center gap-2'><Map className='h-3.5 w-3.5 text-emerald-700' /> Live OpenStreetMap layer · zoom for nearby places</div></div>
      <div className='absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2 rounded-xl border border-white/80 bg-white/95 p-2 text-[11px] font-semibold shadow-sm'>{['Critical', 'High', 'Moderate'].map((level) => <span key={level} className='flex items-center gap-1.5'><i className={`h-2.5 w-2.5 rounded-full ${level === 'Critical' ? 'bg-rose-500' : level === 'High' ? 'bg-orange-500' : 'bg-amber-400'}`} />{level}</span>)}</div>
      {selectedZone && <div className='absolute bottom-4 right-4 z-[1000] hidden rounded-xl bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm md:block'>Selected: {selectedZone.name}</div>}
    </div>
  );
}

function ReportModal({ onClose, onSubmit }) {
  const [submitted, setSubmitted] = useState(false);
  const submit = () => { setSubmitted(true); onSubmit(); };
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm'>
      <div className='w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl'>
        <div className='flex items-start justify-between'><div><p className='text-xs font-bold uppercase tracking-[.18em] text-indigo-600'>Field report</p><h2 className='mt-1 text-xl font-extrabold text-slate-900'>Report a hazard</h2></div><button onClick={onClose} className='rounded-lg p-2 text-slate-400 hover:bg-slate-100'><X className='h-5 w-5' /></button></div>
        {submitted ? <div className='py-10 text-center'><CheckCircle2 className='mx-auto h-12 w-12 text-emerald-500' /><h3 className='mt-4 font-bold text-slate-900'>Report queued for verification</h3><p className='mt-1 text-sm text-slate-500'>It will sync automatically when connectivity returns.</p><button onClick={onClose} className='mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white'>Done</button></div> : <><div className='mt-6 grid gap-4 sm:grid-cols-2'><label className='sm:col-span-2'><span className='field-label'>Location</span><div className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600'><LocateFixed className='h-4 w-4 text-indigo-600' /> Use my current location</div></label><label><span className='field-label'>Hazard type</span><select className='field-input'><option>Crack / slope movement</option><option>Road blockage</option><option>Flash flood</option><option>Rockfall</option></select></label><label><span className='field-label'>Severity</span><select className='field-input'><option>High</option><option>Critical</option><option>Moderate</option></select></label><label className='sm:col-span-2'><span className='field-label'>Description</span><textarea className='field-input min-h-20' placeholder='What did you observe?' /></label></div><div className='mt-4 flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3'><div className='flex items-center gap-3'><div className='rounded-lg bg-white p-2 text-slate-500 shadow-sm'><Camera className='h-5 w-5' /></div><div><p className='text-sm font-semibold text-slate-700'>Add photo or video</p><p className='text-xs text-slate-400'>Optional · syncs offline</p></div></div><button className='rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600'><Upload className='mr-1 inline h-3.5 w-3.5' />Choose</button></div><button onClick={submit} className='mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'>Submit field report</button></>}</div>
    </div>
  );
}

function Assistant({ alerts, zones, onClose }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi, I’m the Himālya Watch assistant. Ask me about risk levels, alerts, rainfall, roads, or field reports.' }]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const quickQuestions = ['What does critical risk mean?', 'How do I report a slope crack?', 'Which roads need attention?'];

  const sendMessage = async (text = draft) => {
    const message = text.trim();
    if (!message || sending) return;
    setDraft('');
    setMessages((current) => [...current, { role: 'user', text: message }]);
    setSending(true);
    try {
      const response = await fetch(`${API_BASE}/monitoring/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, alerts, zones }) });
      if (!response.ok) throw new Error('Assistant unavailable');
      const payload = await response.json();
      setMessages((current) => [...current, { role: 'assistant', text: payload.answer }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: 'I’m temporarily offline. You can still use the dashboard: red zones are critical, orange zones are high risk, and the Report hazard button queues a field report for sync.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='fixed bottom-24 right-4 z-50 flex h-[min(620px,calc(100vh-8rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-2xl'>
      <div className='flex items-center justify-between bg-[#123524] px-5 py-4 text-white'><div className='flex items-center gap-3'><div className='rounded-xl bg-emerald-400/20 p-2 text-emerald-300'><MessageCircle className='h-5 w-5' /></div><div><p className='text-sm font-extrabold'>Himālya assistant</p><p className='text-[11px] text-emerald-200'>Risk guidance · available offline</p></div></div><button aria-label='Close assistant' onClick={onClose} className='rounded-lg p-1.5 text-emerald-100 hover:bg-white/10'><X className='h-4 w-4' /></button></div>
      <div className='flex-1 space-y-3 overflow-y-auto bg-[#f4f8f4] p-4'>{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-[#166534] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>{message.text}</div></div>)}{sending && <div className='w-fit rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-400'>Thinking…</div>}</div>
      <div className='border-t border-slate-200 bg-white p-3'><div className='mb-2 flex gap-2 overflow-x-auto'>{quickQuestions.map((question) => <button key={question} onClick={() => sendMessage(question)} className='shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-800'>{question}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className='flex items-center gap-2'><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder='Ask about the risk dashboard…' className='min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-emerald-500' /><button aria-label='Send message' disabled={!draft.trim() || sending} className='rounded-xl bg-[#166534] p-2.5 text-white disabled:opacity-40'><Send className='h-4 w-4' /></button></form></div>
    </div>
  );
}

function TaraHint({ message, action, onAction, compact = false }) {
  return (
    <div className={`tara-hint ${compact ? 'tara-hint-compact' : ''}`}>
      <div className='tara-mini'><span className='tara-mini-leaf' /><span className='tara-mini-face'><i /><i /><b /></span></div>
      <div className='min-w-0 flex-1'><p>{message}</p>{action && <button onClick={onAction}>{action} <span aria-hidden='true'>→</span></button>}</div>
    </div>
  );
}

function RouteDetails({ onClose }) {
  const routes = [
    { name: 'NH-10 · Sikkim', status: 'Blocked', tone: 'text-rose-600 bg-rose-50', detail: 'Debris and slope movement near 32nd Mile.', action: 'Avoid corridor · response team assigned' },
    { name: 'NH-6 · Meghalaya', status: 'Limited', tone: 'text-amber-700 bg-amber-50', detail: 'Single-lane movement near Jowai bypass.', action: 'Travel only with district clearance' },
    { name: 'Tawang route', status: 'Open', tone: 'text-emerald-700 bg-emerald-50', detail: 'No active obstruction reported on the monitored route.', action: 'Continue monitoring rainfall alerts' },
  ];
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm'>
      <div className='w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl'>
        <div className='flex items-start justify-between'>
          <div><button onClick={onClose} className='mb-3 flex items-center gap-1 text-xs font-bold text-emerald-700'><ArrowLeft className='h-3.5 w-3.5' /> Back to overview</button><p className='text-xs font-bold uppercase tracking-[.18em] text-emerald-700'>Route intelligence</p><h2 className='mt-1 text-2xl font-bold text-slate-900'>Connectivity details</h2><p className='mt-1 text-sm text-slate-500'>Latest corridor status for response planning.</p></div>
          <button aria-label='Close route details' onClick={onClose} className='rounded-lg p-2 text-slate-400 hover:bg-slate-100'><X className='h-5 w-5' /></button>
        </div>
        <div className='mt-6 space-y-3'>{routes.map((route) => <div key={route.name} className='rounded-2xl border border-slate-200 p-4'><div className='flex items-center justify-between gap-3'><h3 className='text-sm font-bold text-slate-800'>{route.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${route.tone}`}>{route.status}</span></div><p className='mt-2 text-xs text-slate-500'>{route.detail}</p><p className='mt-2 text-xs font-semibold text-slate-700'>{route.action}</p></div>)}</div>
        <button onClick={onClose} className='mt-6 w-full rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white hover:bg-[#14532d]'>Done</button>
      </div>
    </div>
  );
}

function CriticalZonesModal({ zones, onClose, onSelect }) {
  const criticalZones = zones.filter((zone) => zone.level === 'Critical' || zone.level === 'High');
  const images = [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1500534623283-312aede485b7?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80',
  ];
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-7'>
        <div className='flex items-start justify-between'><div><button onClick={onClose} className='mb-3 flex items-center gap-1 text-xs font-bold text-emerald-700'><ArrowLeft className='h-3.5 w-3.5' /> Back to overview</button><p className='text-xs font-bold uppercase tracking-[.18em] text-rose-600'>Immediate attention</p><h2 className='mt-1 text-2xl font-bold text-slate-900'>Critical risk zones</h2><p className='mt-1 text-sm text-slate-500'>Recent terrain imagery and current conditions for high-priority corridors.</p></div><button aria-label='Close critical zones' onClick={onClose} className='rounded-lg p-2 text-slate-400 hover:bg-slate-100'><X className='h-5 w-5' /></button></div>
        <div className='mt-6 grid gap-4 md:grid-cols-2'>{criticalZones.map((zone, index) => <article key={zone.name} className='overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'><img src={images[index % images.length]} alt={`Recent terrain view near ${zone.name}`} className='h-40 w-full object-cover' /><div className='p-4'><div className='flex items-start justify-between gap-3'><div><p className='text-[11px] font-bold uppercase tracking-wide text-slate-400'>{zone.district}</p><h3 className='mt-1 text-sm font-extrabold text-slate-900'>{zone.name}</h3></div><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${severityClass(zone.level)}`}>{zone.level}</span></div><div className='mt-4 grid grid-cols-3 gap-2 text-xs'><div><p className='text-slate-400'>Risk score</p><b className='text-rose-600'>{zone.score}%</b></div><div><p className='text-slate-400'>Rainfall</p><b className='text-slate-700'>{zone.rainfall}</b></div><div><p className='text-slate-400'>Road</p><b className='text-slate-700'>{zone.road}</b></div></div><button onClick={() => { onSelect(zone); onClose(); }} className='mt-4 w-full rounded-xl bg-[#166534] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#14532d]'>View on live map</button></div></article>)}</div>
        <p className='mt-5 text-[11px] text-slate-400'>Imagery is representative until a connected satellite or field-photo feed is configured.</p>
      </div>
    </div>
  );
}

function RainfallAlertsModal({ onClose }) {
  const rainfallAlerts = [
    { district: 'Sikkim', rainfall: '118 mm', window: 'Last 6 hours', level: 'Critical', forecast: 'Heavy rain likely through 7 PM', image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80' },
    { district: 'Meghalaya', rainfall: '86 mm', window: 'Last 6 hours', level: 'High', forecast: 'Intense showers expected after 5 PM', image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=900&q=80' },
    { district: 'Assam', rainfall: '72 mm', window: 'Last 6 hours', level: 'High', forecast: 'Scattered rainfall overnight', image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=900&q=80' },
    { district: 'Arunachal Pradesh', rainfall: '46 mm', window: 'Last 6 hours', level: 'Moderate', forecast: 'Rain easing after 8 PM', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' },
  ];
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-7'>
        <div className='flex items-start justify-between'><div><button onClick={onClose} className='mb-3 flex items-center gap-1 text-xs font-bold text-emerald-700'><ArrowLeft className='h-3.5 w-3.5' /> Back to overview</button><p className='text-xs font-bold uppercase tracking-[.18em] text-orange-600'>Weather intelligence</p><h2 className='mt-1 text-2xl font-bold text-slate-900'>Rainfall-linked alerts</h2><p className='mt-1 text-sm text-slate-500'>Districts where rainfall is increasing landslide and road-blockage risk.</p></div><button aria-label='Close rainfall alerts' onClick={onClose} className='rounded-lg p-2 text-slate-400 hover:bg-slate-100'><X className='h-5 w-5' /></button></div>
        <div className='mt-6 grid gap-4 sm:grid-cols-2'>{rainfallAlerts.map((alert) => <article key={alert.district} className='overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'><img src={alert.image} alt={`Rainfall conditions in ${alert.district}`} className='h-32 w-full object-cover' /><div className='p-4'><div className='flex items-center justify-between'><h3 className='text-sm font-extrabold text-slate-900'>{alert.district}</h3><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${severityClass(alert.level)}`}>{alert.level}</span></div><div className='mt-3 flex items-end justify-between'><div><p className='text-2xl font-extrabold text-orange-600'>{alert.rainfall}</p><p className='text-[11px] text-slate-400'>{alert.window}</p></div><CloudRain className='h-7 w-7 text-orange-400' /></div><p className='mt-3 text-xs font-semibold text-slate-700'>{alert.forecast}</p></div></article>)}</div>
        <p className='mt-5 text-[11px] text-slate-400'>Rainfall readings are currently seeded demo values until IMD weather API integration is configured.</p>
      </div>
    </div>
  );
}

function RoadsWatchModal({ onClose }) {
  const roads = [
    { name: 'NH-10 · Rangpo–Gangtok', district: 'Sikkim', status: 'Blocked', cause: 'Debris and active slope movement', action: 'Avoid route · response team deployed', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80' },
    { name: 'NH-6 · Jowai bypass', district: 'Meghalaya', status: 'Limited', cause: 'Single-lane traffic after rockfall', action: 'Travel only with clearance', image: 'https://images.unsplash.com/photo-1500534623283-312aede485b7?auto=format&fit=crop&w=900&q=80' },
    { name: 'NH-15 · Dima Hasao', district: 'Assam', status: 'Blocked', cause: 'Waterlogged carriageway', action: 'Use district diversion route', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80' },
    { name: 'Tawang–Sela route', district: 'Arunachal Pradesh', status: 'Open', cause: 'No active obstruction detected', action: 'Open with rainfall caution', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80' },
  ];
  const statusStyle = { Blocked: 'text-rose-700 bg-rose-50', Limited: 'text-amber-700 bg-amber-50', Open: 'text-emerald-700 bg-emerald-50' };
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-7'>
        <div className='flex items-start justify-between'><div><button onClick={onClose} className='mb-3 flex items-center gap-1 text-xs font-bold text-emerald-700'><ArrowLeft className='h-3.5 w-3.5' /> Back to overview</button><p className='text-xs font-bold uppercase tracking-[.18em] text-emerald-700'>Transport operations</p><h2 className='mt-1 text-2xl font-bold text-slate-900'>Roads under watch</h2><p className='mt-1 text-sm text-slate-500'>Current route conditions and safe travel guidance.</p></div><button aria-label='Close roads under watch' onClick={onClose} className='rounded-lg p-2 text-slate-400 hover:bg-slate-100'><X className='h-5 w-5' /></button></div>
        <div className='mt-6 grid gap-4 sm:grid-cols-2'>{roads.map((road) => <article key={road.name} className='overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'><img src={road.image} alt={`Road conditions near ${road.name}`} className='h-32 w-full object-cover' /><div className='p-4'><div className='flex items-start justify-between gap-3'><div><p className='text-[11px] font-bold uppercase tracking-wide text-slate-400'>{road.district}</p><h3 className='mt-1 text-sm font-extrabold text-slate-900'>{road.name}</h3></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[road.status]}`}>{road.status}</span></div><p className='mt-3 text-xs text-slate-600'><b>Condition:</b> {road.cause}</p><p className='mt-2 text-xs font-bold text-slate-800'>{road.action}</p></div></article>)}</div>
        <p className='mt-5 text-[11px] text-slate-400'>Route statuses are currently seeded demo values until road authority feeds and field reports are connected.</p>
      </div>
    </div>
  );
}

function VillageCoverageModal({ onClose }) {
  const districts = [
    { name: 'Sikkim', villages: '326', coverage: '96%', status: 'Strong coverage', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80' },
    { name: 'Meghalaya', villages: '284', coverage: '91%', status: 'Strong coverage', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80' },
    { name: 'Assam', villages: '372', coverage: '89%', status: '3 sensor gaps', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80' },
    { name: 'Arunachal Pradesh', villages: '266', coverage: '87%', status: '8 sensor gaps', image: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=900&q=80' },
  ];
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-7'>
        <div className='flex items-start justify-between'><div><button onClick={onClose} className='mb-3 flex items-center gap-1 text-xs font-bold text-emerald-700'><ArrowLeft className='h-3.5 w-3.5' /> Back to overview</button><p className='text-xs font-bold uppercase tracking-[.18em] text-emerald-700'>Community protection</p><h2 className='mt-1 text-2xl font-bold text-slate-900'>Villages covered</h2><p className='mt-1 text-sm text-slate-500'>Sensor reach and preparedness visibility across monitored districts.</p></div><button aria-label='Close village coverage' onClick={onClose} className='rounded-lg p-2 text-slate-400 hover:bg-slate-100'><X className='h-5 w-5' /></button></div>
        <div className='mt-6 grid gap-4 sm:grid-cols-2'>{districts.map((district) => <article key={district.name} className='overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'><img src={district.image} alt={`Village landscape in ${district.name}`} className='h-32 w-full object-cover' /><div className='p-4'><div className='flex items-center justify-between'><h3 className='text-sm font-extrabold text-slate-900'>{district.name}</h3><span className='rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700'>{district.coverage}</span></div><div className='mt-4 flex items-end justify-between'><div><p className='text-2xl font-extrabold text-slate-800'>{district.villages}</p><p className='text-[11px] text-slate-400'>villages monitored</p></div><ShieldCheck className='h-7 w-7 text-emerald-600' /></div><p className='mt-3 text-xs font-semibold text-slate-700'>{district.status}</p></div></article>)}</div>
        <div className='mt-5 rounded-2xl bg-emerald-50 p-4'><p className='text-xs font-bold text-emerald-900'>Preparedness coverage</p><div className='mt-3 h-2 overflow-hidden rounded-full bg-emerald-200'><div className='h-full w-[92%] rounded-full bg-emerald-600' /></div><p className='mt-2 text-[11px] text-emerald-800'>92% of monitored villages have a live sensor or recent field verification.</p></div>
      </div>
    </div>
  );
}

export default function App() {
  const [region, setRegion] = useState('All districts');
  const [activeNav, setActiveNav] = useState('Overview');
  const [selectedZone, setSelectedZone] = useState(riskZones[0]);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showReport, setShowReport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [showCriticalZones, setShowCriticalZones] = useState(false);
  const [showRainfallAlerts, setShowRainfallAlerts] = useState(false);
  const [showRoadsWatch, setShowRoadsWatch] = useState(false);
  const [showVillageCoverage, setShowVillageCoverage] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingSync, setPendingSync] = useState(() => readSyncQueue().length);
  const [taraTip, setTaraTip] = useState(0);
  const taraTips = ['I’m Tara. I’ll help you read the risk signals.', 'Tap any colored marker to inspect a corridor.', 'Use the report button when you see cracks or debris.'];
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [zones, setZones] = useState(riskZones);
  const [loadingData, setLoadingData] = useState(false);
  const filteredZones = useMemo(() => region === 'All districts' ? zones : zones.filter((zone) => zone.district === region), [region, zones]);

  const loadOverview = useCallback(() => {
    const query = region === 'All districts' ? '' : `?district=${encodeURIComponent(region)}`;
    fetch(`${API_BASE}/monitoring/overview${query}`)
      .then((response) => {
        if (!response.ok) throw new Error('Monitoring API unavailable');
        return response.json();
      })
      .then((payload) => {
        if (Array.isArray(payload.zones) && payload.zones.length) {
          setZones(payload.zones.map((zone) => ({ ...zone, x: zone.x || zone.mapPosition?.x, y: zone.y || zone.mapPosition?.y })));
        }
        if (Array.isArray(payload.alerts)) setAlerts(payload.alerts.map((alert) => ({ ...alert, id: alert.id || alert._id })));
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [region]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = readSyncQueue();
    if (!queue.length) {
      setPendingSync(0);
      return;
    }
    const remaining = [];
    for (const item of queue) {
      try {
        const response = await fetch(`${API_BASE}${item.path}`, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });
        if (!response.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    writeSyncQueue(remaining);
    setPendingSync(remaining.length);
  }, []);

  useEffect(() => {
    const online = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    const initialSync = window.setTimeout(() => syncOfflineQueue(), 0);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [syncOfflineQueue]);

  const queueSyncItem = (item) => {
    const queue = [...readSyncQueue(), { ...item, queuedAt: new Date().toISOString() }];
    writeSyncQueue(queue);
    setPendingSync(queue.length);
    if (navigator.onLine) syncOfflineQueue();
  };

  const acknowledge = (id) => {
    queueSyncItem({ path: `/monitoring/alerts/${id}/acknowledge`, method: 'PATCH' });
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  };

  const submitReport = () => {
    queueSyncItem({
      path: '/monitoring/field-reports',
      method: 'POST',
      body: { hazardType: 'Crack / slope movement', severity: 'High', description: 'Submitted from the Himālya Watch field report form.' },
    });
  };
  const navigateTo = (label) => {
    setActiveNav(label);
    const target = label === 'Risk map' ? 'risk-map' : label === 'Alerts' ? 'alerts' : label === 'Connectivity' ? 'connectivity' : null;
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (label === 'Field reports') setShowReport(true);
  };
  const useLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(() => setActiveNav('Risk map'), () => setActiveNav('Risk map'));
  };
  const navItems = [{ label: 'Overview', icon: Home }, { label: 'Risk map', icon: Map }, { label: 'Alerts', icon: Bell, count: alerts.length }, { label: 'Field reports', icon: FileText }, { label: 'Connectivity', icon: Route }];

  return (
    <div className='forest-app min-h-screen bg-[#f2f7f3] text-slate-900'>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${showMobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className='flex h-20 items-center gap-3 border-b border-slate-100 px-6'><div className='brand-mark'><Mountain className='h-5 w-5' /></div><div><p className='text-sm font-extrabold tracking-tight'>Himālya Watch</p><p className='text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400'>NER Resilience Grid</p></div></div>
        <nav className='space-y-1 p-4'>{navItems.map(({ label, icon, count }) => <button key={label} onClick={() => { navigateTo(label); setShowMobileNav(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition ${activeNav === label ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><span className='flex items-center gap-3'>{createElement(icon, { className: 'h-4 w-4' })}{label}</span>{count ? <span className='rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700'>{count}</span> : null}</button>)}</nav>
        <div className='absolute bottom-5 left-4 right-4 rounded-2xl bg-slate-900 p-4 text-white'><div className='flex items-center gap-2 text-xs font-bold'><span className='h-2 w-2 rounded-full bg-emerald-400' /> System operational</div><p className='mt-2 text-[11px] leading-relaxed text-slate-400'>Last sync 2 minutes ago<br />12 sensors reporting</p></div>
      </aside>
      {showMobileNav && <button aria-label='Close navigation' className='fixed inset-0 z-30 bg-slate-950/20 lg:hidden' onClick={() => setShowMobileNav(false)} />}
      <main className='lg:pl-64'>
        <header className='sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8'>
          <div className='flex items-center gap-3'><button onClick={() => setShowMobileNav(true)} className='rounded-lg p-2 text-slate-600 lg:hidden'><Menu className='h-5 w-5' /></button><div><p className='text-xs font-semibold text-slate-400'>Sunday, 06 September 2026</p><h1 className='text-lg font-extrabold tracking-tight text-slate-900 md:text-xl'>{activeNav === 'Overview' ? 'Regional risk overview' : activeNav}</h1></div></div>
          <div className='relative flex items-center gap-2 md:gap-4'><div className='hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 sm:flex'><Radio className='h-3.5 w-3.5' /> Live monitoring</div><button aria-label='Open notifications' onClick={() => setShowNotifications((open) => !open)} className={`relative rounded-xl border p-2.5 transition ${showNotifications ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600'}`}><Bell className='h-4 w-4' />{alerts.length > 0 && <span className='absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[9px] font-bold text-white'>{alerts.length}</span>}</button>{showNotifications && <div className='absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl'><div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'><div><p className='text-sm font-extrabold text-slate-900'>Notifications</p><p className='text-[11px] text-slate-400'>{alerts.length ? `${alerts.length} alerts need attention` : 'You are all caught up'}</p></div><button onClick={() => { setShowNotifications(false); navigateTo('Alerts'); }} className='text-xs font-bold text-indigo-600'>View all</button></div><div className='max-h-80 overflow-y-auto'>{alerts.length === 0 ? <div className='px-4 py-8 text-center'><CheckCircle2 className='mx-auto h-8 w-8 text-emerald-500' /><p className='mt-2 text-xs font-semibold text-slate-600'>No active notifications</p></div> : alerts.map((alert) => <div key={alert.id} className='border-b border-slate-100 px-4 py-3 last:border-0'><div className='flex items-start gap-2'><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${alert.type === 'Critical' ? 'bg-rose-500' : alert.type === 'High' ? 'bg-orange-500' : 'bg-sky-500'}`} /><div className='min-w-0 flex-1'><p className='text-xs font-bold leading-snug text-slate-800'>{alert.title}</p><p className='mt-1 text-[11px] text-slate-400'>{alert.detail}</p><button onClick={() => acknowledge(alert.id)} className='mt-2 text-[11px] font-bold text-indigo-600'>Acknowledge</button></div></div></div>)}</div></div>}<div className='hidden h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700 sm:flex'>DM</div></div>
        </header>
        <div className='mx-auto max-w-[1600px] p-4 md:p-8'>
          <section className='mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end'><div><div className='flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-indigo-600'><Activity className='h-4 w-4' /> Early warning command center</div><h2 className='mt-2 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-5xl'>Stay ahead of the <span className='editorial-accent'>slope.</span></h2><p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-500'>Real-time intelligence for safer roads, villages, and faster emergency response across the North Eastern Region.</p></div><div className='flex items-center gap-2'><select value={region} onChange={(event) => setRegion(event.target.value)} className='rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none'><option>{regions[0]}</option>{regions.slice(1).map((item) => <option key={item}>{item}</option>)}</select><button onClick={() => setShowReport(true)} className='flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'><Camera className='h-4 w-4' /><span className='hidden sm:inline'>Report hazard</span><span className='sm:hidden'>Report</span></button></div></section>
          <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'><StatCard icon={AlertTriangle} label='Critical risk zones' value={region === 'All districts' ? '02' : String(filteredZones.filter((z) => z.level === 'Critical' || z.level === 'High').length).padStart(2, '0')} note='Click to inspect zones and imagery' tone='rose' onClick={() => setShowCriticalZones(true)} /><StatCard icon={CloudRain} label='Rainfall-linked alerts' value='07' note='Click to inspect district rainfall' tone='orange' onClick={() => setShowRainfallAlerts(true)} /><StatCard icon={Route} label='Roads under watch' value='18' note='Click to inspect route conditions' tone='indigo' onClick={() => setShowRoadsWatch(true)} /><StatCard icon={ShieldCheck} label='Villages covered' value='1,248' note='Click to inspect community coverage' tone='emerald' onClick={() => setShowVillageCoverage(true)} /></div>
            <div className='mb-3 flex justify-end'><TaraHint compact message={taraTips[taraTip]} action='Tell me more' onAction={() => setTaraTip((tip) => (tip + 1) % taraTips.length)} /></div>
            <div className='grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.85fr)]'>
              <section id='risk-map' className='scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5'><div className='mb-4 flex items-center justify-between'><div><h3 className='font-extrabold text-slate-900'>Live risk map</h3><p className='mt-1 text-xs text-slate-400'>{filteredZones.length} monitored zones in current view</p></div><button onClick={() => { setLoadingData(true); loadOverview(); }} disabled={loadingData} className='flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50'><RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} /> {loadingData ? 'Loading' : 'Refresh'}</button></div><RiskMap zones={filteredZones} selectedZone={selectedZone} setSelectedZone={setSelectedZone} onLocate={useLocation} /><TaraHint compact message='Zoom in to see real roads, settlements, and response points near each risk marker.' action='Open route guide' onAction={() => setShowRouteDetails(true)} /></section>
              <section id='alerts' className='scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5'><div className='mb-4 flex items-center justify-between'><div><h3 className='font-extrabold text-slate-900'>Priority alerts</h3><p className='mt-1 text-xs text-slate-400'>Action queue for district teams</p></div><span className='rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600'>{alerts.length} open</span></div><TaraHint compact message={alerts.length ? 'Start with the red alert, then acknowledge it after your team reviews the location.' : 'Excellent — your alert queue is clear.'} /> <div className='space-y-3'>{alerts.length === 0 ? <div className='py-12 text-center'><CheckCircle2 className='mx-auto h-9 w-9 text-emerald-500' /><p className='mt-3 text-sm font-bold text-slate-700'>All alerts acknowledged</p></div> : alerts.map((alert) => <div key={alert.id} className='rounded-xl border border-slate-100 bg-slate-50/70 p-3'><div className='flex items-start gap-3'><div className={`mt-0.5 rounded-lg p-2 ${alert.type === 'Critical' ? 'bg-rose-100 text-rose-600' : alert.type === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'}`}>{alert.type === 'Critical' ? <Siren className='h-4 w-4' /> : <AlertTriangle className='h-4 w-4' />}</div><div className='min-w-0 flex-1'><div className='flex items-center justify-between gap-2'><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityClass(alert.type)}`}>{alert.type}</span><button onClick={() => acknowledge(alert.id)} className='text-slate-300 hover:text-slate-600'><X className='h-3.5 w-3.5' /></button></div><p className='mt-2 text-xs font-bold leading-snug text-slate-800'>{alert.title}</p><p className='mt-1 text-[11px] leading-relaxed text-slate-400'>{alert.detail}</p><button onClick={() => acknowledge(alert.id)} className='mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800'>{alert.action} <span aria-hidden='true'>→</span></button></div></div></div>)}</div></section>
          </div>
          <div className='mt-6 grid gap-6 lg:grid-cols-3'><section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2'><div className='flex items-center justify-between'><div><h3 className='font-extrabold text-slate-900'>Risk drivers · next 24 hours</h3><p className='mt-1 text-xs text-slate-400'>Model confidence from weather, terrain, and sensors</p></div><span className='flex items-center gap-1.5 text-xs font-bold text-emerald-600'><CloudLightning className='h-4 w-4' /> Forecast updated</span></div><div className='mt-6 grid gap-4 sm:grid-cols-3'><div className='rounded-xl bg-orange-50 p-4'><div className='flex items-center justify-between text-orange-600'><Droplets className='h-5 w-5' /><span className='text-xs font-bold'>+32%</span></div><p className='mt-5 text-sm font-bold text-slate-800'>Heavy rainfall</p><p className='mt-1 text-xs text-slate-500'>Peak intensity 4–7 PM</p></div><div className='rounded-xl bg-indigo-50 p-4'><div className='flex items-center justify-between text-indigo-600'><Mountain className='h-5 w-5' /><span className='text-xs font-bold'>+24%</span></div><p className='mt-5 text-sm font-bold text-slate-800'>Steep terrain</p><p className='mt-1 text-xs text-slate-500'>7 high-exposure corridors</p></div><div className='rounded-xl bg-rose-50 p-4'><div className='flex items-center justify-between text-rose-600'><Activity className='h-5 w-5' /><span className='text-xs font-bold'>+18%</span></div><p className='mt-5 text-sm font-bold text-slate-800'>Soil saturation</p><p className='mt-1 text-xs text-slate-500'>3 sensors above threshold</p></div></div></section><section id='connectivity' className='scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm'><div className='flex items-center justify-between'><h3 className='font-extrabold'>Connectivity status</h3><WifiOff className='h-5 w-5 text-slate-400' /></div><p className='mt-2 text-xs leading-relaxed text-slate-400'>Network availability across monitored corridors.</p><div className='mt-6 space-y-4'>{[['NH-10 · Sikkim', 'Blocked', 'bg-rose-500', 'text-rose-300'], ['NH-6 · Meghalaya', 'Limited', 'bg-amber-400', 'text-amber-300'], ['Tawang route', 'Open', 'bg-emerald-400', 'text-emerald-300']].map(([name, status, dot, color]) => <div key={name} className='flex items-center justify-between border-b border-slate-800 pb-3'><span className='text-xs font-semibold text-slate-300'>{name}</span><span className={`flex items-center gap-1.5 text-xs font-bold ${color}`}><i className={`h-2 w-2 rounded-full ${dot}`} />{status}</span></div>)}</div><button onClick={() => setShowRouteDetails(true)} className='mt-5 flex items-center gap-1 text-xs font-bold text-indigo-300'>View route details <Navigation className='h-3 w-3' /></button></section></div>
          <section className='mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 p-5 sm:flex-row sm:items-center'><div className='flex items-center gap-3'><div className='rounded-xl bg-white p-3 text-indigo-600 shadow-sm'><Radio className='h-5 w-5' /></div><div><p className='text-sm font-extrabold text-slate-800'>{isOnline ? 'Connected and syncing' : 'Working in low-network mode'}</p><p className='mt-1 text-xs text-slate-500'>{pendingSync ? `${pendingSync} item${pendingSync === 1 ? '' : 's'} queued for automatic sync.` : 'Reports and alert actions will sync automatically when a connection is available.'}</p></div></div><span className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold shadow-sm ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600'}`}>{isOnline ? <CheckCircle2 className='h-3.5 w-3.5' /> : <WifiOff className='h-3.5 w-3.5' />} {isOnline ? (pendingSync ? 'Syncing queue' : 'Online sync active') : 'Offline queue active'}</span></section>
        </div>
      </main>
      {showReport && <ReportModal onClose={() => setShowReport(false)} onSubmit={submitReport} />}
      {showAssistant && <Assistant alerts={alerts} zones={filteredZones} onClose={() => setShowAssistant(false)} />}
      {showRouteDetails && <RouteDetails onClose={() => setShowRouteDetails(false)} />}
      {showCriticalZones && <CriticalZonesModal zones={filteredZones} onClose={() => setShowCriticalZones(false)} onSelect={(zone) => { setSelectedZone(zone); document.getElementById('risk-map')?.scrollIntoView({ behavior: 'smooth' }); }} />}
      {showRainfallAlerts && <RainfallAlertsModal onClose={() => setShowRainfallAlerts(false)} />}
      {showRoadsWatch && <RoadsWatchModal onClose={() => setShowRoadsWatch(false)} />}
      {showVillageCoverage && <VillageCoverageModal onClose={() => setShowVillageCoverage(false)} />}
      {!showAssistant && <div className='assistant-launcher fixed bottom-5 right-5 z-40'>
        <button aria-label='Open Himālya assistant' onClick={() => setShowAssistant(true)} className='assistant-mascot group'>
          <span className='assistant-pulse' />
          <span className='assistant-bubble'>Need help understanding the risk?</span>
          <span className='assistant-character'><span className='assistant-leaf leaf-left' /><span className='assistant-leaf leaf-right' /><span className='assistant-face'><span className='assistant-eye eye-left' /><span className='assistant-eye eye-right' /><span className='assistant-smile' /></span><span className='assistant-scarf' /></span>
          <span className='assistant-label'><MessageCircle className='h-4 w-4' /><span><b>Ask Tara</b><small>NER risk guide</small></span></span>
        </button>
      </div>}
    </div>
  );
}
