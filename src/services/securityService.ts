import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUsername?: string;
}

export interface BackupCodesResult {
  codes: string[];
  hashedCodes: string[];
}

/**
 * 1. USERNAME VALIDATION & SANITIZATION
 * Sadece küçük harf (a-z), rakam (0-9) ve alt çizgi (_) içerebilir.
 * 3 ile 30 karakter arası uzunlukta olmalıdır.
 */
export async function validateUsername(rawUsername: string): Promise<UsernameValidationResult> {
  if (!rawUsername) {
    return { valid: false, error: 'Kullanıcı adı boş bırakılamaz.' };
  }

  const clean = rawUsername.trim().toLowerCase();

  if (!USERNAME_REGEX.test(clean)) {
    return {
      valid: false,
      error: 'Kullanıcı adı 3-30 karakter arasında, yalnızca küçük harf (a-z), rakam (0-9) ve alt çizgi (_) içerebilir.',
    };
  }

  // System & reserved blacklisted usernames fallback check
  const systemBlacklist = [
    'admin', 'administrator', 'root', 'system', 'mahfaza', 'destek', 'support',
    'auth', 'login', 'register', 'dashboard', 'coach', 'student', 'parent',
    'api', 'null', 'undefined', 'moderator', 'official', 'bot', 'security'
  ];

  if (systemBlacklist.includes(clean)) {
    return {
      valid: false,
      error: 'Bu kullanıcı adı sistem tarafından ayrılmıştır ve kullanılamaz.',
    };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // Check reserved_usernames table
      const { data: reserved, error: resErr } = await supabase
        .from('reserved_usernames')
        .select('username')
        .eq('username', clean)
        .maybeSingle();

      if (reserved && !resErr) {
        return {
          valid: false,
          error: 'Bu kullanıcı adı daha önce kullanılmış veya silinmiş bir hesaba ait olduğu için tekrar alınamaz.',
        };
      }

      // Check active profiles
      const { data: existing, error: profErr } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', clean)
        .maybeSingle();

      if (existing && !profErr) {
        return {
          valid: false,
          error: 'Bu kullanıcı adı zaten başka bir kullanıcı tarafından alınmış.',
        };
      }
    } catch (err) {
      console.warn('Username remote validation warning:', err);
    }
  }

  return { valid: true, sanitizedUsername: clean };
}

/**
 * Generates secure 8-digit backup codes for 2FA recovery
 */
export function generateBackupRecoveryCodes(count: number = 8): BackupCodesResult {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit numeric/alphanumeric code, e.g. 4829-1058
    const part1 = Math.floor(1000 + Math.random() * 9000).toString();
    const part2 = Math.floor(1000 + Math.random() * 9000).toString();
    codes.push(`${part1}-${part2}`);
  }
  return {
    codes,
    hashedCodes: codes.map(c => btoa(c)), // Basic reversible store or hash
  };
}

/**
 * 2. SUPABASE AUTH TOTP MULTI-FACTOR AUTHENTICATION (2FA) SERVICE
 */
export const MfaService = {
  /**
   * Enroll a new TOTP factor (returns QR code URI and secret)
   */
  async enrollTotp(issuer = 'Mahfaza.co') {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış.');
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer,
    });
    if (error) throw error;
    return data; // { id, type, totp: { qr_code, secret, uri } }
  },

  /**
   * Verify and challenge newly enrolled TOTP factor
   */
  async verifyAndChallengeTotp(factorId: string, code: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış.');
    }
    const cleanCode = code.trim();
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: cleanCode,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Challenge an active TOTP factor during login
   */
  async challengeFactor(factorId: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış.');
    }
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (error) throw error;
    return data; // { id: challengeId }
  },

  /**
   * Verify code for a challenged factor
   */
  async verifyChallenge(factorId: string, challengeId: string, code: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış.');
    }
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.trim(),
    });
    if (error) throw error;
    return data;
  },

  /**
   * List all registered MFA factors for current user
   */
  async listFactors() {
    if (!isSupabaseConfigured || !supabase) return { all: [], totp: [] };
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data;
  },

  /**
   * Unenroll / Disable a 2FA factor
   */
  async unenrollFactor(factorId: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış.');
    }
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    if (error) throw error;
    return data;
  },
};

/**
 * 3. CLIENT-SIDE RATE LIMITER (Protects forms from rapid brute force submissions)
 */
class ClientRateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number; lockedUntil: number }> = new Map();

  isRateLimited(key: string, maxAttempts = 5, windowMs = 60000, lockTimeMs = 120000): { limited: boolean; remainingSec: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, firstAttempt: now, lockedUntil: 0 });
      return { limited: false, remainingSec: 0 };
    }

    if (record.lockedUntil > now) {
      const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
      return { limited: true, remainingSec };
    }

    if (now - record.firstAttempt > windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now, lockedUntil: 0 });
      return { limited: false, remainingSec: 0 };
    }

    record.count++;
    if (record.count > maxAttempts) {
      record.lockedUntil = now + lockTimeMs;
      const remainingSec = Math.ceil(lockTimeMs / 1000);
      return { limited: true, remainingSec };
    }

    return { limited: false, remainingSec: 0 };
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}

export const RateLimiter = new ClientRateLimiter();
