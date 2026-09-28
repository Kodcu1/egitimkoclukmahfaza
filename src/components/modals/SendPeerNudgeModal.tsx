import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, Flame, Award, Target, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { sapsService } from '../../services/sapsService';
import { useToast } from '../../context/ToastContext';
import { SAPSNudgeType } from '../../types/saps.types';

interface SendPeerNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderStudentId: string;
  senderName: string;
  targetStudentId: string;
  targetStudentName: string;
  onSuccess?: () => void;
}

const NUDGE_OPTIONS: { type: SAPSNudgeType; label: string; icon: any; defaultMsg: string; color: string }[] = [
  {
    type: 'boost_study',
    label: 'Çalışma Ateşi',
    icon: Flame,
    defaultMsg: 'Birlikte başaracağız! Masaya geç ve bu Pomodoro seansını kaçırma.',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    type: 'congratulate_exam',
    label: 'Deneme Tebriği',
    icon: Award,
    defaultMsg: 'Son denemedeki yükselişin harika! Emeğinin karşılığını alıyorsun.',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    type: 'streak_applause',
    label: 'Disiplin Alkışı',
    icon: Sparkles,
    defaultMsg: 'Kesintisiz çalışma serin hepimize ilham veriyor, tebrikler!',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    type: 'study_challenge',
    label: 'Meydan Okuma',
    icon: Target,
    defaultMsg: 'Bugün hedeflenen soru sayısına önce kim ulaşacak? Var mısın?',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  {
    type: 'kudos',
    label: 'Günün Yıldızı',
    icon: HeartHandshake,
    defaultMsg: 'Azmin ve çalışma disiplinin için kocaman bir takdir!',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
];

export const SendPeerNudgeModal: React.FC<SendPeerNudgeModalProps> = ({
  isOpen,
  onClose,
  senderStudentId,
  senderName,
  targetStudentId,
  targetStudentName,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<SAPSNudgeType>('streak_applause');
  const [customMessage, setCustomMessage] = useState(
    NUDGE_OPTIONS.find((o) => o.type === 'streak_applause')?.defaultMsg || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectOption = (type: SAPSNudgeType) => {
    setSelectedType(type);
    const opt = NUDGE_OPTIONS.find((o) => o.type === type);
    if (opt) {
      setCustomMessage(opt.defaultMsg);
    }
  };

  const handleSend = async () => {
    setIsSubmitting(true);
    try {
      const res = await sapsService.sendPowerNudge(
        senderStudentId,
        senderName,
        targetStudentId,
        selectedType,
        customMessage.trim()
      );

      if (res.success) {
        toast.success(`${targetStudentName} arkadaşına başarıyla destek ve +10 XP hediye ettin.`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || 'İşlem sırasında bir hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Çalışma Arkadaşını Motive Et (SAPS Power)">
      <div className="space-y-4">
        {/* Recipient Header */}
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 block">
              Motive Edilecek Öğrenci
            </span>
            <span className="text-sm font-bold text-indigo-950">{targetStudentName}</span>
          </div>
          <span className="text-xs px-2.5 py-1 bg-indigo-600 text-white font-medium rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            +10 XP Hediye
          </span>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">Tebrik / Motivasyon Türü Seç</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {NUDGE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelectOption(opt.type)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${opt.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{opt.defaultMsg}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Input */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Motivasyon Notu</label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
            placeholder="Arkadaşına moral verici bir not bırak..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button
            type="button"
            isLoading={isSubmitting}
            onClick={handleSend}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Motivasyonu İlet
          </Button>
        </div>
      </div>
    </Modal>
  );
};
