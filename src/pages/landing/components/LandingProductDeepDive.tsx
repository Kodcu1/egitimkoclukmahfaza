import React from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Users,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const LandingProductDeepDive: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 border-b border-slate-200 space-y-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">
        {/* DEEP DIVE 1: Student Growth & Trial Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Big Student Growth Mockup */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="text-xs font-mono text-slate-500 pl-2">
                    mahfaza.co/student/analytics
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-700 font-bold">Deneme Gelişim Grafiği</span>
              </div>

              <div className="p-6 space-y-6">
                {/* Header Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block uppercase font-medium">İlk Deneme</span>
                    <span className="text-lg font-bold font-mono text-slate-900">86.0 TYT</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block uppercase font-medium">Son Deneme</span>
                    <span className="text-lg font-bold font-mono text-slate-900">104.5 TYT</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block uppercase font-medium">Net Değişimi</span>
                    <span className="text-lg font-bold font-mono text-slate-900">+18.5 Net</span>
                  </div>
                </div>

                {/* Simulated SVG Line Trend Chart in pure slate */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>TYT Net İlerleme Eğrisi (Son 6 Deneme)</span>
                    <span className="font-mono text-slate-900 font-bold">İstikrarlı Yükseliş</span>
                  </div>

                  {/* SVG Chart */}
                  <div className="h-36 w-full flex items-end justify-between gap-3 pt-4 px-2">
                    {[
                      { name: 'D1', val: 86.0, h: '45%' },
                      { name: 'D2', val: 89.5, h: '55%' },
                      { name: 'D3', val: 93.0, h: '65%' },
                      { name: 'D4', val: 97.2, h: '78%' },
                      { name: 'D5', val: 101.0, h: '88%' },
                      { name: 'D6', val: 104.5, h: '100%' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-mono font-bold text-slate-900">{item.val}</span>
                        <div
                          style={{ height: item.h }}
                          className={`w-full rounded-t transition-all ${
                            idx === 5 ? 'bg-slate-900' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-[11px] font-mono text-slate-500">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic Breakdown */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Zafiyet Taraması: AYT Matematik</span>
                    <span className="text-slate-600 text-[11px]">İntegral alanı ve Türev uygulamalarında eksikler kapatıldı.</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-bold text-[11px]">
                    %92 Çözüm Sadakati
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Deep Dive 1 Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              ANALİTİK DERİNLİK
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Öğrenciyi sadece takip etme. Gelişimini ölç.
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Her deneme sınavı bir teşhis aracıdır. Mahfaza, öğrencinin soru kayıplarını analiz ederek hangi alt konularda zafiyet olduğunu açıkça raporlar.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Deneme Sonuçları & Net Arşivi:</strong>
                  Tüm sınav verilerini ders, bölüm ve konu bazında kronolojik olarak arşivler.
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Net Değişim Eğrisi:</strong>
                  Öğrencinin yükseliş, duraklama veya gerileme dönemlerini erken gösterir.
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Konu Eksikleri Taraması:</strong>
                  Sürekli yanlış yapılan konuları tespit ederek koç için telafi planı önerir.
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Akademik Risk Göstergesi:</strong>
                  Sınav hazırlık sürecindeki motivasyon ve disiplin kayıplarını önceden uyarır.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEEP DIVE 2: Coach Management & Multi-student cohort */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Deep Dive 2 Narrative */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              KOÇLUK YÖNETİMİ
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Koçun bütün öğrencileri tek merkezde.
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Öğrencilerinizin ödev teslim durumlarını, etüt sürelerini ve deneme sonuçlarını tek ekranda toplayın. Zamanınızı evrak işlerine değil, öğrencinizin gelişimine ayırın.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Toplu Öğrenci Portföyü:</strong>
                  Tüm öğrencilerin akademik durumunu tek bakışta izleme imkanı.
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Hızlı Görev & Ödev Atama:</strong>
                  Kişiye özel soru hedefleri ve konu tekrarı görevlerini saniyeler içinde tanımlama.
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Görüşme Takvimi & Notları:</strong>
                  Haftalık koçluk seanslarını planlama ve görüşme notlarını arşivleme.
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Otomatik Veli Raporları:</strong>
                  Velilere sunulan şeffaf ve anlaşılır haftalık başarı bültenleri.
                </div>
              </div>
            </div>
          </div>

          {/* Right: Big Coach Management Mockup */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="text-xs font-mono text-slate-500 pl-2">
                    mahfaza.co/coach/dashboard
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-700 font-bold">Koçluk Yönetim Paneli</span>
              </div>

              <div className="p-6 space-y-6">
                {/* Cohort Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block uppercase font-medium">Aktif Öğrenci</span>
                    <span className="text-lg font-bold font-mono text-slate-900">38 Öğrenci</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block uppercase font-medium">Haftalık Görev Sadakati</span>
                    <span className="text-lg font-bold font-mono text-slate-900">%94.8</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block uppercase font-medium">Risk Durumu</span>
                    <span className="text-lg font-bold font-mono text-slate-900">1 Uyarı</span>
                  </div>
                </div>

                {/* Cohort Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-900 grid grid-cols-12 border-b border-slate-200">
                    <span className="col-span-4">Öğrenci</span>
                    <span className="col-span-3">Grup / Hedef</span>
                    <span className="col-span-3">Son Net / Durum</span>
                    <span className="col-span-2 text-right">Aksiyon</span>
                  </div>

                  <div className="divide-y divide-slate-200 bg-white">
                    <div className="px-4 py-3 grid grid-cols-12 items-center">
                      <div className="col-span-4 font-semibold text-slate-900">
                        Ahmet Yılmaz
                        <span className="block text-[10px] font-normal text-slate-500">12. Sınıf</span>
                      </div>
                      <div className="col-span-3 text-slate-600">YKS Sayısal (Tıp)</div>
                      <div className="col-span-3 font-mono font-semibold text-slate-900">104.5 (+18.5)</div>
                      <div className="col-span-2 text-right font-medium text-slate-700">İyi</div>
                    </div>

                    <div className="px-4 py-3 grid grid-cols-12 items-center">
                      <div className="col-span-4 font-semibold text-slate-900">
                        Elif Kaya
                        <span className="block text-[10px] font-normal text-slate-500">8. Sınıf</span>
                      </div>
                      <div className="col-span-3 text-slate-600">LGS (Fen Lisesi)</div>
                      <div className="col-span-3 font-mono font-semibold text-slate-900">488.4 Puan</div>
                      <div className="col-span-2 text-right font-medium text-slate-700">Normal</div>
                    </div>

                    <div className="px-4 py-3 grid grid-cols-12 items-center">
                      <div className="col-span-4 font-semibold text-slate-900">
                        Mehmet Kaya
                        <span className="block text-[10px] font-normal text-slate-500">Mezun</span>
                      </div>
                      <div className="col-span-3 text-slate-600">KPSS A Grubu</div>
                      <div className="col-span-3 font-mono font-semibold text-slate-900">89.4 Puan</div>
                      <div className="col-span-2 text-right font-medium text-slate-700">Normal</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">Bu Hafta 36 Öğrenci Veli Raporu Otomatik İletildi.</span>
                  <span className="font-mono text-slate-900 font-bold">100% Senkronize</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
