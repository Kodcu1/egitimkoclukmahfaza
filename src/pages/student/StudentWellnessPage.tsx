import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Heart,
  Wind,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Brain,
  Smile,
  Compass,
  CheckCircle2,
  Headphones,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DailyMoodTracker } from '../../components/dashboard/DailyMoodTracker';
import { useAuth } from '../../hooks/useAuth';

type BreathTechnique = 'box' | 'relax478' | 'focus';

interface TechniqueInfo {
  id: BreathTechnique;
  name: string;
  subtitle: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  description: string;
  badge: string;
}

const TECHNIQUES: TechniqueInfo[] = [
  {
    id: 'box',
    name: 'Kutu Nefesi (Box Breathing)',
    subtitle: 'Derin Odaklanma & Sınav Öncesi Sakinlik',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    description: 'Navy SEALs tarafından kullanılan bu teknik, kalp atışını dengeler ve beyni stres modundan çıkarıp odaklanma moduna geçirir.',
    badge: 'En Popüler',
  },
  {
    id: 'relax478',
    name: '4-7-8 Rahatlama Nefesi',
    subtitle: 'Kaygı Azaltma & Uyku / Dinlenme',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    description: 'Dr. Andrew Weil tarafından geliştirilen bu yöntem, sinir sistemini yatıştırır ve anksiyete seviyesini dakikalar içinde düşürür.',
    badge: 'Anksiyete İlacı',
  },
  {
    id: 'focus',
    name: 'Canlandırıcı 3-3-6 Nefesi',
    subtitle: 'Enerji Toplama & Ders Arası Zindelik',
    inhale: 3,
    hold1: 3,
    exhale: 6,
    hold2: 0,
    description: 'Uzun süreli etütlerden sonra zihni tazelemek ve yorgunluğu atmak için ideal hızlı toparlanma egzersizi.',
    badge: 'Zindelik',
  },
];

const STRESS_TIPS = [
  {
    icon: Brain,
    title: 'Düşünceyi Ayrıştırma (Reframing)',
    desc: '"Bu denemede netim düştü, başaramayacağım" yerine "Bu deneme bana eksik olduğum 4 spesifik konuyu gösterdi, şimdi onları kapatacağım" deyin.',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    icon: ShieldCheck,
    title: 'Sınav Kaygısı Kontrolü',
    desc: 'Kaygı hissettiğinizde ayak tabanlarınızı yere tam basın, odada 5 farklı nesneye bakın ve 3 derin nefes alarak bedeninizi şimdiye getirin.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    icon: Moon,
    title: 'Uyku Hijyeni & Zihinsel Onarım',
    desc: 'Sınava hazırlık döneminde beynin bilgiyi uzun süreli hafızaya kaydettiği yer REM uykusudur. Günde 7-8 saat kaliteli uyku net artışının gizli anahtarıdır.',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    icon: Compass,
    title: 'Süreç Odaklı Bakış Açısı',
    desc: 'Sadece sonucun sıralamasını düşünmek stres yaratır. Bugüne, çözeceğiniz 50 soruya ve tamamlayacağınız konu özetine odaklanın.',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
];

export const StudentWellnessPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueInfo>(TECHNIQUES[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Nefes Al' | 'Nefesi Tut' | 'Nefes Ver' | 'Dinlen'>('Nefes Al');
  const [countdown, setCountdown] = useState<number>(TECHNIQUES[0].inhale);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Timer loop for breathing exercise
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // Transition to next phase
          if (phase === 'Nefes Al') {
            if (selectedTechnique.hold1 > 0) {
              setPhase('Nefesi Tut');
              return selectedTechnique.hold1;
            } else {
              setPhase('Nefes Ver');
              return selectedTechnique.exhale;
            }
          } else if (phase === 'Nefesi Tut') {
            setPhase('Nefes Ver');
            return selectedTechnique.exhale;
          } else if (phase === 'Nefes Ver') {
            if (selectedTechnique.hold2 > 0) {
              setPhase('Dinlen');
              return selectedTechnique.hold2;
            } else {
              setCompletedCycles((c) => c + 1);
              setPhase('Nefes Al');
              return selectedTechnique.inhale;
            }
          } else {
            // Dinlen phase over
            setCompletedCycles((c) => c + 1);
            setPhase('Nefes Al');
            return selectedTechnique.inhale;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, phase, selectedTechnique]);

  const handleSelectTechnique = (t: TechniqueInfo) => {
    setSelectedTechnique(t);
    setIsActive(false);
    setPhase('Nefes Al');
    setCountdown(t.inhale);
    setCompletedCycles(0);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('Nefes Al');
    setCountdown(selectedTechnique.inhale);
    setCompletedCycles(0);
  };

  // Dynamic scale factor for breathing bubble
  const getBubbleScale = () => {
    if (!isActive) return 'scale-100';
    if (phase === 'Nefes Al') return 'scale-125 transition-transform duration-[4000ms] ease-out';
    if (phase === 'Nefesi Tut') return 'scale-125';
    if (phase === 'Nefes Ver') return 'scale-90 transition-transform duration-[4000ms] ease-in';
    return 'scale-95';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-amber-500/10 p-6 rounded-3xl border border-teal-200/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Stres Yönetimi & Zindelik Merkezi
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Sınav maratonunda zihnini taze tut, kaygıyı yönet ve odaklanma gücünü artır.
            </p>
          </div>
        </div>
      </div>

      {/* Mood Tracker Section */}
      <DailyMoodTracker
        studentId={user?.student_id || user?.user_id || user?.id || 'stu-01'}
        studentName={user?.name || 'Öğrenci'}
      />

      {/* Interactive Breathing Exercise App */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Breathing Circle Animation */}
        <Card className="lg:col-span-7 p-6 sm:p-8 bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-between min-h-[460px]">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                {selectedTechnique.badge}
              </Badge>
              <h3 className="font-bold text-sm text-slate-900">{selectedTechnique.name}</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Tamamlanan Döngü: <span className="text-indigo-600 font-extrabold">{completedCycles}</span>
            </span>
          </div>

          {/* Animated Circle */}
          <div className="relative my-8 flex items-center justify-center">
            <div
              className={`w-52 h-52 sm:w-64 sm:h-64 rounded-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-tr from-teal-500 via-indigo-600 to-amber-400 text-white shadow-2xl transition-all ${getBubbleScale()}`}
            >
              <span className="text-xs font-black uppercase tracking-widest text-teal-100 mb-1">
                {phase}
              </span>
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter">
                {countdown}
              </span>
              <span className="text-[11px] text-white/80 font-medium mt-1">saniye</span>
            </div>

            {/* Subtle outer pulse ring */}
            {isActive && (
              <div className="absolute inset-0 -m-4 rounded-full border-2 border-teal-400/30 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full justify-center">
            <Button
              variant={isActive ? 'secondary' : 'primary'}
              size="lg"
              onClick={() => setIsActive(!isActive)}
              className="px-8 font-bold text-sm"
              leftIcon={isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            >
              {isActive ? 'Durdur' : 'Egzersize Başla'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              title="Sıfırla"
              className="px-4"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
            </Button>
          </div>
        </Card>

        {/* Right: Technique Selection */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Nefes Teknikleri
          </h3>
          <div className="space-y-3">
            {TECHNIQUES.map((tech) => {
              const isSelected = selectedTechnique.id === tech.id;
              return (
                <div
                  key={tech.id}
                  onClick={() => handleSelectTechnique(tech)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-slate-900">{tech.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tech.badge}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 font-semibold mb-2">{tech.subtitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{tech.description}</p>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-700 bg-white/80 p-2 rounded-xl border border-slate-200/80">
                    <span>Al: {tech.inhale}s</span> •
                    <span>Tut: {tech.hold1}s</span> •
                    <span>Ver: {tech.exhale}s</span>
                    {tech.hold2 > 0 && <span> • Dinlen: {tech.hold2}s</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stress Relief Tips Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Sınav Kaygısını Yönetme & Psikolojik İpuçları
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STRESS_TIPS.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <Card key={idx} className="p-4 bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tip.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">{tip.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{tip.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
