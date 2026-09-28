export interface CurriculumSubtopic {
  id: string;
  name: string;
}

export interface CurriculumTopic {
  id: string;
  name: string;
  subtopics: string[];
}

export interface CurriculumSubject {
  id: string;
  name: string;
  defaultQuestionCount: number;
  topics: CurriculumTopic[];
}

export interface CurriculumTest {
  id: string;
  name: string;
  questionCount: number;
  subjects: CurriculumSubject[];
}

export interface CurriculumExam {
  id: 'TYT' | 'AYT';
  name: string;
  durationMinutes: number;
  totalQuestions: number;
  tests: CurriculumTest[];
}

export const YKS_2027_CURRICULUM: Record<'TYT' | 'AYT', CurriculumExam> = {
  TYT: {
    id: 'TYT',
    name: 'Temel Yeterlilik Testi (TYT)',
    durationMinutes: 165,
    totalQuestions: 120,
    tests: [
      {
        id: 'tyt_turkce',
        name: 'Türkçe Testi',
        questionCount: 40,
        subjects: [
          {
            id: 'turkce',
            name: 'Türkçe',
            defaultQuestionCount: 40,
            topics: [
              { id: 't1', name: 'Sözcükte Anlam', subtopics: ['Gerçek, Mecaz, Yan Anlam', 'Söz Öbekleri', 'Deyim ve Atasözleri'] },
              { id: 't2', name: 'Cümlede Anlam', subtopics: ['Cümle Vurgusu', 'Örtülü Anlam', 'Anlatım Biçimleri'] },
              { id: 't3', name: 'Paragrafta Anlam', subtopics: ['Ana Düşünce', 'Yardımcı Düşünceler', 'Paragraf Yapısı ve Akışı', 'Anlatım Teknikleri'] },
              { id: 't4', name: 'Ses Bilgisi', subtopics: ['Ünlü Düşmesi', 'Ünsüz Benzeşmesi', 'Ünsüz Yumuşaması', 'Büyük-Küçük Ünlü Uyumu'] },
              { id: 't5', name: 'Yazım Kuralları', subtopics: ['Büyük Harflerin Yazımı', 'de/da/ki/mi Yazımı', 'Birleşik Sözcükler'] },
              { id: 't6', name: 'Noktalama İşaretleri', subtopics: ['Nokta, Virgül, Noktalı Virgül', 'İki Nokta, Kesme İşareti', 'Üç Nokta, Kısa Çizgi'] },
              { id: 't7', name: 'Sözcükte Yapı (Ekler)', subtopics: ['Kökler ve Ekler', 'Yapım Ekleri', 'Çekim Ekleri', 'Sözcük Türleri Yapısı'] },
              { id: 't8', name: 'Sözcük Türleri', subtopics: ['İsim, Sıfat, Zamir', 'Zarf, Edat, Bağlaç, Ünlem', 'Eylemler ve Ek Fiil', 'Fiilimsiler'] },
              { id: 't9', name: 'Cümlenin Ögeleri', subtopics: ['Temel Ögeler (Özne, Yüklem)', 'Yardımcı Ögeler (Nesne, Tümleç)', 'Ara Söz ve Vurgu'] },
              { id: 't10', name: 'Cümle Türleri & Anlatım Bozukluğu', subtopics: ['Yapısına Göre Cümleler', 'Anlamsal ve Yapısal Bozukluklar'] },
            ],
          },
        ],
      },
      {
        id: 'tyt_matematik',
        name: 'Temel Matematik Testi',
        questionCount: 40,
        subjects: [
          {
            id: 'matematik',
            name: 'Temel Matematik',
            defaultQuestionCount: 30,
            topics: [
              { id: 'm1', name: 'Temel Kavramlar', subtopics: ['Sayı Kümeleri', 'Tek-Çift Sayılar', 'Pozitif-Negatif Sayılar', 'Ardışık Sayılar'] },
              { id: 'm2', name: 'Basamak Kavramı', subtopics: ['Sayı Basamakları', 'Çözümleme'] },
              { id: 'm3', name: 'Bölme ve Bölünebilme - EBOB/EKOK', subtopics: ['Bölünebilme Kuralları', 'Asal Çarpanlara Ayırma', 'EBOB-EKOK Problemleri'] },
              { id: 'm4', name: 'Rasyonel ve Ondalık Sayılar', subtopics: ['Dört İşlem', 'Sıralama', 'Devirli Ondalık Sayılar'] },
              { id: 'm5', name: 'Basit Eşitsizlikler ve Mutlak Değer', subtopics: ['Aralık Kavramı', 'Eşitsizlik Özellikleri', 'Mutlak Değerli Denklemler'] },
              { id: 'm6', name: 'Üslü ve Köklü İfadeler', subtopics: ['Üslü Denklem ve Özellikler', 'Köklü İfadelerde Dört İşlem', 'Eşlenik'] },
              { id: 'm7', name: 'Çarpanlara Ayırma ve Özdeşlikler', subtopics: ['Ortak Parantez', 'İki Kare Farkı', 'Tam Kare İfadeler'] },
              { id: 'm8', name: 'Oran ve Orantı', subtopics: ['Doğru ve Ters Orantı', 'Bileşik Orantı', 'Aritmetik ve Geometrik Ortalama'] },
              { id: 'm9', name: 'Problemler', subtopics: ['Sayı-Kesir Problemleri', 'Yaş Problemleri', 'Yüzde-Kar-Zarar', 'Hız-Hareket', 'Karışım & Grafik'] },
              { id: 'm10', name: 'Kümeler, Mantık ve Fonksiyonlar', subtopics: ['Küme İşlemleri', 'Önermeler ve Doğruluk Tabloları', 'Fonksiyon Tanımı ve Türleri'] },
              { id: 'm11', name: 'PKOB (Permütasyon-Kombinasyon-Olasılık)', subtopics: ['Faktöriyel', 'Permütasyon', 'Kombinasyon', 'Olasılık ve İstatistik'] },
            ],
          },
          {
            id: 'geometri',
            name: 'Geometri',
            defaultQuestionCount: 10,
            topics: [
              { id: 'g1', name: 'Doğruda ve Üçgende Açılar', subtopics: ['Paralel Doğrularda Açılar', 'Üçgende Açı Bağıntıları'] },
              { id: 'g2', name: 'Özel Üçgenler', subtopics: ['Dik Üçgen ve Pisagor', 'İkizkenar ve Eşkenar Üçgen', 'Öklid Bağıntıları'] },
              { id: 'g3', name: 'Üçgende Alan, Benzerlik ve Açıortay/Kenarortay', subtopics: ['İç ve Dış Açıortay', 'Ağırlık Merkezi', 'Benzerlik Oranı ve Alan'] },
              { id: 'g4', name: 'Çokgenler ve Dörtgenler', subtopics: ['Düzgün Çokgenler', 'Paralelkenar ve Eşkenar Dörtgen', 'Dikdörtgen ve Kare', 'Yamuk ve Deltoid'] },
              { id: 'g5', name: 'Katı Cisimler', subtopics: ['Prizmalar', 'Piramitler', 'Silindir ve Koni', 'Küre'] },
            ],
          },
        ],
      },
      {
        id: 'tyt_sosyal',
        name: 'Sosyal Bilimler Testi',
        questionCount: 20,
        subjects: [
          {
            id: 'tarih',
            name: 'Tarih',
            defaultQuestionCount: 5,
            topics: [
              { id: 'st1', name: 'Tarih ve Zaman - İlk Çağ', subtopics: ['Tarih Bilimi', 'İlk Çağ Medeniyetleri'] },
              { id: 'st2', name: 'İlk ve Orta Çağlarda Türk Dünyası', subtopics: ['Orta Asya Türk Devletleri', 'Kültür ve Medeniyet'] },
              { id: 'st3', name: 'İslam Medeniyetinin Doğuşu ve İlk Türk-İslam Devletleri', subtopics: ['Dört Halife', 'Selçuklular', 'Gazneliler'] },
              { id: 'st4', name: 'Osmanlı Devleti Kuruluş, Yükselme ve Kültür', subtopics: ['Beylikten Devlete', 'Dünya Gücü Osmanlı', 'Merkez ve Taşra Teşkilatı'] },
              { id: 'st5', name: 'Milli Mücadele ve Atatürkçülük', subtopics: ['Genelgeler ve Kongreler', 'TBMM Dönemi', 'Mudanya ve Lozan', 'Atatürk İlkeleri ve İnkılaplar'] },
            ],
          },
          {
            id: 'cografya',
            name: 'Coğrafya',
            defaultQuestionCount: 5,
            topics: [
              { id: 'sc1', name: 'Doğa ve İnsan - Coğrafi Konum', subtopics: ['Paralel ve Meridyenler', 'Yerel Saat', 'Türkiye’nin Konumu'] },
              { id: 'sc2', name: 'Harita Bilgisi ve İklim Elemanları', subtopics: ['Ölçek ve Projeksiyon', 'Sıcaklık, Basınç, Rüzgarlar, Nem ve Yağış'] },
              { id: 'sc3', name: 'Dünyanın Şekli ve Hareketleri', subtopics: ['Günlük ve Yıllık Hareketler', 'Eksen Eğikliği'] },
              { id: 'sc4', name: 'Yerin Şekillenmesi (İç ve Dış Kuvvetler)', subtopics: ['Levha Tektoniği', 'Volkanizma ve Depremler', 'Akarsu, Rüzgar, Buzul Şekilleri'] },
              { id: 'sc5', name: 'Nüfus, Yerleşme ve Doğal Afetler', subtopics: ['Nüfus Piramitleri', 'Göçler', 'Afet Türleri ve Korunma'] },
            ],
          },
          {
            id: 'felsefe',
            name: 'Felsefe',
            defaultQuestionCount: 5,
            topics: [
              { id: 'sf1', name: 'Felsefeyi Tanıma', subtopics: ['Felsefenin Anlamı ve Özellikleri', 'Düşünme ve Akıl Yürütme'] },
              { id: 'sf2', name: 'Varlık ve Bilgi Felsefesi', subtopics: ['Ontoloji Temel Problemleri', 'Epistemoloji: Doğru Bilginin İmkânı'] },
              { id: 'sf3', name: 'Ahlak, Sanat ve Din Felsefesi', subtopics: ['Etik Kuramları', 'Estetik Yargılar', 'Teoloji ve Din Yaklaşımları'] },
              { id: 'sf4', name: 'Siyaset ve Bilim Felsefesi', subtopics: ['Devlet ve İdeal Düzen', 'Bilimsel Yöntem ve Paradigma'] },
            ],
          },
          {
            id: 'din',
            name: 'Din Kültürü',
            defaultQuestionCount: 5,
            topics: [
              { id: 'sd1', name: 'Bilgi ve İnanç', subtopics: ['İslamda Bilgi Kaynakları', 'İmanın Şartları ve Tevhid'] },
              { id: 'sd2', name: 'İbadet ve Ahlak', subtopics: ['Namaz, Oruç, Zekat, Hac', 'Ahlaki Tutum ve Davranışlar'] },
              { id: 'sd3', name: 'Kur’an ve Yorumu - Hz. Muhammed', subtopics: ['Ayet ve Sureler', 'Peygamberimizin Örnek Şahsiyeti', 'İslam Düşüncesinde Yorumlar'] },
            ],
          },
        ],
      },
      {
        id: 'tyt_fen',
        name: 'Fen Bilimleri Testi',
        questionCount: 20,
        subjects: [
          {
            id: 'fizik',
            name: 'Fizik',
            defaultQuestionCount: 7,
            topics: [
              { id: 'ff1', name: 'Fizik Bilimine Giriş & Madde ve Özellikleri', subtopics: ['Fiziğin Alt Dalları', 'Özkütle, Dayanıklılık, Adezyon-Kohezyon'] },
              { id: 'ff2', name: 'Kuvvet, Hareket ve Enerji', subtopics: ['Düzgün Doğrusal Hareket', 'Newton Yasaları', 'İş, Güç, Mekanik Enerji'] },
              { id: 'ff3', name: 'Isı ve Sıcaklık - Basınç ve Kaldırma Kuvveti', subtopics: ['Termal Denge ve Genleşme', 'Katı-Sıvı-Gaz Basıncı', 'Arşimet Prensibi'] },
              { id: 'ff4', name: 'Elektrik ve Manyetizma', subtopics: ['Elektrostatik', 'Elektrik Akımı ve Devreler', 'Mıknatıs ve Manyetik Alan'] },
              { id: 'ff5', name: 'Dalgalar ve Optik', subtopics: ['Yay, Su, Ses, Deprem Dalgaları', 'Aydınlanma, Yansıma, Kırılma, Mercekler, Renk'] },
            ],
          },
          {
            id: 'kimya',
            name: 'Kimya',
            defaultQuestionCount: 7,
            topics: [
              { id: 'fk1', name: 'Kimya Disiplini ve Madde Türleri', subtopics: ['Simyadan Kimyaya', 'Elementler ve Bileşikler', 'Güvenlik Uyarı İşaretleri'] },
              { id: 'fk2', name: 'Atom ve Periyodik Sistem', subtopics: ['Atom Modelleri', 'Periyodik Özelliklerin Değişimi'] },
              { id: 'fk3', name: 'Kimyasal Türler Arası Etkileşimler', subtopics: ['Güçlü Etkileşimler (İyonik, Kovalent, Metalik)', 'Zayıf Etkileşimler (Van der Waals, Hidrojen)'] },
              { id: 'fk4', name: 'Maddenin Halleri ve Karışımlar', subtopics: ['Gazlar ve Sıvılar', 'Homojen-Heterojen Karışımlar', 'Ayırma Yöntemleri'] },
              { id: 'fk5', name: 'Asitler, Bazlar, Tuzlar ve Kimya Her Yerde', subtopics: ['pH ve İndikatörler', 'Nötralleşme', 'Temizlik Maddeleri ve Polimerler'] },
            ],
          },
          {
            id: 'biyoloji',
            name: 'Biyoloji',
            defaultQuestionCount: 6,
            topics: [
              { id: 'fb1', name: 'Yaşam Bilimi Biyoloji & Temel Bileşikler', subtopics: ['İnorganik ve Organik Bileşikler', 'Enzimler, Vitaminler, Nükleik Asitler, ATP'] },
              { id: 'fb2', name: 'Hücre ve Organeller', subtopics: ['Prokaryot-Ökaryot Hücre', 'Hücre Zarı ve Madde Geçişleri', 'Hücre Organelleri'] },
              { id: 'fb3', name: 'Canlılar Dünyası ve Sınıflandırma', subtopics: ['Sınıflandırma Basamakları', 'Bakteriler, Arkeler, Protistler, Mantarlar, Bitkiler, Hayvanlar'] },
              { id: 'fb4', name: 'Hücre Bölünmeleri ve Üreme', subtopics: ['Mitoz ve Mayoz Bölünme', 'Eşeysiz ve Eşeyli Üreme'] },
              { id: 'fb5', name: 'Kalıtım ve Ekosistem Ekolojisi', subtopics: ['Mendel Genetiği', 'Kan Grupları ve Eşeye Bağlı Kalıtım', 'Besin Zinciri ve Çevre Sorunları'] },
            ],
          },
        ],
      },
    ],
  },
  AYT: {
    id: 'AYT',
    name: 'Alan Yeterlilik Testi (AYT)',
    durationMinutes: 180,
    totalQuestions: 160,
    tests: [
      {
        id: 'ayt_matematik_testi',
        name: 'Matematik Testi (40 Soru)',
        questionCount: 40,
        subjects: [
          {
            id: 'ayt_matematik',
            name: 'Matematik',
            defaultQuestionCount: 30,
            topics: [
              { id: 'am1', name: 'Fonksiyonlar ve Polinomlar', subtopics: ['Bileşke ve Ters Fonksiyon', 'Polinomlarda Bölme ve Kalan', 'Grafik Yorumlama'] },
              { id: 'am2', name: 'İkinci Dereceden Denklem ve Eşitsizlikler', subtopics: ['Kök-Katsayı Bağıntıları', 'İşaret Tablosu', 'Eşitsizlik Sistemleri'] },
              { id: 'am3', name: 'Parabol', subtopics: ['Tepe Noktası', 'Eksenleri Kestiği Noktalar', 'Maksimum-Minimum Problemleri'] },
              { id: 'am4', name: 'Trigonometri', subtopics: ['Birim Çember', 'Toplam-Fark ve Yarım Açı', 'Trigonometrik Denklemler'] },
              { id: 'am5', name: 'Logaritma ve Diziler', subtopics: ['Logaritma Fonksiyonu ve Özellikleri', 'Aritmetik Dizi', 'Geometrik Dizi'] },
              { id: 'am6', name: 'Limit ve Süreklilik', subtopics: ['Sağdan-Soldan Limit', '0/0 Belirsizliği', 'Süreklilik Şartı'] },
              { id: 'am7', name: 'Türev ve Uygulamaları', subtopics: ['Türev Alma Kuralları', 'Teğet ve Normal Denklemi', 'Artan-Azalanlık ve Ekstremum Noktalar'] },
              { id: 'am8', name: 'İntegral ve Uygulamaları', subtopics: ['Belirsiz İntegral', 'Değişken Değiştirme', 'Belirli İntegral ile Alan Hesabı'] },
            ],
          },
          {
            id: 'ayt_geometri',
            name: 'Geometri',
            defaultQuestionCount: 10,
            topics: [
              { id: 'ag1', name: 'Doğrunun ve Çemberin Analitiği', subtopics: ['Noktanın ve Doğrunun Analitiği', 'Çemberin Standart Denklemi', 'Doğru-Çember Durumları'] },
              { id: 'ag2', name: 'Çember ve Daire', subtopics: ['Çemberde Açı', 'Teğet-Kiriş Özellikleri', 'Dairede Çevre ve Alan'] },
              { id: 'ag3', name: 'Dönüşüm Geometrisi ve Katı Cisimler', subtopics: ['Öteleme, Dönme, Yansıma', 'Koni, Silindir ve Küre Hacim-Alan'] },
            ],
          },
        ],
      },
      {
        id: 'ayt_fen_testi',
        name: 'Fen Bilimleri Testi (40 Soru)',
        questionCount: 40,
        subjects: [
          {
            id: 'ayt_fizik',
            name: 'Fizik',
            defaultQuestionCount: 14,
            topics: [
              { id: 'af1', name: 'Vektörler, Bağıl Hareket ve Newton Yasaları', subtopics: ['Bileşke Vektör', 'Nehir Problemleri', 'Sürtünmeli Yüzeyde Hareket'] },
              { id: 'af2', name: 'İki Boyutta Hareket, İtme ve Çizgisel Momentum', subtopics: ['Atışlar', 'Momentum Korunumu ve Çarpışmalar'] },
              { id: 'af3', name: 'Tork, Denge ve Basit Makineler', subtopics: ['Tork Dengesi', 'Kaldıraç, Makara, Eğik Düzlem'] },
              { id: 'af4', name: 'Elektriksel Kuvvet, Potansiyel ve Manyetizma', subtopics: ['Coulomb Yasası', 'Elektrik Alan ve Potansiyel', 'Manyetik Kuvvet ve İndüksiyon'] },
              { id: 'af5', name: 'Çembersel Hareket, Basit Harmonik Hareket & Dalga Mekaniği', subtopics: ['Düzgün Çembersel Hareket', 'Yay ve İp Sarkacı', 'Doppler ve Girişim'] },
              { id: 'af6', name: 'Atom Fiziği, Modern Fizik ve Radyoaktivite', subtopics: ['Fotoelektrik Olay', 'Compton Saçılması', 'Bohr Atom Modeli', 'Nükleer Işımalar'] },
            ],
          },
          {
            id: 'ayt_kimya',
            name: 'Kimya',
            defaultQuestionCount: 13,
            topics: [
              { id: 'ak1', name: 'Modern Atom Teorisi ve Gazlar', subtopics: ['Kuantum Sayıları ve Elektron Dizilimi', 'İdeal Gaz Yasası', 'Kısmi Basınç ve Difüzyon'] },
              { id: 'ak2', name: 'Sıvı Çözeltiler ve Koligatif Özellikler', subtopics: ['Molarite ve Molalite', 'Kaynama Noktası Yükselmesi', 'Ozmotik Basınç'] },
              { id: 'ak3', name: 'Kimyasal Tepkimelerde Enerji ve Hız', subtopics: ['Entalpi ve Hess Yasası', 'Tepkime Hızını Etkileyen Faktörler'] },
              { id: 'ak4', name: 'Kimyasal Denge ve Asit-Baz Dengesi', subtopics: ['Denge Bağıntısı (Kc, Kp)', 'Le Chatelier İlkesi', 'Tampon Çözeltiler ve Titrasyon', 'Çözünürlük Dengesi (Kçç)'] },
              { id: 'ak5', name: 'Kimya ve Elektrik (Elektrokimya)', subtopics: ['Redoks Tepkimeleri', 'Galvanik Piller', 'Nernst Eşitliği ve Elektroliz'] },
              { id: 'ak6', name: 'Karbon Kimyası ve Organik Bileşikler', subtopics: ['Hibritleşme ve Molekül Geometrisi', 'Alkan, Alken, Alkin', 'Fonksiyonel Gruplar (Alkol, Eter, Karbonil)'] },
            ],
          },
          {
            id: 'ayt_biyoloji',
            name: 'Biyoloji',
            defaultQuestionCount: 13,
            topics: [
              { id: 'ab1', name: 'İnsan Fizyolojisi (Sistemler)', subtopics: ['Sinir ve Endokrin Sistem', 'Duyu Organları', 'Destek ve Hareket', 'Sindirim ve Dolaşım', 'Solunum, Boşaltım ve Üreme Sistemi'] },
              { id: 'ab2', name: 'Genden Proteine (Nükleik Asitler)', subtopics: ['DNA Replikasyonu', 'Transkripsiyon ve Translasyon', 'Genetik Şifre'] },
              { id: 'ab3', name: 'Hücresel Enerji Dönüşümleri', subtopics: ['Fotosentez ve Kemosentez', 'Oksijenli ve Oksijensiz Solunum', 'Fermantasyon'] },
              { id: 'ab4', name: 'Bitki Biyolojisi', subtopics: ['Bitkisel Dokular ve Organlar', 'Bitkilerde Madde Taşınması', 'Bitkisel Hormonlar ve Hareket'] },
              { id: 'ab5', name: 'Canlılar ve Çevre', subtopics: ['Popülasyon Ekolojisi', 'Evrimsel Adaptasyon ve Çevre'] },
            ],
          },
        ],
      },
      {
        id: 'ayt_edebiyat_sosyal1',
        name: 'Türk Dili ve Edebiyatı - Sosyal Bilimler-1 (40 Soru)',
        questionCount: 40,
        subjects: [
          {
            id: 'ayt_edebiyat',
            name: 'Türk Dili ve Edebiyatı',
            defaultQuestionCount: 24,
            topics: [
              { id: 'ae1', name: 'Güzel Sanatlar, Edebi Metinler ve Şiir Bilgisi', subtopics: ['Şiirde Biçim, Ahenk ve Ölçü', 'Edebi Sanatlar', 'Nazım Biçimleri ve Türleri'] },
              { id: 'ae2', name: 'İslamiyet Öncesi ve Geçiş Dönemi Türk Edebiyatı', subtopics: ['Sözlü ve Yazılı Edebiyat', 'Kutadgu Bilig, Divanu Lugati\'t-Türk, Atabetü\'l-Haikayık'] },
              { id: 'ae3', name: 'Halk ve Divan Edebiyatı', subtopics: ['Anonim, Aşık ve Tekke Edebiyatı', 'Divan Şiiri, Nesri ve Şairleri'] },
              { id: 'ae4', name: 'Tanzimat, Servet-i Fünun ve Fecr-i Ati Edebiyatı', subtopics: ['1. ve 2. Dönem Tanzimat', 'Edebi Topluluklar ve Akımlar'] },
              { id: 'ae5', name: 'Milli Edebiyat ve Cumhuriyet Dönemi Türk Edebiyatı', subtopics: ['Milli Edebiyat Zevk ve Anlayışı', 'Cumhuriyet Dönemi Şiir, Roman ve Tiyatro'] },
              { id: 'ae6', name: 'Batı Edebiyatı ve Edebi Akımlar', subtopics: ['Klasisizm, Romantizm, Realizm, Sembolizm, Sürrealizm'] },
            ],
          },
          {
            id: 'ayt_tarih1',
            name: 'Tarih-1',
            defaultQuestionCount: 10,
            topics: [
              { id: 'at1', name: 'Tarih Bilimi ve İlk Uygarlıklar', subtopics: ['Zaman ve Takvim', 'Mezopotamya, Anadolu, Mısır'] },
              { id: 'at2', name: 'Türk Devletleri ve İslam Tarihi', subtopics: ['Göktürkler, Uygurlar', 'Karahanlılar, Büyük Selçuklular'] },
              { id: 'at3', name: 'Osmanlı Tarihi ve Kültür Medeniyeti', subtopics: ['Fetihler ve Teşkilat', 'Divan-ı Hümayun ve Tımar'] },
              { id: 'at4', name: '20. Yüzyıl Başlarında Osmanlı ve Kurtuluş Savaşı', subtopics: ['Trablusgarp ve Balkan Savaşları', '1. Dünya Savaşı', 'Milli Mücadele Cepheleri'] },
              { id: 'at5', name: 'Atatürk İnkılapları ve Dış Politika', subtopics: ['Siyasi, Hukuki, Sosyal İnkılaplar', 'Sadabat ve Balkan Paktı'] },
            ],
          },
          {
            id: 'ayt_cografya1',
            name: 'Coğrafya-1',
            defaultQuestionCount: 6,
            topics: [
              { id: 'ac1', name: 'Biyoçeşitlilik ve Ekosistemler', subtopics: ['Biyomlar', 'Madde Döngüleri', 'Enerji Akışı'] },
              { id: 'ac2', name: 'Nüfus Politikaları ve Şehirlerin Fonksiyonları', subtopics: ['Dünyada Nüfus Politikaları', 'İlk Şehirler ve Etki Alanları'] },
              { id: 'ac3', name: 'Türkiye’nin Ekonomisi ve Bölgeler', subtopics: ['Tarım, Hayvancılık, Sanayi, Madenler, Turizm', 'Bölgesel Kalkınma Projeleri'] },
              { id: 'ac4', name: 'Küresel Ticaret, Turizm ve Örgütler', subtopics: ['Uluslararası Ticaret Bölgeleri', 'BM, NATO, AB, OPEC vb.'] },
            ],
          },
        ],
      },
      {
        id: 'ayt_sosyal2',
        name: 'Sosyal Bilimler-2 (40 Soru)',
        questionCount: 40,
        subjects: [
          {
            id: 'ayt_tarih2',
            name: 'Tarih-2',
            defaultQuestionCount: 11,
            topics: [
              { id: 'at2_1', name: 'Tarih ve İlk Çağ Medeniyetleri', subtopics: ['Tarih Yazıcılığı', 'Eski Dünya Medeniyetleri'] },
              { id: 'at2_2', name: 'Orta Çağ Dünyası ve İslam Medeniyeti', subtopics: ['Feodalite', 'Haçlı Seferleri', 'Abbasiler'] },
              { id: 'at2_3', name: 'Osmanlı ve Değişen Dünya Dengeleri', subtopics: ['Kapitülasyonlar', 'Sanayi İnkılabı Etkileri', 'Tanzimat ve Meşrutiyet'] },
              { id: 'at2_4', name: 'Çağdaş Türk ve Dünya Tarihi', subtopics: ['2. Dünya Savaşı', 'Soğuk Savaş', 'Yumuşama Dönemi ve Küreselleşme'] },
            ],
          },
          {
            id: 'ayt_cografya2',
            name: 'Coğrafya-2',
            defaultQuestionCount: 11,
            topics: [
              { id: 'ac2_1', name: 'Ekosistem ve Doğa Olayları', subtopics: ['Ekstrem Doğa Olayları', 'Küresel İklim Değişimi'] },
              { id: 'ac2_2', name: 'Türkiye’de ve Dünyada Yerleşme ve Ekonomi', subtopics: ['Ekonomik Faaliyetlerin Sınıflandırılması', 'Doğal Kaynaklar ve Sürdürülebilirlik'] },
              { id: 'ac2_3', name: 'Uluslararası Çevre Anlaşmaları ve Jeopolitik', subtopics: ['Çevre Sözleşmeleri', 'Sıcak Çatışma Bölgeleri', 'Türkiye\'nin Jeopolitiği'] },
            ],
          },
          {
            id: 'ayt_felsefe_grubu',
            name: 'Felsefe Grubu',
            defaultQuestionCount: 12,
            topics: [
              { id: 'afg1', name: 'Mantık', subtopics: ['Mantığa Giriş', 'Klasik Mantık (Kavram, Önerme, Kıyas)', 'Sembolik Mantık'] },
              { id: 'afg2', name: 'Psikoloji', subtopics: ['Psikolojinin Alanı ve Yöntemleri', 'Gelişim, Öğrenme, Bellek, Duyum ve Algı', 'Kişilik ve Ruh Sağlığı'] },
              { id: 'afg3', name: 'Sosyoloji', subtopics: ['Sosyolojiye Giriş', 'Toplumsal Yapı, Kurumlar, Değişme ve Tabakalaşma', 'Kültür ve Toplum'] },
            ],
          },
          {
            id: 'ayt_din_felsefe',
            name: 'Din Kültürü / Ek Felsefe',
            defaultQuestionCount: 6,
            topics: [
              { id: 'adf1', name: 'Din ve Hayat / İslam Mezhepleri', subtopics: ['İnanç ve İbadet Felsefesi', 'İslam Düşüncesinde İtikiadi ve Ameli Fırkalar'] },
              { id: 'adf2', name: 'Felsefi Akımlar ve Mantıksal Çıkarım', subtopics: ['Varlık, Değer ve Bilgi Tartışmaları'] },
            ],
          },
        ],
      },
    ],
  },
};

export const YKS_2026_CURRICULUM = YKS_2027_CURRICULUM;
