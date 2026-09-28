import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { SubscriptionPlan, PriceCalculationResult } from '../../types/saas.types';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import {
  ArrowRight,
  Check,
  Star,
  Tag,
  ShieldCheck,
  HelpCircle,
  Clock,
  Sparkles,
  Lock,
  Headphones,
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [discountMessage, setDiscountMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);
  const [pricingMap, setPricingMap] = useState<Record<string, PriceCalculationResult>>({});
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const allPlans = await db.getSubscriptionPlans();
    const activePlans = allPlans.filter((p) => p.is_active);
    setPlans(activePlans);
    calculateAllPrices(activePlans, billingCycle, appliedDiscount || undefined);
  };

  const calculateAllPrices = async (
    targetPlans: SubscriptionPlan[],
    cycle: 'monthly' | 'yearly',
    code?: string
  ) => {
    const map: Record<string, PriceCalculationResult> = {};
    for (const plan of targetPlans) {
      const res = await db.calculateSubscriptionPrice(plan.id, cycle, code);
      map[plan.id] = res;
    }
    setPricingMap(map);
  };

  const handleCycleChange = (cycle: 'monthly' | 'yearly') => {
    setBillingCycle(cycle);
    calculateAllPrices(plans, cycle, appliedDiscount || undefined);
  };

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!discountCode.trim()) {
      setDiscountMessage({ text: 'Lütfen bir indirim kodu giriniz.', isSuccess: false });
      return;
    }

    setIsApplying(true);
    try {
      const testPlan = plans[0];
      if (!testPlan) return;

      const res = await db.calculateSubscriptionPrice(testPlan.id, billingCycle, discountCode.trim());
      if (res.error_message) {
        setDiscountMessage({ text: res.error_message, isSuccess: false });
        setAppliedDiscount(null);
        calculateAllPrices(plans, billingCycle);
      } else {
        setAppliedDiscount(discountCode.trim().toUpperCase());
        setDiscountMessage({
          text: `"${discountCode.trim().toUpperCase()}" kuponu başarıyla uygulandı!`,
          isSuccess: true,
        });
        calculateAllPrices(plans, billingCycle, discountCode.trim().toUpperCase());
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <MahfazaLogo size="md" subtitle="Akademik Yönetim Platformu" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Ana Sayfa
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-xs"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      {/* Main Pricing Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-950 text-[11px] font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ŞEFFAF VE MODÜLER FİYATLANDIRMA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Akademik Başarınız İçin Şeffaf Paketler
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Her ay birebir özel ders hediyeli, yapay zekâ analizli ve pedagojik koçluk destekli hazırlık ekosistemi.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="pt-6 flex items-center justify-center">
            <div className="inline-flex items-center p-1.5 rounded-xl bg-slate-200/80 border border-slate-300 shadow-xs">
              <button
                onClick={() => handleCycleChange('monthly')}
                className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aylık Ödeme
              </button>
              <button
                onClick={() => handleCycleChange('yearly')}
                className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Yıllık Ödeme</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                  billingCycle === 'yearly' ? 'bg-amber-300 text-blue-950' : 'bg-blue-600 text-white'
                }`}>
                  %25+ Tasarruf
                </span>
              </button>
            </div>
          </div>

          {/* Coupon Input Bar */}
          <div className="pt-2 max-w-md mx-auto">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="İndirim Kodu (Örn: SERKAN2027)"
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <button
                type="submit"
                disabled={isApplying}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isApplying ? '...' : 'Uygula'}
              </button>
            </form>

            {discountMessage && (
              <p
                className={`mt-2 text-xs font-semibold ${
                  discountMessage.isSuccess ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {discountMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch">
          {plans.map((plan) => {
            const isYearly = billingCycle === 'yearly';
            const priceCalc = pricingMap[plan.id];
            const basePrice = isYearly ? plan.yearly_price : plan.monthly_price;
            const finalPrice = priceCalc ? priceCalc.final_price : basePrice;
            const hasDiscount = priceCalc && priceCalc.discount_amount > 0;
            const savings = isYearly && plan.monthly_price > 0 ? (plan.monthly_price * 12) - plan.yearly_price : 0;

            return (
              <div
                key={plan.id}
                className={`p-6 sm:p-7 rounded-2xl flex flex-col justify-between transition-all relative ${
                  plan.is_featured
                    ? 'bg-gradient-to-b from-blue-50/20 via-white to-white border-2 border-blue-600 ring-4 ring-blue-500/10 shadow-lg scale-102 z-10'
                    : 'bg-white border border-slate-200/90 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                {plan.is_featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> En Çok Tercih Edilen
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{plan.name}</h3>
                  </div>

                  {plan.private_lessons_per_month && plan.private_lessons_per_month > 0 ? (
                    <div className="mb-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200 shadow-2xs">
                        🎁 {plan.private_lessons_per_month} Özel Ders / Ay
                      </span>
                    </div>
                  ) : null}

                  <p className="text-xs text-slate-600 min-h-[36px] line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Price Tag */}
                  <div className="mt-5 mb-5 pb-5 border-b border-slate-100">
                    {plan.monthly_price === 0 && plan.yearly_price === 0 ? (
                      <div>
                        <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">
                          {plan.slug === 'enterprise' ? 'Özel Teklif' : '0 TL'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {plan.slug === 'enterprise' ? 'Kurumsal anlaşmalar için' : 'Ücretsiz başlangıç'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        {hasDiscount && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-400 line-through font-mono">
                              {basePrice.toLocaleString('tr-TR')} TL
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              -{priceCalc.discount_amount.toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
                            {finalPrice.toLocaleString('tr-TR')} TL
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/{isYearly ? 'yıl' : 'ay'}</span>
                        </div>
                        {isYearly && savings > 0 && !hasDiscount && (
                          <p className="text-[11px] font-bold text-emerald-700 mt-1">
                            Yıllık {savings.toLocaleString('tr-TR')} TL avantaj
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-950">
                      Paket Kapsamı:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 font-bold shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-4 border-t border-slate-100">
                  <button
                    onClick={() =>
                      navigate(
                        `/register?plan=${plan.slug}&billing=${billingCycle}${
                          appliedDiscount ? `&code=${appliedDiscount}` : ''
                        }`
                      )
                    }
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      plan.is_featured
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{plan.slug === 'free' ? 'Ücretsiz Başlat' : plan.slug === 'enterprise' ? 'Teklif Al' : 'Bu Paketi Seç'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Callout */}
        <div className="mt-16 bg-white border border-slate-200 rounded-xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              KURUMSAL ÇÖZÜMLER
            </span>
            <h3 className="text-xl font-bold text-slate-900">
              Dershane, Kurs veya Özel Okul musunuz?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              250+ öğrenci kapasiteli kurumsal paketlerimiz, çoklu koçluk hiyerarşisi, veli SMS bildirim motoru ve kurumunuza özel başarı raporlama modülleri içerir.
            </p>
          </div>
          <Link
            to="/register?plan=enterprise"
            className="shrink-0 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-colors"
          >
            Kurumsal Teklif İste
          </Link>
        </div>

        {/* Trust & Guarantee Badges */}
        <div className="mt-16 pt-12 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">14 Gün İade Güvencesi</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Memnun kalmazsanız ilk 14 gün içinde koşulsuz tam iade hakkı.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">256-Bit SSL Güvenli Ödeme</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Tüm işlemler uluslararası bankacılık güvenlik standartlarıyla korunur.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Headphones className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Öncelikli Destek</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Teknik ve pedagojik sorularınız için doğrudan uzman koç desteği.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto text-left">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              MERAK EDİLENLER
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Sıkça Sorulan Sorular
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Özel ders hediyeleri nasıl işliyor?',
                a: 'Pro paketinde her ay 1 adet (60 dk), Premium paketinde ise her ay 2 adet (60 dk) birebir canlı özel ders hediyesi tanımlanır. İstediğiniz ders ve konuyu seçerek dilediğiniz gün ve saatte uzman branş öğretmeninizle canlı seansınızı yapabilirsiniz.',
              },
              {
                q: 'Paketimi dilediğim zaman yükseltebilir veya iptal edebilir miyim?',
                a: 'Evet. Üyelik paneliniz üzerinden dilediğiniz an tek tıkla üst pakete geçebilir veya üyeliğinizi iptal edebilirsiniz. Yıllık aboneliklerde kalan süre güvence altındadır.',
              },
              {
                q: 'Veli paneli için ekstra ücret ödemem gerekir mi?',
                a: 'Hayır. Starter, Pro ve Premium paketlerimizde veli takip paneli ve anlık bildirim erişimi tamamen ücretsiz olarak dahildir.',
              },
              {
                q: 'YKS, LGS ve KPSS için ayrı paket mi almam gerekir?',
                a: 'Hayır. Mahfaza.co tek bir lisans ile seçtiğiniz sınav moduna (YKS, LGS veya KPSS) otomatik olarak adapte olur. Sınav türünü profilinizden istediğiniz an değiştirebilirsiniz.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  {faq.q}
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
