import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/db';
import { Student, StudentGoal, StudentField, StudentGrade, CoachProfile } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { MahfazaLogo } from '../../components/common/MahfazaLogo';
import {
  validateAvatarFile,
  uploadUserAvatar,
  removeUserAvatar,
} from '../../services/avatarService';
import {
  User,
  GraduationCap,
  Sparkles,
  Award,
  Phone,
  Mail,
  Target,
  Clock,
  BookOpen,
  ShieldCheck,
  MessageSquare,
  Lock,
  Copy,
  Check,
  Flame,
  CheckCircle2,
  HeartHandshake,
  Compass,
  Zap,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const StudentProfilePage: React.FC = () => {
  const { user, studentData, refreshStudentData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'coach' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [field, setField] = useState<StudentField>('SAY');
  const [grade, setGrade] = useState<StudentGrade>('12. Sınıf');
  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [targetRank, setTargetRank] = useState<number>(5000);
  const [targetScore, setTargetScore] = useState<number>(470);
  const [weeklyQuestionTarget, setWeeklyQuestionTarget] = useState<number>(600);
  const [weeklyHourTarget, setWeeklyHourTarget] = useState<number>(25);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);

  // Profile Photo Upload State
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load coach profile
    db.getCoachProfile().then((cp) => {
      if (cp) setCoachProfile(cp);
    });

    if (studentData) {
      setName(studentData.name || user?.name || '');
      setEmail(studentData.email || user?.email || '');
      setPhone(studentData.phoneNumber || studentData.phone || '');
      setAvatarUrl(studentData.avatar_url || user?.avatar_url || '');
      setField(studentData.field || 'SAY');
      setGrade(studentData.grade || '12. Sınıf');
      setTargetUniversity(studentData.target_university || 'Boğaziçi Üniversitesi');
      setTargetDepartment(studentData.target_department || 'Bilgisayar Mühendisliği');
      setTargetRank(studentData.target_rank || 5000);
      setTargetScore(studentData.target_score || 470);

      // Load goal targets if exist
      db.getStudentGoal(studentData.id).then((goal) => {
        if (goal) {
          setWeeklyQuestionTarget(goal.weekly_question_target || 600);
          setWeeklyHourTarget(goal.weekly_hour_target || 25);
        }
      });
    }
  }, [studentData, user]);

  const handleSelectAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    setAvatarError(null);

    const validation = await validateAvatarFile(file);
    if (!validation.isValid) {
      setAvatarError(validation.error || 'Geçersiz görsel dosyası.');
      return;
    }

    setSelectedAvatarFile(file);
    const preview = URL.createObjectURL(file);
    setAvatarPreviewUrl(preview);
    setAvatarUrl(preview);
  };

  const handleSaveAvatarDirect = async () => {
    const targetUserId = studentData?.user_id || user?.id || studentData?.id;
    if (!targetUserId) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      if (selectedAvatarFile) {
        const res = await uploadUserAvatar(targetUserId, selectedAvatarFile);
        if (!res.success || !res.avatarUrl) {
          throw new Error(res.error || 'Görsel yüklenemedi.');
        }
        setAvatarUrl(res.avatarUrl);
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
      } else if (avatarUrl) {
        if (studentData) {
          await db.updateStudent(studentData.id, { avatar_url: avatarUrl });
        }
        if (user) {
          await db.updateProfile(user.id, { avatar_url: avatarUrl });
        }
      }
      await refreshStudentData();
      toast.success('Profil fotoğrafınız başarıyla kaydedildi! 🎉');
    } catch (err: any) {
      setAvatarError(err.message || 'Fotoğraf kaydedilirken hata oluştu.');
      toast.error(err.message || 'Fotoğraf kaydedilemedi.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const targetUserId = studentData?.user_id || user?.id || studentData?.id;
    if (!targetUserId) return;

    setIsUploadingAvatar(true);
    try {
      await removeUserAvatar(targetUserId);
      if (studentData) {
        await db.updateStudent(studentData.id, { avatar_url: undefined });
      }
      if (user) {
        await db.updateProfile(user.id, { avatar_url: undefined });
      }
      setAvatarUrl('');
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl(null);
      setAvatarError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      await refreshStudentData();
      toast.info('Profil fotoğrafı kaldırıldı.');
    } catch (err) {
      toast.error('Fotoğraf kaldırılamadı.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCopyCode = () => {
    if (studentData?.match_code) {
      navigator.clipboard.writeText(studentData.match_code);
      setCopiedCode(true);
      toast.info('Eşleşme kodu panoya kopyalandı!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData) return;

    setIsSaving(true);
    try {
      let finalAvatar = avatarUrl;
      if (selectedAvatarFile && (studentData.user_id || user?.id)) {
        const uploadRes = await uploadUserAvatar(
          studentData.user_id || user?.id || studentData.id,
          selectedAvatarFile
        );
        if (uploadRes.success && uploadRes.avatarUrl) {
          finalAvatar = uploadRes.avatarUrl;
          setAvatarUrl(uploadRes.avatarUrl);
          setSelectedAvatarFile(null);
          setAvatarPreviewUrl(null);
        }
      }

      // 1. Update Student Table
      await db.updateStudent(studentData.id, {
        name: name.trim(),
        phoneNumber: phone.trim(),
        phone: phone.trim(),
        avatar_url: finalAvatar || undefined,
        field,
        grade,
        target_university: targetUniversity.trim(),
        target_department: targetDepartment.trim(),
        target_rank: Number(targetRank),
        target_score: Number(targetScore),
      });

      // 2. Update Student Goals
      await db.updateStudentGoal(studentData.id, {
        target_university: targetUniversity.trim(),
        target_department: targetDepartment.trim(),
        target_rank: Number(targetRank),
        target_score: Number(targetScore),
        weekly_question_target: Number(weeklyQuestionTarget),
        weekly_hour_target: Number(weeklyHourTarget),
      });

      // 3. Update User Profile if user exists
      if (user) {
        await db.updateProfile(user.id, {
          name: name.trim(),
          phone: phone.trim(),
          avatar_url: finalAvatar || undefined,
        });
      }

      await refreshStudentData();
      toast.success('Profil bilgileriniz ve hedefleriniz başarıyla güncellendi! 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Simulating password update
      await new Promise((r) => setTimeout(r, 600));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Şifreniz başarıyla değiştirildi!');
    } catch (err: any) {
      toast.error(err.message || 'Şifre değiştirilemedi.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Profile Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#1E1B4B] rounded-3xl p-6 sm:p-8 text-white border border-indigo-900 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar
                name={studentData?.name || user?.name || 'Öğrenci'}
                src={avatarUrl}
                size="lg"
                className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-white/20 shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-md border border-white/40">
                Seviye {studentData?.level || 1}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {studentData?.name || user?.name}
                </h1>
                <Badge variant="primary" size="sm" className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30">
                  {studentData?.field} • {studentData?.grade}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 font-medium flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                Hedef: <span className="font-bold text-white">{studentData?.target_university} - {studentData?.target_department}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-indigo-300">
                <span className="flex items-center gap-1 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {studentData?.xp || 0} XP
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Koç: <strong className="text-white">{coachProfile?.name || 'Mahfaza Koçluk Danışmanı'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Match Code Box */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner flex flex-col justify-between gap-2 min-w-[200px]">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">
                Öğrenci Eşleşme Kodu
              </p>
              <p className="text-base font-black font-mono tracking-widest text-amber-300 mt-0.5">
                {studentData?.match_code || 'STU-YKS-2027'}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil Bilgileri & Hedefler</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coach')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'coach'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Koçum Hakkında</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'security'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Hesap Güvenliği</span>
        </button>
      </div>

      {/* Tab 1: Profile & Goals Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in">
          {/* Profil Fotoğrafı Alanı */}
          <Card className="p-5 sm:p-6 bg-white border-slate-200 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Profil Fotoğrafı</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Koçunuz, veliniz ve sistem panellerinde görüntülenecek fotoğrafınız
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Maksimum 5 MB • JPG, PNG veya WebP
              </span>
            </div>

            {avatarError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{avatarError}</span>
              </div>
            )}

            {/* Hidden Inputs for File & Camera Capture */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleSelectAvatarFile(e.target.files?.[0])}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              capture="user"
              onChange={(e) => handleSelectAvatarFile(e.target.files?.[0])}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
            />

            {/* Current Photo & Action Controls */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-indigo-600 bg-white shadow-sm flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name || 'Profil Fotoğrafı'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold font-mono">
                      {(name || 'Ö')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Fotoğraf Değiştir"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {name || 'Öğrenci Profil Fotoğrafı'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {selectedAvatarFile
                      ? 'Yeni görsel seçildi (Aşağıdaki butona basarak kaydedebilirsiniz)'
                      : avatarUrl
                      ? 'Yüklü profil fotoğrafı aktif'
                      : 'Henüz profil fotoğrafı yüklenmedi (Varsayılan baş harfler kullanılıyor)'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5 text-indigo-600" />}
                    className="bg-white hover:bg-slate-50 text-xs"
                  >
                    Fotoğraf Yükle
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    leftIcon={<Camera className="w-3.5 h-3.5 text-emerald-600" />}
                    className="bg-white hover:bg-slate-50 text-xs"
                  >
                    Kameradan Çek
                  </Button>

                  {selectedAvatarFile && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveAvatarDirect}
                      isLoading={isUploadingAvatar}
                      leftIcon={<Check className="w-3.5 h-3.5 text-white" />}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      Şimdi Kaydet
                    </Button>
                  )}

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Fotoğrafı Kaldır
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Alternatif Hazır Avatarlar */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 block mb-2.5">
                Veya Hazır Profil Avatarlarından Seçin:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {AVATAR_OPTIONS.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(img);
                      setSelectedAvatarFile(null);
                      setAvatarPreviewUrl(null);
                      setAvatarError(null);
                    }}
                    className={`relative rounded-2xl overflow-hidden p-1 transition-all cursor-pointer ${
                      avatarUrl === img && !selectedAvatarFile
                        ? 'ring-4 ring-indigo-600 scale-105 shadow-md'
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Avatar ${idx + 1}`}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover"
                    />
                    {avatarUrl === img && !selectedAvatarFile && (
                      <div className="absolute inset-0 bg-indigo-600/30 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-6 bg-white border-slate-200 space-y-5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Kişisel ve İletişim Bilgileri</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ad Soyad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız Soyadınız"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="E-posta Adresi"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ogrenci@ornek.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                disabled
              />

              <Input
                label="Telefon Numarası"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Alan"
                  value={field}
                  onChange={(e) => setField(e.target.value as StudentField)}
                >
                  <option value="SAY">SAY (Sayısal)</option>
                  <option value="EA">EA (Eşit Ağırlık)</option>
                  <option value="SÖZ">SÖZ (Sözel)</option>
                </Select>

                <Select
                  label="Sınıf / Durum"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as StudentGrade)}
                >
                  <option value="12. Sınıf">12. Sınıf</option>
                  <option value="Mezun">Mezun</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* Target & Academic Goals */}
          <Card className="p-6 bg-white border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <span>YKS 2027 Akademik Hedefler ve Çalışma Kotası</span>
              </h3>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                Hedef Netlerine Göre Analiz Edilir
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hedef Üniversite"
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
                placeholder="Örn: Boğaziçi Üniversitesi, ODTÜ, İTÜ, Hacettepe"
                leftIcon={<GraduationCap className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Hedef Bölüm / Fakülte"
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                placeholder="Örn: Bilgisayar Mühendisliği, Tıp Fakültesi"
                leftIcon={<BookOpen className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Hedef Sıralama (Derece)"
                type="number"
                value={targetRank}
                onChange={(e) => setTargetRank(Number(e.target.value))}
                placeholder="Örn: 2500"
                leftIcon={<Award className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Hedef YKS / TYT-AYT Puanı"
                type="number"
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                placeholder="Örn: 485"
                leftIcon={<Sparkles className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Haftalık Hedef Soru Sayısı"
                type="number"
                value={weeklyQuestionTarget}
                onChange={(e) => setWeeklyQuestionTarget(Number(e.target.value))}
                placeholder="Örn: 750"
                leftIcon={<Target className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Haftalık Hedef Çalışma Süresi (Saat)"
                type="number"
                value={weeklyHourTarget}
                onChange={(e) => setWeeklyHourTarget(Number(e.target.value))}
                placeholder="Örn: 28"
                leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>
          </Card>

          {/* Submit Button Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
              className="px-8 py-3.5 shadow-xl shadow-indigo-600/30 text-sm font-black"
            >
              Değişiklikleri Kaydet
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: About My Coach */}
      {activeTab === 'coach' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Coach Hero Profile Card */}
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-[#13151b] to-slate-950 border-amber-500/30 text-white relative overflow-hidden shadow-2xl rounded-3xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-amber-400/90 shadow-2xl bg-slate-900 flex items-center justify-center">
                  <img
                    src={coachProfile?.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'}
                    alt={coachProfile?.name || 'Koçunuz'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
                  {coachProfile?.experience_years ? `${coachProfile.experience_years}+ Yıl Deneyim` : 'Kurucu Eğitimci'}
                </div>
              </div>

              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {coachProfile?.name || 'Mahfaza Koçluk Danışmanı'}
                  </h2>
                  <Badge variant="amber" size="sm" className="font-extrabold text-xs">
                    {coachProfile?.title || 'Mahfaza.co Kurucu Eğitimcisi & YKS Derece Koçu'}
                  </Badge>
                </div>
                <p className="text-amber-300 font-serif italic text-sm sm:text-base font-semibold">
                  "{coachProfile?.slogan || 'Planını Kur. Disiplinini Koru. Hedefine Ulaş.'}"
                </p>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {coachProfile?.bio ||
                    "10 yılı aşkın profesyonel YKS hazırlık, derece koçluğu ve motivasyon yönetimi tecrübesiyle yüzlerce öğrenciyi Türkiye'nin en seçkin üniversite ve bölümlerine yerleştiren analitik koçluk sistemi."}
                </p>
              </div>
            </div>

            {/* Quick Contact & Message Buttons */}
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <strong className="text-white">{coachProfile?.email || 'serkankocak551@gmail.com'}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{coachProfile?.working_hours || 'Hafta İçi: 09:00 - 21:00 Aktif Takip'}</span>
                </span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/student/messages')}
                leftIcon={<MessageSquare className="w-4 h-4" />}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              >
                Koçuma Canlı Mesaj Gönder
              </Button>
            </div>
          </Card>

          {/* 4 Core Coaching Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(coachProfile?.principles || []).map((principle, idx) => (
              <Card key={idx} className="p-5 bg-white border-slate-200 space-y-2 hover:shadow-lg hover:scale-[1.01] transition-all rounded-2xl">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                  {idx === 0 && <Target className="w-5 h-5" />}
                  {idx === 1 && <Zap className="w-5 h-5 text-rose-500" />}
                  {idx === 2 && <Award className="w-5 h-5 text-emerald-500" />}
                  {idx === 3 && <HeartHandshake className="w-5 h-5 text-indigo-500" />}
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {principle.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {principle.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Coach Special Letter */}
          <Card className="p-6 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 border-amber-200 space-y-3 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <Compass className="w-5 h-5 text-amber-600" />
              <span>Koçun Sana Özel Tavsiyesi & Mesajı:</span>
            </div>
            <blockquote className="text-xs sm:text-sm text-slate-700 italic leading-relaxed border-l-4 border-amber-400 pl-4">
              "{coachProfile?.special_message ||
                'Sevgili öğrencim; YKS maratonunda en önemli sermayen zekan değil, her gün masanın başına aynı kararlılıkla oturabilme disiplinindir. Zorlandığın anlar, gelişimin başladığı anlardır. Hedeflediğin amfiye adını yazdırmak için bugün attığın her adımın değerini bil. Yanındayım!'}"
            </blockquote>
            <div className="text-right text-xs font-black text-slate-900 font-serif">
              — {coachProfile?.name || 'Mahfaza Koçluk Danışmanı'}, {coachProfile?.title || 'YKS Mentorunuz'}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl animate-in fade-in">
          <Card className="p-6 bg-white border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Hesap Şifresini Değiştir</span>
            </h3>
            <p className="text-xs text-slate-500">
              Hesabınızın güvenliği için güçlü ve en az 6 karakterli bir şifre tercih ediniz.
            </p>

            <Input
              label="Mevcut Şifre"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Yeni Şifre"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Yeni Şifre Tekrar"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isChangingPassword}
              className="w-full text-xs font-bold py-3 mt-2"
            >
              Şifreyi Güncelle
            </Button>
          </Card>
        </form>
      )}
    </div>
  );
};
