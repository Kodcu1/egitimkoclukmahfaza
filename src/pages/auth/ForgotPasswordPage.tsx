import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../services/authService';
import { getAuthRedirectUrl } from '../../lib/authUrls';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Clock, Sparkles, Inbox, RefreshCw } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const redirectToUrl = getAuthRedirectUrl('/update-password');
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectToUrl,
        });

        if (error) {
          console.warn('Supabase reset password note:', error.message);
        }
      } else {
        await AuthService.forgotPassword(cleanEmail);
      }

      // Always show generic success message (Anti-enumeration protection)
      setIsSuccess(true);
      setCountdown(60);
    } catch (err: any) {
      console.warn('Reset password error handled:', err);
      // Even on handled lookup, show friendly response or standard notice
      setIsSuccess(true);
      setCountdown(60);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    await handleSubmit({ preventDefault: () => {} } as any);
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
          {/* Section Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
              <Mail className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Şifremi Unuttum</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kayıtlı e-posta adresinizi girin, size şifre yenileme bağlantısı gönderelim.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-4 py-3 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-100">Talimat Gönderildi</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Eğer bu e-posta adresiyle (<span className="text-amber-400 font-mono font-semibold">{email}</span>) kayıtlı bir hesabınız varsa şifre sıfırlama bağlantısı gönderilecektir.
                </p>
              </div>

              {/* Spam Warning Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-left text-xs text-amber-200">
                <Inbox className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Lütfen gelen kutunuzu ve <span className="font-bold underline">Spam / Önemsiz</span> klasörünüzü kontrol ediniz. Bağlantıdaki talimatları izleyerek yeni şifrenizi oluşturabilirsiniz.
                </p>
              </div>

              {/* Resend Cooldown */}
              <div className="pt-2 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || isLoading}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 disabled:text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {countdown > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tekrar Gönder ({countdown}s)</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Bağlantıyı Tekrar Gönder</span>
                    </>
                  )}
                </button>

                <Link to="/login" className="inline-block mt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<ArrowLeft className="w-4 h-4 text-slate-950" />}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                  >
                    Giriş Ekranına Dön
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-semibold animate-in fade-in flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Input
                label="E-posta Adresiniz"
                type="email"
                placeholder="adiniz@mahfaza.co"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 text-sm py-3 cursor-pointer"
                isLoading={isLoading}
              >
                Şifre Sıfırlama Bağlantısı Gönder
              </Button>

              <div className="text-center pt-2 border-t border-slate-800/80">
                <Link
                  to="/login"
                  className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Giriş Sayfasına Geri Dön
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
