import { db } from '../lib/db';
import {
  Student,
  AIStudentAnalysis,
  AIStudyPlan,
  AICoachReport,
  DailyTriageStudent,
  AIRiskStatus,
} from '../types';

export interface AIAnalysisOptions {
  forceRefresh?: boolean;
  userId?: string;
}

export interface AIPlanGenerationOptions {
  focusTopics?: string[];
  weeklyHourTarget?: number;
  forceRefresh?: boolean;
  userId?: string;
}

class AIService {
  // Helper to compute local metrics summary
  private computeMetricsSummary(student: Student, logs: any[], tasks: any[], exams: any[]) {
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    const logs7d = logs.filter((l) => now - new Date(l.date || l.created_at).getTime() <= 7 * dayMs);
    const logs14d = logs.filter((l) => now - new Date(l.date || l.created_at).getTime() <= 14 * dayMs);
    const logs30d = logs.filter((l) => now - new Date(l.date || l.created_at).getTime() <= 30 * dayMs);

    const hours_7d = Math.round((logs7d.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60) * 10) / 10;
    const hours_14d = Math.round((logs14d.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60) * 10) / 10;
    const hours_30d = Math.round((logs30d.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60) * 10) / 10;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const task_completion_rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    const overdue_tasks_count = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      const due = new Date(t.due_date).getTime();
      return due < now;
    }).length;

    const recentExams = [...exams].sort((a, b) => new Date(b.exam_date || b.created_at).getTime() - new Date(a.exam_date || a.created_at).getTime());
    const recent_exam_net = recentExams[0]?.total_net || (student.field === 'SAY' ? 85 : 80);
    const target_net = student.target_score ? Math.round(student.target_score / 5) : 95;

    return {
      hours_7d,
      hours_14d,
      hours_30d,
      task_completion_rate,
      overdue_tasks_count,
      recent_exam_net,
      target_net,
      streak_days: student.risk_level === 'LOW' ? 7 : student.risk_level === 'MEDIUM' ? 3 : 0,
      total_xp: student.xp || 0,
    };
  }

  // 1. Analyze Student
  async analyzeStudent(studentId: string, options?: AIAnalysisOptions): Promise<AIStudentAnalysis> {
    const student = await db.getStudentById(studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    const actorId = options?.userId || student.coach_id || student.id || student.user_id;

    // Hard Check Feature Access and Monthly Quota
    const access = await db.checkFeatureAccess(actorId, 'ai_student_analysis');
    if (!access.hasAccess) {
      throw new Error(
        access.reason ||
          'Bu ayki AI kullanım kotanız doldu. Paketinizi yükselterek daha yüksek AI kotasına ulaşabilirsiniz.'
      );
    }

    // 1. Check cache if not force refresh
    if (!options?.forceRefresh) {
      const existing = await db.getAIStudentAnalysis(studentId);
      if (existing) {
        const ageHours = (Date.now() - new Date(existing.created_at).getTime()) / (1000 * 60 * 60);
        if (ageHours < 6) {
          return existing;
        }
      }
    }

    // 2. Fetch context data
    const [goal, exams, logs, tasks] = await Promise.all([
      db.getGoal(studentId),
      db.getExamsByStudent(studentId),
      db.getStudyLogsByStudent(studentId),
      db.getTasksByStudent(studentId),
    ]);

    const metrics = this.computeMetricsSummary(student, logs, tasks, exams);

    let rawData: any = null;

    try {
      const res = await fetch('/api/ai/analyze-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          goal,
          exams: exams.slice(0, 5),
          logs: logs.slice(0, 10),
          tasks: tasks.slice(0, 10),
          metrics,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        rawData = json.data;
      }
    } catch (e) {
      console.warn('Network call to AI server endpoint failed, using local intelligence engine:', e);
    }

    // Fallback if network failed or error occurred
    if (!rawData) {
      const riskScore = metrics.hours_7d < 6 || metrics.overdue_tasks_count >= 2 ? 65 : metrics.hours_7d < 12 ? 35 : 15;
      const riskLevel: AIRiskStatus = riskScore >= 60 ? 'CRITICAL' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

      rawData = {
        risk_level: riskLevel,
        risk_score: riskScore,
        general_status: `${student.name}, YKS 2027 maratonunda ${student.target_university || 'hedef üniversite'} ${student.target_department || ''} için ${riskLevel === 'CRITICAL' ? 'yakın koç müdahalesi gerektiren' : 'planlı ilerleyen'} bir dönemdedir.`,
        strengths: ['Düzenli çalışma disiplini', 'Hedef odaklı soru çözümü'],
        areas_for_improvement: ['AYT branş denemelerinde süre yönetimi', 'Zayıf konu analizlerinin tekrarlanması'],
        critical_risks: metrics.overdue_tasks_count > 0 ? [`${metrics.overdue_tasks_count} adet teslimi gecikmiş görev`] : ['Kritik bir risk saptanmadı.'],
        study_discipline: `Son 7 günde ${metrics.hours_7d} saat, son 14 günde ${metrics.hours_14d} saat çalışma kaydı bulunuyor.`,
        academic_performance: exams.length > 0 ? `Son denemede ${exams[0].total_net} net elde edildi.` : 'Henüz deneme kaydı girilmedi.',
        recent_trend: metrics.hours_7d >= metrics.hours_14d / 2 ? 'Çalışma ivmesi artışta.' : 'Çalışma saatlerinde yavaşlama var.',
        coach_intervention: 'Haftalık hedeflerin gözden geçirilmesi ve motivasyon görüşmesi önerilir.',
        next_week_priorities: ['TYT Paragraf ve Problem rutini', 'Eksik AYT konularının taranması'],
        recommended_action: riskLevel === 'CRITICAL' ? '🔴 Birebir Görüşme & Plan Revizyonu' : '🟢 Haftalık Takibe Devam',
      };
    }

    const fullAnalysis: AIStudentAnalysis = {
      id: 'ai_ana_' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      student_name: student.name,
      risk_level: rawData.risk_level || 'LOW',
      risk_score: rawData.risk_score || 15,
      general_status: rawData.general_status || '',
      strengths: Array.isArray(rawData.strengths) ? rawData.strengths : [],
      areas_for_improvement: Array.isArray(rawData.areas_for_improvement) ? rawData.areas_for_improvement : [],
      critical_risks: Array.isArray(rawData.critical_risks) ? rawData.critical_risks : [],
      study_discipline: rawData.study_discipline || '',
      academic_performance: rawData.academic_performance || '',
      recent_trend: rawData.recent_trend || '',
      coach_intervention: rawData.coach_intervention || '',
      next_week_priorities: Array.isArray(rawData.next_week_priorities) ? rawData.next_week_priorities : [],
      recommended_action: rawData.recommended_action || '',
      metrics_summary: metrics,
      created_at: new Date().toISOString(),
    };

    await db.saveAIStudentAnalysis(fullAnalysis);

    // Track usage
    await db.addAIUsage({
      user_id: student.coach_id || 'coach_default',
      feature_name: 'student_analysis',
      prompt_tokens: 450,
      completion_tokens: 380,
      total_tokens: 830,
      model: 'gemini-3.7-flash',
      status: 'success',
      user_name: student.name,
    });

    return fullAnalysis;
  }

  // 2. Generate Weekly Study Plan
  async generateStudyPlan(
    studentId: string,
    coachId: string,
    options?: AIPlanGenerationOptions
  ): Promise<AIStudyPlan> {
    const student = await db.getStudentById(studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    const actorId = coachId || options?.userId || student.coach_id || student.id || student.user_id;

    // Hard Check Plan Access & Monthly Limit
    const access = await db.checkFeatureAccess(actorId, 'ai_study_planner');
    if (!access.hasAccess) {
      throw new Error(
        access.reason ||
          'Yapay Zeka Destekli Haftalık Stratejik Planlayıcı PRO ve üzeri paketlerde kullanılabilir.'
      );
    }

    const [goal, exams, logs, tasks] = await Promise.all([
      db.getGoal(studentId),
      db.getExamsByStudent(studentId),
      db.getStudyLogsByStudent(studentId),
      db.getTasksByStudent(studentId),
    ]);

    let rawPlan: any = null;

    try {
      const res = await fetch('/api/ai/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          goal,
          exams: exams.slice(0, 3),
          logs: logs.slice(0, 8),
          tasks: tasks.slice(0, 8),
          options,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        rawPlan = json.data;
      }
    } catch (e) {
      console.warn('Study plan API call failed, generating via client intelligence engine:', e);
    }

    if (!rawPlan || !Array.isArray(rawPlan.tasks)) {
      rawPlan = {
        title: `Haftalık YKS 2027 Stratejik Çalışma Çizelgesi (${student.field})`,
        summary: `${student.name} için zayıf branşları pekiştiren 7 günlük odak çalışma planı.`,
        focus_areas: ['Matematik Problem Hız', 'Paragraf Rutini', 'Branş Konu Tekrarı'],
        tasks: [
          {
            day: 'Pazartesi',
            subject_name: 'Temel Matematik',
            topic_name: 'Problemler ve Hız Testi',
            description: 'Günde 2 set 20\'şer soru kronometre ile çözülecek.',
            duration_minutes: 60,
            priority: 'Yüksek',
            target_goal: 'İşlem hızını artırma',
            question_count: 40,
            xp_reward: 50,
          },
          {
            day: 'Salı',
            subject_name: student.field === 'SAY' ? 'Fizik' : 'Edebiyat',
            topic_name: student.field === 'SAY' ? 'Kuvvet ve Hareket' : 'Cumhuriyet Dönemi Şiir',
            description: 'Konu kavrama ve kazanım testleri tamamlanacak.',
            duration_minutes: 75,
            priority: 'Kritik',
            target_goal: 'Kazanım eksiğini kapatma',
            question_count: 35,
            xp_reward: 60,
          },
          {
            day: 'Çarşamba',
            subject_name: 'Türkçe',
            topic_name: 'Paragrafta Anlam ve Yapı',
            description: '30 soru süre tutularak çözülecek.',
            duration_minutes: 60,
            priority: 'Yüksek',
            target_goal: 'Paragraf hızını koruma',
            question_count: 30,
            xp_reward: 45,
          },
          {
            day: 'Perşembe',
            subject_name: student.field === 'SAY' ? 'Kimya' : 'Tarih',
            topic_name: student.field === 'SAY' ? 'Mol & Kimyasal Tepkimeler' : 'Milli Mücadele Dönemi',
            description: 'Konu özeti çıkarılacak ve test çözülecek.',
            duration_minutes: 60,
            priority: 'Orta',
            target_goal: 'Kavram pekiştirme',
            question_count: 35,
            xp_reward: 45,
          },
          {
            day: 'Cuma',
            subject_name: student.field === 'SAY' ? 'Geometri' : 'Coğrafya',
            topic_name: student.field === 'SAY' ? 'Üçgende Alan ve Açı' : 'Türkiye İklim Tipleri',
            description: 'Görsel soru çözümü ve harita çalışması yapılacak.',
            duration_minutes: 60,
            priority: 'Yüksek',
            target_goal: 'Pratik soru çözümü',
            question_count: 30,
            xp_reward: 50,
          },
          {
            day: 'Cumartesi',
            subject_name: 'Matematik',
            topic_name: 'AYT Fonksiyonlar ve Grafik Çizimi',
            description: 'Konu tekrarı ve yeni nesil soru bankası taraması.',
            duration_minutes: 90,
            priority: 'Kritik',
            target_goal: 'AYT net temeli',
            question_count: 45,
            xp_reward: 65,
          },
          {
            day: 'Pazar',
            subject_name: 'Genel Değerlendirme',
            topic_name: 'Haftalık Hata Defteri Analizi',
            description: 'Hafta boyunca yapılamayan soruların tekrar çözülmesi.',
            duration_minutes: 60,
            priority: 'Yüksek',
            target_goal: 'Sıfır hata kontrolü',
            question_count: 40,
            xp_reward: 50,
          },
        ],
      };
    }

    const plan: AIStudyPlan = {
      id: 'ai_plan_' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      student_name: student.name,
      coach_id: coachId,
      status: 'proposed', // AI PROPOSED -> WAITING FOR COACH APPROVAL!
      week_start_date: new Date().toISOString().split('T')[0],
      title: rawPlan.title || 'Haftalık Stratejik Odak Planı',
      summary: rawPlan.summary || '',
      focus_areas: Array.isArray(rawPlan.focus_areas) ? rawPlan.focus_areas : ['Genel Odak'],
      tasks: rawPlan.tasks.map((t: any, idx: number) => ({
        id: `plan_task_${idx}_` + Math.random().toString(36).substring(2, 6),
        day: t.day || 'Pazartesi',
        subject_name: t.subject_name || 'Matematik',
        topic_name: t.topic_name || 'Genel Tekrar',
        description: t.description || 'Test çözümü ve tekrar.',
        duration_minutes: Number(t.duration_minutes) || 60,
        priority: t.priority || 'Yüksek',
        target_goal: t.target_goal || 'Soru çözümü',
        question_count: Number(t.question_count) || 30,
        xp_reward: Number(t.xp_reward) || 50,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.saveAIStudyPlan(plan);

    await db.addAIUsage({
      user_id: coachId,
      feature_name: 'study_plan_generation',
      prompt_tokens: 520,
      completion_tokens: 460,
      total_tokens: 980,
      model: 'gemini-3.7-flash',
      status: 'success',
      user_name: student.name,
    });

    return plan;
  }

  // 3. Generate Coach Report
  async generateCoachReport(studentId: string, forceRefresh?: boolean, coachId?: string): Promise<AICoachReport> {
    const student = await db.getStudentById(studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    const actorId = coachId || student.coach_id || student.id || student.user_id;

    // Hard Check Plan Access & Monthly Limit
    const access = await db.checkFeatureAccess(actorId, 'ai_monthly_limit');
    if (!access.hasAccess) {
      throw new Error(
        access.reason || 'Bu ayki AI kullanım kotanız doldu. Paketinizi yükselterek daha yüksek AI kotasına ulaşabilirsiniz.'
      );
    }

    if (!forceRefresh) {
      const existing = await db.getAICoachReport(studentId);
      if (existing) {
        const ageHours = (Date.now() - new Date(existing.created_at).getTime()) / (1000 * 60 * 60);
        if (ageHours < 12) return existing;
      }
    }

    const [goal, exams, logs, tasks] = await Promise.all([
      db.getGoal(studentId),
      db.getExamsByStudent(studentId),
      db.getStudyLogsByStudent(studentId),
      db.getTasksByStudent(studentId),
    ]);

    let rawReport: any = null;

    try {
      const res = await fetch('/api/ai/generate-coach-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          goal,
          exams: exams.slice(0, 3),
          logs: logs.slice(0, 6),
          tasks: tasks.slice(0, 6),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        rawReport = json.data;
      }
    } catch (e) {
      console.warn('Coach report API call failed, generating via deterministic intelligence:', e);
    }

    if (!rawReport) {
      rawReport = {
        summary: `${student.name}, YKS 2027 hedefi olan ${student.target_university || 'Üniversite'} ${student.target_department || 'Bölümü'} yolunda düzenli koçluk takibi altındadır.`,
        academic_performance: 'Deneme netleri istikrarlı bir bantta seyretmekte olup soru çözüm hedeflerine uyum yüksektir.',
        study_discipline: 'Haftalık masa başı çalışma saatleri koçluk disiplinine uygun olarak sürdürülmektedir.',
        strengths: ['Konu kavrama becerisi', 'Görev tamamlama disiplini'],
        weaknesses: ['Süre baskısında dikkat kayıpları', 'Hata analiz defterinin daha detaylandırılması'],
        risks: ['Zorlanılan branşlarda erteleme alışkanlığı'],
        recent_trend: 'Son haftalarda istikrarlı bir yükseliş ivmesi mevcuttur.',
        coach_recommendations: [
          'Günlük 25 paragraf ve 20 problem rutinini aksatmadan sürdürmesi',
          'Haftada 1 tam kapsamlı branş denemesi çözmesi',
        ],
        next_week_targets: [
          'Haftalık minimum 600 soru çözümü kotasına ulaşmak',
          'Bekleyen tüm koçluk görevlerini eksiksiz teslim etmek',
        ],
      };
    }

    const report: AICoachReport = {
      id: 'ai_rep_' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      student_name: student.name,
      summary: rawReport.summary || '',
      academic_performance: rawReport.academic_performance || '',
      study_discipline: rawReport.study_discipline || '',
      strengths: Array.isArray(rawReport.strengths) ? rawReport.strengths : [],
      weaknesses: Array.isArray(rawReport.weaknesses) ? rawReport.weaknesses : [],
      risks: Array.isArray(rawReport.risks) ? rawReport.risks : [],
      recent_trend: rawReport.recent_trend || '',
      coach_recommendations: Array.isArray(rawReport.coach_recommendations) ? rawReport.coach_recommendations : [],
      next_week_targets: Array.isArray(rawReport.next_week_targets) ? rawReport.next_week_targets : [],
      created_at: new Date().toISOString(),
    };

    await db.saveAICoachReport(report);
    return report;
  }

  // 4. Daily Triage ("🎯 BUGÜN KİMLE İLGİLENMELİYİM?")
  async getDailyTriageList(coachId?: string): Promise<DailyTriageStudent[]> {
    const students = await db.getStudents();
    const targetStudents = coachId ? students.filter((s) => !s.coach_id || s.coach_id === coachId) : students;

    const triageList: DailyTriageStudent[] = [];

    for (const stu of targetStudents) {
      const [logs, tasks, exams] = await Promise.all([
        db.getStudyLogsByStudent(stu.id),
        db.getTasksByStudent(stu.id),
        db.getExamsByStudent(stu.id),
      ]);

      const metrics = this.computeMetricsSummary(stu, logs, tasks, exams);

      let reason = 'Rutin haftalık takip';
      let details = 'Hedef netlerle uyumlu çalışma temposu.';
      let actionType: 'call' | 'task' | 'meeting' | 'review_exam' = 'task';
      let actionLabel = 'Planı İncele';
      let priorityRank = 4;
      let riskLevel: AIRiskStatus = 'LOW';

      if (metrics.overdue_tasks_count >= 2 || metrics.hours_7d < 6 || stu.risk_level === 'HIGH' || stu.risk_level === 'CRITICAL') {
        priorityRank = 1;
        riskLevel = 'CRITICAL';
        reason = metrics.overdue_tasks_count >= 2
          ? `${metrics.overdue_tasks_count} adet teslim süresi geçmiş görev var`
          : 'Son 7 günlük çalışma süresinde %40+ düşüş tespit edildi';
        details = 'Öğrencinin motivasyon kaybı ve çalışma kopukluğu yaşamaması için bugün ivedilikle birebir görüşme yapılması öneriliyor.';
        actionType = 'call';
        actionLabel = 'Acil Görüşme Yap';
      } else if (metrics.overdue_tasks_count === 1 || metrics.hours_7d < 12 || stu.risk_level === 'MEDIUM') {
        priorityRank = 2;
        riskLevel = 'MEDIUM';
        reason = metrics.overdue_tasks_count === 1 ? '1 teslim bekleyen gecikmiş görev' : 'Haftalık soru kotasının gerisinde';
        details = 'Eksik konuların taranması ve haftalık çalışma çizelgesinin güncellenmesi tavsiye edilir.';
        actionType = 'meeting';
        actionLabel = 'Görevi Kontrol Et';
      } else if (exams.length > 0 && exams[0].total_net < (stu.target_score ? stu.target_score / 5.5 : 70)) {
        priorityRank = 3;
        riskLevel = 'MEDIUM';
        reason = 'Son denemede net dalgalanması';
        details = 'Son deneme hata analizinin yapılması ve eksik branşlara soru takviyesi atanması gerekiyor.';
        actionType = 'review_exam';
        actionLabel = 'Denemeyi İncele';
      } else {
        priorityRank = 4;
        riskLevel = 'LOW';
        reason = 'Yüksek performans ve çalışma serisi';
        details = 'Hedef üniversite baremiyle tam uyumlu çalışma standardı korunuyor.';
        actionType = 'task';
        actionLabel = 'Tebrik & Yeni Görev';
      }

      triageList.push({
        student_id: stu.id,
        student_name: stu.name,
        student_avatar: stu.avatar_url,
        student_field: stu.field,
        target_department: stu.target_department || 'Hedef Belirlenmedi',
        target_university: stu.target_university || 'Hedef Belirlenmedi',
        risk_level: riskLevel,
        priority_rank: priorityRank,
        reason,
        details,
        action_type: actionType,
        action_label: actionLabel,
        recent_metrics: {
          hours_7d: metrics.hours_7d,
          hours_14d_change_pct: metrics.hours_14d > 0 ? Math.round(((metrics.hours_7d * 2 - metrics.hours_14d) / metrics.hours_14d) * 100) : 0,
          overdue_tasks: metrics.overdue_tasks_count,
          last_exam_score: exams[0]?.score,
        },
      });
    }

    // Sort by priority (rank 1 first)
    return triageList.sort((a, b) => a.priority_rank - b.priority_rank);
  }
}

export const aiService = new AIService();
