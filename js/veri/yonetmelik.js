/**
 * yonetmelik.js — "Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik"
 * (RG 31/05/2017 – 30082; değişiklik RG 01/07/2018 – 30465) eklerindeki
 * gereksinim tablolarının makine okunabilir hâli.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  KAYNAK VE DOĞRULAMA
 * ─────────────────────────────────────────────────────────────────────────
 *  Bu dosyadaki tablolar, Yönetmeliğin resmî ek dosyasından
 *  (mevzuat.gov.tr — 7.5.23616-Ek.docx) programlı olarak çıkarılmıştır;
 *  elle kopyalanmamıştır. Her tablo `kaynak` alanında hangi ek ve tabloya
 *  karşılık geldiğini bildirir.
 *
 *  Değerler uygulamanın "Yönetmelik Verileri" panelinden düzenlenebilir ve
 *  JSON olarak içe/dışa aktarılabilir; kod değiştirmeye gerek yoktur.
 *
 *  Resmî metin: https://www.mevzuat.gov.tr  (Mevzuat No: 23616)
 * ─────────────────────────────────────────────────────────────────────────
 */

export const SURUM = {
  yonetmelik: 'Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik',
  resmiGazete: '31/05/2017 – 30082 (değişik: 01/07/2018 – 30465)',
  veriSurumu: '2.0.0',
  dogrulama: 'EK tabloları resmî ek dosyasından (7.5.23616-Ek.docx) çıkarılmıştır',
};

/** Akustik performans sınıfları (A en yüksek, F en düşük performans). */
export const SINIFLAR = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Yönetmelik gereği asgari sınıflar.
 *
 * UYARI: Bu değerler Yönetmeliğin madde metnindedir; elimizdeki resmî EK
 * dosyasında yer almaz, dolayısıyla programlı olarak doğrulanmamıştır.
 */
export const ASGARI_SINIFLAR = {
  yeniBina: 'C',
  kullanimAmaciDegisikligi: 'D',
  esasliTadilat: 'D',
};

/**
 * Derece kodları.
 *
 * Yönetmelik, kaynak mekânın gürültülülüğünü YG/OG/DG, alıcı mekânın
 * hassasiyetini I/II/III ile kodlar. Uygulama içindeki anahtarlar
 * 'cok' | 'orta' | 'az' olup aşağıdaki karşılıklara sahiptir.
 */
export const GURULTULULUK_DERECELERI = {
  cok:  'YG — Yüksek seviye gürültü (LAF,max > 75 dB)',
  orta: 'OG — Orta seviye gürültü (75 ≥ LAF,max > 55 dB)',
  az:   'DG — Düşük seviye gürültü (LAF,max ≤ 55 dB)',
};

export const HASSASIYET_DERECELERI = {
  cok:  'I — Gürültüye karşı çok hassas',
  orta: 'II — Gürültüye karşı hassas',
  az:   'III — Gürültüye karşı az hassas',
};

/** Kısa kodlar (rapor ve belgede kullanılır). */
export const GURULTULULUK_KODU = { cok: 'YG', orta: 'OG', az: 'DG' };
export const HASSASIYET_KODU = { cok: 'I', orta: 'II', az: 'III' };

export const BINA_TURLERI = {
  konut:     'Konutlar',
  egitim:    'Eğitim Tesisleri',
  saglik:    'Sağlık Tesisleri / Yaşlı bakım evleri',
  buro:      'Büro ve İdari Binalar',
  konaklama: 'Konaklama Tesisleri',
  yurt:      'Yurt Binaları',
  kulturel:  'Kültürel Tesisler',
  ticari:    'Ticari Tesisler',
  terminal:  'Terminaller',
  dini:      'Dini Tesisler',
  spor:      'Eğlence / Spor Tesisleri',
  sanayi:    'Sanayi Tesisleri',
};

/**
 * EK-2 Tablo 2.1 — Çeşitli bina ve mekân işlevlerine bağlı gürültüye
 * hassasiyet / gürültülülük dereceleri.
 *
 * Satır sonundaki yorum, resmî tablodaki gürültülülük/hassasiyet kodudur.
 */
export const EK2_TABLO_2_1 = {
  kaynak: 'EK-2 Tablo 2.1',
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  mekanlar: [
    // ── Konutlar ──
    { id: 'konut-yatak-odalari',         binaTuru: 'konut',        ad: 'Yatak Odaları',                          gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'konut-yasam-alanlari',        binaTuru: 'konut',        ad: 'Yaşam Alanları',                         gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II
    { id: 'konut-mutfaklar-banyo',       binaTuru: 'konut',        ad: 'Mutfaklar /Banyo',                       gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'konut-sirkulasyon-alanlari',  binaTuru: 'konut',        ad: 'Sirkülasyon Alanları',                   gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'konut-teknik-merkezler',      binaTuru: 'konut',        ad: 'Teknik Merkezler',                       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III

    // ── Eğitim Tesisleri ──
    { id: 'egitim-derslikler',           binaTuru: 'egitim',       ad: 'Derslikler',                             gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'egitim-ozel-derslikler',      binaTuru: 'egitim',       ad: 'Özel Derslikler',                        gurultululuk: 'cok',      hassasiyet: 'orta' },   // YG/II
    { id: 'egitim-idari-odalar',         binaTuru: 'egitim',       ad: 'İdari Odalar',                           gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II
    { id: 'egitim-spor-salonu',          binaTuru: 'egitim',       ad: 'Spor Salonu',                            gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'egitim-okuma-odalari',        binaTuru: 'egitim',       ad: 'Okuma Odaları',                          gurultululuk: 'az',       hassasiyet: 'cok' },    // DG/I
    { id: 'egitim-sirkulasyon-alanlari', binaTuru: 'egitim',       ad: 'Sirkülasyon Alanları',                   gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'egitim-teknik-merkezler',     binaTuru: 'egitim',       ad: 'Teknik Merkezler',                       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'egitim-kresler-oyun',         binaTuru: 'egitim',       ad: 'Kreşler / Oyun-yemek alanı',             gurultululuk: 'cok',      hassasiyet: 'orta' },   // YG/II
    { id: 'egitim-kresler-yatak',        binaTuru: 'egitim',       ad: 'Kreşler / Yatak odaları',                gurultululuk: 'az',       hassasiyet: 'cok' },    // DG/I

    // ── Sağlık Tesisleri / Yaşlı bakım evleri ──
    { id: 'saglik-ozel-hasta',           binaTuru: 'saglik',       ad: 'Özel Hasta Odaları',                     gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'saglik-cok-yatakli',          binaTuru: 'saglik',       ad: 'Çok Yataklı Odalar',                     gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'saglik-ameliyathaneler',      binaTuru: 'saglik',       ad: 'Ameliyathaneler',                        gurultululuk: 'az',       hassasiyet: 'cok' },    // DG/I
    { id: 'saglik-muayene-tedavi',       binaTuru: 'saglik',       ad: 'Muayene-Tedavi Odaları',                 gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II
    { id: 'saglik-laboratuvarlar',       binaTuru: 'saglik',       ad: 'Laboratuvarlar',                         gurultululuk: 'az',       hassasiyet: 'orta' },   // DG/II
    { id: 'saglik-sirkulasyon-alanlari', binaTuru: 'saglik',       ad: 'Sirkülasyon Alanları',                   gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'saglik-teknik-merkezler',     binaTuru: 'saglik',       ad: 'Teknik Merkezler',                       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III

    // ── Büro ve İdari Binalar ──
    { id: 'buro-ozel-odalar',            binaTuru: 'buro',         ad: 'Özel Odalar',                            gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'buro-acik-planli',            binaTuru: 'buro',         ad: 'Açık Planlı Alanlar',                    gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II
    { id: 'buro-toplanti-odalari',       binaTuru: 'buro',         ad: 'Toplantı Odaları',                       gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'buro-telekonferans-odalari',  binaTuru: 'buro',         ad: 'Telekonferans Odaları',                  gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'buro-dinlenme-alanlari',      binaTuru: 'buro',         ad: 'Dinlenme Alanları',                      gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II
    { id: 'buro-sirkulasyon-alanlari',   binaTuru: 'buro',         ad: 'Sirkülasyon Alanları',                   gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'buro-teknik-merkezler',       binaTuru: 'buro',         ad: 'Teknik Merkezler',                       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'buro-mahkeme-salonlari',      binaTuru: 'buro',         ad: 'Mahkeme Salonları',                      gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II

    // ── Konaklama Tesisleri ──
    { id: 'konaklama-yatak-odalari',     binaTuru: 'konaklama',    ad: 'Yatak Odaları',                          gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'konaklama-lokantalar',        binaTuru: 'konaklama',    ad: 'Lokantalar',                             gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'konaklama-hizmet-destek',     binaTuru: 'konaklama',    ad: 'Hizmet Destek Alanları',                 gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'konaklama-sirkulasyon-alanlari', binaTuru: 'konaklama',    ad: 'Sirkülasyon Alanları',                   gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'konaklama-teknik-merkezler',  binaTuru: 'konaklama',    ad: 'Teknik Merkezler',                       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III

    // ── Yurt Binaları ──
    { id: 'yurt-yatakhane',              binaTuru: 'yurt',         ad: 'Yatakhane',                              gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'yurt-etud-odasi',             binaTuru: 'yurt',         ad: 'Etüd odası',                             gurultululuk: 'orta',     hassasiyet: 'cok' },    // OG/I
    { id: 'yurt-yemekhane',              binaTuru: 'yurt',         ad: 'Yemekhane',                              gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'yurt-sirkulasyon-alanlari',   binaTuru: 'yurt',         ad: 'Sirkülasyon Alanları',                   gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'yurt-teknik-merkezler',       binaTuru: 'yurt',         ad: 'Teknik Merkezler',                       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III

    // ── Kültürel Tesisler ──
    { id: 'kulturel-tiyatro-konferans',  binaTuru: 'kulturel',     ad: 'Tiyatro-Konferans Salonları-Oditoryum',  gurultululuk: 'cok',      hassasiyet: 'cok' },    // YG/I
    { id: 'kulturel-sinema-salonlari',   binaTuru: 'kulturel',     ad: 'Sinema Salonları',                       gurultululuk: 'cok',      hassasiyet: 'cok' },    // YG/I
    { id: 'kulturel-konser-salonlari',   binaTuru: 'kulturel',     ad: 'Konser Salonları',                       gurultululuk: 'cok',      hassasiyet: 'cok' },    // YG/I
    { id: 'kulturel-muzeler',            binaTuru: 'kulturel',     ad: 'Müzeler',                                gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II
    { id: 'kulturel-kutuphaneler',       binaTuru: 'kulturel',     ad: 'Kütüphaneler',                           gurultululuk: 'az',       hassasiyet: 'cok' },    // DG/I
    { id: 'kulturel-muzik-tv',           binaTuru: 'kulturel',     ad: 'Müzik-TV Stüdyoları',                    gurultululuk: 'cok',      hassasiyet: 'cok' },    // YG/I
    { id: 'kulturel-sirkulasyon-alanlari', binaTuru: 'kulturel',     ad: 'Sirkülasyon Alanları',                   gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'kulturel-teknik-merkezler',   binaTuru: 'kulturel',     ad: 'Teknik Merkezler',                       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III

    // ── Ticari Tesisler ──
    { id: 'ticari-magaza-dukkan',        binaTuru: 'ticari',       ad: 'Mağaza-Dükkan',                          gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'ticari-alisveris-merkezleri', binaTuru: 'ticari',       ad: 'Alışveriş Merkezleri',                   gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'ticari-supermarketler',       binaTuru: 'ticari',       ad: 'Süpermarketler',                         gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'ticari-postane-genel',        binaTuru: 'ticari',       ad: 'Postane - Genel Bankacılık',             gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II

    // ── Terminaller ──
    { id: 'terminal-bekleme-alanlari',   binaTuru: 'terminal',     ad: 'Bekleme Alanları',                       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'terminal-personel-ofis',      binaTuru: 'terminal',     ad: 'Personel Ofis - Dinlenme Odaları',       gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II

    // ── Dini Tesisler ──
    { id: 'dini-ibabet-alani',           binaTuru: 'dini',         ad: 'İbabet alanı',                           gurultululuk: 'cok',      hassasiyet: 'orta' },   // YG/II

    // ── Eğlence / Spor Tesisleri ──
    { id: 'spor-lokantalar-yemek',       binaTuru: 'spor',         ad: 'Lokantalar-Yemek Alanları',              gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'spor-eglence-yerleri',        binaTuru: 'spor',         ad: 'Eğlence Yerleri',                        gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'spor-spor-tesisleri',         binaTuru: 'spor',         ad: 'Spor Tesisleri / Spor Salonları',        gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'spor-spor-tesisleri2',        binaTuru: 'spor',         ad: 'Spor Tesisleri / Yüzme Havuzları',       gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III

    // ── Sanayi Tesisleri ──
    { id: 'sanayi-endustriyel-isleme',   binaTuru: 'sanayi',       ad: 'Endüstriyel İşleme ve Üretim Alanları',  gurultululuk: 'cok',      hassasiyet: 'az' },     // YG/III
    { id: 'sanayi-laboratuar-test',      binaTuru: 'sanayi',       ad: 'Laboratuar - Test Alanları',             gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'sanayi-montaj-alanlari',      binaTuru: 'sanayi',       ad: 'Montaj Alanları',                        gurultululuk: 'cok',      hassasiyet: 'az' },     // OG/YG/III
    { id: 'sanayi-hassas-montaj',        binaTuru: 'sanayi',       ad: 'Hassas Montaj veya Ölçüm Alanları',      gurultululuk: 'cok',      hassasiyet: 'orta' },   // YG/II
    { id: 'sanayi-kontrol-odalari',      binaTuru: 'sanayi',       ad: 'Kontrol Odaları',                        gurultululuk: 'orta',     hassasiyet: 'az' },     // OG/III
    { id: 'sanayi-personel-ofis',        binaTuru: 'sanayi',       ad: 'Personel Ofis - Dinlenme Odaları',       gurultululuk: 'orta',     hassasiyet: 'orta' },   // OG/II
    { id: 'sanayi-saglik-odalari',       binaTuru: 'sanayi',       ad: 'Sağlık Odaları',                         gurultululuk: 'az',       hassasiyet: 'orta' },   // DG/II
  ],
};

/**
 * EK-2 Tablo 2.2 — Akustik performans sınıflarının dayandığı öznel
 * değerlendirmeler (kaynak türüne göre işitilebilirlik).
 */
export const EK2_TABLO_2_2 = {
  kaynak: 'EK-2 Tablo 2.2',
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  /** Sınıf bandı nitelemesi: A–B yüksek, C–D orta, E–F düşük koruma. */
  bantlar: { A: 'Yüksek', B: 'Yüksek', C: 'Orta', D: 'Orta', E: 'Düşük', F: 'Düşük' },
  satirlar: [
    { grup: 'Konuşma sesi', kaynak: 'Çok yüksek ses',
      A: 'güçlükle işitiliyor, ama anlaşılmıyor', B: 'işitiliyor, ama güçlükle anlaşılıyor',
      C: 'hafifçe anlaşılıyor', D: 'anlaşılıyor', E: 'rahatça anlaşılıyor', F: 'rahatça anlaşılıyor' },
    { grup: 'Konuşma sesi', kaynak: 'Yüksek sesle konuşma',
      A: 'güçlükle işitiliyor', B: 'hafifçe işitiliyor ama hiç anlaşılmıyor',
      C: 'işitiliyor, ama güçlükle anlaşılıyor', D: 'hafifçe anlaşılıyor', E: 'anlaşılıyor', F: 'rahatça anlaşılıyor' },
    { grup: 'Konuşma sesi', kaynak: 'Normal konuşma',
      A: 'işitilmiyor', B: 'güçlükle işitiliyor', C: 'hafifçe işitiliyor ama hiç anlaşılmıyor',
      D: 'güçlükle anlaşılıyor', E: 'hafifçe anlaşılıyor', F: 'anlaşılıyor' },
    { grup: 'Müzikal ses', kaynak: 'Çok yüksek müzik, parti',
      A: 'hafifçe işitiliyor', B: 'işitiliyor', C: 'rahatça işitiliyor',
      D: 'çok rahatça işitiliyor', E: 'çok rahatça işitiliyor', F: 'çok rahatça işitiliyor' },
    { grup: 'Müzikal ses', kaynak: 'Yüksek müzik',
      A: 'işitilmiyor', B: 'hafifçe işitiliyor', C: 'işitiliyor',
      D: 'rahatça işitiliyor', E: 'çok rahat işitiliyor', F: 'çok rahat işitiliyor' },
    { grup: 'Müzikal ses', kaynak: 'Normal müzik',
      A: 'işitilmiyor', B: 'işitilmiyor', C: 'hafifçe işitiliyor',
      D: 'işitiliyor', E: 'rahatça işitiliyor', F: 'çok rahat işitiliyor' },
    { grup: 'Darbe sesi', kaynak: 'Adım sesi',
      A: 'işitilmiyor', B: 'güçlükle işitiliyor', C: 'hafifçe işitiliyor',
      D: 'işitiliyor', E: 'rahatça işitiliyor', F: 'çok rahat işitiliyor' },
    { grup: 'Darbe sesi', kaynak: 'Çocuk oynaması',
      A: 'güçlükle işitiliyor', B: 'hafifçe işitiliyor', C: 'işitiliyor',
      D: 'rahatça işitiliyor', E: 'çok rahatça işitiliyor', F: 'çok rahatça işitiliyor' },
    { grup: 'Darbe sesi', kaynak: 'Eşyaların sürüklenmesi, yere düşürülmesi',
      A: 'işitilmiyor', B: 'güçlükle işitiliyor', C: 'hafifçe işitiliyor',
      D: 'işitiliyor', E: 'rahatça işitiliyor', F: 'çok rahat işitiliyor' },
  ],
  /** Ses yalıtımının zayıf olarak nitelendirilme oranı. */
  zayifOran: { A: "%5'ten az", B: '%5 civarı', C: '%10 civarı', D: '%20 civarı', E: '%35 civarı', F: '%50 civarı' },
};

/**
 * EK-3 Tablo 3.1 — Dış gürültü düzeylerine ve alıcı odası hassasiyet
 * derecesine göre sağlanacak EN DÜŞÜK ses yalıtım değerleri, DnT,A,tr (dB).
 *
 * Resmî tablo sabit bir dB matrisi DEĞİLDİR: gereken yalıtım, cephedeki
 * çevresel gürültü göstergesi Lgag'dan sınıf ve hassasiyete bağlı bir
 * çıkarma ile bulunur:
 *
 *     DnT,A,tr ≥ Lgag − indirim[hassasiyet][sınıf]
 */
export const EK3_TABLO_3_1 = {
  kaynak: 'EK-3 Tablo 3.1 — Dış yapı elemanları, DnT,A,tr (dB)',
  gosterge: 'DnT,A,tr',
  yon: 'enAz',
  birim: 'dB',
  bicim: 'Lgag-farki',   // sabit matris değil, Lgag'dan çıkarma
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  /** indirim[alıcı hassasiyeti][sınıf] — Lgag'dan çıkarılacak dB. */
  indirim: {
    cok:  { A: 14, B: 18, C: 22, D: 26, E: 30, F: 34 },   // I
    orta: { A: 17, B: 21, C: 25, D: 29, E: 33, F: 37 },   // II
    az:   { A: 20, B: 24, C: 28, D: 32, E: 36, F: 40 },   // III
  },
};

/**
 * EK-3 Tablo 3.2 — Kaynak ve alıcı odası özelliklerine göre sağlanacak
 * EN DÜŞÜK hava doğuşlu ses yalıtım değerleri, DnT,A (dB).
 *
 * Anahtar: `${kaynağın gürültülülük derecesi}-${alıcının hassasiyet derecesi}`
 *
 * NOT: Konut yapılarında BAĞIMSIZ BİRİM İÇİNDEKİ bölme elemanları için
 * Tablo 3.4 kullanılır (resmî tablo dipnotu 4).
 */
export const EK3_TABLO_3_2 = {
  kaynak: 'EK-3 Tablo 3.2 — Ayırıcı elemanlar, DnT,A (dB)',
  gosterge: 'DnT,A',
  yon: 'enAz',
  birim: 'dB',
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  degerler: {
    'cok-cok':   { A: 68, B: 64, C: 58, D: 54, E: 50, F: 46 },   // YG / I
    'cok-orta':  { A: 65, B: 61, C: 55, D: 51, E: 47, F: 43 },   // YG / II
    'cok-az':    { A: 62, B: 58, C: 52, D: 48, E: 44, F: 40 },   // YG / III
    'orta-cok':  { A: 62, B: 58, C: 52, D: 48, E: 44, F: 40 },   // OG / I
    'orta-orta': { A: 59, B: 55, C: 49, D: 45, E: 41, F: 37 },   // OG / II
    'orta-az':   { A: 56, B: 52, C: 46, D: 42, E: 38, F: 34 },   // OG / III
    'az-cok':    { A: 56, B: 52, C: 46, D: 42, E: 38, F: 34 },   // DG / I
    'az-orta':   { A: 53, B: 49, C: 43, D: 39, E: 35, F: 31 },   // DG / II
    'az-az':     { A: 50, B: 46, C: 40, D: 36, E: 32, F: 28 },   // DG / III
  },
};

/**
 * EK-3 Tablo 3.3 — Kaynak odası özelliklerine göre sağlanacak EN YÜKSEK
 * darbe sesi düzeyleri, L'nT,w (dB).
 *
 * DİKKAT: Resmî tablo YALNIZCA kaynak (üst) mekânın gürültülülük derecesine
 * bağlıdır; alıcı mekânın hassasiyet derecesi bu tabloya girmez.
 *
 * NOT: Konut yapılarında bağımsız birim içindeki döşemeler için Tablo 3.5
 * kullanılır (resmî tablo dipnotu 2).
 */
export const EK3_TABLO_3_3 = {
  kaynak: "EK-3 Tablo 3.3 — Döşemeler, L'nT,w (dB)",
  gosterge: "L'nT,w",
  yon: 'enCok',
  birim: 'dB',
  anahtar: 'kaynakGurultululuk',   // yalnızca kaynak mekâna bağlı
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  degerler: {
    cok:  { A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 },   // YG
    orta: { A: 46, B: 50, C: 54, D: 58, E: 62, F: 66 },   // OG
    az:   { A: 50, B: 54, C: 58, D: 62, E: 66, F: 70 },   // DG
  },
};

/**
 * EK-3 Tablo 3.4 — Farklı bina tiplerinde komşu hacimler arasında
 * sağlanacak EN DÜŞÜK hava doğuşlu ses yalıtım değerleri, DnT,A (dB).
 *
 * Konut yapılarında bağımsız birim İÇİNDEKİ bölme elemanlarında Tablo 3.2
 * yerine bu tablo kullanılır.
 */
export const EK3_TABLO_3_4 = {
  kaynak: 'EK-3 Tablo 3.4 — Bina tipine göre komşuluk, DnT,A (dB)',
  gosterge: 'DnT,A',
  yon: 'enAz',
  birim: 'dB',
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  satirlar: [
    { id: 'konut-ticari-bagimsiz', binaTuru: 'konut', kaynak: 'Ticari işletme / Teknik merkez', alici: 'Bağımsız birim',
      A: 68, B: 64, C: 58, D: 54, E: 50, F: 46 },
    { id: 'konut-birim-birim', binaTuru: 'konut', kaynak: 'Bağımsız birim / Ortak alan', alici: 'Bağımsız birim / Ortak alan',
      A: 62, B: 58, C: 52, D: 48, E: 44, F: 40 },
    { id: 'konut-ici', binaTuru: 'konut', kaynak: 'Yatak odası / Yaşam alanı / Mutfak-banyo', alici: 'Aynı bağımsız birimde yatak odası / yaşam alanı',
      A: 54, B: 50, C: 44, D: 40, E: 36, F: 32 },
    { id: 'egitim-derslik-derslik', binaTuru: 'egitim', kaynak: 'Derslik / İdari oda / Sirkülasyon', alici: 'Derslik / Okuma odası / Yatak odası (kreş)',
      A: 62, B: 58, C: 52, D: 48, E: 44, F: 40 },
    { id: 'egitim-ozel-derslik', binaTuru: 'egitim', kaynak: 'Özel derslik / Spor salonu / Oyun alanı / Teknik merkez', alici: 'Derslik / Okuma odası / Yatak odası (kreş)',
      A: 68, B: 64, C: 58, D: 54, E: 50, F: 46 },
    { id: 'egitim-ozel-ozel', binaTuru: 'egitim', kaynak: 'Özel derslik / Spor salonu / Oyun alanı / Teknik merkez', alici: 'Özel derslik / Oyun alanı (kreş)',
      A: 65, B: 61, C: 55, D: 51, E: 47, F: 43 },
    { id: 'egitim-kres-yatak', binaTuru: 'egitim', kaynak: 'Yatak odası (kreş)', alici: 'Yatak odası (kreş)',
      A: 56, B: 52, C: 46, D: 42, E: 38, F: 34 },
    { id: 'saglik-hasta-hasta', binaTuru: 'saglik', kaynak: 'Hasta odası / Muayene odası / Sirkülasyon', alici: 'Hasta odası / Ameliyathane',
      A: 62, B: 58, C: 52, D: 48, E: 44, F: 40 },
    { id: 'saglik-hasta-muayene', binaTuru: 'saglik', kaynak: 'Hasta odası / Muayene odası / Sirkülasyon', alici: 'Muayene odası / Laboratuvar',
      A: 59, B: 55, C: 49, D: 45, E: 41, F: 37 },
    { id: 'saglik-teknik-hasta', binaTuru: 'saglik', kaynak: 'Teknik merkez', alici: 'Hasta odası / Ameliyathane',
      A: 68, B: 64, C: 58, D: 54, E: 50, F: 46 },
    { id: 'saglik-teknik-muayene', binaTuru: 'saglik', kaynak: 'Teknik merkez', alici: 'Muayene odası / Laboratuvar',
      A: 65, B: 61, C: 55, D: 51, E: 47, F: 43 },
    { id: 'buro-genel-acik', binaTuru: 'buro', kaynak: 'Özel oda / Açık plan / Toplantı / Dinlenme / Sirkülasyon', alici: 'Açık planlı alan / Dinlenme alanı',
      A: 59, B: 55, C: 49, D: 45, E: 41, F: 37 },
    { id: 'buro-genel-ozel', binaTuru: 'buro', kaynak: 'Özel oda / Açık plan / Toplantı / Dinlenme / Sirkülasyon', alici: 'Özel oda / Toplantı odası',
      A: 62, B: 58, C: 52, D: 48, E: 44, F: 40 },
    { id: 'buro-teknik-acik', binaTuru: 'buro', kaynak: 'Teknik merkez', alici: 'Açık planlı alan / Dinlenme alanı',
      A: 65, B: 61, C: 55, D: 51, E: 47, F: 43 },
    { id: 'buro-teknik-ozel', binaTuru: 'buro', kaynak: 'Teknik merkez', alici: 'Özel oda / Toplantı odası',
      A: 68, B: 64, C: 58, D: 54, E: 50, F: 46 },
    { id: 'konaklama-yatak-yatak', binaTuru: 'konaklama', kaynak: 'Yatak odası / Sirkülasyon', alici: 'Yatak odası',
      A: 62, B: 58, C: 52, D: 48, E: 44, F: 40 },
    { id: 'konaklama-lokanta-yatak', binaTuru: 'konaklama', kaynak: 'Lokanta / Hizmet destek / Teknik merkez', alici: 'Yatak odası',
      A: 68, B: 64, C: 58, D: 54, E: 50, F: 46 },
    { id: 'yurt-yatakhane', binaTuru: 'yurt', kaynak: 'Yatakhane / Etüd odası / Sirkülasyon', alici: 'Yatakhane / Etüd odası',
      A: 62, B: 58, C: 52, D: 48, E: 44, F: 40 },
    { id: 'yurt-yemekhane', binaTuru: 'yurt', kaynak: 'Yemekhane / Teknik merkez', alici: 'Yatakhane / Etüd odası',
      A: 68, B: 64, C: 58, D: 54, E: 50, F: 46 },
  ],
};

/**
 * EK-3 Tablo 3.5 — Farklı bina tiplerinde kaynak odası döşemelerinde
 * sağlanacak EN YÜKSEK darbe sesi düzeyleri, L'nT,w (dB).
 *
 * Konut yapılarında bağımsız birim İÇİNDEKİ döşemelerde Tablo 3.3 yerine
 * bu tablo kullanılır.
 */
export const EK3_TABLO_3_5 = {
  kaynak: "EK-3 Tablo 3.5 — Bina tipine göre döşemeler, L'nT,w (dB)",
  gosterge: "L'nT,w",
  yon: 'enCok',
  birim: 'dB',
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  satirlar: [
    { id: 'konut-birim', binaTuru: 'konut', kaynak: 'Bağımsız birim / Ortak alan',
      A: 46, B: 50, C: 54, D: 58, E: 62, F: 66 },
    { id: 'konut-ticari', binaTuru: 'konut', kaynak: 'Ticari işletme / Teknik merkez / Çatı üstü ekipmanı',
      A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 },
    { id: 'konut-ici', binaTuru: 'konut', kaynak: 'Aynı bağımsız birime ait mekânlar arası döşemeler',
      A: 54, B: 58, C: 62, D: 66, E: 70, F: 74 },
    { id: 'egitim-derslik', binaTuru: 'egitim', kaynak: 'Derslik / İdari oda / Sirkülasyon',
      A: 46, B: 50, C: 54, D: 58, E: 62, F: 66 },
    { id: 'egitim-ozel', binaTuru: 'egitim', kaynak: 'Özel derslik / Spor salonu / Oyun alanı / Teknik merkez',
      A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 },
    { id: 'egitim-okuma', binaTuru: 'egitim', kaynak: 'Okuma odası / Yatak odası (kreş)',
      A: 50, B: 54, C: 58, D: 62, E: 66, F: 70 },
    { id: 'saglik-hasta', binaTuru: 'saglik', kaynak: 'Hasta odası / Muayene odası / Sirkülasyon',
      A: 46, B: 50, C: 54, D: 58, E: 62, F: 66 },
    { id: 'saglik-ameliyat', binaTuru: 'saglik', kaynak: 'Ameliyathane / Laboratuvar',
      A: 50, B: 54, C: 58, D: 62, E: 66, F: 70 },
    { id: 'saglik-teknik', binaTuru: 'saglik', kaynak: 'Teknik merkez',
      A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 },
    { id: 'buro-genel', binaTuru: 'buro', kaynak: 'Özel oda / Açık plan / Toplantı / Dinlenme / Sirkülasyon',
      A: 46, B: 50, C: 54, D: 58, E: 62, F: 66 },
    { id: 'buro-teknik', binaTuru: 'buro', kaynak: 'Teknik merkez / Çatı üstü ekipmanı',
      A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 },
    { id: 'konaklama-yatak', binaTuru: 'konaklama', kaynak: 'Yatak odası / Sirkülasyon',
      A: 46, B: 50, C: 54, D: 58, E: 62, F: 66 },
    { id: 'konaklama-restoran', binaTuru: 'konaklama', kaynak: 'Restoran / Hizmet destek / Teknik merkez / Çatı üstü ekipmanı',
      A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 },
    { id: 'yurt-yatakhane', binaTuru: 'yurt', kaynak: 'Yatakhane / Etüd odası / Sirkülasyon',
      A: 46, B: 50, C: 54, D: 58, E: 62, F: 66 },
    { id: 'yurt-yemekhane', binaTuru: 'yurt', kaynak: 'Yemekhane / Teknik merkez / Çatı üstü ekipmanı',
      A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 },
  ],
};

/**
 * EK-4 Tablo 4.1 — Akustik performans sınıfına bağlı izin verilen mekân içi
 * en yüksek gürültü düzeyleri, LAeq (dB).
 */
export const EK4_TABLO_4_1 = {
  kaynak: 'EK-4 Tablo 4.1 — Mekân içi gürültü düzeyleri, LAeq (dB)',
  gosterge: 'LAeq',
  yon: 'enCok',
  birim: 'dB',
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  degerler: {
    // ── Konutlar ──
    'konut-yatak-odalari':           { A: 26, B: 30, C: 34, D: 38, E: 42, F: 46, zaman: 'Gece' },
    'konut-yasam-alanlari':          { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },
    'konut-mutfaklar-banyo':         { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },

    // ── Eğitim Tesisleri ──
    'egitim-derslikler':             { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: 'Gündüz-Akşam' },
    'egitim-ozel-derslikler':        { A: 36, B: 40, C: 44, D: 48, E: 52, F: 56, zaman: 'Gündüz-Akşam' },
    'egitim-idari-odalar':           { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: 'Gündüz-Akşam' },
    'egitim-spor-salonu':            { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: 'Gündüz-Akşam' },
    'egitim-okuma-odalari':          { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: 'Gündüz-Akşam' },
    'egitim-sirkulasyon-alanlari':   { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: 'Gündüz-Akşam' },
    'egitim-kresler-oyun':           { A: 36, B: 40, C: 44, D: 48, E: 52, F: 56, zaman: 'Gündüz' },
    'egitim-kresler-yatak':          { A: 26, B: 30, C: 34, D: 38, E: 42, F: 46, zaman: 'Gündüz' },

    // ── Sağlık Tesisleri / Yaşlı bakım evleri ──
    'saglik-ozel-hasta':             { A: 26, B: 30, C: 34, D: 38, E: 42, F: 46, zaman: '24 saat' },
    'saglik-cok-yatakli':            { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },
    'saglik-ameliyathaneler':        { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },
    'saglik-muayene-tedavi':         { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },
    'saglik-laboratuvarlar':         { A: 36, B: 40, C: 44, D: 48, E: 52, F: 56, zaman: '24 saat' },
    'saglik-sirkulasyon-alanlari':   { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },

    // ── Konaklama Tesisleri ──
    'konaklama-yatak-odalari':       { A: 26, B: 30, C: 34, D: 38, E: 42, F: 46, zaman: 'Gece' },
    'konaklama-lokantalar':          { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },
    'konaklama-hizmet-destek':       { A: 46, B: 50, C: 54, D: 58, E: 62, F: 66, zaman: '24 saat' },
    'konaklama-sirkulasyon-alanlari': { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },

    // ── Yurt Binaları ──
    'yurt-yatakhane':                { A: 26, B: 30, C: 34, D: 38, E: 42, F: 46, zaman: 'Gece' },
    'yurt-etud-odasi':               { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: 'Gündüz-Akşam' },
    'yurt-yemekhane':                { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },
    'yurt-sirkulasyon-alanlari':     { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },

    // ── Kültürel Tesisler ──
    'kulturel-tiyatro-konferans':    { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },
    'kulturel-sinema-salonlari':     { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },
    'kulturel-konser-salonlari':     { A: 26, B: 30, C: 34, D: 38, E: 42, F: 46, zaman: '24 saat' },
    'kulturel-muzeler':              { A: 36, B: 40, C: 44, D: 48, E: 52, F: 56, zaman: 'Gündüz' },
    'kulturel-kutuphaneler':         { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },
    'kulturel-muzik-tv':             { A: 21, B: 25, C: 29, D: 33, E: 37, F: 41, zaman: '24 saat' },
    'kulturel-sirkulasyon-alanlari': { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },

    // ── Ticari Tesisler ──
    'ticari-magaza-dukkan':          { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: 'Gündüz-Akşam' },
    'ticari-supermarketler':         { A: 46, B: 50, C: 54, D: 58, E: 62, F: 66, zaman: 'Gündüz-Akşam' },
    'ticari-postane-genel':          { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: 'Gündüz-Akşam' },

    // ── Terminaller ──
    'terminal-bekleme-alanlari':     { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },
    'terminal-personel-ofis':        { A: 36, B: 40, C: 44, D: 48, E: 52, F: 56, zaman: '24 saat' },

    // ── Dini Tesisler ──
    'dini-ibabet-alani':             { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },

    // ── Eğlence / Spor Tesisleri ──
    'spor-lokantalar-yemek':         { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },
    'spor-spor-tesisleri':           { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: 'Gündüz' },

    // ── Sanayi Tesisleri ──
    'sanayi-hassas-montaj':          { A: 41, B: 45, C: 49, D: 53, E: 57, F: 61, zaman: '24 saat' },
    'sanayi-kontrol-odalari':        { A: 51, B: 55, C: 59, D: 63, E: 67, F: 71, zaman: '24 saat' },
    'sanayi-personel-ofis':          { A: 36, B: 40, C: 44, D: 48, E: 52, F: 56, zaman: '24 saat' },
    'sanayi-saglik-odalari':         { A: 31, B: 35, C: 39, D: 43, E: 47, F: 51, zaman: '24 saat' },
  },
};

/**
 * EK-6 Tablo 6.1 — Akustik performans sınıfına bağlı olarak sağlanacak
 * en yüksek reverberasyon süreleri, T (s).
 *
 * Resmî tablo tek bir sütun verir ve bu sütun C–D sınıfı içindir.
 * `Tmax: null` olan mekânlar için yönetmelik değer vermez; bu mekânlar
 * işlevine özgü akustik tasarım gerektirir.
 */
export const EK6_TABLO_6_1 = {
  kaynak: 'EK-6 Tablo 6.1 — Reverberasyon süreleri, T (s), C–D sınıfı',
  gosterge: 'T',
  birim: 's',
  sinifBandi: 'C-D',
  dogrulama: 'Resmî ek dosyasından çıkarıldı',
  mekanlar: [
    // ── Konutlar ──
    { id: 'konut-yatak-odalari',         ad: 'Yatak Odaları',                          Tmax: 0.5 },
    { id: 'konut-yasam-alanlari',        ad: 'Yaşam Alanları',                         Tmax: 0.8 },
    { id: 'konut-sirkulasyon-alanlari',  ad: 'Sirkülasyon Alanları',                   Tmax: 1.2 },

    // ── Eğitim Tesisleri ──
    { id: 'egitim-derslikler',           ad: 'Derslikler',                             Tmax: 0.8 },
    { id: 'egitim-idari-odalar',         ad: 'İdari Odalar',                           Tmax: 0.8 },
    { id: 'egitim-spor-salonu',          ad: 'Spor Salonu',                            Tmax: 1.8 },
    { id: 'egitim-okuma-odalari',        ad: 'Okuma Odaları',                          Tmax: 0.8 },
    { id: 'egitim-sirkulasyon-alanlari', ad: 'Sirkülasyon Alanları',                   Tmax: 1.2 },
    { id: 'egitim-kresler-oyun',         ad: 'Kreşler / Oyun-yemek alanı',             Tmax: 0.8 },
    { id: 'egitim-kresler-yatak',        ad: 'Kreşler / Yatak odaları',                Tmax: 0.5 },

    // ── Sağlık Tesisleri / Yaşlı bakım evleri ──
    { id: 'saglik-ozel-hasta',           ad: 'Özel Hasta Odaları',                     Tmax: 0.5 },
    { id: 'saglik-cok-yatakli',          ad: 'Çok Yataklı Odalar',                     Tmax: 1.0 },
    { id: 'saglik-laboratuvarlar',       ad: 'Laboratuvarlar',                         Tmax: 0.8 },
    { id: 'saglik-sirkulasyon-alanlari', ad: 'Sirkülasyon Alanları',                   Tmax: 1.2 },

    // ── Konaklama Tesisleri ──
    { id: 'konaklama-yatak-odalari',     ad: 'Yatak Odaları',                          Tmax: 0.5 },
    { id: 'konaklama-lokantalar',        ad: 'Lokantalar',                             Tmax: 1.0 },
    { id: 'konaklama-hizmet-destek',     ad: 'Hizmet Destek Alanları',                 Tmax: 1.0 },
    { id: 'konaklama-sirkulasyon-alanlari', ad: 'Sirkülasyon Alanları',                   Tmax: 1.2 },

    // ── Yurt Binaları ──
    { id: 'yurt-yatakhane',              ad: 'Yatakhane',                              Tmax: 0.5 },
    { id: 'yurt-etud-odasi',             ad: 'Etüd odası',                             Tmax: 0.8 },
    { id: 'yurt-yemekhane',              ad: 'Yemekhane',                              Tmax: 1.2 },
    { id: 'yurt-sirkulasyon-alanlari',   ad: 'Sirkülasyon Alanları',                   Tmax: 1.2 },

    // ── Kültürel Tesisler ──
    { id: 'kulturel-tiyatro-konferans',  ad: 'Tiyatro-Konferans Salonları-Oditoryum',  Tmax: null },   // özel akustik tasarım gerektirir
    { id: 'kulturel-sinema-salonlari',   ad: 'Sinema Salonları',                       Tmax: null },   // özel akustik tasarım gerektirir
    { id: 'kulturel-konser-salonlari',   ad: 'Konser Salonları',                       Tmax: null },   // özel akustik tasarım gerektirir
    { id: 'kulturel-muzeler',            ad: 'Müzeler',                                Tmax: 1.2 },
    { id: 'kulturel-kutuphaneler',       ad: 'Kütüphaneler',                           Tmax: 0.8 },
    { id: 'kulturel-muzik-tv',           ad: 'Müzik-TV Stüdyoları',                    Tmax: null },   // özel akustik tasarım gerektirir
    { id: 'kulturel-sirkulasyon-alanlari', ad: 'Sirkülasyon Alanları',                   Tmax: 1.2 },

    // ── Ticari Tesisler ──
    { id: 'ticari-magaza-dukkan',        ad: 'Mağaza-Dükkan',                          Tmax: 1.0 },
    { id: 'ticari-alisveris-merkezleri', ad: 'Alışveriş Merkezleri',                   Tmax: 2.0 },
    { id: 'ticari-supermarketler',       ad: 'Süpermarketler',                         Tmax: 2.0 },
    { id: 'ticari-postane-genel',        ad: 'Postane - Genel Bankacılık',             Tmax: 1.2 },

    // ── Terminaller ──
    { id: 'terminal-bekleme-alanlari',   ad: 'Bekleme Alanları',                       Tmax: 1.0 },
    { id: 'terminal-personel-ofis',      ad: 'Personel Ofis - Dinlenme Odaları',       Tmax: 0.8 },

    // ── Dini Tesisler ──
    { id: 'dini-ibabet-alani',           ad: 'İbabet alanı',                           Tmax: null },   // özel akustik tasarım gerektirir

    // ── Eğlence / Spor Tesisleri ──
    { id: 'spor-eglence-yerleri',        ad: 'Eğlence Yerleri',                        Tmax: 1.0 },
    { id: 'spor-spor-tesisleri',         ad: 'Spor Tesisleri / Spor Salonları',        Tmax: null },   // özel akustik tasarım gerektirir

    // ── Sanayi Tesisleri ──
    { id: 'sanayi-endustriyel-isleme',   ad: 'Endüstriyel İşleme ve Üretim Alanları',  Tmax: null },   // özel akustik tasarım gerektirir
    { id: 'sanayi-montaj-alanlari',      ad: 'Montaj Alanları',                        Tmax: null },   // özel akustik tasarım gerektirir
    { id: 'sanayi-personel-ofis',        ad: 'Personel Ofis - Dinlenme Odaları',       Tmax: 0.8 },
  ],
};

/** Geriye dönük ad (eski kod ve dışa aktarımlar EK5_REVERBERASYON kullanıyordu). */
export const EK5_REVERBERASYON = EK6_TABLO_6_1;

/**
 * Tüm yönetmelik verisini tek bir nesnede toplar (dışa aktarma için).
 */
export function veriPaketi() {
  return {
    SURUM,
    ASGARI_SINIFLAR,
    EK2_TABLO_2_1,
    EK2_TABLO_2_2,
    EK3_TABLO_3_1,
    EK3_TABLO_3_2,
    EK3_TABLO_3_3,
    EK3_TABLO_3_4,
    EK3_TABLO_3_5,
    EK4_TABLO_4_1,
    EK6_TABLO_6_1,
  };
}

/**
 * EK-2 Tablo 2.1 mekân kimlikleri, veri sürümü 2.0.0'da resmî ek dosyasındaki
 * mekân listesine göre yeniden kuruldu. Eski projelerin ve kayıtlı çalışmaların
 * açılmaya devam etmesi için eski kimlikler burada yeni karşılıklarına eşlenir.
 *
 * Eşlemeler resmî Tablo 2.1'deki en yakın mekâna yapılmıştır; karşılığı
 * bulunmayan (yönetmelikte yer almayan) mekânlar işlevce en yakın resmî
 * mekâna yönlendirilir.
 */
export const MEKAN_KIMLIK_GOCU = {
  // ── Konut ──
  'konut-yatak':      'konut-yatak-odalari',
  'konut-oturma':     'konut-yasam-alanlari',
  'konut-mutfak':     'konut-mutfaklar-banyo',
  'konut-banyo':      'konut-mutfaklar-banyo',
  'konut-hol':        'konut-sirkulasyon-alanlari',
  'konut-merdiven':   'konut-sirkulasyon-alanlari',
  'konut-tesisat':    'konut-teknik-merkezler',
  'konut-otopark':    'konut-teknik-merkezler',
  // ── Konaklama ──
  'otel-oda':         'konaklama-yatak-odalari',
  'otel-koridor':     'konaklama-sirkulasyon-alanlari',
  'otel-lobi':        'konaklama-sirkulasyon-alanlari',
  'otel-restoran':    'konaklama-lokantalar',
  'otel-eglence':     'konaklama-lokantalar',
  // ── Eğitim ──
  'okul-derslik':     'egitim-derslikler',
  'okul-amfi':        'egitim-ozel-derslikler',
  'okul-kutuphane':   'egitim-okuma-odalari',
  'okul-muzik':       'egitim-ozel-derslikler',
  'okul-spor':        'egitim-spor-salonu',
  'okul-koridor':     'egitim-sirkulasyon-alanlari',
  'okul-yemekhane':   'egitim-sirkulasyon-alanlari',
  'okul-atolye':      'egitim-ozel-derslikler',
  // ── Sağlık ──
  'hastane-yatak':    'saglik-ozel-hasta',
  'hastane-muayene':  'saglik-muayene-tedavi',
  'hastane-ameliyat': 'saglik-ameliyathaneler',
  'hastane-yogun':    'saglik-cok-yatakli',
  'hastane-bekleme':  'saglik-sirkulasyon-alanlari',
  'hastane-koridor':  'saglik-sirkulasyon-alanlari',
  // ── Büro ──
  'ofis-tek':         'buro-ozel-odalar',
  'ofis-acik':        'buro-acik-planli',
  'ofis-toplanti':    'buro-toplanti-odalari',
  'ofis-koridor':     'buro-sirkulasyon-alanlari',
  // ── Ticari ──
  'ticari-magaza':    'ticari-magaza-dukkan',
  'ticari-market':    'ticari-supermarketler',
  'ticari-imalat':    'sanayi-endustriyel-isleme',
};

/** Bir mekân kimliğini güncel karşılığına çevirir. */
export function mekanKimligiGuncelle(id) {
  return MEKAN_KIMLIK_GOCU[id] || id;
}
