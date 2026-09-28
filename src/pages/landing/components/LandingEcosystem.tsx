import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  BarChart3,
  Target,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';

export const LandingEcosystem: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<'yks' | 'lgs' | 'kpss'>('yks');

  return (
    <section id="academic-ecosystem" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-950 text-[11px] font-bold uppercase tracking-wider mb-3">
            <span>AKADEMİK EKOSİSTEM MİMARİSİ</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Her Sınavın Müfredatına ve Dinamiğine Tam Uyum
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            YKS, LGS ve KPSS sınav sistemlerinin farklı soru adetleri, katsayıları ve çalışma stratejileri için ayrıştırılmış özel analitik modüller.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1.5 rounded-xl bg-slate-100 border border-slate-200 max-w-lg mb-10 shadow-xs">
          {[
            { id: 'yks', title: 'YKS (TYT · AYT)', subtitle: 'Üniversite Hazırlık' },
            { id: 'lgs', title: 'LGS', subtitle: 'Lise Giriş Sınavı' },
            { id: 'kpss', title: 'KPSS', subtitle: 'Kamu Personeli Sınavı' },
          ].map((tab) => {
            const isSelected = selectedExam === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedExam(tab.id as 'yks' | 'lgs' | 'kpss')}
                className={`flex-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950 text-white shadow-sm ring-1 ring-indigo-900'
                    : 'text-slate-700 hover:text-indigo-950 hover:bg-slate-200/60'
                }`}
              >
                <div className="block font-bold">{tab.title}</div>
                <div className={`text-[10px] hidden sm:block ${isSelected ? 'text-amber-300 font-medium' : 'text-slate-500'}`}>
                  {tab.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* MOCKUP 1: YKS (Ahmet Yılmaz - YKS Sayısal / Hacettepe Tıp) */}
        {selectedExam === 'yks' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  AY
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ahmet Yılmaz</h3>
                  <p className="text-xs text-slate-600">Hedef: Hacettepe Üniversitesi Tıp Fakültesi · YKS Sayısal Grubu</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-left">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">TYT Deneme Ort.</span>
                  <span className="text-sm font-bold font-mono text-slate-900">104.5 Net</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-left">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">AYT Deneme Ort.</span>
                  <span className="text-sm font-bold font-mono text-slate-900">67.25 Net</span>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
              {/* YKS Ders 1 */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">TYT Türkçe & Paragraf</span>
                  <span className="text-xs font-mono font-bold text-slate-900">36.25 / 40</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Paragrafta Anlam</span>
                    <span className="font-semibold text-slate-900">95% Doğruluk</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dil Bilgisi / Karma</span>
                    <span className="font-semibold text-slate-900">88% Doğruluk</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  Ortalama Süre: 38 Dk (Optimum)
                </div>
              </div>

              {/* YKS Ders 2 */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">AYT Matematik</span>
                  <span className="text-xs font-mono font-bold text-slate-900">32.50 / 40</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Türev & İntegral</span>
                    <span className="font-semibold text-slate-900">90% Doğruluk</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trigonometri & Analitik</span>
                    <span className="font-semibold text-slate-900">85% Doğruluk</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  Haftalık Çözülen Soru: 240 Soru
                </div>
              </div>

              {/* YKS Ders 3 */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">AYT Fen Bilimleri</span>
                  <span className="text-xs font-mono font-bold text-slate-900">34.75 / 40</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Fizik (12.25/14)</span>
                    <span className="font-semibold text-slate-900">Mekanik Stabil</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kimya (11.50/13) · Biyo (11/13)</span>
                    <span className="font-semibold text-slate-900">Organik Tam</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  Branş Denemesi Frekansı: 3/Hafta
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MOCKUP 2: LGS (Elif Kaya - LGS / Fen Lisesi) */}
        {selectedExam === 'lgs' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  EK
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Elif Kaya</h3>
                  <p className="text-xs text-slate-600">Hedef: Ankara Fen Lisesi · 8. Sınıf LGS Grubu</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-left">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">LGS Puan Simülasyonu</span>
                  <span className="text-sm font-bold font-mono text-slate-900">488.4 Puan</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-left">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Genel Başarı</span>
                  <span className="text-sm font-bold font-mono text-slate-900">%97.2 Doğruluk</span>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-white">
              {/* LGS Matematik */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">LGS Matematik</span>
                  <span className="text-xs font-mono font-bold text-slate-900">17 / 20</span>
                </div>
                <p className="text-xs text-slate-600">
                  Yeni Nesil Beceri Temelli Sorular: 17 Doğru, 2 Yanlış, 1 Boş.
                </p>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: '85%' }} />
                </div>
                <div className="text-[10px] text-slate-500">Kazanım: Çarpanlar ve Katlar Tamamlandı</div>
              </div>

              {/* LGS Fen Bilimleri */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">LGS Fen Bilimleri</span>
                  <span className="text-xs font-mono font-bold text-slate-900">18 / 20</span>
                </div>
                <p className="text-xs text-slate-600">
                  Deney ve Grafik Yorumlama: 18 Doğru, 1 Yanlış, 1 Boş.
                </p>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: '90%' }} />
                </div>
                <div className="text-[10px] text-slate-500">Kazanım: Mevsimler ve İklim Analizi</div>
              </div>

              {/* LGS İnkılap Tarihi */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">LGS İnkılap Tarihi</span>
                  <span className="text-xs font-mono font-bold text-slate-900">9 / 10</span>
                </div>
                <p className="text-xs text-slate-600">
                  Kavram ve Kronoloji: 9 Doğru, 1 Yanlış.
                </p>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: '90%' }} />
                </div>
                <div className="text-[10px] text-slate-500">Kazanım: Bir Kahraman Doğuyor</div>
              </div>

              {/* LGS Türkçe */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">LGS Türkçe</span>
                  <span className="text-xs font-mono font-bold text-slate-900">19 / 20</span>
                </div>
                <p className="text-xs text-slate-600">
                  Sözel Mantık & Muhakeme: 19 Doğru, 1 Yanlış.
                </p>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: '95%' }} />
                </div>
                <div className="text-[10px] text-slate-500">Kazanım: Fiilimsiler & Cümle Türleri</div>
              </div>
            </div>
          </div>
        )}

        {/* MOCKUP 3: KPSS (Mehmet Kaya - KPSS Genel Kültür / Genel Yetenek) */}
        {selectedExam === 'kpss' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  MK
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mehmet Kaya</h3>
                  <p className="text-xs text-slate-600">Hedef: KPSS Lisans A Grubu / Gelir Uzmanlığı</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-left">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">KPSS Puan Tahmini</span>
                  <span className="text-sm font-bold font-mono text-slate-900">89.4 P3</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-left">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Genel Kültür Sadakati</span>
                  <span className="text-sm font-bold font-mono text-slate-900">%92 Tamamlandı</span>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
              {/* KPSS Tarih */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">KPSS Tarih</span>
                  <span className="text-xs font-mono font-bold text-slate-900">84% Başarı</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>İslamiyet Öncesi Türk Tarihi</span>
                    <span className="font-semibold text-slate-900">Tamamlandı</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Osmanlı Islahatları & İnkılap</span>
                    <span className="font-semibold text-slate-900">Tekrar Planlandı</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  Haftalık Soru Hedefi: 350 Soru
                </div>
              </div>

              {/* KPSS Coğrafya */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">KPSS Coğrafya</span>
                  <span className="text-xs font-mono font-bold text-slate-900">71% Başarı</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Türkiye'nin Yer Şekilleri</span>
                    <span className="font-semibold text-slate-900">Harita Çalışması</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nüfus, Tarım ve Madenler</span>
                    <span className="font-semibold text-slate-900">Test Çözümü</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  Harita Pratiği: 4 Oturum Tamamlandı
                </div>
              </div>

              {/* KPSS Vatandaşlık */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">KPSS Vatandaşlık & Güncel</span>
                  <span className="text-xs font-mono font-bold text-slate-900">88% Başarı</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Temel Hukuk İlkeleri</span>
                    <span className="font-semibold text-slate-900">94% Doğruluk</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1982 Anayasası & İdare Hukuku</span>
                    <span className="font-semibold text-slate-900">86% Doğruluk</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  Mevzuat Güncelleme Takibi: Aktif
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
