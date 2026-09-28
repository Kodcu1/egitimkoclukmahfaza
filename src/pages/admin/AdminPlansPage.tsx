import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { SubscriptionPlan } from '../../types';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Users,
  Bot,
  FileText,
  Shield,
  Star,
  CheckCircle2,
} from 'lucide-react';

export const AdminPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    currency: 'TRY',
    student_limit: 1,
    ai_monthly_limit: 50,
    parent_access: true,
    advanced_reports: false,
    pdf_reports: true,
    priority_support: false,
    featuresText: '',
    is_featured: false,
    is_active: true,
    sort_order: 1,
  });

  const loadPlans = async () => {
    try {
      const data = await db.getSubscriptionPlans(false);
      setPlans(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      monthly_price: 0,
      yearly_price: 0,
      currency: 'TRY',
      student_limit: 1,
      ai_monthly_limit: 50,
      parent_access: true,
      advanced_reports: false,
      pdf_reports: true,
      priority_support: false,
      featuresText: 'Günlük soru ve çalışma günlüğü takibi\nTemel TYT/AYT deneme kaydı\nPomodoro odaklanma odası',
      is_featured: false,
      is_active: true,
      sort_order: plans.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      currency: plan.currency,
      student_limit: plan.student_limit,
      ai_monthly_limit: plan.ai_monthly_limit,
      parent_access: plan.parent_access,
      advanced_reports: plan.advanced_reports,
      pdf_reports: plan.pdf_reports,
      priority_support: plan.priority_support,
      featuresText: (plan.features || []).join('\n'),
      is_featured: plan.is_featured,
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const features = formData.featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingPlan) {
      await db.updateSubscriptionPlan(editingPlan.id, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        monthly_price: Number(formData.monthly_price),
        yearly_price: Number(formData.yearly_price),
        currency: formData.currency,
        student_limit: Number(formData.student_limit),
        ai_monthly_limit: Number(formData.ai_monthly_limit),
        parent_access: formData.parent_access,
        advanced_reports: formData.advanced_reports,
        pdf_reports: formData.pdf_reports,
        priority_support: formData.priority_support,
        features,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        sort_order: Number(formData.sort_order),
      });
    } else {
      await db.createSubscriptionPlan({
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: formData.description,
        monthly_price: Number(formData.monthly_price),
        yearly_price: Number(formData.yearly_price),
        currency: formData.currency,
        student_limit: Number(formData.student_limit),
        ai_monthly_limit: Number(formData.ai_monthly_limit),
        parent_access: formData.parent_access,
        advanced_reports: formData.advanced_reports,
        pdf_reports: formData.pdf_reports,
        priority_support: formData.priority_support,
        features,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        sort_order: Number(formData.sort_order),
      });
    }

    setIsModalOpen(false);
    await loadPlans();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu paketi silmek istediğinize emin misiniz?')) {
      await db.deleteSubscriptionPlan(id);
      await loadPlans();
    }
  };

  const toggleStatus = async (plan: SubscriptionPlan) => {
    await db.updateSubscriptionPlan(plan.id, { is_active: !plan.is_active });
    await loadPlans();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-serif">
                Abonelik Paketleri Yönetimi
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Öğrenci, koç ve kurumsal fiyatlandırma planlarını yapılandırın.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Plan Oluştur</span>
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
              plan.is_featured
                ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-lg">{plan.name}</h3>
                  {plan.is_featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Star className="w-3 h-3 fill-amber-300" />
                      Popüler
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleStatus(plan)}
                  title={plan.is_active ? 'Pasife Al' : 'Aktifleştir'}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                    plan.is_active
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {plan.is_active ? 'Aktif' : 'Pasif'}
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2 min-h-[36px] line-clamp-2">
                {plan.description || 'Açıklama girilmedi.'}
              </p>

              {/* Pricing Display */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Aylık:</span>
                  <span className="text-xl font-extrabold text-slate-100 font-mono">
                    {plan.monthly_price === 0 ? 'Ücretsiz' : `${plan.monthly_price.toLocaleString('tr-TR')} ₺`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-800/50">
                  <span className="text-xs text-slate-400">Yıllık:</span>
                  <span className="text-sm font-semibold text-amber-400 font-mono">
                    {plan.yearly_price === 0 ? 'Ücretsiz' : `${plan.yearly_price.toLocaleString('tr-TR')} ₺ / yıl`}
                  </span>
                </div>
              </div>

              {/* Limits and Badges */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>{plan.student_limit} Öğrenci</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span>{plan.ai_monthly_limit} AI / ay</span>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-4 space-y-1.5">
                {(plan.features || []).slice(0, 4).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => openEditModal(plan)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Düzenle</span>
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Paketi Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 font-serif">
                {editingPlan ? 'Paketi Düzenle' : 'Yeni SaaS Paketi Oluştur'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Paket Adı *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="Örn: Pro (Koç & Mentor)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Slug (Benzersiz Kod)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="Örn: pro-koc"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Paketin hedef kitlesi ve ana faydası..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Aylık Ücret (₺) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Yıllık Ücret (₺) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.yearly_price}
                    onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Öğrenci Kontenjanı *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.student_limit}
                    onChange={(e) => setFormData({ ...formData, student_limit: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Aylık AI Token / İstek Limiti *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.ai_monthly_limit}
                    onChange={(e) => setFormData({ ...formData, ai_monthly_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Paket Özellikleri (Her satıra bir özellik yazın)
                </label>
                <textarea
                  rows={4}
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 focus:outline-none custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.parent_access}
                    onChange={(e) => setFormData({ ...formData, parent_access: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Veli Erişimi</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pdf_reports}
                    onChange={(e) => setFormData({ ...formData, pdf_reports: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>PDF Karne</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Öne Çıkar (Popüler)</span>
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
                  {editingPlan ? 'Değişiklikleri Kaydet' : 'Planı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
