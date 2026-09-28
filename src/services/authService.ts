import { UserProfile, UserRole } from '../types';
import { db } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/authUrls';

export interface RegisterParams {
  email: string;
  password?: string;
  username?: string;
  name: string;
  role: UserRole;
  institutionKey?: string; // required for coach: 'mahfaza'
  matchCode?: string;      // required for parent
  phone?: string;
  phoneNumber?: string;
}

export const INSTITUTION_KEY = 'mahfaza';
export const DEMO_EMAILS: string[] = [];

export function isBypassedEmail(_email?: string | null): boolean {
  return false;
}

export class AuthService {
  static async demoLogin(role: 'coach' | 'student' | 'parent'): Promise<UserProfile> {
    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Demo girişi başarısız oldu.');
    }

    const json = await res.json();
    const { session, profile } = json;

    // Establish real Supabase Auth session in the browser client
    if (isSupabaseConfigured && supabase && session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }

    // Ensure profile is synced locally
    await db.upsertProfile(profile);
    return profile;
  }

  static async login(email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const isFounder = cleanEmail === 'serkankocak551@gmail.com';

    // Route demo accounts cleanly through the server-side Supabase Auth flow
    if (cleanEmail === 'koc@mahfaza.co' || cleanEmail === 'demo.koc@mahfaza.co') {
      if (import.meta.env.PROD) {
        throw new Error('Demo hesapları üretim ortamında kullanılamaz. Lütfen gerçek hesabınızla giriş yapınız.');
      }
      return this.demoLogin('coach');
    }
    if (cleanEmail === 'ogrenci@mahfaza.co' || cleanEmail === 'demo.ogrenci@mahfaza.co') {
      if (import.meta.env.PROD) {
        throw new Error('Demo hesapları üretim ortamında kullanılamaz. Lütfen gerçek hesabınızla giriş yapınız.');
      }
      return this.demoLogin('student');
    }
    if (cleanEmail === 'veli@mahfaza.co' || cleanEmail === 'demo.veli@mahfaza.co') {
      if (import.meta.env.PROD) {
        throw new Error('Demo hesapları üretim ortamında kullanılamaz. Lütfen gerçek hesabınızla giriş yapınız.');
      }
      return this.demoLogin('parent');
    }

    if (!password) {
      throw new Error('Lütfen şifrenizi giriniz.');
    }

    // 1. If live Supabase is configured, authenticate strictly with Supabase Auth
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          let profile = await db.getProfileByEmail(cleanEmail);
          if (profile) {
            profile.is_verified = false;
            profile.email_confirmed_at = null;
            return profile;
          }
        }
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'E-posta adresi veya şifre hatalı. Lütfen kontrol ediniz.'
            : error.message
        );
      }

      if (data?.user) {
        if (data.user.user_metadata?.is_deleted || data.user.user_metadata?.status === 'disabled') {
          await supabase.auth.signOut();
          throw new Error('Bu hesap kullanıma kapatılmıştır.');
        }

        const authUserId = data.user.id;
        let profile = (await db.getProfile(authUserId)) || (await db.getProfileByEmail(cleanEmail));

        if (profile && (profile.name?.includes('[DELETED DEMO]') || (profile.status as string) === 'disabled')) {
          await supabase.auth.signOut();
          throw new Error('Bu hesap kullanıma kapatılmıştır.');
        }

        if (!profile) {
          // Create profile with real Supabase Auth UUID
          const metaRole = data.user.user_metadata?.role || (isFounder ? 'head_coach' : 'student');
          const metaName = data.user.user_metadata?.name || (isFounder ? 'Serkan KOÇAK' : cleanEmail.split('@')[0]);
          profile = {
            id: authUserId,
            user_id: authUserId,
            email: cleanEmail,
            name: metaName,
            role: metaRole,
            is_verified: true,
            is_founder: isFounder || cleanEmail === 'mahfaza.co@gmail.com',
            status: 'active',
            created_at: data.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await db.createProfile(profile);
        } else {
          // Guarantee profile uses real Supabase Auth UUID
          profile.id = authUserId;
          profile.user_id = authUserId;
          if (data.user.email_confirmed_at) {
            profile.is_verified = true;
            profile.email_confirmed_at = data.user.email_confirmed_at;
          }
          await db.updateProfile(authUserId, {
            user_id: authUserId,
            is_verified: profile.is_verified,
          });
        }
        return profile;
      }

      throw new Error('Kullanıcı oturumu doğrulanamadı.');
    }

    // 2. Offline / Development ONLY fallback
    const profile = await db.getProfileByEmail(cleanEmail);
    if (!profile) {
      throw new Error('E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.');
    }

    return profile;
  }

  static async register(params: RegisterParams): Promise<UserProfile> {
    const cleanEmail = params.email.trim().toLowerCase();

    // 1. Role-specific safety validations & Privilege Escalation Prevention
    let assignedRole: UserRole = 'student';
    if (params.role === 'coach') {
      if (!params.institutionKey || params.institutionKey.trim() !== INSTITUTION_KEY) {
        throw new Error('Geçersiz Kurum Kayıt Anahtarı! Koç hesabı açabilmek için yetkili kurum anahtarını girmelisiniz.');
      }
      assignedRole = 'coach';
    } else if (params.role === 'parent') {
      if (!params.matchCode || !params.matchCode.trim()) {
        throw new Error('Veli kaydı için geçerli bir "Öğrenci Eşleşme Kodu" zorunludur.');
      }
      const matchedStudent = await db.getStudentByMatchCode(params.matchCode.trim());
      if (!matchedStudent) {
        throw new Error('Girilen eşleşme koduna ait öğrenci bulunamadı. Lütfen öğrencinizden doğru kodu temin edin.');
      }
      assignedRole = 'parent';
    } else if (params.role === 'student') {
      assignedRole = 'student';
    } else {
      // Privileged roles (admin, org_admin, head_coach) cannot be self-assigned via public signup
      throw new Error('Yönetici ve özel yetkili hesaplar doğrudan kayıt formu ile oluşturulamaz.');
    }

    // 2. Check if email already exists in profiles
    const existing = await db.getProfileByEmail(cleanEmail);
    if (existing) {
      throw new Error('Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır.');
    }

    // 3. Create profile defaults
    let newUserId = 'user_' + Math.random().toString(36).substring(2, 9);
    const phoneVal = params.phoneNumber || params.phone;
    const isFounder = cleanEmail === 'serkankocak551@gmail.com';
    const isSpecialBypass = isBypassedEmail(cleanEmail);

    // 4. If Supabase is live, sign up with Supabase Auth + real confirmation redirect
    if (isSupabaseConfigured && supabase) {
      try {
        const callbackUrl = getAuthRedirectUrl('/auth/callback');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: params.password || 'Seko1200.',
          options: {
            data: {
              name: params.name.trim(),
              role: assignedRole,
              phone: phoneVal,
            },
            emailRedirectTo: callbackUrl,
          },
        });

        if (authError) {
          console.warn('Supabase auth signUp notice:', authError.message);
        } else if (authData.user?.id) {
          newUserId = authData.user.id;
        }
      } catch (err) {
        console.warn('Supabase signUp error handled:', err);
      }
    }

    // Generate or sanitize username
    const rawUsername = params.username?.trim().toLowerCase() || cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const sanitizedUsername = rawUsername.length >= 3 ? rawUsername.substring(0, 30) : `${rawUsername}_${Math.random().toString(36).substring(2, 6)}`;

    const newProfile: UserProfile = {
      id: newUserId,
      user_id: newUserId,
      email: cleanEmail,
      username: sanitizedUsername,
      name: params.name.trim(),
      role: assignedRole,
      coach_id: null,
      pending_coach_id: null,
      pending_coach_name: null,
      phone: phoneVal,
      is_verified: isFounder || isSpecialBypass ? true : false,
      is_founder: isFounder || cleanEmail === 'mahfaza.co@gmail.com',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.createProfile(newProfile);

    // If student, also create student entry (neutrally into pool with coach_id: null, pending_coach_id: null)
    if (assignedRole === 'student') {
      await db.addStudent({
        user_id: newUserId,
        coach_id: null,
        pending_coach_id: null,
        pending_coach_name: null,
        name: params.name.trim(),
        email: cleanEmail,
        phoneNumber: phoneVal,
        phone: phoneVal,
        grade: '12. Sınıf',
        field: 'SAY',
        target_university: 'Hedef Belirlenmedi',
        target_department: 'Hedef Belirlenmedi',
        target_rank: 5000,
        target_score: 450,
      });
    }

    // 5. Notify founder Serkan Koçak and Admin on server-side
    try {
      await fetch('/api/notifications/new-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name.trim(),
          email: cleanEmail,
          role: assignedRole,
          phone: phoneVal,
        }),
      });
    } catch (err) {
      console.warn('Failed to notify backend on new registration:', err);
    }

    return newProfile;
  }

  static async resendVerificationEmail(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Supabase is live, send real Supabase Auth confirmation email
    if (isSupabaseConfigured && supabase) {
      try {
        const callbackUrl = getAuthRedirectUrl('/auth/callback');
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: cleanEmail,
          options: {
            emailRedirectTo: callbackUrl,
          },
        });
        if (error) {
          console.warn('Supabase resend note:', error.message);
        }
      } catch (err) {
        console.warn('Supabase resend confirmation error:', err);
      }
    }

    // 2. Server-side notification and sync
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
    } catch {}
  }

  static async verifyEmail(email: string): Promise<void> {
    await db.verifyUserEmail(email);
  }

  static async forgotPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const profile = await db.getProfileByEmail(cleanEmail);
    if (!profile) {
      // Don't throw for security / anti-enumeration, return cleanly
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const resetRedirectUrl = getAuthRedirectUrl('/update-password');
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: resetRedirectUrl,
        });
        if (error) {
          console.warn('Supabase reset password note:', error.message);
        }
      } catch (err) {
        console.warn('Supabase reset password err:', err);
      }
    }
  }
}
