import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Sparkles, Quote } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  {
    quote: 'Gelecek, hedeflerinin güzelliğine inananlarındır. Bugün çözdüğün her soru, yarınki başarına açılan kapıdır.',
    author: 'Eleanor Roosevelt / YKS Koçluk',
    tag: 'Disiplin & İnanç',
  },
  {
    quote: 'Zirveye giden yol diktir, fakat manzara harikadır. Yorulduğunda dinlenmeyi öğren, pes etmeyi değil.',
    author: 'Kobe Bryant',
    tag: 'Odaklanma',
  },
  {
    quote: 'Başarı, her gün tekrarlanan küçük disiplinlerin ve çözülen soruların toplamıdır.',
    author: 'Robert Collier',
    tag: 'Süreklilik',
  },
  {
    quote: 'En zorlu fırtınalar en yetenekli denizcileri yetiştirir. Zor denemeler seni zirveye hazırlar.',
    author: 'Anonim',
    tag: 'Direnç',
  },
  {
    quote: 'Bugün yaptıkların, yarın olmak istediğin kişiyi inşa eder. Odaklan, masana otur ve fark yarat.',
    author: 'Mahfaza.co Eğitim Koçluğu',
    tag: 'Koç Tavsiyesi',
  },
  {
    quote: 'Büyük başarılar bir anda değil, her gün atılan kararlı adımlarla kazanılır. Masadaki her dakika değerlidir.',
    author: 'Düşünce Lideri',
    tag: 'Zaman Yönetimi',
  },
];

export const MotivationCard: React.FC = () => {
  const [index] = useState(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    return dayOfYear % MOTIVATIONAL_QUOTES.length;
  });

  const item = MOTIVATIONAL_QUOTES[index];

  return (
    <Card className="bg-gradient-to-r from-amber-50/90 via-indigo-50/70 to-blue-50/90 border border-amber-200/90 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-gradient-to-br from-amber-400/20 to-indigo-400/20 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
          <Quote className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-900 bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
              <Sparkles className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} /> Günün Motivasyonu
            </span>
            <span className="text-[11px] font-semibold text-slate-600">• {item.tag}</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 italic leading-relaxed pt-0.5">
            "{item.quote}"
          </p>
          <p className="text-xs font-bold text-indigo-900">
            — {item.author}
          </p>
        </div>
      </div>
    </Card>
  );
};
