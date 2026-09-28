import React from 'react';
import { Target, CheckSquare, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';

export const LandingHowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      phase: 'PLANLA',
      title: 'Akademik Planını Kur',
      description:
        'Hedeflediğin üniversite, lise veya kamu kadrosu taban puanlarını belirle. Hedef ile mevcut durum arasındaki net açığını tespit edip haftalık kişiselleştirilmiş programını oluştur.',
      tag: 'Hedef Belirleme & Boşluk Analizi',
      icon: Target,
      accentColor: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      dotColor: 'bg-blue-600',
    },
    {
      number: '02',
      phase: 'TAKİP ET',
      title: 'Günlük Disiplinini Koru',
      description:
        'Pomodoro odak sayaçları, günlük çözülen soru sayıları ve görev akışıyla her gününü yüksek verimle sürdür. Koçunla anlık senkronize kal.',
      tag: 'Etüt Sayaçları & Görev Akışı',
      icon: CheckSquare,
      accentColor: 'from-violet-600 to-indigo-600',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
      dotColor: 'bg-violet-600',
    },
    {
      number: '03',
      phase: 'GELİŞ',
      title: 'Zafiyetleri Kapat ve Yüksel',
      description:
        'Deneme sonuçlarını sisteme işle. Zafiyet taramaları, konu karneleri ve net gelişim eğrileriyle eksiklerini kapatıp hedefine emin adımlarla ulaş.',
      tag: 'Kazanım Analizi & Net Artışı',
      icon: TrendingUp,
      accentColor: 'from-emerald-600 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-600',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-950 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>METODOLOJİ & SÜREÇ</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            3 Aşamalı Başarı Metodolojisi
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Sınav başarısı tesadüf değildir; net bir plan, günlük disiplin ve düzenli analitik ölçümün doğal bir sonucudur.
          </p>
        </div>

        {/* 3 Bento-Style Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative bg-gradient-to-b from-white via-slate-50/50 to-slate-50/80 border border-slate-200/90 rounded-2xl p-8 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    {/* Phase & Number */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
                        {step.number} — {step.phase}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-slate-800" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${step.badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${step.dotColor}`} />
                    <span>{step.tag}</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
