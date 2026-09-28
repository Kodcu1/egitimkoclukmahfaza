import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { AdminCommercialMetrics } from '../../types';
import {
  Users,
  GraduationCap,
  Briefcase,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Layers,
  Tag,
  Activity,
  CheckCircle2,
  Clock,
  Award,
  Server,
  Percent,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminCommercialMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await db.getAdminDashboardMetrics();
        setMetrics(data);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Ticari ve altyapı metrikleri hesaplanıyor...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Aylık Düzenli Gelir (MRR)',
      value: `${metrics.monthlyRecurringRevenue.toLocaleString('tr-TR')} ₺`,
      subtext: `Yıllık Projeksiyon (ARR): ${metrics.annualRecurringRevenue.toLocaleString('tr-TR')} ₺`,
      icon: TrendingUp,
      color: 'from-amber-500/30 via-amber-500/20 to-slate-900 text-amber-300 border-amber-500/40',
      highlight: true,
    },
    {
      title: 'Sponsorlu Öğrenciler',
      value: metrics.sponsoredStudents,
      subtext: `${metrics.sponsoredClassesCount} Sınıf / Kurumsal Hibe`,
      icon: Award,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
      highlight: true,
    },
    {
      title: 'Toplam Kullanıcı',
      value: metrics.totalUsers,
      subtext: `${metrics.activeStudents} Öğrenci + ${metrics.activeCoaches} Koç + ${metrics.activeParents} Veli`,
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
    },
    {
      title: 'Ücretli Abonelikler',
      value: metrics.activeSubscriptions,
      subtext: `${metrics.paidStudents} Ücretli Öğrenci`,
      icon: CreditCard,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
    },
    {
      title: 'Tahmini Altyapı Maliyeti',
      value: `${metrics.estimatedInfrastructureCost.toLocaleString('tr-TR')} ₺`,
      subtext: '~7.87 ₺ / kullanıcı / ay',
      icon: Server,
      color: 'from-slate-800 to-slate-900 text-slate-200 border-slate-700',
    },
    {
      title: 'Ödeme Dönüşüm Oranı',
      value: `%${metrics.conversionRate}`,
      subtext: 'Kayıtlı Kullanıcı → Ödeyen',
      icon: Percent,
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mahfaza.co Faz 2 — SaaS Gelir & Sponsorlu Sınıf Kontrol Merkezi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight font-serif">
              SaaS Ticari Yönetim Paneli
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Öğretmen sponsorlu sınıflar, burs hibeleri, MRR gelirleri, indirim motoru ve sistem güvenlik denetimlerini tek ekranda takip edin.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/coaches"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Koç Yönetimi</span>
            </Link>
            <Link
              to="/admin/sponsored-classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Sponsorlu Sınıflar</span>
            </Link>
            <Link
              to="/admin/entitlements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Bireysel Hibeler</span>
            </Link>
            <Link
              to="/admin/discounts"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Kuponlar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`p-5 sm:p-6 rounded-2xl border bg-gradient-to-br transition-all duration-200 hover:-translate-y-0.5 ${
              card.highlight
                ? 'border-amber-500/40 bg-slate-900/90 shadow-lg shadow-amber-500/5'
                : 'border-slate-800/80 bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl border ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono">
                {card.value}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{card.subtext}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Recent Payments & Security Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Payments Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Son Ödemeler & Tahsilatlar</h2>
            </div>
            <Link
              to="/admin/subscriptions"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Tümü</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 mt-4 divide-y divide-slate-800/60">
            {metrics.recentPayments.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Henüz kayıtlı ödeme bulunmuyor.
              </div>
            ) : (
              metrics.recentPayments.map((pay) => (
                <div key={pay.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{pay.user_name || pay.user_email}</p>
                    <p className="text-[11px] text-slate-500">{pay.plan_name || 'Standart Plan'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-emerald-400">
                      +{pay.amount.toLocaleString('tr-TR')} {pay.currency}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      {pay.status === 'succeeded' ? 'Başarılı' : pay.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security & Audit Logs Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Denetim & Güvenlik Logları</h2>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Tümü</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 mt-4 divide-y divide-slate-800/60">
            {metrics.recentAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Kayıtlı denetim logu bulunmuyor.
              </div>
            ) : (
              metrics.recentAuditLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{log.action}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {log.entity_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{log.actor_name || 'Sistem'}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
