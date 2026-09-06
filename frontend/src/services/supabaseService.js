import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;

export function getSupabaseClient() {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true },
    });
  }
  return client;
}

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

/**
 * Sign up a new student
 * @param {string} email - Student email
 * @param {string} password - Student password
 * @param {object} profileData - Additional profile data (name, phone, cgpa, interests, activeBacklogs)
 */
export async function signUpStudent(email, password, profileData) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: 'Supabase not configured' };

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { ok: false, error: authError.message };
    }

    if (!authData.user) {
      return { ok: false, error: 'Failed to create user account' };
    }

    // Step 2: Store additional profile data
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        email,
        name: profileData.name || '',
        role: 'student',
        phone: profileData.phone || '',
        cgpa: profileData.cgpa || 0,
        interests: profileData.interests || [],
        activeBacklogs: profileData.activeBacklogs || 0,
        created_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      // Auth user was created but profile insert failed
      return { ok: false, error: `Profile save failed: ${profileError.message}` };
    }

    return {
      ok: true,
      user: authData.user,
      profile: {
        id: authData.user.id,
        email,
        ...profileData,
        role: 'student',
      },
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 */
export async function signInWithEmail(email, password) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: 'Supabase not configured' };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    if (!data.user) {
      return { ok: false, error: 'Login failed' };
    }

    // Fetch user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is okay for first login
      return { ok: false, error: `Failed to fetch profile: ${profileError.message}` };
    }

    return {
      ok: true,
      user: data.user,
      profile: profileData || { id: data.user.id, email: data.user.email, role: 'admin' },
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: 'Supabase not configured' };

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}
