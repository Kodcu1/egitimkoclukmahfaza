import React, { useState, useEffect } from 'react';
import { Button } from './common/Button';
import { Card } from './common/Card';
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  X,
  Sparkles,
  ShieldCheck,
  Brain,
  Heart,
} from 'lucide-react';

interface BreathingExerciseProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathPhase = 'Nefes Al' | 'Nefesi Tut' | 'Nefes Ver' | 'Bekle';

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  isOpen,
  onClose,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('Nefes Al');
  const [countdown, setCountdown] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleReset();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 4-4-4-4 Box Breathing loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && isOpen) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // Transition to next phase
          if (phase === 'Nefes Al') {
            setPhase('Nefesi Tut');
            return 4;
          } else if (phase === 'Nefesi Tut') {
            setPhase('Nefes Ver');
            return 4;
          } else if (phase === 'Nefes Ver') {
            setPhase('Bekle');
            return 4;
          } else {
            // 'Bekle' completed -> cycle finishes
            setCompletedCycles((c) => c + 1);
            setPhase('Nefes Al');
            return 4;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isOpen, phase]);

  const handleReset = () => {
    setIsActive(false);
    setPhase('Nefes Al');
    setCountdown(4);
    setCompletedCycles(0);
  };

  if (!isOpen) return null;

  // Scale and text styling based on phase
  const getCircleScale = () => {
    if (!isActive) return 'scale-100';
    if (phase === 'Nefes Al') return 'scale-125 transition-transform duration-[4000ms] ease-out';
    if (phase === 'Nefesi Tut') return 'scale-125';
    if (phase === 'Nefes Ver') return 'scale-90 transition-transform duration-[4000ms] ease-in';
    return 'scale-90';
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'Nefes Al':
        return 'Burnundan yavaşça ve derin bir nefes al...';
      case 'Nefesi Tut':
        return 'Ciğerlerini dolu tut, sakinliğini koru...';
      case 'Nefes Ver':
        return 'Ağzından yavaşça ve tamamen nefesini bırak...';
      case 'Bekle':
        return 'Nefessiz kal ve bedenindeki rahatlamayı hisset...';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="breathing-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleReset();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#0F172A] text-slate-100 rounded-3xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl border border-indigo-500/30">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-500/10 via-indigo-500/15 to-transparent border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-xs">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <h3 id="breathing-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>4x4 Kutu Nefesi (Box Breathing)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Stres Kontrolü
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sınav kaygısını dindirmek ve zihnini odaklamak için 4 saniyelik nefes döngüsü
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6">
          {/* Cycle counter */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tamamlanan Tur: <strong className="text-amber-400 font-mono">{completedCycles}</strong></span>
          </div>

          {/* Interactive Breathing Circle */}
          <div className="relative py-4 flex items-center justify-center">
            <div
              className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center text-white shadow-2xl p-6 bg-gradient-to-tr from-teal-600 via-indigo-600 to-indigo-900 border border-teal-400/40 transition-all ${getCircleScale()}`}
            >
              <span className="text-xs font-black uppercase tracking-widest text-teal-200 mb-1">
                {phase === 'Nefes Al' ? 'NEFES AL' : phase === 'Nefesi Tut' ? 'TUT' : phase === 'Nefes Ver' ? 'VER' : 'BEKLE'}
              </span>
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-white">
                {countdown}
              </span>
              <span className="text-[11px] text-teal-200/90 font-medium mt-0.5">saniye</span>
            </div>

            {/* Ambient Pulse Ring */}
            {isActive && (
              <div className="absolute inset-0 -m-3 rounded-full border border-teal-400/30 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Phase Sequence Badges */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
            {[
              { name: 'NEFES AL', key: 'Nefes Al' },
              { name: 'TUT', key: 'Nefesi Tut' },
              { name: 'VER', key: 'Nefes Ver' },
              { name: 'BEKLE', key: 'Bekle' },
            ].map((step) => {
              const isCurrent = phase === step.key && isActive;
              return (
                <div
                  key={step.name}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold text-center border transition-all ${
                    isCurrent
                      ? 'bg-teal-500/20 text-teal-300 border-teal-400 ring-1 ring-teal-400/40 shadow-xs'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}
                >
                  {step.name}
                </div>
              );
            })}
          </div>

          {/* Instruction Text */}
          <p className="text-xs sm:text-sm font-medium text-slate-300 min-h-[24px] italic">
            "{getPhaseInstruction()}"
          </p>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full justify-center pt-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-8 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
              <span>{isActive ? 'Durdur' : 'Egzersize Başla'}</span>
            </button>
            <button
              onClick={handleReset}
              title="Sıfırla"
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              aria-label="Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Tips Box */}
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-1.5">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-teal-400" />
              <span>4x4 Kutu Nefesi Neden İşe Yarar?</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kutu nefesi (4s al, 4s tut, 4s ver, 4s bekle), parasempatik sinir sistemini uyararak kortizol (stres) hormonunu dengeler, nabzı yatıştırır ve sınav anındaki kaygı tıkanmalarını çözer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
