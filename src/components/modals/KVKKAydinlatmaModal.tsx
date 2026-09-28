import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ShieldCheck, Scale, FileText, CheckCircle2, Lock, UserCheck } from 'lucide-react';

interface KVKKAydinlatmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptConsent?: () => void;
  hasConsented?: boolean;
}

export const KVKKAydinlatmaModal: React.FC<KVKKAydinlatmaModalProps> = ({
  isOpen,
  onClose,
  onAcceptConsent,
  hasConsented = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="KVKK & Oyunlaştırma Süreçleri Hukuki Aydınlatma Metni"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
        {/* Banner */}
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-950 text-sm">
              6698 Sayılı KVKK Uyarınca Oyunlaştırma, Sıralama ve Ödül Politikası
            </h4>
            <p className="text-indigo-800/80 text-[11px] mt-0.5">
              Mahfaza.co platformu, Gabe Zichermann'ın SAPS (Status, Access, Power, Stuff) modelini Türkiye Cumhuriyeti yürürlükteki mevzuatına tam uyumlu olarak işletir.
            </p>
          </div>
        </div>

        {/* 1. Veri Sorumlusu */}
        <section className="space-y-1.5">
          <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. Veri Sorumlusunun Kimliği</span>
          </h5>
          <p className="text-slate-600">
            6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) m. 10 uyarınca, Mahfaza.co platformu ve yetkili eğitim koçu <strong>Serkan Koçak</strong> (“Veri Sorumlusu”), öğrencilere ve velilere ait kişisel verileri hukuka, ahlaka ve dürüstlük kurallarına uygun olarak işlemektedir.
          </p>
        </section>

        {/* 2. Hukuki Dayanak ve Şans Oyunu Olmadığının Tespiti */}
        <section className="space-y-1.5">
          <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Hukuki Nitelik: Şans Oyunu ve Kumar Yasağı Güvencesi</span>
          </h5>
          <p className="text-slate-600">
            Platformdaki tüm ödül (SAPS: Status, Access, Power, Stuff) mekanizmaları; <strong>5237 sayılı Türk Ceza Kanunu m. 228</strong> ve <strong>7258 sayılı Kanun</strong> hükümleri gereğince hiçbir surette kura, çekiliş veya tesadüfe dayalı şans oyunu niteliği taşımaz. Verilen tüm puanlar (XP) ve unvanlar, öğrencinin bizzat çözdüğü soru sayısı, deneme sınavı netleri, Pomodoro odaklanma süreleri ve koçluk görevlerini ifa etmesi gibi <strong>objektif akademik gayret ve başarı</strong> kriterlerine dayanır.
          </p>
        </section>

        {/* 3. SAPS Katmanları ve Veri İşleme Amaçları */}
        <section className="space-y-2">
          <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. SAPS Oyunlaştırma Katmanlarında Veri İşleme Esasları</span>
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-800 block text-xs">Status (Statü & Sıralama):</strong>
              <span className="text-[11px] text-slate-600">
                Liderlik tablosunda yer alma tercihi öğrencinin/velinin açık rızasına bağlıdır. Dileyen öğrenci tek bir tıkla "Anonim Mod" veya "Takma Ad (Nickname)" kullanarak gerçek ismini tamamen gizleyebilir.
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-800 block text-xs">Access (VIP Erişim):</strong>
              <span className="text-[11px] text-slate-600">
                VIP çalışma odaları, soru havuzları ve AI derin analizörleri yalnızca akademik eşiği geçen öğrencilere sistem erişim hakkı tanır; üçüncü taraflarla veri paylaşımı yapılmaz.
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-800 block text-xs">Power (Akran Motivasyonu & Güç):</strong>
              <span className="text-[11px] text-slate-600">
                Öğrenciler yalnızca birbirini motive edici tebrik/kudos mesajı gönderebilir. Akran zorbalığını engellemek adına mesajlar koç denetimindedir ve negatif aksiyon yetkisi verilmez.
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-800 block text-xs">Stuff (Fiziksel Ödül / Kargo):</strong>
              <span className="text-[11px] text-slate-600">
                Kazanılan kitap ve deneme setlerinin ulaştırılması için toplanan ad-soyad, telefon ve açık adres bilgileri <strong>Supabase RLS</strong> ile yalnızca öğrenci ve koçu Serkan Koçak arasında şifreli tutulur. Asla reklam veya ticari pazarlama amacıyla kullanılamaz.
              </span>
            </div>
          </div>
        </section>

        {/* 4. 18 Yaş Altı Öğrenciler (YKS & LGS) ve Veli Onayı */}
        <section className="space-y-1.5">
          <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>4. 18 Yaş Altı Öğrenciler İçin Veli / Vasi Temsili</span>
          </h5>
          <p className="text-slate-600">
            Türk Medeni Kanunu uyarınca ayırt etme gücüne sahip 18 yaş altı lise (YKS) ve ortaokul (LGS) öğrencilerinin eğitim koçluğu kapsamındaki oyunlaştırma süreçlerine katılımında, velilerin Veli Portalı üzerinden diledikleri zaman çocuklarının sıralama görünürlüğünü kapatma ve rızayı geri çekme hakkı saklıdır.
          </p>
        </section>

        {/* 5. İlgili Kişinin Hakları (KVKK m. 11) */}
        <section className="space-y-1.5">
          <h5 className="font-bold text-slate-900 text-xs">5. KVKK Madde 11 Uyarınca Haklarınız</h5>
          <p className="text-slate-600">
            Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, eksik/yanlış verilerin düzeltilmesini isteme, sistemdeki açık rızanızı dilediğiniz an geri alarak profilinizi liderlik tablosundan anonimleştirme hakkına sahipsiniz.
          </p>
        </section>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>KVKK m. 5/1 ve m. 10 ile tam uyumludur.</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Kapat
          </Button>
          {onAcceptConsent && !hasConsented && (
            <Button
              size="sm"
              onClick={() => {
                onAcceptConsent();
                onClose();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Okudum, Açık Rıza Veriyorum
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
