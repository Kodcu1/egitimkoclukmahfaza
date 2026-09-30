import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserRole, Student } from '../types';
import { AuthService, RegisterParams } from '../services/authService';
import { db } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_PROFILES } from '../data/seedData';

interface AuthContextType {
  user: UserProfile | null;
  studentData: Student | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<UserProfile>;
  demoLogin: (role: 'coach' | 'student' | 'parent') => Promise<UserProfile>;
  register: (params: RegisterParams) => Promise<UserProfile>;
  logout: () => void;
  refreshStudentData: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
  switchDemoUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'mahfaza_current_user_email';
const LEGACY_AUTH_KEY = 'serkan_hoca_current_user_email';
const AUTH_PROFILE_COLUMNS = 'id,user_id,email,name,role,avatar_url,phone,username,two_factor_enabled,created_at,updated_at';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadStudentProfile = async (profile: UserProfile) => {
    try {
      const freshProfile = (await db.getProfile(profile.user_id)) || (await db.getProfileByEmail(profile.email)) || profile;
      setUser(freshProfile);
      if (freshProfile.role === 'student') {
        const stu = await db.getStudentById(freshProfile.user_id);
        setStudentData(stu);
      } else if (freshProfile.role === 'parent') {
        // Find strictly linked student
        const students = await db.getStudents();
        const matched = students.find((s) => s.parent_id === freshProfile.user_id);
        setStudentData(matched || null);
      } else {
        setStudentData(null);
      }
    } catch (err) {
      console.warn('Error loading student profile in auth:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. If Supabase is configured, check active Supabase Auth session first
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            const authEmail = session.user.email.toLowerCase();
            const { data: authProfile, error: profileError } = await supabase
              .from('profiles')
              .select(AUTH_PROFILE_COLUMNS)
              .eq('user_id', session.user.id)
              .maybeSingle();
            if (profileError) throw new Error(profileError.message);
            const profile = authProfile as UserProfile | null;
            if (profile) {
              await db.createProfile(profile);
              const isConfirmed = Boolean(session.user.email_confirmed_at);
              profile.is_verified = isConfirmed;
              profile.email_confirmed_at = session.user.email_confirmed_at || null;
              if (isConfirmed) {
                await db.verifyUserEmail(authEmail);
              }
              setUser(profile);
              await loadStudentProfile(profile);

              // Background idempotent migration of any legacy browser local data
              import('../services/dataMigrationService')
                .then(({ DataMigrationService }) => DataMigrationService.runMigration())
                .catch((mErr) => console.warn('Background data migration notice:', mErr));

              setIsLoading(false);
              return;
            }
          } else {
            // When Supabase is configured and there is no active session, clear any stale user state
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(LEGACY_AUTH_KEY);
            setUser(null);
            setStudentData(null);
            setIsLoading(false);
            return;
          }
        }

        // 2. Offline / Development ONLY fallback when Supabase is not configured
        if (!isSupabaseConfigured) {
          const storedEmail = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(LEGACY_AUTH_KEY);
          if (storedEmail) {
            const profile = await db.getProfileByEmail(storedEmail);
            if (profile) {
              setUser(profile);
              await loadStudentProfile(profile);
            } else {
              setUser(null);
              setStudentData(null);
            }
          } else {
            setUser(null);
            setStudentData(null);
          }
        } else {
          setUser(null);
          setStudentData(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 3. Supabase Auth State Change Listener
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
          if (event === 'PASSWORD_RECOVERY') {
            if (typeof window !== 'undefined' && !window.location.pathname.includes('update-password')) {
              window.location.href = '/update-password';
            }
          }
          if (session?.user?.email) {
            const freshEmail = session.user.email.toLowerCase();
            const { data: authProfile, error: profileError } = await supabase
              .from('profiles')
              .select(AUTH_PROFILE_COLUMNS)
              .eq('user_id', session.user.id)
              .maybeSingle();
            if (profileError || !authProfile) {
              setUser(null);
              setStudentData(null);
              localStorage.removeItem(AUTH_USER_KEY);
              return;
            }
            const profile = authProfile as UserProfile;
            await db.createProfile(profile);
            profile.is_verified = Boolean(session.user.email_confirmed_at);
            profile.email_confirmed_at = session.user.email_confirmed_at || null;
            if (session.user.email_confirmed_at) {
              await db.verifyUserEmail(freshEmail);
            }
            setUser(profile);
            localStorage.setItem(AUTH_USER_KEY, profile.email);
            await loadStudentProfile(profile);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setStudentData(null);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const profile = await AuthService.login(email, password);
      setUser(profile);
      await loadStudentProfile(profile);
      // Run background migration for any unmigrated offline items safely
      if (typeof window !== 'undefined') {
        import('../services/dataMigrationService')
          .then(({ DataMigrationService }) => DataMigrationService.runMigration())
          .catch((mErr) => console.warn('Background data migration notice:', mErr));
      }
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'coach' | 'student' | 'parent') => {
    if (import.meta.env.PROD) {
      throw new Error('Demo girişi üretim (production) ortamında güvenlik gerekçesiyle devre dışıdır. Lütfen gerçek hesabınızla giriş yapınız.');
    }
    setIsLoading(true);
    try {
      const profile = await AuthService.demoLogin(role);
      setUser(profile);
      await loadStudentProfile(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: RegisterParams) => {
    setIsLoading(true);
    try {
      const profile = await AuthService.register(params);
      setUser(profile);
      await loadStudentProfile(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut notice:', err);
      }
    }
    setUser(null);
    setStudentData(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(LEGACY_AUTH_KEY);
    localStorage.removeItem('mahfaza_demo_token');
  };

  const refreshStudentData = async () => {
    if (user) {
      await loadStudentProfile(user);
    }
  };

  const refreshUser = async (): Promise<UserProfile | null> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          const authEmail = authUser.email.toLowerCase();
          const { data: authProfile, error: profileError } = await supabase
            .from('profiles')
            .select(AUTH_PROFILE_COLUMNS)
            .eq('user_id', authUser.id)
            .maybeSingle();
          if (profileError || !authProfile) {
            setUser(null);
            setStudentData(null);
            localStorage.removeItem(AUTH_USER_KEY);
            return null;
          }
          const profile = authProfile as UserProfile;
          await db.createProfile(profile);
          profile.is_verified = Boolean(authUser.email_confirmed_at);
          profile.email_confirmed_at = authUser.email_confirmed_at || null;
          if (authUser.email_confirmed_at) await db.verifyUserEmail(authEmail);
          setUser(profile);
          await loadStudentProfile(profile);
          return profile;
        } else {
          // No active Supabase Auth user
          setUser(null);
          setStudentData(null);
          localStorage.removeItem(AUTH_USER_KEY);
          return null;
        }
      }

      if (!isSupabaseConfigured) {
        const storedEmail = localStorage.getItem(AUTH_USER_KEY);
        if (storedEmail) {
          const fresh = await db.getProfileByEmail(storedEmail);
          if (fresh) {
            setUser(fresh);
            await loadStudentProfile(fresh);
            return fresh;
          }
        }
      }

      return user;
    } catch (err) {
      console.warn('Error refreshing user:', err);
      return user;
    }
  };

  const switchDemoUser = async (email: string) => {
    if (import.meta.env.PROD) {
      throw new Error('Demo kullanıcı değiştirme üretim ortamında kullanılamaz.');
    }
    await login(email, 'Seko1200.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentData,
        role: user?.role || null,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshStudentData,
        refreshUser,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

