// ============================================================================
// MAHFAZA.CO — GABE ZICHERMANN SAPS MODEL (Status, Access, Power, Stuff) & KVKK
// ============================================================================

export type SAPSTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export type SAPSPowerRole = 'Member' | 'StudyLeader' | 'PomodoroCaptain' | 'MentorPeer';

export type SAPSAccessCategory = 
  | 'study_room' 
  | 'question_bank' 
  | 'advanced_analytics' 
  | 'exclusive_webinar' 
  | 'coach_vip';

export type SAPSNudgeType = 
  | 'boost_study' 
  | 'congratulate_exam' 
  | 'streak_applause' 
  | 'study_challenge' 
  | 'kudos';

export type ShippingStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

/**
 * STATUS (Statü): Liderlik tablosu ve sıralama görünümü
 * KVKK koruması: Anonimlik tercihi veya veli/öğrenci açık rızasına göre ad maskelenir.
 */
export interface SAPSLeaderboardEntry {
  rank: number;
  student_id: string;
  display_name: string;
  avatar_url?: string;
  target_exam: 'YKS' | 'LGS';
  field: string;
  total_xp: number;
  spendable_xp: number;
  streak: number;
  level: number;
  saps_tier: SAPSTier;
  saps_power_role: SAPSPowerRole;
  is_self?: boolean;
}

/**
 * ACCESS (Erişim): Belli puan veya seriyi aşan öğrencilere açılan VIP haklar
 */
export interface SAPSAccessPerk {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: SAPSAccessCategory;
  min_total_xp: number;
  min_streak: number;
  required_saps_tier: SAPSTier;
  icon_name?: string;
  badge_required_id?: string;
  resource_url?: string;
  is_active: boolean;
  is_unlocked?: boolean;
  progress_pct?: number;
}

/**
 * POWER (Güç): Öğrencilerin birbirini motive edebileceği yetki ve takdir katmanları
 */
export interface SAPSPowerNudge {
  id: string;
  sender_student_id: string;
  receiver_student_id: string;
  nudge_type: SAPSNudgeType;
  message?: string;
  sender_display_name?: string;
  xp_gift: number;
  is_read: boolean;
  created_at: string;
}

/**
 * STUFF (Eşya/Fiziksel Ödül):
 * Puan karşılığı kazanılan kitap/deneme için KVKK onaylı kargo teslimat formu.
 * Yalnızca öğrenci ve yetkili koç (Serkan Koçak) görebilir.
 */
export interface PhysicalRewardOrder {
  id: string;
  reward_request_id?: string;
  student_id: string;
  coach_id: string;
  reward_title: string;
  recipient_full_name: string;
  recipient_phone: string;
  delivery_address: string;
  city: string;
  district: string;
  postal_code?: string;
  cargo_tracking_number?: string;
  cargo_carrier?: string;
  shipping_status: ShippingStatus;
  kvkk_address_consent: boolean;
  kvkk_consent_ip?: string;
  coach_internal_notes?: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

/**
 * KVKK ve Öğrenci Gizlilik Ayarları
 */
export interface StudentKVKKSettings {
  kvkk_gamification_consent: boolean;
  kvkk_consent_date?: string | null;
  is_anonymous_leaderboard: boolean;
  leaderboard_nickname?: string | null;
  saps_tier: SAPSTier;
  saps_power_role: SAPSPowerRole;
}
