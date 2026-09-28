import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { SubscriptionPlan, PriceCalculationResult } from '../../types/saas.types';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import { UserRole, TargetExamGroup } from '../../types';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  Phone,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Tag,
  Gift,
  CreditCard,
  Check,
  HelpCircle,
  Award,
  GraduationCap,
  Users,
  Building2,
  Eye,
  EyeOff,
  Flame,
  Star,
  Zap,
  School,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  BookOpen,
  Target,
  FileCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'mahfaza_onboarding_draft_v2';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Stepper State (1: Rol, 2: Paket, 3: Bilgiler, 4: Kupon & Özet, 5: Tamamlandı)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // URL Query Parameters
  const queryRole = searchParams.get('role') as UserRole | null;
  const queryPlan = searchParams.get('plan');
  const queryBilling = searchParams.get('billing');
  const queryCode = searchParams.get('code');

  // Step 1: Role
  const [role, setRole] = useState<UserRole>(() => {
    if (queryRole === 'coach' || queryRole === 'parent' || queryRole === 'org_admin') {
      return queryRole;
    }
    return 'student';
  });

  // Step 2: Plans & Billing Cycle
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    queryBilling === 'monthly' ? 'monthly' : 'yearly'
  );

  // Step 3: Account & Profile Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Role-Specific Profile Details
  const [targetExam, setTargetExam] = useState<TargetExamGroup>('YKS');
  const [grade, setGrade] = useState('12. Sınıf');
  const [field, setField] = useState('SAY');
  const [targetUniversity, setTargetUniversity] = useState('Boğaziçi Üniversitesi');
  const [targetDepartment, setTargetDepartment] = useState('Bilgisayar Mühendisliği');
  const [targetScore, setTargetScore] = useState<number>(480);
  const [targetRank, setTargetRank] = useState<number>(2500);

  const [coachBranch, setCoachBranch] = useState('YKS Rehberlik & Derece Koçluğu');
  const [institutionKey, setInstitutionKey] = useState('mahfaza');

  const [parentMatchCode, setParentMatchCode] = useState('');

  const [orgName, setOrgName] = useState('');
  const [orgTitle, setOrgTitle] = useState('Kurum Müdürü');
  const [orgCapacity, setOrgCapacity] = useState('250+ Öğrenci');

  // Legal Agreements
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [kvkkAccepted, setKvkkAccepted] = useState(true);

  // Step 4: Discount & Coupon
  const [discountCode, setDiscountCode] = useState<string>(queryCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{ text: string; isSuccess: boolean } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Price Calculation Result
  const [priceCalc, setPriceCalc] = useState<PriceCalculationResult | null>(null);

  // Payment mock state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Execution States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdProfileName, setCreatedProfileName] = useState<string>('');

  // 1. Initialize Plans & Restore Draft
  useEffect(() => {
    const initPlans = async () => {
      const allPlans = await db.getSubscriptionPlans();
      const active = allPlans.filter((p) => p.is_active);
      setPlans(active);

      // Load draft from session storage if exists
      try {
        const savedDraft = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.role && !queryRole) setRole(parsed.role);
          if (parsed.targetExam) setTargetExam(parsed.targetExam);
          if (parsed.selectedPlanId && !queryPlan) setSelectedPlanId(parsed.selectedPlanId);
          if (parsed.billingCycle && !queryBilling) setBillingCycle(parsed.billingCycle);
          if (parsed.name) setName(parsed.name);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.grade) setGrade(parsed.grade);
          if (parsed.field) setField(parsed.field);
          if (parsed.targetUniversity) setTargetUniversity(parsed.targetUniversity);
          if (parsed.targetDepartment) setTargetDepartment(parsed.targetDepartment);
          if (parsed.coachBranch) setCoachBranch(parsed.coachBranch);
          if (parsed.parentMatchCode) setParentMatchCode(parsed.parentMatchCode);
          if (parsed.orgName) setOrgName(parsed.orgName);
          if (parsed.appliedCoupon) {
            setAppliedCoupon(parsed.appliedCoupon);
            setDiscountCode(parsed.appliedCoupon);
          }
        }
      } catch (e) {
        console.warn('Draft load error:', e);
      }

      // Preselect plan from URL query if provided
      if (queryPlan) {
        const queryLower = queryPlan.toLowerCase();
        const normalized = queryLower.replace(/^(student_|coach_|plan_)/, '');
        const found = active.find((p) => {
          const slug = p.slug.toLowerCase();
          const id = p.id.toLowerCase();
          return (
            slug === queryLower ||
            id === queryLower ||
            slug === normalized ||
            id === `plan_${normalized}` ||
            (normalized === 'standard' && slug === 'starter') ||
            (normalized === 'personal' && slug === 'pro') ||
            (normalized === 'trial' && slug === 'free')
          );
        });

        if (found) {
          setSelectedPlanId(found.id);
          // If query plan is specified, jump directly to step 2 or 3
          setCurrentStep(2);
        }
      } else if (!selectedPlanId) {
        const defaultPlan = active.find((p) => p.is_featured) || active[0];
        if (defaultPlan) setSelectedPlanId(defaultPlan.id);
      }

      if (queryCode) {
        setDiscountCode(queryCode.trim().toUpperCase());
      }
    };

    initPlans();
  }, [queryPlan, queryRole, queryCode, queryBilling]);

  // 2. Persist safe draft changes into sessionStorage
  useEffect(() => {
    try {
      const draft = {
        role,
        targetExam,
        selectedPlanId,
        billingCycle,
        name,
        email,
        phone,
        grade,
        field,
        targetUniversity,
        targetDepartment,
        coachBranch,
        parentMatchCode,
        orgName,
        appliedCoupon,
      };
      sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      // Ignore write errors
    }
  }, [
    role,
    selectedPlanId,
    billingCycle,
    name,
    email,
    phone,
    grade,
    field,
    targetUniversity,
    targetDepartment,
    coachBranch,
    parentMatchCode,
    orgName,
    appliedCoupon,
  ]);

  // 3. Recalculate price whenever plan, billingCycle or appliedCoupon changes
  useEffect(() => {
    if (!selectedPlanId) return;
    const calculate = async () => {
      const res = await db.calculateSubscriptionPrice(
        selectedPlanId,
        billingCycle,
        appliedCoupon || undefined
      );
      setPriceCalc(res);
    };
    calculate();
  }, [selectedPlanId, billingCycle, appliedCoupon]);

  // Selected Plan Object
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  // Filter plans appropriate for selected role
  const roleFilteredPlans = useMemo(() => {
    if (role === 'coach') {
      return plans.filter((p) => p.slug === 'pro' || p.slug === 'premium' || p.slug === 'enterprise');
    }
    if (role === 'parent') {
      return plans.filter((p) => p.slug === 'starter' || p.slug === 'free');
    }
    if (role === 'org_admin') {
      return plans.filter((p) => p.slug === 'enterprise' || p.slug === 'premium');
    }
    // Student sees all student-tier plans
    return plans.filter((p) => p.slug !== 'enterprise');
  }, [plans, role]);

  // If currently selected plan is not in the role-filtered list, pick the first valid one
  useEffect(() => {
    if (roleFilteredPlans.length > 0) {
      const isCurrentValid = roleFilteredPlans.some((p) => p.id === selectedPlanId);
      if (!isCurrentValid) {
        const featured = roleFilteredPlans.find((p) => p.is_featured) || roleFilteredPlans[0];
        if (featured) setSelectedPlanId(featured.id);
      }
    }
  }, [role, roleFilteredPlans, selectedPlanId]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Zayıf', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Orta', color: 'bg-amber-400' };
    return { score: 3, label: 'Çok Güçlü 🔒', color: 'bg-emerald-400' };
  }, [password]);

  // Coupon apply handler with centralized validation
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!discountCode.trim()) {
      setCouponFeedback({ text: 'Lütfen bir indirim kodu giriniz.', isSuccess: false });
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const res = await db.calculateSubscriptionPrice(
        selectedPlanId,
        billingCycle,
        discountCode.trim()
      );

      if (res.error_message) {
        setCouponFeedback({
          text: `❌ ${res.error_message}`,
          isSuccess: false,
        });
        setAppliedCoupon(null);
      } else {
        const clean = discountCode.trim().toUpperCase();
        setAppliedCoupon(clean);
        setCouponFeedback({
          text: `🎟️ "${clean}" kuponu başarıyla uygulandı! (${res.discount_title || 'İndirim uygulandı'})`,
          isSuccess: true,
        });
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Quick Preset Coupon Buttons
  const handleApplyPresetCoupon = (code: string) => {
    setDiscountCode(code);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    setTimeout(() => {
      handleApplyCoupon(fakeEvent);
    }, 50);
  };

  // Step 3 Validation before advancing
  const handleAdvanceFromStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Lütfen ad ve soyadınızı giriniz.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Girilen şifreler eşleşmiyor! Lütfen kontrol ediniz.');
      return;
    }
    if (role === 'coach' && (!institutionKey || institutionKey.trim() !== 'mahfaza')) {
      setErrorMessage('Koç hesabı açmak için geçerli kurum anahtarı ("mahfaza") gereklidir.');
      return;
    }
    if (role === 'parent' && !parentMatchCode.trim()) {
      setErrorMessage('Veli hesabı için öğrenci eşleşme kodu zorunludur.');
      return;
    }
    if (!termsAccepted || !kvkkAccepted) {
      setErrorMessage('Devam etmek için kullanım koşulları ve KVKK metnini onaylamalısınız.');
      return;
    }

    setCurrentStep(4);
  };

  // Final Registration Submission (Step 4 -> Step 5)
  const handleFinalRegister = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Create User Profile in Auth Provider
      const profile = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role === 'org_admin' ? 'coach' : role,
        institutionKey: role === 'coach' || role === 'org_admin' ? institutionKey : undefined,
        matchCode: role === 'parent' ? parentMatchCode.trim() : undefined,
        phone: phone || undefined,
        phoneNumber: phone || undefined,
      });

      setCreatedProfileName(name.trim());

      // 2. Handle Subscription & Entitlement (for Student / Coach / Org)
      if (selectedPlan) {
        const finalPrice = priceCalc ? priceCalc.final_price : selectedPlan.monthly_price;
        const discId = priceCalc?.discount_id || undefined;

        // Calculate Period End
        const now = new Date();
        const periodEnd = new Date();
        if (billingCycle === 'yearly') {
          periodEnd.setFullYear(now.getFullYear() + 1);
        } else {
          periodEnd.setMonth(now.getMonth() + 1);
        }

        // Save active subscription in Database
        await db.createSubscription({
          user_id: profile.user_id || profile.id,
          plan_id: selectedPlan.id,
          discount_id: discId,
          status: 'active',
          billing_cycle: billingCycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        });

        // If coupon was applied, atomically record redemption count in DB
        if (discId) {
          await db.redeemDiscountAtomic(discId, profile.user_id || profile.id);
        }

        // Record payment audit log
        await db.addPayment({
          user_id: profile.user_id || profile.id,
          plan_id: selectedPlan.id,
          discount_id: discId,
          amount: finalPrice,
          currency: 'TRY',
          status: 'succeeded',
          provider: finalPrice === 0 ? 'free_tier_grant' : 'iyzico_card_mock',
          user_name: name.trim(),
          user_email: email.trim().toLowerCase(),
        });

        // 3. Grant Student Entitlements & Update Custom Onboarding Goals (for Students)
        if (role === 'student') {
          const allStudents = await db.getStudents();
          const studentRecord = allStudents.find((s) => s.user_id === profile.user_id || s.email === email.trim().toLowerCase());

          if (studentRecord) {
            // Update student profile with onboarding inputs
            await db.updateStudent(studentRecord.id, {
              target_exam: targetExam,
              grade,
              field: field as any,
              target_university: targetUniversity,
              target_department: targetDepartment,
              target_score: targetScore,
              target_rank: targetRank,
            });

            // Update student goals
            await db.updateStudentGoal(studentRecord.id, {
              target_university: targetUniversity,
              target_department: targetDepartment,
              target_rank: targetRank,
              target_score: targetScore,
              notes: `${grade} - ${field} öğrencisi ${targetExam} 2027 hedefleri belirlendi.`,
            });

            // Grant private lessons entitlement
            const privateLessons = selectedPlan.private_lessons_per_month || (selectedPlan.slug === 'premium' ? 2 : selectedPlan.slug === 'pro' ? 1 : 0);

            await db.saveStudentEntitlement({
              student_id: studentRecord.id,
              student_name: name.trim(),
              student_email: email.trim().toLowerCase(),
              access_tier: selectedPlan.slug === 'premium' || selectedPlan.slug === 'pro' ? 'pro' : 'standard',
              granted_by: appliedCoupon === 'SERKAN2027' ? 'Mahfaza.co Özel Başarı Bursu' : 'Onboarding Aboneliği',
              reason: `${selectedPlan.name} Planı Aboneliği • ${billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'} Üyelik`,
              valid_until: periodEnd.toISOString(),
              is_active: true,
              included_private_lessons: privateLessons,
              used_private_lessons: 0,
              remaining_private_lessons: privateLessons,
              billing_period: now.toISOString().slice(0, 7),
            });
          }
        }
      }

      // Clear Session Storage Draft
      sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);

      // Advance to Completion Celebration Step
      setCurrentStep(5);
    } catch (err: any) {
      setErrorMessage(err.message || 'Kayıt işlemi gerçekleştirilemedi. Lütfen bilgilerinizi kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  // Savings Math Calculation for Yearly Plans
  const savingsAmount = useMemo(() => {
    if (!selectedPlan) return 0;
    const monthly12 = selectedPlan.monthly_price * 12;
    if (monthly12 > selectedPlan.yearly_price && selectedPlan.yearly_price > 0) {
      return monthly12 - selectedPlan.yearly_price;
    }
    return 0;
  }, [selectedPlan]);

  const equivalentMonthlyPrice = useMemo(() => {
    if (!selectedPlan || selectedPlan.yearly_price === 0) return 0;
    return Math.round(selectedPlan.yearly_price / 12);
  }, [selectedPlan]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative overflow-x-hidden text-slate-900 font-sans">
      {/* Top Global Academic Header Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90 transition-opacity" title="Ana Sayfaya Git">
            <MahfazaLogo size="md" subtitle="YKS • LGS • KPSS Onboarding" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs sm:text-sm text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
            >
              <span>🏠</span>
              <span className="hidden sm:inline">Ana Sayfaya Dön</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-xl transition-all"
            >
              Zaten Üye misin? <span className="text-indigo-600 font-bold underline underline-offset-4 ml-1">Giriş Yap</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Stepper Progress Bar (Steps 1 to 5) */}
        {currentStep < 5 && (
          <div className="max-w-3xl mx-auto mb-8 sm:mb-12">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-slate-200 -z-0 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-500 rounded-full"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />
              </div>

              {/* Step Markers */}
              {[
                { step: 1, label: 'Rol Seçimi', icon: '🎓' },
                { step: 2, label: 'Paket & Dönem', icon: '⭐' },
                { step: 3, label: 'Hesap Bilgileri', icon: '✍️' },
                { step: 4, label: 'Kupon & Onay', icon: '🎟️' },
              ].map((s) => {
                const isPassed = currentStep > s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      if (isPassed) setCurrentStep(s.step);
                    }}
                    disabled={!isPassed && !isCurrent}
                    className={`flex flex-col items-center gap-1.5 relative z-10 transition-all ${
                      isPassed ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                        isCurrent
                          ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white ring-4 ring-indigo-100 scale-110 shadow-indigo-600/20'
                          : isPassed
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                          : 'bg-white border border-slate-300 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-5 h-5 stroke-[3]" /> : s.icon}
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-semibold tracking-tight ${
                        isCurrent ? 'text-indigo-600 font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-700 hover:text-rose-900 uppercase font-bold"
            >
              Kapat
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: ROL SEÇİMİ (STUDENT / COACH / PARENT / ORG)      */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Adım 01 / 04</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Mahfaza'yı Nasıl Kullanacaksın?
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
                Profiline en uygun ekosistem rolünü seçerek kişiselleştirilmiş hazırlık sürecine başla.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Option 1: Student */}
              <div
                onClick={() => setRole('student')}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between bg-white ${
                  role === 'student'
                    ? 'border-indigo-600 shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Öğrenci Portalı
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">🎓 Öğrenciyim</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Ders çalışma süreleri, YKS/LGS/KPSS deneme netleri, Pomodoro odak odası ve yapay zekâ hedef takibi.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Netmatik & Çoklu Sınav İlerleme Grafiği</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Pomodoro Odak Seansları & Rozet XP</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Gemini AI Haftalık Strateji & Ruh Hali Takibi</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>Öğrenci Akışını Başlat</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option 2: Coach */}
              <div
                onClick={() => setRole('coach')}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between bg-white ${
                  role === 'coach'
                    ? 'border-indigo-600 shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      <Award className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Koç & Mentor
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">🧠 Koç / Öğretmenim</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Öğrenci portföyü, ödev & kanıt onay merkezi, risk triyajı ve haftalık özel ders yönetimi.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>15-50 Öğrenciye Kadar Koçluk Kapasitesi</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Erken Risk Uyarı & Günlük Triyaj Paneli</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Fotoğraflı Ödev & Kanıt Onay Merkezi</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Koç Akışını Başlat</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option 3: Parent */}
              <div
                onClick={() => setRole('parent')}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between bg-white ${
                  role === 'parent'
                    ? 'border-emerald-600 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-500/20 bg-emerald-50/30'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      <Users className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Veli Portalı
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">👨‍👩‍👧 Veliyim</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Öğrencimin günlük çalışma disiplinini, deneme netlerini ve resmi PDF gelişim karnesini takip etmek istiyorum.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Öğrenci Eşleştirme Kodu ile Anlık Bağlantı</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Resmi PDF Gelişim Karnesi İndirme</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Koç Gözlem Notları & SMS Bildirimleri</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span>Veli Akışını Başlat</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option 4: Enterprise / Kurumsal */}
              <div
                onClick={() => setRole('org_admin')}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between bg-white ${
                  role === 'org_admin'
                    ? 'border-purple-600 shadow-lg shadow-purple-600/10 ring-2 ring-purple-500/20 bg-purple-50/30'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Kurumsal Çözüm
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">🏫 Kurumum Var</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Dershaneler, kurs merkezleri ve özel okullar için çoklu koçluk ve toplu sınıf yönetimi.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>250+ Öğrenci & Çoklu Zümre Yetkilendirmesi</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Kurum Logolu PDF Şablonları & Özel Raporlar</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Dedicated Müşteri Temsilcisi & Eğitmen Eğitimi</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-bold text-purple-600">
                  <span>Kurumsal Başvuru Yap</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Paket Seçimine Geç</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: PAKET SEÇİMİ & DÖNEM (AYLIK / YILLIK TOGGLE)     */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Adım 02 / 04</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {role === 'coach'
                  ? 'Koçluk Kapasiteni ve Paketini Seç'
                  : role === 'parent'
                  ? 'Veli Takip Paketini Seç'
                  : role === 'org_admin'
                  ? 'Kurumsal Çözüm Paketini Seç'
                  : 'Sınav Hedefine Uygun Paketini Seç'}
              </h1>
              <p className="text-slate-600 text-sm max-w-xl mx-auto">
                Birebir özel ders hediyeli, yapay zekâ destekli ve Mahfaza.co rehberliğinde şeffaf hazırlık paketleri.
              </p>

              {/* Monthly / Yearly Billing Toggle */}
              <div className="pt-3 flex items-center justify-center">
                <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Aylık Ödeme
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      billingCycle === 'yearly'
                        ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Yıllık Ödeme</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      %20 İndirim
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roleFilteredPlans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                const isFeatured = p.is_featured;
                const price = billingCycle === 'yearly' ? p.yearly_price : p.monthly_price;
                const isFree = price === 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between bg-white ${
                      isSelected
                        ? 'border-indigo-600 shadow-xl shadow-indigo-600/10 ring-2 ring-indigo-500/20 scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Badge top */}
                    {isFeatured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>En Çok Tercih Edilen</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                        {p.description}
                      </p>

                      {/* Price Display */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        {isFree ? (
                          <div className="text-2xl font-extrabold text-slate-900">
                            {p.slug === 'enterprise' ? 'Özel Teklif' : 'Ücretsiz'}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-extrabold text-indigo-700">
                                ₺{billingCycle === 'yearly' ? Math.round(p.yearly_price / 12).toLocaleString('tr-TR') : p.monthly_price.toLocaleString('tr-TR')}
                              </span>
                              <span className="text-xs text-slate-500 font-semibold">/ ay</span>
                            </div>
                            {billingCycle === 'yearly' && (
                              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Yıllık ₺{p.yearly_price.toLocaleString('tr-TR')} faturalandırılır</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Private Lesson Callout Badge */}
                      {p.private_lessons_per_month && p.private_lessons_per_month > 0 ? (
                        <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2">
                          <Gift className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>🎁 Ayda {p.private_lessons_per_month} x 60 Dk Birebir Özel Ders Hediyesi</span>
                        </div>
                      ) : null}

                      {/* Features List */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                          Paket İçeriği:
                        </div>
                        <ul className="space-y-2 text-xs text-slate-700">
                          {p.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ Bu Paket Seçildi' : 'Bu Paketi Seç'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Rol Değiştir</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Bilgilerini Gir</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: HESAP BİLGİLERİ & ROL ÖZEL PROFİL ALANLARI      */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Form Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Adım 03 / 04</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Hesabını Oluşturalım
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Giriş bilgilerini ve {role === 'student' ? 'hedef sınav detaylarını' : 'profil detaylarını'} belirle.
                </p>
              </div>

              <form onSubmit={handleAdvanceFromStep3} className="space-y-6">
                {/* 1. Temel Hesap Bilgileri */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold uppercase text-indigo-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Temel Bilgiler</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Ad Soyad *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Örn: Ahmet Yılmaz"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Telefon Numarası</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0532 123 45 67"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">E-posta Adresi *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ahmet@ornek.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Şifre *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="En az 6 karakter"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password strength meter */}
                      {password && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Güçlük:</span>
                            <span className="font-bold text-slate-800">{passwordStrength.label}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                            <div
                              className={`h-full rounded-full transition-all ${
                                passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-300'
                              } w-1/3`}
                            />
                            <div
                              className={`h-full rounded-full transition-all ${
                                passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-300'
                              } w-1/3`}
                            />
                            <div
                              className={`h-full rounded-full transition-all ${
                                passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-300'
                              } w-1/3`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Şifre Tekrar *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Şifreyi tekrar yazın"
                          className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:outline-none transition-all placeholder:text-slate-400 font-medium ${
                            confirmPassword && confirmPassword !== password
                              ? 'border-rose-500 focus:border-rose-500 bg-rose-50/30'
                              : 'border-slate-200 focus:border-indigo-600 focus:bg-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== password && (
                        <p className="text-[11px] text-rose-600 font-semibold">Şifreler eşleşmiyor!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Role-Specific Profile Questions */}
                {role === 'student' && (
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase text-indigo-700 flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        <span>Sınav & Hedef Bilgileri</span>
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold">Özelleştirilmiş Müfredat</span>
                    </div>

                    {/* Target Exam Group Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Hazırlandığınız Sınav Grubu *</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetExam('YKS');
                            setGrade('12. Sınıf');
                            setField('SAY');
                            setTargetUniversity('Boğaziçi Üniversitesi');
                            setTargetDepartment('Bilgisayar Mühendisliği');
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            targetExam === 'YKS'
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm ring-1 ring-indigo-500 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-sm font-bold">🎯 YKS 2027</span>
                          <span className="text-[10px] text-slate-500 font-medium">TYT - AYT - YDT</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTargetExam('LGS');
                            setGrade('8. Sınıf');
                            setField('LGS');
                            setTargetUniversity('Galatasaray Lisesi');
                            setTargetDepartment('Fen & Anadolu');
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            targetExam === 'LGS'
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm ring-1 ring-indigo-500 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-sm font-bold">🎒 LGS 2027</span>
                          <span className="text-[10px] text-slate-500 font-medium">8. Sınıf & Liseler</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTargetExam('KPSS');
                            setGrade('Lisans');
                            setField('GY-GK');
                            setTargetUniversity('MEB Öğretmenlik');
                            setTargetDepartment('Kamu Kadrosu');
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            targetExam === 'KPSS'
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm ring-1 ring-indigo-500 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-sm font-bold">📚 KPSS 2027</span>
                          <span className="text-[10px] text-slate-500 font-medium">GY-GK & Memurluk</span>
                        </button>
                      </div>
                    </div>

                    {/* YKS Specific Inputs */}
                    {targetExam === 'YKS' && (
                      <div className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Sınıf Düzeyi</label>
                            <select
                              value={grade}
                              onChange={(e) => setGrade(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            >
                              <option value="12. Sınıf">12. Sınıf (YKS 2027)</option>
                              <option value="Mezun">Mezun Hazırlık</option>
                              <option value="11. Sınıf">11. Sınıf (Erken Başlangıç)</option>
                              <option value="10. Sınıf">10. Sınıf</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Hazırlık Alanı</label>
                            <select
                              value={field}
                              onChange={(e) => setField(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            >
                              <option value="SAY">SAY (Sayısal - MF)</option>
                              <option value="EA">EA (Eşit Ağırlık - TM)</option>
                              <option value="SÖZ">SÖZ (Sözel - TS)</option>
                              <option value="DİL">DİL (Yabancı Dil)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Hedef Üniversite</label>
                            <input
                              type="text"
                              value={targetUniversity}
                              onChange={(e) => setTargetUniversity(e.target.value)}
                              placeholder="Örn: Boğaziçi Üniversitesi"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Hedef Bölüm</label>
                            <input
                              type="text"
                              value={targetDepartment}
                              onChange={(e) => setTargetDepartment(e.target.value)}
                              placeholder="Örn: Bilgisayar Mühendisliği"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LGS Specific Inputs */}
                    {targetExam === 'LGS' && (
                      <div className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Sınıf Düzeyi</label>
                            <select
                              value={grade}
                              onChange={(e) => setGrade(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            >
                              <option value="8. Sınıf">8. Sınıf (LGS 2027 Sınav Yılı)</option>
                              <option value="7. Sınıf">7. Sınıf (Ön Hazırlık)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Müfredat Kapsamı</label>
                            <input
                              type="text"
                              disabled
                              value="6 Temel MEB Dersi (Türkçe, Mat, Fen, İnkılap, Din, İngilizce)"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Hedef Lise</label>
                            <input
                              type="text"
                              value={targetUniversity}
                              onChange={(e) => setTargetUniversity(e.target.value)}
                              placeholder="Örn: Galatasaray Lisesi / Fen Lisesi"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Hedef Yüzdelik / Tür</label>
                            <input
                              type="text"
                              value={targetDepartment}
                              onChange={(e) => setTargetDepartment(e.target.value)}
                              placeholder="Örn: İlk %0.5 / Fen Lisesi"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* KPSS Specific Inputs */}
                    {targetExam === 'KPSS' && (
                      <div className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Mezuniyet / Öğrenim Düzeyi</label>
                            <select
                              value={grade}
                              onChange={(e) => setGrade(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            >
                              <option value="Lisans">Lisans (KPSS Lisans & P3)</option>
                              <option value="Ön Lisans">Ön Lisans (KPSS P93)</option>
                              <option value="Ortaöğretim">Ortaöğretim (KPSS P94)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Hazırlık Oturumu</label>
                            <select
                              value={field}
                              onChange={(e) => setField(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            >
                              <option value="GY-GK">Genel Yetenek - Genel Kültür (Tüm Kadrolar)</option>
                              <option value="Eğitim Bilimleri">Eğitim Bilimleri (Öğretmenlik)</option>
                              <option value="Alan (ÖABT)">ÖABT & Alan Bilgisi</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Hedef Kurum / Kadro</label>
                            <input
                              type="text"
                              value={targetUniversity}
                              onChange={(e) => setTargetUniversity(e.target.value)}
                              placeholder="Örn: MEB Öğretmenlik / Gelir Uzmanlığı"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Hedef Kadro Unvanı</label>
                            <input
                              type="text"
                              value={targetDepartment}
                              onChange={(e) => setTargetDepartment(e.target.value)}
                              placeholder="Örn: Matematik Öğretmeni / Uzman Yrd."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {role === 'coach' && (
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold uppercase text-indigo-700 flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>Koçluk Bilgileri</span>
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Uzmanlık Alanı / Branş</label>
                      <input
                        type="text"
                        value={coachBranch}
                        onChange={(e) => setCoachBranch(e.target.value)}
                        placeholder="Örn: YKS Derece Mentoru / Matematik Öğretmeni"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Kurum Davet Anahtarı *</label>
                      <input
                        type="text"
                        value={institutionKey}
                        onChange={(e) => setInstitutionKey(e.target.value)}
                        placeholder="mahfaza"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none font-medium"
                      />
                      <p className="text-[11px] text-slate-500">
                        Demo ve yetkili koç kaydı için varsayılan anahtar: <strong className="text-indigo-600 font-semibold">mahfaza</strong>
                      </p>
                    </div>
                  </div>
                )}

                {role === 'parent' && (
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold uppercase text-emerald-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Öğrenci Eşleştirme</span>
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Öğrenci Eşleşme Kodu *</label>
                      <input
                        type="text"
                        required
                        value={parentMatchCode}
                        onChange={(e) => setParentMatchCode(e.target.value.toUpperCase())}
                        placeholder="Örn: STU-AHMET-2027"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none font-medium uppercase tracking-wider"
                      />
                      <p className="text-[11px] text-slate-500">
                        Öğrencinizin profilinde yer alan <strong>Eşleşme Kodunu</strong> girerek hesabını anında bağlayabilirsiniz. (Örnek: STU-AHMET-2027)
                      </p>
                    </div>
                  </div>
                )}

                {role === 'org_admin' && (
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold uppercase text-purple-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span>Kurumsal Bilgiler</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Kurum / Dershane Adı</label>
                        <input
                          type="text"
                          required
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="Örn: Zafer Eğitim Kurumları"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-purple-600 focus:bg-white focus:outline-none font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Yetkili Ünvanı</label>
                        <input
                          type="text"
                          value={orgTitle}
                          onChange={(e) => setOrgTitle(e.target.value)}
                          placeholder="Örn: Kurum Müdürü / Kurucu"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-purple-600 focus:bg-white focus:outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Legal Checkboxes */}
                <div className="space-y-2.5 pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      Mahfaza.co <strong className="text-slate-800">Kullanıcı ve Hizmet Sözleşmesini</strong> okudum, şartları kabul ediyorum.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kvkkAccepted}
                      onChange={(e) => setKvkkAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">KVKK Açık Rıza ve Gizlilik Politikasını</strong> okudum, kişisel verilerimin işlenmesine onay veriyorum.
                    </span>
                  </label>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Paket Değiştir</span>
                  </button>

                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Kupon & Özete Geç</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </form>
            </div>

            {/* Sticky Order Summary Sidebar */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-700">
                    Sipariş Özeti
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {role === 'coach' ? 'Koç' : role === 'parent' ? 'Veli' : role === 'org_admin' ? 'Kurumsal' : 'Öğrenci'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">Seçilen Paket:</span>
                    <span className="font-bold text-slate-900">{selectedPlan?.name}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">Ödeme Dönemi:</span>
                    <span className="font-bold text-slate-900">
                      {billingCycle === 'yearly' ? 'Yıllık (%20 İndirimli)' : 'Aylık'}
                    </span>
                  </div>

                  {selectedPlan?.private_lessons_per_month && selectedPlan.private_lessons_per_month > 0 ? (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Ayda {selectedPlan.private_lessons_per_month} Özel Ders Hediyesi</span>
                    </div>
                  ) : null}

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                    <span className="text-slate-600 font-bold">Toplam Tutar:</span>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-indigo-700">
                        {priceCalc
                          ? priceCalc.final_price === 0
                            ? 'Ücretsiz'
                            : `₺${priceCalc.final_price.toLocaleString('tr-TR')}`
                          : billingCycle === 'yearly'
                          ? `₺${selectedPlan?.yearly_price.toLocaleString('tr-TR')}`
                          : `₺${selectedPlan?.monthly_price.toLocaleString('tr-TR')}`}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {billingCycle === 'yearly' ? 'Yıllık tek çekim' : 'Aylık yenilenen'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>30 Gün Koşulsuz Para İade Garantisi</span>
                  </div>
                  <div>İstediğiniz zaman panelden tek tıkla iptal edebilirsiniz.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: KUPON KODU & SİPARİŞİ TAMAMLAMA                   */}
        {/* ======================================================== */}
        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Adım 04 / 04</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Kupon Kodu & Onay
              </h1>
              <p className="text-slate-600 text-sm max-w-xl mx-auto">
                Özel burs veya indirim kodun varsa uygulayarak anında indirimli fiyata eriş.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Coupon Engine & Payment Verification */}
              <div className="md:col-span-7 space-y-6">
                {/* Coupon Application Box */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold uppercase text-indigo-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>İndirim Kuponu Doğrulama</span>
                  </h3>

                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Örn: SERKAN2027"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none uppercase font-bold tracking-wider"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isApplyingCoupon}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isApplyingCoupon ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Kodu Uygula</span>
                      )}
                    </button>
                  </form>

                  {/* Feedback Message */}
                  {couponFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        couponFeedback.isSuccess
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}
                    >
                      {couponFeedback.isSuccess ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{couponFeedback.text}</span>
                    </div>
                  )}

                  {/* Quick Preset Coupons */}
                  <div className="pt-2">
                    <div className="text-[11px] text-slate-500 font-semibold mb-2">Hızlı Deneme Kuponları:</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { code: 'SERKAN2027', label: 'Kurucu Bursu (%50)' },
                        { code: 'YKS2027', label: 'YKS Erken Kayıt (%40)' },
                        { code: 'DERECE500', label: 'Derece Desteği (₺500)' },
                        { code: 'BURS100', label: 'Tam Burs (%100)' },
                      ].map((cp) => (
                        <button
                          key={cp.code}
                          type="button"
                          onClick={() => handleApplyPresetCoupon(cp.code)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[11px] text-slate-700 hover:text-indigo-700 transition-all font-mono font-bold cursor-pointer"
                        >
                          {cp.code} <span className="text-[10px] opacity-75 font-sans font-medium">({cp.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mock Payment / Verification details */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold uppercase text-slate-800 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Ödeme Bilgileri (256-Bit SSL Güvenli)</span>
                  </h3>

                  {priceCalc && priceCalc.final_price === 0 ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium space-y-1">
                      <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Ücretsiz / Burslu Aktivasyon</span>
                      </div>
                      <p>Kupon veya seçilen plan gereği kart bilgisi girmeden anında üyeliğiniz aktive edilecektir.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Kart Üzerindeki İsim</label>
                        <input
                          type="text"
                          value={name}
                          readOnly
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Kart Numarası (Test Modu)</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="5528 •••• •••• 4242 (Mock Kart)"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-medium focus:border-indigo-600 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Son Kullanma (AA/YY)</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="12/28"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-medium focus:border-indigo-600 focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">CVC / CVV</label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="321"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-medium focus:border-indigo-600 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Final Financial Invoice Breakdown */}
              <div className="md:col-span-5 space-y-6">
                <div className="p-6 rounded-3xl bg-white border border-indigo-200 space-y-4 shadow-sm relative overflow-hidden">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-700 border-b border-slate-100 pb-3">
                    Abonelik Faturası
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500">Kullanıcı:</span>
                      <span className="font-bold text-slate-900">{name || 'Kullanıcı'}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500">Rol & Paket:</span>
                      <span className="font-bold text-slate-900">{selectedPlan?.name}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500">Dönem:</span>
                      <span className="font-bold text-slate-900">
                        {billingCycle === 'yearly' ? 'Yıllık (12 Ay)' : 'Aylık'}
                      </span>
                    </div>

                    {/* Price Math */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Paket Liste Fiyatı:</span>
                        <span>
                          ₺{priceCalc ? priceCalc.base_price.toLocaleString('tr-TR') : (billingCycle === 'yearly' ? selectedPlan?.yearly_price : selectedPlan?.monthly_price)?.toLocaleString('tr-TR')}
                        </span>
                      </div>

                      {priceCalc && priceCalc.discount_amount > 0 && (
                        <div className="flex justify-between items-center text-emerald-700 font-bold">
                          <span>Uygulanan İndirim ({appliedCoupon}):</span>
                          <span>-₺{priceCalc.discount_amount.toLocaleString('tr-TR')}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                        <span className="text-sm font-bold text-slate-900">Ödenecek Tutar:</span>
                        <div className="text-right">
                          <div className="text-2xl font-extrabold text-indigo-700">
                            {priceCalc
                              ? priceCalc.final_price === 0
                                ? '₺0 (Ücretsiz)'
                                : `₺${priceCalc.final_price.toLocaleString('tr-TR')}`
                              : '₺0'}
                          </div>
                          {priceCalc && priceCalc.discount_amount > 0 && (
                            <div className="text-[10px] text-emerald-700 font-semibold">
                              Toplam ₺{priceCalc.discount_amount.toLocaleString('tr-TR')} tasarruf ettiniz!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleFinalRegister}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Hesabınız Oluşturuluyor...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 stroke-[3]" />
                          <span>Aboneliği Başlat & Panele Gir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Bilgileri Düzenle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 5: KAYIT TAMAMLANDI / HOŞ GELDİN KUTLAMA EKRANI      */}
        {/* ======================================================== */}
        {currentStep === 5 && (
          <div className="max-w-xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-500 py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-md border border-emerald-200">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kayıt ve Onboarding Başarılı</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Mahfaza'ya Hoş Geldin, {createdProfileName || name}!
              </h1>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Hesabın ve <strong>{selectedPlan?.name}</strong> üyeliğin başarıyla aktive edildi. Sınav maratonundaki hedeflerini birlikte yönetmeye başlayalım.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 text-left shadow-sm text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-100 pb-2">
                Hesap & Hak Tanımları
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Kullanıcı Rolü:</span>
                <span className="font-bold text-slate-900 capitalize">
                  {role === 'coach' ? 'Koç / Mentor' : role === 'parent' ? 'Veli' : role === 'org_admin' ? 'Kurumsal' : 'Öğrenci'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Aktif Plan:</span>
                <span className="font-bold text-indigo-700">{selectedPlan?.name}</span>
              </div>
              {selectedPlan?.private_lessons_per_month && selectedPlan.private_lessons_per_month > 0 ? (
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-slate-500">Özel Ders Kotası:</span>
                  <span className="font-bold text-emerald-700">
                    Ayda {selectedPlan.private_lessons_per_month} x 60 Dk Aktif
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">E-posta Durumu:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  Doğrulama Bağlantısı Gönderildi
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Başlangıç Tarihi:</span>
                <span className="font-bold text-slate-900">{new Date().toLocaleDateString('tr-TR')}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-3 text-xs text-amber-900">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">E-posta Doğrulama Adımı</p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  <strong>{email}</strong> adresinize aktivasyon bildirimi gönderilmiştir. Portala tam erişim sağlamak için e-postanızı onaylayabilirsiniz.
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>E-posta Kutuma Git</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>

              <Link
                to={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                className="block w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors text-center"
              >
                Doğrulama Kodunu Elle Girmek İstiyorum &rarr;
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Global Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Uçtan Uca Güvenli Altyapı</span>
          </div>
          <div>© 2027 Mahfaza.co • Bütün Hakları Saklıdır.</div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link to="/" className="hover:text-indigo-600">Ana Sayfa</Link>
            <Link to="/pricing" className="hover:text-indigo-600">Paketler</Link>
            <Link to="/login" className="hover:text-indigo-600">Giriş Yap</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
