import { loadDb, saveDb } from './dbService';
import { signUpStudent, signInWithEmail, signOut as supabaseSignOut, isSupabaseConfigured } from './supabaseService';

// Demo credentials for login
const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@placify.edu',
    password: 'admin123',
  },
  student: {
    email: 'student@placify.edu',
    password: 'student123',
  },
};

export function getSession() {
  return loadDb().auth;
}

export function isAuthenticated() {
  const auth = getSession();
  return auth && auth.role !== 'guest';
}

/**
 * Login function - supports both Supabase and demo mode
 * @param {string} role - 'admin' or 'student'
 * @param {string} email - User email
 * @param {string} password - User password
 */
export async function login(role, email, password) {
  const db = loadDb();

  // If Supabase is configured, try it for students first
  if (isSupabaseConfigured() && role === 'student') {
    const result = await signInWithEmail(email, password);
    if (result.ok) {
      const nextAuth = {
        role: result.profile?.role || 'student',
        userId: result.user.id,
        name: result.profile?.name || result.user.email,
        email: result.user.email,
        phone: result.profile?.phone || '',
        cgpa: result.profile?.cgpa || 0,
        interests: result.profile?.interests || [],
        activeBacklogs: result.profile?.activeBacklogs || 0,
        supabaseUser: true,
      };
      const saveResult = saveDb({ ...db, auth: nextAuth });
      return { ok: true, auth: saveResult.auth };
    }
    // If Supabase auth fails, fall through to demo mode
  }

  // Demo mode: Check demo students first (created during signup)
  if (role === 'student') {
    const demoStudents = db.demoStudents || [];
    const demoStudent = demoStudents.find(s => s.email === email && s.password === password);
    
    if (demoStudent) {
      const nextAuth = {
        role: 'student',
        userId: demoStudent.userId,
        name: demoStudent.name,
        email: demoStudent.email,
        phone: demoStudent.phone || '',
        cgpa: demoStudent.cgpa || 0,
        interests: demoStudent.interests || [],
        activeBacklogs: demoStudent.activeBacklogs || 0,
        supabaseUser: false,
        demoMode: true,
      };
      const saveResult = saveDb({ ...db, auth: nextAuth });
      return { ok: true, auth: saveResult.auth };
    }
  }

  // Demo mode: Check predefined demo credentials
  const expectedCredentials = DEMO_CREDENTIALS[role];
  if (!expectedCredentials) {
    return { ok: false, error: 'Invalid role' };
  }

  const isValidCredentials =
    email === expectedCredentials.email && password === expectedCredentials.password;

  if (!isValidCredentials) {
    return { ok: false, error: 'Invalid email or password' };
  }

  let nextDb = { ...db };

  // Use actual demo credentials for email, not hardcoded values
  const nextAuth =
    role === 'student'
      ? {
          role: 'student', 
          userId: 'stu_01', 
          name: 'Demo Student', 
          email: expectedCredentials.email,
          phone: '',
          cgpa: 0,
          interests: [],
          activeBacklogs: 0,
          supabaseUser: false,
          demoMode: true,
        }
      : { 
          role: 'admin', 
          userId: 'admin_01', 
          name: 'TPO Admin', 
          email: expectedCredentials.email,
          supabaseUser: false,
          demoMode: true,
        };

  if (role === 'student' && !nextDb.students?.some((student) => student.id === 'stu_01')) {
    nextDb = {
      ...nextDb,
      students: [
        ...(nextDb.students || []),
        {
          id: 'stu_01',
          name: 'Demo Student',
          email: expectedCredentials.email,
          enrollment: 'DEMO-STUDENT-001',
          branch: 'CSE',
          cgpa: 8.1,
          attendance: 86,
          activeBacklogs: 0,
          resumeUploaded: true,
          resumeScore: 76,
          atsScore: 76,
          aptitudeScore: 72,
          communicationScore: 70,
          skills: ['React', 'SQL', 'DSA', 'Git'],
          projects: 3,
          internships: 1,
          status: 'Applied',
        },
      ],
    };
  }

  const result = saveDb({ ...nextDb, auth: nextAuth });
  return { ok: true, auth: result.auth };
}

/**
 * Sign up a new student
 * @param {string} email - Student email
 * @param {string} password - Student password
 * @param {object} profileData - Name, phone, cgpa, interests, activeBacklogs
 */
export async function signup(email, password, profileData) {
  // Validation
  if (!email || !password) {
    return { ok: false, error: 'Email and password are required' };
  }

  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters' };
  }

  // If Supabase is configured, use it
  if (isSupabaseConfigured()) {
    const result = await signUpStudent(email, password, profileData);
    
    if (result.ok) {
      // Auto-login after signup
      const db = loadDb();
      const nextAuth = {
        role: 'student',
        userId: result.user.id,
        name: profileData.name || result.user.email,
        email: result.user.email,
        phone: profileData.phone || '',
        cgpa: profileData.cgpa || 0,
        interests: profileData.interests || [],
        activeBacklogs: profileData.activeBacklogs || 0,
        supabaseUser: true,
      };
      const saveResult = saveDb({ ...db, auth: nextAuth });
      return { ok: true, auth: saveResult.auth };
    }

    return result;
  }

  // Demo mode: Create student account in local storage
  const db = loadDb();
  const newStudent = {
    role: 'student',
    userId: `stu_${Date.now()}`,
    name: profileData.name || email,
    email,
    phone: profileData.phone || '',
    cgpa: profileData.cgpa || 0,
    interests: profileData.interests || [],
    activeBacklogs: profileData.activeBacklogs || 0,
    supabaseUser: false,
    demoMode: true,
  };

  const saveResult = saveDb({
    ...db,
    auth: newStudent,
    demoStudents: [...(db.demoStudents || []), { email, password, ...newStudent }],
  });

  return { ok: true, auth: saveResult.auth };
}

export function loginAs(role) {
  const db = loadDb();
  let nextDb = { ...db };

  const nextAuth =
    role === 'student'
      ? {
          role: 'student',
          userId: 'stu_01',
          name: 'Demo Student',
          email: DEMO_CREDENTIALS.student.email,
          phone: '',
          cgpa: 8.1,
          interests: [],
          activeBacklogs: 0,
          supabaseUser: false,
          demoMode: true,
        }
      : {
          role: 'admin',
          userId: 'admin_01',
          name: 'TPO Admin',
          email: DEMO_CREDENTIALS.admin.email,
          supabaseUser: false,
          demoMode: true,
        };

  if (role === 'student' && !nextDb.students?.some((student) => student.id === 'stu_01')) {
    nextDb = {
      ...nextDb,
      students: [
        ...(nextDb.students || []),
        {
          id: 'stu_01',
          name: 'Demo Student',
          email: DEMO_CREDENTIALS.student.email,
          enrollment: 'DEMO-STUDENT-001',
          branch: 'CSE',
          cgpa: 8.1,
          attendance: 86,
          activeBacklogs: 0,
          resumeUploaded: true,
          resumeScore: 76,
          atsScore: 76,
          aptitudeScore: 72,
          communicationScore: 70,
          skills: ['React', 'SQL', 'DSA', 'Git'],
          projects: 3,
          internships: 1,
          status: 'Applied',
        },
      ],
    };
  }

  return saveDb({ ...nextDb, auth: nextAuth }).auth;
}

export async function logout() {
  // Sign out from Supabase if available
  if (isSupabaseConfigured()) {
    await supabaseSignOut();
  }

  const db = loadDb();
  const nextAuth = { role: 'guest', userId: null, name: null, email: null };
  return saveDb({ ...db, auth: nextAuth }).auth;
}

export function logoutToDemo() {
  return loginAs('admin');
}
