import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { isSupabaseConfigured } from '../../lib/supabase';
import { db } from '../../lib/db';
import { Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const sqlHint = `-- Supabase SQL Editor içerisinde 'supabase/schema.sql' dosyasını çalıştırın.
-- RLS, Tetikleyiciler (Triggers) ve YKS 2027 Tabloları anında kurulacaktır.`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlHint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetMockData = () => {
    db.resetToDefaultMockData();
    setResetSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Veritabanı & Mock Motor Durumu"
      subtitle="Üretim ortamı canlı PostgreSQL ve yerel zengin mock veri durumu"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Connection Status Pill */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Veritabanı Motor Durumu</h4>
              <p className="text-xs text-slate-500">
                {isSupabaseConfigured
                  ? 'Canlı PostgreSQL veritabanı aktif ve bağlı.'
                  : 'Geliştirme & Önizleme Modu: Zengin mock veri motoru aktif (Supabase anahtarı gerekmez).'}
              </p>
            </div>
          </div>

          <Badge variant={isSupabaseConfigured ? 'success' : 'amber'} size="md">
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Canlı Supabase
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Mock Motor Aktif
              </span>
            )}
          </Badge>
        </div>

        {/* Info Explanations */}
        <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h5 className="font-bold text-slate-900 uppercase tracking-wider">Mock Veri & Önizleme Özellikleri:</h5>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li><strong>Tam Donanımlı Önizleme:</strong> Koç, öğrenci (Ahmet, Ayşe, Zeynep) ve veli profilleri, deneme karneleri, Pomodoro ve çalışma günlükleri hazır yüklenmiştir.</li>
            <li><strong>Supabase İsteğe Bağlı:</strong> Supabase API anahtarları girilmediğinde sistem sıfır hata ile yerel mock motor üzerinden çalışır.</li>
            <li><strong>Rol Değiştirme:</strong> Sağ üstteki "Rol Değiştir (Demo)" menüsü ile tüm rolleri test edebilirsiniz.</li>
          </ul>
        </div>

        {/* Mock Reset Button */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-amber-900">Örnek Verileri Sıfırla / Yenile</p>
            <p className="text-[11px] text-amber-700">Tüm dashboard ve istatistikleri varsayılan dolu haline getirir.</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetMockData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="bg-white hover:bg-amber-100 text-amber-900 border-amber-300 shrink-0"
          >
            {resetSuccess ? 'Yenileniyor...' : 'Verileri Yenile'}
          </Button>
        </div>

        {/* Environment Keys Notice */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            İleride Canlı Supabase Bağlamak İsterseniz (.env)
          </label>
          <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800 space-y-1">
            <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
            <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={copySql} leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}>
            {copied ? 'Kopyalandı' : 'SQL Bilgisini Kopyala'}
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Modal>
  );
};
