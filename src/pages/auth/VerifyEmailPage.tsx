import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthService, isBypassedEmail } from '../../services/authService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  Inbox,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';

function maskEmail(rawEmail: string): string {
  if (!rawEmail || !rawEmail.includes('@')) return rawEmail || '';
  const [name, domain] = rawEmail.split('@');
  if (name.length <= 3) {
    return `${name[0]}***@${domain}`;
  }
  const prefix = name.slice(0, 3);
  return `${prefix}********@${domain}`;
}

export const VerifyEmailPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryEmail = searchParams.get('email') || user?.email || '';
  const [email, setEmail] = useState<string>(queryEmail);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (queryEmail && queryEmail !== email && !isEditingEmail) {
      setEmail(queryEmail);
    }
  }, [queryEmail, isEditingEmail]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const checkBypassedOrVerified = async () => {
      const clean = (email || queryEmail).trim().toLowerCase();
      if (clean && (isBypassedEmail(clean) || user?.is_founder || user?.is_verified)) {
        await AuthService.verifyEmail(clean);
        if (refreshUser) await refreshUser();
        setIsSuccess(true);
        setInfoMessage('Yetkili hesap doğrulandı, yönlendiriliyorsunuz...');
        setTimeout(() => {
          if (clean === 'mahfaza.co@gmail.com' || user?.role === 'admin' || user?.role === 'org_admin') {
            navigate('/admin');
          } else if (user?.role === 'coach' || (user?.role as any) === 'head_coach') {
            navigate('/coach/dashboard');
          } else if (user?.role === 'student') {
            navigate('/student/dashboard');
          } else if (user?.role === 'parent') {
            navigate('/parent/dashboard');
          } else {
            navigate('/admin');
          }
        }, 800);
      }
    };
    checkBypassedOrVerified();
  }, [email, queryEmail, user]);

  // Check if Supabase auth token arrived via URL hash (e.g. #access_token=... or ?token_hash=...)
  useEffect(() => {
    const handleUrlTokenVerification = async () => {
      if (isSupabaseConfigured && supabase) {
        // 1. Check for token_hash in search params (PKCE / Email confirmation flow)
        const tokenHash = searchParams.get('token_hash');
        const tokenType = (searchParams.get('type') as any) || 'signup';

        if (tokenHash) {
          setIsLoading(true);
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: tokenType === 'email' || tokenType === 'signup' ? tokenType : 'signup',
            });
            if (!error && data.user) {
              const verifiedEmail = data.user.email || email;
              await AuthService.verifyEmail(verifiedEmail);
              if (refreshUser) await refreshUser();
              setIsSuccess(true);
              setInfoMessage('E-posta adresiniz başarıyla doğrulandı!');
              setTimeout(() => {
                navigate('/auth/callback');
              }, 1200);
              return;
            } else if (error) {
              setErrorMessage(`Doğrulama hatası: ${error.message}`);
            }
          } catch (err: any) {
            console.warn('OTP verification from url error:', err);
          } finally {
            setIsLoading(false);
          }
        }

        // 2. Check for active session with email_confirmed_at
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user && session.user.email_confirmed_at) {
            const confirmedEmail = session.user.email || email;
            await AuthService.verifyEmail(confirmedEmail);
            if (refreshUser) await refreshUser();
            setIsSuccess(true);
            setInfoMessage('E-posta adresiniz başarıyla doğrulandı!');
          }
        });
      }
    };

    handleUrlTokenVerification();
  }, [searchParams]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    const cleanCode = code.trim();
    if (!cleanCode && !isBypassedEmail(cleanEmail)) {
      setErrorMessage('Lütfen e-postanıza gelen doğrulama kodunu giriniz veya gelen e-postadaki onay bağlantısına tıklayınız.');
      return;
    }

    setIsLoading(true);

    // Fast-path bypass for demo/privileged accounts
    if (isBypassedEmail(cleanEmail)) {
      await AuthService.verifyEmail(cleanEmail);
      let updatedUser = user;
      if (refreshUser) {
        updatedUser = await refreshUser();
      }
      setIsSuccess(true);
      setInfoMessage('E-posta adresiniz başarıyla doğrulandı! Portala aktarılıyorsunuz...');
      setTimeout(() => {
        const targetUser = updatedUser || user;
        if (cleanEmail === 'mahfaza.co@gmail.com' || targetUser?.role === 'admin' || targetUser?.role === 'org_admin') {
          navigate('/admin');
        } else if (targetUser?.role === 'coach' || (targetUser?.role as any) === 'head_coach') {
          navigate('/coach/dashboard');
        } else if (targetUser?.role === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/parent/dashboard');
        }
      }, 800);
      setIsLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        // Attempt signup OTP verification with Supabase
        let { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: 'signup',
        });

        if (error) {
          // Attempt email OTP verification
          const emailRes = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanCode,
            type: 'email',
          });
          if (emailRes.error) {
            throw new Error(`Geçersiz doğrulama kodu: ${emailRes.error.message || error.message}`);
          }
          data = emailRes.data;
          error = null;
        }

        if (!data?.user && !data?.session) {
          throw new Error('Doğrulama onaylanamadı. Lütfen girdiğiniz kodu kontrol ediniz.');
        }

        // Verification confirmed by Supabase Auth
        await AuthService.verifyEmail(cleanEmail);
        let updatedUser = user;
        if (refreshUser) {
          updatedUser = await refreshUser();
        }
        setIsSuccess(true);
        setInfoMessage('E-posta adresiniz başarıyla doğrulandı! Portala yönlendiriliyorsunuz...');

        setTimeout(() => {
          const targetUser = updatedUser || user;
          if (targetUser) {
            if (targetUser.role === 'admin' || targetUser.role === 'org_admin') {
              navigate('/admin');
            } else if (targetUser.role === 'coach' || (targetUser.role as any) === 'head_coach') {
              navigate('/coach/dashboard');
            } else if (targetUser.role === 'student') {
              navigate('/student/dashboard');
            } else {
              navigate('/parent/dashboard');
            }
          } else {
            navigate('/login');
          }
        }, 1500);
      } else {
        // Server API fallback
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || json.error || 'Geçersiz doğrulama kodu.');
        }

        await AuthService.verifyEmail(cleanEmail);
        let updatedUser = user;
        if (refreshUser) {
          updatedUser = await refreshUser();
        }
        setIsSuccess(true);
        setInfoMessage('E-posta adresiniz başarıyla doğrulandı! Portala yönlendiriliyorsunuz...');

        setTimeout(() => {
          const targetUser = updatedUser || user;
          if (targetUser) {
            if (targetUser.role === 'admin' || targetUser.role === 'org_admin') {
              navigate('/admin');
            } else if (targetUser.role === 'coach' || (targetUser.role as any) === 'head_coach') {
              navigate('/coach/dashboard');
            } else if (targetUser.role === 'student') {
              navigate('/student/dashboard');
            } else {
              navigate('/parent/dashboard');
            }
          } else {
            navigate('/login');
          }
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'E-posta doğrulanamadı. Lütfen kodu kontrol edip tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (countdown > 0) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      await AuthService.resendVerificationEmail(cleanEmail);
      setInfoMessage('Doğrulama e-postası yeniden gönderildi.');
      setCountdown(60);
    } catch (err: any) {
      setErrorMessage('Doğrulama e-postası gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin veya spam klasörünüzü kontrol edin.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden text-white">
      {/* Subtle Ambient Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/5 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
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

        {/* Verification Card */}
        <Card className="bg-[#111827] border-indigo-900/50 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
              <Mail className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">E-posta Adresinizi Doğrulayın</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              Hesap güvenliğiniz ve Mahfaza.co üzerinden resmi iletişimlerinizi alabilmeniz için e-posta adresinizi doğrulamanız gerekiyor.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-semibold animate-in fade-in flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-semibold animate-in fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">E-posta Adresiniz Doğrulandı!</h3>
              <p className="text-xs text-slate-300">
                Hesabınız aktifleşti. Birkaç saniye içinde panelinize yönlendiriliyorsunuz...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Registered Email Overview Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-900/60 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Kayıtlı E-posta Adresi</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(!isEditingEmail)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline decoration-amber-400/50"
                  >
                    {isEditingEmail ? 'Maskele' : 'Adresi Düzenle'}
                  </button>
                </div>

                {isEditingEmail ? (
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="adiniz@mahfaza.co"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-indigo-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-indigo-950 text-slate-200 font-mono text-xs">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-bold">{maskEmail(email)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Durum:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Inbox className="w-3.5 h-3.5" />
                    Doğrulama e-postası gönderildi.
                  </span>
                </div>
              </div>

              {/* Spam Notice Box */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                <Inbox className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Lütfen gelen kutunuzu ve <span className="font-bold underline">Spam / Önemsiz</span> klasörünüzü kontrol ediniz. E-postadaki onay bağlantısına tıklayabilir veya varsa 6 haneli kodu aşağıya girebilirsiniz.
                </p>
              </div>

              {/* OTP Code Input */}
              <form onSubmit={handleVerify} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex justify-between items-center">
                    <span>Doğrulama Kodu (İsteğe Bağlı)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Kod ile onaylamak için</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Örn: 849201"
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-indigo-900/50 text-white text-xs sm:text-sm tracking-widest font-mono text-center focus:border-amber-400 focus:outline-none transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 text-sm py-3 cursor-pointer"
                  isLoading={isLoading}
                  rightIcon={<ShieldCheck className="w-4 h-4 text-slate-950" />}
                >
                  Kodu Doğrula & Panele Git
                </Button>
              </form>
            </div>
          )}

          {/* Resend & Help Actions */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">E-posta kutunuzda göremediniz mi?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                className="font-bold text-amber-400 hover:text-amber-300 disabled:text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Doğrulama e-postası gönderiliyor...</span>
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>E-postayı Tekrar Gönder ({countdown}s)</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>E-postayı Tekrar Gönder</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 flex items-start gap-2.5 text-xs text-slate-400">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Spam / Önemsiz kutunuzu kontrol etmeyi unutmayınız. Resmi kurumsal destek için:{' '}
                <a href="mailto:mahfaza.co@gmail.com" className="text-amber-400 font-semibold hover:underline">
                  mahfaza.co@gmail.com
                </a>
              </p>
            </div>
          </div>
        </Card>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 font-medium">
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Giriş Sayfasına Dön
          </Link>
          <span>•</span>
          <Link to="/register" className="hover:text-white transition-colors inline-flex items-center gap-1">
            <UserPlus className="w-3.5 h-3.5" />
            Farklı e-posta ile yeniden kayıt ol
          </Link>
          <span>•</span>
          <Link to="/" className="hover:text-white transition-colors">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
};
