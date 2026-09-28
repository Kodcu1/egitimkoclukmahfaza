import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Camera, Upload, Trash2, Check, Sparkles, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Student } from '../../types';
import { uploadUserAvatar, removeUserAvatar, validateAvatarFile } from '../../services/avatarService';
import { db } from '../../lib/db';

export interface StudentAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student;
  studentId?: string;
  studentName?: string;
  currentAvatarUrl?: string | null;
  onSaveAvatar?: (newAvatarUrl: string | undefined) => Promise<void>;
}

// Preset avatars curated for students
const PRESET_AVATARS = [
  {
    id: 'preset_1',
    label: 'Çalışkan Öğrenci',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_2',
    label: 'Hedef Zirve',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_3',
    label: 'Kütüphane Disiplini',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_4',
    label: 'Sayısal Şampiyonu',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_5',
    label: 'Derece Adayı',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_6',
    label: 'Odaklanmış Zihin',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
];

export const StudentAvatarModal: React.FC<StudentAvatarModalProps> = ({
  isOpen,
  onClose,
  student,
  studentId,
  studentName,
  currentAvatarUrl,
  onSaveAvatar,
}) => {
  const effectiveId = student?.id || studentId || student?.user_id || '';
  const effectiveName = student?.name || studentName || 'Öğrenci';
  const initialAvatar = student?.avatar_url || currentAvatarUrl || undefined;

  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(initialAvatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setErrorMessage(null);

    const validation = await validateAvatarFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Geçersiz dosya');
      return;
    }

    setSelectedFile(file);

    // Create local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setSelectedAvatar(previewUrl);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      let finalAvatarUrl = selectedAvatar;

      // If user uploaded a new local file, upload it securely
      if (selectedFile && effectiveId) {
        const uploadResult = await uploadUserAvatar(effectiveId, selectedFile);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Yükleme başarısız oldu.');
        }
        finalAvatarUrl = uploadResult.avatarUrl;
      }

      if (onSaveAvatar) {
        await onSaveAvatar(finalAvatarUrl);
      } else if (effectiveId) {
        await db.updateStudent(effectiveId, { avatar_url: finalAvatarUrl || undefined });
        await db.updateProfile(effectiveId, { avatar_url: finalAvatarUrl || undefined });
      }

      onClose();
    } catch (error: any) {
      console.error('Fotoğraf kaydedilemedi:', error);
      setErrorMessage(error.message || 'Fotoğraf kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setSelectedAvatar(undefined);
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';

    if (effectiveId) {
      try {
        await removeUserAvatar(effectiveId);
        if (onSaveAvatar) {
          await onSaveAvatar(undefined);
        }
      } catch (err) {
        console.warn('Remove avatar warning:', err);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Öğrenci Profil Fotoğrafı Yükle"
      maxWidth="md"
    >
      <div className="space-y-6">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Preview Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-600 bg-white shadow-sm flex items-center justify-center">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt={effectiveName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold font-mono">
                  {effectiveName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg shadow-md transition-colors cursor-pointer"
              title="Fotoğraf Değiştir"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h4 className="font-bold text-base text-slate-900">{effectiveName}</h4>
              {student && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {student.field} • {student.grade}
                </span>
              )}
            </div>
            {student?.target_university && (
              <p className="text-xs text-slate-600 font-medium">
                Hedef: {student.target_university} - {student.target_department}
              </p>
            )}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {selectedFile && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                  Yeni dosya seçildi (Kaydedilmeyi bekliyor)
                </span>
              )}
              {selectedAvatar && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Fotoğrafı Kaldır
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" /> Kendi Fotoğrafını Yükle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-4 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Hazır Profil Avatarları
          </button>
        </div>

        {/* Upload Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {/* Standard File Picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              accept="image/png, image/jpeg, image/webp, image/jpg"
              className="hidden"
            />

            {/* Mobile Camera Direct Capture */}
            <input
              type="file"
              ref={cameraInputRef}
              capture="user"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              accept="image/png, image/jpeg, image/webp, image/jpg"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Fotoğraf seçmek için tıklayın veya sürükleyin
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  PNG, JPG veya WEBP formatında (Maksimum 5MB)
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  leftIcon={<ImageIcon className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  Galeriden Seç
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  leftIcon={<Camera className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Kamerayı Aç
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Presets Tab Content */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              Aşağıdaki hazır profil fotoğraflarından birini seçebilirsiniz:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedAvatar === preset.url && !selectedFile;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedAvatar(preset.url);
                      setSelectedFile(null);
                      setErrorMessage(null);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {preset.label}
                      </p>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Seçildi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            isLoading={isSubmitting}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Fotoğrafı Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
};
