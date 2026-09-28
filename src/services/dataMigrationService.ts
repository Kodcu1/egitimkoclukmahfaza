import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/db';

export interface MigrationSummaryRow {
  entity: string;
  localCount: number;
  migratedCount: number;
  failedCount: number;
  unmatchedCount: number;
  duplicateCount: number;
}

export interface DataMigrationReport {
  timestamp: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NO_LOCAL_DATA' | 'AUTH_REQUIRED' | 'FAILED';
  summary: MigrationSummaryRow[];
  totalLocal: number;
  totalMigrated: number;
  totalFailed: number;
  totalUnmatched: number;
  totalDuplicate: number;
  details: string[];
}

const MIGRATION_REPORT_KEY = 'mahfaza_data_migration_report';
const FOUNDER_COACH_ID = '2b1feeed-890a-430a-8360-dd103034649b';

function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function parseLocalArray<T = any>(key: string): T[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem('mahfaza_db_' + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class DataMigrationService {
  /**
   * Scans local storage and generates the current counts without altering data.
   */
  static getLocalCounts(): Record<string, number> {
    return {
      tasks: parseLocalArray('tasks').length,
      study_logs: parseLocalArray('studyLogs').length,
      exam_results: parseLocalArray('exams').length,
      messages: parseLocalArray('messages').length,
      xp_transactions: parseLocalArray('xpTransactions').length,
      notifications: parseLocalArray('notifications').length,
      rewards: parseLocalArray('rewards').length,
      reward_requests: parseLocalArray('rewardRequests').length,
      student_badges: parseLocalArray('studentBadges').length,
      approvals: parseLocalArray('xpApprovals').length,
    };
  }

  /**
   * Reads saved migration report or generates a live audit report.
   */
  static getLatestReport(): DataMigrationReport | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(MIGRATION_REPORT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  /**
   * Safely migrates local storage data to Supabase while preserving all existing IDs,
   * matching real student & coach UUIDs, and preventing data loss or duplication.
   */
  static async runMigration(): Promise<DataMigrationReport> {
    const report: DataMigrationReport = {
      timestamp: new Date().toISOString(),
      status: 'IN_PROGRESS',
      summary: [],
      totalLocal: 0,
      totalMigrated: 0,
      totalFailed: 0,
      totalUnmatched: 0,
      totalDuplicate: 0,
      details: [],
    };

    if (!isSupabaseConfigured || !supabase) {
      report.status = 'FAILED';
      report.details.push('Supabase yapılandırması bulunamadı.');
      return report;
    }

    try {
      // 1. Fetch valid students and profiles to establish real UUID maps
      const [stuRes, profRes] = await Promise.all([
        supabase.from('students').select('id, user_id, coach_id, name, email'),
        supabase.from('profiles').select('id, user_id, role, name, email'),
      ]);

      const validStudents = stuRes.data || [];
      const validProfiles = profRes.data || [];

      const studentIdSet = new Set<string>();
      const studentUserIdMap = new Map<string, string>(); // user_id -> student.id
      validStudents.forEach((s) => {
        studentIdSet.add(s.id);
        if (s.user_id) studentUserIdMap.set(s.user_id, s.id);
      });

      const coachIdSet = new Set<string>();
      validProfiles.forEach((p) => {
        if (p.role === 'coach' || p.role === 'head_coach' || p.id === FOUNDER_COACH_ID) {
          coachIdSet.add(p.id);
          if (p.user_id) coachIdSet.add(p.user_id);
        }
      });
      coachIdSet.add(FOUNDER_COACH_ID);

      const resolveStudentId = (idCandidate?: string): string | null => {
        if (!idCandidate) return null;
        if (studentIdSet.has(idCandidate)) return idCandidate;
        if (studentUserIdMap.has(idCandidate)) return studentUserIdMap.get(idCandidate)!;
        return null;
      };

      const resolveCoachId = (coachCandidate?: string): string => {
        if (coachCandidate && coachIdSet.has(coachCandidate) && isUUID(coachCandidate)) {
          return coachCandidate;
        }
        return FOUNDER_COACH_ID;
      };

      // 2. Migration helper for each entity
      const migrateEntity = async (
        entityName: string,
        localItems: any[],
        processItem: (item: any) => Promise<'MIGRATED' | 'FAILED' | 'UNMATCHED' | 'DUPLICATE'>
      ): Promise<MigrationSummaryRow> => {
        const row: MigrationSummaryRow = {
          entity: entityName,
          localCount: localItems.length,
          migratedCount: 0,
          failedCount: 0,
          unmatchedCount: 0,
          duplicateCount: 0,
        };

        for (const item of localItems) {
          try {
            const outcome = await processItem(item);
            if (outcome === 'MIGRATED') row.migratedCount++;
            else if (outcome === 'DUPLICATE') row.duplicateCount++;
            else if (outcome === 'UNMATCHED') row.unmatchedCount++;
            else row.failedCount++;
          } catch (err: any) {
            row.failedCount++;
            report.details.push(`[${entityName}] Hata: ${err?.message || err}`);
          }
        }

        return row;
      };

      // --- TASKS ---
      const localTasks = parseLocalArray('tasks');
      const taskRow = await migrateEntity('tasks', localTasks, async (task) => {
        const studentId = resolveStudentId(task.student_id);
        if (!studentId) return 'UNMATCHED';

        const coachId = resolveCoachId(task.coach_id);
        const recordId = isUUID(task.id) ? task.id : undefined;

        // Check if task already exists
        let existingQuery = supabase.from('tasks').select('id');
        if (recordId) {
          existingQuery = existingQuery.eq('id', recordId);
        } else {
          existingQuery = existingQuery.eq('student_id', studentId).eq('title', task.title);
        }
        const { data: existing } = await existingQuery.maybeSingle();
        if (existing) return 'DUPLICATE';

        const priorityMap: Record<string, string> = {
          low: 'Düşük',
          medium: 'Orta',
          high: 'Yüksek',
          urgent: 'Acil',
          'Düşük': 'Düşük',
          'Orta': 'Orta',
          'Yüksek': 'Yüksek',
          'Acil': 'Acil',
        };
        const mappedPriority = priorityMap[task.priority] || 'Orta';

        const payload: any = {
          student_id: studentId,
          coach_id: coachId,
          title: task.title,
          description: task.description || '',
          due_date: task.due_date || task.dueDate || new Date().toISOString(),
          priority: mappedPriority,
          status: task.status || 'Bekliyor',
          xp_reward: typeof task.xp_reward === 'number' ? task.xp_reward : 50,
          completed_at: task.completed_at || null,
          created_at: task.created_at || new Date().toISOString(),
        };
        if (recordId) payload.id = recordId;

        const { error } = await supabase.from('tasks').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(taskRow);

      // --- STUDY LOGS ---
      const localLogs = parseLocalArray('studyLogs');
      const logRow = await migrateEntity('study_logs', localLogs, async (log) => {
        const studentId = resolveStudentId(log.student_id);
        if (!studentId) return 'UNMATCHED';

        const recordId = isUUID(log.id) ? log.id : undefined;
        let existingQuery = supabase.from('study_logs').select('id');
        if (recordId) {
          existingQuery = existingQuery.eq('id', recordId);
        } else {
          existingQuery = existingQuery
            .eq('student_id', studentId)
            .eq('subject_name', log.subject || log.subject_name || 'Ders')
            .eq('topic_name', log.topic || log.topic_name || 'Konu')
            .eq('study_date', log.date || log.study_date || new Date().toISOString().split('T')[0]);
        }
        const { data: existing } = await existingQuery.maybeSingle();
        if (existing) return 'DUPLICATE';

        const payload: any = {
          student_id: studentId,
          exam_type: log.exam_type || 'TYT',
          test_name: log.test_name || log.subject || 'Çalışma',
          subject_name: log.subject || log.subject_name || 'Ders',
          topic_name: log.topic || log.topic_name || 'Konu',
          subtopic_name: log.subtopic_name || null,
          duration_minutes: log.duration_minutes || log.duration || 0,
          question_count: log.question_count || log.questions_solved || 0,
          correct_count: log.correct_count || 0,
          wrong_count: log.wrong_count || 0,
          empty_count: log.empty_count || 0,
          net_count: log.net_count || Math.max(0, (log.correct_count || 0) - (log.wrong_count || 0) * 0.25),
          study_date: log.date || log.study_date || new Date().toISOString().split('T')[0],
          notes: log.notes || null,
          created_at: log.created_at || new Date().toISOString(),
        };
        if (recordId) payload.id = recordId;

        const { error } = await supabase.from('study_logs').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(logRow);

      // --- EXAM RESULTS ---
      const localExams = parseLocalArray('exams');
      const examRow = await migrateEntity('exam_results', localExams, async (exam) => {
        const studentId = resolveStudentId(exam.student_id);
        if (!studentId) return 'UNMATCHED';

        const recordId = isUUID(exam.id) ? exam.id : undefined;
        let existingQuery = supabase.from('exam_results').select('id');
        if (recordId) {
          existingQuery = existingQuery.eq('id', recordId);
        } else {
          existingQuery = existingQuery
            .eq('student_id', studentId)
            .eq('exam_name', exam.title || exam.exam_name || 'Deneme')
            .eq('exam_date', exam.date || exam.exam_date || new Date().toISOString().split('T')[0]);
        }
        const { data: existing } = await existingQuery.maybeSingle();
        if (existing) return 'DUPLICATE';

        const payload: any = {
          student_id: studentId,
          exam_type: exam.exam_type || exam.type || 'TYT',
          exam_name: exam.title || exam.exam_name || 'Deneme',
          exam_date: exam.date || exam.exam_date || new Date().toISOString().split('T')[0],
          total_questions: exam.total_questions || (exam.total_correct || 0) + (exam.total_wrong || 0) + (exam.total_empty || 0) || 120,
          total_correct: exam.total_correct || 0,
          total_wrong: exam.total_wrong || 0,
          total_empty: exam.total_empty || 0,
          total_net: exam.total_net || (exam.total_correct || 0) - (exam.total_wrong || 0) * 0.25,
          score: exam.score || null,
          notes: exam.notes || null,
          created_at: exam.created_at || new Date().toISOString(),
        };
        if (recordId) payload.id = recordId;

        const { error } = await supabase.from('exam_results').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(examRow);

      // --- MESSAGES ---
      const localMessages = parseLocalArray('messages');
      const msgRow = await migrateEntity('messages', localMessages, async (msg) => {
        if (!msg.content || !msg.sender_id || !msg.receiver_id) return 'UNMATCHED';

        const { data: existing } = await supabase.from('messages').select('id').eq('id', msg.id).maybeSingle();
        if (existing) return 'DUPLICATE';

        const payload = {
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          sender_name: msg.sender_name || 'Kullanıcı',
          sender_role: msg.sender_role || 'student',
          content: msg.content,
          is_read: msg.is_read || false,
          attachment_url: msg.attachment_url || null,
          attachment_name: msg.attachment_name || null,
          created_at: msg.created_at || new Date().toISOString(),
        };

        const { error } = await supabase.from('messages').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(msgRow);

      // --- XP TRANSACTIONS ---
      const localXp = parseLocalArray('xpTransactions');
      const xpRow = await migrateEntity('xp_transactions', localXp, async (tx) => {
        const studentId = resolveStudentId(tx.student_id);
        if (!studentId) return 'UNMATCHED';

        const recordId = isUUID(tx.id) ? tx.id : undefined;
        let existingQuery = supabase.from('xp_transactions').select('id');
        if (recordId) {
          existingQuery = existingQuery.eq('id', recordId);
        } else if (tx.source_id) {
          existingQuery = existingQuery.eq('student_id', studentId).eq('source_id', tx.source_id);
        } else {
          existingQuery = existingQuery.eq('student_id', studentId).eq('reason', tx.reason).eq('amount', tx.amount);
        }
        const { data: existing } = await existingQuery.maybeSingle();
        if (existing) return 'DUPLICATE';

        const payload: any = {
          student_id: studentId,
          amount: tx.amount,
          reason: tx.reason || 'Çalışma XP',
          source_type: tx.source_type || 'manual',
          source_id: tx.source_id || null,
          created_at: tx.created_at || new Date().toISOString(),
        };
        if (recordId) payload.id = recordId;

        const { error } = await supabase.from('xp_transactions').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(xpRow);

      // --- NOTIFICATIONS ---
      const localNotifs = parseLocalArray('notifications');
      const notifRow = await migrateEntity('notifications', localNotifs, async (notif) => {
        const targetUserId = notif.user_id;
        if (!targetUserId || !isUUID(targetUserId)) return 'UNMATCHED';

        const recordId = isUUID(notif.id) ? notif.id : undefined;
        let existingQuery = supabase.from('notifications').select('id');
        if (recordId) {
          existingQuery = existingQuery.eq('id', recordId);
        } else {
          existingQuery = existingQuery.eq('user_id', targetUserId).eq('title', notif.title);
        }
        const { data: existing } = await existingQuery.maybeSingle();
        if (existing) return 'DUPLICATE';

        const payload: any = {
          user_id: targetUserId,
          title: notif.title,
          message: notif.message,
          type: notif.type || 'info',
          is_read: notif.is_read || false,
          link: notif.link || null,
          created_at: notif.created_at || new Date().toISOString(),
        };
        if (recordId) payload.id = recordId;

        const { error } = await supabase.from('notifications').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(notifRow);

      // --- REWARDS ---
      const localRewards = parseLocalArray('rewards');
      const rewRow = await migrateEntity('rewards', localRewards, async (rew) => {
        const coachId = resolveCoachId(rew.coach_id);
        const recordId = isUUID(rew.id) ? rew.id : undefined;

        let existingQuery = supabase.from('rewards').select('id');
        if (recordId) {
          existingQuery = existingQuery.eq('id', recordId);
        } else {
          existingQuery = existingQuery.eq('title', rew.title);
        }
        const { data: existing } = await existingQuery.maybeSingle();
        if (existing) return 'DUPLICATE';

        const payload: any = {
          coach_id: coachId,
          title: rew.title,
          description: rew.description || '',
          cost_xp: rew.cost_xp || 100,
          category: rew.category || 'Genel',
          icon: rew.icon || 'Gift',
          stock: typeof rew.stock === 'number' ? rew.stock : 10,
          is_active: rew.is_active !== false,
          created_at: rew.created_at || new Date().toISOString(),
        };
        if (recordId) payload.id = recordId;

        const { error } = await supabase.from('rewards').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(rewRow);

      // --- REWARD REQUESTS ---
      const localReqs = parseLocalArray('rewardRequests');
      const reqRow = await migrateEntity('reward_requests', localReqs, async (req) => {
        const studentId = resolveStudentId(req.student_id);
        if (!studentId || !isUUID(req.reward_id)) return 'UNMATCHED';

        const recordId = isUUID(req.id) ? req.id : undefined;
        let existingQuery = supabase.from('reward_requests').select('id');
        if (recordId) {
          existingQuery = existingQuery.eq('id', recordId);
        } else {
          existingQuery = existingQuery.eq('student_id', studentId).eq('reward_id', req.reward_id);
        }
        const { data: existing } = await existingQuery.maybeSingle();
        if (existing) return 'DUPLICATE';

        const payload: any = {
          student_id: studentId,
          reward_id: req.reward_id,
          status: req.status || 'pending',
          coach_notes: req.coach_notes || null,
          requested_at: req.requested_at || new Date().toISOString(),
          processed_at: req.processed_at || null,
        };
        if (recordId) payload.id = recordId;

        const { error } = await supabase.from('reward_requests').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(reqRow);

      // --- STUDENT BADGES ---
      const localBadges = parseLocalArray('studentBadges');
      const badgeRow = await migrateEntity('student_badges', localBadges, async (sb) => {
        const studentId = resolveStudentId(sb.student_id);
        if (!studentId || !sb.badge_id) return 'UNMATCHED';

        const { data: existing } = await supabase
          .from('student_badges')
          .select('id')
          .eq('student_id', studentId)
          .eq('badge_id', sb.badge_id)
          .maybeSingle();
        if (existing) return 'DUPLICATE';

        const payload: any = {
          student_id: studentId,
          badge_id: sb.badge_id,
          earned_at: sb.earned_at || new Date().toISOString(),
        };
        if (isUUID(sb.id)) payload.id = sb.id;

        const { error } = await supabase.from('student_badges').upsert([payload]);
        return error ? 'FAILED' : 'MIGRATED';
      });
      report.summary.push(badgeRow);

      // Calculate totals
      report.summary.forEach((r) => {
        report.totalLocal += r.localCount;
        report.totalMigrated += r.migratedCount;
        report.totalFailed += r.failedCount;
        report.totalUnmatched += r.unmatchedCount;
        report.totalDuplicate += r.duplicateCount;
      });

      report.status = report.totalLocal === 0 ? 'NO_LOCAL_DATA' : 'COMPLETED';

      // Persist migration report in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(MIGRATION_REPORT_KEY, JSON.stringify(report));
      }
    } catch (err: any) {
      report.status = 'FAILED';
      report.details.push(`Genel migrasyon hatası: ${err?.message || err}`);
    }

    return report;
  }
}
