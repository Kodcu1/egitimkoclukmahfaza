import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { StudentMood, MoodKey } from '../../types';
import { Heart, Sparkles, Check, Smile, MessageSquareQuote, History, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface DailyMoodTrackerProps {
  studentId: string;
  studentName?: string;
  compact?: boolean;
}

const MOOD_OPTIONS: {
  key: MoodKey;
  label: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}[] = [
  { key: 'joyful', label: 'Neşe Dolu', emoji: '😊', colorClass: 'text-amber-700', bgClass: 'bg-amber-50 hover:bg-amber-100', borderClass: 'border-amber-200' },
  { key: 'hopeful', label: 'Umutlu', emoji: '🌟', colorClass: 'text-yellow-700', bgClass: 'bg-yellow-50 hover:bg-yellow-100', borderClass: 'border-yellow-200' },
  { key: 'energetic', label: 'Enerjik', emoji: '⚡', colorClass: 'text-orange-700', bgClass: 'bg-orange-50 hover:bg-orange-100', borderClass: 'border-orange-200' },
  { key: 'focused', label: 'Odaklanmış', emoji: '🎯', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50 hover:bg-emerald-100', borderClass: 'border-emerald-200' },
  { key: 'calm', label: 'Huzurlu', emoji: '🌿', colorClass: 'text-teal-700', bgClass: 'bg-teal-50 hover:bg-teal-100', borderClass: 'border-teal-200' },
  { key: 'undecided', label: 'Kararsız', emoji: '⛅', colorClass: 'text-sky-700', bgClass: 'bg-sky-50 hover:bg-sky-100', borderClass: 'border-sky-200' },
  { key: 'tired', label: 'Yorgun', emoji: '🔋', colorClass: 'text-slate-700', bgClass: 'bg-slate-100 hover:bg-slate-200', borderClass: 'border-slate-300' },
  { key: 'stressed', label: 'Stresli', emoji: '🌧️', colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50 hover:bg-indigo-100', borderClass: 'border-indigo-200' },
  { key: 'anxious', label: 'Endişeli', emoji: '🌪️', colorClass: 'text-rose-700', bgClass: 'bg-rose-50 hover:bg-rose-100', borderClass: 'border-rose-200' },
];

export const DailyMoodTracker: React.FC<DailyMoodTrackerProps> = ({
  studentId,
  studentName,
  compact = false,
}) => {
  const { toast } = useToast();
  const [todayMood, setTodayMood] = useState<StudentMood | null>(null);
  const [moodHistory, setMoodHistory] = useState<StudentMood[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = async () => {
    if (!studentId) return;
    const [today, history] = await Promise.all([
      db.getTodayStudentMood(studentId),
      db.getStudentMoods(studentId, 7),
    ]);
    setTodayMood(today);
    setMoodHistory(history);
    if (today) {
      setSelectedMood(today.mood);
      setNote(today.note || '');
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('moods_updated', handleUpdate);
    return () => window.removeEventListener('moods_updated', handleUpdate);
  }, [studentId]);

  const handleSelectMood = async (moodKey: MoodKey) => {
    setSelectedMood(moodKey);
    setIsSaving(true);
    try {
      const saved = await db.saveStudentMood(studentId, moodKey, note);
      setTodayMood(saved);
      toast.success(`Günün ruh hali "${saved.mood_emoji} ${saved.mood_label}" olarak kaydedildi! Koçunuz görebilecek.`);
    } catch {
      toast.error('Duygu durumu kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedMood) return;
    setIsSaving(true);
    try {
      const saved = await db.saveStudentMood(studentId, selectedMood, note);
      setTodayMood(saved);
      toast.success('Koçunuza özel duygu durum notunuz güncellendi.');
    } catch {
      toast.error('Not kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
            <Heart className="w-5 h-5 fill-amber-500/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Günlük Duygu Durumu & Psikolojik Takip</h3>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 rounded-full">
                Koç Takibinde
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {todayMood
                ? 'Bugünkü ruh halinizi belirttiniz. İstediğiniz an güncelleyebilirsiniz.'
                : 'Bugün nasılsın? Seçimin koçunla anlık olarak paylaşılır.'}
            </p>
          </div>
        </div>

        {moodHistory.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Son 7 Gün</span>
          </button>
        )}
      </div>

      {/* Mood Selector Grid */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = selectedMood === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelectMood(opt.key)}
                disabled={isSaving}
                className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-center transition-all duration-200 ${
                  isSelected
                    ? `${opt.bgClass} ${opt.borderClass} ring-2 ring-amber-500/40 shadow-sm scale-102`
                    : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <span className="text-2xl sm:text-3xl mb-1 filter transition-transform group-hover:scale-115">
                  {opt.emoji}
                </span>
                <span className={`text-[11px] sm:text-xs font-medium leading-tight line-clamp-1 ${opt.colorClass}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Note input for coach */}
        {selectedMood && !compact && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <MessageSquareQuote className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                placeholder="Koçuna bir duygu notu ilet (Örn: 'Bugün moralim çok yüksek, soru hedefini aştım')..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-colors whitespace-nowrap shadow-xs"
            >
              Notu Kaydet
            </button>
          </div>
        )}

        {/* History Strip */}
        {showHistory && moodHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Son 7 Günlük Ruh Hali Akışı</span>
              <span className="text-[11px] font-normal text-slate-400">Koçunuz bu grafiği inceler</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {moodHistory.map((h) => {
                const dateObj = new Date(h.date);
                const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'numeric' });
                return (
                  <div
                    key={h.id}
                    className="flex-1 min-w-[70px] bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center"
                  >
                    <span className="text-lg">{h.mood_emoji}</span>
                    <div className="text-[10px] font-medium text-slate-700 mt-0.5 truncate">{h.mood_label}</div>
                    <div className="text-[9px] text-slate-400">{dayName}</div>
                    {h.note && (
                      <div className="mt-1 text-[9px] text-slate-500 italic truncate" title={h.note}>
                        "{h.note}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
