export function isSupabaseConfigured() {
  return false;
}

export function getSupabaseClient() {
  return null;
}

export async function signInWithEmail(email, password) {
  void email;
  void password;
  return { ok: false, error: 'Supabase is disabled in offline engine mode.' };
}

export async function signUpStudent(email, password, profileData = {}) {
  void email;
  void password;
  void profileData;
  return { ok: false, error: 'Supabase is disabled in offline engine mode.' };
}

export async function signOut() {
  return { ok: true };
}
