import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { Badge } from './common/Badge';
import {
  Trophy,
  TrendingUp,
  Sparkles,
  Quote,
  X,
  Target,
  GraduationCap,
  Award,
} from 'lucide-react';

interface SuccessStory {
  id: string;
  name: string;
  avatarUrl: string;
  exam: 'YKS' | 'LGS' | 'KPSS';
  rank: string;
  targetSchool: string;
  department: string;
  startingNet: number;
  finalNet: number;
  quote: string;
  story: string;
  tips: string[];
}

const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: 'story-1',
    name: 'Zeynep Kaya',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    exam: 'YKS',
    rank: 'Türkiye 142.si (YKS Sayısal)',
    targetSchool: 'Boğaziçi Üniversitesi',
    department: 'Bilgisayar Mühendisliği',
    startingNet: 64.5,
    finalNet: 109.25,
    quote: 'Düzenli deneme analizi ve koçumun haftalık nokta atışı soru hedefleriyle son 4 ayda 25 net artırdım.',
    story: 'Sene başında özellikle Matematik ve Fizik konularında yetiştirememe kaygım vardı. Mahfaza üzerinden her gün eksik konu taraması yapıp koçumla çalışma günlüklerimi paylaştım.',
    tips: ['Yanlış çıkan her sorunun çözüm videosunu mutlaka aynı gün izlemek', 'Pomodoro ile 50dk odak / 10dk mola disiplini', 'Günlük motivasyon ve stres seviyesini takip etmek'],
  },
  {
    id: 'story-2',
    name: 'Mert Aksoy',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    exam: 'YKS',
    rank: 'Türkiye 88.si (YKS EA)',
    targetSchool: 'Koç Üniversitesi',
    department: 'Hukuk Fakültesi (%100 Burslu)',
    startingNet: 52.0,
    finalNet: 101.5,
    quote: 'Eşit Ağırlıkta derece yapmanın anahtarı Matematikte net kaybetmemek ve istikrarlı tekrar.',
    story: 'Edebiyat yazar-eser ezberini Mahfaza tekrarlarıyla pekiştirdim. Koçumun önerdiği deneme stratejileri sayesinde sınav anı panik yapmadan netlerimi zirveye taşıdım.',
    tips: ['Matematikte temel kavramları hafife almamak', 'Ezber dersleri için aralıklı tekrar uygulamak', 'Net dalgalanmalarında pes etmeyip sürece odaklanmak'],
  },
  {
    id: 'story-3',
    name: 'Elif Sena Yıldız',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    exam: 'LGS',
    rank: '%0.08 Dilim (496 Puan)',
    targetSchool: 'Galatasaray Lisesi',
    department: 'Fransızca Hazırlık',
    startingNet: 68.0,
    finalNet: 89.0,
    quote: 'Yeni nesil fen ve matematik sorularındaki korkumu koçumla çözdüğümüz stratejik sorularla aştım.',
    story: 'LGS 6 ders MEB müfredatında özellikle paragraf ve analitik geometri sorularında zorlanıyordum. Her hafta çözdüğüm denemelerin ayrıntılı analizi beni Galatasaray Lisesine taşıdı.',
    tips: ['Günde en az 30 sayfa kitap okuyup paragraf refleksini geliştirmek', 'Yeni nesil soruları aşamalandırarak çözmek', 'Sınav anı kaygısını nefes egzersizleriyle dindirmek'],
  },
  {
    id: 'story-4',
    name: 'Ahmet Faruk Yılmaz',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    exam: 'KPSS',
    rank: 'KPSS P3: 94.20 (Türkiye 215.si)',
    targetSchool: 'Milli Eğitim Bakanlığı',
    department: 'Matematik Öğretmenliği',
    startingNet: 60.0,
    finalNet: 104.5,
    quote: 'Tarih ve Coğrafya ezberini düzenli deneme çözümüyle pekiştirdim, ilk tercihimle atandım!',
    story: 'Hem çalışıp hem KPSS hazırlanırken zaman yönetimi çok kritikti. Mahfaza mobil arayüzü sayesinde etütlerimi eksiksiz tamamlayarak 94 puan aldım.',
    tips: ['Vatandaşlık ve güncel bilgileri son haftalara bırakmamak', 'Tarihte kronolojik harita tekniği', 'Haftada en az 1 branş denemesi bitirmek'],
  },
];

interface SuccessStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessStoriesModal: React.FC<SuccessStoriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'YKS' | 'LGS' | 'KPSS'>('ALL');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredStories = selectedFilter === 'ALL'
    ? SUCCESS_STORIES
    : SUCCESS_STORIES.filter((s) => s.exam === selectedFilter);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-stories-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="success-stories-title" className="text-base sm:text-lg font-bold text-white">Mahfaza.co Başarı Hikayeleri</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  VIP Dereceler
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                YKS, LGS ve KPSS'de hedefine ulaşan derece öğrencilerinin net artış süreçleri ve tavsiyeleri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {(['ALL', 'YKS', 'LGS', 'KPSS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'Tüm Başarı Hikayeleri' : `${cat} Dereceleri`}
            </button>
          ))}
        </div>

        {/* Stories List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {filteredStories.map((story) => (
            <Card
              key={story.id}
              className="p-4 sm:p-5 border border-slate-200 hover:border-amber-400/80 transition-all bg-white shadow-xs rounded-2xl"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* User info */}
                <div className="flex items-center gap-3.5">
                  <img
                    src={story.avatarUrl}
                    alt={story.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.name)}&background=f59e0b&color=fff&bold=true`;
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-xs shrink-0"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{story.name}</h4>
                      <Badge variant="primary" size="sm">
                        {story.exam}
                      </Badge>
                      <span className="text-[11px] sm:text-xs font-bold font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        {story.rank}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {story.targetSchool} • <span className="text-indigo-600 font-semibold">{story.department}</span>
                    </p>
                  </div>
                </div>

                {/* Net Increase Box */}
                <div className="w-full md:w-auto flex items-center justify-around md:justify-start gap-3 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200 shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 font-medium block">Başlangıç</span>
                    <span className="font-mono font-bold text-xs text-slate-700">{story.startingNet} Net</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="text-center">
                    <span className="text-[10px] text-emerald-600 font-bold block">Sonuç</span>
                    <span className="font-mono font-extrabold text-sm text-emerald-700">{story.finalNet} Net</span>
                  </div>
                  <div className="text-center pl-2 border-l border-slate-200">
                    <span className="text-[10px] text-amber-700 font-bold block">Net Artışı</span>
                    <span className="font-mono font-extrabold text-xs text-amber-800">
                      +{(story.finalNet - story.startingNet).toFixed(1)} Net
                    </span>
                  </div>
                </div>
              </div>

              {/* Quote & Story */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-start gap-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 text-xs text-amber-950 font-medium italic">
                  <Quote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>"{story.quote}"</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {story.story}
                </p>

                {/* Tips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" /> Tavsiyeleri:
                  </span>
                  {story.tips.map((tip, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                    >
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600 font-medium">
            Sen de koçunun belirlediği planı uygulayarak adını Mahfaza başarı listesine yazdırabilirsin! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};
