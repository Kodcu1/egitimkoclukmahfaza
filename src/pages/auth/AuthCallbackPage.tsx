import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuthService, isBypassedEmail } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { Card } from '../../components/common/Card';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import { CheckCircle2, AlertCircle, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'recovery' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Kimlik bilgileriniz ve e-posta onayınız doğrulanıyor...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processAuthCallback = async () => {
      try {
        // 1. Check for error parameters in URL query or hash
        const error = searchParams.get('error') || new URLSearchParams(window.location.hash.slice(1)).get('error');
        const errorDescription = searchParams.get('error_description') || new URLSearchParams(window.location.hash.slice(1)).get('error_description');

        if (error) {
          if (isMounted) {
            setStatus('error');
            setMessage('Doğrulama bağlantısı geçersiz veya süresi dolmuş.');
            setErrorDetails(errorDescription || 'Lütfen yeni bir doğrulama e-postası isteyiniz.');
          }
          return;
        }

        // 2. Check if this is a Password Recovery callback
        const type = searchParams.get('type') || new URLSearchParams(window.location.hash.slice(1)).get('type');
        if (type === 'recovery') {
          if (isMounted) {
            setStatus('recovery');
            setMessage('Şifre sıfırlama talebiniz doğrulandı. Yeni şifre belirleme ekranına aktarılıyorsunuz...');
          }
          setTimeout(() => {
            navigate('/update-password', { replace: true });
          }, 1000);
          return;
        }

        // 3. Process Supabase Auth callback
        if (isSupabaseConfigured && supabase) {
          // A) Check for PKCE Authorization Code (?code=...)
          const code = searchParams.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.warn('PKCE exchange error:', exchangeError.message);
            }
          }

          // B) Check for OTP token hash (?token_hash=...&type=...)
          const tokenHash = searchParams.get('token_hash');
          if (tokenHash) {
            const otpType = (searchParams.get('type') as any) || 'signup';
            const { error: otpError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: otpType === 'recovery' ? 'recovery' : otpType === 'email' ? 'email' : 'signup',
            });
            if (otpError) {
              console.warn('OTP token_hash verify error:', otpError.message);
            }
            if (otpType === 'recovery') {
              if (isMounted) {
                setStatus('recovery');
                setMessage('Şifre kurtarma oturumunuz açıldı. Şifre yenileme sayfasına aktarılıyorsunuz...');
              }
              setTimeout(() => {
                navigate('/update-password', { replace: true });
              }, 1000);
              return;
            }
          }

          // C) Get current active session
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const userEmail = session.user.email?.toLowerCase();
            const isEmailConfirmed = Boolean(session.user.email_confirmed_at);

            if (userEmail) {
              // Update database profile confirmation
              await AuthService.verifyEmail(userEmail);
              
              if (refreshUser) {
                await refreshUser();
              }

              // Lookup user profile to redirect to correct dashboard
              const profile = await db.getProfileByEmail(userEmail) || (session.user.id ? await db.getProfile(session.user.id) : null);

              if (isMounted) {
                setStatus('success');
                setMessage('E-posta adresiniz başarıyla onaylandı! Portala aktarılıyorsunuz...');
              }

              setTimeout(() => {
                if (profile) {
                  if (profile.role === 'admin' || profile.role === 'org_admin') {
                    navigate('/admin', { replace: true });
                  } else if (profile.role === 'coach' || (profile.role as any) === 'head_coach') {
                    navigate('/coach/dashboard', { replace: true });
                  } else if (profile.role === 'student') {
                    navigate('/student/dashboard', { replace: true });
                  } else {
                    navigate('/parent/dashboard', { replace: true });
                  }
                } else {
                  navigate('/student/dashboard', { replace: true });
                }
              }, 1200);
              return;
            }
          }
        }

        const savedEmail = localStorage.getItem('mahfaza_current_user_email');
        if (savedEmail && isBypassedEmail(savedEmail)) {
          await AuthService.verifyEmail(savedEmail);
          if (refreshUser) await refreshUser();
          const profile = await db.getProfileByEmail(savedEmail);
          if (isMounted) {
            setStatus('success');
            setMessage('Yetkili oturumunuz başarıyla doğrulandı. Yönlendiriliyorsunuz...');
          }
          setTimeout(() => {
            if (savedEmail === 'mahfaza.co@gmail.com' || profile?.role === 'admin' || profile?.role === 'org_admin') {
              navigate('/admin', { replace: true });
            } else if (profile?.role === 'coach' || (profile?.role as any) === 'head_coach') {
              navigate('/coach/dashboard', { replace: true });
            } else if (profile?.role === 'student') {
              navigate('/student/dashboard', { replace: true });
            } else {
              navigate('/parent/dashboard', { replace: true });
            }
          }, 800);
          return;
        }

        // If no session could be established
        if (isMounted) {
          setStatus('error');
          setMessage('Oturum bilgisi doğrulanamadı.');
          setErrorDetails('Lütfen e-posta adresinizi onaylamak için kodunuzu manuel giriniz veya yeniden giriş yapınız.');
        }
      } catch (err: any) {
        console.error('Auth callback handling error:', err);
        if (isMounted) {
          setStatus('error');
          setMessage('Doğrulama sırasında bir hata oluştu.');
          setErrorDetails(err.message || 'Lütfen tekrar deneyiniz.');
        }
      }
    };

    processAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/5 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link to="/" className="hover:opacity-95 transition-opacity" title="Ana Sayfaya Git">
            <MahfazaLogo size="xl" subtitle="Eğitim Koçluk-Danışmanlık • YKS 2027" />
          </Link>
          <p className="text-xs sm:text-sm text-amber-400 font-semibold tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            "Planını Kur. Disiplinini Koru. Hedefine Ulaş."
          </p>
        </div>

        <Card className="bg-[#111827] border-indigo-900/50 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-6 text-white text-center">
          {status === 'loading' && (
            <div className="space-y-4 py-6 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin stroke-[2.2]" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Oturum Doğrulanıyor</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-6 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="text-lg font-bold text-emerald-400 tracking-tight">E-posta Doğrulandı!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-full animate-pulse" />
              </div>
            </div>
          )}

          {status === 'recovery' && (
            <div className="space-y-4 py-6 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                <Sparkles className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h2 className="text-lg font-bold text-amber-400 tracking-tight">Şifre Kurtarma Bağlantısı</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5 py-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-rose-400 tracking-tight">{message}</h2>
                {errorDetails && <p className="text-xs text-slate-400 leading-relaxed">{errorDetails}</p>}
              </div>

              <div className="pt-2 space-y-2.5">
                <Link
                  to="/verify-email"
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Doğrulama Sayfasına Git</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login"
                  className="block w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
