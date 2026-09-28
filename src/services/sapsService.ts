import { supabase } from '../lib/supabase';
import {
  SAPSLeaderboardEntry,
  SAPSAccessPerk,
  SAPSPowerNudge,
  PhysicalRewardOrder,
  SAPSTier,
  ShippingStatus,
} from '../types/saps.types';

export const DEFAULT_ACCESS_PERKS: SAPSAccessPerk[] = [
  {
    id: 'perk-1',
    slug: 'vip_study_hall',
    title: 'VIP Odaklanma Odası',
    description: 'Özel lofi/klasik fon müzikleri, dikkat dağıtmayan minimalist Pomodoro salonu ve kesintisiz etüt modu.',
    category: 'study_room',
    min_total_xp: 500,
    min_streak: 3,
    required_saps_tier: 'Bronze',
    icon_name: 'Sparkles',
    is_active: true,
  },
  {
    id: 'perk-2',
    slug: 'archive_question_bank',
    title: 'Geçmiş Sınavlar Soru Arşivi',
    description: 'Son 10 yılın çıkmış YKS / LGS soru ve detaylı video çözüm havuzuna limitsiz erişim.',
    category: 'question_bank',
    min_total_xp: 1200,
    min_streak: 5,
    required_saps_tier: 'Silver',
    icon_name: 'BookOpen',
    is_active: true,
  },
  {
    id: 'perk-3',
    slug: 'ai_deep_exam_diagnostics',
    title: 'Derin Yapay Zekâ Analizörü',
    description: 'Denemelerde yanlış yapılan soruların kök nedenlerini tespit eden ve kişiselleştirilmiş reçete çıkaran modül.',
    category: 'advanced_analytics',
    min_total_xp: 2500,
    min_streak: 7,
    required_saps_tier: 'Gold',
    icon_name: 'Cpu',
    is_active: true,
  },
  {
    id: 'perk-4',
    slug: 'coach_monthly_roundtable',
    title: 'Serkan Koçak ile VIP Yuvarlak Masa',
    description: 'Her ay en yüksek disiplin sağlayan öğrencilerle canlı birebir strateji ve motivasyon oturumu.',
    category: 'coach_vip',
    min_total_xp: 5000,
    min_streak: 14,
    required_saps_tier: 'Platinum',
    icon_name: 'Crown',
    is_active: true,
  },
];

export const sapsService = {
  async getLeaderboard(examType?: 'YKS' | 'LGS', currentStudentId?: string): Promise<SAPSLeaderboardEntry[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase.rpc('get_saps_leaderboard', {
          p_exam_type: examType || null,
          p_limit: 50,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => ({
            rank: Number(item.rank),
            student_id: item.student_id,
            display_name: item.name || item.display_name,
            avatar_url: item.avatar_url,
            target_exam: item.target_exam,
            field: item.field || 'SAY',
            total_xp: Number(item.total_xp || 0),
            spendable_xp: Number(item.spendable_xp || 0),
            streak: Number(item.streak || 0),
            level: Number(item.level || 1),
            saps_tier: (item.saps_tier || 'Bronze') as SAPSTier,
            saps_power_role: item.saps_power_role || 'Member',
            is_self: item.is_self || item.student_id === currentStudentId,
          }));
        }

        let query = supabase.from('students').select('*');
        if (examType) {
          query = query.eq('target_exam', examType);
        }
        const { data: students, error: sErr } = await query;
        if (!sErr && students) {
          const sorted = [...students].sort(
            (a, b) => (b.total_xp || b.xp || 0) - (a.total_xp || a.xp || 0)
          );

          return sorted.map((s, idx) => {
            const isSelf = s.id === currentStudentId;
            const totalXp = Number(s.total_xp || s.xp || 0);
            const tier: SAPSTier =
              totalXp >= 5000
                ? 'Platinum'
                : totalXp >= 2500
                ? 'Gold'
                : totalXp >= 1000
                ? 'Silver'
                : 'Bronze';

            return {
              rank: idx + 1,
              student_id: s.id,
              display_name: s.name,
              avatar_url: s.avatar_url,
              target_exam: (s.target_exam || 'YKS') as 'YKS' | 'LGS',
              field: s.field || 'SAY',
              total_xp: totalXp,
              spendable_xp: Number(s.spendable_xp || s.xp || 0),
              streak: Number(s.streak || 0),
              level: Number(s.level || 1),
              saps_tier: (s.saps_tier || tier) as SAPSTier,
              saps_power_role: s.saps_power_role || 'Member',
              is_self: isSelf,
            };
          });
        }
      }
    } catch (err) {
      console.warn('SAPS Leaderboard fetch fallback:', err);
    }
    return [];
  },

  async updateKVKKSettings(
    studentId: string,
    settings: {
      kvkk_gamification_consent: boolean;
      is_anonymous_leaderboard: boolean;
      leaderboard_nickname?: string | null;
    }
  ): Promise<boolean> {
    try {
      if (supabase) {
        const payload: any = {
          kvkk_gamification_consent: settings.kvkk_gamification_consent,
          is_anonymous_leaderboard: settings.is_anonymous_leaderboard,
          leaderboard_nickname: settings.leaderboard_nickname || null,
          updated_at: new Date().toISOString(),
        };
        if (settings.kvkk_gamification_consent) {
          payload.kvkk_consent_date = new Date().toISOString();
        }

        const { error } = await supabase.from('students').update(payload).eq('id', studentId);
        return !error;
      }
    } catch (err) {
      console.error('Error updating KVKK settings:', err);
    }
    return true;
  },

  async getAccessPerks(studentTotalXp: number, studentStreak: number): Promise<SAPSAccessPerk[]> {
    let perks = DEFAULT_ACCESS_PERKS;
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('saps_access_perks')
          .select('*')
          .eq('is_active', true);
        if (!error && data && data.length > 0) {
          perks = data as SAPSAccessPerk[];
        }
      }
    } catch {}

    return perks.map((p) => {
      const isUnlocked = studentTotalXp >= p.min_total_xp && studentStreak >= p.min_streak;
      const xpProgress = Math.min(100, Math.round((studentTotalXp / p.min_total_xp) * 100));
      return {
        ...p,
        is_unlocked: isUnlocked,
        progress_pct: xpProgress,
      };
    });
  },

  async sendPowerNudge(
    senderStudentId: string,
    senderName: string,
    receiverStudentId: string,
    nudgeType: SAPSPowerNudge['nudge_type'],
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (supabase) {
        const { error } = await supabase.from('saps_power_nudges').insert({
          sender_student_id: senderStudentId,
          receiver_student_id: receiverStudentId,
          sender_display_name: senderName,
          nudge_type: nudgeType,
          message: message || 'Harika gidiyorsun, çalışmaya devam!',
          xp_gift: 10,
          is_read: false,
        });

        if (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getReceivedNudges(studentId: string): Promise<SAPSPowerNudge[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('saps_power_nudges')
          .select('*')
          .eq('receiver_student_id', studentId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as SAPSPowerNudge[];
        }
      }
    } catch {}
    return [];
  },

  async submitPhysicalOrder(order: Omit<PhysicalRewardOrder, 'id' | 'created_at' | 'shipping_status'>): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      if (!order.kvkk_address_consent) {
        return { success: false, error: 'Kişisel Verilerin Korunması (KVKK) teslimat açık rızası zorunludur.' };
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('physical_reward_orders')
          .insert({
            ...order,
            shipping_status: 'pending',
          })
          .select('id')
          .single();

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true, orderId: data?.id };
      }
      return { success: true, orderId: 'ord_' + Date.now() };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getCoachPhysicalOrders(coachId: string = '2b1feeed-890a-430a-8360-dd103034649b'): Promise<PhysicalRewardOrder[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('physical_reward_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as PhysicalRewardOrder[];
        }
      }
    } catch {}
    return [];
  },

  async updateShippingStatus(
    orderId: string,
    status: ShippingStatus,
    carrier?: string,
    trackingNumber?: string
  ): Promise<boolean> {
    try {
      if (supabase) {
        const payload: any = {
          shipping_status: status,
          updated_at: new Date().toISOString(),
        };
        if (carrier) payload.cargo_carrier = carrier;
        if (trackingNumber) payload.cargo_tracking_number = trackingNumber;
        if (status === 'shipped') payload.shipped_at = new Date().toISOString();
        if (status === 'delivered') payload.delivered_at = new Date().toISOString();

        const { error } = await supabase
          .from('physical_reward_orders')
          .update(payload)
          .eq('id', orderId);

        return !error;
      }
    } catch (err) {
      console.error('Error updating shipping status:', err);
    }
    return true;
  },
};