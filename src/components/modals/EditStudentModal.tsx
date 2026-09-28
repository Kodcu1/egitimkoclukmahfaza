import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Student } from '../../types';
import { UserCheck } from 'lucide-react';

const editStudentSchema = z.object({
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phoneNumber: z
    .string()
    .min(10, 'Telefon numarası en az 10 haneli olmalıdır')
    .regex(
      /^(\+90|0)?[5]\d{2}[ ]?\d{3}[ ]?\d{2}[ ]?\d{2}$|^[0-9+\s()-]{10,20}$/,
      'Geçerli bir telefon numarası giriniz (örn: 0532 123 45 67)'
    ),
  grade: z.enum(['12. Sınıf', 'Mezun'] as const),
  field: z.enum(['EA', 'SAY', 'SÖZ'] as const),
  target_university: z.string().min(2, 'Hedef üniversite adı giriniz'),
  target_department: z.string().min(2, 'Hedef bölüm adı giriniz'),
  target_rank: z.number().min(1, 'Sıralama 1 veya daha büyük olmalıdır'),
  target_score: z.number().min(100, 'Puan 100 ile 560 arasında olmalıdır').max(560, 'Puan en fazla 560 olabilir'),
});

type EditStudentFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  grade: '12. Sınıf' | 'Mezun';
  field: 'EA' | 'SAY' | 'SÖZ';
  target_university: string;
  target_department: string;
  target_rank: number;
  target_score: number;
};

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSave: (updatedData: Partial<Student>) => Promise<void>;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      name: student.name,
      email: student.email,
      phoneNumber: student.phoneNumber || student.phone || '0532 123 45 67',
      grade: student.grade,
      field: student.field,
      target_university: student.target_university,
      target_department: student.target_department,
      target_rank: student.target_rank,
      target_score: student.target_score,
    },
  });

  const onSubmit = async (data: EditStudentFormData) => {
    try {
      await onSave({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        phone: data.phoneNumber,
        grade: data.grade,
        field: data.field,
        target_university: data.target_university,
        target_department: data.target_department,
        target_rank: data.target_rank,
        target_score: data.target_score,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update student:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Öğrenci Bilgilerini Düzenle"
      subtitle={`${student.name} isimli öğrencinin iletişim, akademik ve hedef profilini güncelleyin`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Öğrenci Adı Soyadı"
            placeholder="Örn: Mehmet Can"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="E-posta Adresi"
            type="email"
            placeholder="ornek@ogrenci.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Telefon Numarası"
            type="tel"
            placeholder="0532 123 45 67"
            {...register('phoneNumber')}
            error={errors.phoneNumber?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Sınıf Düzeyi" {...register('grade')} error={errors.grade?.message}>
            <option value="12. Sınıf">12. Sınıf (YKS 2027)</option>
            <option value="Mezun">Mezun Grubu</option>
          </Select>

          <Select label="YKS Alanı" {...register('field')} error={errors.field?.message}>
            <option value="SAY">Sayısal (SAY)</option>
            <option value="EA">Eşit Ağırlık (EA)</option>
            <option value="SÖZ">Sözel (SÖZ)</option>
          </Select>
        </div>

        <div className="border-t border-slate-800 pt-4 mt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
            Öğrenci YKS Hedefleri
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Hedef Üniversite"
              placeholder="Örn: ODTÜ"
              {...register('target_university')}
              error={errors.target_university?.message}
            />
            <Input
              label="Hedef Bölüm"
              placeholder="Örn: Endüstri Mühendisliği"
              {...register('target_department')}
              error={errors.target_department?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hedef Türkiye Sıralaması"
              type="number"
              placeholder="Örn: 2500"
              {...register('target_rank', { valueAsNumber: true })}
              error={errors.target_rank?.message}
            />
            <Input
              label="Hedef YKS Puanı"
              type="number"
              step="0.1"
              placeholder="Örn: 485.0"
              {...register('target_score', { valueAsNumber: true })}
              error={errors.target_score?.message}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Değişiklikleri Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
};
