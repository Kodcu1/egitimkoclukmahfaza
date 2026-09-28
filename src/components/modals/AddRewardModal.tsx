import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Reward } from '../../types';
import { Gift, Edit3 } from 'lucide-react';

interface AddRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  rewardToEdit?: Reward | null;
  onAddReward?: (reward: Omit<Reward, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReward?: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
}

export const AddRewardModal: React.FC<AddRewardModalProps> = ({
  isOpen,
  onClose,
  coachId,
  rewardToEdit,
  onAddReward,
  onUpdateReward,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costXp, setCostXp] = useState(500);
  const [category, setCategory] = useState('Etkinlik');
  const [icon, setIcon] = useState('Coffee');
  const [stock, setStock] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rewardToEdit) {
      setTitle(rewardToEdit.title);
      setDescription(rewardToEdit.description);
      setCostXp(rewardToEdit.cost_xp);
      setCategory(rewardToEdit.category || 'Etkinlik');
      setIcon(rewardToEdit.icon || 'Coffee');
      setStock(rewardToEdit.stock ?? 5);
    } else {
      setTitle('');
      setDescription('');
      setCostXp(500);
      setCategory('Etkinlik');
      setIcon('Coffee');
      setStock(5);
    }
  }, [rewardToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (rewardToEdit && onUpdateReward) {
        await onUpdateReward(rewardToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          cost_xp: Number(costXp),
          category,
          icon,
          stock: Number(stock),
        });
      } else if (onAddReward) {
        await onAddReward({
          coach_id: coachId,
          title: title.trim(),
          description: description.trim(),
          cost_xp: Number(costXp),
          category,
          icon,
          stock: Number(stock),
          is_active: true,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rewardToEdit ? 'Ödülü Düzenle' : 'Yeni Ödül Oluştur'}
      subtitle="Öğrencilerin biriktirdiği XP puanlarıyla talep edebileceği motivasyon ödülleri"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Ödül Başlığı"
          placeholder="Örn: 1 Saatlik Birebir Soru Çözüm Seansı"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Ödül Açıklaması
          </label>
          <textarea
            rows={3}
            className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Örn: Yapamadığın soruları biriktir, birlikte detaylı çözelim."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Gerekli XP Maliyeti"
            type="number"
            min={50}
            step={50}
            value={costXp}
            onChange={(e) => setCostXp(parseInt(e.target.value) || 500)}
            required
          />

          <Input
            label="Mevcut Stok / Kontenjan"
            type="number"
            min={1}
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Etkinlik">Etkinlik & Sohbet</option>
            <option value="Kitap">Kitap & Soru Bankası</option>
            <option value="Sosyal">Sosyal & Eğlence</option>
            <option value="Özel">Özel Koçluk Desteği</option>
          </Select>

          <Select label="İkon" value={icon} onChange={(e) => setIcon(e.target.value)}>
            <option value="Coffee">Kahve ☕</option>
            <option value="BookMarked">Kitap 📚</option>
            <option value="Film">Sinema 🎬</option>
            <option value="Gift">Hediye Paketi 🎁</option>
            <option value="Sparkles">Yıldız ✨</option>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose}>
            İptal
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={rewardToEdit ? <Edit3 className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
          >
            {rewardToEdit ? 'Değişiklikleri Kaydet' : 'Ödülü Yayınla'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
