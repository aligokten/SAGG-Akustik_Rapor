/**
 * yonetmelik.js — "Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik"
 * (RG 31/05/2017 – 30082; değişiklik RG 01/07/2018 – 30465) eklerindeki
 * gereksinim tablolarının makine okunabilir hâli.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DOĞRULAMA UYARISI
 * ─────────────────────────────────────────────────────────────────────────
 *  Bu dosyadaki sayısal sınır değerleri, yönetmeliğin eklerinin yapısına
 *  uygun biçimde kodlanmıştır; ancak RESMÎ METİNLE SATIR SATIR
 *  KARŞILAŞTIRILMADAN yasal dayanak olarak kullanılmamalıdır.
 *
 *  Her tablo `kaynak` alanında hangi ek ve tabloya karşılık geldiğini,
 *  `dogrulama` alanında ise doğrulama durumunu bildirir. Değerler
 *  uygulamanın "Yönetmelik Verileri" panelinden düzenlenebilir ve JSON
 *  olarak içe/dışa aktarılabilir; kod değiştirmeye gerek yoktur.
 *
 *  Resmî metin: https://www.mevzuat.gov.tr  (Mevzuat No: 23616)
 * ─────────────────────────────────────────────────────────────────────────
 */

export const SURUM = {
  yonetmelik: 'Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik',
  resmiGazete: '31/05/2017 – 30082 (değişik: 01/07/2018 – 30465)',
  veriSurumu: '1.0.0',
  dogrulama: 'TASLAK — sayısal değerler resmî metinle doğrulanmalıdır',
};

/** Akustik performans sınıfları (A en yüksek, F en düşük performans). */
export const SINIFLAR = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Yönetmelik gereği asgari sınıflar (Md. 6 vd.).
 */
export const ASGARI_SINIFLAR = {
  yeniBina: 'C',
  kullanimAmaciDegisikligi: 'D',
  esasliTadilat: 'D',
};

/**
 * EK-2 Tablo 2.2 — Hava doğuşlu ve darbe sesi yalıtımında akustik performans
 * sınıflarının öznel değerlendirmesi.
 */
export const EK2_TABLO_2_2 = {
  kaynak: 'EK-2 Tablo 2.2',
  dogrulama: 'yapı doğrulandı, ifadeler özetlenmiştir',
  siniflar: {
    A: { hava: 'Komşu mekândaki konuşma ve etkinlikler duyulmaz.',
         darbe: 'Üst kattaki yürüme sesleri duyulmaz.' },
    B: { hava: 'Komşu mekândaki yüksek sesli konuşma güçlükle duyulur.',
         darbe: 'Üst kattaki yürüme sesleri güçlükle duyulur.' },
    C: { hava: 'Komşu mekândaki yüksek sesli konuşma duyulur, anlaşılmaz.',
         darbe: 'Üst kattaki yürüme sesleri duyulur, rahatsız etmez.' },
    D: { hava: 'Komşu mekândaki normal konuşma duyulur, kısmen anlaşılır.',
         darbe: 'Üst kattaki yürüme sesleri rahatsız edici düzeyde duyulur.' },
    E: { hava: 'Komşu mekândaki normal konuşma anlaşılır.',
         darbe: 'Üst kattaki yürüme sesleri belirgin biçimde rahatsız eder.' },
    F: { hava: 'Komşu mekândaki fısıltı dahi duyulabilir.',
         darbe: 'Üst kattaki her türlü hareket rahatsız edicidir.' },
  },
};

/**
 * EK-2 Tablo 2.1 — Mekânların, kaynak olmaları hâlinde gürültülülük
 * dereceleri ve alıcı olmaları hâlinde gürültüye hassasiyet dereceleri.
 *
 * gurultululuk : 'cok' | 'orta' | 'az'
 * hassasiyet   : 'cok' | 'orta' | 'az'
 */
export const GURULTULULUK_DERECELERI = {
  cok:  'Çok gürültülü',
  orta: 'Gürültülü',
  az:   'Az gürültülü',
};

export const HASSASIYET_DERECELERI = {
  cok:  'Çok hassas',
  orta: 'Hassas',
  az:   'Az hassas',
};

export const EK2_TABLO_2_1 = {
  kaynak: 'EK-2 Tablo 2.1',
  dogrulama: 'TASLAK — mekân listesi resmî metinle genişletilmelidir',
  mekanlar: [
    // ── Konut ────────────────────────────────────────────────────────────
    { id: 'konut-yatak',      binaTuru: 'konut',   ad: 'Yatak odası',                 gurultululuk: 'az',   hassasiyet: 'cok'  },
    { id: 'konut-oturma',     binaTuru: 'konut',   ad: 'Oturma odası / salon',        gurultululuk: 'orta', hassasiyet: 'cok'  },
    { id: 'konut-mutfak',     binaTuru: 'konut',   ad: 'Mutfak',                      gurultululuk: 'orta', hassasiyet: 'az'   },
    { id: 'konut-banyo',      binaTuru: 'konut',   ad: 'Banyo / WC',                  gurultululuk: 'orta', hassasiyet: 'az'   },
    { id: 'konut-hol',        binaTuru: 'konut',   ad: 'Daire içi hol / koridor',     gurultululuk: 'az',   hassasiyet: 'az'   },
    { id: 'konut-merdiven',   binaTuru: 'konut',   ad: 'Ortak merdiven / sahanlık',   gurultululuk: 'orta', hassasiyet: 'az'   },
    { id: 'konut-otopark',    binaTuru: 'konut',   ad: 'Kapalı otopark',              gurultululuk: 'cok',  hassasiyet: 'az'   },
    { id: 'konut-tesisat',    binaTuru: 'konut',   ad: 'Tesisat / makine dairesi',    gurultululuk: 'cok',  hassasiyet: 'az'   },

    // ── Konaklama ────────────────────────────────────────────────────────
    { id: 'otel-oda',         binaTuru: 'otel',    ad: 'Otel yatak odası',            gurultululuk: 'az',   hassasiyet: 'cok'  },
    { id: 'otel-koridor',     binaTuru: 'otel',    ad: 'Otel koridoru',               gurultululuk: 'orta', hassasiyet: 'az'   },
    { id: 'otel-lobi',        binaTuru: 'otel',    ad: 'Lobi / resepsiyon',           gurultululuk: 'orta', hassasiyet: 'az'   },
    { id: 'otel-restoran',    binaTuru: 'otel',    ad: 'Restoran / kafe',             gurultululuk: 'cok',  hassasiyet: 'az'   },
    { id: 'otel-eglence',     binaTuru: 'otel',    ad: 'Eğlence mekânı / disko',      gurultululuk: 'cok',  hassasiyet: 'az'   },

    // ── Eğitim ───────────────────────────────────────────────────────────
    { id: 'okul-derslik',     binaTuru: 'okul',    ad: 'Derslik',                     gurultululuk: 'orta', hassasiyet: 'cok'  },
    { id: 'okul-amfi',        binaTuru: 'okul',    ad: 'Amfi / konferans salonu',     gurultululuk: 'orta', hassasiyet: 'cok'  },
    { id: 'okul-kutuphane',   binaTuru: 'okul',    ad: 'Kütüphane / çalışma salonu',  gurultululuk: 'az',   hassasiyet: 'cok'  },
    { id: 'okul-muzik',       binaTuru: 'okul',    ad: 'Müzik odası',                 gurultululuk: 'cok',  hassasiyet: 'orta' },
    { id: 'okul-spor',        binaTuru: 'okul',    ad: 'Spor salonu',                 gurultululuk: 'cok',  hassasiyet: 'az'   },
    { id: 'okul-koridor',     binaTuru: 'okul',    ad: 'Koridor / hol',               gurultululuk: 'cok',  hassasiyet: 'az'   },
    { id: 'okul-yemekhane',   binaTuru: 'okul',    ad: 'Yemekhane',                   gurultululuk: 'cok',  hassasiyet: 'az'   },
    { id: 'okul-atolye',      binaTuru: 'okul',    ad: 'Atölye / laboratuvar',        gurultululuk: 'cok',  hassasiyet: 'orta' },

    // ── Sağlık ───────────────────────────────────────────────────────────
    { id: 'hastane-yatak',    binaTuru: 'hastane', ad: 'Hasta yatak odası',           gurultululuk: 'az',   hassasiyet: 'cok'  },
    { id: 'hastane-muayene',  binaTuru: 'hastane', ad: 'Muayene odası',               gurultululuk: 'az',   hassasiyet: 'cok'  },
    { id: 'hastane-ameliyat', binaTuru: 'hastane', ad: 'Ameliyathane',                gurultululuk: 'orta', hassasiyet: 'cok'  },
    { id: 'hastane-yogun',    binaTuru: 'hastane', ad: 'Yoğun bakım',                 gurultululuk: 'az',   hassasiyet: 'cok'  },
    { id: 'hastane-bekleme',  binaTuru: 'hastane', ad: 'Bekleme salonu',              gurultululuk: 'cok',  hassasiyet: 'az'   },
    { id: 'hastane-koridor',  binaTuru: 'hastane', ad: 'Koridor',                     gurultululuk: 'orta', hassasiyet: 'az'   },

    // ── Ofis / ticaret ───────────────────────────────────────────────────
    { id: 'ofis-tek',         binaTuru: 'ofis',    ad: 'Tek kişilik ofis',            gurultululuk: 'az',   hassasiyet: 'cok'  },
    { id: 'ofis-acik',        binaTuru: 'ofis',    ad: 'Açık ofis',                   gurultululuk: 'orta', hassasiyet: 'orta' },
    { id: 'ofis-toplanti',    binaTuru: 'ofis',    ad: 'Toplantı odası',              gurultululuk: 'orta', hassasiyet: 'cok'  },
    { id: 'ofis-koridor',     binaTuru: 'ofis',    ad: 'Koridor / hol',               gurultululuk: 'orta', hassasiyet: 'az'   },
    { id: 'ticari-magaza',    binaTuru: 'ticari',  ad: 'Mağaza / dükkân',             gurultululuk: 'cok',  hassasiyet: 'az'   },
    { id: 'ticari-market',    binaTuru: 'ticari',  ad: 'Market',                      gurultululuk: 'cok',  hassasiyet: 'az'   },
    { id: 'ticari-imalat',    binaTuru: 'ticari',  ad: 'İmalathane / atölye',         gurultululuk: 'cok',  hassasiyet: 'az'   },
  ],
};

export const BINA_TURLERI = {
  konut:   'Konut',
  otel:    'Konaklama tesisi',
  okul:    'Eğitim yapısı',
  hastane: 'Sağlık yapısı',
  ofis:    'Büro / yönetim yapısı',
  ticari:  'Ticari yapı',
};

/**
 * EK-3 Tablo 3.2 — Gürültülülük ve hassasiyet dereceleri belirlenen
 * mekânları ayıran DÜŞEY VE YATAY ELEMANLAR için en düşük hava doğuşlu ses
 * yalıtım gerekleri, DnT,w (dB).
 *
 * Anahtar: `${kaynağın gürültülülük derecesi}-${alıcının hassasiyet derecesi}`
 */
export const EK3_TABLO_3_2 = {
  kaynak: "EK-3 Tablo 3.2 — Ayırıcı elemanlar, DnT,w (dB)",
  gosterge: 'DnT,w',
  yon: 'enAz',          // sağlanması gereken EN AZ değer
  birim: 'dB',
  dogrulama: 'TASLAK — resmî metinle doğrulanmalıdır',
  degerler: {
    'cok-cok':   { A: 72, B: 68, C: 64, D: 60, E: 56, F: 52 },
    'cok-orta':  { A: 68, B: 64, C: 60, D: 56, E: 52, F: 48 },
    'cok-az':    { A: 64, B: 60, C: 56, D: 52, E: 48, F: 44 },
    'orta-cok':  { A: 64, B: 60, C: 56, D: 52, E: 48, F: 44 },
    'orta-orta': { A: 60, B: 56, C: 52, D: 48, E: 44, F: 40 },
    'orta-az':   { A: 56, B: 52, C: 48, D: 44, E: 40, F: 36 },
    'az-cok':    { A: 56, B: 52, C: 48, D: 44, E: 40, F: 36 },
    'az-orta':   { A: 52, B: 48, C: 44, D: 40, E: 36, F: 32 },
    'az-az':     { A: 48, B: 44, C: 40, D: 36, E: 32, F: 28 },
  },
};

/**
 * EK-3 Tablo 3.3 — Döşemelerde en yüksek darbe sesi düzeyi, L'nT,w (dB).
 * Anahtar: `${üst mekânın gürültülülük derecesi}-${alt mekânın hassasiyet derecesi}`
 */
export const EK3_TABLO_3_3 = {
  kaynak: "EK-3 Tablo 3.3 — Döşemeler, L'nT,w (dB)",
  gosterge: "L'nT,w",
  yon: 'enCok',         // aşılmaması gereken EN ÇOK değer
  birim: 'dB',
  dogrulama: 'TASLAK — resmî metinle doğrulanmalıdır',
  degerler: {
    'cok-cok':   { A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 },
    'cok-orta':  { A: 44, B: 48, C: 52, D: 56, E: 60, F: 64 },
    'cok-az':    { A: 48, B: 52, C: 56, D: 60, E: 64, F: 68 },
    'orta-cok':  { A: 44, B: 48, C: 52, D: 56, E: 60, F: 64 },
    'orta-orta': { A: 48, B: 52, C: 56, D: 60, E: 64, F: 68 },
    'orta-az':   { A: 52, B: 56, C: 60, D: 64, E: 68, F: 72 },
    'az-cok':    { A: 48, B: 52, C: 56, D: 60, E: 64, F: 68 },
    'az-orta':   { A: 52, B: 56, C: 60, D: 64, E: 68, F: 72 },
    'az-az':     { A: 56, B: 60, C: 64, D: 68, E: 72, F: 76 },
  },
};

/**
 * EK-3 Tablo 3.1 — Gürültüye hassasiyet dereceleri belirlenen mekânların
 * DIŞ YAPI ELEMANLARI için en düşük hava doğuşlu ses yalıtım gerekleri,
 * D2m,nT,w (dB). Satır: mekânın hassasiyet derecesi, sütun: cephedeki
 * gündüz eşdeğer gürültü düzeyi Lgündüz (dBA) aralığı.
 */
export const DIS_GURULTU_ARALIKLARI = [
  { id: 'a', ad: '≤ 55 dBA',      alt: -Infinity, ust: 55 },
  { id: 'b', ad: '56 – 60 dBA',   alt: 55,        ust: 60 },
  { id: 'c', ad: '61 – 65 dBA',   alt: 60,        ust: 65 },
  { id: 'd', ad: '66 – 70 dBA',   alt: 65,        ust: 70 },
  { id: 'e', ad: '71 – 75 dBA',   alt: 70,        ust: 75 },
  { id: 'f', ad: '> 75 dBA',      alt: 75,        ust: Infinity },
];

export const EK3_TABLO_3_1 = {
  kaynak: 'EK-3 Tablo 3.1 — Dış yapı elemanları, D2m,nT,w (dB)',
  gosterge: 'D2m,nT,w',
  yon: 'enAz',
  birim: 'dB',
  dogrulama: 'TASLAK — resmî metinle doğrulanmalıdır',
  // degerler[hassasiyet][disGurultuAraligi] = { A..F }
  degerler: {
    cok: {
      a: { A: 43, B: 40, C: 37, D: 34, E: 31, F: 28 },
      b: { A: 46, B: 43, C: 40, D: 37, E: 34, F: 31 },
      c: { A: 49, B: 46, C: 43, D: 40, E: 37, F: 34 },
      d: { A: 52, B: 49, C: 46, D: 43, E: 40, F: 37 },
      e: { A: 55, B: 52, C: 49, D: 46, E: 43, F: 40 },
      f: { A: 58, B: 55, C: 52, D: 49, E: 46, F: 43 },
    },
    orta: {
      a: { A: 40, B: 37, C: 34, D: 31, E: 28, F: 25 },
      b: { A: 43, B: 40, C: 37, D: 34, E: 31, F: 28 },
      c: { A: 46, B: 43, C: 40, D: 37, E: 34, F: 31 },
      d: { A: 49, B: 46, C: 43, D: 40, E: 37, F: 34 },
      e: { A: 52, B: 49, C: 46, D: 43, E: 40, F: 37 },
      f: { A: 55, B: 52, C: 49, D: 46, E: 43, F: 40 },
    },
    az: {
      a: { A: 37, B: 34, C: 31, D: 28, E: 25, F: 22 },
      b: { A: 40, B: 37, C: 34, D: 31, E: 28, F: 25 },
      c: { A: 43, B: 40, C: 37, D: 34, E: 31, F: 28 },
      d: { A: 46, B: 43, C: 40, D: 37, E: 34, F: 31 },
      e: { A: 49, B: 46, C: 43, D: 40, E: 37, F: 34 },
      f: { A: 52, B: 49, C: 46, D: 43, E: 40, F: 37 },
    },
  },
};

/**
 * EK-4 Tablo 4.1 — Akustik performans sınıfına bağlı olarak mekân içinde
 * izin verilen en yüksek gürültü düzeyleri, LAeq (dBA).
 */
export const EK4_TABLO_4_1 = {
  kaynak: 'EK-4 Tablo 4.1 — Mekân içi gürültü düzeyleri, LAeq (dBA)',
  gosterge: 'LAeq',
  yon: 'enCok',
  birim: 'dBA',
  dogrulama: 'TASLAK — resmî metinle doğrulanmalıdır',
  degerler: {
    'konut-yatak':     { A: 25, B: 28, C: 30, D: 33, E: 36, F: 40 },
    'konut-oturma':    { A: 28, B: 30, C: 33, D: 36, E: 39, F: 43 },
    'konut-mutfak':    { A: 33, B: 35, C: 38, D: 41, E: 44, F: 48 },
    'otel-oda':        { A: 25, B: 28, C: 30, D: 33, E: 36, F: 40 },
    'okul-derslik':    { A: 30, B: 33, C: 35, D: 38, E: 41, F: 45 },
    'okul-amfi':       { A: 28, B: 30, C: 33, D: 36, E: 39, F: 43 },
    'okul-kutuphane':  { A: 28, B: 30, C: 33, D: 36, E: 39, F: 43 },
    'hastane-yatak':   { A: 25, B: 28, C: 30, D: 33, E: 36, F: 40 },
    'hastane-muayene': { A: 30, B: 33, C: 35, D: 38, E: 41, F: 45 },
    'hastane-ameliyat':{ A: 33, B: 35, C: 38, D: 41, E: 44, F: 48 },
    'ofis-tek':        { A: 30, B: 33, C: 35, D: 38, E: 41, F: 45 },
    'ofis-acik':       { A: 35, B: 38, C: 40, D: 43, E: 46, F: 50 },
    'ofis-toplanti':   { A: 30, B: 33, C: 35, D: 38, E: 41, F: 45 },
  },
};

/**
 * EK-5 — Mekân işlevine göre önerilen/izin verilen reverberasyon süreleri (s).
 * `hacimBagimli` true ise T, hacme bağlı bir bağıntı ile hesaplanır.
 */
export const EK5_REVERBERASYON = {
  kaynak: 'EK-5 — Reverberasyon süresi gerekleri (500–1000–2000 Hz ortalaması)',
  gosterge: 'T',
  birim: 's',
  dogrulama: 'TASLAK — resmî metinle doğrulanmalıdır',
  mekanlar: [
    { id: 'konut-merdiven',  ad: 'Konut ortak merdiven/hol',     Tmin: null, Tmax: 1.3 },
    { id: 'okul-derslik',    ad: 'Derslik (V ≤ 250 m³)',         Tmin: 0.4,  Tmax: 0.8 },
    { id: 'okul-amfi',       ad: 'Amfi / konferans salonu',      Tmin: 0.6,  Tmax: 1.2 },
    { id: 'okul-kutuphane',  ad: 'Kütüphane / çalışma salonu',   Tmin: null, Tmax: 0.8 },
    { id: 'okul-spor',       ad: 'Spor salonu',                  Tmin: null, Tmax: 1.5 },
    { id: 'okul-yemekhane',  ad: 'Yemekhane',                    Tmin: null, Tmax: 1.0 },
    { id: 'okul-koridor',    ad: 'Okul koridoru',                Tmin: null, Tmax: 1.2 },
    { id: 'hastane-koridor', ad: 'Hastane koridoru',             Tmin: null, Tmax: 1.0 },
    { id: 'hastane-bekleme', ad: 'Bekleme salonu',               Tmin: null, Tmax: 0.8 },
    { id: 'ofis-acik',       ad: 'Açık ofis',                    Tmin: null, Tmax: 0.6 },
    { id: 'ofis-toplanti',   ad: 'Toplantı odası',               Tmin: null, Tmax: 0.6 },
    { id: 'otel-lobi',       ad: 'Otel lobisi',                  Tmin: null, Tmax: 1.2 },
  ],
};

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
    EK4_TABLO_4_1,
    EK5_REVERBERASYON,
  };
}
