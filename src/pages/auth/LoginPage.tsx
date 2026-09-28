import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeDemoRole, setActiveDemoRole] = useState<'coach' | 'student' | 'parent' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const handleDemoLogin = async (role: 'coach' | 'student' | 'parent') => {
    setErrorMessage(null);
    setUnverifiedEmail(null);
    setActiveDemoRole(role);
    setIsLoading(true);

    try {
      const profile = await demoLogin(role);
      if (profile.role === 'coach' || (profile.role as any) === 'head_coach') {
        navigate('/coach/dashboard', { replace: true });
      } else if (profile.role === 'student') {
        navigate('/student/dashboard', { replace: true });
      } else if (profile.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      } else {
        navigate('/coach/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo girişi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setActiveDemoRole(null);
    }
  };

  const executeLogin = async (targetEmail: string, targetPassword?: string) => {
    setErrorMessage(null);
    setUnverifiedEmail(null);

    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    if (!targetPassword) {
      setErrorMessage('Lütfen şifrenizi giriniz.');
      return;
    }

    setIsLoading(true);

    try {
      const profile = await login(cleanEmail, targetPassword);
      
      // Check email verification status for non-founder users
      if (profile.is_verified === false && !profile.is_founder) {
        setUnverifiedEmail(cleanEmail);
        navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
        return;
      }

      if (profile.role === 'admin' || profile.role === 'org_admin') {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'coach' || (profile.role as any) === 'head_coach') {
        navigate('/coach/dashboard', { replace: true });
      } else if (profile.role === 'student') {
        navigate('/student/dashboard', { replace: true });
      } else {
        navigate('/parent/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Giriş yapılamadı. Lütfen e-posta ve şifrenizi kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Decorative Subtle Lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/5 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-slate-900/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link to="/" className="hover:opacity-95 transition-opacity" title="Ana Sayfaya Git">
            <MahfazaLogo size="xl" subtitle="Eğitim Koçluk-Danışmanlık • YKS 2027" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-amber-300 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
            >
              <span>🏠</span>
              <span>Ana Sayfaya Dön</span>
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-amber-400 font-semibold tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            "Planını Kur. Disiplinini Koru. Hedefine Ulaş."
          </p>
        </div>

        {/* Tab Toggle between Login & Register */}
        <div className="flex p-1.5 bg-[#111827] rounded-2xl border border-indigo-900/40 shadow-inner">
          <button
            type="button"
            className="flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-amber-400 text-slate-950 shadow-md transition-all text-center flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            Giriş Yap
          </button>
          <Link
            to="/register"
            className="flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-center flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 text-slate-400" />
            Yeni Kayıt Ol
          </Link>
        </div>

        {/* Login Card */}
        <Card className="bg-[#111827] border-indigo-900/50 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-5 text-white">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight">Kullanıcı Girişi</h2>
            <p className="text-xs text-slate-400">
              Kayıtlı e-posta adresiniz ve şifreniz ile portalınıza güvenle erişin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-semibold animate-in fade-in flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {unverifiedEmail && (
              <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs font-semibold animate-in fade-in flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>E-posta adresiniz henüz doğrulanmamış.</span>
                </div>
                <Link
                  to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="text-xs text-amber-400 underline font-bold hover:text-amber-300"
                >
                  Doğrulama ekranına gitmek için tıklayınız &rarr;
                </Link>
              </div>
            )}

            <Input
              label="E-posta Adresi"
              type="email"
              placeholder="adiniz@ornek.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer font-medium hover:text-slate-200">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>Beni Hatırla</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                Şifremi Unuttum?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 text-sm py-3"
              isLoading={isLoading && activeDemoRole === null}
              rightIcon={<ArrowRight className="w-4 h-4 text-slate-950" />}
            >
              Giriş Yap ve Portala Geç
            </Button>
          </form>

          {/* Quick Demo Access */}
          <div className="pt-1">
            <div className="relative flex items-center justify-center mb-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#111827] px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Hızlı Demo Girişleri
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-demo-coach"
                onClick={() => handleDemoLogin('coach')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-700/40 hover:border-indigo-500/60 transition-all text-center group disabled:opacity-50 cursor-pointer"
              >
                <span className="text-base mb-0.5">👔</span>
                <span className="text-xs font-bold text-indigo-300 group-hover:text-white transition-colors">
                  {activeDemoRole === 'coach' ? 'Giriş...' : 'Koç Demo'}
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full">koc@mahfaza.co</span>
              </button>

              <button
                type="button"
                id="btn-demo-student"
                onClick={() => handleDemoLogin('student')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/40 hover:border-emerald-500/60 transition-all text-center group disabled:opacity-50 cursor-pointer"
              >
                <span className="text-base mb-0.5">🎓</span>
                <span className="text-xs font-bold text-emerald-300 group-hover:text-white transition-colors">
                  {activeDemoRole === 'student' ? 'Giriş...' : 'Öğrenci Demo'}
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full">ogrenci@mahfaza.co</span>
              </button>

              <button
                type="button"
                id="btn-demo-parent"
                onClick={() => handleDemoLogin('parent')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/40 hover:border-amber-500/60 transition-all text-center group disabled:opacity-50 cursor-pointer"
              >
                <span className="text-base mb-0.5">👨‍👩‍👧</span>
                <span className="text-xs font-bold text-amber-300 group-hover:text-white transition-colors">
                  {activeDemoRole === 'parent' ? 'Giriş...' : 'Veli Demo'}
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full">veli@mahfaza.co</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Links */}
        <p className="text-center text-xs text-slate-400 font-medium">
          Henüz bir hesabınız yok mu?{' '}
          <Link to="/register" className="text-amber-400 font-bold hover:text-amber-300 underline decoration-amber-400/50 underline-offset-4">
            Hemen Yeni Hesap Oluştur
          </Link>
        </p>
      </div>
    </div>
  );
};
