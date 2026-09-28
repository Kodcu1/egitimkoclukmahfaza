import { YKS_2027_CURRICULUM, CurriculumExam } from './yksCurriculum';
import { TargetExamGroup, ExamType } from '../types';

export const LGS_2027_CURRICULUM: CurriculumExam = {
  id: 'LGS' as any,
  name: 'Liselere Geçiş Sistemi (LGS - 6 Temel MEB Dersi)',
  durationMinutes: 155,
  totalQuestions: 90,
  tests: [
    {
      id: 'lgs_sozel',
      name: 'LGS Sözel Bölüm',
      questionCount: 50,
      subjects: [
        {
          id: 'lgs_turkce',
          name: 'Türkçe',
          defaultQuestionCount: 20,
          topics: [
            { id: 'lt1', name: 'Fiilimsiler (Eylemsiler)', subtopics: ['İsim-Fiil', 'Sıfat-Fiil', 'Zarf-Fiil'] },
            { id: 'lt2', name: 'Sözcükte ve Söz Öbeğinde Anlam', subtopics: ['Gerçek, Mecaz, Terim', 'Deyim ve Atasözleri', 'Söz Sanatları'] },
            { id: 'lt3', name: 'Cümlede Anlam & Kavramlar', subtopics: ['Öznel-Nesnel', 'Neden-Sonuç, Amaç-Sonuç', 'Örtülü Anlam'] },
            { id: 'lt4', name: 'Paragrafta Anlam ve Yapı', subtopics: ['Ana Fikir', 'Yardımcı Fikirler', 'Paragraf Tamamlama / Bölme'] },
            { id: 'lt5', name: 'Cümlenin Ögeleri', subtopics: ['Temel Ögeler', 'Yardımcı Ögeler', 'Vurgu ve Ara Söz'] },
            { id: 'lt6', name: 'Cümle Türleri', subtopics: ['Yüklemin Türüne/Yerine Göre', 'Yapısına Göre Cümleler'] },
            { id: 'lt7', name: 'Fiilde Çatı', subtopics: ['Öznesine Göre Çatı', 'Nesnesine Göre Çatı'] },
            { id: 'lt8', name: 'Yazım Kuralları ve Noktalama', subtopics: ['Büyük Harfler', 'Sayıların ve Eklerin Yazımı', 'Noktalama İşaretleri'] },
            { id: 'lt9', name: 'Metin Türleri ve Söz Sanatları', subtopics: ['Deneme, Makale, Fıkra, Anı', 'Benzetme, Kişileştirme, Tezat, Abartma'] },
            { id: 'lt10', name: 'Sözel Mantık ve Muhakeme', subtopics: ['Tablo / Grafik Okuma', 'Sıralama ve Yerleştirme Mantığı'] },
          ],
        },
        {
          id: 'lgs_inkilap',
          name: 'T.C. İnkılap Tarihi ve Atatürkçülük',
          defaultQuestionCount: 10,
          topics: [
            { id: 'li1', name: 'Bir Kahraman Doğuyor', subtopics: ['Mustafa Kemal’in Çocukluğu ve Öğrenim Hayatı', 'Fikir Hayatını Etkileyen Olaylar', 'Askerlik Hayatı'] },
            { id: 'li2', name: 'Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar', subtopics: ['I. Dünya Savaşı ve Osmanlı', 'Mondros Ateşkesi ve İşgaller', 'Cemiyetler ve Kuvay-ı Milliye', 'Genelgeler ve Kongreler', 'Misak-ı Milli ve BMM’nin Açılışı'] },
            { id: 'li3', name: 'Milli Bir Destan: Ya İstiklal Ya Ölüm!', subtopics: ['Doğu ve Güney Cepheleri', 'Batı Cephesi ve İnönü Savaşları', 'Sakarya Meydan Muharebesi ve Büyük Taarruz', 'Mudanya ve Lozan Barış Antlaşması'] },
            { id: 'li4', name: 'Atatürkçülük ve Çağdaşlaşan Türkiye', subtopics: ['Atatürk İlkeleri', 'Siyasi, Hukuki, Eğitim ve Kültürel Alandaki İnkılaplar', 'Toplumsal ve Ekonomik Alandaki İnkılaplar'] },
            { id: 'li5', name: 'Demokratikleşme Çabaları & Dış Politika', subtopics: ['Çok Partili Hayat Denemeleri', 'Türk Dış Politikasının Temel İlkeleri', 'Hatay’ın Anavatana Katılması'] },
            { id: 'li6', name: 'Atatürk’ün Ölümü ve Sonrası', subtopics: ['Atatürk’ün Vefatı', 'II. Dünya Savaşı ve Türkiye'] },
          ],
        },
        {
          id: 'lgs_din',
          name: 'Din Kültürü ve Ahlak Bilgisi',
          defaultQuestionCount: 10,
          topics: [
            { id: 'ld1', name: 'Kader İnancı', subtopics: ['Kader ve Kaza Kavramları', 'İnsanın İradesi ve Kader', 'Kaderle İlgili Kavramlar (Ömür, Rızık, Tevekkül)', 'Hz. Musa’nın Hayatı ve Ayet el-Kürsi'] },
            { id: 'ld2', name: 'Zekât ve Sadaka', subtopics: ['İslam’ın Paylaşma ve Yardımlaşmaya Verdiği Önem', 'Zekât ve Sadaka İbadeti', 'Sadaka-i Cariye ve İnfak', 'Hz. Şuayb’ın Hayatı ve Maûn Suresi'] },
            { id: 'ld3', name: 'Din ve Hayat', subtopics: ['Din, Birey ve Toplum', 'Dinin Temel Gayesi (Can, Nesil, Akıl, Mal, Din Emniyeti)', 'Hz. Yusuf’un Hayatı ve Asr Suresi'] },
            { id: 'ld4', name: 'Hz. Muhammed’in Örnekliği', subtopics: ['Doğruluğu ve Güvenilirliği', 'Merhametli ve Affedici Oluşu', 'İstişareye Verdiği Önem', 'Hakkı Gözetmedeki Hassasiyeti', 'Kureyş Suresi'] },
            { id: 'ld5', name: 'Kur’an-ı Kerim ve Özellikleri', subtopics: ['İslam Dininin Temel Kaynakları', 'Kur’an’ın Ana Konuları'] },
          ],
        },
        {
          id: 'lgs_ingilizce',
          name: 'Yabancı Dil (İngilizce)',
          defaultQuestionCount: 10,
          topics: [
            { id: 'len1', name: 'Unit 1: Friendship', subtopics: ['Accepting / Refusing Invitations', 'Making Excuses', 'Personal Qualities'] },
            { id: 'len2', name: 'Unit 2: Teen Life', subtopics: ['Daily Routines', 'Music Preferences', 'Free Time Activities'] },
            { id: 'len3', name: 'Unit 3: In the Kitchen', subtopics: ['Cooking Methods', 'Ingredients and Recipes', 'Kitchen Tools'] },
            { id: 'len4', name: 'Unit 4: On the Phone', subtopics: ['Phone Conversations', 'Leaving Messages', 'Call Center Expressions'] },
            { id: 'len5', name: 'Unit 5: The Internet', subtopics: ['Online Safety', 'Internet Habits', 'Networking Rules'] },
            { id: 'len6', name: 'Unit 6: Adventures', subtopics: ['Extreme Sports', 'Comparing Sports', 'Preferences'] },
            { id: 'len7', name: 'Unit 7: Tourism', subtopics: ['Describing Places', 'Tourist Attractions', 'Climate and Accommodation'] },
            { id: 'len8', name: 'Unit 8: Chores', subtopics: ['Household Tasks', 'Responsibilities and Obligations'] },
            { id: 'len9', name: 'Unit 9: Science', subtopics: ['Scientific Inventions', 'Famous Scientists', 'Lab Equipment'] },
            { id: 'len10', name: 'Unit 10: Natural Forces', subtopics: ['Natural Disasters', 'Environmental Problems', 'Predictions and Precautions'] },
          ],
        },
      ],
    },
    {
      id: 'lgs_sayisal',
      name: 'LGS Sayısal Bölüm',
      questionCount: 40,
      subjects: [
        {
          id: 'lgs_matematik',
          name: 'Matematik',
          defaultQuestionCount: 20,
          topics: [
            { id: 'lm1', name: 'Çarpanlar ve Katlar', subtopics: ['Asal Çarpanlar', 'EBOB-EKOK Problemleri', 'Aralarında Asal Sayılar'] },
            { id: 'lm2', name: 'Üslü İfadeler', subtopics: ['Tam Sayıların Tam Sayı Kuvvetleri', 'Üslü İfadelerle Temel Kurallar', 'Ondalık Gösterimlerin Çözümlenmesi', 'Çok Büyük ve Çok Küçük Sayılar', 'Bilimsel Gösterim'] },
            { id: 'lm3', name: 'Kareköklü İfadeler', subtopics: ['Tam Kare Sayılar', 'Karekökün Yaklaşık Değeri', 'a√b Biçiminde Yazma', 'Kareköklü Sayılarda Dört İşlem', 'Gerçek Sayılar'] },
            { id: 'lm4', name: 'Veri Analizi', subtopics: ['Daire Grafiği', 'Sütun ve Çizgi Grafikleri', 'Grafikler Arası Dönüşüm'] },
            { id: 'lm5', name: 'Basit Olayların Olma Olasılığı', subtopics: ['Olası Durumlar', 'Eşit/Daha Fazla/Daha Az Olasılık', 'Basit Olayın Olasılığı'] },
            { id: 'lm6', name: 'Cebirsel İfadeler ve Özdeşlikler', subtopics: ['Cebirsel İfadelerle İşlemler', 'Özdeşlikler (Tam Kare, İki Kare Farkı)', 'Çarpanlara Ayırma Modellemeleri'] },
            { id: 'lm7', name: 'Doğrusal Denklemler', subtopics: ['Birinci Dereceden Bir Bilinmeyenli Denklemler', 'Koordinat Sistemi', 'Doğrusal İlişki ve Doğru Grafikleri', 'Eğim Kavramı ve Uygulamaları'] },
            { id: 'lm8', name: 'Eşitsizlikler', subtopics: ['Eşitsizlik Durumları', 'Birinci Dereceden Bir Bilinmeyenli Eşitsizliklerin Çözümü'] },
            { id: 'lm9', name: 'Üçgenler', subtopics: ['Üçgende Kenarortay, Açıortay, Yükseklik', 'Üçgen Eşitsizliği', 'Açı-Kenar Bağıntıları', 'Pisagor Bağıntısı'] },
            { id: 'lm10', name: 'Eşlik ve Benzerlik', subtopics: ['Eş ve Benzer Çokgenler', 'Benzerlik Oranı ve Uygulamaları'] },
            { id: 'lm11', name: 'Dönüşüm Geometrisi', subtopics: ['Öteleme', 'Yansıma', 'Ardışık Öteleme ve Yansımalar'] },
            { id: 'lm12', name: 'Geometrik Cisimler', subtopics: ['Dik Prizmalar', 'Dik Dairesel Silindir (Yüzey Alanı ve Hacim)', 'Dik Piramit ve Dik Koni'] },
          ],
        },
        {
          id: 'lgs_fen',
          name: 'Fen Bilimleri',
          defaultQuestionCount: 20,
          topics: [
            { id: 'lf1', name: 'Mevsimler ve İklim', subtopics: ['Mevsimlerin Oluşumu ve Dünya’nın Dönme Ekseni', 'İklim ve Hava Hareketleri', 'Küresel İklim Değişikliği'] },
            { id: 'lf2', name: 'DNA ve Genetik Kod', subtopics: ['DNA’nın Yapısı ve Kendini Eşlemesi', 'Kalıtım (Mendel Genetiği, Çaprazlamalar)', 'Mutasyon ve Modifikasyon', 'Adaptasyon', 'Biyoteknoloji ve Genetik Mühendisliği'] },
            { id: 'lf3', name: 'Basınç', subtopics: ['Katı Basıncı ve Faktörleri', 'Sıvı Basıncı ve Pascal Prensibi', 'Açık Hava Basıncı ve Gaz Basıncı'] },
            { id: 'lf4', name: 'Madde ve Endüstri', subtopics: ['Periyodik Sistem ve Elementlerin Sınıflandırılması', 'Fiziksel ve Kimyasal Değişimler', 'Kimyasal Tepkimeler ve Kütlenin Korunumu', 'Asitler ve Bazlar', 'Maddenin Isı ile Etkileşimi (Öz Isı, Hal Değişimi Isısı)', 'Türkiye’de Kimya Endüstrisi'] },
            { id: 'lf5', name: 'Basit Makineler', subtopics: ['Kaldıraçlar', 'Makaralar ve Palangalar', 'Eğik Düzlem', 'Çıkrık, Dişli Çarklar ve Kasnaklar', 'Vida'] },
            { id: 'lf6', name: 'Enerji Dönüşümleri ve Çevre Bilimi', subtopics: ['Besin Zinciri ve Enerji Akışı', 'Fotosentez ve Solunum', 'Madde Döngüleri', 'Ekolojik Ayak İzi ve Sürdürülebilir Kalkınma'] },
            { id: 'lf7', name: 'Elektrik Yükleri ve Elektrik Enerjisi', subtopics: ['Elektrik Yükleri ve Elektriklenme Türleri', 'Elektroskop', 'Elektrik Enerjisinin Dönüşümü (Isı, Işık, Hareket)'] },
          ],
        },
      ],
    },
  ],
};

export const KPSS_2027_CURRICULUM: CurriculumExam = {
  id: 'KPSS_GYGK' as any,
  name: 'KPSS Lisans / Ön Lisans Genel Yetenek - Genel Kültür',
  durationMinutes: 130,
  totalQuestions: 120,
  tests: [
    {
      id: 'kpss_genel_yetenek',
      name: 'KPSS Genel Yetenek',
      questionCount: 60,
      subjects: [
        {
          id: 'kpss_turkce',
          name: 'Türkçe',
          defaultQuestionCount: 30,
          topics: [
            { id: 'kt1', name: 'Sözcükte ve Cümlede Anlam', subtopics: ['Kelimede Anlam Özellikleri', 'Cümle Yorumu ve İlişkileri'] },
            { id: 'kt2', name: 'Paragrafta Anlam ve Yapı', subtopics: ['Ana Düşünce & Yardımcı Düşünceler', 'Akış Bozma ve Yer Değiştirme', 'Çoklu Paragraf Soruları'] },
            { id: 'kt3', name: 'Ses ve Yazım Kuralları', subtopics: ['Ses Olayları', 'Yazım Kuralları', 'Noktalama İşaretleri'] },
            { id: 'kt4', name: 'Sözcükte Yapı ve Ekler', subtopics: ['Yapım ve Çekim Ekleri', 'Kök Türleri'] },
            { id: 'kt5', name: 'Sözcük Türleri', subtopics: ['İsim, Sıfat, Zamir', 'Zarf, Edat, Bağlaç', 'Fiiller ve Ek Fiil', 'Fiilimsiler'] },
            { id: 'kt6', name: 'Cümlenin Ögeleri ve Cümle Türleri', subtopics: ['Özne, Yüklem, Tümleç', 'Basit, Birleşik, Sıralı Cümleler'] },
            { id: 'kt7', name: 'Anlatım Bozuklukları', subtopics: ['Anlamsal Bozukluklar', 'Yapısal / Dil Bilgisel Bozukluklar'] },
            { id: 'kt8', name: 'Sözel Mantık ve Muhakeme', subtopics: ['Sıralama ve Tablolama', 'Koşullu Yerleştirme Soruları'] },
          ],
        },
        {
          id: 'kpss_matematik',
          name: 'Matematik & Geometri',
          defaultQuestionCount: 30,
          topics: [
            { id: 'km1', name: 'Temel Kavramlar & Sayılar', subtopics: ['Sayı Basamakları', 'Asal Sayılar & Asal Çarpanlar', 'Faktöriyel'] },
            { id: 'km2', name: 'Bölme-Bölünebilme ve EBOB-EKOK', subtopics: ['Bölünebilme Kuralları', 'EBOB-EKOK Problemleri'] },
            { id: 'km3', name: 'Rasyonel ve Ondalık Sayılar', subtopics: ['Dört İşlem', 'Sıralama'] },
            { id: 'km4', name: 'Basit Eşitsizlikler ve Mutlak Değer', subtopics: ['Aralıklar ve İşlemler', 'Mutlak Değerli Denklemler'] },
            { id: 'km5', name: 'Üslü ve Köklü Sayılar', subtopics: ['Üslü İfadeler', 'Köklü İfadeler ve Eşlenik'] },
            { id: 'km6', name: 'Çarpanlara Ayırma ve Özdeşlikler', subtopics: ['İki Kare Farkı', 'Tam Kare', 'Gruplandırma'] },
            { id: 'km7', name: 'Oran-Orantı ve Problemler', subtopics: ['Sayı-Kesir Problemleri', 'Yaş Problemleri', 'İşçi-Havuz', 'Hız-Hareket', 'Yüzde-Kar-Zarar-Faiz', 'Karışım Problemleri'] },
            { id: 'km8', name: 'Kümeler, Fonksiyonlar ve İşlem', subtopics: ['Küme İşlemleri', 'Fonksiyon Değerleri', 'Özel Tanımlı İşlemler'] },
            { id: 'km9', name: 'PKOB & Olasılık', subtopics: ['Permütasyon', 'Kombinasyon', 'Olasılık Hesapları'] },
            { id: 'km10', name: 'Sayısal Mantık ve Grafik Yorumlama', subtopics: ['Tablo-Grafik Yorumlama', 'Sayısal Dizilim ve Şekil Yeteneği'] },
            { id: 'km11', name: 'Geometri: Doğruda ve Üçgende Açılar', subtopics: ['Açılar', 'Özel Üçgenler (Dik, İkizkenar, Eşkenar)'] },
            { id: 'km12', name: 'Geometri: Dörtgenler ve Çokgenler', subtopics: ['Kare, Dikdörtgen, Paralelkenar, Yamuk'] },
            { id: 'km13', name: 'Geometri: Çember, Daire ve Analitik', subtopics: ['Çemberde Açı ve Uzunluk', 'Dairede Alan', 'Noktanın ve Doğrunun Analitiği'] },
          ],
        },
      ],
    },
    {
      id: 'kpss_genel_kultur',
      name: 'KPSS Genel Kültür',
      questionCount: 60,
      subjects: [
        {
          id: 'kpss_tarih',
          name: 'Tarih',
          defaultQuestionCount: 27,
          topics: [
            { id: 'kta1', name: 'İslamiyet Öncesi Türk Tarihi', subtopics: ['İlk Türk Devletleri', 'Kültür ve Medeniyet'] },
            { id: 'kta2', name: 'İlk Türk-İslam Devletleri', subtopics: ['Karahanlılar, Gazneliler, Büyük Selçuklu', 'Kültür ve Teşkilat'] },
            { id: 'kta3', name: 'Anadolu Selçukluları ve Türk Beylikleri', subtopics: ['Anadolu’da Kurulan İlk ve İkinci Dönem Beylikler', 'Haçlı Seferleri', 'Kültür ve Sanat'] },
            { id: 'kta4', name: 'Osmanlı Devleti Kuruluş ve Yükselme', subtopics: ['Padişahlar ve Fetihler', 'Balkanlar ve Anadolu Hakimiyeti'] },
            { id: 'kta5', name: 'Osmanlı Kültür ve Medeniyeti', subtopics: ['Devlet Teşkilatı', 'Toprak Sistemi (Tımar)', 'Eğitim, Ordu, Hukuk, Sanat'] },
            { id: 'kta6', name: 'Osmanlı Duraklama, Gerileme ve Dağılma', subtopics: ['17., 18. ve 19. Yüzyıl Islahatları', 'Savaşlar ve Antlaşmalar', 'Tanzimat, Islahat ve Meşrutiyet'] },
            { id: 'kta7', name: '20. Yüzyıl Başlarında Osmanlı', subtopics: ['Trablusgarp ve Balkan Savaşları', 'I. Dünya Savaşı ve Gizli Antlaşmalar'] },
            { id: 'kta8', name: 'Kurtuluş Savaşı Hazırlık Dönemi', subtopics: ['Mustafa Kemal’in Samsun’a Çıkışı', 'Havza, Amasya, Erzurum, Sivas', 'Misak-ı Milli ve BMM Açılışı'] },
            { id: 'kta9', name: 'Kurtuluş Savaşı Muharebeler ve Antlaşmalar', subtopics: ['Doğu, Güney ve Batı Cepheleri', 'Mudanya ve Lozan'] },
            { id: 'kta10', name: 'Atatürk İlkeleri ve İnkılapları', subtopics: ['6 Temel İlke', 'Siyasi, Hukuki, Toplumsal, Ekonomik İnkılaplar'] },
            { id: 'kta11', name: 'Atatürk Dönemi Türk Dış Politikası', subtopics: ['Lozan Sonrası Gelişmeler', 'Balkan Antantı, Sadabat Paktı, Boğazlar, Hatay'] },
            { id: 'kta12', name: 'Çağdaş Türk ve Dünya Tarihi', subtopics: ['II. Dünya Savaşı ve Sonrası', 'Soğuk Savaş Dönemi', 'Yumuşama (Detant) ve Küreselleşen Dünya'] },
          ],
        },
        {
          id: 'kpss_cografya',
          name: 'Coğrafya',
          defaultQuestionCount: 18,
          topics: [
            { id: 'kc1', name: 'Türkiye’nin Coğrafi Konumu', subtopics: ['Matematiksel ve Özel Konum', 'Saat Dilimleri, Sınırlar'] },
            { id: 'kc2', name: 'Türkiye’nin Yer Şekilleri', subtopics: ['Dağlar, Platolar, Ovalar', 'İç ve Dış Kuvvetlerin Etkisi', 'Kıyı Tipleri'] },
            { id: 'kc3', name: 'Türkiye’nin Su Varlığı ve Toprakları', subtopics: ['Akarsular, Göller, Barajlar', 'Toprak Tipleri ve Erozyon'] },
            { id: 'kc4', name: 'Türkiye’nin İklimi ve Bitki Örtüsü', subtopics: ['Sıcaklık, Basınç, Rüzgarlar, Yağış', 'İklim Tipleri ve Orman / Maki / Bozkır'] },
            { id: 'kc5', name: 'Türkiye’de Nüfus ve Yerleşme', subtopics: ['Nüfus Yoğunluğu ve Dağılışı', 'Göçler ve Demografik Yapı'] },
            { id: 'kc6', name: 'Türkiye’de Tarım ve Hayvancılık', subtopics: ['Tarım Ürünleri ve Yetişme Alanları', 'Büyükbaş, Küçükbaş, Arıcılık, Balıkçılık'] },
            { id: 'kc7', name: 'Türkiye’de Madenler ve Enerji Kaynakları', subtopics: ['Demir, Bakır, Boksit, Bor, Krom', 'Termik, Hidroelektrik, Rüzgar, Güneş'] },
            { id: 'kc8', name: 'Türkiye’de Sanayi, Ticaret, Ulaşım ve Turizm', subtopics: ['Sanayi Kolları', 'Ulaşım Ağları', 'Kültür ve Doğa Turizmi'] },
          ],
        },
        {
          id: 'kpss_vatandaslik',
          name: 'Vatandaşlık & Anayasa',
          defaultQuestionCount: 9,
          topics: [
            { id: 'kv1', name: 'Temel Hukuk Kavramları', subtopics: ['Sosyal Düzen Kuralları', 'Hukukun Dalları ve Kaynakları', 'Hak Kavramı ve Korunması', 'Ehliyet Türleri'] },
            { id: 'kv2', name: 'Devlet Biçimleri ve Demokrasi', subtopics: ['Devletin Unsurları', 'Hükümet Sistemleri (Parlamenter, Başkanlık)'] },
            { id: 'kv3', name: 'Türk Anayasa Tarihi', subtopics: ['1876, 1921, 1924, 1961 Anayasaları', '1982 Anayasası’nın Genel Esasları'] },
            { id: 'kv4', name: 'Temel Hak ve Hürriyetler', subtopics: ['Kişi Hakları, Sosyal-Ekonomik Haklar, Siyasi Haklar'] },
            { id: 'kv5', name: 'Yasama Organı (TBMM)', subtopics: ['Milletvekili Seçimi ve Dokunulmazlık', 'TBMM’nin Görev ve Yetkileri'] },
            { id: 'kv6', name: 'Yürütme Organı (Cumhurbaşkanı)', subtopics: ['Cumhurbaşkanlığı Kararnameleri', 'Bakanlıklar ve Olağanüstü Hal'] },
            { id: 'kv7', name: 'Yargı Organı ve Yüksek Mahkemeler', subtopics: ['Anayasa Mahkemesi', 'Yargıtay, Danıştay, Uyuşmazlık Mahkemesi', 'HSK'] },
            { id: 'kv8', name: 'İdare Hukuku', subtopics: ['Merkezden ve Yerinden Yönetim', 'İl, İlçe, Belediye, Köy Teşkilatı', 'Kamu Görevlileri'] },
          ],
        },
        {
          id: 'kpss_guncel',
          name: 'Güncel Bilgiler',
          defaultQuestionCount: 6,
          topics: [
            { id: 'kg1', name: 'Türkiye ve Dünya Gündemi', subtopics: ['Önemli Siyasi ve Diplomatik Gelişmeler', 'Milli Savunma ve Uzay Hamleleri'] },
            { id: 'kg2', name: 'Uluslararası Kuruluşlar', subtopics: ['BM, NATO, AB, Türk Devletleri Teşkilatı, Şanghay'] },
            { id: 'kg3', name: 'Kültür, Sanat ve Edebiyat Olayları', subtopics: ['Nobel, UNESCO Miras Listesi, Ödüllü Sanatçılar'] },
            { id: 'kg4', name: 'Tarihi ve Coğrafi Önemli Gelişmeler', subtopics: ['Yılın Temaları, Barajlar, Köprüler, Şehirler'] },
          ],
        },
      ],
    },
  ],
};

// Unified Registry for all Supported Exam Categories
export const MULTI_EXAM_CURRICULUM_REGISTRY: Record<string, CurriculumExam> = {
  TYT: YKS_2027_CURRICULUM.TYT,
  AYT: YKS_2027_CURRICULUM.AYT,
  LGS: LGS_2027_CURRICULUM,
  KPSS_GYGK: KPSS_2027_CURRICULUM,
};

export const EXAM_GROUP_CONFIG: Record<
  TargetExamGroup,
  {
    name: string;
    subtypes: ExamType[];
    fields: string[];
    grades: string[];
    defaultScoreMax: number;
    scoreName: string;
    targetName: string;
  }
> = {
  YKS: {
    name: 'YKS (Yükseköğretim Kurumları Sınavı)',
    subtypes: ['TYT', 'AYT'],
    fields: ['SAY', 'EA', 'SÖZ', 'DİL'],
    grades: ['11. Sınıf', '12. Sınıf', 'Mezun'],
    defaultScoreMax: 560,
    scoreName: 'YKS Yerleştirme Puanı',
    targetName: 'Hedef Üniversite / Bölüm',
  },
  LGS: {
    name: 'LGS (Liselere Geçiş Sistemi)',
    subtypes: ['LGS'],
    fields: ['LGS'],
    grades: ['8. Sınıf'],
    defaultScoreMax: 500,
    scoreName: 'LGS Puanı (Max 500)',
    targetName: 'Hedef Fen / Anadolu Lisesi',
  },
  KPSS: {
    name: 'KPSS (Kamu Personel Seçme Sınavı)',
    subtypes: ['KPSS_GYGK', 'KPSS_EB', 'KPSS_OABT'],
    fields: ['GY-GK', 'Eğitim Bilimleri', 'Alan (ÖABT)'],
    grades: ['Ön Lisans', 'Lisans'],
    defaultScoreMax: 100,
    scoreName: 'KPSS P3 / P93 Puanı (Max 100)',
    targetName: 'Hedef Kurum / Kadro',
  },
};

export function getCurriculumForExam(examType: ExamType | string): CurriculumExam {
  if (examType === 'LGS') return LGS_2027_CURRICULUM;
  if (examType.startsWith('KPSS')) return KPSS_2027_CURRICULUM;
  if (examType === 'AYT') return YKS_2027_CURRICULUM.AYT;
  return YKS_2027_CURRICULUM.TYT;
}
