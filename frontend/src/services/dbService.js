import { getMode, isOnlineMode } from './modeService';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseService';

const DB_KEY = 'placify-db-v2';
const SUPABASE_STATE_ID = 'global';

const seedData = {
  auth: {
    role: 'guest',
    userId: null,
    name: null,
    email: null,
  },
  students: [],
  companies: [],
  applications: [],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStorage() {
  try {
    return localStorage.getItem(DB_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value) {
  try {
    localStorage.setItem(DB_KEY, value);
  } catch {
    // Keep app functional when storage is unavailable.
  }
}

export function loadDb() {
  const raw = readStorage();
  if (!raw) return clone(seedData);

  try {
    const parsed = JSON.parse(raw);
    return {
      auth: parsed.auth || clone(seedData.auth),
      students: Array.isArray(parsed.students) ? parsed.students : clone(seedData.students),
      companies: Array.isArray(parsed.companies) ? parsed.companies : clone(seedData.companies),
      applications: Array.isArray(parsed.applications) ? parsed.applications : clone(seedData.applications),
      demoStudents: Array.isArray(parsed.demoStudents) ? parsed.demoStudents : [],
    };
  } catch {
    return clone(seedData);
  }
}

export function saveDb(nextState) {
  writeStorage(JSON.stringify(nextState));
  if (isOnlineMode()) {
    void pushStateToSupabase(nextState);
  }
  return clone(nextState);
}

export function resetDb() {
  writeStorage(JSON.stringify(seedData));
  return clone(seedData);
}

export function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDataMode() {
  return getMode();
}

export async function hydrateFromOnline() {
  if (!isOnlineMode() || !isSupabaseConfigured()) return loadDb();
  const supabase = getSupabaseClient();
  if (!supabase) return loadDb();

  try {
    const { data, error } = await supabase
      .from('placeflow_state')
      .select('payload')
      .eq('id', SUPABASE_STATE_ID)
      .single();

    if (error || !data?.payload) {
      return loadDb();
    }

    const next = {
      auth: data.payload.auth || clone(seedData.auth),
      students: Array.isArray(data.payload.students) ? data.payload.students : clone(seedData.students),
      companies: Array.isArray(data.payload.companies) ? data.payload.companies : clone(seedData.companies),
      applications: Array.isArray(data.payload.applications) ? data.payload.applications : clone(seedData.applications),
      demoStudents: Array.isArray(data.payload.demoStudents) ? data.payload.demoStudents : [],
    };

    writeStorage(JSON.stringify(next));
    return clone(next);
  } catch {
    return loadDb();
  }
}

export async function pushStateToSupabase(state) {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('placeflow_state').upsert({
      id: SUPABASE_STATE_ID,
      payload: state,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Keep offline behavior intact if sync fails.
  }
}
