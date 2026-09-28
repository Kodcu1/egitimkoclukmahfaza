import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import { ScrollToTop } from '../../components/common/ScrollToTop';
import { LandingHero } from './components/LandingHero';
import { LandingHowItWorks } from './components/LandingHowItWorks';
import { LandingEcosystem } from './components/LandingEcosystem';
import { LandingBentoGrid } from './components/LandingBentoGrid';
import { LandingProductDeepDive } from './components/LandingProductDeepDive';
import { LandingRolesInteractive } from './components/LandingRolesInteractive';
import { LandingTrustCredibility } from './components/LandingTrustCredibility';
import { LandingTestimonials } from './components/LandingTestimonials';
import { LandingPricingPreview } from './components/LandingPricingPreview';
import { ArrowRight, Menu, X } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (role === 'admin' || role === 'org_admin') return '/admin';
    if (role === 'coach' || role === 'head_coach') return '/coach/dashboard';
    if (role === 'parent') return '/parent/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans antialiased selection:bg-slate-900 selection:text-white">
      <ScrollToTop />

      {/* 4 — NAVBAR (Floating Modern EdTech Navbar) */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 focus:outline-none group"
            aria-label="Mahfaza.co Ana Sayfa"
          >
            <MahfazaLogo size="sm" showText={false} />
            <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              MAHFAZA.CO
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600" aria-label="Ana Menü">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              Nasıl Çalışır
            </a>
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Özellikler
            </a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">
              Öğrenci
            </a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">
              Koç
            </a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">
              Veli
            </a>
            <Link to="/pricing" className="hover:text-blue-600 transition-colors">
              Fiyatlandırma
            </Link>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md"
              >
                Panele Git
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs hover:shadow-md hover:-translate-y-0.5"
                >
                  <span>Ücretsiz Başla</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-950"
            aria-expanded={isMobileMenuOpen}
            aria-label="Menüyü aç veya kapat"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-b border-slate-200 px-4 pt-3 pb-6 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-blue-600"
              >
                Nasıl Çalışır
              </a>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-blue-600"
              >
                Özellikler
              </a>
              <a
                href="#roles"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-blue-600"
              >
                Öğrenci
              </a>
              <a
                href="#roles"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-blue-600"
              >
                Koç
              </a>
              <a
                href="#roles"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-blue-600"
              >
                Veli
              </a>
              <Link
                to="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-blue-600"
              >
                Fiyatlandırma
              </Link>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <Link
                  to={getDashboardPath()}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-xs"
                >
                  Panele Git
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center text-slate-700 border border-slate-200 font-semibold py-2.5 rounded-xl text-sm"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-xs"
                  >
                    Ücretsiz Başla
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 5, 6, 7, 8, 11 — HERO SECTION & HERO MOCKUP */}
      <LandingHero />

      {/* 16 — HOW IT WORKS (4 STEPS) */}
      <LandingHowItWorks />

      {/* 9, 10, 13 — ACADEMIC ECOSYSTEM (YKS / LGS / KPSS SEPARATE DATA CONSISTENCY) */}
      <LandingEcosystem />

      {/* 14, 15 — ASYMMETRICAL BENTO GRID */}
      <LandingBentoGrid />

      {/* 17, 18 — PRODUCT DEEP DIVE (SHOWCASE 1 & 2) */}
      <LandingProductDeepDive />

      {/* ROLES (ÖĞRENCİ / KOÇ / VELİ) */}
      <LandingRolesInteractive />

      {/* 20 — TRUST & CREDIBILITY */}
      <LandingTrustCredibility />

      {/* 19 — TESTIMONIALS (VIP Üyelerimizin Deneyimleri) */}
      <LandingTestimonials />

      {/* 21 — PRICING PREVIEW */}
      <LandingPricingPreview />

      {/* 22 — FINAL CTA (Deep Indigo & Electric Blue) */}
      <section className="relative py-24 bg-gradient-to-br from-[#11184F] via-[#172554] to-[#1E2A78] text-white text-center overflow-hidden">
        {/* Ambient subtle light wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-72 bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-400/30 text-blue-200 text-xs font-mono font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>AKADEMİK YÖNETİM SİSTEMİ</span>
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Planını kur. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white">
              Hedefine doğru ilerle.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
            Öğrenci, koç ve veliyi tek bir akademik yönetim sisteminde buluşturan yeni nesil eğitim koçluğu platformu.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <span>Ücretsiz Başla</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#pricing-preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition-colors text-sm backdrop-blur-xs"
            >
              <span>Paketleri İncele</span>
            </a>
          </div>
        </div>
      </section>

      {/* 23 — MINIMAL LUXURY FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <MahfazaLogo size="sm" showText={false} />
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  MAHFAZA.CO
                </span>
              </div>
              <p className="text-slate-600 text-xs max-w-md italic">
                "Eğitimde plan, disiplin ve sürdürülebilir gelişim."
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                <span>
                  <strong className="text-slate-700">İletişim:</strong>{' '}
                  <a href="mailto:mahfaza.co@gmail.com" className="text-indigo-600 font-semibold hover:underline">
                    mahfaza.co@gmail.com
                  </a>
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700">Kurucu:</strong> Serkan Koçak (Kurucu Eğitimci & Sınav Stratejisti)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-700">
              <a href="#platform-overview" className="hover:text-slate-950 transition-colors">
                Platform
              </a>
              <a href="#features" className="hover:text-slate-950 transition-colors">
                Özellikler
              </a>
              <a href="#pricing-preview" className="hover:text-slate-950 transition-colors">
                Paketler
              </a>
              <a href="#how-it-works" className="hover:text-slate-950 transition-colors">
                Nasıl Çalışır?
              </a>
              <Link to="/login" className="hover:text-slate-950 transition-colors">
                Giriş Yap
              </Link>
              <Link to="/register" className="hover:text-slate-950 transition-colors">
                Ücretsiz Başla
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <div>
              © {new Date().getFullYear()} Mahfaza.co. Tüm hakları saklıdır.
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              YKS · LGS · KPSS Academic OS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
