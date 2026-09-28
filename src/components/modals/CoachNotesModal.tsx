import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Student } from '../../types';
import { MessageSquareQuote, Sparkles, Check } from 'lucide-react';

interface CoachNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  studentName?: string;
  initialNotes?: string;
  onSave: ((studentId: string, notes: string) => Promise<void>) | ((notes: string) => Promise<void>);
}

export const CoachNotesModal: React.FC<CoachNotesModalProps> = ({
  isOpen,
  onClose,
  student,
  studentName,
  initialNotes,
  onSave,
}) => {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setNotes(student.coach_notes || '');
    } else if (initialNotes !== undefined) {
      setNotes(initialNotes || '');
    }
  }, [student, initialNotes]);

  if (!isOpen) return null;

  const displayName = student?.name || studentName || 'Öğrenci';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (student) {
        await (onSave as (studentId: string, notes: string) => Promise<void>)(student.id, notes);
      } else {
        await (onSave as (notes: string) => Promise<void>)(notes);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const quickTemplates = [
    'TYT Matematik problem rutinini günlük 20 soruya sabitlemeli. Deneme süre yönetiminde belirgin ilerleme var.',
    'AYT Fen konularında Fizik mekanik tekrarı önerildi. Günlük soru hedefi tutturuluyor, motivasyonu yüksek.',
    'Geometri netlerinde yükseliş kaydedildi. Süre baskısını azaltmak için haftada 2 branş denemesi çözülmeli.',
    'Son denemede Türkçe paragraflarda dikkat kaybı gözlendi. Sabah erken saatte 1 deneme çözmesi tavsiye edildi.',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${displayName} - Koçun Gözlem ve Tavsiye Notları`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <MessageSquareQuote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Öğrenci ve Veli Bildirimi:</span> Buraya yazacağınız koçluk gözlem notları, öğrencinin panelinde öne çıkarılır ve indireceğiniz resmi PDF Gelişim Raporu'na "Koçun Strateji ve Gözlem Notu" olarak otomatik eklenir.
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Koçun Analiz ve Strateji Notu
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Öğrencinin haftalık gelişimi, eksik konuları, çalışma disiplini ve bir sonraki hafta için tavsiyelerinizi yazın..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hızlı Hazır Şablonlar (Tıklayarak Ekle)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickTemplates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setNotes((prev) => (prev ? `${prev}\n${tpl}` : tpl))}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 text-[11px] text-slate-700 hover:text-amber-900 transition-colors cursor-pointer"
              >
                + {tpl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" type="button" onClick={onClose}>
            İptal
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSaving}
            leftIcon={<Check className="w-4 h-4" />}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Notu Kaydet & Raporu Güncelle
          </Button>
        </div>
      </form>
    </Modal>
  );
};
