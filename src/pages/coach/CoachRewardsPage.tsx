import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Reward, RewardClaim, Student } from '../../types';
import { PhysicalRewardOrder, ShippingStatus } from '../../types/saps.types';
import { sapsService } from '../../services/sapsService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AddRewardModal } from '../../components/modals/AddRewardModal';
import { formatDateTurkish } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  Gift,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Coffee,
  BookMarked,
  Film,
  Edit3,
  BookOpen,
  GraduationCap,
  Award,
  Check,
  X,
  Send,
  Truck,
  ShieldCheck,
  Phone,
  MapPin,
  Save,
  Package,
} from 'lucide-react';

export const CoachRewardsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [physicalOrders, setPhysicalOrders] = useState<PhysicalRewardOrder[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [rewardToEdit, setRewardToEdit] = useState<Reward | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'claims' | 'shipping'>('rewards');
  const [, setIsLoading] = useState<boolean>(true);

  // Tracking edit state for orders
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [carrierInput, setCarrierInput] = useState<string>('Yurtiçi Kargo');
  const [trackingInput, setTrackingInput] = useState<string>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rList, cList, sList, orders] = await Promise.all([
        db.getRewards(),
        db.getClaims(),
        db.getStudents(),
        sapsService.getCoachPhysicalOrders(),
      ]);
      setRewards(rList);
      setClaims(cList);
      setStudents(sList);
      setPhysicalOrders(orders);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateClaimStatus = async (
    claimId: string,
    status: 'approved' | 'delivered' | 'rejected'
  ) => {
    await db.updateClaimStatus(claimId, status);
    toast.success(`Ödül talebi durumu güncellendi: ${status}`);
    await loadData();
  };

  const handleUpdateShippingStatus = async (
    orderId: string,
    status: ShippingStatus,
    carrier?: string,
    tracking?: string
  ) => {
    const ok = await sapsService.updateShippingStatus(orderId, status, carrier, tracking);
    if (ok) {
      toast.success(`Sipariş ${status === 'shipped' ? 'Kargoya Verildi' : status === 'delivered' ? 'Teslim Edildi' : status} olarak işaretlendi.`);
      setEditingOrderId(null);
      await loadData();
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (window.confirm('Bu ödül talebini kalıcı olarak silmek istediğinize emin misiniz?')) {
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      try {
        await db.deleteClaim(claimId);
      } catch (err) {
        console.error('Ödül talebi silme hatası:', err);
        await loadData();
      }
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (window.confirm('Bu ödülü mağazadan kaldırmak istediğinize emin misiniz?')) {
      await db.deleteReward(id);
      await loadData();
    }
  };

  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-600" />;
      case 'BookMarked':
        return <BookMarked className="w-5 h-5 text-indigo-600" />;
      case 'Film':
        return <Film className="w-5 h-5 text-rose-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      default:
        return <Gift className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>SAPS Ödül, Motivasyon & Kargo Yönetimi</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Serkan Koçak
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Öğrencilerin XP ödülleri, SAPS Stuff kargo siparişleri ve KVKK uyumlu adres teslimatları.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setRewardToEdit(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ödül Ekle</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Ödül Mağazası ({rewards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'claims'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Öğrenci Talepleri ({claims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'shipping'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Fiziksel Kargo & Teslimat ({physicalOrders.length})</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded-full font-bold">
            KVKK
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ÖDÜL MAĞAZASI KATALOĞU */}
      {/* ========================================================================= */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <Card key={reward.id} className="relative group overflow-hidden border border-slate-200">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:scale-105 transition-transform duration-200">
                  {getRewardIcon(reward.icon)}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setRewardToEdit(reward);
                      setShowModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReward(reward.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                  {reward.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {reward.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{reward.cost_xp} XP</span>
                </div>
                <div className="text-slate-500 font-medium">Stok: {reward.stock} adet</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ÖĞRENCİ TALEPLERİ */}
      {/* ========================================================================= */}
      {activeTab === 'claims' && (
        <Card className="overflow-hidden p-0 border border-slate-200 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-6 py-4">Öğrenci</th>
                  <th className="px-6 py-4">İstenen Ödül</th>
                  <th className="px-6 py-4 text-center">XP Bedeli</th>
                  <th className="px-6 py-4">Talep Tarihi</th>
                  <th className="px-6 py-4 text-center">Durum</th>
                  <th className="px-6 py-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => {
                  const student = students.find((s) => s.id === claim.student_id);
                  const reward = rewards.find((r) => r.id === claim.reward_id);

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {student?.name || claim.student_name || 'Bilinmeyen Öğrenci'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {reward?.title || claim.reward?.title || 'Ödül Bulunamadı'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                          {claim.cost_xp || reward?.cost_xp || 0} XP
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDateTurkish(claim.requested_at || claim.created_at || '')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            claim.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : claim.status === 'delivered'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : claim.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {claim.status === 'approved'
                            ? 'Onaylandı'
                            : claim.status === 'delivered'
                            ? 'Teslim Edildi'
                            : claim.status === 'rejected'
                            ? 'Reddedildi'
                            : 'Onay Bekliyor'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {claim.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                                className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Onayla</span>
                              </button>
                              <button
                                onClick={() => handleUpdateClaimStatus(claim.id, 'rejected')}
                                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reddet</span>
                              </button>
                            </>
                          )}
                          {claim.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateClaimStatus(claim.id, 'delivered')}
                              className="px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Teslim Edildi</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClaim(claim.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Talebi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FİZİKSEL KARGO & TESLİMAT YÖNETİMİ (KVKK Korumalı) */}
      {/* ========================================================================= */}
      {activeTab === 'shipping' && (
        <div className="space-y-4">
          {/* KVKK Banner */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                KVKK & RLS Özel Koruma Alanı
              </h4>
              <p className="text-xs text-emerald-800/80 mt-0.5 leading-relaxed">
                Bu alanda yer alan adres ve telefon verileri, öğrencilerin/velilerin 6698 sayılı KVKK kapsamında verdiği açık rızaya istinaden <strong>yalnızca Serkan Koçak (2b1feeed-890a-430a-8360-dd103034649b)</strong> yetkisindeki koç paneline açıktır.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden p-0 border border-slate-200 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Öğrenci / Alıcı</th>
                    <th className="px-5 py-3.5">Ödül Başlığı</th>
                    <th className="px-5 py-3.5">İletişim & Adres</th>
                    <th className="px-5 py-3.5">Kargo Takip</th>
                    <th className="px-5 py-3.5 text-center">Kargo Durumu</th>
                    <th className="px-5 py-3.5 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {physicalOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                        Henüz fiziksel kargo veya kitap teslimat talebi bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    physicalOrders.map((order) => {
                      const isEditing = editingOrderId === order.id;

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{order.recipient_full_name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{order.recipient_phone}</span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {order.reward_title}
                          </td>

                          <td className="px-5 py-3.5 max-w-xs">
                            <div className="flex items-start gap-1 text-[11px] text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">{order.district} / {order.city}</span>
                                <div className="text-slate-500 line-clamp-2">{order.delivery_address}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={carrierInput}
                                  onChange={(e) => setCarrierInput(e.target.value)}
                                  placeholder="Kargo Şirketi"
                                  className="w-full px-2 py-1 text-xs border rounded bg-white"
                                />
                                <input
                                  type="text"
                                  value={trackingInput}
                                  onChange={(e) => setTrackingInput(e.target.value)}
                                  placeholder="Takip No"
                                  className="w-full px-2 py-1 text-xs border rounded bg-white"
                                />
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {order.cargo_carrier || 'Yurtiçi Kargo'}
                                </span>
                                <div className="text-[11px] font-mono text-slate-500">
                                  {order.cargo_tracking_number || 'Takip No Girilmedi'}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.shipping_status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : order.shipping_status === 'shipped'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {order.shipping_status === 'delivered'
                                ? 'Teslim Edildi'
                                : order.shipping_status === 'shipped'
                                ? 'Kargoya Verildi'
                                : 'Hazırlanıyor'}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() =>
                                    handleUpdateShippingStatus(
                                      order.id,
                                      'shipped',
                                      carrierInput,
                                      trackingInput
                                    )
                                  }
                                  className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Kaydet</span>
                                </button>
                                <button
                                  onClick={() => setEditingOrderId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingOrderId(order.id);
                                    setCarrierInput(order.cargo_carrier || 'Yurtiçi Kargo');
                                    setTrackingInput(order.cargo_tracking_number || '');
                                  }}
                                  className="px-2 py-1 text-xs border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  title="Kargo Takip No Düzenle"
                                >
                                  Kargo Gir
                                </button>
                                {order.shipping_status !== 'delivered' && (
                                  <button
                                    onClick={() => handleUpdateShippingStatus(order.id, 'delivered')}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    title="Teslim Edildi İşaretle"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Add / Edit Reward Modal */}
      <AddRewardModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setRewardToEdit(null);
        }}
        coachId={user?.id || (user as any)?.user_id || ''}
        rewardToEdit={rewardToEdit}
        onAddReward={async (newReward) => {
          await db.addReward(newReward);
          setShowModal(false);
          await loadData();
        }}
        onUpdateReward={async (rewardId, updates) => {
          await db.updateReward(rewardId, updates);
          setShowModal(false);
          setRewardToEdit(null);
          await loadData();
        }}
      />
    </div>
  );
};
