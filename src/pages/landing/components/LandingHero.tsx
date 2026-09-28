import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BarChart2,
  FileText,
  MessageSquare,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertTriangle,
  Award,
  Sparkles,
  TrendingUp,
  Download,
  BookOpen,
} from 'lucide-react';

type DashboardTab = 'overview' | 'plan' | 'tasks' | 'exams' | 'weakness' | 'coach' | 'reports';
type ExamMode = 'YKS' | 'LGS' | 'KPSS';

export const LandingHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [activeExamMode, setActiveExamMode] = useState<ExamMode>('YKS');

  // Realistic mock data per exam mode
  const examData = {
    YKS: {
      studentName: 'Ahmet Yılmaz',
      tag: 'YKS 2027 Sayısal · 12. Sınıf',
      target: 'Hacettepe Üniversitesi Tıp Fakültesi',
      lastExamScore: '104.5',
      lastExamLabel: 'TYT Net',
      lastExamSub: '3D Türkiye Geneli Deneme 12',
      netGrowth: '+18.5',
      netGrowthSub: 'Başlangıç: 86.0 Net',
      fidelity: '94.2%',
      fidelitySub: '24/27 Görev Teslimi',
      riskStatus: 'Düşük Risk',
      riskColor: 'bg-emerald-600',
      branches: [
        { subject: 'TYT Türkçe', net: '36.25 / 40', pct: 90 },
        { subject: 'TYT Matematik', net: '34.50 / 40', pct: 86 },
        { subject: 'AYT Matematik', net: '32.50 / 40', pct: 81 },
        { subject: 'AYT Fizik', net: '12.25 / 14', pct: 87 },
        { subject: 'AYT Kimya', net: '11.50 / 13', pct: 88 },
        { subject: 'AYT Biyoloji', net: '11.00 / 13', pct: 84 },
      ],
      recentExams: [
        { name: '3D Türkiye Geneli TYT-12', date: '24 May', score: '104.50 Net', rank: '1.420 / 84.000' },
        { name: 'Apotemi AYT Sayısal-4', date: '18 May', score: '68.25 Net', rank: '890 / 45.000' },
        { name: 'Limit Kurumsal TYT-10', date: '11 May', score: '101.75 Net', rank: '1.980 / 62.000' },
        { name: 'Bilgi Sarmal AYT Sayısal-3', date: '04 May', score: '65.50 Net', rank: '1.210 / 38.000' },
      ],
      weakTopics: [
        { topic: 'AYT Matematik: İntegral Hacim Hesabı', severity: 'high', rec: '45 Soru + Video Analiz' },
        { topic: 'AYT Fizik: Elektromanyetik İndüksiyon', severity: 'medium', rec: '30 Soru Tekrar' },
        { topic: 'TYT Türkçe: Paragrafta Anlatım Teknikleri', severity: 'low', rec: '2 Hız Denemesi' },
        { topic: 'AYT Kimya: Elektrokimya & Piller', severity: 'low', rec: 'Konu Kavram Haritası' },
      ],
    },
    LGS: {
      studentName: 'Zeynep Kaya',
      tag: 'LGS 2027 · 8. Sınıf',
      target: 'İstanbul Erkek Lisesi',
      lastExamScore: '484.2',
      lastExamLabel: 'LGS Puan',
      lastExamSub: 'MEB Uyumlu Türkiye Geneli Deneme-8',
      netGrowth: '+34.0 Puan',
      netGrowthSub: 'Başlangıç: 450.2 Puan',
      fidelity: '96.5%',
      fidelitySub: '28/29 Görev Teslimi',
      riskStatus: 'Düşük Risk',
      riskColor: 'bg-emerald-600',
      branches: [
        { subject: 'Türkçe', net: '19.00 / 20', pct: 95 },
        { subject: 'Matematik (Yeni Nesil)', net: '17.33 / 20', pct: 86 },
        { subject: 'Fen Bilimleri', net: '19.33 / 20', pct: 96 },
        { subject: 'T.C. İnkılap Tarihi', net: '10.00 / 10', pct: 100 },
        { subject: 'Din Kültürü', net: '10.00 / 10', pct: 100 },
        { subject: 'İngilizce', net: '9.66 / 10', pct: 96 },
      ],
      recentExams: [
        { name: 'Mozaik Türkiye Geneli LGS-8', date: '22 May', score: '484.20 Puan', rank: '120 / 42.000' },
        { name: 'Nitelik Kurumsal LGS-7', date: '15 May', score: '478.50 Puan', rank: '240 / 38.000' },
        { name: 'Hız Yayınları LGS-6', date: '08 May', score: '472.00 Puan', rank: '380 / 35.000' },
      ],
      weakTopics: [
        { topic: 'Matematik: Olasılık & Cebirsel İfadeler', severity: 'high', rec: '30 Yeni Nesil Soru' },
        { topic: 'Fen Bilimleri: Madde ve Endüstri', severity: 'medium', rec: 'Kavram Testi' },
        { topic: 'Türkçe: Sözel Mantık & Muhakeme', severity: 'low', rec: '15 dk Günlük Egzersiz' },
      ],
    },
    KPSS: {
      studentName: 'Murat Demir',
      tag: 'KPSS Lisans A Grubu / B Grubu',
      target: 'Gelir Uzman Yardımcılığı (GUY)',
      lastExamScore: '89.4',
      lastExamLabel: 'P3 Puanı',
      lastExamSub: 'Yediiklim Türkiye Geneli-9',
      netGrowth: '+12.8 Puan',
      netGrowthSub: 'Başlangıç: 76.6 Puan',
      fidelity: '91.0%',
      fidelitySub: '21/23 Görev Teslimi',
      riskStatus: 'Düşük Risk',
      riskColor: 'bg-emerald-600',
      branches: [
        { subject: 'GY Türkçe', net: '26.75 / 30', pct: 89 },
        { subject: 'GY Matematik & Geometri', net: '24.50 / 30', pct: 81 },
        { subject: 'GK Tarih', net: '23.00 / 27', pct: 85 },
        { subject: 'GK Coğrafya', net: '16.50 / 18', pct: 91 },
        { subject: 'GK Vatandaşlık', net: '7.50 / 9', pct: 83 },
        { subject: 'GK Güncel Bilgiler', net: '5.00 / 6', pct: 83 },
      ],
      recentExams: [
        { name: 'Yediiklim TG-9 Lisans', date: '20 May', score: '89.40 Puan', rank: '420 / 31.000' },
        { name: 'Pegem Akademi TG-8', date: '12 May', score: '87.10 Puan', rank: '650 / 29.000' },
        { name: 'İsem Yayıncılık TG-7', date: '05 May', score: '84.80 Puan', rank: '980 / 25.000' },
      ],
      weakTopics: [
        { topic: 'GK Tarih: Çağdaş Türk ve Dünya Tarihi', severity: 'high', rec: 'Kronolojik Kart Çalışması' },
        { topic: 'GY Matematik: Grafik & Tablo Okuma', severity: 'medium', rec: '35 Soru Pratiği' },
        { topic: 'GK Vatandaşlık: İdare Hukuku Hiyerarşisi', severity: 'low', rec: 'Şematik Tekrar' },
      ],
    },
  };

  const current = examData[activeExamMode];

  return (
    <section className="relative bg-gradient-to-b from-slate-50 via-[#F4F7FF]/60 to-white pt-10 pb-20 border-b border-slate-200/80 overflow-hidden">
      {/* Subtle ambient light accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-blue-100/30 via-indigo-100/30 to-violet-100/30 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Content Hierarchy */}
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Small Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-200/90 text-indigo-950 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider uppercase font-mono text-indigo-900">
              MAHFAZA.CO — AKADEMİK YÖNETİM PLATFORMU
            </span>
          </div>

          {/* Headline with 2026 Visual Hierarchy */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Planını Kur. <br className="hidden sm:inline" />
            Disiplinini Koru. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 font-black">
              Hedefine Ulaş.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Öğrenci, koç ve veliyi tek bir akademik yönetim sisteminde buluşturan yeni nesil eğitim koçluğu platformu.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Ücretsiz Başla</span>
              <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 hover:text-indigo-950 font-semibold px-8 py-3.5 rounded-xl border border-slate-300/80 transition-colors text-sm shadow-xs"
            >
              <span>Nasıl Çalışır</span>
            </a>
          </div>

          {/* Hero Data Metrics (Single Container with Dividers) */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-slate-200/80">
                {/* Metric 1 */}
                <div className="p-5 sm:p-6 text-center bg-gradient-to-b from-white to-amber-50/20">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
                    <span className="text-amber-500 text-xl">★</span>
                    <span>4.9 / 5.0</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Memnuniyet
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-5 sm:p-6 text-center bg-gradient-to-b from-white to-emerald-50/20">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-700 flex items-center justify-center gap-1">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>+18.4</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Net Artışı
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-5 sm:p-6 text-center bg-gradient-to-b from-white to-blue-50/20">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-blue-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span>94.2%</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Görev Sadakati
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-5 sm:p-6 text-center bg-gradient-to-b from-white to-indigo-50/20">
                  <div className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-indigo-900 flex items-center justify-center gap-1.5">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span>YKS · LGS · KPSS</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Tam Uyum
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Large Interactive Product Dashboard Mockup */}
        <div id="platform-overview" className="mt-16 max-w-6xl mx-auto">
          {/* Exam Mode Switcher Banner */}
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                İnteraktif Ürün Önizlemesi:
              </span>
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                Menüden sekmeleri seçip platformu canlı test edebilirsiniz.
              </span>
            </div>
            <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold">
              {(['YKS', 'LGS', 'KPSS'] as ExamMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveExamMode(mode)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeExamMode === mode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode} Modu
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {/* Top Window Bar */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-xs font-mono text-slate-500 pl-3">
                  mahfaza.co/student/{activeTab}?exam={activeExamMode.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-xs font-medium text-slate-700">İnteraktif Demo (Canlı)</span>
              </div>
            </div>

            {/* Main Application Frame */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
              {/* Interactive Sidebar */}
              <aside className="lg:col-span-3 bg-slate-50 border-r border-slate-200 p-4 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Student Profile Block */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                        {current.studentName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">{current.studentName}</div>
                        <div className="text-xs text-slate-500 truncate">{current.tag}</div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Hedef:</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[120px]">{current.target}</span>
                    </div>
                  </div>

                  {/* Clickable Navigation List */}
                  <nav className="space-y-1">
                    {[
                      { id: 'overview' as DashboardTab, name: 'Genel Bakış', icon: LayoutDashboard },
                      { id: 'plan' as DashboardTab, name: 'Haftalık Plan', icon: Calendar },
                      { id: 'tasks' as DashboardTab, name: 'Görevler & Soru Takibi', icon: CheckSquare, badge: '24' },
                      { id: 'exams' as DashboardTab, name: 'Deneme Analizleri', icon: BarChart2 },
                      { id: 'weakness' as DashboardTab, name: 'Kazanım & Zafiyet', icon: Activity },
                      { id: 'coach' as DashboardTab, name: 'Koç Değerlendirmesi', icon: MessageSquare },
                      { id: 'reports' as DashboardTab, name: 'Akademik Raporlar', icon: FileText },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isCurrent = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-950 text-white font-semibold shadow-xs ring-1 ring-indigo-900'
                              : 'text-slate-700 hover:bg-slate-200/70 hover:text-indigo-950'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isCurrent ? 'bg-amber-400 text-indigo-950' : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Haftalık Çalışma</span>
                    <span className="font-mono text-indigo-950">34s 20dk</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block text-right font-medium">%85 Hedefe Ulaşıldı</span>
                </div>
              </aside>

              {/* Dynamic Main Content Area Depending on Active Tab */}
              <main className="lg:col-span-9 p-6 bg-white space-y-6">
                {/* 1. TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Akademik Kontrol Merkezi
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Haftalık Gelişim & Deneme Performansı
                        </h2>
                      </div>
                      <span className="px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 font-mono">
                        Dönem: 2027-{activeExamMode}
                      </span>
                    </div>

                    {/* 4 Core Realism Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                          Son Deneme
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-xl font-bold font-mono text-slate-900">
                            {current.lastExamScore}
                          </span>
                          <span className="text-xs font-medium text-slate-600">{current.lastExamLabel}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block truncate">
                          {current.lastExamSub}
                        </span>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                          Gelişim
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-xl font-bold font-mono text-slate-900">
                            {current.netGrowth}
                          </span>
                          <span className="text-xs font-medium text-slate-600">Net</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block truncate">
                          {current.netGrowthSub}
                        </span>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                          Görev Sadakati
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-xl font-bold font-mono text-slate-900">
                            {current.fidelity}
                          </span>
                          <span className="text-xs font-medium text-slate-600">Tamam</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block truncate">
                          {current.fidelitySub}
                        </span>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                          Akademik Risk
                        </span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                          <span className="text-sm font-bold text-slate-900">{current.riskStatus}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">İstikrarlı İlerleme</span>
                      </div>
                    </div>

                    {/* Subject Breakdown & Weekly Tasks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
                            {activeExamMode} Branş Net Dağılımı
                          </h4>
                          <span className="text-xs font-mono text-slate-500">Ortalama Başarı</span>
                        </div>
                        <div className="space-y-3 text-xs">
                          {current.branches.map((row, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between font-medium">
                                <span className="text-slate-800">{row.subject}</span>
                                <span className="font-mono text-slate-900 font-bold">{row.net}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div
                                  className="bg-slate-900 h-1.5 rounded-full"
                                  style={{ width: `${row.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
                            Haftalık Görevler
                          </h4>
                          <span className="text-xs font-mono text-slate-700 font-bold">24 Tamamlandı · 3 Bekliyor</span>
                        </div>
                        <div className="space-y-2.5 text-xs">
                          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                              <span className="text-slate-900 font-medium">Matematik Soru Çözüm Etüdü (50 Soru)</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-600">Tamamlandı</span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                              <span className="text-slate-900 font-medium">Türkçe Paragraf Hız Denemesi</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-600">30 dk / 38 Net</span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-700 shrink-0" />
                              <span className="text-slate-800">Fen Bilimleri Konu Tekrarı</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-700 font-semibold">Bugün 18:00</span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-700 shrink-0" />
                              <span className="text-slate-800">Koç Değerlendirme Görüşmesi</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-700 font-semibold">Yarın 19:30</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TAB: WEEKLY PLAN */}
                {activeTab === 'plan' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-5 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Zaman Yönetimi
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Dinamik Haftalık Çalışma Çizelgesi
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-md text-slate-800">
                        Hafta: 24 (25 - 31 Mayıs)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                      {[
                        { day: 'Pzt', hours: '5s 30dk', tasks: '6/6 Görev', done: true },
                        { day: 'Sal', hours: '6s 15dk', tasks: '7/7 Görev', done: true },
                        { day: 'Çar', hours: '5s 00dk', tasks: '5/5 Görev', done: true },
                        { day: 'Per', hours: '6s 45dk', tasks: '8/8 Görev', done: true },
                        { day: 'Cum', hours: '4s 30dk', tasks: '4/5 Görev', done: false, active: true },
                        { day: 'Cmt', hours: '7s 00dk', tasks: 'Deneme Günü', planned: true },
                        { day: 'Paz', hours: '3s 00dk', tasks: 'Haftalık Analiz', planned: true },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border text-center space-y-2 ${
                            item.active
                              ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900 uppercase">{item.day}</div>
                          <div className="text-sm font-mono font-bold text-slate-800">{item.hours}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{item.tasks}</div>
                          <div className="pt-1">
                            {item.done ? (
                              <span className="text-[10px] text-slate-900 font-bold">✓ Tamam</span>
                            ) : item.active ? (
                              <span className="text-[10px] text-slate-900 font-bold">● Aktif</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Planlandı</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <Sparkles className="w-4 h-4 text-slate-900" />
                        <span>AI & Koçluk Optimizasyonu:</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Cumartesi yapılacak Türkiye Geneli deneme öncesinde Cuma günü hafifletilmiş etüt planı uygulanmıştır. Pazar akşamı saat 20:00'de haftalık analiz raporu veli paneline otomatik iletilecektir.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. TAB: TASKS */}
                {activeTab === 'tasks' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-5 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Ödev & Soru Bankası
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Görev Atama & Kanıt Onay Merkezi
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
                        24 Tamamlandı / 3 Bekliyor
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: 'Matematik: Fonksiyonlar 80 Soru', sub: 'Kanıt fotoğrafı yüklendi', xp: '+40 XP', status: 'Koç Onayladı', done: true },
                        { title: 'Fizik: Newton Hareket Yasaları Test 4-5', sub: 'Süre tutularak çözüldü (45 dk)', xp: '+30 XP', status: 'Koç Onayladı', done: true },
                        { title: 'Türkçe: Dil Bilgisi Karma Deneme', sub: '25 Soru · 23 Doğru 2 Yanlış', xp: '+25 XP', status: 'Koç Onayladı', done: true },
                        { title: 'Kimya: Gazlar & Basınç Grafikleri', sub: 'Yarın 18:00 teslim', xp: '+35 XP', status: 'Devam Ediyor', done: false },
                        { title: 'Haftalık 500 Soru Barajı', sub: 'Şu an: 460 / 500 Soru', xp: '+100 XP', status: 'İlerleme %92', done: false },
                      ].map((task, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            {task.done ? (
                              <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />
                            ) : (
                              <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <div className="text-xs font-bold text-slate-900">{task.title}</div>
                              <div className="text-[11px] text-slate-500">{task.sub}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-slate-800">{task.xp}</span>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                                task.done
                                  ? 'bg-slate-100 text-slate-900 border-slate-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. TAB: EXAMS */}
                {activeTab === 'exams' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-5 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Deneme Takip Arşivi
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Türkiye Geneli Deneme Analiz Karnesi
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-md text-slate-800">
                        Hedef: {current.target}
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-3">Deneme Adı</th>
                            <th className="p-3">Tarih</th>
                            <th className="p-3">Sonuç / Net</th>
                            <th className="p-3">Türkiye Sıralaması</th>
                            <th className="p-3 text-right">Rapor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {current.recentExams.map((ex, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="p-3 font-semibold text-slate-900">{ex.name}</td>
                              <td className="p-3 text-slate-500 font-mono">{ex.date}</td>
                              <td className="p-3 font-bold font-mono text-slate-900">{ex.score}</td>
                              <td className="p-3 font-mono text-slate-700">{ex.rank}</td>
                              <td className="p-3 text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 hover:underline cursor-pointer">
                                  <span>PDF İncele</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. TAB: WEAKNESS */}
                {activeTab === 'weakness' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-5 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Kazanım ve Risk Analitiği
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Zafiyet Haritası & Telafi Planı
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
                        Algoritmik Tarama: Aktif
                      </span>
                    </div>

                    <div className="space-y-3">
                      {current.weakTopics.map((w, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  w.severity === 'high'
                                    ? 'bg-rose-500'
                                    : w.severity === 'medium'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span className="text-xs font-bold text-slate-900">{w.topic}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 pl-4">
                              Önerilen Müdahale: <span className="font-semibold text-slate-900">{w.rec}</span>
                            </p>
                          </div>
                          <button className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shrink-0">
                            Etüt Ata
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. TAB: COACH */}
                {activeTab === 'coach' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-5 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Bireysel Danışmanlık
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Serkan Hoca — Eğitim Koçu Değerlendirme Karnesi
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-md text-slate-800">
                        Görüşme: Dün 19:30
                      </span>
                    </div>

                    <div className="p-5 rounded-lg bg-linear-to-b from-indigo-50/40 to-slate-50 border border-indigo-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-950 text-white flex items-center justify-center font-bold text-xs ring-2 ring-amber-400/50">
                          SK
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Serkan Hoca — Eğitim Koçu</div>
                          <div className="text-[11px] text-indigo-900 font-medium">Haftalık Strateji & Motivasyon Notu</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        "Ahmet, son 3 denemede Matematik netlerindeki istikrar Hacettepe Tıp hedefimize adım adım yaklaştığımızı gösteriyor. Bu hafta özellikle AYT Fizik İndüksiyon konusundaki 2 soruluk eksikliği tamamlayacağız. Çarşamba günü saat 18:00'deki birebir özel dersimizde bu fasikülü birlikte bitireceğiz. Harika bir disiplinle devam ediyoruz!"
                      </p>
                      <div className="pt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs text-slate-600">
                        <span>Sonraki Birebir Seans: <strong className="text-slate-900">Çarşamba 18:00</strong></span>
                        <span className="font-mono text-indigo-950 font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                          🎁 Özel Ders: 1/1 Tanımlı
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. TAB: REPORTS */}
                {activeTab === 'reports' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-5 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Resmi Çıktılar
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Resmi PDF Karne & Veli İlerleme Raporu
                        </h2>
                      </div>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF İndir</span>
                      </button>
                    </div>

                    <div className="p-6 rounded-lg bg-white border border-slate-200 space-y-4 font-mono text-xs">
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span className="font-bold text-slate-900">MAHFAZA.CO RESMİ AKADEMİK GELİŞİM BELGESİ</span>
                        <span className="text-slate-500">BELGE NO: MFZ-2027-891</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-slate-700">
                        <div>Öğrenci: <strong>{current.studentName}</strong></div>
                        <div>Sınav Grubu: <strong>{activeExamMode}</strong></div>
                        <div>Toplam Etüt Süresi: <strong>142 Saat (Aylık)</strong></div>
                        <div>Çözülen Soru: <strong>2.840 Soru</strong></div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-600 font-sans text-xs">
                        Bu belge Mahfaza.co Akademik Veri İşleme Motoru tarafından veli ve rehberlik servisi bilgilendirmesi amacıyla otomatik olarak üretilmiştir.
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
