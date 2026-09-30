import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { AdminDiscount, SubscriptionPlan, PriceCalculationResult, UserProfile } from '../../types';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Calculator,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Calendar,
  Layers,
  Copy,
  Check,
  UserCheck,
} from 'lucide-react';

export const AdminDiscountsPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<AdminDiscount | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discount_type: 'percentage' as 'percentage' | 'fixed' | 'free',
    discount_value: 20,
    max_redemptions: 100,
    valid_from: '',
    valid_until: '',
    plan_id: '',
    user_id: '',
    is_active: true,
  });

  // Simulator State
  const [simPlanId, setSimPlanId] = useState<string>('');
  const [simCycle, setSimCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [simCode, setSimCode] = useState<string>('');
  const [simUserId, setSimUserId] = useState<string>('');
  const [simResult, setSimResult] = useState<PriceCalculationResult | null>(null);
  const [simTestingAtomic, setSimTestingAtomic] = useState(false);
  const [atomicSuccessMsg, setAtomicSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [discData, planData, profData] = await Promise.all([
        db.getAdminDiscounts(false),
        db.getSubscriptionPlans(false),
        db.getAllProfiles(),
      ]);
      setDiscounts(discData);
      setPlans(planData);
      setProfiles(profData);
      if (planData.length > 0 && !simPlanId) {
        setSimPlanId(planData[2]?.id || planData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setFormData({
      code: '',
      title: '',
      discount_type: 'percentage',
      discount_value: 25,
      max_redemptions: 100,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      plan_id: '',
      user_id: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d: AdminDiscount) => {
    setEditingDiscount(d);
    setFormData({
      code: d.code,
      title: d.title,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      max_redemptions: d.max_redemptions ?? 0,
      valid_from: d.valid_from ? d.valid_from.split('T')[0] : '',
      valid_until: d.valid_until ? d.valid_until.split('T')[0] : '',
      plan_id: d.plan_id || '',
      user_id: d.user_id || '',
      is_active: d.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDiscount) {
      await db.updateAdminDiscount(editingDiscount.id, {
        code: formData.code.trim().toUpperCase(),
        title: formData.title,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        max_redemptions: formData.max_redemptions ? Number(formData.max_redemptions) : undefined,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : undefined,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined,
        plan_id: formData.plan_id || undefined,
        user_id: formData.user_id || undefined,
        is_active: formData.is_active,
      });
    } else {
      await db.createAdminDiscount({
        code: formData.code.trim().toUpperCase(),
        title: formData.title,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        max_redemptions: formData.max_redemptions ? Number(formData.max_redemptions) : undefined,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : undefined,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined,
        plan_id: formData.plan_id || undefined,
        user_id: formData.user_id || undefined,
        is_active: formData.is_active,
      });
    }
    setIsModalOpen(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu indirim kodunu silmek istediğinize emin misiniz?')) {
      await db.deleteAdminDiscount(id);
      await loadData();
    }
  };

  const handleSimulate = async () => {
    if (!simPlanId) return;
    const res = await db.calculateSubscriptionPrice(
      simPlanId,
      simCycle,
      simCode,
      simUserId || undefined
    );
    setSimResult(res);
    setAtomicSuccessMsg(null);
  };

  const handleTestAtomicRedeem = async (discountId: string) => {
    setSimTestingAtomic(true);
    setAtomicSuccessMsg(null);
    try {
      const discount = discounts.find((item) => item.id === discountId);
      const plan = plans.find((item) => item.id === (discount?.plan_id || simPlanId));
      if (!discount || !plan) throw new Error('Kupon fiyat önizlemesi için plan bulunamadı.');
      const result = await db.calculateSubscriptionPrice(plan.id, simCycle, discount.code, simUserId || undefined);
      setSimResult(result);
      setAtomicSuccessMsg(result.error_message || 'Fiyat önizlemesi tamamlandı; kullanım sayısı, ödeme ve abonelik değiştirilmedi.');
    } catch (err: any) {
      setAtomicSuccessMsg(err.message || 'Kupon fiyatı doğrulanamadı; hiçbir kayıt değiştirilmedi.');
    } finally {
      setSimTestingAtomic(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
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
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-serif">
              İndirim Kuponları & Kampanyalar
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Yüzdesel, sabit tutarlı ve atomik limit korumalı promosyon kuponları.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kupon Tanımla</span>
        </button>
      </div>

      {/* Interactive Price Engine & Atomic Simulator */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-slate-100">
            İnteraktif Fiyat & İndirim Motoru Simülatörü
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Postgres Atomic Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Paket Seçin</label>
            <select
              value={simPlanId}
              onChange={(e) => setSimPlanId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.yearly_price.toLocaleString('tr-TR')} ₺/yıl)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ödeme Döngüsü</label>
            <select
              value={simCycle}
              onChange={(e) => setSimCycle(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
            >
              <option value="yearly">Yıllık (İndirimli Döngü)</option>
              <option value="monthly">Aylık Standart</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Kullanıcı (Özel İndirim Testi)</label>
            <select
              value={simUserId}
              onChange={(e) => setSimUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
            >
              <option value="">Genel / Anonim Kullanıcı</option>
              {profiles.map((pr) => (
                <option key={pr.id || pr.user_id} value={pr.user_id || pr.id}>
                  {pr.name} ({pr.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Kupon Kodu</label>
            <input
              type="text"
              value={simCode}
              onChange={(e) => setSimCode(e.target.value)}
              placeholder="Örn: YKS2027"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs uppercase font-mono font-bold focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              className="w-full py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Fiyatı Hesapla
            </button>
          </div>
        </div>

        {/* Simulator Calculation Result */}
        {simResult && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Liste Fiyatı:</span>
                <span className="text-sm font-semibold text-slate-300 line-through font-mono">
                  {simResult.base_price.toLocaleString('tr-TR')} ₺
                </span>
                <span className="text-xs text-emerald-400 font-semibold font-mono">
                  (-{simResult.discount_amount.toLocaleString('tr-TR')} ₺ İndirim)
                </span>
              </div>
              {simResult.error_message && (
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{simResult.error_message}</span>
                </p>
              )}
              {simResult.discount_title && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Uygulanan Promosyon: <span className="text-amber-300 font-semibold">{simResult.discount_title}</span>
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Ödenecek Net Tutar</span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {simResult.final_price.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Discounts List Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-lg">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm">Aktif ve Geçmiş Kuponlar ({discounts.length})</h3>
          {atomicSuccessMsg && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {atomicSuccessMsg}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Kupon Kodu</th>
                <th className="px-5 py-3.5">Başlık / Kampanya</th>
                <th className="px-5 py-3.5">İndirim Oranı / Tutarı</th>
                <th className="px-5 py-3.5">Kullanım / Limit</th>
                <th className="px-5 py-3.5">Geçerlilik Tarihi</th>
                <th className="px-5 py-3.5">Durum</th>
                <th className="px-5 py-3.5 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        {d.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(d.code)}
                        title="Kodu Kopyala"
                        className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {copiedCode === d.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-200">{d.title}</p>
                    {d.plan_id && (
                      <p className="text-[10px] text-slate-500">
                        Özel Plan: {plans.find((p) => p.id === d.plan_id)?.name || 'Belirli Plan'}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-slate-200">
                    {d.discount_type === 'percentage' && `%${d.discount_value} İndirim`}
                    {d.discount_type === 'fixed' && `${d.discount_value} ₺ İndirim`}
                    {d.discount_type === 'free' && '100% Ücretsiz'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-200">
                        {d.redemption_count} / {d.max_redemptions ?? '∞'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-[11px]">
                    {d.valid_until ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(d.valid_until).toLocaleDateString('tr-TR')}</span>
                      </div>
                    ) : (
                      'Süresiz'
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        d.is_active
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {d.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleTestAtomicRedeem(d.id)}
                        disabled={simTestingAtomic}
                        title="Kupon fiyatını önizle; kullanım sayısı değişmez"
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/20 cursor-pointer"
                      >
                        Önizle
                      </button>
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 font-serif">
                {editingDiscount ? 'İndirim Kuponunu Düzenle' : 'Yeni İndirim Kuponu Tanımla'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kupon Kodu *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs uppercase font-mono font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="Örn: YKS2027"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kampanya Başlığı *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="Örn: Erken Kayıt Fırsatı"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">İndirim Tipi *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="percentage">Yüzdesel (%)</option>
                    <option value="fixed">Sabit Tutar (₺)</option>
                    <option value="free">100% Ücretsiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">İndirim Değeri *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Maks. Kullanım Limiti</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_redemptions}
                    onChange={(e) => setFormData({ ...formData, max_redemptions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="Sınırsız için boş bırakın"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Geçerlilik Sonu</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Özel Paket Kısıtlaması</label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Tüm Paketlerde Geçerli</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kişiye Özel Kısıtlama</label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Herkes Kullanabilir (Genel)</option>
                    {profiles.map((pr) => (
                      <option key={pr.id || pr.user_id} value={pr.user_id || pr.id}>
                        {pr.name} ({pr.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Kuponu Anında Aktifleştir</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingDiscount ? 'Güncelle' : 'Kuponu Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
