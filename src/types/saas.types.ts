import { UserRole } from './index';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';
export type DiscountType = 'percentage' | 'fixed' | 'free';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type FeatureKey =
  | 'parent_access'
  | 'pdf_reports'
  | 'advanced_reports'
  | 'ai_student_analysis'
  | 'ai_study_planner'
  | 'coach_portfolio'
  | 'task_assignment'
  | 'private_lesson'
  | 'sponsored_class'
  | 'messages'
  | 'sms'
  | 'ai_monthly_limit';

export interface FeatureAccessResult {
  hasAccess: boolean;
  featureKey: FeatureKey;
  requiredPlan: 'Free' | 'Starter' | 'Pro' | 'Premium' | 'Kurumsal';
  currentPlanName?: string;
  reason?: string;
  limit?: number;
  currentUsage?: number;
  remaining?: number;
}

export interface UserPlanFeatures {
  planSlug: string;
  planName: string;
  parent_access: boolean;
  pdf_reports: boolean;
  advanced_reports: boolean;
  ai_student_analysis: boolean;
  ai_study_planner: boolean;
  coach_portfolio: boolean;
  task_assignment: boolean;
  private_lesson: boolean;
  sponsored_class: boolean;
  messages: boolean;
  sms: boolean;
  ai_monthly_limit: number;
  student_limit: number;
  private_lessons_per_month: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  student_limit: number;
  ai_monthly_limit: number;
  parent_access: boolean;
  advanced_reports: boolean;
  pdf_reports: boolean;
  priority_support: boolean;
  private_lessons_per_month?: number; // 0, 1 or 2 per month
  private_lesson_minutes?: number; // 60 min
  features: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminDiscount {
  id: string;
  code: string;
  title: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  user_id?: string;
  plan_id?: string;
  max_redemptions?: number | null;
  redemption_count: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  discount_id?: string | null;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  trial_ends_at?: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
  user_name?: string;
  user_email?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string | null;
  plan_id?: string | null;
  discount_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_payment_id?: string;
  provider_invoice_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  plan_name?: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string | null;
  actor_role?: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  actor_name?: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  target_roles?: UserRole[];
  rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  feature_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  status: 'success' | 'failed' | 'rate_limited';
  created_at: string;
  user_name?: string;
}

export interface SponsoredClass {
  id: string;
  name: string;
  teacher_name: string;
  teacher_id?: string;
  plan_tier: 'standard' | 'pro';
  quota: number;
  student_ids: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentEntitlement {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  access_tier: 'standard' | 'pro';
  granted_by: string;
  reason: string;
  valid_until: string;
  is_active: boolean;
  included_private_lessons?: number; // e.g. 1 (Pro) or 2 (Premium) per month
  used_private_lessons?: number;
  remaining_private_lessons?: number;
  billing_period?: string;
  created_at: string;
}

export interface PriceCalculationResult {
  base_price: number;
  discount_amount: number;
  final_price: number;
  discount_id?: string | null;
  discount_title?: string | null;
  error_message?: string | null;
}

export interface AdminCommercialMetrics {
  totalUsers: number;
  activeStudents: number;
  activeCoaches: number;
  activeParents: number;
  sponsoredStudents: number;
  paidStudents: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  totalRevenue: number;
  estimatedInfrastructureCost: number;
  conversionRate: number;
  recentPayments: Payment[];
  recentAuditLogs: AuditLog[];
  sponsoredClassesCount: number;
}

