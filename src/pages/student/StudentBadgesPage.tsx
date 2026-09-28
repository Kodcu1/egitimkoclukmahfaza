import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { Badge as BadgeType, StudentBadge, Student, XpTransaction } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { BadgeCard } from '../../components/dashboard/BadgeCard';
import { XPCard } from '../../components/dashboard/XPCard';
import { ALL_BADGES } from '../../data/badges';
import { LEVEL_TIERS } from '../../utils/calculations';
import { Trophy, Award, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { formatDateTurkish } from '../../utils/formatters';

export const StudentBadgesPage: React.FC = () => {
  const { user, studentData } = useAuth();
  const [student, setStudent] = useState<Student | null>(studentData);
  const [earnedBadges, setEarnedBadges] = useState<StudentBadge[]>([]);
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'badges' | 'levels' | 'history'>('badges');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      let stu = studentData;
      if (!stu && user) {
        stu = await db.getStudentById(user.user_id || user.id);
        if (!stu) {
          const list = await db.getStudents();
          stu = list.find((s) => s.user_id === (user.user_id || user.id) || (s.email && s.email.toLowerCase() === user.email.toLowerCase())) || null;
        }
      }
      setStudent(stu);

      if (stu) {
        const [bList, txList] = await Promise.all([
          db.getStudentBadges(stu.id),
          db.getXpTransactions(stu.id),
        ]);
        setEarnedBadges(bList);
        setTransactions(txList);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentData]);

  if (!student) {
    return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>Başarı Rozetlerim & Seviye Ağacı</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            YKS 2027 maratonundaki başarıların, kazandığın rozetler ve deneyim puanı hareketlerin
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Rozetler ({earnedBadges.length}/{ALL_BADGES.length})
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'levels'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Seviye Kademeleri
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            XP Geçmişi
          </button>
        </div>
      </div>

      {/* Main XP Card Overview */}
      <XPCard xp={student.xp} recentTransactions={transactions} showTransactions={false} />

      {/* Tab 1: Badges Grid */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_BADGES.map((b) => {
            const earned = earnedBadges.find((eb) => eb.badge_id === b.id);
            return (
              <BadgeCard
                key={b.id}
                badge={b}
                studentBadge={earned}
              />
            );
          })}
        </div>
      )}

      {/* Tab 2: Levels Hierarchy */}
      {activeTab === 'levels' && (
        <div className="space-y-3">
          <Card className="p-5 bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> YKS 2027 Seviye Kademeleri ve Ünvanlar
            </h3>
            <div className="divide-y divide-slate-100">
              {LEVEL_TIERS.map((tier) => {
                const isCurrent = student.level === tier.level;
                const isPassed = student.level > tier.level;

                return (
                  <div
                    key={tier.level}
                    className={`py-3.5 px-3 flex items-center justify-between rounded-2xl transition-colors ${
                      isCurrent
                        ? 'bg-amber-50/80 border border-amber-300 shadow-xs'
                        : isPassed
                        ? 'text-slate-600'
                        : 'opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {tier.level}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{tier.title}</h4>
                        <p className="text-xs text-slate-500">
                          {tier.minXp} XP - {tier.maxXp === Infinity ? 'Ve Üzeri' : `${tier.maxXp} XP`}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isCurrent && (
                        <Badge variant="amber" size="md">
                          Mevcut Seviyen
                        </Badge>
                      )}
                      {isPassed && (
                        <Badge variant="success" size="sm">
                          Tamamlandı
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: XP Transaction Audit Logs */}
      {activeTab === 'history' && (
        <Card className="p-0 overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Tarih</th>
                  <th className="px-5 py-3.5">Açıklama / Sebep</th>
                  <th className="px-5 py-3.5 text-right">Kazanılan / Harcanan XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-600 font-semibold">
                      {formatDateTurkish(tx.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{tx.reason}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      <span className={tx.amount >= 0 ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200' : 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200'}>
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} XP
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              Henüz bir XP hareketi bulunmuyor.
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
