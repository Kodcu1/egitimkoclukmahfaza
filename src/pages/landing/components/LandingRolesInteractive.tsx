import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LandingRolesInteractive: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'coach' | 'parent'>('student');

  const rolesConfig = {
    student: {
      id: 'student',
      title: 'Öğrenci',
      question: 'Ne yapacağını bil.',
      tagline: 'Planını kur, süreni yönet ve sınav netlerini somut verilerle artır.',
      bulletPoints: [
        'Kişiselleştirilmiş günlük çalışma ajandası ve görev akışı',
        'Pomodoro sayacı ile odaklanma ve etüt takibi',
        'Sınav net analizi ve nokta atışı eksik konu tespiti',
        'Koçtan gelen anlık ödevler ve akademik yönlendirmeler',
      ],
      ctaText: 'Öğrenci Olarak Başla',
      ctaLink: '/register?role=student',
      icon: GraduationCap,
      color: 'blue',
      activeTabClass: 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500',
      badgeClass: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    coach: {
      id: 'coach',
      title: 'Eğitim Koçu',
      question: 'Öğrencinin gelişimini yönet.',
      tagline: 'Portföyündeki tüm öğrencileri tek ekrandan yönet, riskleri anında tespit et.',
      bulletPoints: [
        'Tüm öğrencilerin çalışma süreleri ve deneme netlerini tek bakışta izleme',
        'Akademik erken uyarı sistemi ile düşüş eğilimindeki öğrencileri saptama',
        'Tek tıkla ödev atama, kazanım kontrolü ve hedef net takibi',
        'Velilere otomatik haftalık gelişim karneleri sunma',
      ],
      ctaText: 'Koç Olarak Katıl',
      ctaLink: '/register?role=coach',
      icon: ShieldCheck,
      color: 'violet',
      activeTabClass: 'bg-violet-600 text-white shadow-sm ring-1 ring-violet-500',
      badgeClass: 'bg-violet-50 border-violet-200 text-violet-800',
    },
    parent: {
      id: 'parent',
      title: 'Veli',
      question: 'Çocuğunun gelişimini gör.',
      tagline: 'Evdeki sınav stresini azalt, çocuğunun emeğini şeffaf ve güvenle takip et.',
      bulletPoints: [
        'Sade ve anlaşılır haftalık başarı özeti',
        'Tamamlanan soru sayıları ve etüt sürelerini anlık görme',
        'Koçun bıraktığı değerlendirme notları ve akademik yönlendirmeler',
        'Güven veren şeffaf koç-öğrenci-veli iletişimi',
      ],
      ctaText: 'Veli Olarak Kaydol',
      ctaLink: '/register?role=parent',
      icon: Users,
      color: 'amber',
      activeTabClass: 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-500',
      badgeClass: 'bg-amber-50 border-amber-200 text-amber-800',
    },
  };

  const current = rolesConfig[selectedRole];

  return (
    <section id="roles" className="py-24 bg-gradient-to-b from-white via-slate-50/40 to-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-950 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ORTAK EKOSİSTEM & ROLLER</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Tek Öğrenci. Üç Farklı Bakış Açısı. Tek Sistem.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Öğrenci, koç ve veli arasındaki iletişim kopukluğunu ortadan kaldıran şeffaf ve senkronize ortak çalışma alanı.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 max-w-md mb-10 shadow-xs">
          {(['student', 'coach', 'parent'] as const).map((roleKey) => {
            const role = rolesConfig[roleKey];
            const Icon = role.icon;
            const isSelected = selectedRole === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => setSelectedRole(roleKey)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? role.activeTabClass
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{role.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sol Kolon */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider border px-3 py-1 rounded-lg inline-block ${current.badgeClass}`}>
                {current.title} Portalı
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                "{current.question}"
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {current.tagline}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {current.bulletPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to={current.ctaLink}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
              >
                <span>{current.ctaText}</span>
                <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Sağ Kolon: Modern Mockup Box */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">{current.title} Portalı Görünümü</span>
                  <span className="text-xs text-slate-500">Senkronize Canlı Veri</span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold">
                  Sistem Aktif
                </span>
              </div>

              {selectedRole === 'student' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100">
                      <span className="text-xs font-medium text-slate-500 block">Canlı Pomodoro</span>
                      <span className="text-2xl font-bold font-mono text-blue-900">24:18</span>
                      <span className="text-[11px] text-blue-700 font-medium block mt-1">TYT Paragraf Etüdü</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-medium text-slate-500 block">Günün Soru Hedefi</span>
                      <span className="text-2xl font-bold font-mono text-slate-900">180/200</span>
                      <span className="text-[11px] text-emerald-600 font-medium block mt-1">%90 Tamamlandı</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">AYT Matematik İntegral Testi</span>
                    <span className="text-emerald-700 font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">Tamamlandı</span>
                  </div>
                </div>
              )}

              {selectedRole === 'coach' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-violet-50/40 border border-violet-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Ahmet Yılmaz (12. Sınıf)</span>
                      <span className="text-[11px] text-slate-600">TYT: 104.5 Net (+18.5) · Sadakat: %96</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-violet-100 text-violet-800 text-xs font-mono font-bold">
                      İstikrarlı
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Elif Demir (11. Sınıf)</span>
                      <span className="text-[11px] text-slate-600">Son 2 gündür görev teslimi aksadı</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-mono font-bold">
                      Erken Uyarı
                    </span>
                  </div>
                </div>
              )}

              {selectedRole === 'parent' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-100 text-center">
                      <span className="text-xs font-medium text-slate-500 block">Haftalık Etüt</span>
                      <span className="text-xl font-bold font-mono text-slate-900">34s 20dk</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                      <span className="text-xs font-medium text-slate-500 block">Çözülen Soru</span>
                      <span className="text-xl font-bold font-mono text-slate-900">1.240 Soru</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <span className="font-semibold text-slate-900 block">Koç Değerlendirmesi:</span>
                    <p className="text-slate-600 leading-relaxed">
                      "Ahmet bu hafta matematik ve fen planına eksiksiz uydu. Deneme net artışı istikrarlı şekilde devam ediyor."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
