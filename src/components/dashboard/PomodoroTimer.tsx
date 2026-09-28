import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { PomodoroSession } from '../../types';
import { Play, Pause, RotateCcw, Flame, CheckCircle, Coffee, Volume2, VolumeX, FastForward, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PomodoroTimerProps {
  studentId: string;
  variant?: 'compact' | 'full';
  onSessionComplete?: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  studentId,
  variant = 'compact',
  onSessionComplete,
}) => {
  const [session, setSession] = useState<PomodoroSession | null>(null);
  const [mode, setMode] = useState<'work' | 'short_break'>('work');
  const [durationPreset] = useState<{ work: number; break: number }>({
    work: 25,
    break: 5,
  });
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const totalTime = (mode === 'work' ? durationPreset.work : durationPreset.break) * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100));

  // Play synthetic completion chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.5);
      });
    } catch {
      // Audio fallback
    }
  };

  // Load existing running session on mount
  useEffect(() => {
    const loadSession = async () => {
      const active = await db.getActivePomodoro(studentId);
      if (active && active.status === 'running') {
        const remaining = Math.max(0, Math.floor((new Date(active.ends_at).getTime() - Date.now()) / 1000));
        if (remaining > 0) {
          setSession(active);
          setMode(active.mode as 'work' | 'short_break');
          setTimeLeft(remaining);
          setIsRunning(true);
        } else {
          await db.completePomodoro(active.id);
          setIsRunning(false);
          setTimeLeft(durationPreset.work * 60);
          setJustCompleted(true);
          playChime();
          onSessionComplete?.();
        }
      }
    };
    loadSession();
  }, [studentId]);

  // Timer countdown loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(async () => {
        if (session) {
          const remaining = Math.max(0, Math.floor((new Date(session.ends_at).getTime() - Date.now()) / 1000));
          setTimeLeft(remaining);

          if (remaining <= 0) {
            setIsRunning(false);
            clearInterval(interval!);
            await db.completePomodoro(session.id);
            setSession(null);
            setJustCompleted(true);
            playChime();
            const nextMode = mode === 'work' ? 'short_break' : 'work';
            const nextTime = (nextMode === 'work' ? durationPreset.work : durationPreset.break) * 60;
            setMode(nextMode);
            setTimeLeft(nextTime);
            onSessionComplete?.();
          }
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              setJustCompleted(true);
              playChime();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, session, mode, durationPreset, onSessionComplete]);

  const handleStart = async () => {
    const duration = mode === 'work' ? durationPreset.work : durationPreset.break;
    const newSession = await db.startPomodoro(studentId, duration, mode);
    setSession(newSession);
    setTimeLeft(duration * 60);
    setIsRunning(true);
    setJustCompleted(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = async () => {
    if (session) {
      await db.resetPomodoro(session.id);
      setSession(null);
    }
    setIsRunning(false);
    setTimeLeft((mode === 'work' ? durationPreset.work : durationPreset.break) * 60);
    setJustCompleted(false);
  };

  const handleSkip = () => {
    const nextMode = mode === 'work' ? 'short_break' : 'work';
    setMode(nextMode);
    setIsRunning(false);
    setTimeLeft((nextMode === 'work' ? durationPreset.work : durationPreset.break) * 60);
    setJustCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWork = mode === 'work';

  // COMPACT BENTO VARIANT
  if (variant === 'compact') {
    const radiusCompact = 56;
    const circumferenceCompact = 2 * Math.PI * radiusCompact;
    const strokeDashoffsetCompact = circumferenceCompact - (progressPercent / 100) * circumferenceCompact;

    return (
      <div className="h-full flex flex-col justify-between p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-md hover:shadow-lg transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white shadow-sm ${isWork ? 'bg-orange-500' : 'bg-emerald-500'}`}>
              {isWork ? <Flame className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>{isWork ? 'Pomodoro Derin Çalışma' : 'Mola Zamanı'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  +50 XP
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">25 dk Odak • 5 dk Mola</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Center Timer SVG Ring */}
        <div className="flex items-center justify-center py-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radiusCompact}
                className="text-slate-100 stroke-current"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="70"
                cy="70"
                r={radiusCompact}
                className={cn(
                  'transition-all duration-700 ease-linear stroke-current',
                  isWork ? 'text-orange-500' : 'text-emerald-500'
                )}
                strokeWidth="8"
                strokeDasharray={circumferenceCompact}
                strokeDashoffset={strokeDashoffsetCompact}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isWork ? 'text-orange-600' : 'text-emerald-600'}`}>
                {isRunning ? (isWork ? 'ÇALIŞIYOR' : 'MOLA') : 'HAZIR'}
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-slate-900">
                {formatTime(timeLeft)}
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                %{Math.round(progressPercent)}
              </span>
            </div>
          </div>
        </div>

        {/* Completion Notice */}
        {justCompleted && (
          <div className="mb-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-bounce">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Tebrikler! +50 XP kazandın.</span>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  isWork ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{timeLeft === totalTime ? 'Başlat' : 'Devam Et'}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>Duraklat</span>
              </button>
            )}

            <button
              onClick={handleSkip}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Sonraki Seansa Geç"
            >
              <FastForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                if (!isRunning) {
                  setMode('work');
                  setTimeLeft(durationPreset.work * 60);
                }
              }}
              className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors ${
                isWork ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Odak (25 dk)
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => {
                if (!isRunning) {
                  setMode('short_break');
                  setTimeLeft(durationPreset.break * 60);
                }
              }}
              className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors ${
                !isWork ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mola (5 dk)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FULL IMMERSIVE VARIANT
  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className={cn(
        'relative rounded-3xl p-6 sm:p-8 transition-all duration-500 overflow-hidden shadow-xl border bg-white',
        isWork ? 'border-orange-200' : 'border-emerald-200'
      )}
    >
      {/* Header Controls Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2.5 rounded-2xl border transition-all text-white',
              isWork ? 'bg-orange-500 border-orange-400 shadow-md' : 'bg-emerald-500 border-emerald-400 shadow-md'
            )}
          >
            {isWork ? <Flame className="w-6 h-6 fill-current animate-pulse" /> : <Coffee className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-wide flex items-center gap-2">
              <span>{isWork ? 'YKS DERİN ODAKLANMA MODU' : 'YENİLENME VE DİNLENME MOLASI'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                {isWork ? '+50 XP' : 'Dinlen'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isWork
                ? 'Telefonu uzaklaştır, dikkatin sadece çözdüğün sorularda olsun.'
                : 'Ekrandan uzaklaş, su iç ve derin nefes alarak zihnini sıfırla.'}
            </p>
          </div>
        </div>

        {/* Mode Switchers */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                if (!isRunning) {
                  setMode('work');
                  setTimeLeft(durationPreset.work * 60);
                }
              }}
              className={cn(
                'px-3.5 py-1.5 text-xs font-black rounded-xl transition-all',
                isWork ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Odak ({durationPreset.work} dk)
            </button>
            <button
              onClick={() => {
                if (!isRunning) {
                  setMode('short_break');
                  setTimeLeft(durationPreset.break * 60);
                }
              }}
              className={cn(
                'px-3.5 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5',
                !isWork ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Mola ({durationPreset.break} dk)</span>
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Center Console with Glowing Ring */}
      <div className="relative z-10 flex flex-col items-center justify-center py-8">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
            <circle
              cx="120"
              cy="120"
              r={radius}
              className="text-slate-100 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              className={cn(
                'transition-all duration-1000 ease-linear stroke-current',
                isWork ? 'text-orange-500' : 'text-emerald-500'
              )}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={cn('text-xs font-mono font-bold uppercase tracking-widest mb-1', isWork ? 'text-orange-600' : 'text-emerald-600')}>
              {isRunning ? (isWork ? 'ODAKLANIYOR' : 'MOLA ZAMANI') : 'HAZIR'}
            </span>
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900">
              {formatTime(timeLeft)}
            </div>
            <span className="text-[11px] font-bold text-slate-500 mt-1">
              Tamamlanan: %{Math.round(progressPercent)}
            </span>
          </div>
        </div>

        {justCompleted && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>🎉 Tebrikler! Seans başarıyla tamamlandı (+50 XP hesabına kaydedildi).</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Strip */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className={cn(
              'w-full sm:w-44 py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer',
              isWork
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
            )}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{timeLeft === totalTime ? 'Başlat' : 'Devam Et'}</span>
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="w-full sm:w-44 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Pause className="w-4 h-4 fill-white" />
            <span>Duraklat</span>
          </button>
        )}

        <button
          onClick={handleSkip}
          className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Sonraki Seansa Geç"
        >
          <FastForward className="w-4 h-4" />
          <span>Atla ({isWork ? 'Molaya Geç' : 'Odağa Geç'})</span>
        </button>

        <button
          onClick={handleReset}
          className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Sayacı Başa Al"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Sıfırla</span>
        </button>
      </div>
    </div>
  );
};
