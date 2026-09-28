import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, Crown, ArrowRight, Lock, CheckCircle2, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  featureName: string;
  requiredPlan: 'Starter' | 'Pro' | 'Premium' | 'Kurumsal';
  description?: string;
  currentPlanName?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  title = 'Özellik Kilitli — Paket Yükseltme Gerekli',
  featureName,
  requiredPlan,
  description,
  currentPlanName = 'Ücretsiz (Free)',
}) => {
  const navigate = useNavigate();

  const handleGoToPricing = () => {
    onClose();
    navigate('/pricing');
  };

  const getPlanHighlights = () => {
    switch (requiredPlan) {
      case 'Starter':
        return [
          'Veli Eşleştirme ve Veli Takip Paneli',
          'Resmi PDF Gelişim Karnesi ve Rapor İndirme',
          'Aylık 100 AI Soru & Analiz Kotası',
          'Detaylı Risk ve Hedef Sapma Grafikleri',
        ];
      case 'Pro':
        return [
          '15 Öğrenciye Kadar Koçluk Portföyü',
          'Yapay Zeka Destekli Haftalık Stratejik Planlayıcı',
          'Detaylı Öğrenci Risk & Gelişim AI Teşhisi',
          'Aylık 500 AI İstek Kotası',
          '🎁 Her Ay 1 Saat Birebir Özel Ders Hediyesi',
        ];
      case 'Premium':
        return [
          '50 Öğrenciye Kadar Geniş Koçluk Portföyü',
          'Aylık 2.000 AI İstek ve VIP Kota',
          '🎁 Her Ay 2 Saat Birebir Özel Ders Hediyesi',
          'Öncelikli 7/24 VIP Koçluk Desteği',
        ];
      case 'Kurumsal':
        return [
          'Çoklu Sınıf ve Sponsorlu Sınıf Açma',
          '250+ Öğrenci Portföy Yönetimi',
          'Aylık 10.000 AI Kotası ve Özel Entegrasyonlar',
          'Kurum Yöneticisi ve Detaylı Finansal/Akademik Metrikler',
        ];
      default:
        return [];
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`Mevcut Planınız: ${currentPlanName}`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Feature Lock Box */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900">{featureName}</h4>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                {requiredPlan} & Üzeri
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {description ||
                `Bu özelliği kullanabilmek için hesabınızın en az "${requiredPlan}" paketine yükseltilmesi gerekmektedir.`}
            </p>
          </div>
        </div>

        {/* Highlights */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            {requiredPlan} Paketine Yükselttiğinizde Kazanacaklarınız:
          </h5>
          <div className="space-y-2 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            {getPlanHighlights().map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Şimdilik Kapat
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGoToPricing}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-md shadow-amber-500/20"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {requiredPlan} Paketine Geç
          </Button>
        </div>
      </div>
    </Modal>
  );
};
