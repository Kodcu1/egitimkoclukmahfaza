import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Star, Sparkles } from 'lucide-react';

export const LandingPricingPreview: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      badge: 'Temel Başlangıç',
      price: '0',
      period: 'aylık',
      description: 'Bireysel çalışma planı ve temel soru takibi için ücretsiz başlangıç paketi.',
      features: [
        'Günlük soru ve çalışma günlüğü takibi',
        'Temel TYT / AYT deneme kaydı',
        'Pomodoro odaklanma odası',
        'Aylık 10 AI soru analizi',
      ],
      ctaText: 'Ücretsiz Başla',
      ctaLink: '/register?plan=free',
      isPopular: false,
    },
    {
      name: 'Starter',
      badge: 'Bireysel Öğrenci',
      price: '1.490',
      period: 'aylık',
      description: 'Detaylı analiz, veli takip entegrasyonu ve konu hakimiyet taraması.',
      features: [
        'Tüm Free plan özellikleri',
        'Veli eşleştirme ve anlık veli paneli',
        'Resmi PDF gelişim karnesi',
        'Konu hakimiyet ve risk haritası',
        'Aylık 100 AI çalışma önerisi',
      ],
      ctaText: 'Starter Seç',
      ctaLink: '/pricing',
      isPopular: false,
    },
    {
      name: 'Pro',
      badge: 'En Çok Tercih Edilen',
      giftBadge: '🎁 1 Özel Ders / Ay',
      price: '2.490',
      period: 'aylık',
      description: 'Bireysel derece koçluğu ve her ay 1 x 60 dk birebir özel ders hediyeli tam hazırlık.',
      features: [
        'Ayda 1 x 60 dk Birebir Özel Ders Hediyesi',
        '15 Öğrenciye kadar tam koçluk yönetimi',
        'Görev atama ve kanıt onay merkezi',
        'Öğrenci akademik risk motoru',
        'Öğrenci ve veli ile dahili mesajlaşma',
        'Gelişmiş AI haftalık çalışma planlayıcı',
      ],
      ctaText: 'Pro’ya Katıl',
      ctaLink: '/pricing',
      isPopular: true,
    },
    {
      name: 'Premium',
      badge: 'VIP Derece',
      giftBadge: '🎁 2 Özel Ders / Ay',
      price: '3.990',
      period: 'aylık',
      description: 'En üst düzey derece hedefi için her ay 2 x 60 dk özel ders ve 7/24 öncelikli mentorluk.',
      features: [
        'Ayda 2 x 60 dk Birebir Özel Ders Hediyesi',
        '50 Öğrenciye kadar sınırsız koçluk portföyü',
        '7/24 Öncelikli VIP koçluk desteği',
        'Kişiye özel YKS strateji & net simülasyonu',
        'Toplu ödev, deneme ve kanıt yönetimi',
      ],
      ctaText: 'Premium Seç',
      ctaLink: '/pricing',
      isPopular: false,
    },
    {
      name: 'Kurumsal',
      badge: 'Okul & Kurs',
      price: 'Özel',
      period: 'yıllık teklif',
      description: 'Kurumlar, dershaneler ve özel okullar için sınırsız öğrenci ve çoklu koçluk organizasyonu.',
      features: [
        'Sınırsız öğrenci & koç lisansı',
        'Kurumsal şube ve sınıf hiyerarşisi',
        'Merkezi yönetim & API entegrasyonu',
        'Özel kurumsal başarı raporları',
        'Kuruma özel başarı yöneticisi',
      ],
      ctaText: 'Teklif Al',
      ctaLink: '/pricing',
      isPopular: false,
    },
  ];

  return (
    <section id="pricing-preview" className="py-24 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-950 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ŞEFFAF VE MODÜLER ÜYELİK</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Akademik Hedefinize Uygun Şeffaf Paketler
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Gizli ücret veya taahhüt yok. Her ay birebir özel ders hediyeli, yapay zekâ destekli Mahfaza.co akademik ekosistemi.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-stretch">
          {plans.map((plan, index) => {
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all ${
                  plan.isPopular
                    ? 'border-2 border-blue-600 ring-4 ring-blue-500/10 shadow-lg relative bg-gradient-to-b from-blue-50/20 via-white to-white'
                    : 'border border-slate-200/90 hover:border-slate-300 shadow-xs'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-mono font-bold uppercase px-3.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900 uppercase block">
                        {plan.name}
                      </span>
                      {plan.giftBadge && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs">
                          {plan.giftBadge}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      {plan.price !== 'Özel' && <span className="text-xs text-slate-500 font-semibold">₺</span>}
                      <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/{plan.period}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    to={plan.ctaLink}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      plan.isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/pricing"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 inline-flex items-center gap-1"
          >
            <span>Tüm paket detaylarını ve yıllık indirim fırsatlarını karşılaştırın</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
