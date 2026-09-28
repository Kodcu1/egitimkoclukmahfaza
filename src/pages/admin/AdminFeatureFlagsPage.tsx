import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { FeatureFlag } from '../../types';
import {
  Flag,
  Plus,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  Bot,
  MessageSquare,
  FileText,
  Moon,
  X,
} from 'lucide-react';

export const AdminFeatureFlagsPage: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    is_enabled: true,
  });

  const loadFlags = async () => {
    try {
      const data = await db.getFeatureFlags();
      setFlags(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    await db.updateFeatureFlag(flag.id, { is_enabled: !flag.is_enabled });
    await loadFlags();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.createFeatureFlag({
      key: formData.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      name: formData.name,
      description: formData.description,
      is_enabled: formData.is_enabled,
    });
    setIsModalOpen(false);
    setFormData({ key: '', name: '', description: '', is_enabled: true });
    await loadFlags();
  };

  const getFlagIcon = (key: string) => {
    if (key.includes('ai')) return Bot;
    if (key.includes('sms')) return MessageSquare;
    if (key.includes('pdf') || key.includes('report')) return FileText;
    if (key.includes('dark') || key.includes('night')) return Moon;
    return Flag;
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
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-serif">
              Sistem Özellik Bayrakları (Feature Flags)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Uygulama modüllerini kod dağıtımı yapmadan anında açıp kapatın.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Bayrak Ekle</span>
        </button>
      </div>

      {/* Flags List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {flags.map((flag) => {
          const IconComp = getFlagIcon(flag.key);
          return (
            <div
              key={flag.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                flag.is_enabled
                  ? 'bg-slate-900/70 border-slate-800 shadow-md shadow-amber-500/5'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        flag.is_enabled
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">{flag.name}</h3>
                      <span className="text-[11px] font-mono text-amber-400/80">{flag.key}</span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(flag)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      flag.is_enabled ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                        flag.is_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  {flag.description || 'Bu özellik için açıklama belirtilmemiş.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">
                  Son Güncelleme: {new Date(flag.updated_at).toLocaleDateString('tr-TR')}
                </span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    flag.is_enabled ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {flag.is_enabled ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aktif Devrede
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Devre Dışı
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Feature Flag Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 font-serif">Yeni Özellik Bayrağı</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bayrak Anahtarı (Key) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="Örn: live_mentoring_room"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Görünür İsim *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Canlı Birebir Mentörlük Odası"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu bayrak açıldığında sistemde ne etkinleşir?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Oluşturulduğunda hemen aktif et</span>
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
                  Bayrağı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
