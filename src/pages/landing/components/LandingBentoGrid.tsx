import React from 'react';
import {
  Calendar,
  AlertTriangle,
  BarChart3,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Activity,
} from 'lucide-react';

export const LandingBentoGrid: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-950 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ÇEKİRDEK PLATFORM ÖZELLİKLERİ</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Akademik Disiplini Sağlayan 5 Entegre Motor
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Ezbere yöntemler yerine her öğrencinin öğrenme hızına, çalışma ritmine ve sınav hedefine göre optimize edilen veri tabanlı altyapı.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1 (Col 7): Akademik Dashboard (Large Bento Card) */}
          <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg uppercase">
                  Akademik Dashboard
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Hedef → Plan → Günlük Görev → Ölçüm
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Hedeflenen taban puanlar doğrultusunda haftalık konu dağılımını otomatik planlar. Pomodoro sayaçları ve günlük soru hedefleriyle plana sadakati canlı takip eder.
              </p>

              {/* Realistic Visual Mini Schedule */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-900">
                  <span className="text-blue-900 font-bold">Pazartesi Akademik Rutin</span>
                  <span className="font-mono text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 font-medium">Hedef: 220 Soru · 4s 30dk</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>08:30 - TYT Paragraf Hız Oturumu (30 Soru)</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Tamamlandı</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>14:00 - AYT Matematik İntegral Hacim Hesabı</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Tamamlandı</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>19:30 - AYT Fizik Elektrostatik Tarama Testi</span>
                  </div>
                  <span className="font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">Bekliyor</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="text-blue-950 font-bold">Haftalık Görev Sadakati: %94.2</span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tam Uyum</span>
              </span>
            </div>
          </div>

          {/* Card 2 (Col 5): Erken Uyarı & Risk Motoru */}
          <div className="md:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-amber-300 hover:shadow-md transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg uppercase">
                  Risk Motoru
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Performans Düşüşünü Erken Tespit Et
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Öğrencinin son denemelerindeki net dalgalanmalarını ve çalışma aksamalarını algılayarak koça erken alarm üretir.
              </p>

              {/* Realistic Risk Alert Box */}
              <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-950 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                  <span>Sistem Analiz Raporu</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  "AYT Fizik mekanik netlerinde son 2 denemede 2.5 netlik düşüş ve soru çözüm süresinde artış tespit edildi."
                </p>
                <div className="pt-2 border-t border-amber-200/60 text-[11px] font-bold text-blue-950">
                  Koç Aksiyonu: Telafi soru paketi atandı.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-amber-900">Anlık Pedagojik Teşhis</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          {/* Card 3 (Col 4): Deneme & Yanlış Analizi */}
          <div className="md:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-indigo-300 hover:shadow-md transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                  Deneme Analizi
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Ders ve Konu Bazlı Yanlış Taraması
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hangi konularda tekrar eden bilgi veya işlem hatası yapıldığını net bazında haritalandırır.
              </p>

              <div className="p-3.5 rounded-xl bg-indigo-50/30 border border-indigo-100 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span className="text-slate-600">Tekrar Eden Zafiyet:</span>
                  <span className="font-mono text-indigo-900 font-bold bg-indigo-100/80 border border-indigo-200 px-1.5 py-0.5 rounded">TYT Geo</span>
                </div>
                <div className="text-slate-700 font-medium">Üçgende Açı-Kenar Bağıntıları (%45 Başarı)</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs font-bold text-indigo-900 flex items-center justify-between">
              <span>Kazanım Karnesi</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>

          {/* Card 4 (Col 4): Şeffaf Veli Takibi */}
          <div className="md:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-amber-300 hover:shadow-md transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                  Veli Takibi
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Evdeki Sınav Stresini Azaltan Şeffaflık
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Velinin öğrencinin emeğini, haftalık etüt süresini ve koç değerlendirmesini net görmesini sağlar.
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50/30 border border-amber-100 space-y-1.5 text-xs">
                <div className="font-bold text-amber-950">Haftalık Veli Özeti</div>
                <div className="text-slate-700 font-mono font-medium">1.240 Soru Çözüldü · 34s 20dk Etüt</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs font-bold text-amber-900 flex items-center justify-between">
              <span>Otomatik Veli Raporları</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
          </div>

          {/* Card 5 (Col 4): Koçluk & Portföy Yönetimi */}
          <div className="md:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-violet-300 hover:shadow-md transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-xs font-mono font-bold text-violet-800 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded uppercase">
                  Koç Yönetimi
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                Tüm Öğrenciler Tek Merkezde
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Koçun onlarca öğrencisini, ödev teslimlerini, sınav gelişimlerini ve randevularını tek panelde toplar.
              </p>

              <div className="p-3.5 rounded-xl bg-violet-50/30 border border-violet-100 space-y-1.5 text-xs">
                <div className="font-bold text-violet-950">Portföy Kontrolü</div>
                <div className="text-slate-700 font-medium">38 Aktif Öğrenci · Sıfır İletişim Kopukluğu</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs font-bold text-violet-900 flex items-center justify-between">
              <span>Grup & Bireysel Yönetim</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
