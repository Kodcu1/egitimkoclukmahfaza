import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { Reward, RewardClaim, Student } from '../../types';
import {
  SAPSLeaderboardEntry,
  SAPSAccessPerk,
  SAPSPowerNudge,
  PhysicalRewardOrder,
  SAPSTier,
} from '../../types/saps.types';
import { sapsService } from '../../services/sapsService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatDateTurkish } from '../../utils/formatters';
import { PhysicalRewardOrderModal } from '../../components/modals/PhysicalRewardOrderModal';
import { SendPeerNudgeModal } from '../../components/modals/SendPeerNudgeModal';
import { KVKKAydinlatmaModal } from '../../components/modals/KVKKAydinlatmaModal';
import { useToast } from '../../context/ToastContext';
import {
  Gift,
  Sparkles,
  Coffee,
  BookMarked,
  Film,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Flame,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Crown,
  KeyRound,
  HeartHandshake,
  Package,
  Truck,
  Eye,
  EyeOff,
  UserCheck,
  Cpu,
  Lock,
  ExternalLink,
  ChevronRight,
  Send,
  AlertCircle,
} from 'lucide-react';

export const StudentRewardsPage: React.FC = () => {
  const { user, studentData, refreshStudentData } = useAuth();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(studentData);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  
  // SAPS State
  const [activeTab, setActiveTab] = useState<'status' | 'access' | 'power' | 'stuff' | 'claims'>('status');
  const [leaderboard, setLeaderboard] = useState<SAPSLeaderboardEntry[]>([]);
  const [examFilter, setExamFilter] = useState<'ALL' | 'YKS' | 'LGS'>('ALL');
  const [accessPerks, setAccessPerks] = useState<SAPSAccessPerk[]>([]);
  const [receivedNudges, setReceivedNudges] = useState<SAPSPowerNudge[]>([]);
  const [physicalOrders, setPhysicalOrders] = useState<PhysicalRewardOrder[]>([]);
  
  // Modals & Action State
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedRewardForOrder, setSelectedRewardForOrder] = useState<Reward | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [nudgeTargetStudent, setNudgeTargetStudent] = useState<{ id: string; name: string } | null>(null);

  // KVKK Settings State
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);

  const loadData = async () => {
    let stu = studentData;
    if (!stu && user) {
      stu = await db.getStudentById(user.user_id || user.id);
      if (!stu) {
        const list = await db.getStudents();
        stu = list.find((s) => s.user_id === (user.user_id || user.id) || (s.email && s.email.toLowerCase() === user.email.toLowerCase())) || null;
      }
    }
    setStudent(stu);

    const currentUserId = user?.user_id || user?.id || stu?.id;

    if (stu) {
      setKvkkConsent(stu.kvkk_gamification_consent ?? false);
      setIsAnonymous(stu.is_anonymous_leaderboard ?? false);
      setNickname(stu.leaderboard_nickname || '');

      const currentTotalXp = stu.total_xp !== undefined ? stu.total_xp : stu.xp;
      const currentStreak = stu.streak || 0;

      const [rList, cList, lb, perks, nudges] = await Promise.all([
        db.getRewards(),
        db.getClaimsByStudent(stu.id),
        sapsService.getLeaderboard(examFilter === 'ALL' ? undefined : examFilter, currentUserId),
        sapsService.getAccessPerks(currentTotalXp, currentStreak),
        sapsService.getReceivedNudges(stu.id),
      ]);

      setRewards(rList);
      setClaims(cList);
      setLeaderboard(lb);
      setAccessPerks(perks);
      setReceivedNudges(nudges);
    } else if (user) {
      // Eğer bakan bir Koç ise (studentData yok ama user var)
      const currentTotalXp = 0;
      const currentStreak = 0;

      const [rList, lb, perks] = await Promise.all([
        db.getRewards(),
        sapsService.getLeaderboard(examFilter === 'ALL' ? undefined : examFilter, currentUserId),
        sapsService.getAccessPerks(currentTotalXp, currentStreak),
      ]);

      setRewards(rList);
      setLeaderboard(lb);
      setAccessPerks(perks);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentData, examFilter, user]);

  const handleSavePrivacy = async () => {
    if (!student) return;
    setIsUpdatingPrivacy(true);
    try {
      const ok = await sapsService.updateKVKKSettings(student.id, {
        kvkk_gamification_consent: kvkkConsent,
        is_anonymous_leaderboard: isAnonymous,
        leaderboard_nickname: nickname.trim() || null,
      });

      if (ok) {
        toast.success(
          kvkkConsent
            ? 'Liderlik tablosu ve motivasyon tercihleriniz kaydedildi.'
            : 'Açık rızanız kaldırıldığı için sıralamalarda adınız tamamen anonimleştirildi.'
        );
        await refreshStudentData();
        const currentUserId = user?.user_id || user?.id || student.id;
        const updatedLb = await sapsService.getLeaderboard(examFilter === 'ALL' ? undefined : examFilter, currentUserId);
        setLeaderboard(updatedLb);
      }
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!student) return;

    const spendable = student.spendable_xp !== undefined ? student.spendable_xp : student.xp;
    if (spendable < reward.cost_xp) {
      toast.error(`Bu ödül için ${reward.cost_xp} XP gerekiyor. Güncel bakiyen: ${spendable} XP.`);
      return;
    }

    const isPhysical = /kitap|deneme|kargo|fiziksel|hediye kutusu/i.test(reward.title) || /kitap|deneme/i.test(reward.description);

    try {
      setClaimingId(reward.id);
      await db.claimReward(student.id, reward.id, reward.cost_xp);

      toast.success(`"${reward.title}" talebiniz Serkan Koçak'a iletildi.`);

      if (isPhysical) {
        setSelectedRewardForOrder(reward);
        setShowOrderModal(true);
      }

      await loadData();
      await refreshStudentData();
    } catch (err: any) {
      toast.error(err.message || 'Ödül talep edilirken bir sorun oluştu.');
    } finally {
      setClaimingId(null);
    }
  };

  const getTierColor = (tier: SAPSTier) => {
    switch (tier) {
      case 'Diamond':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
      case 'Platinum':
        return 'text-purple-300 bg-purple-950/60 border-purple-500/40';
      case 'Gold':
        return 'text-amber-300 bg-amber-950/60 border-amber-500/40';
      case 'Silver':
        return 'text-slate-300 bg-slate-800 border-slate-600';
      default:
        return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const getRewardTheme = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return {
          icon: <Coffee className="w-5 h-5 text-amber-700" />,
          bg: 'bg-amber-100/90 border-amber-200 text-amber-800',
          gradient: 'from-white via-white to-amber-50/60 hover:border-amber-300',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'BookMarked':
        return {
          icon: <BookMarked className="w-5 h-5 text-indigo-700" />,
          bg: 'bg-indigo-100/90 border-indigo-200 text-indigo-800',
          gradient: 'from-white via-white to-indigo-50/60 hover:border-indigo-300',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
      case 'Film':
        return {
          icon: <Film className="w-5 h-5 text-rose-700" />,
          bg: 'bg-rose-100/90 border-rose-200 text-rose-800',
          gradient: 'from-white via-white to-rose-50/60 hover:border-rose-300',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'Sparkles':
        return {
          icon: <Sparkles className="w-5 h-5 text-emerald-700" />,
          bg: 'bg-emerald-100/90 border-emerald-200 text-emerald-800',
          gradient: 'from-white via-white to-emerald-50/60 hover:border-emerald-300',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'BookOpen':
        return {
          icon: <BookOpen className="w-5 h-5 text-blue-700" />,
          bg: 'bg-blue-100/90 border-blue-200 text-blue-800',
          gradient: 'from-white via-white to-blue-50/60 hover:border-blue-300',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'GraduationCap':
        return {
          icon: <GraduationCap className="w-5 h-5 text-purple-700" />,
          bg: 'bg-purple-100/90 border-purple-200 text-purple-800',
          gradient: 'from-white via-white to-purple-50/60 hover:border-purple-300',
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      default:
        return {
          icon: <Gift className="w-5 h-5 text-amber-700" />,
          bg: 'bg-amber-100/90 border-amber-200 text-amber-800',
          gradient: 'from-white via-white to-amber-50/60 hover:border-amber-300',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
        };
    }
  };

  const spendableXp = student ? (student.spendable_xp !== undefined ? student.spendable_xp : student.xp) : 0;
  const totalXp = student ? (student.total_xp !== undefined ? student.total_xp : student.xp) : 0;
  const sapsTier: SAPSTier =
    totalXp >= 5000 ? 'Platinum' : totalXp >= 2500 ? 'Gold' : totalXp >= 1000 ? 'Silver' : 'Bronze';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* 1. Header & SAPS Golden Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-xs shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Trophy className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              SAPS Oyunlaştırma & Motivasyon Merkezi
            </h2>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getTierColor(sapsTier)}`}>
              {sapsTier} Tier
            </span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl">
            Gabe Zichermann SAPS modeli: Statü (Status), VIP Ayrıcalıklar (Access), Arkadaş Gücü (Power) ve Fiziksel Ödüller (Stuff) — KVKK ilkeleriyle tam uyumlu.
          </p>
        </div>

        {/* Dual XP Balances */}
        <div className="flex items-center gap-3 shrink-0 z-10">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-slate-900/90 border border-amber-500/40 flex items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-amber-300 block tracking-wider">
                Harcanabilir Puan
              </span>
              <span className="text-xl font-black font-mono text-amber-400">
                {spendableXp} <span className="text-xs font-sans text-amber-200">XP</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-700/40 flex items-center gap-3 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-indigo-300 block tracking-wider">
                Toplam & Seri
              </span>
              <span className="text-sm font-bold text-white">
                {totalXp} XP • {student?.streak || 0} Gün
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'status'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>Status (Statü & Sıralama)</span>
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'access'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4 text-indigo-300" />
          <span>Access (VIP Ayrıcalıklar)</span>
        </button>

        <button
          onClick={() => setActiveTab('power')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'power'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-purple-300" />
          <span>Power (Motivasyon & Güç)</span>
          {receivedNudges.filter((n) => !n.is_read).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('stuff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'stuff'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-300" />
          <span>Stuff (Ödül & Kargo)</span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'claims'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Geçmiş Taleplerim ({claims.length})</span>
        </button>
      </div>

      {/* TAB 1: STATUS */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {student && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">KVKK ve Liderlik Tablosu Gizlilik Ayarı</h3>
                    <p className="text-xs text-slate-500">
                      6698 sayılı KVKK gereği sıralamalarda nasıl görüneceğinizi siz belirlersiniz.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setShowKvkkModal(true)}
                    className="text-xs text-indigo-700 bg-white hover:bg-indigo-50 border-indigo-200"
                  >
                    Aydınlatma Metnini Oku
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isUpdatingPrivacy}
                    onClick={handleSavePrivacy}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-transparent font-bold"
                  >
                    Ayarları Kaydet
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={kvkkConsent}
                    onChange={(e) => setKvkkConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Oyunlaştırma & Sıralama Açık Rızası</span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Puan ve rozetlerimin koçluk ekosisteminde sıralanmasına izin veriyorum.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>Anonim / Gizli İsim Modu</span>
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Gerçek adım yerine maskeli ("Öğrenci #...") veya rumuz ile gösterilsin.
                    </span>
                  </div>
                </label>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Liderlik Rumuzu (Opsiyonel)</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Örn: BilimKaplanı26"
                    maxLength={20}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Exam Filter Buttons */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Canlı Koçluk Sıralaması (Serkan Koçak Grubu)</span>
            </h3>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'YKS', 'LGS'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setExamFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    examFilter === filter ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter === 'ALL' ? 'Tümü' : filter === 'YKS' ? 'YKS Grubu' : 'LGS Grubu'}
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {leaderboard.map((item) => {
                const isTop3 = item.rank <= 3;
                return (
                  <div
                    key={item.student_id}
                    className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                      item.is_self
                        ? 'bg-amber-50/70 border-l-4 border-amber-500'
                        : isTop3
                        ? 'bg-slate-50/50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          item.rank === 1
                            ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-md shadow-amber-500/20'
                            : item.rank === 2
                            ? 'bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 border border-slate-300'
                            : item.rank === 3
                            ? 'bg-gradient-to-tr from-amber-700 to-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.rank === 1 ? <Crown className="w-4 h-4 fill-slate-950" /> : `#${item.rank}`}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {item.display_name}
                          </span>
                          {item.is_self && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded-md">
                              SEN
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTierColor(item.saps_tier)}`}>
                            {item.saps_tier}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {item.target_exam} ({item.field})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span>Seviye {item.level}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-600 font-medium">
                            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {item.streak} Gün Seri
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-base font-black font-mono text-slate-900">
                          {item.total_xp} <span className="text-xs font-sans text-slate-500">XP</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Toplam Kazanım</span>
                      </div>

                      {!item.is_self && student && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNudgeTargetStudent({ id: item.student_id, name: item.display_name });
                            setShowNudgeModal(true);
                          }}
                          className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">Motive Et</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-indigo-950">Gabe Zichermann Access Katmanı</h3>
              <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
                Satın alınamayan, yalnızca yüksek çalışma disiplini, düzenli soru çözümü ve koçluk hedefleriyle açılan özel kütüphane, derin analizör ve VIP oturumlar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {accessPerks.map((perk) => {
              const isUnlocked = perk.is_unlocked;
              return (
                <div
                  key={perk.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    isUnlocked
                      ? 'bg-white border-indigo-200/90 shadow-sm hover:shadow-md'
                      : 'bg-slate-50/70 border-slate-200 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                          isUnlocked
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        {perk.slug === 'vip_study_hall' ? (
                          <Sparkles className="w-5 h-5" />
                        ) : perk.slug === 'archive_question_bank' ? (
                          <BookOpen className="w-5 h-5" />
                        ) : perk.slug === 'ai_deep_exam_diagnostics' ? (
                          <Cpu className="w-5 h-5" />
                        ) : (
                          <Crown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{perk.title}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTierColor(perk.required_saps_tier)}`}>
                          Gerekli Tier: {perk.required_saps_tier}
                        </span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Açık
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Kilitli
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{perk.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Gereksinim:</span>
                      <span className="font-bold text-slate-800">
                        {perk.min_total_xp} Total XP • {perk.min_streak} Gün Seri
                      </span>
                    </div>

                    {!isUnlocked && (
                      <div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${perk.progress_pct || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block text-right font-medium">
                          İlerleme: %{perk.progress_pct || 0}
                        </span>
                      </div>
                    )}

                    {isUnlocked && (
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        onClick={() => {
                          toast.success(`"${perk.title}" modülüne erişim sağlandı.`);
                        }}
                      >
                        <span>Ayrıcalığı Kullan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: POWER */}
      {activeTab === 'power' && student && (
        <div className="space-y-6">
          <div className="bg-purple-50/70 border border-purple-100 p-5 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-purple-950">Gabe Zichermann Power Katmanı</h3>
              <p className="text-xs text-purple-800/80 mt-1 leading-relaxed">
                Yüksek serili öğrenciler koçluk ekosisteminde arkadaşlarını motive edebilir, günlük XP hediyesi ve takdir rozeti gönderebilir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Çalışma Arkadaşlarına Destek Ol</span>
              </h4>
              <p className="text-xs text-slate-500">
                Liderlik tablosundaki arkadaşlarına +10 XP ve moral notu göndererek onların sınav motivasyonunu artır.
              </p>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {leaderboard
                  .filter((l) => !l.is_self)
                  .slice(0, 8)
                  .map((peer) => (
                    <div
                      key={peer.student_id}
                      className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/60 hover:bg-indigo-50/30 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{peer.display_name}</div>
                        <div className="text-[11px] text-slate-500">{peer.target_exam} • {peer.streak} Gün Seri</div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNudgeTargetStudent({ id: peer.student_id, name: peer.display_name });
                          setShowNudgeModal(true);
                        }}
                        className="text-xs text-purple-700 hover:bg-purple-100 border-purple-200 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Motive Et (+10 XP)</span>
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-purple-600" />
                <span>Sana Gelen Motivasyon Mesajları ({receivedNudges.length})</span>
              </h4>

              {receivedNudges.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  Henüz gelen bir motivasyon notu bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {receivedNudges.map((nudge) => (
                    <div
                      key={nudge.id}
                      className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-950">
                          {nudge.sender_display_name || 'Bir Çalışma Arkadaşın'}
                        </span>
                        <span className="text-[10px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                          +10 XP Hediye
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 italic">"{nudge.message}"</p>
                      <span className="text-[10px] text-slate-400 block">
                        {formatDateTurkish(nudge.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STUFF */}
      {activeTab === 'stuff' && student && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Mevcut Ödül Kataloğu</h3>
              <p className="text-xs text-slate-500">
                Harcanabilir XP bakiyenizle dilediğiniz ödülü talep edebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Bakiyeniz:</span>
              <span className="text-sm font-black font-mono text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                {spendableXp} XP
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((r) => {
              const canAfford = spendableXp >= r.cost_xp;
              const theme = getRewardTheme(r.icon);
              const isPhysical = /kitap|deneme|kargo|fiziksel/i.test(r.title) || /kitap|deneme/i.test(r.description);

              return (
                <div
                  key={r.id}
                  className={`group relative rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between bg-gradient-to-b ${
                    theme.gradient
                  } ${
                    canAfford
                      ? 'shadow-sm hover:shadow-xl hover:-translate-y-1'
                      : 'opacity-70 grayscale-[20%]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`p-3 rounded-2xl border ${theme.bg}`}>
                        {theme.icon}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-black font-mono px-3 py-1 rounded-full bg-slate-900 text-amber-400 border border-slate-800 shadow-xs">
                          {r.cost_xp} XP
                        </span>
                        {isPhysical && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            Kargo / Fiziksel
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{r.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Stok: {r.stock} adet</span>

                    <Button
                      size="sm"
                      className={`text-xs font-bold ${
                        canAfford
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      disabled={!canAfford}
                      isLoading={claimingId === r.id}
                      onClick={() => handleClaimReward(r)}
                    >
                      {canAfford ? 'Talep Et' : 'Yetersiz XP'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CLAIMS */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Talep Geçmişi ({claims.length})
            </h3>
          </div>

          {claims.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Henüz bir ödül talep etmediniz.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <div key={claim.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {claim.reward?.title || 'Ödül Talebi'}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {formatDateTurkish(claim.requested_at || claim.created_at || '')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        claim.status === 'approved'
                          ? 'success'
                          : claim.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {claim.status === 'approved'
                        ? 'Onaylandı'
                        : claim.status === 'rejected'
                        ? 'Reddedildi'
                        : 'Onay Bekliyor'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedRewardForOrder && student && (
        <PhysicalRewardOrderModal
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedRewardForOrder(null);
          }}
          rewardTitle={selectedRewardForOrder.title}
          studentId={student.id}
          defaultName={student.name}
          defaultPhone={student.phone || student.phoneNumber}
          onOrderSuccess={() => {
            loadData();
          }}
        />
      )}

      {nudgeTargetStudent && student && (
        <SendPeerNudgeModal
          isOpen={showNudgeModal}
          onClose={() => {
            setShowNudgeModal(false);
            setNudgeTargetStudent(null);
          }}
          senderStudentId={student.id}
          senderName={isAnonymous ? (nickname || `Öğrenci #${student.id.substring(0, 4)}`) : student.name}
          targetStudentId={nudgeTargetStudent.id}
          targetStudentName={nudgeTargetStudent.name}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      <KVKKAydinlatmaModal
        isOpen={showKvkkModal}
        onClose={() => setShowKvkkModal(false)}
        hasConsented={kvkkConsent}
        onAcceptConsent={() => {
          setKvkkConsent(true);
          handleSavePrivacy();
        }}
      />
    </div>
  );
};