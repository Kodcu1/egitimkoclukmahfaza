import React, { useState, useEffect } from 'react';
import { Student, AIStudentAnalysis } from '../../types';
import { aiService } from '../../services/aiService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  BookOpen,
  Target,
  ShieldAlert,
  FileText,
  RotateCcw,
  X,
  Zap,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface AIStudentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onOpenStudyPlan?: () => void;
  onOpenCoachReport?: () => void;
}

export const AIStudentAnalysisModal: React.FC<AIStudentAnalysisModalProps> = ({
  isOpen,
  onClose,
  student,
  onOpenStudyPlan,
  onOpenCoachReport,
}) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AIStudentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalysis = async (forceRefresh = false) => {
    if (!student) return;
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const data = await aiService.analyzeStudent(student.id, { forceRefresh });
      setAnalysis(data);
      if (forceRefresh) {
        toast.success('AI Analizi güncel verilerle yenilendi.');
      }
    } catch (err: any) {
      console.error('AI Analysis Error:', err);
      toast.error('AI Analizi yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      fetchAnalysis(false);
    }
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  const getRiskBadge = (level?: string) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            🔴 MÜDAHALE GEREKLİ (Kritik Risk)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-slate-950" />
            🟡 TAKİP EDİLMELİ (Orta Risk)
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white" />
            🟢 İYİ (Düşük Risk)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 transition-all animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Bot className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">{student.name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-bold text-indigo-200">
                  {student.field} • {student.grade}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mahfaza AI Danışmanlık ve Pedagojik Analiz Motoru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchAnalysis(true)}
              disabled={isLoading || isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Yeniden Analiz Et
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50/50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                <Bot className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-800 text-sm">Öğrenci Verileri İnceleniyor...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Son 30 günlük çalışma süreleri, deneme netleri ve görev alışkanlıkları yapay zekayla taranıyor.
                </p>
              </div>
            </div>
          ) : analysis ? (
            <>
              {/* Top Banner: Risk Status & Recommended Action */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  analysis.risk_level === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : analysis.risk_level === 'MEDIUM'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {getRiskBadge(analysis.risk_level)}
                    <span className="text-xs font-semibold opacity-75">
                      Risk Skoru: %{analysis.risk_score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                      Koç Aksiyonu:
                    </span>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-white shadow-2xs border border-current">
                      {analysis.recommended_action || 'Haftalık Takip'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-sm font-medium leading-relaxed bg-white/80 p-3.5 rounded-xl border border-current/20">
                  <span className="font-bold">Koç Müdahale Stratejisi: </span>
                  {analysis.coach_intervention}
                </div>
              </div>

              {/* Real Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Son 7 Gün</span>
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {analysis.metrics_summary.hours_7d} Saat
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    14 Gün: {analysis.metrics_summary.hours_14d}h
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Görev Başarısı</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    %{analysis.metrics_summary.task_completion_rate}
                  </div>
                  <div className="text-[11px] text-rose-500 font-bold">
                    {analysis.metrics_summary.overdue_tasks_count} Gecikmiş Görev
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Son Deneme Neti</span>
                    <Target className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {analysis.metrics_summary.recent_exam_net} Net
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Hedef: {analysis.metrics_summary.target_net} Net
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Çalışma Serisi</span>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {analysis.metrics_summary.streak_days} Gün
                  </div>
                  <div className="text-[11px] text-indigo-600 font-bold">
                    {analysis.metrics_summary.total_xp.toLocaleString()} XP
                  </div>
                </div>
              </div>

              {/* 9 Structured Analysis Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Genel Durum */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Bot className="w-4 h-4 text-indigo-600" /> 1. Genel Durum Değerlendirmesi
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {analysis.general_status}
                  </p>
                </div>

                {/* 2. Güçlü Alanlar */}
                <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. Güçlü Alanlar & Kazanımlar
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                    {analysis.strengths.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Geliştirilmesi Gereken Alanlar */}
                <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-2xs">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> 3. Geliştirilmesi Gereken Alanlar
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                    {analysis.areas_for_improvement.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Kritik Riskler */}
                <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-2xs">
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> 4. Kritik Risk Faktörleri
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                    {analysis.critical_risks.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. Çalışma Disiplini */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-indigo-600" /> 5. Çalışma Disiplini ve Süreklilik
                  </h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {analysis.study_discipline}
                  </p>
                </div>

                {/* 6. Akademik Performans */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" /> 6. Akademik Performans & Net Durumu
                  </h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {analysis.academic_performance}
                  </p>
                </div>

                {/* 7. Son Dönem Değişimi */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" /> 7. Son Dönem Çalışma İvmesi
                  </h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {analysis.recent_trend}
                  </p>
                </div>

                {/* 8 & 9. Gelecek Hafta Öncelikleri */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-200/80 shadow-2xs">
                  <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Zap className="w-4 h-4 text-amber-500" /> 9. Gelecek Hafta Öncelikleri ve Odak Konuları
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {analysis.next_week_priorities.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-indigo-100 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">
                          {idx + 1}
                        </span>
                        <span className="truncate">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AI koçun yardımcısıdır. Nihai karar her zaman koçtadır.</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCoachReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenCoachReport();
                }}
                className="text-xs"
              >
                <FileText className="w-4 h-4 mr-1 text-indigo-600" />
                AI Koç Raporu
              </Button>
            )}

            {onOpenStudyPlan && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenStudyPlan();
                }}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
              >
                <Zap className="w-4 h-4 mr-1 text-amber-300" />
                Haftalık Çalışma Planı Oluştur →
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
