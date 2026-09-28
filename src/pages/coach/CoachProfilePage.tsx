import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/db';
import { CoachProfile, CoachPrinciple } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import {
  User,
  Sparkles,
  Award,
  Phone,
  Mail,
  Clock,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  HeartHandshake,
  Compass,
  Zap,
  Target,
  Edit3,
  Eye,
  Save,
  Flame,
  Check,
} from 'lucide-react';

const COACH_AVATARS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
];

export const CoachProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form States
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [slogan, setSlogan] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(10);
  const [workingHours, setWorkingHours] = useState('');
  const [bio, setBio] = useState('');
  const [vision, setVision] = useState('');
  const [specialMessage, setSpecialMessage] = useState('');
  const [principles, setPrinciples] = useState<CoachPrinciple[]>([]);

  useEffect(() => {
    loadCoachProfile();
  }, []);

  const loadCoachProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await db.getCoachProfile();
      if (profile) {
        setName(profile.name || user?.name || 'Mahfaza Koçluk Danışmanı');
        setTitle(profile.title || 'Mahfaza.co Kurucu Eğitimcisi & YKS Derece Koçu');
        setSlogan(profile.slogan || 'Planını Kur. Disiplinini Koru. Hedefine Ulaş.');
        setEmail(profile.email || user?.email || 'yonetim@mahfaza.co');
        setPhone(profile.phone || '0555 123 4567');
        setAvatarUrl(profile.avatar_url || '');
        setExperienceYears(profile.experience_years || 11);
        setWorkingHours(profile.working_hours || 'Hafta İçi & Cumartesi: 09:00 - 21:00 Aktif Takip');
        setBio(
          profile.bio ||
            "10 yılı aşkın profesyonel YKS hazırlık, analitik derece koçluğu ve motivasyon yönetimi tecrübesiyle yüzlerce öğrenciyi Türkiye'nin en seçkin üniversite ve bölümlerine yerleştiren modern eğitim mentoru."
        );
        setVision(
          profile.vision ||
            'Her öğrencinin potansiyelini maksimum seviyeye çıkaran, veriye dayalı, disiplinli ve kişiselleştirilmiş 2027 koçluk ekosistemi inşa etmek.'
        );
        setSpecialMessage(
          profile.special_message ||
            'Sevgili öğrencim; 2027 YKS maratonunda en önemli sermayen zekan değil, her gün masanın başına aynı kararlılıkla oturabilme disiplinindir. Zorlandığın anlar, gelişimin başladığı anlardır. Hedeflediğin amfiye adını yazdırmak için bugün attığın her adımın değerini bil. Yanındayım!'
        );
        setPrinciples(
          profile.principles && profile.principles.length > 0
            ? profile.principles
            : [
                {
                  title: '1. Bireysel Strateji ve Dinamik Planlama',
                  description:
                    'Her öğrencinin öğrenme hızı, güçlü ve eksik olduğu konular farklıdır. Haftalık deneme sonuçlarına göre güncellenen dinamik çalışma çizelgeleriyle zaman kaybı engellenir.',
                },
                {
                  title: '2. Erken Uyarı ve Risk Analiz Sistemi',
                  description:
                    'Soru sayılarında düşüş veya hedef netlerden sapma görüldüğünde sistem anında alarm verir; koç müdahalesiyle öğrenci vakit kaybetmeden yeniden motive edilir.',
                },
                {
                  title: '3. Gamification ve Sürekli Motivasyon',
                  description:
                    'Çözülen her soru, bitirilen her deneme ve tamamlanan her Pomodoro seansı XP kazandırır. Öğrenci ödül mağazasından koçluk ödülleri kazanarak eğlenerek yarışır.',
                },
                {
                  title: '4. Zihinsel Dayanıklılık ve Sınav Psikolojisi',
                  description:
                    'YKS yalnızca bilgi değil, stres yönetimi sınavıdır. Düzenli koçluk görüşmeleri ve analiz karneleriyle öğrencinin özgüveni daima zirvede tutulur.',
                },
              ]
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrincipleChange = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...principles];
    updated[index] = { ...updated[index], [field]: value };
    setPrinciples(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await db.updateCoachProfile({
        name: name.trim(),
        title: title.trim(),
        slogan: slogan.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
        experience_years: Number(experienceYears),
        working_hours: workingHours.trim(),
        bio: bio.trim(),
        vision: vision.trim(),
        special_message: specialMessage.trim(),
        principles,
      });

      if (user) {
        await db.updateProfile(user.id, {
          name: name.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl,
        });
      }

      toast.success('Koç profiliniz ve Hakkımda bilgileriniz başarıyla güncellendi! 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0c0d12] via-[#1a1b24] to-[#0c0d12] rounded-3xl p-6 sm:p-8 text-white border border-amber-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <MahfazaLogo size="lg" showText={false} />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                  Koç Profilim & Hakkımda Yönetimi
                </h1>
                <Badge variant="amber" size="sm" className="font-extrabold text-[11px] shadow-sm">
                  2027 Koçluk Sistemi
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Öğrencilerinizin ve velilerinizin görüntüleyeceği koçluk felsefenizi, özgeçmişinizi ve başarı ilkelerinizi düzenleyin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-amber-500/20 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'edit'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Düzenle</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Öğrenci Önizlemesi</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'edit' ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar & Photo Picker */}
          <Card className="p-6 bg-white border-slate-200 shadow-lg space-y-4 rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>Koç Profil Fotoğrafı & Görsel</span>
              </h3>
              <span className="text-xs text-slate-500">Tüm portallarda bu avatar görünür</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {COACH_AVATARS.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(img)}
                  className={`relative rounded-2xl overflow-hidden p-1 transition-all ${
                    avatarUrl === img
                      ? 'ring-4 ring-amber-500 scale-105 shadow-lg'
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Koç ${idx + 1}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
                  />
                  {avatarUrl === img && (
                    <div className="absolute inset-0 bg-amber-500/30 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-slate-950" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Core Info & Titles */}
          <Card className="p-6 bg-white border-slate-200 shadow-lg space-y-5 rounded-3xl">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Temel Kimlik, Ünvan & İletişim Bilgileri</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ad Soyad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ahmet Kaya"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Koçluk Ünvanı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Mahfaza.co Kurucu Eğitimcisi & YKS Derece Koçu"
                leftIcon={<Award className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="E-posta Adresi (İletişim)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="serkankocak551@gmail.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Telefon Numarası"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555 XXX XX XX"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Koçluk / Eğitim Tecrübesi (Yıl)"
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                placeholder="10"
                leftIcon={<Sparkles className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Aktif Takip & Çalışma Saatleri"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="Hafta İçi: 09:00 - 21:00"
                leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>

            <Input
              label="Ana Slogan / Koçluk Mottosu"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Planını Kur. Disiplinini Koru. Hedefine Ulaş."
              leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
              required
            />
          </Card>

          {/* Bio & Vision */}
          <Card className="p-6 bg-white border-slate-200 shadow-lg space-y-5 rounded-3xl">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Özgeçmiş, Vizyon ve Koçluk Yaklaşımı</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Özgeçmiş & Koçluk Deneyimi (Bio)
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Koçluk geçmişiniz, mezun ettiğiniz öğrenciler, derece başarılarınız..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm text-slate-900 leading-relaxed resize-none shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Koçluk Vizyonu & Misyonu
                </label>
                <textarea
                  rows={3}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="Eğitim anlayışınız, hedeflediğiniz standartlar..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm text-slate-900 leading-relaxed resize-none shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-amber-800">
                  <Compass className="w-4 h-4 text-amber-600" />
                  Öğrenciye Özel Tavsiye Mektubu & Başarı Mesajı
                </label>
                <textarea
                  rows={4}
                  value={specialMessage}
                  onChange={(e) => setSpecialMessage(e.target.value)}
                  placeholder="Öğrencilerinizin panelinde mektup olarak gösterilecek ilham verici mesaj..."
                  className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm text-slate-900 leading-relaxed resize-none shadow-xs"
                  required
                />
              </div>
            </div>
          </Card>

          {/* 4 Core Principles Editor */}
          <Card className="p-6 bg-white border-slate-200 shadow-lg space-y-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <span>4 Temel Koçluk İlkesi</span>
              </h3>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                Öğrenci Panelinde Kart Olarak Sergilenir
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {principles.map((principle, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-amber-300 transition-colors"
                >
                  <input
                    type="text"
                    value={principle.title}
                    onChange={(e) => handlePrincipleChange(idx, 'title', e.target.value)}
                    className="w-full px-3 py-1.5 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    placeholder="İlke Başlığı"
                  />
                  <textarea
                    rows={3}
                    value={principle.description}
                    onChange={(e) => handlePrincipleChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 leading-relaxed resize-none"
                    placeholder="İlke açıklaması..."
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Save Button Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              leftIcon={<Save className="w-5 h-5" />}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-xl shadow-amber-500/20 text-sm active:scale-95 transition-all"
            >
              Koç Profilini ve Hakkımda Bilgilerini Kaydet
            </Button>
          </div>
        </form>
      ) : (
        /* Live Preview Mode (Exactly how students see it) */
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              Bu görünüm, öğrencilerinizin "Koçum Hakkında" sekmesinde göreceği canlı tasarımdır.
            </span>
            <Button size="sm" variant="secondary" onClick={() => setActiveTab('edit')}>
              Düzenlemeye Geri Dön
            </Button>
          </div>

          {/* Coach Hero Profile Card */}
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-[#121318] to-slate-950 border-amber-500/30 text-white relative overflow-hidden shadow-2xl rounded-3xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl bg-slate-900 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-indigo-500/20 flex items-center justify-center text-amber-400 text-3xl font-black">
                      {name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'SK'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap">
                  {experienceYears}+ Yıl Deneyim
                </div>
              </div>

              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {name}
                  </h2>
                  <Badge variant="amber" size="sm" className="font-extrabold text-xs">
                    {title}
                  </Badge>
                </div>
                <p className="text-amber-300 font-serif italic text-sm sm:text-base font-semibold">
                  "{slogan}"
                </p>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {bio}
                </p>
              </div>
            </div>

            {/* Quick Contact & Info */}
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <strong className="text-white">{email}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{workingHours}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MahfazaLogo size="sm" textColor="text-white" />
              </div>
            </div>
          </Card>

          {/* 4 Core Coaching Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principles.map((item, idx) => (
              <Card
                key={idx}
                className="p-5 bg-white border-slate-200 space-y-2 hover:shadow-xl hover:scale-[1.01] transition-all rounded-2xl"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                  {idx === 0 && <Target className="w-5 h-5" />}
                  {idx === 1 && <Zap className="w-5 h-5 text-rose-500" />}
                  {idx === 2 && <Award className="w-5 h-5 text-emerald-500" />}
                  {idx === 3 && <HeartHandshake className="w-5 h-5 text-indigo-500" />}
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>

          {/* Coach Special Letter */}
          <Card className="p-6 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-amber-200 space-y-3 rounded-3xl shadow-md">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <Compass className="w-5 h-5 text-amber-600" />
              <span>Koçun Sana Özel Tavsiyesi & Mesajı:</span>
            </div>
            <blockquote className="text-xs sm:text-sm text-slate-700 italic leading-relaxed border-l-4 border-amber-400 pl-4">
              "{specialMessage}"
            </blockquote>
            <div className="text-right text-xs font-black text-slate-900 font-serif">
              — {name}, {title}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
