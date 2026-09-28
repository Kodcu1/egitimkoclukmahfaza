import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExamAnalysisPdfData } from './ExamAnalysisData';

/**
 * Yedek yöntem (Fallback):
 * react-pdf kullanılamazsa jsPDF + jspdf-autotable ile aynı raporu oluşturur.
 * Hem tekil hem de toplu (batch) öğrenci dizisini destekler.
 */
export function generateFallbackPdf(dataOrList: ExamAnalysisPdfData | ExamAnalysisPdfData[]): {
  blobUrl: string;
  save: (filename?: string) => void;
  blob: Blob;
} {
  const reports: ExamAnalysisPdfData[] = Array.isArray(dataOrList) ? dataOrList : [dataOrList];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  reports.forEach((data, index) => {
    if (index > 0) {
      doc.addPage();
    }

    let y = margin;

    // 1. Üst Vurgu Çizgisi & Kurum Başlığı
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 2, 'F');
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('MAHFAZA.CO • EGITIM KOCLUGU', margin, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`${data.ogrenci.ad} • ${data.sinav.ad}`, pageWidth - margin, y, { align: 'right' });

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Yapay Zeka Destekli Deneme Sinavi ve Konu Analiz Raporu', margin, y);
    doc.text(data.sinav.tarih, pageWidth - margin, y, { align: 'right' });

    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // 2. Bilgi Çubuğu
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Ogrenci:', margin + 4, y + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.ogrenci.ad, margin + 20, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Sinif:', margin + 65, y + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.ogrenci.sinif, margin + 76, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Sinav:', margin + 115, y + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.sinav.ad, margin + 128, y + 6.5);

    y += 16;

    // 3. Genel Performans Göstergeleri (5 Kutu)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Genel Performans Gostergeleri', margin, y);
    y += 4;

    const cardWidth = (contentWidth - 16) / 5;
    const cards = [
      { label: 'TOPLAM NET', val: `${data.genel.net}`, bg: [239, 246, 255], border: [191, 219, 254], txt: [29, 78, 216] },
      { label: 'DOGRU', val: `${data.genel.dogru}`, bg: [236, 253, 245], border: [167, 243, 208], txt: [4, 120, 87] },
      { label: 'YANLIS', val: `${data.genel.yanlis}`, bg: [254, 242, 242], border: [254, 202, 202], txt: [185, 28, 28] },
      { label: 'BOS', val: `${data.genel.bos}`, bg: [255, 251, 235], border: [253, 230, 138], txt: [180, 83, 9] },
      { label: 'BASARI', val: `%${data.genel.yuzde}`, bg: [245, 243, 255], border: [221, 214, 254], txt: [109, 40, 217] },
    ];

    cards.forEach((c, i) => {
      const cx = margin + i * (cardWidth + 4);
      doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
      doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
      doc.roundedRect(cx, y, cardWidth, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cx + cardWidth / 2, y + 4.5, { align: 'center' });

      doc.setFontSize(11);
      doc.setTextColor(c.txt[0], c.txt[1], c.txt[2]);
      doc.text(c.val, cx + cardWidth / 2, y + 10.5, { align: 'center' });
    });

    y += 20;

    // 4. Konu Bazlı Analiz Tablosu (jspdf-autotable)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Konu & Kazanim Bazli Basari Analizi', margin, y);
    y += 3;

    const tableRows = data.konular.map((k) => [
      k.konuAdi,
      `${k.dogru}`,
      `${k.yanlis}`,
      `${k.bos}`,
      `%${k.oran}`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Konu / Kazanim Basligi', 'Dogru', 'Yanlis', 'Bos', 'Basari Orani']],
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8,
        lineWidth: 0.2,
        lineColor: [226, 232, 240],
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
        lineWidth: 0.2,
        lineColor: [241, 245, 249],
      },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 27, fontStyle: 'bold' },
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 4) {
          const row = data.konular[hookData.row.index];
          if (row) {
            if (row.oran < 50) {
              hookData.cell.styles.textColor = [220, 38, 38]; // Kırmızı
              hookData.cell.styles.fillColor = [254, 226, 226];
            } else if (row.oran < 80) {
              hookData.cell.styles.textColor = [217, 119, 6]; // Turuncu
              hookData.cell.styles.fillColor = [254, 243, 199];
            } else {
              hookData.cell.styles.textColor = [5, 150, 105]; // Yeşil
              hookData.cell.styles.fillColor = [209, 250, 229];
            }
          }
        }
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || y + 50;
    y = finalY + 8;

    // 5. Zaman Analizi & Koç Yorumu
    if (data.ortalamaSure && y < pageHeight - 50) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Zaman & Hiz Analizi: ${data.ortalamaSure}`, margin + 5, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Soru basina dusen ortalama sure ve sinav tamamlama hizi hesaplanmistir.', margin + 5, y + 9);

      y += 16;
    }

    if (y < pageHeight - 40) {
      const coachText = data.kocYorumu || 'Ogrencinin guclu oldugu konular korunurken, %50 altindaki konu basliklarinda soru cozumu onerilmektedir.';
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
      doc.setFillColor(16, 185, 129);
      doc.rect(margin, y, 2.5, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(6, 95, 70);
      doc.text('Koc Degerlendirmesi & Oneri Metni', margin + 6, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      const splitComment = doc.splitTextToSize(coachText, contentWidth - 12);
      doc.text(splitComment.slice(0, 3), margin + 6, y + 12);
    }

    // 6. Sayfa Alt Bilgisi
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - margin - 4, pageWidth - margin, pageHeight - margin - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Mahfaza.co Rehberlik & Kocluk Sistemi', margin, pageHeight - margin);
    doc.text(
      reports.length > 1
        ? `Ogrenci: ${data.ogrenci.ad} (${index + 1}/${reports.length}) • Sayfa ${index + 1} / ${reports.length}`
        : 'Sayfa 1 / 1',
      pageWidth - margin,
      pageHeight - margin,
      { align: 'right' }
    );
  });

  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  const defaultFilename = reports.length > 1
    ? `Mahfaza_Toplu_Sinif_Analiz_${new Date().toISOString().split('T')[0]}.pdf`
    : `${reports[0]?.ogrenci.ad || 'Ogrenci'}_Deneme_Analizi.pdf`;

  return {
    blobUrl,
    blob,
    save: (filename: string = defaultFilename) => {
      doc.save(filename);
    },
  };
}
