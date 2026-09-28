export interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface PricingPlanConfig {
  id: string;
  name: string;
  badge?: string;
  category: 'student' | 'coach' | 'enterprise';
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthlyEquivalent: number;
  currency: string;
  studentLimit: number;
  aiMonthlyLimit: number;
  description: string;
  features: PricingFeature[];
  isPopular?: boolean;
  ctaText: string;
  ctaLink: string;
}

export const STUDENT_PLANS: PricingPlanConfig[] = [
  {
    id: 'student_free_trial',
    name: 'Ücretsiz Deneme',
    category: 'student',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    currency: '₺',
    studentLimit: 1,
    aiMonthlyLimit: 15,
    description: 'Mahfaza.co sistemini keşfetmek isteyen YKS 2027 öğrencileri için 14 gün limitsiz deneme.',
    isPopular: false,
    ctaText: '14 Gün Ücretsiz Başla',
    ctaLink: '/register?plan=student_free',
    features: [
      { text: 'Günlük soru & süre çalışma günlüğü', included: true },
      { text: 'TYT & AYT 2027 müfredat konu takibi', included: true },
      { text: 'Pomodoro odak odası & istatistikler', included: true },
      { text: 'Temel deneme sınavı kaydı', included: true },
      { text: 'Aylık 15 AI soru analizi', included: true },
      { text: 'Kanıtlı fotoğraf yükleme & koç onayı', included: false },
      { text: 'Resmi PDF gelişim karnesi', included: false },
      { text: 'Veli canlı takip portalı', included: false },
    ],
  },
  {
    id: 'student_standard',
    name: 'Öğrenci Standard',
    badge: 'Bütçe Dostu',
    category: 'student',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    yearlyMonthlyEquivalent: 165,
    currency: '₺',
    studentLimit: 1,
    aiMonthlyLimit: 100,
    description: 'Düzenli çalışan ve hedefine emin adımlarla ilerlemek isteyen YKS 2027 öğrencisi.',
    isPopular: false,
    ctaText: 'Standard Pakete Geç',
    ctaLink: '/register?plan=student_standard',
    features: [
      { text: 'Tüm Deneme özellikleri', included: true },
      { text: 'Sınırsız çalışma günlüğü kaydı', included: true },
      { text: 'Kanıtlı çalışma fotoğrafları yükleme', included: true },
      { text: 'XP kazanımı & seviye sistemi', included: true },
      { text: 'Veli canlı eşleştirme & SMS bildirim', included: true },
      { text: 'Standart PDF gelişim karnesi', included: true },
      { text: 'Aylık 100 AI soru & strateji analizi', included: true },
      { text: 'Akıllı risk & eksik konu analizi', included: false },
    ],
  },
  {
    id: 'student_pro',
    name: 'Öğrenci PRO',
    badge: 'En Çok Tercih Edilen',
    category: 'student',
    monthlyPrice: 349,
    yearlyPrice: 3490,
    yearlyMonthlyEquivalent: 290,
    currency: '₺',
    studentLimit: 1,
    aiMonthlyLimit: 500,
    description: 'Derece hedefleyen, yapay zekâ analizleri ve koçluk araçlarıyla tam donanımlı hazırlık.',
    isPopular: true,
    ctaText: 'PRO Ayrıcalıklarını Başlat',
    ctaLink: '/register?plan=student_pro',
    features: [
      { text: 'Tüm Standard özellikleri', included: true },
      { text: 'Sınırsız kanıtlı çalışma fişi & paraf onay', included: true },
      { text: 'Ödül Mağazası & rozet kazanımları', included: true },
      { text: 'Kapsamlı YKS 2027 PDF başarı karnesi', included: true, highlight: true },
      { text: 'Aylık 500 AI soru analizi & eksik tespiti', included: true, highlight: true },
      { text: 'Net tahmin motoru & derece grafiği', included: true, highlight: true },
      { text: 'Öncelikli destek & koç eşleştirme', included: true },
    ],
  },
];

export const COACH_PLANS: PricingPlanConfig[] = [
  {
    id: 'coach_trial',
    name: 'Koç Deneme',
    category: 'coach',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    currency: '₺',
    studentLimit: 2,
    aiMonthlyLimit: 30,
    description: 'Koçluk platformunu sınıflarında denemek isteyen öğretmenler ve mentorlar için.',
    isPopular: false,
    ctaText: 'Ücretsiz Koç Olarak Başla',
    ctaLink: '/register?plan=coach_trial',
    features: [
      { text: '2 Öğrenciye kadar tam yönetim', included: true },
      { text: 'Görev atama & çalışma kontrolü', included: true },
      { text: 'Öğrenci deneme analizi & net takibi', included: true },
      { text: 'Temel onay merkezi & paraf', included: true },
      { text: 'Toplu ödevlendirme & SMS', included: false },
      { text: 'Özel logolu PDF karne', included: false },
    ],
  },
  {
    id: 'coach_personal',
    name: 'Kişisel Koç',
    badge: '10 Öğrenci',
    category: 'coach',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    yearlyMonthlyEquivalent: 415,
    currency: '₺',
    studentLimit: 10,
    aiMonthlyLimit: 300,
    description: 'Özel ders veren öğretmenler ve butik koçlar için 10 öğrenciye kadar eksiksiz takip.',
    isPopular: false,
    ctaText: 'Kişisel Koç Paketi Seç',
    ctaLink: '/register?plan=coach_personal',
    features: [
      { text: '10 Öğrenciye kadar aktif koçluk', included: true },
      { text: 'Toplu görev atama & onay merkezi', included: true },
      { text: 'Veli iletişim & bilgilendirme sistemi', included: true },
      { text: 'Kanıtlı çalışma günlüklerini paraf etme', included: true },
      { text: 'Öğrenci başarı risk analiz motoru', included: true, highlight: true },
      { text: 'Standart PDF gelişim karnesi üretimi', included: true },
    ],
  },
  {
    id: 'coach_pro',
    name: 'Profesyonel Koç',
    badge: '35 Öğrenci',
    category: 'coach',
    monthlyPrice: 899,
    yearlyPrice: 8990,
    yearlyMonthlyEquivalent: 749,
    currency: '₺',
    studentLimit: 35,
    aiMonthlyLimit: 1000,
    description: 'Geniş bir öğrenci grubuna sahip profesyonel derece koçları ve rehber öğretmenler için.',
    isPopular: true,
    ctaText: 'Profesyonel Koç Seç',
    ctaLink: '/register?plan=coach_pro',
    features: [
      { text: '35 Öğrenciye kadar tam portföy', included: true },
      { text: 'Sınırsız veli bağlantısı & SMS modülü', included: true },
      { text: 'Kurum/Koç özel logolu PDF karneler', included: true, highlight: true },
      { text: 'Yapay zekâ destekli haftalık öğrenci özetleri', included: true, highlight: true },
      { text: 'Ödül mağazası & XP yarışma ligleri', included: true },
      { text: '7/24 Öncelikli teknik destek', included: true },
    ],
  },
  {
    id: 'coach_enterprise',
    name: 'Kurum & Dershane',
    badge: '100+ Öğrenci',
    category: 'enterprise',
    monthlyPrice: 1899,
    yearlyPrice: 18990,
    yearlyMonthlyEquivalent: 1580,
    currency: '₺',
    studentLimit: 100,
    aiMonthlyLimit: 5000,
    description: 'Dershaneler, özel okullar ve kurs merkezleri için çoklu öğretmen ve şube yönetimi.',
    isPopular: false,
    ctaText: 'Kurumsal Teklif Al',
    ctaLink: 'mailto:mahfaza.co@gmail.com?subject=Mahfaza.co%20Kurumsal%20Talep',
    features: [
      { text: '100+ Öğrenci & Çoklu Koç / Öğretmen', included: true },
      { text: 'Şube ve sınıf bazlı toplu denetim', included: true },
      { text: 'Özel API & öğrenci bilgi sistemi entegrasyonu', included: true },
      { text: 'Özel alan adı & kurumsal tema', included: true },
      { text: 'Birebir kurum içi eğitim & danışmanlık', included: true },
    ],
  },
];

// Infrastructure cost metrics for admin calculation
export const INFRASTRUCTURE_COST_PER_USER_TRY = 7.87;
