import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Subscription, Payment, SubscriptionPlan } from '../../types';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  ArrowDownRight,
  TrendingUp,
  RotateCcw,
  Check,
} from 'lucide-react';

export const AdminSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const loadData = async () => {
    try {
      const [subData, payData, planData] = await Promise.all([
        db.getSubscriptions(),
        db.getPayments(),
        db.getSubscriptionPlans(),
      ]);
      setSubscriptions(subData);
      setPayments(payData);
      setPlans(planData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (subId: string, newStatus: Subscription['status']) => {
    await db.updateSubscription(subId, { status: newStatus });
    await loadData();
    if (selectedSub && selectedSub.id === subId) {
      setSelectedSub((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch =
      (s.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.plan?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Aktif
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <TrendingUp className="w-3 h-3" />
            Deneme
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            Gecikmede
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            İptal Edildi
          </span>
        );
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-serif">
              Aktif Abonelikler & Ödemeler
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Kullanıcıların canlı paket durumlarını, döngülerini ve tahsilat geçmişini yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kullanıcı adı, e-posta veya paket ara..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Tüm Durumlar ({subscriptions.length})</option>
            <option value="active">Aktif Abonelikler</option>
            <option value="trialing">Deneme Sürecindekiler</option>
            <option value="past_due">Ödeme Gecikenler</option>
            <option value="canceled">İptal Edilenler</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Kullanıcı & E-Posta</th>
                <th className="px-5 py-3.5">Paket</th>
                <th className="px-5 py-3.5">Ödeme Döngüsü</th>
                <th className="px-5 py-3.5">Durum</th>
                <th className="px-5 py-3.5">Dönem Sonu</th>
                <th className="px-5 py-3.5 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Arama kriterlerine uygun abonelik bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-100">{sub.user_name || 'Kullanıcı'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{sub.user_email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-slate-200">
                          {sub.plan?.name || 'Paket Tanımsız'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {sub.billing_cycle === 'yearly' ? (
                        <span className="text-amber-400 font-semibold">Yıllık</span>
                      ) : (
                        <span className="text-slate-400">Aylık</span>
                      )}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(sub.status)}</td>
                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      {sub.current_period_end ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(sub.current_period_end).toLocaleDateString('tr-TR')}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {sub.status === 'active' ? (
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'canceled')}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[10px] font-semibold border border-red-500/20 cursor-pointer"
                          >
                            İptal Et
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'active')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/20 cursor-pointer"
                          >
                            Aktifleştir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments History List */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6">
        <h3 className="font-bold text-slate-100 text-sm mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>Sistem Tahsilat ve Ödeme Kayıtları ({payments.length})</span>
        </h3>

        <div className="divide-y divide-slate-800/60 text-xs">
          {payments.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200">{p.user_name || p.user_email}</p>
                <p className="text-[11px] text-slate-500">
                  {p.plan_name} • Sağlayıcı: {p.provider.toUpperCase()} • ID: {p.id}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-emerald-400">
                  +{p.amount.toLocaleString('tr-TR')} {p.currency}
                </p>
                <span className="text-[10px] text-slate-400">
                  {new Date(p.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
