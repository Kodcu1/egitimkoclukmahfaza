import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    // 1. Check if an active session or recovery state exists
    const checkRecoverySession = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            if (isSubscribed) setHasSession(true);
            return;
          }

          // Check if token hash or access token exists in URL hash fragment
          const hash = window.location.hash;
          if (hash.includes('access_token=') || hash.includes('type=recovery')) {
            if (isSubscribed) setHasSession(true);
            return;
          }

          // If no session found
          if (isSubscribed) setHasSession(false);
        } catch (err) {
          console.warn('Error checking recovery session:', err);
          if (isSubscribed) setHasSession(false);
        }
      } else {
        // Dev fallback
        if (isSubscribed) setHasSession(true);
      }
    };

    checkRecoverySession();

    // 2. Listen to Supabase Auth State Change for PASSWORD_RECOVERY event
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          if (isSubscribed) setHasSession(true);
        }
      });

      return () => {
        isSubscribed = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Min 8 characters
    if (password.length < 8) {
      setErrorMessage('Şifreniz en az 8 karakter uzunluğunda olmalıdır.');
      return;
    }

    // Validation 2: Passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) {
          throw new Error(error.message || 'Şifre güncellenirken bir hata oluştu.');
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err: any) {
      console.error('Password update error:', err);
      setErrorMessage(
        err.message || 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir. Lütfen yeni bir bağlantı isteyin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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

        <Card className="bg-[#111827] border-indigo-900/50 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-6 text-white">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
              <KeyRound className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Yeni Şifre Oluştur</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lütfen hesabınız için güçlü ve en az 8 karakterli yeni bir şifre belirleyin.
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="text-center space-y-4 py-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Şifreniz Başarıyla Güncellendi!</h3>
                <p className="text-xs text-slate-300">
                  Yeni şifreniz aktif edildi. Giriş sayfasına yönlendiriliyorsunuz...
                </p>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-full animate-pulse" />
              </div>
            </div>
          ) : hasSession === false ? (
            /* Invalid/Expired Session State */
            <div className="text-center space-y-4 py-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-rose-300">Geçersiz veya Süresi Dolmuş Bağlantı</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir. Lütfen yeni bir bağlantı isteyin.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/forgot-password"
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Yeni Sıfırlama Bağlantısı İste</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Update Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-semibold animate-in fade-in flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Yeni Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="En az 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-indigo-900/50 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Yeni Şifre Tekrar</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Yeni şifrenizi tekrar girin"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-indigo-900/50 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Güvenlik Kriterleri:</span>
                </div>
                <p>• En az 8 karakter uzunluğunda olmalıdır.</p>
                <p>• Büyük ve küçük harf kombinasyonu önerilir.</p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 text-sm py-3 cursor-pointer"
                isLoading={isLoading}
              >
                Yeni Şifreyi Kaydet
              </Button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="text-center pt-2 border-t border-slate-800/80">
            <Link
              to="/login"
              className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Giriş Sayfasına Geri Dön
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
