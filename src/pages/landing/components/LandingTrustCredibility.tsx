import React from 'react';
import { Database, UserCheck, Layers, LineChart } from 'lucide-react';

export const LandingTrustCredibility: React.FC = () => {
  const pillars = [
    {
      title: 'Veri Odaklı',
      description: 'Akademik süreçler tahminlerle değil, net ve soru istatistikleriyle ölçülebilir hale gelir.',
      icon: Database,
    },
    {
      title: 'Kişiselleştirilmiş',
      description: 'Her öğrenci kendi hedef taban puanı, zafiyet alanları ve öğrenme hızına göre ilerler.',
      icon: UserCheck,
    },
    {
      title: 'Tek Merkez',
      description: 'Öğrenci, veli ve koç aynı sistemde tam senkronizasyonla çalışır; bilgi kaybı yaşanmaz.',
      icon: Layers,
    },
    {
      title: 'Ölçülebilir',
      description: 'Haftalık görev sadakati, deneme net eğrileri ve konu eksikleri somut verilerle takip edilir.',
      icon: LineChart,
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shadow-xs">
                  <Icon className="w-5 h-5 text-indigo-950" />
                </div>
                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                  {pillar.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
