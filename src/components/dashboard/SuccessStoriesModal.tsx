import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Trophy, Star, TrendingUp, Award, Sparkles, BookOpen, Quote, ChevronRight, GraduationCap } from 'lucide-react';

interface SuccessStory {
  id: string;
  name: string;
  avatar_url: string;
  exam: 'YKS' | 'LGS' | 'KPSS';
  year: string;
  field: string;
  rank: string;
  startingNet: number;
  finalNet: number;
  targetSchool: string;
  department: string;
  quote: string;
  story: string;
  tips: string[];
}

const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: 'story-1',
    name: 'Zeynep Kaya',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    exam: 'YKS',
    year: '2026',
    field: 'SAY (Sayısal)',
    rank: 'Türkiye 142.si',
    startingNet: 64.5,
    finalNet: 109.25,
    targetSchool: 'Boğaziçi Üniversitesi',
    department: 'Bilgisayar Mühendisliği',
    quote: 'Düzenli deneme analizi ve koçumun haftalık nokta atışı görevleri olmasaydı son 3 ayda 20 net artıramazdım.',
    story: 'Sene başında TYT matematikte süre yetiştiremiyordum. Koçumla birlikte Mahfaza üzerinde her hafta yanlış analizi yaparak eksik konulara odaklandık. AYT Fizik ve Matematik fasikül takibini eksiksiz uygulayarak hedefime ulaştım.',
    tips: ['Haftada en az 2 genel deneme çözüp yanlışları analiz etmek', 'Pomodoro tekniği ile odaklanmayı artırmak', 'Her gün duygu durumunu ve motivasyonunu not almak'],
  },
  {
    id: 'story-2',
    name: 'Mert Aksoy',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    exam: 'YKS',
    year: '2026',
    field: 'EA (Eşit Ağırlık)',
    rank: 'Türkiye 88.si',
    startingNet: 52.0,
    finalNet: 101.5,
    targetSchool: 'Koç Üniversitesi',
    department: 'Hukuk Fakültesi (Tam Burslu)',
    quote: 'Edebiyat ve Matematik dengesini kurmak Mahfaza ile çok kolaylaştı.',
    story: 'Eşit ağırlıkta derece yapmanın anahtarı Matematikte net kaybetmemek ve Edebiyat yazar-eser ezberini sistemli tekrarlamaktı. Haftalık soru hedeflerimi koçumla birlikte sabırla takip ettik.',
    tips: ['Matematikte temel kavramları hafife almamak', 'Ezber dersleri için aralıklı tekrar uygulamak', 'Net dalgalanmalarında moral bozmayıp sürece güvenmek'],
  },
  {
    id: 'story-3',
    name: 'Elif Sena Yıldız',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    exam: 'LGS',
    year: '2026',
    field: 'MEB 8. Sınıf',
    rank: '%0.08 Dilim (496 Puan)',
    startingNet: 68.0,
    finalNet: 89.0,
    targetSchool: 'Galatasaray Lisesi',
    department: 'Fransızca Hazırlık',
    quote: 'Yeni nesil fen ve matematik sorularındaki korkumu koçumla çözdüğümüz stratejik sorularla yendim.',
    story: 'LGS 6 ders müfredatında özellikle paragraf ve yeni nesil fen sorularında çok zorlanıyordum. Mahfaza üzerinden her gün eksik derslere yönelik konu tarama testleri çözerek Türkiye derecesi elde ettim.',
    tips: ['Günde en az 30 sayfa kitap okuyup paragraf refleksini geliştirmek', 'Yeni nesil soru kalıplarını adım adım analiz etmek', 'Sınav anı stresini nefes egzersizleriyle kontrol etmek'],
  },
  {
    id: 'story-4',
    name: 'Ahmet Faruk Yılmaz',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    exam: 'KPSS',
    year: '2026',
    field: 'Lisans GY-GK',
    rank: 'KPSS P3: 94.20 (Türkiye 215.si)',
    startingNet: 60.0,
    finalNet: 104.5,
    targetSchool: 'Milli Eğitim Bakanlığı',
    department: 'Matematik Öğretmenliği',
    quote: 'Tarih ve Coğrafya ezberini düzenli deneme çözümüyle pekiştirdim, atandım!',
    story: 'Çalışırken KPSS hazırlanmak çok zordu. Mahfaza mobil arayüzü sayesinde boş vakitlerimde çalışma günlüklerimi girdim, koçumun verdiği soru hedeflerini tamamlayarak 94 puanla ilk tercihimle atandım.',
    tips: ['Vatandaşlık ve güncel bilgileri son aylara bırakmamak', 'Tarihte kronolojik haritalarla çalışmak', 'Haftada en az 1 branş denemesi bitirmek'],
  },
];

export const SuccessStoriesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [selectedExam, setSelectedExam] = useState<'ALL' | 'YKS' | 'LGS' | 'KPSS'>('ALL');
  const [activeStory, setActiveStory] = useState<SuccessStory | null>(null);

  if (!isOpen) return null;

  const filtered = selectedExam === 'ALL'
    ? SUCCESS_STORIES
    : SUCCESS_STORIES.filter((s) => s.exam === selectedExam);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Mahfaza Başarı Hikayeleri & İlham Köşesi</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  VIP Dereceler
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                YKS, LGS ve KPSS'de hedeflerine ulaşan öğrencilerimizin net artış süreçleri ve tavsiyeleri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm font-bold border border-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {(['ALL', 'YKS', 'LGS', 'KPSS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedExam(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedExam === cat
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
          {filtered.map((story) => (
            <Card
              key={story.id}
              className="p-4 sm:p-5 border border-slate-200 hover:border-amber-400/80 transition-all bg-white shadow-xs rounded-2xl group"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* User info */}
                <div className="flex items-center gap-3.5">
                  <img
                    src={story.avatar_url}
                    alt={story.name}
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
                    <p className="text-[11px] text-slate-400 mt-0.5">{story.field} ({story.year})</p>
                  </div>
                </div>

                {/* Net increase pill */}
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
                    <span className="text-[10px] text-amber-700 font-bold block">Artış</span>
                    <span className="font-mono font-extrabold text-xs text-amber-800">
                      +{(story.finalNet - story.startingNet).toFixed(1)} Net
                    </span>
                  </div>
                </div>
              </div>

              {/* Quote & Story Details */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-start gap-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-950 font-medium italic">
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
