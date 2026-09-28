import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ShieldCheck, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sapsService } from '../../services/sapsService';
import { useToast } from '../../context/ToastContext';

interface PhysicalRewardOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardTitle: string;
  rewardRequestId?: string;
  studentId: string;
  defaultName?: string;
  defaultPhone?: string;
  onOrderSuccess?: () => void;
}

export const PhysicalRewardOrderModal: React.FC<PhysicalRewardOrderModalProps> = ({
  isOpen,
  onClose,
  rewardTitle,
  rewardRequestId,
  studentId,
  defaultName = '',
  defaultPhone = '',
  onOrderSuccess,
}) => {
  const { toast } = useToast();
  const [recipientName, setRecipientName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !phone.trim() || !city.trim() || !district.trim() || !address.trim()) {
      toast.error('Lütfen teslimat için tüm adres ve iletişim alanlarını doldurun.');
      return;
    }

    if (!kvkkConsent) {
      toast.error('Kargo teslimatı için KVKK açık rıza onayını vermeniz gerekmektedir.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sapsService.submitPhysicalOrder({
        reward_request_id: rewardRequestId,
        student_id: studentId,
        coach_id: '2b1feeed-890a-430a-8360-dd103034649b', // Serkan Koçak
        reward_title: rewardTitle,
        recipient_full_name: recipientName.trim(),
        recipient_phone: phone.trim(),
        delivery_address: address.trim(),
        city: city.trim(),
        district: district.trim(),
        postal_code: postalCode.trim() || undefined,
        kvkk_address_consent: true,
      });

      if (res.success) {
        toast.success('Teslimat adresiniz koçunuz Serkan Koçak’a güvenli şekilde iletildi.');
        onOrderSuccess?.();
        onClose();
      } else {
        toast.error(res.error || 'Kargo siparişi oluşturulurken bir hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fiziksel Ödül Teslimat & Kargo Formu">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{rewardTitle}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tebrikler! Kazandığınız fiziksel ödülün adresinize kargolanması için teslimat bilgilerinizi doldurun.
            </p>
          </div>
        </div>

        {/* Input fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Alıcı Adı Soyadı <span className="text-rose-500">*</span>
            </label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Örn: Ela Gökçe Baran"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              İletişim Telefonu <span className="text-rose-500">*</span>
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xx xxx xx xx"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              İl <span className="text-rose-500">*</span>
            </label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="İstanbul"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              İlçe <span className="text-rose-500">*</span>
            </label>
            <Input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Kadıköy"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Posta Kodu
            </label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="34710"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Açık Teslimat Adresi <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 bg-white"
            placeholder="Mahalle, cadde, sokak, bina no, daire no..."
            required
          />
        </div>

        {/* KVKK Box */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="kvkk_checkbox"
              checked={kvkkConsent}
              onChange={(e) => setKvkkConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="kvkk_checkbox" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
              <strong>KVKK Açık Rıza Onayı:</strong> 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, kazandığım fiziksel ödülün (kitap/deneme seti vb.) kargo ile tarafıma ulaştırılması amacıyla; girdiğim ad-soyad, telefon ve teslimat adresi verilerimin yetkili eğitim koçum <strong>Serkan Koçak</strong> ve anlaşmalı kargo firması tarafından işlenmesine ve saklanmasına açık rıza veriyorum.
            </label>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>RLS Korumalı: Bu adres verisine başka hiçbir öğrenci veya 3. şahıs erişemez.</span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Adresi Onayla ve Gönder
          </Button>
        </div>
      </form>
    </Modal>
  );
};
