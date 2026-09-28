import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { ExamAnalysisPdfData } from './ExamAnalysisData';

// Türkçe karakterleri kusursuz destekleyen Unicode font kaydı (Sistem fontuna güvenilmez)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: 'Roboto',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 9,
    lineHeight: 1.4,
  },
  // Başlık Bölümü
  headerContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '65%',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 8.5,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerStudentName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerMeta: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },

  // Bilgi & Başlık Kartı
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 4,
  },
  infoLabel: {
    fontSize: 8.5,
    color: '#64748B',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 8.5,
    color: '#0F172A',
  },

  // Genel Sonuç Kartları
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardNet: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statCardDogru: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statCardYanlis: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statCardBos: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statCardYuzde: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  statLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  valNet: { color: '#1D4ED8' },
  valDogru: { color: '#047857' },
  valYanlis: { color: '#B91C1C' },
  valBos: { color: '#B45309' },
  valYuzde: { color: '#6D28D9' },

  // Konu Analiz Tablosu
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  colKonu: {
    flex: 5,
    fontSize: 8.5,
  },
  colNum: {
    flex: 1.5,
    textAlign: 'center',
    fontSize: 8.5,
  },
  colOran: {
    flex: 2,
    textAlign: 'right',
    fontSize: 8.5,
    fontWeight: 'bold',
  },

  // Renkli Vurgu Rozetleri
  badgeRed: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeOrange: {
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeGreen: {
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },

  // Zaman Analizi & Koç Yorumu
  dualContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  timeBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
  },
  timeTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284C7',
    marginTop: 2,
  },
  timeDesc: {
    fontSize: 7.5,
    color: '#64748B',
    marginTop: 2,
  },

  coachBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3.5,
    borderLeftColor: '#10B981',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  coachTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 4,
  },
  coachText: {
    fontSize: 8.5,
    color: '#1E293B',
    lineHeight: 1.45,
  },

  // Footer (Sayfa Alt Bilgisi)
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94A3B8',
  },
});

export interface RaporPdfProps {
  data?: ExamAnalysisPdfData;
  reports?: ExamAnalysisPdfData[];
}

export const RaporPdf: React.FC<RaporPdfProps> = ({ data, reports }) => {
  // Hem tekil (data) hem toplu sınıf (reports) listesini destekle
  const studentReports: ExamAnalysisPdfData[] = reports && reports.length > 0
    ? reports
    : data
    ? [data]
    : [];

  const getBadgeStyle = (oran: number) => {
    if (oran < 50) return styles.badgeRed;
    if (oran < 80) return styles.badgeOrange;
    return styles.badgeGreen;
  };

  const docTitle = studentReports.length > 1
    ? `Mahfaza_Toplu_Sinif_Analiz_Raporu`
    : studentReports[0]
    ? `${studentReports[0].ogrenci.ad}_Deneme_Analizi`
    : 'Mahfaza_Deneme_Analizi';

  return (
    <Document title={docTitle} author="Mahfaza.co">
      {studentReports.map((item, index) => (
        <Page key={index} size="A4" style={styles.page}>
          {/* 1. Başlık Bloğu */}
          <View style={styles.headerContainer}>
            <View style={styles.headerLeft}>
              <Text style={styles.brandTitle}>MAHFAZA.CO • EĞİTİM KOÇLUĞU</Text>
              <Text style={styles.brandSubtitle}>
                Yapay Zekâ Destekli Deneme Sınavı ve Konu Analiz Raporu
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerStudentName}>{item.ogrenci.ad}</Text>
              <Text style={styles.headerMeta}>
                {item.ogrenci.sinif} • {item.sinav.ad}
              </Text>
            </View>
          </View>

          {/* 2. Bilgi Çubuğu */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Öğrenci:</Text>
              <Text style={styles.infoValue}>{item.ogrenci.ad}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sınıf:</Text>
              <Text style={styles.infoValue}>{item.ogrenci.sinif}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sınav:</Text>
              <Text style={styles.infoValue}>{item.sinav.ad}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tarih:</Text>
              <Text style={styles.infoValue}>{item.sinav.tarih}</Text>
            </View>
          </View>

          {/* 3. Genel Sonuç Bloğu */}
          <Text style={styles.sectionTitle}>Genel Performans Göstergeleri</Text>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardNet]}>
              <Text style={styles.statLabel}>Toplam Net</Text>
              <Text style={[styles.statValue, styles.valNet]}>{item.genel.net}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardDogru]}>
              <Text style={styles.statLabel}>Doğru</Text>
              <Text style={[styles.statValue, styles.valDogru]}>{item.genel.dogru}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardYanlis]}>
              <Text style={styles.statLabel}>Yanlış</Text>
              <Text style={[styles.statValue, styles.valYanlis]}>{item.genel.yanlis}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBos]}>
              <Text style={styles.statLabel}>Boş</Text>
              <Text style={[styles.statValue, styles.valBos]}>{item.genel.bos}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardYuzde]}>
              <Text style={styles.statLabel}>Başarı %</Text>
              <Text style={[styles.statValue, styles.valYuzde]}>%{item.genel.yuzde}</Text>
            </View>
          </View>

          {/* 4. Konu Bazlı Analiz Tablosu */}
          <Text style={styles.sectionTitle}>Konu & Kazanım Bazlı Başarı Analizi</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colKonu}>Konu / Kazanım Başlığı</Text>
              <Text style={styles.colNum}>Doğru</Text>
              <Text style={styles.colNum}>Yanlış</Text>
              <Text style={styles.colNum}>Boş</Text>
              <Text style={styles.colOran}>Başarı Oranı</Text>
            </View>
            {item.konular.map((konu, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colKonu}>{konu.konuAdi}</Text>
                <Text style={styles.colNum}>{konu.dogru}</Text>
                <Text style={styles.colNum}>{konu.yanlis}</Text>
                <Text style={styles.colNum}>{konu.bos}</Text>
                <View style={styles.colOran}>
                  <Text style={getBadgeStyle(konu.oran)}>%{konu.oran}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 5. Zaman Analizi */}
          {item.ortalamaSure && (
            <View style={styles.dualContainer}>
              <View style={styles.timeBox}>
                <Text style={styles.timeTitle}>Zaman & Hız Analizi</Text>
                <Text style={styles.timeValue}>{item.ortalamaSure}</Text>
                <Text style={styles.timeDesc}>
                  Önerilen ideal süre aralığına uygunluk ve deneme temposu.
                </Text>
              </View>
            </View>
          )}

          {/* 6. Koç Yorumu / Öneri Metni */}
          <View style={styles.coachBox}>
            <Text style={styles.coachTitle}>Koç Değerlendirmesi & Haftalık Eylem Planı</Text>
            <Text style={styles.coachText}>
              {item.kocYorumu ||
                'Öğrencinin güçlü olduğu konular korunurken, %50 altındaki konu başlıklarında soru çözümü ve tekrar planı uygulanmalıdır.'}
            </Text>
          </View>

          {/* 7. Sayfa Alt Bilgisi (Footer) */}
          <View style={styles.footer} fixed>
            <Text>Mahfaza.co Rehberlik & Koçluk Sistemi • {item.sinav.tarih}</Text>
            <Text
              render={({ pageNumber, totalPages }) =>
                studentReports.length > 1
                  ? `Öğrenci: ${item.ogrenci.ad} (${index + 1}/${studentReports.length}) • Sayfa ${pageNumber} / ${totalPages}`
                  : `Sayfa ${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </Page>
      ))}
    </Document>
  );
};
