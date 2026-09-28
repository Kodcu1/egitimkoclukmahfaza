import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { RiskBadge } from '../../components/common/RiskBadge';
import { Avatar } from '../../components/common/Avatar';
import { AddTaskModal } from '../../components/modals/AddTaskModal';
import { AIStudentAnalysisModal } from '../../components/ai/AIStudentAnalysisModal';
import { UpgradeModal } from '../../components/modals/UpgradeModal';
import { generateStudentPdfReport } from '../../utils/pdfReport';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  FileDown,
  CheckSquare,
  TrendingDown,
  Target,
  Flame,
  Bot,
} from 'lucide-react';

export const CoachRiskAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [taskStudent, setTaskStudent] = useState<Student | null>(null);
  const [analysisStudent, setAnalysisStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalConfig, setUpgradeModalConfig] = useState<{
    featureName: string;
    requiredPlan: 'Starter' | 'Pro' | 'Premium' | 'Kurumsal';
    description?: string;
    currentPlanName?: string;
  }>({
    featureName: 'PDF Gelişim Raporu',
    requiredPlan: 'Starter',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await db.getStudents();
      // Sort by risk score descending
      data.sort((a, b) => b.risk_score - a.risk_score);
      setStudents(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAuditAll = async () => {
    setIsAuditing(true);
    try {
      for (const s of students) {
        await db.auditStudent(s.id);
      }
      await loadData();
    } finally {
      setIsAuditing(false);
    }
  };

  const handleOpenTaskModal = async (student: Student) => {
    const actorId = user?.id || student.coach_id || student.id || student.user_id;
    const access = await db.checkFeatureAccess(actorId, 'task_assignment');
    if (!access.hasAccess) {
      setUpgradeModalConfig({
        featureName: 'Öğrenciye Görev Atama & Müdahale',
        requiredPlan: 'Pro',
        description:
          access.reason ||
          'Öğrencilere hedef/müdahale görevi atama ve takip sistemi PRO ve üzeri paketlerde kullanılabilir.',
        currentPlanName: access.currentPlanName,
      });
      setShowUpgradeModal(true);
      return;
    }
    setTaskStudent(student);
  };

  const handleDownloadPdf = async (student: Student) => {
    const actorId = user?.id || student.coach_id || student.id || student.user_id;
    const access = await db.checkFeatureAccess(actorId, 'pdf_reports');
    if (!access.hasAccess) {
      setUpgradeModalConfig({
        featureName: 'Resmi PDF Gelişim Karnesi ve Koçluk Raporu',
        requiredPlan: 'Starter',
        description:
          access.reason ||
          'Resmi PDF Gelişim Karnesi ve Rapor İndirme özelliği Starter ve üzeri paketlerde kullanılabilir.',
        currentPlanName: access.currentPlanName,
      });
      setShowUpgradeModal(true);
      return;
    }

    try {
      const [studentGoal, studentExams, studentLogs, studentTasks, studentBadges] = await Promise.all([
        db.getGoal(student.id),
        db.getExamsByStudent(student.id),
        db.getStudyLogsByStudent(student.id),
        db.getTasksByStudent(student.id),
        db.getStudentBadges(student.id),
      ]);

      await generateStudentPdfReport({
        student,
        goal: studentGoal,
        exams: studentExams,
        logs: studentLogs,
        tasks: studentTasks,
        badges: studentBadges,
      });
      toast.success('Öğrenci gelişim ve koçluk raporu indirildi.');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('PDF raporu oluşturulamadı.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Koç Erken Uyarı & Risk Tanı Merkezi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            YKS 2027 hedef sıralamasına göre net düşüşleri, aksayan çalışma süreleri ve disiplin riskleri
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleAuditAll}
          isLoading={isAuditing}
          leftIcon={<RotateCw className="w-4 h-4 text-indigo-600" />}
        >
          Tüm Portföyü Yeniden Tara (Risk Algoritması)
        </Button>
      </div>

      {/* Diagnostics List */}
      <div className="space-y-4">
        {students.map((stu) => {
          const isCritical = stu.risk_level === 'CRITICAL' || stu.risk_level === 'HIGH';

          return (
            <Card
              key={stu.id}
              className={`border transition-all shadow-xs ${
                isCritical
                  ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Student Meta */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <Avatar name={stu.name} size="lg" />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-base text-slate-900">{stu.name}</h4>
                      <span className="text-xs text-slate-500">({stu.email})</span>
                      <RiskBadge level={stu.risk_level} score={stu.risk_score} />
                    </div>

                    <p className="text-xs text-slate-600 flex items-center gap-2">
                      <span>{stu.field} • {stu.grade}</span>
                      <span>•</span>
                      <span className="text-indigo-700 font-semibold truncate">
                        Hedef: {stu.target_university} - {stu.target_department} (#{stu.target_rank})
                      </span>
                    </p>

                    {/* Risk Factors / Detected Reasons */}
                    <div className="pt-2 space-y-1">
                      {stu.risk_reasons && stu.risk_reasons.length > 0 ? (
                        stu.risk_reasons.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 w-fit"
                          >
                            <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-emerald-700 font-medium">
                          ✓ Çalışma disiplini ve deneme netleri hedef çizgisiyle tam uyumlu.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setAnalysisStudent(stu)}
                    className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold"
                    leftIcon={<Bot className="w-3.5 h-3.5 text-indigo-600" />}
                  >
                    AI Analizi
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenTaskModal(stu)}
                    leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
                  >
                    Müdahale Görevi Ata
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPdf(stu)}
                    leftIcon={<FileDown className="w-3.5 h-3.5" />}
                  >
                    Gelişim PDF İndir
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Assign Task Modal */}
      {taskStudent && (
        <AddTaskModal
          isOpen={Boolean(taskStudent)}
          onClose={() => setTaskStudent(null)}
          students={[taskStudent]}
          preselectedStudentId={taskStudent.id}
          coachId={user?.id || (user as any)?.user_id || ''}
          onAddTask={async (newTask) => {
            await db.addTask(newTask);
            setTaskStudent(null);
            await loadData();
          }}
        />
      )}

      {/* AI Analysis Modal */}
      {analysisStudent && (
        <AIStudentAnalysisModal
          isOpen={Boolean(analysisStudent)}
          onClose={() => setAnalysisStudent(null)}
          student={analysisStudent}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName={upgradeModalConfig.featureName}
          requiredPlan={upgradeModalConfig.requiredPlan}
          description={upgradeModalConfig.description}
          currentPlanName={upgradeModalConfig.currentPlanName}
        />
      )}
    </div>
  );
};
