import React, { useState, useEffect } from 'react';
import { Student, AIStudentAnalysis } from '../../types';
import { aiService } from '../../services/aiService';
import { db } from '../../lib/db';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Skeleton } from './SkeletonCard';
import { AIStudentAnalysisModal } from '../ai/AIStudentAnalysisModal';
import {
  Sparkles,
  Bot,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Zap,
  Lock,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface StudentAIWidgetProps {
  student: Student;
}

export const StudentAIWidget: React.FC<StudentAIWidgetProps> = ({ student }) => {
  const [analysis, setAnalysis] = useState<AIStudentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [accessReason, setAccessReason] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const checkAccessAndLoad = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const access = await db.checkFeatureAccess(student.user_id || student.id, 'ai_student_analysis');
      setHasAccess(access.hasAccess);
      setAccessReason(access.reason || '');

      if (access.hasAccess) {
        const data = await aiService.analyzeStudent(student.id, { forceRefresh });
        setAnalysis(data);
      }
    } catch (err: any) {
      console.warn('AI Widget load err:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (student?.id) {
      checkAccessAndLoad(false);
    }
  }, [student?.id]);

  if (!hasAccess) {
    return (
      <Card className="p-6 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-indigo-900/90 text-white border-indigo-700/50 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Mahfaza AI Teşhis Sistemi
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  PRO ÖZELLİK
                </span>
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                {accessReason || 'Kişiselleştirilmiş yapay zekâ analizleri Pro ve Premium paketlerde aktiftir.'}
              </p>
            </div>
          </div>
          <Lock className="w-5 h-5 text-amber-400/80 shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white border-indigo-500/40 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-indigo-400/60">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-300/30">
                <Bot className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                    Mahfaza AI
                    <span className="text-indigo-300 font-medium text-xs sm:text-sm">• Teşhis & Strateji</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[10px] font-bold text-indigo-200">
                    Canlı Analiz
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/80 mt-0.5">
                  Çözülen sorular ve deneme netleri yapay zekâ tarafından taranıyor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkAccessAndLoad(true)}
                isLoading={isLoading}
                className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 h-8"
                title="Analizi Yenile"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Yenile
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowModal(true)}
                className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold border-0 shadow-md h-8"
              >
                <span>Detaylı Rapor</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* Body Content */}
          {isLoading && !analysis ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-12 w-full bg-indigo-900/60" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-20 w-full bg-indigo-900/60" />
                <Skeleton className="h-20 w-full bg-indigo-900/60" />
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-3.5 pt-1">
              {/* Summary Sentence */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-indigo-100 leading-relaxed backdrop-blur-xs flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="line-clamp-2">{analysis.summary || 'Öğrencinin çalışma temposu ve net performansı takip ediliyor.'}</p>
              </div>

              {/* 3 Pillars: Strong, Risky, Recommended Study */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Strong areas */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Güçlü Alanlar</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {analysis.strengths && analysis.strengths.length > 0 ? (
                      analysis.strengths.slice(0, 2).map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 text-[11px] font-medium border border-emerald-500/20 truncate max-w-full"
                          title={s}
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">Veri işleniyor</span>
                    )}
                  </div>
                </div>

                {/* 2. Risk areas */}
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Riskli Alanlar</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                      analysis.weaknesses.slice(0, 2).map((w, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-200 text-[11px] font-medium border border-rose-500/20 truncate max-w-full"
                          title={w}
                        >
                          {w}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">Risk tespit edilmedi</span>
                    )}
                  </div>
                </div>

                {/* 3. Recommended Focus */}
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-400/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Önerilen Çalışma</span>
                  </div>
                  <p className="text-[11px] text-indigo-200 line-clamp-2 leading-tight">
                    {analysis.recommended_focus_topics && analysis.recommended_focus_topics.length > 0
                      ? analysis.recommended_focus_topics.slice(0, 2).join(' • ')
                      : 'Haftalık eksik konu tekrarı ve problem çözümü.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/5 text-center text-xs text-indigo-200">
              Yapay zekâ teşhisi için soru veya deneme girişi yapınız.
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <AIStudentAnalysisModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          student={student}
        />
      )}
    </>
  );
};
