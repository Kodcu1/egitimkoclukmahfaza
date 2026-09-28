import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, StudentGoal, ExamResult, StudyLog, Task, StudentBadge } from '../types';
import { formatDateTurkish, formatDurationHours } from './formatters';
import { getLevelInfo } from './calculations';

/**
 * Normalizes Turkish characters to ensure flawless rendering across standard PDF fonts.
 */
export function cleanTurkishText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/â/g, 'a')
    .replace(/Â/g, 'A')
    .replace(/î/g, 'i')
    .replace(/Î/g, 'I')
    .replace(/û/g, 'u')
    .replace(/Û/g, 'U');
}

export interface GenerateReportParams {
  student: Student;
  goal?: StudentGoal | null;
  exams: ExamResult[];
  logs: StudyLog[];
  tasks: Task[];
  badges: StudentBadge[];
}

export async function generateStudentPdfReport({
  student,
  goal,
  exams,
  logs,
  tasks,
  badges,
}: GenerateReportParams): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const levelInfo = getLevelInfo(student.xp);
  const totalQuestions = logs.reduce((acc, curr) => acc + (curr.question_count || 0), 0);
  const totalMinutes = logs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTurkishText('MAHFAZA.CO EGITIM KOCLUK-DANISMANLIK'), 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(cleanTurkishText('YKS 2027 OGRENCI GELISIM VE PERFORMANS RAPORU'), 14, 22);
  doc.text(cleanTurkishText('Slogan: "Planini Kur. Disiplinini Koru. Hedefine Ulas."'), 14, 28);

  const reportDate = formatDateTurkish(new Date().toISOString());
  doc.setFontSize(9);
  doc.text(cleanTurkishText(`Rapor Tarihi: ${reportDate}`), 140, 22);

  // 2. Student Info Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 182, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 182, 38, 3, 3, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTurkishText(student.name), 20, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(cleanTurkishText(`Alan: ${student.field} | Sinif: ${student.grade}`), 20, 57);
  doc.text(cleanTurkishText(`E-posta: ${student.email}`), 20, 63);
  doc.text(cleanTurkishText(`Eslesme Kodu: ${student.match_code}`), 20, 69);

  doc.text(cleanTurkishText(`Hedef: ${goal?.target_university || student.target_university} - ${goal?.target_department || student.target_department}`), 105, 50);
  doc.text(cleanTurkishText(`Hedef Siralama: #${student.target_rank} | Hedef Puan: ${student.target_score}`), 105, 57);
  doc.text(cleanTurkishText(`Seviye: Level ${student.level} (${levelInfo.title}) | Toplam XP: ${student.xp} XP`), 105, 63);
  doc.text(cleanTurkishText(`Risk Durumu: %${student.risk_score} (${student.risk_level})`), 105, 69);

  // 3. KPI Metrics Summary
  autoTable(doc, {
    startY: 85,
    theme: 'grid',
    head: [[cleanTurkishText('Toplam Cozulen Soru'), cleanTurkishText('Toplam Calisma Suresi'), cleanTurkishText('Kayitli Deneme Sayisi'), cleanTurkishText('Kazanilan Rozetler')]],
    body: [
      [
        cleanTurkishText(`${totalQuestions} Soru`),
        cleanTurkishText(formatDurationHours(totalMinutes)),
        cleanTurkishText(`${exams.length} Deneme`),
        cleanTurkishText(`${badges.length} Rozet`),
      ],
    ],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { left: 14, right: 14 },
  });

  // 4. Exams Table
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cleanTurkishText('DENEME SINAVI SONUCLARI'), 14, currentY);

  const examRows = exams.map((ex) => [
    cleanTurkishText(ex.exam_date),
    cleanTurkishText(ex.exam_name),
    cleanTurkishText(ex.exam_type),
    ex.total_correct.toString(),
    ex.total_wrong.toString(),
    ex.total_empty.toString(),
    ex.total_net.toFixed(2),
    ex.score ? ex.score.toFixed(1) : '-',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    theme: 'striped',
    head: [[cleanTurkishText('Tarih'), cleanTurkishText('Deneme Adi'), cleanTurkishText('Tur'), cleanTurkishText('D'), cleanTurkishText('Y'), cleanTurkishText('B'), cleanTurkishText('Net'), cleanTurkishText('Puan')]],
    body: examRows.length > 0 ? examRows : [[cleanTurkishText('Henuz deneme girisi yapilmadi.'), '', '', '', '', '', '', '']],
    headStyles: {
      fillColor: [37, 99, 235], // blue-600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    margin: { left: 14, right: 14 },
  });

  // 5. Tasks Table
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cleanTurkishText('KOCLUK GOREVLERI VE TAKIP'), 14, currentY);

  const taskRows = tasks.map((t) => [
    cleanTurkishText(t.title),
    cleanTurkishText(t.priority),
    cleanTurkishText(formatDateTurkish(t.due_date)),
    cleanTurkishText(t.status),
    cleanTurkishText(`+${t.xp_reward} XP`),
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    theme: 'striped',
    head: [[cleanTurkishText('Gorev'), cleanTurkishText('Oncelik'), cleanTurkishText('Teslim Tarihi'), cleanTurkishText('Durum'), cleanTurkishText('XP')]],
    body: taskRows.length > 0 ? taskRows : [[cleanTurkishText('Kayitli gorev bulunmuyor.'), '', '', '', '']],
    headStyles: {
      fillColor: [79, 70, 229], // indigo-600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    margin: { left: 14, right: 14 },
  });

  // 6. Coach Observation & Feedback Notes (Special Coach Section)
  if (student.coach_notes) {
    currentY = (doc as any).lastAutoTable.finalY + 8;
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(254, 243, 199); // amber-100
    doc.roundedRect(14, currentY, 182, 30, 2, 2, 'F');
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(14, currentY, 182, 30, 2, 2, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text(cleanTurkishText("KOCLUK GOZLEM VE STRATEJI NOTU"), 18, currentY + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(cleanTurkishText(student.coach_notes), 174);
    doc.text(splitNotes, 18, currentY + 14);
  }

  // 7. Footer Note
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      cleanTurkishText(`Mahfaza.co Egitim Kocluk-Danismanlik - YKS 2027 Basari Portali | Sayfa ${i} / ${pageCount}`),
      14,
      290
    );
  }

  // Save PDF
  const filename = `MahfazaCo_GelisimRaporu_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
