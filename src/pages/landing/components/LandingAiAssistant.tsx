import React, { useState } from 'react';
import { FileCheck, Activity, CheckCircle2 } from 'lucide-react';

export const LandingAiAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'math' | 'physics' | 'turkish'>('math');

  const insightsData = {
    math: {
      subject: 'TYT Matematik Zafiyet Taraması',
      category: 'Problem & Sayılar Analizi',
      observation: 'Son 4 denemede matematik problem süresinde %42 artış ve net dalgalanması saptandı.',
      detail: 'Soru başına harcanan süre 1.8 dakikadan 2.8 dakikaya çıktı. Soru kökü analizinde zaman kaybı yaşanıyor.',
      recommendation: '7 günlük yoğunlaştırılmış 15’li problem hız seti tanımlandı.',
      actionNote: 'Günde +40 problem sorusu ve haftalık 2 konu tarama testi programa dahil edildi.',
      impact: '+6.5 Net Telafi Potansiyeli',
    },
    physics: {
      subject: 'AYT Fizik Kazanım Raporu',
      category: 'Mekanik & Elektrik',
      observation: 'Elektrik ve Manyetizma konularında istikrarlı net artışı kaydedildi.',
      detail: 'Konu bazlı soru çözüm doğruluğu %91 seviyesine ulaştı. Süre yönetimi standart seviyede.',
      recommendation: 'AYT Fizik için branş denemesi periyoduna geçildi.',
      actionNote: 'Haftada 2 branş denemesi takvime alındı.',
      impact: '13.5 Net Seviyesi Korunuyor',
    },
    turkish: {
      subject: 'TYT Türkçe Hız & Odaklanma Karnesi',
      category: 'Paragraf & Anlam Bilgisi',
      observation: 'Paragraf çözüm süresi 48 dakikadan 38 dakikaya geriledi.',
      detail: 'Son 18 gündür günlük 25 paragraf görevi %100 sadakatle tamamlandı.',
      recommendation: 'Mevcut hızın korunması ve 2 mini dil bilgisi testi eklenmesi uygun görüldü.',
      actionNote: 'Yazım kuralları hız testi programa entegre edildi.',
      impact: 'Ekstra 10 Dk Sınav Süresi Kazancı',
    },
  };

  const currentInsight = insightsData[activeTab];

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Pedagojik Teşhis Motoru
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Veriye Dayalı Analiz ve Karar Mekanizması
          </h2>
          <p className="mt-2 text-slate-600 text-base">
            Deneme sınav verilerini tarar; ham sonuçları koç ve öğrenci için somut haftalık çalışma kararlarına dönüştürür.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {[
            { id: 'math', label: 'TYT Matematik Analizi' },
            { id: 'physics', label: 'AYT Fizik Analizi' },
            { id: 'turkish', label: 'TYT Türkçe Analizi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'math' | 'physics' | 'turkish')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="text-base font-bold text-slate-900">{currentInsight.subject}</h3>
                <span className="text-xs text-slate-500">{currentInsight.category}</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
              {currentInsight.impact}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Sistem Gözlemi</span>
              <p className="text-sm font-semibold text-slate-900">"{currentInsight.observation}"</p>
              <p className="text-xs text-slate-600 leading-relaxed">{currentInsight.detail}</p>
            </div>

            <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Önerilen Aksiyon</span>
              <p className="text-sm font-semibold text-slate-900">"{currentInsight.recommendation}"</p>
              <div className="pt-2 text-xs text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>{currentInsight.actionNote}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
