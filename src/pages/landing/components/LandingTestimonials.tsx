import React from 'react';

export const LandingTestimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-950 text-[11px] font-bold uppercase tracking-wider mb-3">
            <span>KULLANICI DENEYİMLERİ</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            VIP Üyelerimizin Deneyimleri
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Sınava hazırlanan öğrencilerin, akademik koçların ve velilerin gerçek süreç deneyimleri.
          </p>
        </div>

        {/* 3 Personas with Elegant Typography & Subtle Star Accents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Persona 1: ÖĞRENCİ */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-950 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded uppercase">
                  ÖĞRENCİ
                </span>
                <div className="flex text-amber-400 text-xs">★★★★★</div>
              </div>
              <p className="text-base text-slate-800 font-medium leading-relaxed">
                "Ne çalışacağımı düşünmek yerine, doğrudan çalışmaya başladım. Mahfaza'nın zafiyet analizi sayesinde körü körüne soru çözmekten kurtulup eksiklerime odaklandım."
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-0.5">
              <div className="text-sm font-bold text-slate-900">Zeynep S. Akın</div>
              <div className="text-xs text-emerald-700 font-mono font-semibold">YKS Sayısal · +22.5 Net Artışı</div>
            </div>
          </div>

          {/* Persona 2: EĞİTİM KOÇU */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-950 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded uppercase">
                  EĞİTİM KOÇU
                </span>
                <div className="flex text-amber-400 text-xs">★★★★★</div>
              </div>
              <p className="text-base text-slate-800 font-medium leading-relaxed">
                "38 öğrencimin tüm çalışma sürelerini, deneme analizlerini ve ödev teslimlerini tek ekrandan yönetiyorum. Velilere sunduğum otomatik haftalık raporlar güven ortamını mükemmelleştirdi."
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-0.5">
              <div className="text-sm font-bold text-slate-900">Mert Can Kılıç</div>
              <div className="text-xs text-indigo-950 font-mono font-semibold">Akademik Danışman · 38 Aktif Öğrenci</div>
            </div>
          </div>

          {/* Persona 3: VELİ */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-950 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded uppercase">
                  VELİ
                </span>
                <div className="flex text-amber-400 text-xs">★★★★★</div>
              </div>
              <p className="text-base text-slate-800 font-medium leading-relaxed">
                "Çocuğumuzun ders çalışıp çalışmadığını sürekli sormak evde gerginlik yaratıyordu. Veli paneli sayesinde koçun verdiği görevleri ve haftalık etüt istatistiklerini düzenli takip edebiliyoruz."
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-0.5">
              <div className="text-sm font-bold text-slate-900">Selin Doğan</div>
              <div className="text-xs text-slate-600 font-mono font-medium">LGS Öğrenci Velisi</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
