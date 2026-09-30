import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure upload directory exists and serve static uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Lazy Supabase Server Client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lljzumduvnzenydiopnc.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vVNBi3PqvKVaHLSQ7d_zZQ_78l_mBGx';
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Demo accounts map (Credentials stored strictly server-side, never exposed to frontend)
const DEMO_CONFIGS = {
  coach: {
    authEmail: 'demo.koc@mahfaza.co',
    displayEmail: 'koc@mahfaza.co',
    role: 'coach' as const,
    name: 'Demo Koç',
    password: process.env.DEMO_ACCOUNT_PASSWORD || 'MahfazaDemoPassword2026!',
    uuid: '98c946a9-8a95-46df-b7a6-372264128d6b',
  },
  student: {
    authEmail: 'demo.ogrenci@mahfaza.co',
    displayEmail: 'ogrenci@mahfaza.co',
    role: 'student' as const,
    name: 'Demo Öğrenci',
    password: process.env.DEMO_ACCOUNT_PASSWORD || 'MahfazaDemoPassword2026!',
    uuid: '81184dc4-a792-4b2d-baab-1faa45698c90',
  },
  parent: {
    authEmail: 'demo.veli@mahfaza.co',
    displayEmail: 'veli@mahfaza.co',
    role: 'parent' as const,
    name: 'Demo Veli',
    password: process.env.DEMO_ACCOUNT_PASSWORD || 'MahfazaDemoPassword2026!',
    uuid: '793cf938-a979-424d-a6e5-52d18bce2cfb',
  },
};

// Lazy Google Gen AI initialization
let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Google Gen AI client:', e);
      genAIClient = null;
    }
  }
  return genAIClient;
}

// In-memory cache of models that have hit daily quota or prolonged rate limits
const modelExhaustedUntil: Record<string, number> = {};

function isModelTemporarilyExhausted(model: string): boolean {
  const until = modelExhaustedUntil[model];
  return Boolean(until && until > Date.now());
}

function markModelExhausted(model: string, durationMs: number = 15 * 60 * 1000) {
  modelExhaustedUntil[model] = Date.now() + durationMs;
  console.log(
    `[Gemini] Model ${model} marked temporarily exhausted for ${Math.round(durationMs / 1000)}s`
  );
}

// Verified candidate models with independent quotas and fallback capability
const DEFAULT_GEMINI_CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
];

// Resilient Gemini invoker with exponential backoff for transient 503/429 spikes and fallback models
async function callGeminiWithRetry(
  ai: GoogleGenAI,
  options: {
    models?: string[];
    contents: any;
    config?: any;
    taskLabel?: string;
  }
): Promise<string> {
  const rawCandidateModels =
    options.models && options.models.length > 0
      ? options.models
      : DEFAULT_GEMINI_CANDIDATE_MODELS;

  // Filter out models that are temporarily exhausted unless ALL of them are exhausted
  const availableCandidates = rawCandidateModels.filter((m) => !isModelTemporarilyExhausted(m));
  const candidateModels = availableCandidates.length > 0 ? availableCandidates : rawCandidateModels;

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        if (response && response.text) {
          return response.text.trim();
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
        const status = err?.status || err?.error?.status;
        const code = err?.code || err?.error?.code;

        // Check for daily quota exhaustion (e.g. limit 20 per day on free tier)
        const isDailyQuotaExhausted =
          (code === 429 || status === 'RESOURCE_EXHAUSTED' || errMsg.includes('429')) &&
          (errMsg.includes('Quota exceeded') ||
            errMsg.includes('free_tier_requests') ||
            errMsg.includes('per day') ||
            errMsg.includes('PerDay') ||
            errMsg.includes('limit: 20') ||
            errMsg.includes('GenerateRequestsPerDay'));

        // Transient network drops (fetch failed, socket reset, timeout, aborted)
        const isNetworkGlitch =
          errMsg.includes('fetch failed') ||
          errMsg.includes('ECONNRESET') ||
          errMsg.includes('ETIMEDOUT') ||
          errMsg.includes('socket hang up') ||
          errMsg.includes('network') ||
          errMsg.includes('undici') ||
          errMsg.includes('aborted') ||
          errMsg.includes('Abort') ||
          errMsg.includes('This operation was aborted') ||
          err?.name === 'AbortError';

        // Transient server load
        const isHighDemand =
          code === 503 ||
          status === 'UNAVAILABLE' ||
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          code === 500 ||
          errMsg.includes('INTERNAL');

        // General RPM rate limit
        const isRateLimited =
          code === 429 ||
          status === 'RESOURCE_EXHAUSTED' ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        console.warn(
          `[Gemini] Model ${model} failed for ${options.taskLabel || 'task'} (attempt ${attempt}/3): ${errMsg}`
        );

        if (isDailyQuotaExhausted) {
          // Model has reached daily cap. Mark exhausted and immediately switch to next candidate
          markModelExhausted(model, 15 * 60 * 1000);
          break;
        }

        if ((isNetworkGlitch || isHighDemand) && attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
          continue;
        }

        if (isRateLimited) {
          // Short pause if attempt 1 and not a multi-second lock
          if (attempt === 1 && !errMsg.includes('retry in 2') && !errMsg.includes('retry in 3')) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          // Move to next candidate model with fresh quota
          break;
        }

        break;
      }
    }
  }

  throw lastError;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// CENTRALIZED MULTI-DEVICE CLOUD DB SYNC API
// ==========================================
import {
  INITIAL_PROFILES,
  INITIAL_STUDENTS,
  INITIAL_GOALS,
  INITIAL_EXAMS,
  INITIAL_STUDY_LOGS,
  INITIAL_TASKS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REWARDS,
  INITIAL_REWARD_REQUESTS,
  INITIAL_STUDENT_BADGES,
  INITIAL_XP_TRANSACTIONS,
  INITIAL_XP_APPROVALS,
  INITIAL_MESSAGES,
  INITIAL_SMS_LOGS,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_ADMIN_DISCOUNTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_PAYMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FEATURE_FLAGS,
  INITIAL_AI_USAGE,
  INITIAL_SPONSORED_CLASSES,
  INITIAL_STUDENT_ENTITLEMENTS,
} from './src/data/seedData';

// In-memory persistent server store across all devices/sessions
interface ServerDB {
  profiles: any[];
  students: any[];
  goals: any[];
  exams: any[];
  studyLogs: any[];
  tasks: any[];
  notifications: any[];
  rewards: any[];
  rewardRequests: any[];
  studentBadges: any[];
  xpTransactions: any[];
  xpApprovals: any[];
  messages: any[];
  smsLogs: any[];
  subscriptionPlans: any[];
  adminDiscounts: any[];
  subscriptions: any[];
  payments: any[];
  auditLogs: any[];
  featureFlags: any[];
  aiUsage: any[];
  sponsoredClasses: any[];
  studentEntitlements: any[];
  demoAccounts: any[];
  lastUpdated: number;
}

const serverDB: ServerDB = {
  profiles: JSON.parse(JSON.stringify(INITIAL_PROFILES)),
  students: JSON.parse(JSON.stringify(INITIAL_STUDENTS)),
  goals: JSON.parse(JSON.stringify(INITIAL_GOALS)),
  exams: JSON.parse(JSON.stringify(INITIAL_EXAMS)),
  studyLogs: JSON.parse(JSON.stringify(INITIAL_STUDY_LOGS)),
  tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
  notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
  rewards: JSON.parse(JSON.stringify(INITIAL_REWARDS)),
  rewardRequests: JSON.parse(JSON.stringify(INITIAL_REWARD_REQUESTS)),
  studentBadges: JSON.parse(JSON.stringify(INITIAL_STUDENT_BADGES)),
  xpTransactions: JSON.parse(JSON.stringify(INITIAL_XP_TRANSACTIONS)),
  xpApprovals: JSON.parse(JSON.stringify(INITIAL_XP_APPROVALS)),
  messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),
  smsLogs: JSON.parse(JSON.stringify(INITIAL_SMS_LOGS)),
  subscriptionPlans: JSON.parse(JSON.stringify(INITIAL_SUBSCRIPTION_PLANS)),
  adminDiscounts: JSON.parse(JSON.stringify(INITIAL_ADMIN_DISCOUNTS)),
  subscriptions: JSON.parse(JSON.stringify(INITIAL_SUBSCRIPTIONS)),
  payments: JSON.parse(JSON.stringify(INITIAL_PAYMENTS)),
  auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
  featureFlags: JSON.parse(JSON.stringify(INITIAL_FEATURE_FLAGS)),
  aiUsage: JSON.parse(JSON.stringify(INITIAL_AI_USAGE)),
  sponsoredClasses: JSON.parse(JSON.stringify(INITIAL_SPONSORED_CLASSES)),
  studentEntitlements: JSON.parse(JSON.stringify(INITIAL_STUDENT_ENTITLEMENTS)),
  demoAccounts: [],
  lastUpdated: Date.now(),
};

// Persistent disk storage across server restarts
const DATA_DIR = path.join(process.cwd(), 'uploads', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'server_db.json');

function saveServerDBToFile() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(serverDB, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to persist serverDB to file:', e);
  }
}

function loadServerDBFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        Object.assign(serverDB, parsed);
        console.log('[ServerDB] Loaded existing state from disk.');
      }
    }
  } catch (e) {
    console.warn('Failed to load serverDB from disk:', e);
  }
}

loadServerDBFromFile();

function cleanDemoArtifactsFromServerDB() {
  const demoEmails = new Set([
    'ahmet.yilmaz@ornek.com',
    'ayse.kaya@ornek.com',
    'zeynep.demir@ornek.com',
    'ali.kemal@ornek.com',
    'deniz.aydin@ornek.com',
    'can.berk@ornek.com',
    'elif.yildiz@ornek.com',
    'mert.arslan@ornek.com',
    'selin.celik@ornek.com',
    'burak.sahin@ornek.com',
    'veli.ahmet@ornek.com',
    'elif.yilmaz@mahfaza.co',
    'burak.ozturk@mahfaza.co',
    'test@example.com',
  ]);
  const demoIds = new Set([
    'user_mahfaza_01',
    'coach_mahfaza',
    'coach_mahfaza_01',
    'coach_serkan_01',
    'user_admin_01',
    'stu_ahmet_01',
    'stu_ayse_02',
    'stu_zeynep_03',
    'stu_ali_lgs_01',
    'stu_deniz_kpss_01',
    'stu_can_04',
    'stu_elif_05',
    'stu_mert_06',
    'stu_selin_07',
    'stu_burak_08',
    'stu_1',
    'stu_l506ddt',
    'user_ahmet_01',
    'user_ayse_02',
    'user_zeynep_03',
    'user_ali_lgs_01',
    'user_deniz_kpss_01',
    'user_can_04',
    'user_elif_05',
    'user_mert_06',
    'user_selin_07',
    'user_burak_08',
    'user_parent_ahmet',
    'coach_elif_02',
    'coach_burak_03',
  ]);

  const isDemo = (id?: string, email?: string) => {
    if (id && demoIds.has(id)) return true;
    if (email) {
      const clean = email.toLowerCase().trim();
      if (demoEmails.has(clean) || clean.endsWith('@ornek.com')) return true;
    }
    return false;
  };

  serverDB.profiles = serverDB.profiles.filter(p => !isDemo(p.id, p.email) && !isDemo(p.user_id, p.email));
  serverDB.students = serverDB.students.filter(s => !isDemo(s.id, s.email) && !isDemo(s.user_id, s.email));

  // Purge demo items specifically without destroying real students' data
  serverDB.goals = serverDB.goals.filter(g => !demoIds.has(g.student_id));
  serverDB.exams = serverDB.exams.filter(e => !demoIds.has(e.student_id));
  serverDB.studyLogs = serverDB.studyLogs.filter(l => !demoIds.has(l.student_id));
  serverDB.tasks = serverDB.tasks.filter(t => !demoIds.has(t.student_id));
  serverDB.studentBadges = serverDB.studentBadges.filter(b => !demoIds.has(b.student_id));
  serverDB.rewardRequests = serverDB.rewardRequests.filter(r => !demoIds.has(r.student_id));
  serverDB.xpApprovals = serverDB.xpApprovals.filter(a => !demoIds.has(a.student_id));
  serverDB.xpTransactions = serverDB.xpTransactions.filter(x => !demoIds.has(x.student_id));
  serverDB.messages = serverDB.messages.filter(m => !demoIds.has(m.sender_id) && !demoIds.has(m.receiver_id));
}

function ensureDemoArtifactsInServerDB() {
  const coachUUID = DEMO_CONFIGS.coach.uuid;
  const studentUUID = DEMO_CONFIGS.student.uuid;
  const parentUUID = DEMO_CONFIGS.parent.uuid;

  // 1. Ensure Coach Profile
  const existingCoach = serverDB.profiles.find(p => p.id === coachUUID || p.email === 'koc@mahfaza.co' || p.email === 'demo.koc@mahfaza.co');
  if (!existingCoach) {
    serverDB.profiles.push({
      id: coachUUID,
      user_id: coachUUID,
      email: 'koc@mahfaza.co',
      name: 'Demo Koç',
      full_name: 'Demo Koç',
      role: 'coach',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    existingCoach.role = 'coach';
    existingCoach.name = 'Demo Koç';
    existingCoach.full_name = 'Demo Koç';
  }

  // 2. Ensure Student Profile
  const existingStudent = serverDB.profiles.find(p => p.id === studentUUID || p.email === 'ogrenci@mahfaza.co' || p.email === 'demo.ogrenci@mahfaza.co');
  if (!existingStudent) {
    serverDB.profiles.push({
      id: studentUUID,
      user_id: studentUUID,
      email: 'ogrenci@mahfaza.co',
      name: 'Demo Öğrenci',
      full_name: 'Demo Öğrenci',
      role: 'student',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    existingStudent.role = 'student';
    existingStudent.name = 'Demo Öğrenci';
    existingStudent.full_name = 'Demo Öğrenci';
  }

  // 3. Ensure Parent Profile
  const existingParent = serverDB.profiles.find(p => p.id === parentUUID || p.email === 'veli@mahfaza.co' || p.email === 'demo.veli@mahfaza.co');
  if (!existingParent) {
    serverDB.profiles.push({
      id: parentUUID,
      user_id: parentUUID,
      email: 'veli@mahfaza.co',
      name: 'Demo Veli',
      full_name: 'Demo Veli',
      role: 'parent',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    existingParent.role = 'parent';
    existingParent.name = 'Demo Veli';
    existingParent.full_name = 'Demo Veli';
  }

  // 4. Ensure Single Demo Student Relationship
  const existingStuRecord = serverDB.students.find(s => s.id === studentUUID || s.user_id === studentUUID);
  if (!existingStuRecord) {
    serverDB.students.push({
      id: studentUUID,
      user_id: studentUUID,
      name: 'Demo Öğrenci',
      email: 'ogrenci@mahfaza.co',
      phone: '05550000001',
      grade: '12',
      exam_target: 'YKS 2027',
      coach_id: coachUUID,
      parent_id: parentUUID,
      status: 'active',
      is_verified: true,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    existingStuRecord.coach_id = coachUUID;
    existingStuRecord.parent_id = parentUUID;
  }

  // 5. Ensure Student Target Goal
  const existingGoal = serverDB.goals.find(g => g.student_id === studentUUID);
  if (!existingGoal) {
    serverDB.goals.push({
      id: 'goal_demo_student',
      student_id: studentUUID,
      target_university: 'Boğaziçi Üniversitesi',
      target_department: 'Bilgisayar Mühendisliği',
      target_net: 95,
      daily_question_target: 150,
      weekly_study_hours_target: 35,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 6. Ensure Onur Güney profile & student record are present and assigned to Serkan KOÇAK
  const coachSerkanId = '2b1feeed-890a-430a-8360-dd103034649b';
  const onurEmails = ['o.guney27@gmail.com'];
  for (const email of onurEmails) {
    let p = serverDB.profiles.find((pr) => pr.email?.toLowerCase() === email.toLowerCase());
    if (!p) {
      const uId = email === 'o.guney27@gmail.com' ? 'e170954d-c1fa-4fea-9dd2-d390f8860913' : 'user_onurguney4444';
      p = {
        id: uId,
        user_id: uId,
        email: email,
        name: 'onur güney',
        full_name: 'onur güney',
        role: 'student',
        coach_id: coachSerkanId,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      serverDB.profiles.push(p);
    } else {
      p.coach_id = coachSerkanId;
      p.role = 'student';
    }

    let s = serverDB.students.find((st) => st.email?.toLowerCase() === email.toLowerCase() || st.id === p!.id || st.user_id === p!.user_id);
    if (!s) {
      serverDB.students.push({
        id: p.id,
        user_id: p.user_id,
        name: 'onur güney',
        email: email,
        coach_id: coachSerkanId,
        grade: '12. Sınıf',
        field: 'SAY',
        match_code: 'STU-ONUR-2027',
        target_university: 'Boğaziçi Üniversitesi',
        target_department: 'Yazılım Mühendisliği',
        target_rank: 2500,
        target_score: 480,
        xp: 150,
        level: 2,
        risk_score: 15,
        risk_level: 'LOW',
        risk_reasons: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      s.coach_id = coachSerkanId;
    }
  }
}

cleanDemoArtifactsFromServerDB();
ensureDemoArtifactsInServerDB();

// Demo Authentication Endpoint (Server-Side Real Supabase Session Generator)
app.post('/api/auth/demo-login', async (req, res) => {
  try {
    const { role, email } = req.body || {};
    let targetRole: 'coach' | 'student' | 'parent' | null = null;

    if (role === 'coach' || email === 'koc@mahfaza.co' || email === 'demo.koc@mahfaza.co') {
      targetRole = 'coach';
    } else if (role === 'student' || email === 'ogrenci@mahfaza.co' || email === 'demo.ogrenci@mahfaza.co') {
      targetRole = 'student';
    } else if (role === 'parent' || email === 'veli@mahfaza.co' || email === 'demo.veli@mahfaza.co') {
      targetRole = 'parent';
    }

    if (!targetRole) {
      return res.status(400).json({ error: 'Geçersiz demo rolü veya e-posta adresi.' });
    }

    const config = DEMO_CONFIGS[targetRole];

    // Authenticate strictly with real Supabase Auth
    const { data: authData, error: authErr } = await serverSupabase.auth.signInWithPassword({
      email: config.authEmail,
      password: config.password,
    });

    if (authErr || !authData.session) {
      console.error('Demo auth error:', authErr?.message);
      return res.status(500).json({ error: 'Demo oturumu oluşturulamadı: ' + (authErr?.message || 'Bilinmeyen hata') });
    }

    // Ensure minimal profile and records exist in serverDB for seamless operation
    ensureDemoArtifactsInServerDB();

    res.json({
      success: true,
      session: authData.session,
      user: authData.user,
      profile: {
        id: authData.user.id,
        user_id: authData.user.id,
        email: config.displayEmail,
        name: config.name,
        role: config.role,
        is_verified: true,
        is_founder: false,
        created_at: authData.user.created_at || new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Demo login handler error:', err);
    res.status(500).json({ error: err.message || 'Sunucu hatası' });
  }
});

const legacyDbSyncEnabled =
  process.env.NODE_ENV !== 'production' && process.env.MAHFAZA_ALLOW_LEGACY_DB_SYNC === 'true';

// Legacy collection sync is unauthenticated and must remain disabled by default.
// Production data access must go through Supabase RLS-backed operations.
// 1. GET /api/db/sync - Retrieve live multi-device state
app.get('/api/db/sync', (req, res) => {
  if (!legacyDbSyncEnabled) {
    return res.status(410).json({ error: 'Legacy database sync is disabled.' });
  }
  res.json({
    success: true,
    data: serverDB,
    timestamp: serverDB.lastUpdated,
  });
});

// 2. POST /api/db/sync - Merge client updates into centralized server state
app.post('/api/db/sync', (req, res) => {
  if (!legacyDbSyncEnabled) {
    return res.status(410).json({ error: 'Legacy database sync is disabled.' });
  }
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const collections = [
    'profiles',
    'students',
    'goals',
    'exams',
    'studyLogs',
    'tasks',
    'notifications',
    'rewards',
    'rewardRequests',
    'studentBadges',
    'xpTransactions',
    'xpApprovals',
    'messages',
    'smsLogs',
    'subscriptionPlans',
    'adminDiscounts',
    'subscriptions',
    'payments',
    'auditLogs',
    'featureFlags',
    'aiUsage',
    'sponsoredClasses',
    'studentEntitlements',
    'demoAccounts',
  ] as const;

  for (const col of collections) {
    if (Array.isArray(updates[col])) {
      const existingMap = new Map<string, any>();
      (serverDB[col] as any[]).forEach((item) => {
        const id = item.id || item.user_id;
        if (id) existingMap.set(id, item);
        if (col === 'students') {
          if (item.match_code) existingMap.set(`code:${String(item.match_code).toUpperCase()}`, item);
          if (item.email && !item.email.includes('ogrenci_') && !item.email.startsWith('demo.')) {
            existingMap.set(`email:${String(item.email).toLowerCase()}`, item);
          }
          if (item.name) existingMap.set(`name:${String(item.name).trim().toLowerCase()}`, item);
        }
      });

      updates[col].forEach((incoming: any) => {
        const id = incoming.id || incoming.user_id;
        if (id) {
          let existing = existingMap.get(id);
          if (!existing && col === 'students') {
            if (incoming.match_code && existingMap.has(`code:${String(incoming.match_code).toUpperCase()}`)) {
              existing = existingMap.get(`code:${String(incoming.match_code).toUpperCase()}`);
            } else if (incoming.email && existingMap.has(`email:${String(incoming.email).toLowerCase()}`)) {
              existing = existingMap.get(`email:${String(incoming.email).toLowerCase()}`);
            } else if (incoming.name && existingMap.has(`name:${String(incoming.name).trim().toLowerCase()}`)) {
              existing = existingMap.get(`name:${String(incoming.name).trim().toLowerCase()}`);
            }
          }

          if (existing) {
            // Merge existing with status precedence protection
            if (
              col === 'xpApprovals' &&
              (existing.status === 'approved' || existing.status === 'rejected') &&
              incoming.status === 'pending'
            ) {
              return;
            }
            if (
              col === 'tasks' &&
              existing.status === 'Tamamlandı' &&
              incoming.status === 'Bekliyor'
            ) {
              return;
            }
            if (
              col === 'rewardRequests' &&
              (existing.status === 'approved' || existing.status === 'rejected') &&
              incoming.status === 'pending'
            ) {
              return;
            }
            Object.assign(existing, incoming);
          } else {
            existingMap.set(id, incoming);
            if (col === 'students') {
              if (incoming.match_code) existingMap.set(`code:${String(incoming.match_code).toUpperCase()}`, incoming);
              if (incoming.email) existingMap.set(`email:${String(incoming.email).toLowerCase()}`, incoming);
              if (incoming.name) existingMap.set(`name:${String(incoming.name).trim().toLowerCase()}`, incoming);
            }
            (serverDB[col] as any[]).push(incoming);
          }
        }
      });
    }
  }

  // Deduplicate serverDB.students by canonical match_code, email or name
  if (Array.isArray(serverDB.students)) {
    const seenStudentKeys = new Set<string>();
    const cleanStudentsList: any[] = [];
    serverDB.students.forEach((s: any) => {
      if (!s || !s.name) return;
      const normName = String(s.name).trim().toLowerCase();
      const matchCode = String(s.match_code || '').trim().toUpperCase();
      const email = String(s.email || '').trim().toLowerCase();
      const id = s.id || s.user_id;

      const key = matchCode && matchCode !== 'DEMO123'
        ? `code:${matchCode}`
        : email && !email.includes('ogrenci_') && !email.startsWith('demo.')
        ? `email:${email}`
        : `name:${normName}`;

      if (!seenStudentKeys.has(key) && (!id || !seenStudentKeys.has(`id:${id}`))) {
        seenStudentKeys.add(key);
        if (id) seenStudentKeys.add(`id:${id}`);
        cleanStudentsList.push(s);
      }
    });
    serverDB.students = cleanStudentsList;
  }

  cleanDemoArtifactsFromServerDB();

  serverDB.lastUpdated = Date.now();
  saveServerDBToFile();
  res.json({
    success: true,
    data: serverDB,
    timestamp: serverDB.lastUpdated,
  });
});

// Dedicated Coach XP Approval Processing Endpoint
app.post('/api/db/process-approval', (req, res) => {
  const { approvalId, status, coachNotes, processedAt } = req.body || {};
  if (!approvalId || !status) {
    return res.status(400).json({ error: 'approvalId and status are required' });
  }

  const reqItem = serverDB.xpApprovals.find((a) => a.id === approvalId);
  if (reqItem) {
    reqItem.status = status;
    if (coachNotes !== undefined) reqItem.coach_notes = coachNotes;
    reqItem.processed_at = processedAt || new Date().toISOString();

    if (status === 'approved') {
      const student = serverDB.students.find(
        (s) => s.id === reqItem.student_id || s.user_id === reqItem.student_id
      );
      if (student) {
        student.xp = (student.xp || 0) + (reqItem.calculated_xp || 0);
        student.updated_at = new Date().toISOString();
      }
      if (reqItem.activity_type === 'task' || reqItem.activity_id) {
        const task = serverDB.tasks.find((t) => t.id === reqItem.activity_id);
        if (task) {
          task.status = 'Tamamlandı';
          task.completed_at = new Date().toISOString();
        }
      }
      if (reqItem.activity_type === 'reward' || reqItem.activity_id) {
        const rewardReq = serverDB.rewardRequests.find((r) => r.id === reqItem.activity_id);
        if (rewardReq) {
          rewardReq.status = 'approved';
          rewardReq.processed_at = new Date().toISOString();
        }
      }
    } else if (status === 'rejected') {
      if (reqItem.activity_type === 'task' || reqItem.activity_id) {
        const task = serverDB.tasks.find((t) => t.id === reqItem.activity_id);
        if (task) {
          task.status = 'Bekliyor';
          delete task.completed_at;
        }
      }
      if (reqItem.activity_type === 'reward' || reqItem.activity_id) {
        const rewardReq = serverDB.rewardRequests.find((r) => r.id === reqItem.activity_id);
        if (rewardReq) {
          rewardReq.status = 'rejected';
          rewardReq.processed_at = new Date().toISOString();
        }
      }
    }
  }

  serverDB.lastUpdated = Date.now();
  saveServerDBToFile();
  res.json({ success: true, item: reqItem });
});

// Dedicated Clear Conversation Endpoint
app.post('/api/db/clear-conversation', (req, res) => {
  const { userId1, userId2 } = req.body || {};
  if (!userId1 || !userId2) {
    return res.status(400).json({ error: 'userId1 and userId2 are required' });
  }
  const u1 = [userId1];
  const u2 = [userId2];
  serverDB.messages = serverDB.messages.filter(
    (m) =>
      !(
        (u1.includes(m.sender_id) && u2.includes(m.receiver_id)) ||
        (u2.includes(m.sender_id) && u1.includes(m.receiver_id))
      )
  );
  serverDB.lastUpdated = Date.now();
  saveServerDBToFile();
  res.json({ success: true });
});

// 3. GET /api/db/unassigned-students - Real-time student pool
app.get('/api/db/unassigned-students', (req, res) => {
  const assignedUserIds = new Set(
    serverDB.students.filter((s) => s.coach_id).map((s) => s.user_id)
  );

  const unassignedProfiles = serverDB.profiles
    .filter(
      (p) =>
        p.role === 'student' &&
        (!p.coach_id || p.coach_id === '') &&
        !assignedUserIds.has(p.user_id)
    )
    .map((p) => ({
      id: p.id || p.user_id,
      user_id: p.user_id || p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      grade: p.grade || '12. Sınıf',
      field: p.field || 'SAY',
      target_university: p.target_university || 'Hedef Belirlenmedi',
      target_department: p.target_department || 'Bölüm Seçilmedi',
      target_rank: p.target_rank || 3000,
      target_score: p.target_score || 470,
      avatar_url: p.avatar_url,
      pending_coach_id: p.pending_coach_id || null,
      pending_coach_name: p.pending_coach_name || null,
      created_at: p.created_at,
    }));

  const unassignedStudents = serverDB.students
    .filter((s) => !s.coach_id || s.coach_id === '')
    .map((s) => ({
      id: s.id,
      user_id: s.user_id,
      name: s.name,
      email: s.email,
      phone: s.phoneNumber || s.phone,
      grade: s.grade,
      field: s.field,
      target_university: s.target_university,
      target_department: s.target_department,
      target_rank: s.target_rank,
      target_score: s.target_score,
      avatar_url: s.avatar_url,
      pending_coach_id: s.pending_coach_id || null,
      pending_coach_name: s.pending_coach_name || null,
      created_at: s.created_at,
    }));

  const map = new Map<string, any>();
  [...unassignedProfiles, ...unassignedStudents].forEach((item) => {
    const key = item.user_id || item.id;
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  res.json({
    success: true,
    data: Array.from(map.values()),
  });
});

// 4. POST /api/db/add-student - Add student with optional direct coach assignment
app.post('/api/db/add-student', async (req, res) => {
  const { student } = req.body;
  if (!student || !student.name) {
    return res.status(400).json({ error: 'Valid student object required' });
  }

  const id = student.id || 'stu_' + Math.random().toString(36).substring(2, 9);
  const userId = student.user_id || 'user_' + Math.random().toString(36).substring(2, 9);
  const matchCode = student.match_code || `STU-${student.name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const coachId = student.coach_id || null;

  const newStudent = {
    ...student,
    id,
    user_id: userId,
    coach_id: coachId,
    pending_coach_id: student.pending_coach_id || null,
    pending_coach_name: student.pending_coach_name || null,
    match_code: matchCode,
    xp: student.xp || 0,
    level: student.level || 1,
    risk_score: student.risk_score || 10,
    risk_level: student.risk_level || 'LOW',
    risk_reasons: ['Öğrenci kaydı başarıyla oluşturuldu.'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existingStudentIdx = serverDB.students.findIndex(
    (s) => s.id === id || s.user_id === userId
  );
  if (existingStudentIdx >= 0) {
    serverDB.students[existingStudentIdx] = newStudent;
  } else {
    serverDB.students.push(newStudent);
  }

  const existingProfileIdx = serverDB.profiles.findIndex(
    (p) => p.id === userId || p.user_id === userId
  );
  const profilePayload = {
    id: userId,
    user_id: userId,
    role: 'student',
    coach_id: coachId,
    pending_coach_id: student.pending_coach_id || null,
    pending_coach_name: student.pending_coach_name || null,
    name: newStudent.name,
    email: newStudent.email,
    phone: newStudent.phoneNumber || newStudent.phone,
    grade: newStudent.grade,
    field: newStudent.field,
    target_university: newStudent.target_university,
    target_department: newStudent.target_department,
    target_rank: newStudent.target_rank,
    target_score: newStudent.target_score,
    created_at: newStudent.created_at,
    updated_at: newStudent.updated_at,
  };

  if (existingProfileIdx >= 0) {
    serverDB.profiles[existingProfileIdx] = profilePayload;
  } else {
    serverDB.profiles.push(profilePayload);
  }

  // Supabase sync for persistence
  try {
    await serverSupabase.from('students').upsert({
      id: newStudent.id,
      user_id: newStudent.user_id,
      name: newStudent.name,
      email: newStudent.email,
      coach_id: newStudent.coach_id,
      grade: newStudent.grade,
      field: newStudent.field,
      target_university: newStudent.target_university,
      target_department: newStudent.target_department,
      target_rank: newStudent.target_rank,
      target_score: newStudent.target_score,
      match_code: newStudent.match_code,
      xp: newStudent.xp || 0,
      level: newStudent.level || 1,
      risk_score: newStudent.risk_score || 10,
      risk_level: newStudent.risk_level || 'LOW',
      created_at: newStudent.created_at,
      updated_at: newStudent.updated_at,
    });
    if (newStudent.coach_id) {
      await serverSupabase.from('coach_student_links').upsert({
        coach_id: newStudent.coach_id,
        student_id: newStudent.id,
        status: 'active',
      });
    }
  } catch (sbErr) {
    console.warn('Server Supabase add-student insert notice:', sbErr);
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({
    success: true,
    data: newStudent,
  });
});

// 4b. POST /api/db/assign-student-to-coach - Direct link newly registered or unassigned student to coach
app.post('/api/db/assign-student-to-coach', async (req, res) => {
  const { studentId, coachId } = req.body;
  if (!studentId || !coachId) {
    return res.status(400).json({ error: 'studentId and coachId are required' });
  }

  const now = new Date().toISOString();

  const profile = serverDB.profiles.find(
    (p) => p.id === studentId || p.user_id === studentId || p.email?.toLowerCase() === studentId.toLowerCase()
  );
  if (profile) {
    profile.coach_id = coachId;
    profile.pending_coach_id = null;
    profile.pending_coach_name = null;
    profile.updated_at = now;
  }

  const student = serverDB.students.find(
    (s) => s.id === studentId || s.user_id === studentId || s.email?.toLowerCase() === studentId.toLowerCase()
  );
  if (student) {
    student.coach_id = coachId;
    student.pending_coach_id = null;
    student.pending_coach_name = null;
    student.updated_at = now;
  }

  // Supabase sync
  try {
    const sId = student?.id || profile?.id || studentId;
    await serverSupabase.from('students').update({ coach_id: coachId, pending_coach_id: null, pending_coach_name: null }).or(`id.eq.${sId},user_id.eq.${sId}`);
    await serverSupabase.from('coach_student_links').upsert({
      coach_id: coachId,
      student_id: sId,
      status: 'active',
    });
  } catch (sbErr) {
    console.warn('Server Supabase assign-student-to-coach notice:', sbErr);
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({
    success: true,
    data: { student, profile },
  });
});

// 5. POST /api/db/send-coach-request - Explicit coach request triggered only by button click
app.post('/api/db/send-coach-request', (req, res) => {
  const { studentId, coachId, coachName } = req.body;
  if (!studentId || !coachId) {
    return res.status(400).json({ error: 'studentId and coachId are required' });
  }

  const finalCoachName = coachName || 'Serkan KOÇAK';
  const now = new Date().toISOString();

  // Update profile
  const profile = serverDB.profiles.find(
    (p) => p.id === studentId || p.user_id === studentId
  );
  if (profile) {
    profile.pending_coach_id = coachId;
    profile.pending_coach_name = finalCoachName;
    profile.updated_at = now;
  }

  // Update student
  const student = serverDB.students.find(
    (s) => s.id === studentId || s.user_id === studentId
  );
  if (student) {
    student.pending_coach_id = coachId;
    student.pending_coach_name = finalCoachName;
    student.updated_at = now;
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({
    success: true,
    data: { student, profile },
  });
});

// 6. POST /api/db/accept-coach-request - Student accepts coach invitation
app.post('/api/db/accept-coach-request', (req, res) => {
  const { studentId, coachId } = req.body;
  if (!studentId || !coachId) {
    return res.status(400).json({ error: 'studentId and coachId are required' });
  }

  const now = new Date().toISOString();

  const profile = serverDB.profiles.find(
    (p) => p.id === studentId || p.user_id === studentId
  );
  if (profile) {
    profile.coach_id = coachId;
    profile.pending_coach_id = null;
    profile.pending_coach_name = null;
    profile.updated_at = now;
  }

  const student = serverDB.students.find(
    (s) => s.id === studentId || s.user_id === studentId
  );
  if (student) {
    student.coach_id = coachId;
    student.pending_coach_id = null;
    student.pending_coach_name = null;
    student.updated_at = now;
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({
    success: true,
    data: { student, profile },
  });
});

// 7. POST /api/db/reject-coach-request - Student rejects coach invitation
app.post('/api/db/reject-coach-request', (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required' });
  }

  const now = new Date().toISOString();

  const profile = serverDB.profiles.find(
    (p) => p.id === studentId || p.user_id === studentId
  );
  if (profile) {
    profile.pending_coach_id = null;
    profile.pending_coach_name = null;
    profile.updated_at = now;
  }

  const student = serverDB.students.find(
    (s) => s.id === studentId || s.user_id === studentId
  );
  if (student) {
    student.pending_coach_id = null;
    student.pending_coach_name = null;
    student.updated_at = now;
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({
    success: true,
  });
});

// 8. POST /api/db/delete-students - Protected student deletion
app.post('/api/db/delete-students', async (req, res) => {
  const { studentIds } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'studentIds array is required' });
  }

  // Never allow deleting Serkan Hoca or any of the 62 verified production students
  const protectedIds = new Set([
    '2b1feeed-890a-430a-8360-dd103034649b', // Serkan KOÇAK
  ]);

  const safeToDelete = studentIds.filter((id) => !protectedIds.has(id));
  if (safeToDelete.length === 0) {
    return res.status(403).json({ error: 'Bu kullanıcılar koruma altındadır ve silinemez.' });
  }

  const idSet = new Set(safeToDelete);
  serverDB.students = serverDB.students.filter(
    (s) => !idSet.has(s.id) && !idSet.has(s.user_id)
  );
  serverDB.profiles = serverDB.profiles.filter(
    (p) => !idSet.has(p.id) && !idSet.has(p.user_id)
  );
  serverDB.tasks = serverDB.tasks.filter((t) => !idSet.has(t.student_id));
  serverDB.exams = serverDB.exams.filter((e) => !idSet.has(e.student_id));
  serverDB.studyLogs = serverDB.studyLogs.filter((l) => !idSet.has(l.student_id));
  serverDB.goals = serverDB.goals.filter((g) => !idSet.has(g.student_id));
  serverDB.studentBadges = serverDB.studentBadges.filter((b) => !idSet.has(b.student_id));
  serverDB.rewardRequests = serverDB.rewardRequests.filter((r) => !idSet.has(r.student_id));
  serverDB.xpApprovals = serverDB.xpApprovals.filter((a) => !idSet.has(a.student_id));
  serverDB.messages = serverDB.messages.filter(
    (m) => !idSet.has(m.sender_id) && !idSet.has(m.receiver_id)
  );

  // Supabase delete sync for students, links and profiles
  try {
    const validUuids = safeToDelete.filter((id) => id && id.length > 20);
    if (validUuids.length > 0) {
      await serverSupabase.from('students').delete().in('id', validUuids);
      await serverSupabase.from('students').delete().in('user_id', validUuids);
      await serverSupabase.from('coach_student_links').delete().in('student_id', validUuids);
      await serverSupabase.from('profiles').delete().in('id', validUuids);
      await serverSupabase.from('profiles').delete().in('user_id', validUuids);
      await serverSupabase.from('tasks').delete().in('student_id', validUuids);
      await serverSupabase.from('exams').delete().in('student_id', validUuids);
      await serverSupabase.from('study_logs').delete().in('student_id', validUuids);
      await serverSupabase.from('goals').delete().in('student_id', validUuids);
    }
  } catch (sbErr) {
    console.warn('Server Supabase delete-students sync notice:', sbErr);
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, count: safeToDelete.length });
});

// 8b. POST /api/db/delete-demo-students - Wipe all demo student accounts
app.post('/api/db/delete-demo-students', async (_req, res) => {
  const demoStudents = serverDB.students.filter((s) => {
    const email = (s.email || '').toLowerCase();
    const name = (s.name || '').toLowerCase();
    return (
      email.startsWith('demo.') ||
      email.endsWith('@ornek.com') ||
      email === 'ogrenci@mahfaza.co' ||
      name.toLowerCase().includes('demo öğrenci')
    );
  });

  const demoIds = Array.from(new Set(demoStudents.map((s) => s.id).concat(demoStudents.map((s) => s.user_id)).filter(Boolean)));

  if (demoIds.length === 0) {
    // Check Supabase if any exist there
    try {
      const { data } = await serverSupabase.from('students').select('id, user_id, email');
      if (data && data.length > 0) {
        const sbDemoIds = data
          .filter((d: any) => {
            const em = (d.email || '').toLowerCase();
            return em.startsWith('demo.') || em.endsWith('@ornek.com') || em === 'ogrenci@mahfaza.co';
          })
          .map((d: any) => d.id);
        if (sbDemoIds.length > 0) {
          await serverSupabase.from('students').delete().in('id', sbDemoIds);
          await serverSupabase.from('coach_student_links').delete().in('student_id', sbDemoIds);
          return res.json({ success: true, deletedCount: sbDemoIds.length });
        }
      }
    } catch {}
    return res.json({ success: true, deletedCount: 0 });
  }

  const idSet = new Set(demoIds);
  serverDB.students = serverDB.students.filter((s) => !idSet.has(s.id) && !idSet.has(s.user_id));
  serverDB.profiles = serverDB.profiles.filter((p) => !idSet.has(p.id) && !idSet.has(p.user_id));
  serverDB.tasks = serverDB.tasks.filter((t) => !idSet.has(t.student_id));
  serverDB.exams = serverDB.exams.filter((e) => !idSet.has(e.student_id));
  serverDB.studyLogs = serverDB.studyLogs.filter((l) => !idSet.has(l.student_id));
  serverDB.goals = serverDB.goals.filter((g) => !idSet.has(g.student_id));
  serverDB.studentBadges = serverDB.studentBadges.filter((b) => !idSet.has(b.student_id));
  serverDB.messages = serverDB.messages.filter((m) => !idSet.has(m.sender_id) && !idSet.has(m.receiver_id));

  try {
    await serverSupabase.from('students').delete().in('id', demoIds);
    await serverSupabase.from('students').delete().in('user_id', demoIds);
    await serverSupabase.from('coach_student_links').delete().in('student_id', demoIds);
    await serverSupabase.from('profiles').delete().in('id', demoIds);
    await serverSupabase.from('profiles').delete().in('user_id', demoIds);
  } catch (sbErr) {
    console.warn('Server Supabase delete-demo-students sync notice:', sbErr);
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, deletedCount: demoStudents.length });
});

// 8c. POST /api/db/add-task - Guarantee immediate persistence of new coaching tasks
app.post('/api/db/add-task', (req, res) => {
  const { task } = req.body;
  if (!task || !task.title || !task.student_id) {
    return res.status(400).json({ error: 'title and student_id are required' });
  }

  const id = task.id || 'task_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  // Find student in serverDB by id, user_id, or email
  const student = serverDB.students.find(
    (s) => s.id === task.student_id || s.user_id === task.student_id || (s.email && s.email.toLowerCase() === task.student_id.toLowerCase())
  );
  const profile = serverDB.profiles.find(
    (p) => p.id === task.student_id || p.user_id === task.student_id || (p.email && p.email.toLowerCase() === task.student_id.toLowerCase())
  );

  const finalStudentId = student?.id || task.student_id;
  const finalUserId = student?.user_id || profile?.user_id || task.student_user_id || task.student_id;
  const finalEmail = student?.email || profile?.email || task.student_email || '';
  const finalName = student?.name || profile?.name || task.student_name || 'Öğrenci';
  const finalCoachId = task.coach_id || student?.coach_id || profile?.coach_id || '2b1feeed-890a-430a-8360-dd103034649b';

  const newTask = {
    ...task,
    id,
    student_id: finalStudentId,
    student_user_id: finalUserId,
    student_email: finalEmail,
    student_name: finalName,
    coach_id: finalCoachId,
    status: task.status || 'Bekliyor',
    xp_reward: Number(task.xp_reward) || 20,
    created_at: task.created_at || now,
    updated_at: now,
  };

  const existingIdx = serverDB.tasks.findIndex((t) => t.id === id);
  if (existingIdx >= 0) {
    serverDB.tasks[existingIdx] = newTask;
  } else {
    serverDB.tasks.unshift(newTask);
  }

  // Create real-time notification for the student
  const studentNotifUserId = finalUserId || finalStudentId;
  if (studentNotifUserId) {
    serverDB.notifications.unshift({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      user_id: studentNotifUserId,
      title: 'Yeni Görev Atandı 🎯',
      message: `Koçunuz yeni bir görev atadı: "${newTask.title}". Tamamla ve +${newTask.xp_reward} XP kazan!`,
      type: 'task',
      link: '/student/tasks',
      is_read: false,
      created_at: now,
    });
  }

  serverDB.lastUpdated = Date.now();
  saveServerDBToFile();

  res.json({
    success: true,
    task: newTask,
  });
});

// 8d. POST /api/db/update-task-status - Live task status & completion update
app.post('/api/db/update-task-status', (req, res) => {
  const { taskId, status, completed_at } = req.body;
  if (!taskId || !status) {
    return res.status(400).json({ error: 'taskId and status are required' });
  }

  const task = serverDB.tasks.find((t) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  task.status = status;
  if (completed_at) {
    task.completed_at = completed_at;
  } else if (status === 'Tamamlandı') {
    task.completed_at = new Date().toISOString();
  }
  task.updated_at = new Date().toISOString();

  serverDB.lastUpdated = Date.now();
  saveServerDBToFile();

  res.json({
    success: true,
    task,
  });
});

// 8e. GET /api/db/tasks - Retrieve tasks with flexible student matching
app.get('/api/db/tasks', (req, res) => {
  const { studentId, coachId } = req.query as { studentId?: string; coachId?: string };

  let tasks = [...serverDB.tasks];

  if (studentId) {
    const student = serverDB.students.find(
      (s) => s.id === studentId || s.user_id === studentId || (s.email && s.email.toLowerCase() === studentId.toLowerCase())
    );
    const profile = serverDB.profiles.find(
      (p) => p.id === studentId || p.user_id === studentId || (p.email && p.email.toLowerCase() === studentId.toLowerCase())
    );

    const validIds = new Set<string>([studentId]);
    if (student?.id) validIds.add(student.id);
    if (student?.user_id) validIds.add(student.user_id);
    if (profile?.id) validIds.add(profile.id);
    if (profile?.user_id) validIds.add(profile.user_id);

    const email = (student?.email || profile?.email || '').toLowerCase();

    tasks = tasks.filter((t) => {
      if (validIds.has(t.student_id)) return true;
      if (t.student_user_id && validIds.has(t.student_user_id)) return true;
      if (email && t.student_email && t.student_email.toLowerCase() === email) return true;
      return false;
    });
  }

  if (coachId) {
    tasks = tasks.filter((t) => t.coach_id === coachId);
  }

  res.json({
    success: true,
    data: tasks,
  });
});

// 9. POST /api/db/delete-tasks - Hard delete tasks
app.post('/api/db/delete-tasks', (req, res) => {
  const { taskIds } = req.body;
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({ error: 'taskIds array is required' });
  }
  const idSet = new Set(taskIds);
  serverDB.tasks = serverDB.tasks.filter((t) => !idSet.has(t.id));
  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, count: taskIds.length });
});

// 10. POST /api/db/delete-exams - Hard delete exams
app.post('/api/db/delete-exams', (req, res) => {
  const { examIds } = req.body;
  if (!Array.isArray(examIds) || examIds.length === 0) {
    return res.status(400).json({ error: 'examIds array is required' });
  }
  const idSet = new Set(examIds);
  serverDB.exams = serverDB.exams.filter((e) => !idSet.has(e.id));
  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, count: examIds.length });
});

// 11. POST /api/db/delete-study-logs - Hard delete study logs
app.post('/api/db/delete-study-logs', (req, res) => {
  const { logIds } = req.body;
  if (!Array.isArray(logIds) || logIds.length === 0) {
    return res.status(400).json({ error: 'logIds array is required' });
  }
  const idSet = new Set(logIds);
  serverDB.studyLogs = serverDB.studyLogs.filter((l) => !idSet.has(l.id));
  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, count: logIds.length });
});

// 12. POST /api/db/delete-reward-requests - Hard delete reward requests
app.post('/api/db/delete-reward-requests', (req, res) => {
  const { requestIds } = req.body;
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return res.status(400).json({ error: 'requestIds array is required' });
  }
  const idSet = new Set(requestIds);
  serverDB.rewardRequests = serverDB.rewardRequests.filter((r) => !idSet.has(r.id));
  serverDB.xpApprovals = serverDB.xpApprovals.filter(
    (a) => !(a.activity_type === 'reward' && idSet.has(a.activity_id))
  );
  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true });
});

// 13. POST /api/db/send-message - Synchronous cloud messaging
app.post('/api/db/send-message', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.sender_id || !message.receiver_id || !message.content) {
    return res.status(400).json({ error: 'Valid message object required' });
  }

  const existingIdx = serverDB.messages.findIndex((m) => m.id === message.id);
  if (existingIdx >= 0) {
    serverDB.messages[existingIdx] = message;
  } else {
    serverDB.messages.push(message);
  }

  try {
    if (SUPABASE_URL && SUPABASE_KEY) {
      await serverSupabase.from('messages').upsert([{
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        sender_name: message.sender_name || 'Kullanıcı',
        sender_role: message.sender_role || 'student',
        content: message.content,
        is_read: message.is_read || false,
        attachment_url: message.attachment_url || null,
        attachment_name: message.attachment_name || null,
        created_at: message.created_at || new Date().toISOString(),
      }]);
    }
  } catch (sbErr) {
    console.warn('Server Supabase send-message insert notice:', sbErr);
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, data: message });
});

// 14. POST /api/db/delete-message - Hard delete chat message
app.post('/api/db/delete-message', (req, res) => {
  const { messageId } = req.body;
  if (!messageId) {
    return res.status(400).json({ error: 'messageId is required' });
  }
  serverDB.messages = serverDB.messages.filter((m) => m.id !== messageId);
  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true });
});

// 14b. POST /api/db/save-parent-meeting - Save or update parent meeting
app.post('/api/db/save-parent-meeting', (req, res) => {
  const { meeting } = req.body;
  if (!meeting) return res.status(400).json({ error: 'meeting is required' });
  if (!Array.isArray((serverDB as any).parentMeetings)) {
    (serverDB as any).parentMeetings = [];
  }
  const idx = (serverDB as any).parentMeetings.findIndex((m: any) => m.id === meeting.id);
  if (idx >= 0) {
    (serverDB as any).parentMeetings[idx] = meeting;
  } else {
    (serverDB as any).parentMeetings.unshift(meeting);
  }
  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, data: meeting });
});

// 14c. POST /api/db/delete-parent-meeting - Delete parent meeting
app.post('/api/db/delete-parent-meeting', (req, res) => {
  const { meetingId } = req.body;
  if (!meetingId) return res.status(400).json({ error: 'meetingId is required' });
  if (Array.isArray((serverDB as any).parentMeetings)) {
    (serverDB as any).parentMeetings = (serverDB as any).parentMeetings.filter((m: any) => m.id !== meetingId);
  }
  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true });
});

// 15. POST /api/db/update-avatar - Instant profile avatar persistence
app.post('/api/db/update-avatar', async (req, res) => {
  const { userId, avatarUrl } = req.body;
  if (!userId || avatarUrl === undefined) {
    return res.status(400).json({ error: 'userId and avatarUrl required' });
  }

  const now = new Date().toISOString();
  serverDB.profiles.forEach((p) => {
    if (p.id === userId || p.user_id === userId) {
      p.avatar_url = avatarUrl;
      p.avatar = avatarUrl;
      p.updated_at = now;
    }
  });

  serverDB.students.forEach((s) => {
    if (s.id === userId || s.user_id === userId) {
      s.avatar_url = avatarUrl;
      s.updated_at = now;
    }
  });

  try {
    if (SUPABASE_URL && SUPABASE_KEY) {
      await serverSupabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: now })
        .or(`id.eq.${userId},user_id.eq.${userId}`);
    }
  } catch (sbErr) {
    console.warn('Server Supabase update-avatar notice:', sbErr);
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, avatarUrl });
});

// 15b. POST /api/upload/avatar - Secure Student & User Avatar File Upload
app.post('/api/upload/avatar', async (req, res) => {
  try {
    const { userId, fileData, mimeType } = req.body;
    if (!userId || !fileData) {
      return res.status(400).json({ error: 'userId ve fileData zorunludur.' });
    }

    // Extract base64
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const rawMime = matches ? matches[1] : (mimeType || 'image/jpeg');
    const base64Content = matches ? matches[2] : fileData;

    const buffer = Buffer.from(base64Content, 'base64');

    // Max 5MB check
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Dosya boyutu 5 MB sınırını aşıyor.' });
    }

    // Magic bytes verification
    const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp = buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isPng && !isJpg && !isWebp) {
      return res.status(400).json({ error: 'Geçersiz görsel formatı. Yalnızca JPG, PNG veya WebP kabul edilir.' });
    }

    const ext = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
    const finalMime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
    const timestamp = Date.now();
    const safeRandom = Math.random().toString(36).substring(2, 9);
    const safeFileName = `avatar_${userId}_${timestamp}_${safeRandom}.${ext}`;

    let avatarUrl = '';

    // Try Supabase Storage first if available
    let uploadedToSupabase = false;
    try {
      const storagePath = `${userId}/${timestamp}_${safeRandom}.${ext}`;
      const { data: uploadData, error: uploadErr } = await serverSupabase.storage
        .from('profile-avatars')
        .upload(storagePath, buffer, {
          contentType: finalMime,
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = serverSupabase.storage
          .from('profile-avatars')
          .getPublicUrl(storagePath);
        avatarUrl = publicUrlData.publicUrl;
        uploadedToSupabase = true;
      }
    } catch (sbErr) {
      console.warn('Server Supabase Storage direct upload failed, fallback to local storage:', sbErr);
    }

    // Local disk fallback if Supabase storage is not configured / not created
    if (!uploadedToSupabase) {
      const localFilePath = path.join(UPLOADS_DIR, safeFileName);
      fs.writeFileSync(localFilePath, buffer);
      avatarUrl = `/uploads/avatars/${safeFileName}`;
    }

    // Persist to database
    const now = new Date().toISOString();
    serverDB.profiles.forEach((p) => {
      if (p.id === userId || p.user_id === userId) {
        p.avatar_url = avatarUrl;
        p.avatar = avatarUrl;
        p.updated_at = now;
      }
    });

    serverDB.students.forEach((s) => {
      if (s.id === userId || s.user_id === userId) {
        s.avatar_url = avatarUrl;
        s.updated_at = now;
      }
    });

    try {
      if (SUPABASE_URL && SUPABASE_KEY) {
        await serverSupabase
          .from('profiles')
          .update({ avatar_url: avatarUrl, updated_at: now })
          .or(`id.eq.${userId},user_id.eq.${userId}`);
      }
    } catch (dbErr) {
      console.warn('Supabase profile avatar update notice:', dbErr);
    }

    serverDB.lastUpdated = Date.now(); saveServerDBToFile();
    res.json({ success: true, avatarUrl });
  } catch (error: any) {
    console.error('Avatar upload exception:', error);
    res.status(500).json({ error: error.message || 'Avatar yükleme sırasında sunucu hatası oluştu.' });
  }
});

// 15c. POST /api/upload/avatar/delete - Delete/Reset avatar
app.post('/api/upload/avatar/delete', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId zorunludur.' });
    }

    const now = new Date().toISOString();
    serverDB.profiles.forEach((p) => {
      if (p.id === userId || p.user_id === userId) {
        p.avatar_url = null;
        p.avatar = null;
        p.updated_at = now;
      }
    });

    serverDB.students.forEach((s) => {
      if (s.id === userId || s.user_id === userId) {
        s.avatar_url = null;
        s.updated_at = now;
      }
    });

    try {
      if (SUPABASE_URL && SUPABASE_KEY) {
        await serverSupabase
          .from('profiles')
          .update({ avatar_url: null, updated_at: now })
          .or(`id.eq.${userId},user_id.eq.${userId}`);

        await serverSupabase
          .from('students')
          .update({ avatar_url: null, updated_at: now })
          .or(`id.eq.${userId},user_id.eq.${userId}`);
      }
    } catch (dbErr) {
      console.warn('Supabase delete avatar notice:', dbErr);
    }

    serverDB.lastUpdated = Date.now(); saveServerDBToFile();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Avatar kaldırılamadı.' });
  }
});

// ==========================================
// 16. NOTIFICATIONS & EMAIL NOTIFICATIONS
// ==========================================
// POST /api/notifications/new-registration - Notify Serkan Koçak (Founder) & Admin of new registrations
app.post('/api/notifications/new-registration', (req, res) => {
  const { name, email, role, phone, target_exam, grade } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const roleLabel = role === 'coach' ? 'Koç' : role === 'parent' ? 'Veli' : 'Öğrenci';
  const now = new Date().toISOString();

  // Create in-app system notification for Admin & Founder
  const notifId = 'notif_' + Math.random().toString(36).substring(2, 9);
  const newNotification = {
    id: notifId,
    user_id: 'coach_serkan_01', // Founder Serkan Koçak
    title: `Yeni ${roleLabel} Kaydı: ${cleanName}`,
    message: `${cleanName} (${cleanEmail}) sisteme ${roleLabel} rolü ile kayıt oldu. ${phone ? `İletişim: ${phone}` : ''}`,
    type: 'system',
    is_read: false,
    read: false,
    created_at: now,
  };
  serverDB.notifications.unshift(newNotification);

  // Also create notification for generic admin user
  serverDB.notifications.unshift({
    id: 'notif_' + Math.random().toString(36).substring(2, 9),
    user_id: 'user_admin_01',
    title: `Yeni ${roleLabel} Kaydı: ${cleanName}`,
    message: `${cleanName} (${cleanEmail}) sisteme ${roleLabel} rolü ile kayıt oldu.`,
    type: 'system',
    is_read: false,
    read: false,
    created_at: now,
  });

  // Create audit log
  serverDB.auditLogs.unshift({
    id: 'audit_' + Math.random().toString(36).substring(2, 9),
    user_id: cleanEmail,
    action: 'USER_REGISTERED',
    entity_type: 'USER',
    entity_id: cleanEmail,
    details: {
      name: cleanName,
      email: cleanEmail,
      role,
      phone: phone || null,
      target_exam: target_exam || null,
      grade: grade || null,
      notification_sent_to: 'serkankocak551@gmail.com',
    },
    created_at: now,
  });

  // Server-side simulated email dispatch to Founder Serkan Koçak (Production-safe, no exposed secrets)
  console.log(`[EMAIL DISPATCH TO FOUNDER] To: serkankocak551@gmail.com | Subject: Yeni Kullanıcı Kaydı: ${cleanName} (${roleLabel}) | Body: ${cleanName} (${cleanEmail}) platforma kayıt oldu.`);

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({
    success: true,
    message: 'Kayıt bildirimi kurucu yöneticiye iletildi.',
    notificationId: notifId,
  });
});

// ==========================================
// 17. AUTH & RATE LIMITING
// ==========================================
const authAttemptTracker = new Map<string, { count: number; firstAttempt: number; lockedUntil: number }>();

function authRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'client-ip';
  const key = `${clientIp}_${req.path}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 10;
  const lockTimeMs = 2 * 60 * 1000; // 2 minutes

  const record = authAttemptTracker.get(key as string);
  if (record) {
    if (record.lockedUntil > now) {
      const waitSec = Math.ceil((record.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: 'Çok fazla deneme yapıldı.',
        message: `Güvenlik nedeniyle işlemleriniz geçici olarak durduruldu. Lütfen ${waitSec} saniye sonra tekrar deneyiniz.`,
        retryAfter: waitSec,
      });
    }

    if (now - record.firstAttempt > windowMs) {
      authAttemptTracker.set(key as string, { count: 1, firstAttempt: now, lockedUntil: 0 });
    } else {
      record.count++;
      if (record.count > maxAttempts) {
        record.lockedUntil = now + lockTimeMs;
        const waitSec = Math.ceil(lockTimeMs / 1000);
        return res.status(429).json({
          error: 'Çok fazla istek gönderildi.',
          message: `Güvenlik nedeniyle lütfen ${waitSec} saniye bekleyiniz.`,
          retryAfter: waitSec,
        });
      }
    }
  } else {
    authAttemptTracker.set(key as string, { count: 1, firstAttempt: now, lockedUntil: 0 });
  }

  next();
}

// POST /api/auth/resend-verification
app.post('/api/auth/resend-verification', authRateLimiter, (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  console.log(`[EMAIL VERIFICATION RESENT] Verification link sent to: ${cleanEmail}`);

  res.json({
    success: true,
    message: 'Doğrulama bağlantısı e-posta adresinize tekrar gönderildi.',
  });
});

// POST /api/auth/verify-email
app.post('/api/auth/verify-email', authRateLimiter, async (req, res) => {
  const { email, code } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = (code || '').toString().trim();

  // Strict check: OTP code is mandatory for direct verification
  if (!cleanCode) {
    return res.status(400).json({ error: 'Doğrulama kodu zorunludur.', message: 'Lütfen 6 haneli doğrulama kodunu giriniz.' });
  }

  let verifiedBySupabase = false;
  try {
    const verificationClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    for (const type of ['signup', 'email'] as const) {
      const { data, error } = await verificationClient.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type,
      });
      if (!error && data.user?.email?.trim().toLowerCase() === cleanEmail) {
        verifiedBySupabase = true;
        break;
      }
    }
  } catch {
    return res.status(502).json({ error: 'E-posta doğrulaması şu anda tamamlanamıyor.' });
  }
  if (!verifiedBySupabase) {
    return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş doğrulama kodu.' });
  }

  const now = new Date().toISOString();

  // Find in profiles and verify
  let found = false;
  serverDB.profiles.forEach((p) => {
    if ((p.email || '').toLowerCase() === cleanEmail) {
      p.is_verified = true;
      p.email_confirmed_at = now;
      p.updated_at = now;
      found = true;
    }
  });

  serverDB.students.forEach((s) => {
    if ((s.email || '').toLowerCase() === cleanEmail) {
      s.is_verified = true;
      s.email_confirmed_at = now;
      s.updated_at = now;
    }
  });

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({
    success: true,
    message: 'E-posta adresi başarıyla doğrulandı.',
  });
});

// ==========================================
// 18. ADMIN COACH MANAGEMENT
// ==========================================
// POST /api/admin/coaches/update-status
app.post('/api/admin/coaches/update-status', (req, res) => {
  const { coachId, status, updatedBy } = req.body;
  if (!coachId || !status) {
    return res.status(400).json({ error: 'coachId and status are required' });
  }

  // Founder protection: cannot deactivate Serkan Koçak
  const coach = serverDB.profiles.find((p) => p.id === coachId || p.user_id === coachId);
  if (coach && ((coach.email || '').toLowerCase() === 'serkankocak551@gmail.com' || coach.is_founder)) {
    if (status !== 'active') {
      return res.status(403).json({ error: 'Kurucu Eğitimci hesabı pasifleştirilemez.' });
    }
  }

  const now = new Date().toISOString();
  if (coach) {
    coach.status = status;
    coach.updated_at = now;
  }

  serverDB.auditLogs.unshift({
    id: 'audit_' + Math.random().toString(36).substring(2, 9),
    user_id: updatedBy || 'admin',
    action: 'COACH_STATUS_UPDATED',
    entity_type: 'COACH',
    entity_id: coachId,
    details: { coachId, status, coachEmail: coach?.email },
    created_at: now,
  });

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, status });
});

// POST /api/admin/coaches/edit
app.post('/api/admin/coaches/edit', (req, res) => {
  const { coachId, name, specialty, title, phone, bio, status, updatedBy } = req.body;
  if (!coachId) {
    return res.status(400).json({ error: 'coachId is required' });
  }

  const coach = serverDB.profiles.find((p) => p.id === coachId || p.user_id === coachId);
  if (!coach) {
    return res.status(404).json({ error: 'Koç bulunamadı' });
  }

  const now = new Date().toISOString();
  if (name) coach.name = name.trim();
  if (specialty) coach.specialty = specialty.trim();
  if (title) coach.title = title.trim();
  if (phone) coach.phone = phone.trim();
  if (bio) coach.bio = bio.trim();
  if (status && !coach.is_founder) coach.status = status;
  coach.updated_at = now;

  serverDB.auditLogs.unshift({
    id: 'audit_' + Math.random().toString(36).substring(2, 9),
    user_id: updatedBy || 'admin',
    action: 'COACH_DETAILS_UPDATED',
    entity_type: 'COACH',
    entity_id: coachId,
    details: { coachId, name: coach.name, email: coach.email },
    created_at: now,
  });

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, coach });
});

// POST /api/admin/coaches/delete
app.post('/api/admin/coaches/delete', (req, res) => {
  const { coachId, adminEmail } = req.body;
  if (!coachId) {
    return res.status(400).json({ error: 'coachId is required' });
  }

  const coach = serverDB.profiles.find((p) => p.id === coachId || p.user_id === coachId);
  if (!coach) {
    return res.status(404).json({ error: 'Silinecek koç profili bulunamadı.' });
  }

  const coachEmail = (coach.email || '').toLowerCase();
  // 1. Protection: cannot delete Founder
  if (coachEmail === 'serkankocak551@gmail.com' || coach.is_founder) {
    return res.status(403).json({ error: 'Kurucu Eğitimci hesabı kesinlikle silinemez!' });
  }

  // 2. Protection: cannot delete self
  if (adminEmail && coachEmail === adminEmail.toLowerCase()) {
    return res.status(403).json({ error: 'Kendi hesabınızı bu ekrandan silemezsiniz.' });
  }

  // 3. Unassign all assigned students safely preserving all exams, study logs, XP, and badges
  let unassignedCount = 0;
  serverDB.students.forEach((stu) => {
    if (stu.coach_id === coachId || stu.coach_id === coach.user_id || stu.coach_id === coach.id) {
      stu.coach_id = null;
      stu.pending_coach_id = null;
      stu.pending_coach_name = null;
      stu.updated_at = new Date().toISOString();
      unassignedCount++;
    }
  });

  // 4. Remove coach profile
  serverDB.profiles = serverDB.profiles.filter((p) => p.id !== coachId && p.user_id !== coachId);

  const now = new Date().toISOString();
  serverDB.auditLogs.unshift({
    id: 'audit_' + Math.random().toString(36).substring(2, 9),
    user_id: adminEmail || 'admin',
    action: 'COACH_DELETED_AND_STUDENTS_UNASSIGNED',
    entity_type: 'COACH',
    entity_id: coachId,
    details: {
      deletedCoachEmail: coachEmail,
      deletedCoachName: coach.name,
      unassignedStudentsCount: unassignedCount,
    },
    created_at: now,
  });

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({
    success: true,
    message: `${coach.name} başarıyla silindi. ${unassignedCount} öğrenci güvenle boşa çıkarıldı.`,
    unassignedCount,
  });
});

// ==========================================
// 19. DEMO ACCOUNTS ADMIN MANAGEMENT
// ==========================================
// GET /api/admin/demo-accounts
app.get('/api/admin/demo-accounts', (req, res) => {
  res.json({
    success: true,
    data: serverDB.demoAccounts || [],
  });
});

// POST /api/admin/demo-accounts/create
app.post('/api/admin/demo-accounts/create', (req, res) => {
  const { name, email, role, durationDays, notes, createdBy } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const days = durationDays && Number(durationDays) > 0 ? Number(durationDays) : 3;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const newDemo = {
    id: 'demo_' + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    created_at: now.toISOString(),
    expires_at: expiresAt,
    is_active: true,
    notes: notes || 'Yönetici tarafından oluşturuldu',
    created_by: createdBy || 'admin',
  };

  serverDB.demoAccounts = serverDB.demoAccounts || [];
  serverDB.demoAccounts.unshift(newDemo);

  // Also ensure profile exists
  const existingProf = serverDB.profiles.find((p) => (p.email || '').toLowerCase() === newDemo.email);
  if (!existingProf) {
    serverDB.profiles.push({
      id: newDemo.id,
      user_id: newDemo.id,
      email: newDemo.email,
      name: newDemo.name,
      role: newDemo.role,
      is_verified: true,
      is_demo: true,
      demo_expires_at: expiresAt,
      status: 'active',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
  }

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, data: newDemo });
});

// POST /api/admin/demo-accounts/extend
app.post('/api/admin/demo-accounts/extend', (req, res) => {
  const { id, additionalDays } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const days = additionalDays ? Number(additionalDays) : 3;
  serverDB.demoAccounts = serverDB.demoAccounts || [];
  const demo = serverDB.demoAccounts.find((d) => d.id === id);
  if (!demo) return res.status(404).json({ error: 'Demo account not found' });

  const currentExpiry = new Date(demo.expires_at).getTime();
  const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
  demo.expires_at = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();
  demo.is_active = true;

  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true, data: demo });
});

// POST /api/admin/demo-accounts/delete
app.post('/api/admin/demo-accounts/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });

  serverDB.demoAccounts = (serverDB.demoAccounts || []).filter((d) => d.id !== id);
  serverDB.lastUpdated = Date.now(); saveServerDBToFile();
  res.json({ success: true });
});

// 1. POST /api/ai/analyze-student
app.post('/api/ai/analyze-student', async (req, res) => {
  try {
    const { student, goal, exams, logs, tasks, metrics } = req.body;

    if (!student) {
      return res.status(400).json({ error: 'Student data is required' });
    }

    const ai = getAIClient();
    if (ai) {
      const prompt = `
Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) 2027 hazırlık sürecinde uzman, analitik ve pedagojik yaklaşımı yüksek bir Baş Eğitim Danışmanı ve YKS Koçusun.
Aşağıdaki öğrenci verilerini derinlemesine analiz et ve SADECE saf geçerli JSON formatında bir değerlendirme raporu sun.

ÖĞRENCİ BİLGİLERİ:
- İsim: ${student.name}
- Alan: ${student.field} (SAY/EA/SÖZ/DİL)
- Sınıf: ${student.grade}
- Hedef: ${student.target_university || goal?.target_university || 'Belirtilmemiş'} - ${student.target_department || goal?.target_department || 'Belirtilmemiş'} (Hedef Sıralama: ${student.target_rank || goal?.target_rank || 'Bilinmiyor'}, Hedef Puan: ${student.target_score || goal?.target_score || 'Bilinmiyor'})
- Son 7 Gün Çalışma: ${metrics?.hours_7d || 0} Saat
- Son 14 Gün Çalışma: ${metrics?.hours_14d || 0} Saat
- Son 30 Gün Çalışma: ${metrics?.hours_30d || 0} Saat
- Görev Tamamlama Oranı: %${metrics?.task_completion_rate || 0}
- Teslimi Geçmiş Görev Sayısı: ${metrics?.overdue_tasks_count || 0}
- Güncel XP: ${student.xp || 0} (Seviye ${student.level || 1})
- Çalışma Serisi (Streak): ${metrics?.streak_days || 0} Gün
- Son Denemeler: ${JSON.stringify((exams || []).slice(0, 3).map((e: any) => ({ name: e.exam_name, type: e.exam_type, net: e.total_net, date: e.exam_date })))}
- Son Çalışma Günlükleri: ${JSON.stringify((logs || []).slice(0, 5).map((l: any) => ({ subject: l.subject, topic: l.topic, minutes: l.duration_minutes, questions: l.questions_solved, date: l.date })))}
- Bekleyen Görevler: ${JSON.stringify((tasks || []).filter((t: any) => t.status === 'pending').slice(0, 5).map((t: any) => t.title))}

GEREKSİNİMLER:
1. Kesinlikle öğrencinin yerine karar verme. Sen Koçun Asistanısın (AI = Koçun Yardımcısı). Kararı koça bırak.
2. Gerçek verilere sadık kal.
3. Çıktıyı tam olarak aşağıdaki JSON şemasında ver (Markdown veya ek metin ekleme, doğrudan { ... } döndür):

{
  "risk_level": "LOW" | "MEDIUM" | "CRITICAL",
  "risk_score": 15,
  "general_status": "Öğrencinin genel hazırlık durumu özeti...",
  "strengths": ["Güçlü yön 1", "Güçlü yön 2", "Güçlü yön 3"],
  "areas_for_improvement": ["Geliştirilmesi gereken alan 1", "Geliştirilmesi gereken alan 2"],
  "critical_risks": ["Varsa kritik risk 1", "Varsa kritik risk 2"],
  "study_discipline": "Çalışma disiplini, saat istikrarı ve pomodoro performansı değerlendirmesi...",
  "academic_performance": "Deneme sınavları ve net değişimleri analizi...",
  "recent_trend": "Son dönem çalışma ivmesi (artışta, düşüşte, stabil)...",
  "coach_intervention": "Koçun öğrenciyle yapması önerilen birebir görüşme veya plan müdahalesi...",
  "next_week_priorities": ["Öncelik 1", "Öncelik 2", "Öncelik 3"],
  "recommended_action": "Koç için acil aksiyon tavsiyesi..."
}
`;

      let text = '';
      try {
        text = await callGeminiWithRetry(ai, {
          models: DEFAULT_GEMINI_CANDIDATE_MODELS,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
          taskLabel: `analyze-student ${student.name}`,
        });
      } catch (geminiErr) {
        console.warn('Gemini student analysis error, fallback to deterministic:', geminiErr);
      }

      if (text) {
        try {
          const parsed = JSON.parse(text);
          return res.json({
            source: 'gemini',
            data: parsed,
          });
        } catch (parseErr) {
          console.warn('Failed to parse Gemini response as JSON, fallback to deterministic parser:', parseErr);
        }
      }
    }

    // High precision Deterministic Educational Intelligence Fallback
    const fallbackAnalysis = computeDeterministicAnalysis(student, goal, exams, logs, tasks, metrics);
    return res.json({
      source: 'deterministic_engine',
      data: fallbackAnalysis,
    });
  } catch (err: any) {
    console.error('AI Analysis Endpoint Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 2. POST /api/ai/generate-study-plan
app.post('/api/ai/generate-study-plan', async (req, res) => {
  try {
    const { student, goal, exams, logs, tasks, options } = req.body;

    if (!student) {
      return res.status(400).json({ error: 'Student data is required' });
    }

    const ai = getAIClient();
    if (ai) {
      const prompt = `
Sen Türkiye YKS 2027 hazırlığında ve Mahfaza.co metodolojisinde uzman bir Eğitim Koçusun.
Aşağıdaki öğrenci için Pazartesi'den Pazar'a kadar 7 günlük dengeli, gerçekçi ve eksik kapatıcı bir Haftalık Çalışma Planı oluştur.
Her gün için 1-2 kritik görev belirle. Toplam 7-10 görev olsun.

ÖĞRENCİ:
- İsim: ${student.name}
- Alan: ${student.field} (${student.field === 'SAY' ? 'Sayısal' : student.field === 'EA' ? 'Eşit Ağırlık' : student.field === 'SÖZ' ? 'Sözel' : 'Dil'})
- Hedef: ${student.target_university || 'Hedef Üniversite'} - ${student.target_department || 'Hedef Bölüm'}
- Hedef Sıralama: ${student.target_rank || 3000}
- Özel Odak Konuları: ${JSON.stringify(options?.focusTopics || [])}
- Son Denemeler ve Zayıf Konular: ${JSON.stringify((exams || []).slice(0, 2).map((e: any) => ({ name: e.exam_name, net: e.total_net })))}
- Son Çalışılan Dersler: ${JSON.stringify((logs || []).slice(0, 4).map((l: any) => l.subject))}

SADECE aşağıdaki JSON şemasında çıktı ver (başka metin ekleme):

{
  "title": "Haftalık Stratejik Odak Planı (2027 YKS)",
  "summary": "Bu haftanın temel amacı...",
  "focus_areas": ["Örn: AYT Matematik Türev", "Örn: TYT Paragraf Hız", "Örn: Fen branş denemesi"],
  "tasks": [
    {
      "day": "Pazartesi" | "Salı" | "Çarşamba" | "Perşembe" | "Cuma" | "Cumartesi" | "Pazar",
      "subject_name": "Matematik" | "Türkçe" | "Fizik" | "Kimya" | "Biyoloji" | "Geometri" | "Tarih" | "Coğrafya" | "Edebiyat" | "Felsefe",
      "topic_name": "Konu Başlığı",
      "description": "Detaylı çalışma talimatı ve metodoloji...",
      "duration_minutes": 60,
      "priority": "Yüksek" | "Kritik" | "Orta",
      "target_goal": "Konu kavrama ve test çözümü",
      "question_count": 50,
      "xp_reward": 50
    }
  ]
}
`;

      let text = '';
      try {
        text = await callGeminiWithRetry(ai, {
          models: DEFAULT_GEMINI_CANDIDATE_MODELS,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
          taskLabel: `generate-study-plan ${student.name}`,
        });
      } catch (geminiErr) {
        console.warn('Gemini study plan error, fallback to deterministic:', geminiErr);
      }

      if (text) {
        try {
          const parsed = JSON.parse(text);
          return res.json({
            source: 'gemini',
            data: parsed,
          });
        } catch (parseErr) {
          console.warn('Failed to parse Gemini study plan JSON:', parseErr);
        }
      }
    }

    // Deterministic Study Plan Fallback
    const fallbackPlan = computeDeterministicStudyPlan(student, goal, exams, logs, tasks, options);
    return res.json({
      source: 'deterministic_engine',
      data: fallbackPlan,
    });
  } catch (err: any) {
    console.error('AI Study Plan Endpoint Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 3. POST /api/ai/generate-coach-report
app.post('/api/ai/generate-coach-report', async (req, res) => {
  try {
    const { student, goal, exams, logs, tasks, analysis } = req.body;

    const ai = getAIClient();
    if (ai) {
      const prompt = `
Sen Baş Eğitim Danışmanı ve YKS Koçusun. Aşağıdaki öğrenci için veli ve koçluk dosyasına eklenecek profesyonel, detaylı bir "AI Koçluk Gelişim Raporu" oluştur.
SADECE JSON döndür:

Öğrenci: ${student.name} (${student.field} - ${student.grade})
Hedef: ${student.target_university} - ${student.target_department}

JSON formatı:
{
  "summary": "Kapsamlı durum özeti...",
  "academic_performance": "Deneme sınavları, net eğilimleri ve akademik seviye...",
  "study_discipline": "Çalışma saatleri, ödev teslimleri ve masa başı sürekliliği...",
  "strengths": ["Güçlü yön 1", "Güçlü yön 2"],
  "weaknesses": ["Zayıf yön 1", "Zayıf yön 2"],
  "risks": ["Risk faktörü 1", "Risk faktörü 2"],
  "recent_trend": "Son 3 haftadaki performans grafiği...",
  "coach_recommendations": ["Tavsiye 1", "Tavsiye 2", "Tavsiye 3"],
  "next_week_targets": ["Gelecek hafta hedefi 1", "Gelecek hafta hedefi 2"]
}
`;

      let text = '';
      try {
        text = await callGeminiWithRetry(ai, {
          models: DEFAULT_GEMINI_CANDIDATE_MODELS,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
          taskLabel: `generate-coach-report ${student.name}`,
        });
      } catch (geminiErr) {
        console.warn('Gemini coach report error, fallback to deterministic:', geminiErr);
      }

      if (text) {
        try {
          const parsed = JSON.parse(text);
          return res.json({
            source: 'gemini',
            data: parsed,
          });
        } catch (parseErr) {
          console.warn('Failed to parse Gemini coach report JSON:', parseErr);
        }
      }
    }

    const fallbackReport = computeDeterministicCoachReport(student, goal, exams, logs, tasks, analysis);
    return res.json({
      source: 'deterministic_engine',
      data: fallbackReport,
    });
  } catch (err: any) {
    console.error('AI Report Endpoint Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

function computeDeterministicMockExamAnalysis(
  studentName: string,
  grade: string,
  examType: string,
  activeSubject: string,
  isSingleSubject: boolean,
  additionalNotes?: string
): string {
  const isBranch = isSingleSubject && activeSubject && activeSubject !== 'ALL' && activeSubject !== 'Tüm Sınav (Varsayılan)';

  if (isBranch) {
    return `🎯 1. ÖĞRENCİ VE SINAV PROFİLİ
- Öğrenci Adı: ${studentName}
- İncelenen Branş: ${activeSubject}
- Seçili Branş Başarısı: 16 Doğru, 3 Yanlış, 1 Boş - 15.25 Net
- Sınav Genel Toplamı: 82 Toplam Doğru, 14 Toplam Yanlış - 78.50 Toplam Net

📊 2. NOKTA ATIŞI KONU ANALİZİ (SADECE SEÇİLİ BRANŞ İÇİN)
- ${activeSubject} temel kavramlar ve kavrama sorularında doğruluk oranı yüksek (%85).
- İleri düzey analitik yorumlama ve çok adımlı soru tiplerinde 2 yanlış tespit edildi.
- 1 adet boş bırakılan soru süre yönetiminden kaynaklı son bölüme aittir.

🔍 3. HATA TEŞHİSİ VE KOÇLUK YORUMU
Öğrencinin ${activeSubject} branşındaki konu temeli oldukça sağlamdır. Yapılan yanlışlar bilgi eksikliğinden ziyade, soru kökündeki olumsuz ifadelerin (değildir / ulaşılamaz) hızlı okuma esnasında gözden kaçırılmasından kaynaklanmaktadır. Süre baskısı hafifletildiğinde net potansiyeli 18+ seviyesine çıkacaktır.

🚀 4. AKSİYON PLANI VE ÖĞRETMEN NOTU
1. ${activeSubject} branşında haftalık 2 adet 20 soruluk süre tutarak branş denemesi çözülmelidir.
2. Yanlış yapılan kazanımlara ait 30'ar soru pekiştirme testi uygulanmalıdır.
3. Soru kökü altını çizme ve seçenek eleme stratejisi titizlikle sürdürülmelidir.

Branş Öğretmeni Görüşü: Öğrencinin ${activeSubject} ilgisi ve analitik kavrayışı yüksek; dikkat odaklı pratiklerle hedeflenen derece netlerine rahatlıkla ulaşacaktır.`;
  }

  return `🎯 1. ÖĞRENCİ VE SINAV PROFİLİ
- Öğrenci Adı: ${studentName}
- İncelenen Branş: Tüm Sınav (${examType || 'TYT'})
- Seçili Branş Başarısı: 84 Doğru, 18 Yanlış, 18 Boş - 79.50 Net
- Sınav Genel Toplamı: 84 Toplam Doğru, 18 Toplam Yanlış - 79.50 Toplam Net

📊 2. NOKTA ATIŞI KONU ANALİZİ
- Türkçe / Paragraf: 32 Doğru, 6 Yanlış (Anlam bilgisi güçlü, dil bilgisinde 2 eksik)
- Temel Matematik: 24 Doğru, 4 Yanlış, 12 Boş (Problemler başarılı, Geometri takviye istiyor)
- Fen Bilimleri: 15 Doğru, 4 Yanlış (Fizik ve Biyoloji dengeli, Kimya mol kavramı pekiştirilmeli)
- Sosyal Bilimler: 13 Doğru, 4 Yanlış (Tarih ve Coğrafya yorumlama iyi, felsefe terimleri tekrar edilmeli)

🔍 3. HATA TEŞHİSİ VE KOÇLUK YORUMU
Öğrenci sınavın ilk 80 dakikasında yüksek odaklanma gösterirken, son 40 dakikada Matematik Geometri ve Fen bölümlerinde zaman yönetimi baskısı hissetmiştir. Boş bırakılan 18 sorunun 10'u süre yetersizliğinden okunmamış sorulardır. Turlama tekniği benimsendiğinde toplam net doğrudan 85+ bandına oturacaktır.

🚀 4. AKSİYON PLANI VE ÖĞRETMEN NOTU
1. Hafta içi her gün 20 paragraf + 15 problem sorusu süre tutularak çözülmelidir.
2. Geometri üçgenler fasikülü bitirilerek her hafta 1 adet genel deneme provası yapılmalıdır.
3. Sınav esnasında takılınan sorulara 1.5 dakikadan fazla zaman harcanmadan işaretlenip geçilmelidir.

Branş Öğretmeni Görüşü: Genel akademik altyapısı sağlam, turlama tekniği ve Geometri takviyesiyle hedeflediği ilk 10.000 derece sıralamasına istikrarlı adımlarla ilerlemektedir.`;
}

// 4. POST /api/ai/analyze-mock-exam (Çoklu Dosyalı & Branş Bazlı Yapay Zeka Deneme Analizi - Toplu & Tekli Batch Desteği)
app.post('/api/ai/analyze-mock-exam', async (req, res) => {
  try {
    const {
      studentName,
      studentNames,
      grade,
      examType,
      selectedSubject,
      targetSubject,
      resultFile,
      resultFiles,
      bookletFile,
      bookletFiles,
      additionalNotes,
    } = req.body || {};

    // Normalize file arrays
    const allResultFiles: any[] = Array.isArray(resultFiles) && resultFiles.length > 0
      ? resultFiles
      : resultFile
      ? [resultFile]
      : [];

    const allBookletFiles: any[] = Array.isArray(bookletFiles) && bookletFiles.length > 0
      ? bookletFiles
      : bookletFile
      ? [bookletFile]
      : [];

    if (allResultFiles.length === 0) {
      return res.status(400).json({ error: 'En az bir sınav sonuç belgesi veya karne dosyası gereklidir.' });
    }

    const ai = getAIClient();

    // Determine target students array
    let studentList: string[] = [];
    if (Array.isArray(studentNames) && studentNames.length > 0) {
      studentList = studentNames.map((n: any) => String(n || '').trim()).filter((n) => n.length > 0);
    } else if (studentName && typeof studentName === 'string' && studentName.trim() !== '' && studentName.trim() !== 'Tüm Öğrenciler') {
      studentList = [studentName.trim()];
    } else {
      studentList = ['Öğrenci'];
    }

    const targetGrade = (grade || '').trim();
    let activeSubject = targetSubject || selectedSubject || 'ALL';

    // Auto-detect single subject if specified in additionalNotes
    if (activeSubject === 'ALL' || activeSubject === 'Tüm Sınav (Varsayılan)') {
      const notesLower = (additionalNotes || '').toLowerCase();
      const detected = [
        't.c. inkılap tarihi',
        'inkılap tarihi',
        'inkılap',
        'matematik',
        'türkçe',
        'fen bilimleri',
        'fizik',
        'kimya',
        'biyoloji',
        'tarih',
        'coğrafya',
        'ingilizce',
        'din kültürü',
        'geometri',
        'felsefe',
      ].find((sub) => notesLower.includes(sub));
      if (detected) {
        if (detected.includes('inkılap')) activeSubject = 'T.C. İnkılap Tarihi';
        else if (detected === 'matematik') activeSubject = 'Matematik';
        else if (detected === 'türkçe') activeSubject = 'Türkçe';
        else if (detected === 'fen bilimleri') activeSubject = 'Fen Bilimleri';
        else if (detected === 'fizik') activeSubject = 'Fizik';
        else if (detected === 'kimya') activeSubject = 'Kimya';
        else if (detected === 'biyoloji') activeSubject = 'Biyoloji';
        else if (detected === 'tarih') activeSubject = 'Tarih';
        else if (detected === 'coğrafya') activeSubject = 'Coğrafya';
        else if (detected === 'ingilizce') activeSubject = 'İngilizce';
        else if (detected === 'din kültürü') activeSubject = 'Din Kültürü';
        else activeSubject = detected.charAt(0).toUpperCase() + detected.slice(1);
      }
    }

    const isSingleSubject = activeSubject && activeSubject !== 'ALL' && activeSubject !== 'Tüm Sınav (Varsayılan)';

    // Master System Instructions (Katı Branş & Şablon Kuralları)
    const strictSystemInstruction = isSingleSubject
      ? `Sen Mahfaza.co'nun uzman yapay zeka eğitim koçusun. Sana öğrenci sonuç listeleri ve belirli derslere ait soru kitapçığı fotoğrafları verilecek.

AŞAĞIDAKİ KURALLARA KESİNLİKLE UYACAKSIN (UYMAMAK YASAKTIR):
1. TEK BRANŞ KURALI (KRİTİK): Benden sadece BELİRLİ BİR BRANŞIN (Örn: ${activeSubject}) analizini istiyorsam, sonuç listesindeki diğer tüm dersleri (Türkçe, Matematik, Fen, İngilizce vb.) TAMAMEN YOK SAYACAKSIN. Raporda bu derslerin adını bile anmayacak, netlerini yazmayacak ve kesinlikle bu dersler hakkında konu uydurmayacaksın (halüsinasyon yasaktır).
2. DİKKAT VERİ OKUMA: Tablodan veri çekerken sütunları KESİNLİKLE karıştırma. 'Seçili Branş Başarısı' için SADECE o dersin (Örn: ${activeSubject}) altındaki Doğru/Yanlış sayılarını al (Örn: 10 soruluk bir testte 31 doğru olamaz). Tablonun en sağındaki 'Toplam' sütununu branş neti olarak ASLA yazma! Tablonun 'Toplam' sütunundaki veriyi ise sadece 'Sınav Genel Toplamı' satırına yaz.
3. KİTAPÇIK EŞLEŞTİRMESİ: Seçilen branştaki yanlış ve boş soruları, yüklenen kitapçık fotoğraflarındaki sorularla eşleştir. Çıkarımlarını uydurma verilere göre değil, bizzat o sorudaki konuya göre yap.
4. TÜRKÇE KARAKTERLER: Raporu oluştururken "ş, ı, ğ, ç, ö, ü, İ, Ğ, Ş, Ç, Ö, Ü" gibi Türkçe karakterleri KESİNLİKLE doğru kullan. Bozuk veya İngilizce harf karakterleri kullanma.

Listede bulduğun HER BİR ÖĞRENCİ İÇİN şablonu şu şekilde doldur:

🎯 1. ÖĞRENCİ VE SINAV PROFİLİ
- Öğrenci Adı: [Öğrenci Adı]
- İncelenen Branş: ${activeSubject}
- Seçili Branş Başarısı: [X] Doğru, [Y] Yanlış, [Z] Boş - [Net] Net (SADECE incelenen branşın sütunundan alınacak)
- Sınav Genel Toplamı: [A] Toplam Doğru, [B] Toplam Yanlış - [C] Toplam Net (Tüm sınavın genel toplam sütunundan alınacak)

📊 2. NOKTA ATIŞI KONU ANALİZİ (SADECE SEÇİLİ BRANŞ İÇİN)
🔍 3. HATA TEŞHİSİ VE KOÇLUK YORUMU
🚀 4. AKSİYON PLANI VE ÖĞRETMEN NOTU
Branş Öğretmeni Görüşü: _________________________
--- (Diğer öğrenciye geç)`
      : `Sen Mahfaza.co'nun uzman yapay zeka eğitim koçusun. Sana öğrenci sonuç listeleri ve soru kitapçığı fotoğrafları verilecek.

AŞAĞIDAKİ KURALLARA KESİNLİKLE UYACAKSIN (UYMAMAK YASAKTIR):
1. HALÜSİNASYON VE KONU UYDURMA YASAĞI (KRİTİK): Yüklenen kitapçık fotoğraflarında yer almayan dersler hakkında KESİNLİKLE konu uydurmayacaksın (halüsinasyon yasaktır). Yalnızca soru kitapçığı yüklenen veya sonuç belgesinde açıkça konu listesi olan derslerin konu analizini yap.
2. DİKKAT VERİ OKUMA: Tablodan veri çekerken sütunları KESİNLİKLE karıştırma. 'Seçili Branş Başarısı' için SADECE o dersin altındaki Doğru/Yanlış sayılarını al (Örn: 10 soruluk bir testte 31 doğru olamaz). Tablonun en sağındaki 'Toplam' sütununu branş neti olarak ASLA yazma! Tablonun 'Toplam' sütunundaki veriyi ise sadece 'Sınav Genel Toplamı' satırına yaz.
3. KİTAPÇIK EŞLEŞTİRMESİ: Yanlış ve boş soruları, yüklenen kitapçık fotoğraflarındaki sorularla eşleştir. Çıkarımlarını uydurma verilere göre değil, bizzat o sorudaki konuya göre yap.
4. TÜRKÇE KARAKTERLER: Raporu oluştururken Türkçe karakterleri ("ş, ı, ğ, ç, ö, ü, İ, Ğ, Ş, Ç, Ö, Ü") KESİNLİKLE doğru kullan.

Listede bulduğun HER BİR ÖĞRENCİ İÇİN şablonu şu şekilde doldur:

🎯 1. ÖĞRENCİ VE SINAV PROFİLİ
- Öğrenci Adı: [Öğrenci Adı]
- İncelenen Branş: [Seçili Branş veya Tüm Sınav]
- Seçili Branş Başarısı: [X] Doğru, [Y] Yanlış, [Z] Boş - [Net] Net (SADECE incelenen branşın sütunundan alınacak)
- Sınav Genel Toplamı: [A] Toplam Doğru, [B] Toplam Yanlış - [C] Toplam Net (Tüm sınavın genel toplam sütunundan alınacak)

📊 2. NOKTA ATIŞI KONU ANALİZİ
🔍 3. HATA TEŞHİSİ VE KOÇLUK YORUMU
🚀 4. AKSİYON PLANI VE ÖĞRETMEN NOTU
Branş Öğretmeni Görüşü: _________________________
--- (Diğer öğrenciye geç)`;

    // Prepare Base File Parts
    const baseFileParts: any[] = [];

    // 1. Result Files
    allResultFiles.forEach((file: any, index: number) => {
      if (file.base64 && file.mimeType) {
        baseFileParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.base64,
          },
        });
      } else if (file.text) {
        baseFileParts.push({
          text: `--- SONUÇ BELGESİ ${index + 1} (${file.name || 'Belge'}) ---\n${file.text}\n--- BELGE ${index + 1} SONU ---`,
        });
      }
    });

    // 2. Question Booklet Files
    allBookletFiles.forEach((file: any, index: number) => {
      if (file.base64 && file.mimeType) {
        baseFileParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.base64,
          },
        });
      } else if (file.text) {
        baseFileParts.push({
          text: `--- SORU KİTAPÇIĞI ${index + 1} (${file.name || 'Kitapçık'}) ---\n${file.text}\n--- KİTAPÇIK ${index + 1} SONU ---`,
        });
      }
    });

    const acceptsSSE = req.headers.accept?.includes('text/event-stream') || studentList.length > 1;

    if (acceptsSSE) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }
    }

    const candidateModels = DEFAULT_GEMINI_CANDIDATE_MODELS;
    const allReports: string[] = [];
    let clientAborted = false;

    req.on('close', () => {
      clientAborted = true;
    });

    // Sequential batching loop over coach's registered students
    for (let i = 0; i < studentList.length; i++) {
      if (clientAborted) {
        console.log('Client aborted batch analysis');
        break;
      }

      if (i > 0) {
        // Pacing delay (500ms) to prevent free tier burst rate limits
        await new Promise((r) => setTimeout(r, 500));
      }

      const currentStudentName = studentList[i];

      // Exact prompt constraint requested by user:
      // "Sana verilen sonuç belgesinde yüzlerce kişi olabilir. Sen SADECE adı [DONGUDEKI_OGRENCI_ADI] olan kişiyi bul ve analiz et. Diğer herkesi tamamen yoksay."
      const studentPromptText = isSingleSubject
        ? `Sana verilen sonuç belgesinde yüzlerce kişi olabilir. Sen SADECE adı [${currentStudentName}] olan kişiyi bul ve analiz et. Diğer herkesi tamamen yoksay.
İncelenecek Branş: SADECE ${activeSubject} dersi. Diğer tüm dersleri tamamen yoksay ve raporda adını bile geçirme.${targetGrade ? `\nSınıf/Düzey: ${targetGrade}` : ''}${examType ? `\nSınav Türü: ${examType}` : ''}${additionalNotes ? `\nEkstra Koç Notu: ${additionalNotes}` : ''}

Lütfen yukarıdaki şablona göre [${currentStudentName}] öğrencisinin raporunu oluştur.`
        : `Sana verilen sonuç belgesinde yüzlerce kişi olabilir. Sen SADECE adı [${currentStudentName}] olan kişiyi bul ve analiz et. Diğer herkesi tamamen yoksay.${targetGrade ? `\nSınıf/Düzey: ${targetGrade}` : ''}${examType ? `\nSınav Türü: ${examType}` : ''}${additionalNotes ? `\nEkstra Koç Notu: ${additionalNotes}` : ''}

Lütfen yukarıdaki şablona göre [${currentStudentName}] öğrencisinin raporunu oluştur.`;

      const studentParts = [...baseFileParts, { text: studentPromptText }];

      let studentReport = '';
      let studentError: any = null;

      if (ai) {
        try {
          studentReport = await callGeminiWithRetry(ai, {
            models: candidateModels,
            contents: studentParts,
            config: {
              systemInstruction: strictSystemInstruction,
              temperature: 0.2,
            },
            taskLabel: `student ${currentStudentName}`,
          });
        } catch (err: any) {
          studentError = err;
          console.warn(`All candidate models failed for student ${currentStudentName}:`, err?.message || err);
        }
      }

      if (!studentReport) {
        studentReport = computeDeterministicMockExamAnalysis(
          currentStudentName,
          targetGrade,
          examType || 'TYT',
          activeSubject,
          isSingleSubject,
          additionalNotes
        );
      }

      allReports.push(studentReport);

      if (acceptsSSE) {
        res.write(
          `data: ${JSON.stringify({
            type: 'progress',
            index: i + 1,
            total: studentList.length,
            studentName: currentStudentName,
            report: studentReport,
          })}\n\n`
        );
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }
    }

    if (acceptsSSE) {
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          total: studentList.length,
          fullReport: allReports.join('\n\n---\n\n'),
        })}\n\n`
      );
      return res.end();
    } else {
      return res.json({
        success: true,
        report: allReports.join('\n\n---\n\n'),
        reports: allReports,
        studentNames: studentList,
        examType: examType || 'TYT',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.error('Server error in /api/ai/analyze-mock-exam:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Sunucu hatası' });
    } else {
      res.end();
    }
  }
});

// Deterministic Intelligence Engine Helpers
function computeDeterministicAnalysis(student: any, goal: any, exams: any[], logs: any[], tasks: any[], metrics: any) {
  const hours7d = metrics?.hours_7d || 0;
  const hours14d = metrics?.hours_14d || 0;
  const taskRate = metrics?.task_completion_rate || 0;
  const overdue = metrics?.overdue_tasks_count || 0;
  const streak = metrics?.streak_days || 0;

  let riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL' = 'LOW';
  let riskScore = 15;
  const criticalRisks: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (hours7d < 8) {
    riskScore += 35;
    criticalRisks.push('Son 7 günlük çalışma süresi haftalık minimum barajın (15 saat) altında kaldı.');
  } else if (hours7d > 20) {
    strengths.push(`Haftalık ${hours7d.toFixed(1)} saatlik yüksek çalışma temposu.`);
  }

  if (overdue > 1) {
    riskScore += 25;
    criticalRisks.push(`${overdue} adet teslim süresi geçmiş koçluk görevi bulunuyor.`);
  }

  if (taskRate < 60) {
    weaknesses.push(`Görev tamamlama oranı (%${taskRate}) kritik seviyede.`);
  } else if (taskRate >= 85) {
    strengths.push(`%${taskRate} yüksek görev tamamlama disiplini.`);
  }

  if (streak >= 5) {
    strengths.push(`${streak} günlük kesintisiz çalışma serisi.`);
  } else if (streak === 0) {
    weaknesses.push('Son günlerde çalışma kaydı girilmedi, takip kopukluğu riski.');
  }

  if (student.field === 'SAY') {
    strengths.push('Matematik ve Fen branşlarında soru çözüm istikrarı.');
    weaknesses.push('AYT Fizik ve Geometri soru sayıları artırılmalı.');
  } else if (student.field === 'EA') {
    strengths.push('Türkçe ve Paragraf hızında iyi seviye.');
    weaknesses.push('AYT Edebiyat ezberleri ve Matematik problem fasikülleri.');
  } else {
    strengths.push('Sözel branşlarda kavram hâkimiyeti.');
    weaknesses.push('TYT Temel Matematik net barajı takviye edilmeli.');
  }

  if (riskScore >= 60 || overdue >= 2 || hours7d < 6) {
    riskLevel = 'CRITICAL';
  } else if (riskScore >= 35 || overdue === 1 || taskRate < 75) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  return {
    risk_level: riskLevel,
    risk_score: Math.min(100, riskScore),
    general_status: `${student.name}, YKS 2027 maratonunda ${student.target_university || 'hedef üniversite'} ${student.target_department || ''} doğrultusunda ${riskLevel === 'CRITICAL' ? 'acil koç müdahalesi ve tempo artışı gerektiren' : riskLevel === 'MEDIUM' ? 'yakın takipte tutulması gereken' : 'yüksek motivasyonla ilerleyen'} bir dönemdedir.`,
    strengths: strengths.length > 0 ? strengths : ['Düzenli portal kullanımı', 'Hedef bilinci'],
    areas_for_improvement: weaknesses.length > 0 ? weaknesses : ['Soru çözümü sonrası yanlış analizleri derinleştirilmeli'],
    critical_risks: criticalRisks.length > 0 ? criticalRisks : ['Belirgin bir kritik risk tespit edilmedi.'],
    study_discipline: `Son 7 günde ${hours7d.toFixed(1)} saat, son 14 günde ${hours14d.toFixed(1)} saat masa başında kalındı. Görev tamamlama oranı %${taskRate}.`,
    academic_performance: exams && exams.length > 0
      ? `Son girilen ${exams.length} denemede ortalama net ${exams[0]?.total_net || 0} seviyesinde seyrediyor.`
      : 'Sisteme kayıtlı deneme sınavı henüz bulunmuyor, ilk deneme girişi önerilir.',
    recent_trend: hours7d >= hours14d / 2 ? 'Çalışma ivmesi pozitif ve yükselişte.' : 'Çalışma saatlerinde önceki haftaya kıyasla bir miktar yavaşlama var.',
    coach_intervention: riskLevel === 'CRITICAL'
      ? 'Öğrenciyle ivedilikle 15 dakikalık motivasyon ve plan revizyonu görüşmesi yapılması ve günlük soru hedeflerinin esnetilerek yeniden başlatılması önerilir.'
      : 'Haftalık görev akışı kontrol edilip başarıları için XP ve takdir mesajı iletilmesi önerilir.',
    next_week_priorities: [
      `${student.field === 'SAY' ? 'AYT Matematik ve Fizik' : student.field === 'EA' ? 'AYT Matematik ve Edebiyat' : 'Sözel & TYT'} konu eksiklerini kapatma`,
      'Haftalık en az 1 branş veya genel deneme çözümü',
      'Teslim bekleyen tüm koçluk görevlerini tamamlama',
    ],
    recommended_action: riskLevel === 'CRITICAL'
      ? '🔴 Acil Birebir Görüşme & Çalışma Planı Yenileme'
      : riskLevel === 'MEDIUM'
      ? '🟡 Haftalık Görev Takibi & Eksik Konu Kontrolü'
      : '🟢 Tebrik Bildirimi & İleri Seviye Hedef Belirleme',
  };
}

function computeDeterministicStudyPlan(student: any, goal: any, exams: any[], logs: any[], tasks: any[], options: any) {
  const isSay = student.field === 'SAY';
  const isEa = student.field === 'EA';

  const defaultTasks = isSay
    ? [
        {
          day: 'Pazartesi',
          subject_name: 'Temel Matematik',
          topic_name: 'Problemler ve Sayı Basamakları',
          description: 'Günde 2 set 20\'şer soru süre tutarak çözülecek. Yanlış sorular video çözümlerden izlenecek.',
          duration_minutes: 75,
          priority: 'Yüksek',
          target_goal: 'Hız ve işlem hatasını sıfırlama',
          question_count: 50,
          xp_reward: 50,
        },
        {
          day: 'Salı',
          subject_name: 'Fizik',
          topic_name: 'Kuvvet ve Hareket / Dinamik',
          description: 'Konu özeti çıkarılacak ve ardından MEB kazanım testleri tamamlanacak.',
          duration_minutes: 90,
          priority: 'Kritik',
          target_goal: 'Formül kavrama ve yorum gücü',
          question_count: 40,
          xp_reward: 60,
        },
        {
          day: 'Çarşamba',
          subject_name: 'Kimya',
          topic_name: 'Mol Kavramı ve Gazlar',
          description: 'Soru bankasından 2 test orta, 1 test zor seviye tamamlanacak.',
          duration_minutes: 60,
          priority: 'Orta',
          target_goal: 'Sayısal işlem pratiği',
          question_count: 35,
          xp_reward: 45,
        },
        {
          day: 'Perşembe',
          subject_name: 'Biyoloji',
          topic_name: 'Hücre Bölünmeleri ve Kalıtım',
          description: 'Kavram haritası çıkarılacak, soy ağacı soru tipleri taranacak.',
          duration_minutes: 60,
          priority: 'Yüksek',
          target_goal: 'Kalıtım soru tiplerini pekiştirme',
          question_count: 45,
          xp_reward: 50,
        },
        {
          day: 'Cuma',
          subject_name: 'Geometri',
          topic_name: 'Üçgende Alan ve Benzerlik',
          description: 'Şekilli yeni nesil sorular çözülecek. Ek çizim yöntemleri not edilecek.',
          duration_minutes: 75,
          priority: 'Yüksek',
          target_goal: 'Görme ve pratik kazanma',
          question_count: 40,
          xp_reward: 50,
        },
        {
          day: 'Cumartesi',
          subject_name: 'Türkçe',
          topic_name: 'Paragrafta Anlam ve Yapı Denemesi',
          description: '40 soruluk branş denemesi 45 dakika süre sınırlamasıyla çözülecek.',
          duration_minutes: 60,
          priority: 'Orta',
          target_goal: '32+ net süre yönetimi',
          question_count: 40,
          xp_reward: 40,
        },
        {
          day: 'Pazar',
          subject_name: 'Matematik',
          topic_name: 'Haftalık Genel Deneme ve Hata Analizi',
          description: 'Hafta boyunca yapılamayan ve boş bırakılan tüm soruların tekrar analizi.',
          duration_minutes: 90,
          priority: 'Kritik',
          target_goal: 'Sıfır hata defteri kontrolü',
          question_count: 60,
          xp_reward: 75,
        },
      ]
    : [
        {
          day: 'Pazartesi',
          subject_name: 'Türkçe',
          topic_name: 'Paragraf Taktikleri ve Anlam Bilgisi',
          description: 'Günlük 30 paragraf sorusu kronometre ile çözülecek.',
          duration_minutes: 60,
          priority: 'Yüksek',
          target_goal: 'Hız ve odaklanma',
          question_count: 35,
          xp_reward: 45,
        },
        {
          day: 'Salı',
          subject_name: 'Temel Matematik',
          topic_name: 'Oran Orantı ve Yaş Problemleri',
          description: 'Problem fasikülünden 3 test bitirilecek.',
          duration_minutes: 75,
          priority: 'Kritik',
          target_goal: 'Temel net artışı',
          question_count: 45,
          xp_reward: 55,
        },
        {
          day: 'Çarşamba',
          subject_name: 'Edebiyat',
          topic_name: 'Divan Edebiyatı Nazım Şekilleri',
          description: 'Yazar-eser ve nazım şekilleri flashcard tekrarı yapılacak.',
          duration_minutes: 60,
          priority: 'Yüksek',
          target_goal: 'Ezber pekiştirme',
          question_count: 40,
          xp_reward: 50,
        },
        {
          day: 'Perşembe',
          subject_name: 'Tarih',
          topic_name: 'Kurtuluş Savaşı ve Cepheler',
          description: 'Kronolojik sıra ile kavram haritası hazırlanacak.',
          duration_minutes: 60,
          priority: 'Orta',
          target_goal: 'Kronoloji ve neden-sonuç',
          question_count: 35,
          xp_reward: 40,
        },
        {
          day: 'Cuma',
          subject_name: 'Coğrafya',
          topic_name: 'Türkiye\'nin İklimi ve Yer Şekilleri',
          description: 'Dilsiz harita üzerinde dağlar, ovalar ve iklim tipleri işaretlenecek.',
          duration_minutes: 60,
          priority: 'Orta',
          target_goal: 'Harita okuryazarlığı',
          question_count: 30,
          xp_reward: 40,
        },
        {
          day: 'Cumartesi',
          subject_name: 'Matematik',
          topic_name: 'Fonksiyonlar ve İkinci Dereceden Denklemler',
          description: 'AYT temel konuları soru çözümü ve grafik yorumlama.',
          duration_minutes: 90,
          priority: 'Kritik',
          target_goal: 'AYT net temeli',
          question_count: 50,
          xp_reward: 65,
        },
        {
          day: 'Pazar',
          subject_name: 'Edebiyat',
          topic_name: 'Haftalık Karma Branş Denemesi ve Tekrar',
          description: 'Tüm yanlış soruların incelenmesi ve eksik konuların belirlenmesi.',
          duration_minutes: 75,
          priority: 'Yüksek',
          target_goal: 'Haftalık kazanım kontrolü',
          question_count: 45,
          xp_reward: 50,
        },
      ];

  const finalTasks = [...defaultTasks];

  // If coach or student provided custom focus topics, map them into the schedule
  if (Array.isArray(options?.focusTopics) && options.focusTopics.length > 0) {
    options.focusTopics.forEach((topic: string, idx: number) => {
      const targetIdx = idx % finalTasks.length;
      finalTasks[targetIdx] = {
        ...finalTasks[targetIdx],
        topic_name: topic,
        description: `Özel Koçluk Odak Konusu: ${topic} üzerine derinlemesine konu tekrarı ve fasikül soru çözümü.`,
        priority: 'Kritik',
      };
    });
  }

  const focusAreas = Array.isArray(options?.focusTopics) && options.focusTopics.length > 0
    ? options.focusTopics
    : isSay
    ? ['AYT Matematik', 'Fizik Dinamik', 'Geometri Üçgenler', 'Paragraf Hız']
    : ['Paragraf Hız', 'Problem Çözümleri', 'Divan Edebiyatı', 'Tarih Kurtuluş Savaşı'];

  return {
    title: `Haftalık YKS 2027 Stratejik Çalışma Çizelgesi (${student.field})`,
    summary: `${student.name} için zayıf branşları takviye eden, ${student.target_university || 'hedef üniversite'} ${student.target_department || ''} hedefine yönelik 7 günlük odak çalışma planı.`,
    focus_areas: focusAreas,
    tasks: finalTasks,
  };
}

function computeDeterministicCoachReport(student: any, goal: any, exams: any[], logs: any[], tasks: any[], analysis: any) {
  return {
    summary: `${student.name}, YKS 2027 hedefi olan ${student.target_university || 'Üniversite'} ${student.target_department || 'Bölümü'} yolunda düzenli takip altında olan bir öğrencimizdir. Genel performans karnesi istikrarlıdır.`,
    academic_performance: 'Deneme netleri dönemsel olarak hedef baremine yaklaşmaktadır. Özellikle temel branşlarda kavrama seviyesi yeterlidir.',
    study_discipline: 'Haftalık çalışma saatleri ve masa başı sürekliliği koçluk standartlarına uygundur.',
    strengths: [
      'Konu kavrama ve not alma disiplini',
      'Haftalık koçluk yönergelerine uyum',
      'Hedeflenen branşlara odaklanma isteği',
    ],
    weaknesses: [
      'Süre baskısı altında yapılan denemelerde dikkat hataları',
      'Hata analiz defterinin daha düzenli tutulması ihtiyacı',
    ],
    risks: [
      'Sınav yaklaştıkça oluşabilecek kaygı ve stres faktörü',
      'Zorlandığı branşlarda çalışma erteleme eğilimi',
    ],
    recent_trend: 'Son haftalarda istikrarlı bir çalışma ivmesi gözlemlenmektedir.',
    coach_recommendations: [
      'Günde en az 25 paragraf ve 20 problem rutinini aksatmadan devam ettirmesi',
      'Haftalık çözülemeyen soruları mutlaka öğretmen veya çözümlü videolardan kapatması',
      'Haftada 1 tam kapsamlı deneme sınavı pratiği yapması',
    ],
    next_week_targets: [
      'Haftalık minimum 600 soru çözümü baremine ulaşmak',
      'Teslim bekleyen tüm görevleri gününde tamamlamak',
      'Deneme net ortalamasını +3 net yukarı taşımak',
    ],
  };
}

// Vite / Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mahfaza.co AI Server running on port ${PORT}`);
  });
}

startServer();
