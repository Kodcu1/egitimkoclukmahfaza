import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION & CANONICAL DEFINITIONS
// ============================================================================

export const CANONICAL_DOMAIN = process.env.CANONICAL_DOMAIN || 'mahfaza.co';
export const FOUNDER_EMAIL = 'serkankocak551@gmail.com';
export const FOUNDER_COACH_ID = '2b1feeed-890a-430a-8360-dd103034649b';
export const PRO_EXPIRATION_DATE = '2027-07-01T00:00:00.000Z';
export const DEFAULT_PASSWORD = process.env.INITIAL_STUDENT_PASSWORD || 'Mahfaza2027!';

export interface StudentInput {
  fullName: string;
  examType: 'YKS' | 'LGS';
  grade: '12. Sınıf' | '8. Sınıf';
  field: 'SAY' | 'EA' | 'LGS';
  targetUniversity: string;
  targetDepartment: string;
  targetRank: number;
  targetScore: number;
}

// 26 Students: 14 YKS + 12 LGS
export const SEED_STUDENTS: StudentInput[] = [
  // 14 YKS Students
  {
    fullName: 'ELA GÖKÇE BARAN',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'Boğaziçi Üniversitesi',
    targetDepartment: 'Endüstri Mühendisliği',
    targetRank: 2500,
    targetScore: 490,
  },
  {
    fullName: 'SUDE NUR BODUR',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'İstanbul Teknik Üniversitesi',
    targetDepartment: 'Bilgisayar Mühendisliği',
    targetRank: 3000,
    targetScore: 485,
  },
  {
    fullName: 'MERVE BOZKOYUN',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'EA',
    targetUniversity: 'Koç Üniversitesi',
    targetDepartment: 'Hukuk Fakültesi',
    targetRank: 1200,
    targetScore: 505,
  },
  {
    fullName: 'HÜMEYRA DOĞAN',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'Hacettepe Üniversitesi',
    targetDepartment: 'Tıp Fakültesi',
    targetRank: 1800,
    targetScore: 512,
  },
  {
    fullName: 'MELİS DURAN',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'EA',
    targetUniversity: 'Boğaziçi Üniversitesi',
    targetDepartment: 'İşletme',
    targetRank: 2100,
    targetScore: 482,
  },
  {
    fullName: 'GÜLASER EREN',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'Orta Doğu Teknik Üniversitesi',
    targetDepartment: 'Havacılık ve Uzay Mühendisliği',
    targetRank: 2200,
    targetScore: 495,
  },
  {
    fullName: 'BÜŞRA KAYMAKÇI',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'İstanbul Üniversitesi - Cerrahpaşa',
    targetDepartment: 'Tıp Fakültesi',
    targetRank: 2400,
    targetScore: 502,
  },
  {
    fullName: 'BUHARA BUSE KIRATLI',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'Yıldız Teknik Üniversitesi',
    targetDepartment: 'Mimarlık',
    targetRank: 8500,
    targetScore: 465,
  },
  {
    fullName: 'MELEK NAZ KUZUCU',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'EA',
    targetUniversity: 'Galatasaray Üniversitesi',
    targetDepartment: 'Hukuk Fakültesi',
    targetRank: 950,
    targetScore: 510,
  },
  {
    fullName: 'TAHA EREN KUZUCU',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'İstanbul Teknik Üniversitesi',
    targetDepartment: 'Yapay Zekâ ve Veri Mühendisliği',
    targetRank: 1500,
    targetScore: 508,
  },
  {
    fullName: 'MEHMET EFE UCUZOVA',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'Orta Doğu Teknik Üniversitesi',
    targetDepartment: 'Makine Mühendisliği',
    targetRank: 3200,
    targetScore: 488,
  },
  {
    fullName: 'CEYLİN SUDE ÇAKAL',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'EA',
    targetUniversity: 'Koç Üniversitesi',
    targetDepartment: 'Hukuk Fakültesi',
    targetRank: 1500,
    targetScore: 505,
  },
  {
    fullName: 'BUĞLEM ÜSTÜNER',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'SAY',
    targetUniversity: 'Hacettepe Üniversitesi',
    targetDepartment: 'Tıp Fakültesi',
    targetRank: 1800,
    targetScore: 510,
  },
  {
    fullName: 'HİLAL HÜSNİYE ŞİMŞEK',
    examType: 'YKS',
    grade: '12. Sınıf',
    field: 'EA',
    targetUniversity: 'Boğaziçi Üniversitesi',
    targetDepartment: 'İşletme',
    targetRank: 2000,
    targetScore: 485,
  },

  // 12 LGS Students
  {
    fullName: 'MEHMET SALİH AK',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Ankara Fen Lisesi',
    targetDepartment: 'Fen Lisesi / İlk %0.5',
    targetRank: 400,
    targetScore: 492,
  },
  {
    fullName: 'KEREM ERKEN',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'İstanbul Erkek Lisesi',
    targetDepartment: 'Fen Lisesi / İlk %0.3',
    targetRank: 250,
    targetScore: 496,
  },
  {
    fullName: 'METİN YAĞIZ GÖKDEMİR',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Kabataş Erkek Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %0.6',
    targetRank: 500,
    targetScore: 488,
  },
  {
    fullName: 'HÜSEYİN ARDA KONUKÇU',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'İzmir Fen Lisesi',
    targetDepartment: 'Fen Lisesi / İlk %0.5',
    targetRank: 420,
    targetScore: 490,
  },
  {
    fullName: 'SAMET METİN',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Galatasaray Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %0.2',
    targetRank: 150,
    targetScore: 498,
  },
  {
    fullName: 'MUHAMMED BERA SARAÇ',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Cağaloğlu Anadolu Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %0.8',
    targetRank: 650,
    targetScore: 485,
  },
  {
    fullName: 'SERTUĞ UTBE SORGUN',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Ankara Atatürk Anadolu Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %1.0',
    targetRank: 800,
    targetScore: 480,
  },
  {
    fullName: 'MİHRİMAH TOPSAKAL',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Kadıköy Anadolu Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %0.7',
    targetRank: 550,
    targetScore: 487,
  },
  {
    fullName: 'ECRİN ÇAKMAK',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Haydarpaşa Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %0.9',
    targetRank: 700,
    targetScore: 484,
  },
  {
    fullName: 'ÖMER FARUK ÖZKAN',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Beşiktaş Anadolu Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %1.2',
    targetRank: 900,
    targetScore: 478,
  },
  {
    fullName: 'HAYDAR BERK ÖZLÜK',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Vefa Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %1.4',
    targetRank: 1100,
    targetScore: 474,
  },
  {
    fullName: 'MUSTAFA EYMEN ŞAHİN',
    examType: 'LGS',
    grade: '8. Sınıf',
    field: 'LGS',
    targetUniversity: 'Hüseyin Avni Sözen Anadolu Lisesi',
    targetDepartment: 'Anadolu Lisesi / İlk %0.8',
    targetRank: 620,
    targetScore: 486,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function normalizeTurkish(text: string): string {
  return text
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

export function toTurkishTitleCase(str: string): string {
  return str
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase('tr-TR');
      return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
    })
    .join(' ');
}

export function generateMatchCode(normalizedName: string): string {
  return `STU-${normalizedName.toUpperCase().slice(0, 10)}-2027`;
}

// ============================================================================
// MAIN SEED SCRIPT
// ============================================================================

export async function runAdminSeed(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun || process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

  console.log('='.repeat(75));
  console.log('MAHFAZA.CO — 26 ÖĞRENCİ PRODUCTION ENROLLMENT & SEED SİSTEMİ');
  console.log('='.repeat(75));
  console.log(`Canonical Email Domain : ${CANONICAL_DOMAIN}`);
  console.log(`Hedef Öğrenci Sayısı   : ${SEED_STUDENTS.length} (14 YKS + 12 LGS)`);
  console.log(`Çalışma Modu           : ${isDryRun ? 'DRY-RUN (Simülasyon)' : 'CANLI PRODUCTION İŞLEMİ'}`);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://lljzumduvnzenydiopnc.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vVNBi3PqvKVaHLSQ7d_zZQ_78l_mBGx';

  const hasServiceRole = Boolean(serviceRoleKey && serviceRoleKey.trim().length > 10);
  const clientKey = hasServiceRole ? serviceRoleKey! : anonKey;

  console.log(`Supabase Bağlantı Tipi : ${hasServiceRole ? 'Service Role (Admin API)' : 'Secure Public Client API'}`);

  // Base client for checking records
  const baseClient = createClient(supabaseUrl, clientKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify Serkan Koçak coach_id in remote database
  let resolvedCoachId = FOUNDER_COACH_ID;
  try {
    const { data: coachUser } = await baseClient
      .from('profiles')
      .select('id, user_id, email, name, role')
      .eq('email', FOUNDER_EMAIL)
      .maybeSingle();

    if (coachUser && (coachUser.user_id || coachUser.id)) {
      resolvedCoachId = coachUser.user_id || coachUser.id;
      console.log(`[Serkan Hoca] Remote DB'de doğrulandı: ${resolvedCoachId} (${coachUser.name})`);
    } else {
      console.log(`[Serkan Hoca] Sabit UUID kullanılıyor: ${resolvedCoachId}`);
    }
  } catch (err: any) {
    console.warn(`[Serkan Hoca] Profil sorgulama uyarısı: ${err.message}`);
  }

  // Fetch all existing students from remote Supabase for matching
  let remoteStudentsList: any[] = [];
  try {
    const { data: remoteStu } = await baseClient.from('students').select('*');
    if (remoteStu) remoteStudentsList = remoteStu;
    console.log(`[Remote Supabase] students tablosunda ${remoteStudentsList.length} kayıt mevcut.`);
  } catch (err: any) {
    console.warn(`[Remote Supabase] Öğrenci listesi alınamadı: ${err.message}`);
  }

  // Load Local Database
  const dbPath = path.join(process.cwd(), 'uploads', 'data', 'server_db.json');
  let localDb: any = {
    profiles: [],
    students: [],
    studentEntitlements: [],
    subscriptions: [],
    subscriptionPlans: [],
  };

  if (fs.existsSync(dbPath)) {
    try {
      localDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {
      console.warn('server_db.json okunamadı, boş nesne oluşturuluyor.');
    }
  }

  const results: Array<{
    name: string;
    email: string;
    examType: string;
    authStatus: string;
    studentStatus: string;
    coachStatus: string;
    proStatus: string;
    xpStatus: string;
  }> = [];

  let authSuccessCount = 0;
  let studentSuccessCount = 0;
  let coachSuccessCount = 0;
  let proSuccessCount = 0;

  // Process each of the 26 students
  for (let i = 0; i < SEED_STUDENTS.length; i++) {
    const stu = SEED_STUDENTS[i];
    const normalizedName = normalizeTurkish(stu.fullName);
    const canonicalEmail = `${normalizedName}@${CANONICAL_DOMAIN}`;
    const formattedName = toTurkishTitleCase(stu.fullName);
    const matchCode = generateMatchCode(normalizedName);

    let authStatus = 'skipped';
    let studentStatus = 'skipped';
    let coachStatus = 'skipped';
    let proStatus = 'local_pro_entitled';
    let xpStatus = 'initial (0 XP)';
    let studentUserId: string | null = null;
    let studentRecordId: string | null = null;

    if (!isDryRun) {
      // 1. AUTH ACCOUNT CREATION & AUTHENTICATION
      // Create dedicated per-student client to manage session safely
      const studentClient = createClient(supabaseUrl, clientKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      try {
        // Try sign-in first
        const { data: signInData, error: signInErr } = await studentClient.auth.signInWithPassword({
          email: canonicalEmail,
          password: DEFAULT_PASSWORD,
        });

        if (signInData?.user?.id) {
          studentUserId = signInData.user.id;
          authStatus = 'existing_auth_verified';
          authSuccessCount++;
        } else {
          // Sign-up new account
          const { data: signUpData, error: signUpErr } = await studentClient.auth.signUp({
            email: canonicalEmail,
            password: DEFAULT_PASSWORD,
            options: {
              data: {
                name: formattedName,
                role: 'student',
                username: normalizedName,
              },
            },
          });

          if (signUpData?.user?.id) {
            studentUserId = signUpData.user.id;
            authStatus = 'created_and_verified';
            authSuccessCount++;

            // Establish active session
            await studentClient.auth.signInWithPassword({
              email: canonicalEmail,
              password: DEFAULT_PASSWORD,
            });
          } else if (signUpErr?.message?.includes('already registered')) {
            authStatus = 'already_registered';
            authSuccessCount++;
          } else {
            authStatus = 'auth_error: ' + (signUpErr?.message || 'unknown');
          }
        }
      } catch (err: any) {
        authStatus = 'auth_error: ' + err.message;
      }

      // 2. REMOTE SUPABASE: PUBLIC.STUDENTS TABLE UPDATE/INSERT
      try {
        // Find existing record in remote Supabase by user_id, canonical email, legacy email, or name
        const existingRemote = remoteStudentsList.find(
          (s) =>
            (studentUserId && s.user_id === studentUserId) ||
            s.email?.toLowerCase() === canonicalEmail.toLowerCase() ||
            s.email?.toLowerCase().includes(normalizedName) ||
            normalizeTurkish(s.name || '') === normalizedName
        );

        studentRecordId = existingRemote?.id || (studentUserId || 'stu_' + normalizedName);
        const existingXp = existingRemote?.xp ?? 0;
        const existingLevel = existingRemote?.level ?? 1;

        if (existingRemote) {
          xpStatus = `preserved (${existingXp} XP, Lvl ${existingLevel})`;
        } else {
          xpStatus = 'initialized (0 XP, Lvl 1)';
        }

        // Student payload conforming to remote schema
        const studentPayload: any = {
          id: studentRecordId,
          user_id: studentUserId || studentRecordId,
          coach_id: resolvedCoachId,
          name: formattedName,
          email: canonicalEmail,
          grade: stu.grade,
          field: stu.field,
          target_exam: stu.examType,
          match_code: matchCode,
          target_university: stu.targetUniversity,
          target_department: stu.targetDepartment,
          target_rank: stu.targetRank,
          target_score: stu.targetScore,
          xp: existingXp,
          level: existingLevel,
          risk_score: 0,
          risk_level: 'LOW',
          updated_at: new Date().toISOString(),
        };

        const { error: upsertErr } = await studentClient
          .from('students')
          .upsert(studentPayload, { onConflict: 'id' });

        if (!upsertErr) {
          studentStatus = existingRemote ? 'remote_student_updated' : 'remote_student_created';
          studentSuccessCount++;
        } else {
          studentStatus = 'remote_upsert_notice: ' + upsertErr.message;
        }

        // 3. REMOTE SUPABASE: COACH_STUDENT_LINKS
        const { error: linkErr } = await studentClient.from('coach_student_links').upsert(
          {
            coach_id: resolvedCoachId,
            student_id: studentRecordId,
            status: 'active',
          },
          { onConflict: 'coach_id,student_id' }
        );

        if (!linkErr || linkErr.code === '23505') {
          coachStatus = 'linked_active';
          coachSuccessCount++;
        } else {
          coachStatus = 'link_error: ' + linkErr.message;
        }
      } catch (err: any) {
        studentStatus = 'error: ' + err.message;
      }

      // 4. PRO ENTITLEMENT SYSTEM (uploads/data/server_db.json)
      // Mahfaza.co loads active PRO status through checkStudentEntitlement via localDb
      if (!localDb.profiles) localDb.profiles = [];
      if (!localDb.students) localDb.students = [];
      if (!localDb.studentEntitlements) localDb.studentEntitlements = [];
      if (!localDb.subscriptions) localDb.subscriptions = [];

      const targetId = studentRecordId || 'stu_' + normalizedName;

      // Upsert local student
      let localStu = localDb.students.find(
        (s: any) =>
          s.id === targetId ||
          s.email?.toLowerCase() === canonicalEmail.toLowerCase() ||
          normalizeTurkish(s.name || '') === normalizedName
      );

      const localXp = localStu?.xp ?? 0;
      const localLevel = localStu?.level ?? 1;

      if (localStu) {
        localStu.email = canonicalEmail;
        localStu.name = formattedName;
        localStu.coach_id = resolvedCoachId;
        localStu.grade = stu.grade;
        localStu.field = stu.field;
        localStu.target_exam = stu.examType;
        localStu.target_university = stu.targetUniversity;
        localStu.target_department = stu.targetDepartment;
        localStu.target_rank = stu.targetRank;
        localStu.target_score = stu.targetScore;
        localStu.total_xp = localStu.total_xp ?? localXp;
        localStu.spendable_xp = localStu.spendable_xp ?? localXp;
        localStu.xp = localStu.total_xp;
        localStu.level = localLevel;
        localStu.streak = localStu.streak ?? 0;
      } else {
        localDb.students.push({
          id: targetId,
          user_id: studentUserId || targetId,
          coach_id: resolvedCoachId,
          name: formattedName,
          email: canonicalEmail,
          grade: stu.grade,
          field: stu.field,
          target_exam: stu.examType,
          match_code: matchCode,
          target_university: stu.targetUniversity,
          target_department: stu.targetDepartment,
          target_rank: stu.targetRank,
          target_score: stu.targetScore,
          total_xp: 0,
          spendable_xp: 0,
          xp: 0,
          level: 1,
          streak: 0,
          risk_score: 0,
          risk_level: 'LOW',
          risk_reasons: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Upsert local profile
      let localProf = localDb.profiles.find(
        (p: any) =>
          p.id === targetId ||
          p.email?.toLowerCase() === canonicalEmail.toLowerCase() ||
          normalizeTurkish(p.name || '') === normalizedName
      );

      if (localProf) {
        localProf.email = canonicalEmail;
        localProf.name = formattedName;
        localProf.full_name = formattedName;
        localProf.role = 'student';
        localProf.coach_id = resolvedCoachId;
        localProf.grade = stu.grade;
        localProf.field = stu.field;
        localProf.target_exam = stu.examType;
        localProf.is_verified = true;
        localProf.status = 'active';
      } else {
        localDb.profiles.push({
          id: targetId,
          user_id: studentUserId || targetId,
          email: canonicalEmail,
          name: formattedName,
          full_name: formattedName,
          role: 'student',
          coach_id: resolvedCoachId,
          grade: stu.grade,
          field: stu.field,
          target_exam: stu.examType,
          is_verified: true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Upsert student entitlement (PRO)
      let localEnt = localDb.studentEntitlements.find(
        (e: any) => e.student_id === targetId || e.student_email === canonicalEmail
      );

      if (localEnt) {
        localEnt.student_name = formattedName;
        localEnt.student_email = canonicalEmail;
        localEnt.access_tier = 'pro';
        localEnt.valid_until = PRO_EXPIRATION_DATE;
        localEnt.is_active = true;
      } else {
        localDb.studentEntitlements.push({
          id: 'ent_' + normalizedName,
          student_id: targetId,
          student_name: formattedName,
          student_email: canonicalEmail,
          access_tier: 'pro',
          granted_by: 'Serkan KOÇAK Eğitim Koçluğu (Kurucu Bursu)',
          reason: `${stu.examType} 2026-2027 Akademik Koçluk PRO Lisansı`,
          valid_until: PRO_EXPIRATION_DATE,
          is_active: true,
          included_private_lessons: 1,
          used_private_lessons: 0,
          remaining_private_lessons: 1,
          created_at: new Date().toISOString(),
        });
      }

      // Upsert subscription
      let localSub = localDb.subscriptions.find((s: any) => s.user_id === targetId);
      if (localSub) {
        localSub.plan_id = 'plan_pro';
        localSub.status = 'active';
        localSub.billing_cycle = 'yearly';
        localSub.current_period_end = PRO_EXPIRATION_DATE;
      } else {
        localDb.subscriptions.push({
          id: 'sub_' + normalizedName,
          user_id: targetId,
          plan_id: 'plan_pro',
          status: 'active',
          billing_cycle: 'yearly',
          current_period_start: new Date().toISOString(),
          current_period_end: PRO_EXPIRATION_DATE,
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      proStatus = 'pro_entitled_active';
      proSuccessCount++;
    } else {
      authStatus = 'would_create_or_verify';
      studentStatus = 'would_update_student';
      coachStatus = 'would_link_coach';
      proStatus = 'would_entitle_pro';
    }

    results.push({
      name: formattedName,
      email: canonicalEmail,
      examType: stu.examType,
      authStatus,
      studentStatus,
      coachStatus,
      proStatus,
      xpStatus,
    });
  }

  // Save updated local database file
  if (!isDryRun) {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2), 'utf-8');
      console.log('\n[LocalDB] uploads/data/server_db.json başarıyla güncellendi.');
    } catch (e: any) {
      console.warn('[LocalDB] Dosya yazılamadı:', e.message);
    }
  }

  // Summary Table
  console.log('\n' + '-'.repeat(120));
  console.log(
    `#  | ${'Öğrenci Adı'.padEnd(24)} | ${'Canonical E-posta'.padEnd(30)} | ${'Sınav'.padEnd(5)} | ${'Auth'.padEnd(22)} | ${'Student'.padEnd(24)} | ${'Coach'.padEnd(14)} | ${'PRO'}`
  );
  console.log('-'.repeat(120));

  results.forEach((r, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    console.log(
      `${num} | ${r.name.padEnd(24)} | ${r.email.padEnd(30)} | ${r.examType.padEnd(5)} | ${r.authStatus.padEnd(22)} | ${r.studentStatus.padEnd(24)} | ${r.coachStatus.padEnd(14)} | ${r.proStatus}`
    );
  });
  console.log('-'.repeat(120));
  console.log(`\nÖzet Sonuçlar:`);
  console.log(`- Auth Hesapları  : ${authSuccessCount}/26`);
  console.log(`- Öğrenci Kaydı   : ${studentSuccessCount}/26`);
  console.log(`- Koç Bağlantısı  : ${coachSuccessCount}/26 (Serkan Koçak)`);
  console.log(`- PRO Entitlement : ${proSuccessCount}/26`);

  return {
    success: true,
    totalProcessed: results.length,
    authSuccessCount,
    studentSuccessCount,
    coachSuccessCount,
    proSuccessCount,
    results,
  };
}

// CLI Execution entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminSeed().catch((err) => {
    console.error('Seed script hatası:', err);
    process.exit(1);
  });
}
