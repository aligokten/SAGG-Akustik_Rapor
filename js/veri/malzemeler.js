/**
 * malzemeler.js — Yapı elemanı, yalıtım ürünü ve yüzey kaplaması kütüphanesi.
 *
 * ── DEĞERLERİN NİTELİĞİ ───────────────────────────────────────────────────
 *  • kalinlik / yogunluk : Türkiye'de yaygın ürünlerin anma değerleridir.
 *    Bunlardan hesaplanan alan kütlesi m′ ile Rw, TS EN 12354-1 Ek-B
 *    bağıntısıyla KESTİRİLİR. Ürününüzün gerçek birim hacim ağırlığı
 *    farklıysa arayüzden "Beyan edilmiş yoğunluk" alanına girebilirsiniz.
 *  • Rw / ΔLw / ΔRw / Dn,e,w : Çok katmanlı sistemlerde kütle kanunu
 *    geçerli olmadığından TİPİK TASARIM DEĞERLERİ verilmiştir.
 *    Akustik projede, kullanılacak sistemin TS EN ISO 10140 serisine göre
 *    akredite laboratuvarda ölçülmüş ve üretici tarafından beyan edilmiş
 *    değerleri esas alınmalıdır ("Beyan edilmiş …" alanları bunun içindir).
 *  • Yalıtım levhalarının λ, kalınlık ve yangın sınıfı gibi verileri üretici
 *    teknik föylerinden alınmıştır; akustik başarım levhanın tek başına
 *    değil, içinde yer aldığı SİSTEMİN ölçülmüş değeriyle tanımlanır.
 * ──────────────────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════════════════
   Sıvalar — tek yüzdeki alan kütlesi (kg/m²)
   ═══════════════════════════════════════════════════════════════════════ */
export const SIVALAR = [
  { id: 'sivasiz',    ad: 'Sıvasız',                              mAlan: 0 },
  { id: 'alci-10',    ad: 'Alçı sıva, 10 mm',                     mAlan: 10 },
  { id: 'alci-15',    ad: 'Alçı sıva, 15 mm',                     mAlan: 15 },
  { id: 'alci-20',    ad: 'Alçı sıva, 20 mm',                     mAlan: 20 },
  { id: 'ince-siva',  ad: 'İnce (saten) alçı, 3 mm',              mAlan: 3 },
  { id: 'cimento-10', ad: 'Çimento esaslı sıva, 10 mm',           mAlan: 18 },
  { id: 'cimento-15', ad: 'Çimento esaslı sıva, 15 mm',           mAlan: 27 },
  { id: 'cimento-20', ad: 'Çimento esaslı sıva, 20 mm',           mAlan: 36 },
  { id: 'cimento-25', ad: 'Çimento esaslı sıva, 25 mm',           mAlan: 45 },
  { id: 'cimento-30', ad: 'Çimento esaslı sıva, 30 mm',           mAlan: 54 },
  { id: 'kirec-20',   ad: 'Kireç-çimento harçlı sıva, 20 mm',     mAlan: 34 },
  { id: 'ince-sap-8', ad: 'Alçı levha kaplama, 12,5 mm (yapışık)', mAlan: 10 },
];

/* ═══════════════════════════════════════════════════════════════════════
   Üretici yardımcıları — sınıf × kalınlık kombinasyonlarını açar
   ═══════════════════════════════════════════════════════════════════════ */

function uret(grup, onek, kalinliklar, yogunluk, adKalibi, ek = {}) {
  return kalinliklar.map((k) => ({
    id: `${onek}-${k}`,
    grup,
    ad: adKalibi(k),
    kalinlik: k,
    yogunluk,
    Rw: null,
    ...ek,
  }));
}

/* ═══════════════════════════════════════════════════════════════════════
   DUVAR ELEMANLARI
   ═══════════════════════════════════════════════════════════════════════ */
export const DUVARLAR = [
  // ── Betonarme ────────────────────────────────────────────────────────
  ...uret('Betonarme', 'ba', [100, 120, 150, 160, 180, 200, 250, 300, 350, 400], 2400,
    (k) => `Betonarme perde, ${k} mm`),

  // ── Dolu tuğla ───────────────────────────────────────────────────────
  ...uret('Dolu tuğla', 'dolu', [100, 150, 190, 200, 290], 1800,
    (k) => `Dolu tuğla duvar, ${k} mm (1800 kg/m³)`),
  { id: 'harman-190', grup: 'Dolu tuğla', ad: 'Harman tuğlası duvar, 190 mm (1600 kg/m³)', kalinlik: 190, yogunluk: 1600, Rw: null },
  { id: 'harman-290', grup: 'Dolu tuğla', ad: 'Harman tuğlası duvar, 290 mm (1600 kg/m³)', kalinlik: 290, yogunluk: 1600, Rw: null },

  // ── Yatay delikli tuğla (fabrika tuğlası) ────────────────────────────
  ...uret('Yatay delikli tuğla', 'ydt', [85, 100, 135, 150, 190, 240], 700,
    (k) => `Yatay delikli tuğla, ${k} mm (700 kg/m³)`),

  // ── Düşey delikli tuğla ──────────────────────────────────────────────
  ...uret('Düşey delikli tuğla', 'ddt', [135, 190, 240, 290], 900,
    (k) => `Düşey delikli tuğla, ${k} mm (900 kg/m³)`),
  ...uret('Düşey delikli tuğla', 'ddt-ag', [190, 240, 290], 1200,
    (k) => `Ağır düşey delikli tuğla, ${k} mm (1200 kg/m³)`),

  // ── Isı yalıtımlı (dolgulu) tuğla ────────────────────────────────────
  ...uret('Isı yalıtımlı tuğla', 'iyt', [250, 300, 350], 650,
    (k) => `Isı yalıtımlı düşey delikli tuğla, ${k} mm (650 kg/m³)`),

  // ── Akustik tuğla ────────────────────────────────────────────────────
  ...uret('Akustik tuğla', 'akt', [100, 150, 190, 250], 1400,
    (k) => `Akustik (yüksek yoğunluklu) tuğla, ${k} mm (1400 kg/m³)`),

  // ── Gazbeton (AAC) — TS EN 771-4, birim hacim ağırlığı sınıfları ─────
  ...uret('Gazbeton G2 / 400 kg/m³', 'gb-g2', [75, 85, 100, 125, 150, 175, 200, 250, 300], 400,
    (k) => `Gazbeton G2 (400 kg/m³), ${k} mm`),
  ...uret('Gazbeton G3 / 500 kg/m³', 'gb-g3', [100, 125, 150, 200, 250, 300], 500,
    (k) => `Gazbeton G3 (500 kg/m³), ${k} mm`),
  ...uret('Gazbeton G4 / 600 kg/m³', 'gb-g4', [85, 100, 125, 150, 200, 250, 300], 600,
    (k) => `Gazbeton G4 (600 kg/m³), ${k} mm`),

  // ── Bims (pomza) blok — TS EN 771-3 ──────────────────────────────────
  ...uret('Bims blok — hafif (500 kg/m³)', 'bims-h', [100, 135, 150, 190, 200, 250, 300], 500,
    (k) => `Blok bims, ${k} mm (hafif, 500 kg/m³)`),
  ...uret('Bims blok — standart (700 kg/m³)', 'bims-s', [100, 135, 150, 190, 200, 250, 300], 700,
    (k) => `Blok bims, ${k} mm (standart, 700 kg/m³)`),
  ...uret('Bims blok — ağır (900 kg/m³)', 'bims-a', [150, 190, 200, 250], 900,
    (k) => `Blok bims, ${k} mm (ağır/taşıyıcı, 900 kg/m³)`),

  // ── Beton blok / briket ──────────────────────────────────────────────
  ...uret('Beton blok', 'blok-bos', [150, 190, 200, 250], 1200,
    (k) => `Boşluklu beton blok, ${k} mm (1200 kg/m³)`),
  ...uret('Beton blok', 'blok-dolu', [100, 150, 190, 200], 2000,
    (k) => `Dolu beton blok / briket, ${k} mm (2000 kg/m³)`),

  // ── Alçı blok (alçı duvar bloğu) ─────────────────────────────────────
  ...uret('Alçı blok', 'alciblok-dolu', [60, 80, 100], 1100,
    (k) => `Dolu alçı blok, ${k} mm (1100 kg/m³)`),
  ...uret('Alçı blok', 'alciblok-bos', [80, 100], 800,
    (k) => `Boşluklu alçı blok, ${k} mm (800 kg/m³)`),

  // ── Cam tuğla ────────────────────────────────────────────────────────
  { id: 'camtugla-80', grup: 'Diğer', ad: 'Cam tuğla duvar, 80 mm', kalinlik: 80, yogunluk: 1000, Rw: 40, cokKatmanli: true, mAlanSabit: 80 },

  /* ── Alçı levha (kuru duvar) sistemleri ────────────────────────────────
     Kütle kanunu geçerli değildir; Rw değerleri sistem bazlı tipik
     değerlerdir. `dolguOnerisi`, sistemde öngörülen boşluk dolgusudur.  */
  { id: 'ap-50-1x1', grup: 'Alçı levha duvar — tek iskelet', cokKatmanli: true, mAlanSabit: 25, kalinlik: 75, yogunluk: 0,
    ad: 'Alçı levha 1×12,5 + 50 mm profil + 1×12,5, dolgusuz', Rw: 36, bosluk: 50, levhaKutlesi: 10, dolguOnerisi: 'yok' },
  { id: 'ap-50-1x1-my', grup: 'Alçı levha duvar — tek iskelet', cokKatmanli: true, mAlanSabit: 25, kalinlik: 75, yogunluk: 0,
    ad: 'Alçı levha 1×12,5 + 50 mm profil + 1×12,5, 50 mm mineral yün', Rw: 44, bosluk: 50, levhaKutlesi: 10, dolguOnerisi: 'knauf-ipb039' },
  { id: 'ap-75-1x1-my', grup: 'Alçı levha duvar — tek iskelet', cokKatmanli: true, mAlanSabit: 25, kalinlik: 100, yogunluk: 0,
    ad: 'Alçı levha 1×12,5 + 75 mm profil + 1×12,5, 50 mm mineral yün', Rw: 46, bosluk: 75, levhaKutlesi: 10, dolguOnerisi: 'knauf-ipb039' },
  { id: 'ap-75-2x2-my', grup: 'Alçı levha duvar — tek iskelet', cokKatmanli: true, mAlanSabit: 50, kalinlik: 125, yogunluk: 0,
    ad: 'Alçı levha 2×12,5 + 75 mm profil + 2×12,5, 50 mm mineral yün', Rw: 52, bosluk: 75, levhaKutlesi: 20, dolguOnerisi: 'knauf-ipb039' },
  { id: 'ap-100-2x2-my', grup: 'Alçı levha duvar — tek iskelet', cokKatmanli: true, mAlanSabit: 50, kalinlik: 150, yogunluk: 0,
    ad: 'Alçı levha 2×12,5 + 100 mm profil + 2×12,5, 100 mm mineral yün', Rw: 55, bosluk: 100, levhaKutlesi: 20, dolguOnerisi: 'knauf-ipb039' },
  { id: 'ap-100-3x3-my', grup: 'Alçı levha duvar — tek iskelet', cokKatmanli: true, mAlanSabit: 75, kalinlik: 175, yogunluk: 0,
    ad: 'Alçı levha 3×12,5 + 100 mm profil + 3×12,5, 100 mm mineral yün', Rw: 58, bosluk: 100, levhaKutlesi: 30, dolguOnerisi: 'knauf-ipb039' },
  { id: 'ap-ikiz-2x2', grup: 'Alçı levha duvar — çift (ikiz) iskelet', cokKatmanli: true, mAlanSabit: 50, kalinlik: 205, yogunluk: 0,
    ad: 'İkiz iskelet, 2×12,5 + 2×50 mm profil + 2×12,5, çift sıra mineral yün', Rw: 62, bosluk: 155, levhaKutlesi: 20, dolguOnerisi: 'knauf-ipb039' },
  { id: 'ap-ikiz-3x3', grup: 'Alçı levha duvar — çift (ikiz) iskelet', cokKatmanli: true, mAlanSabit: 75, kalinlik: 255, yogunluk: 0,
    ad: 'İkiz iskelet, 3×12,5 + 2×75 mm profil + 3×12,5, çift sıra mineral yün', Rw: 67, bosluk: 205, levhaKutlesi: 30, dolguOnerisi: 'knauf-ipb039' },
  { id: 'ap-ce-2x2', grup: 'Alçı levha duvar — özel levhalı', cokKatmanli: true, mAlanSabit: 62, kalinlik: 125, yogunluk: 0,
    ad: 'Yüksek yoğunluklu (akustik) alçı levha 2×12,5 + 75 mm profil, mineral yün', Rw: 56, bosluk: 75, levhaKutlesi: 25, dolguOnerisi: 'knauf-ipb039' },
];

/* ═══════════════════════════════════════════════════════════════════════
   DÖŞEME ELEMANLARI
   ═══════════════════════════════════════════════════════════════════════ */
export const DOSEMELER = [
  ...uret('Betonarme plak döşeme', 'ba-d', [100, 120, 140, 150, 160, 180, 200, 220, 250], 2400,
    (k) => `Betonarme plak döşeme, ${k} mm`),

  { id: 'asmolen-gb-300',  grup: 'Asmolen döşeme', ad: 'Asmolen döşeme, 300 mm — gazbeton dolgulu (eşdeğer 1100 kg/m³)', kalinlik: 300, yogunluk: 1100, Rw: null },
  { id: 'asmolen-bims-300',grup: 'Asmolen döşeme', ad: 'Asmolen döşeme, 300 mm — bims dolgulu (eşdeğer 1300 kg/m³)',   kalinlik: 300, yogunluk: 1300, Rw: null },
  { id: 'asmolen-eps-300', grup: 'Asmolen döşeme', ad: 'Asmolen döşeme, 300 mm — polistiren dolgulu (eşdeğer 900 kg/m³)', kalinlik: 300, yogunluk: 900, Rw: null },
  { id: 'asmolen-bims-320',grup: 'Asmolen döşeme', ad: 'Asmolen döşeme, 320 mm — bims dolgulu (eşdeğer 1300 kg/m³)',   kalinlik: 320, yogunluk: 1300, Rw: null },

  ...uret('Nervürlü döşeme', 'nervur', [250, 300, 350], 1500,
    (k) => `Nervürlü / kaburgalı döşeme, ${k} mm (eşdeğer 1500 kg/m³)`),

  { id: 'komp-trapez-130', grup: 'Kompozit döşeme', ad: 'Trapez sac + betonarme kompozit döşeme, 130 mm', kalinlik: 130, yogunluk: 2200, Rw: null },
  { id: 'komp-trapez-160', grup: 'Kompozit döşeme', ad: 'Trapez sac + betonarme kompozit döşeme, 160 mm', kalinlik: 160, yogunluk: 2200, Rw: null },

  { id: 'ahsap-doseme', grup: 'Ahşap döşeme', ad: 'Ahşap kirişli döşeme + OSB kaplama (tipik)', kalinlik: 220, yogunluk: 0,
    mAlanSabit: 55, Rw: 38, cokKatmanli: true },
  { id: 'clt-140', grup: 'Ahşap döşeme', ad: 'Çapraz lamine ahşap (CLT) döşeme, 140 mm', kalinlik: 140, yogunluk: 480, Rw: null },
];

/* ═══════════════════════════════════════════════════════════════════════
   YALITIM LEVHALARI — boşluk dolgusu / giydirme kabuk dolgusu
   ───────────────────────────────────────────────────────────────────────
   λ, kalınlık ve yangın sınıfı üretici teknik föylerinden alınmıştır.
   Bir levhanın tek başına "Rw" değeri yoktur; akustik başarım levhanın
   içinde yer aldığı sistemin ölçülmüş değeriyle tanımlanır. Buradaki
   `gozenekli` alanı, boşluğun sönümlü (gözenekli dolgulu) sayılıp
   sayılmayacağını belirler ve rezonans frekansı hesabında kullanılır.
   ═══════════════════════════════════════════════════════════════════════ */
export const YALITIM_LEVHALARI = [
  { id: 'yok', grup: 'Dolgu yok', ad: 'Boşluk dolgusuz (hava boşluğu)',
    marka: null, tur: 'yok', gozenekli: false, kalinliklar: [], lambda: null, yanginSinifi: null,
    not: 'Dolgusuz boşlukta rezonans frekansı yükselir ve boşluk içi yankı sönümlenmez; akustik başarım belirgin biçimde düşer.' },

  { id: 'knauf-ipb039', grup: 'Mineral yün — ara bölme levhası', ad: 'Knauf Insulation Mineral Plus IPB 039',
    marka: 'Knauf Insulation', tur: 'mineral-yun', gozenekli: true,
    kalinliklar: [30, 40, 50, 60, 80, 100], lambda: 0.039, yanginSinifi: 'A1',
    olcu: '600 × 1200 mm',
    not: 'Hafif bölme duvar sistemlerinde boşluk dolgusu olarak geliştirilmiş mineral yün levha. λD = 0,039 W/mK, yangına tepki sınıfı A1.' },

  { id: 'knauf-ipb037', grup: 'Mineral yün — ara bölme levhası', ad: 'Knauf Insulation Mineral Plus IPB 037',
    marka: 'Knauf Insulation', tur: 'mineral-yun', gozenekli: true,
    kalinliklar: [50, 60, 80, 100], lambda: 0.037, yanginSinifi: 'A1',
    olcu: '600 × 1200 mm',
    not: 'IPB serisinin daha düşük ısı iletkenlikli türü; λD = 0,037 W/mK, yangına tepki sınıfı A1.' },

  { id: 'tasyunu-levha', grup: 'Mineral yün — genel', ad: 'Taşyünü levha (genel)',
    marka: null, tur: 'tasyunu', gozenekli: true,
    kalinliklar: [40, 50, 60, 80, 100, 120], lambda: 0.037, yanginSinifi: 'A1',
    not: 'Bölme duvar ve giydirme kabuk boşluklarında yaygın kullanılan taşyünü levha.' },

  { id: 'tasyunu-yogun', grup: 'Mineral yün — genel', ad: 'Yüksek yoğunluklu taşyünü levha (≥ 70 kg/m³)',
    marka: null, tur: 'tasyunu', gozenekli: true,
    kalinliklar: [40, 50, 60, 80, 100], lambda: 0.036, yanginSinifi: 'A1',
    not: 'Akustik panel arkası ve yüksek başarımlı sistemlerde kullanılır.' },

  { id: 'camyunu-silte', grup: 'Mineral yün — genel', ad: 'Camyünü şilte / levha',
    marka: null, tur: 'camyunu', gozenekli: true,
    kalinliklar: [50, 75, 100, 120, 150], lambda: 0.035, yanginSinifi: 'A1',
    not: 'Hafif, esnek dolgu; boşluğu boşluksuz doldurması önemlidir.' },

  { id: 'ahsap-yunu', grup: 'Diğer', ad: 'Ahşap yünü / selüloz esaslı levha',
    marka: null, tur: 'ahsap-yunu', gozenekli: true,
    kalinliklar: [40, 50, 60, 80], lambda: 0.040, yanginSinifi: 'B',
    not: 'Gözenekli yapısı nedeniyle boşluk dolgusu olarak kullanılabilir.' },

  { id: 'eps', grup: 'Sert köpük (akustik açıdan uygun değil)', ad: 'EPS levha',
    marka: null, tur: 'eps', gozenekli: false,
    kalinliklar: [30, 40, 50, 60, 80, 100], lambda: 0.035, yanginSinifi: 'E',
    not: 'UYARI: Sert ve kapalı gözenekli olduğundan boşluğu sönümlemez. Dıştan ısı yalıtımında (mantolama) rezonans etkisiyle hava doğuşlu ses yalıtımını DÜŞÜREBİLİR.' },

  { id: 'xps', grup: 'Sert köpük (akustik açıdan uygun değil)', ad: 'XPS levha',
    marka: null, tur: 'xps', gozenekli: false,
    kalinliklar: [30, 40, 50, 60, 80, 100], lambda: 0.033, yanginSinifi: 'E',
    not: 'UYARI: EPS ile aynı akustik sakınca geçerlidir; boşluk dolgusu olarak akustik başarım sağlamaz.' },
];

/* ═══════════════════════════════════════════════════════════════════════
   ŞAP / KAPLAMA KATMANLARI — döşeme üstü
   ═══════════════════════════════════════════════════════════════════════ */
export const SAP_KAPLAMALAR = [
  { id: 'yok',          ad: 'Kaplama yok (çıplak döşeme)',                              mAlan: 0,   dLw: 0 },
  { id: 'sap-40',       ad: 'Yapışık şap, 40 mm (yüzer değil)',                         mAlan: 80,  dLw: 0 },
  { id: 'sap-50',       ad: 'Yapışık şap, 50 mm (yüzer değil)',                         mAlan: 100, dLw: 0 },
  { id: 'sap-seramik',  ad: 'Yapışık şap 50 mm + seramik kaplama',                      mAlan: 125, dLw: 0 },

  { id: 'yuzer-eps-t',  ad: 'Yüzer şap 50 mm + 20 mm ses yalıtım EPS-T şiltesi',        mAlan: 105, dLw: 20 },
  { id: 'yuzer-sap-5',  ad: 'Yüzer şap 50 mm + 5 mm darbe sesi şiltesi',                mAlan: 105, dLw: 19 },
  { id: 'yuzer-sap-8',  ad: 'Yüzer şap 50 mm + 8 mm elastomerik şilte',                 mAlan: 108, dLw: 22 },
  { id: 'yuzer-sap-10', ad: 'Yüzer şap 50 mm + 10 mm darbe sesi şiltesi',               mAlan: 110, dLw: 24 },
  { id: 'yuzer-sap-15', ad: 'Yüzer şap 50 mm + 15 mm elastik şilte',                    mAlan: 115, dLw: 26 },
  { id: 'yuzer-sap-20', ad: 'Yüzer şap 50 mm + 20 mm elastik şilte (s′ ≤ 10 MN/m³)',    mAlan: 120, dLw: 28 },
  { id: 'yuzer-sap-25', ad: 'Yüzer şap 60 mm + 25 mm taşyünü şilte',                    mAlan: 135, dLw: 30 },
  { id: 'yuzer-sap-30', ad: 'Yüzer şap 60 mm + 30 mm taşyünü şilte',                    mAlan: 145, dLw: 32 },
  { id: 'yuzer-sap-40', ad: 'Yüzer şap 70 mm + 40 mm taşyünü şilte',                    mAlan: 165, dLw: 34 },

  { id: 'kuru-sap-20',  ad: 'Kuru şap (alçı levha) + 20 mm mineral yün şilte',          mAlan: 45,  dLw: 22 },
  { id: 'kuru-sap-30',  ad: 'Kuru şap (alçı levha) + 30 mm mineral yün şilte',          mAlan: 50,  dLw: 25 },
  { id: 'kuru-sap-dolgu', ad: 'Kuru şap + dolgu granülü + 20 mm şilte',                 mAlan: 90,  dLw: 27 },

  { id: 'lamine-parke', ad: 'Lamine parke + 3 mm şilte (yüzer şapsız)',                 mAlan: 12,  dLw: 16 },
  { id: 'lamine-5',     ad: 'Lamine parke + 5 mm akustik şilte (yüzer şapsız)',         mAlan: 13,  dLw: 19 },
  { id: 'lvt-akustik',  ad: 'LVT / vinil kaplama, akustik altlıklı',                    mAlan: 8,   dLw: 17 },
  { id: 'hali',         ad: 'Halı kaplama (yüzer şapsız)',                              mAlan: 5,   dLw: 20 },
  { id: 'hali-kalin',   ad: 'Kalın halı + akustik altlık',                              mAlan: 7,   dLw: 25 },
  { id: 'kaucuk-mantar',ad: 'Kauçuk-mantar şilte + yüzer şap 50 mm',                    mAlan: 112, dLw: 26 },
];

/* ═══════════════════════════════════════════════════════════════════════
   GİYDİRME KABUKLAR / ASMA TAVANLAR
   `bosluk`      : boşluk derinliği (mm) — rezonans frekansı için
   `levhaKutlesi`: giydirme levhasının alan kütlesi (kg/m²)
   `dolguOnerisi`: sistemde öngörülen boşluk dolgusu (YALITIM_LEVHALARI id)
   ═══════════════════════════════════════════════════════════════════════ */
export const GIYDIRME_KABUKLAR = [
  { id: 'yok', grup: 'Yok', ad: 'Giydirme kabuk yok', dRw: 0, bosluk: 0, levhaKutlesi: 0, dolguOnerisi: 'yok' },

  { id: 'ap-bagimsiz-50', grup: 'Bağımsız iskeletli giydirme', dRw: 12, bosluk: 50, levhaKutlesi: 10, dolguOnerisi: 'knauf-ipb039',
    ad: 'Alçı levha 1×12,5, bağımsız 50 mm iskelet, mineral yün dolgulu' },
  { id: 'ap-bagimsiz-75', grup: 'Bağımsız iskeletli giydirme', dRw: 15, bosluk: 75, levhaKutlesi: 10, dolguOnerisi: 'knauf-ipb039',
    ad: 'Alçı levha 1×12,5, bağımsız 75 mm iskelet, mineral yün dolgulu' },
  { id: 'ap-bagimsiz-75-2x', grup: 'Bağımsız iskeletli giydirme', dRw: 18, bosluk: 75, levhaKutlesi: 20, dolguOnerisi: 'knauf-ipb039',
    ad: 'Alçı levha 2×12,5, bağımsız 75 mm iskelet, mineral yün dolgulu' },
  { id: 'ap-bagimsiz-100-2x', grup: 'Bağımsız iskeletli giydirme', dRw: 20, bosluk: 100, levhaKutlesi: 20, dolguOnerisi: 'knauf-ipb039',
    ad: 'Alçı levha 2×12,5, bağımsız 100 mm iskelet, mineral yün dolgulu' },

  { id: 'ap-elastik-50', grup: 'Elastik askılı / kelepçeli giydirme', dRw: 10, bosluk: 50, levhaKutlesi: 10, dolguOnerisi: 'knauf-ipb039',
    ad: 'Alçı levha 1×12,5, elastik kelepçeli 50 mm, mineral yün dolgulu' },
  { id: 'ap-elastik-75-2x', grup: 'Elastik askılı / kelepçeli giydirme', dRw: 14, bosluk: 75, levhaKutlesi: 20, dolguOnerisi: 'knauf-ipb039',
    ad: 'Alçı levha 2×12,5, elastik kelepçeli 75 mm, mineral yün dolgulu' },

  { id: 'ap-dogrudan-50', grup: 'Doğrudan bağlantılı giydirme', dRw: 5, bosluk: 50, levhaKutlesi: 10, dolguOnerisi: 'knauf-ipb039',
    ad: 'Alçı levha 1×12,5, duvara doğrudan vidalı 50 mm profil, mineral yün dolgulu' },
  { id: 'ap-yapisik', grup: 'Doğrudan bağlantılı giydirme', dRw: 2, bosluk: 0, levhaKutlesi: 10, dolguOnerisi: 'yok',
    ad: 'Alçı levha, duvara yapıştırma (boşluksuz)' },
  { id: 'ap-eps', grup: 'Doğrudan bağlantılı giydirme', dRw: -3, bosluk: 30, levhaKutlesi: 10, dolguOnerisi: 'eps',
    ad: 'Alçı levha + EPS kompozit levha, yapıştırma (akustik açıdan olumsuz)' },
  { id: 'etics-eps', grup: 'Dış cephe ısı yalıtımı', dRw: -4, bosluk: 50, levhaKutlesi: 12, dolguOnerisi: 'eps',
    ad: 'Dıştan ısı yalıtımı (mantolama), EPS + ince sıva — rezonans nedeniyle olumsuz' },
  { id: 'etics-tasyunu', grup: 'Dış cephe ısı yalıtımı', dRw: 3, bosluk: 50, levhaKutlesi: 14, dolguOnerisi: 'tasyunu-levha',
    ad: 'Dıştan ısı yalıtımı (mantolama), taşyünü + ince sıva' },

  { id: 'asma-tavan-elastik', grup: 'Asma tavan', dRw: 10, bosluk: 100, levhaKutlesi: 10, dolguOnerisi: 'knauf-ipb039',
    ad: 'Asma tavan, elastik askılı, mineral yün dolgulu' },
  { id: 'asma-tavan-elastik-2x', grup: 'Asma tavan', dRw: 14, bosluk: 150, levhaKutlesi: 20, dolguOnerisi: 'knauf-ipb039',
    ad: 'Asma tavan, elastik askılı, 2×12,5 levha, mineral yün dolgulu' },
  { id: 'asma-tavan-rijit', grup: 'Asma tavan', dRw: 4, bosluk: 100, levhaKutlesi: 10, dolguOnerisi: 'yok',
    ad: 'Asma tavan, rijit askılı, dolgusuz' },
];

/* ═══════════════════════════════════════════════════════════════════════
   DOĞRAMALAR — pencere ve kapılar
   ═══════════════════════════════════════════════════════════════════════ */
export const DOGRAMALAR = [
  { id: 'pencere-tek-4',    grup: 'Pencere', ad: 'Tek cam 4 mm',                                    Rw: 26 },
  { id: 'pencere-4-12-4',   grup: 'Pencere', ad: 'Çift cam 4-12-4 mm, PVC doğrama',                 Rw: 29 },
  { id: 'pencere-4-16-4',   grup: 'Pencere', ad: 'Çift cam 4-16-4 mm, PVC doğrama',                 Rw: 30 },
  { id: 'pencere-6-12-4',   grup: 'Pencere', ad: 'Çift cam 6-12-4 mm, PVC doğrama',                 Rw: 32 },
  { id: 'pencere-6-16-4',   grup: 'Pencere', ad: 'Çift cam 6-16-4 mm, PVC doğrama',                 Rw: 33 },
  { id: 'pencere-8-16-4',   grup: 'Pencere', ad: 'Çift cam 8-16-4 mm, PVC doğrama',                 Rw: 35 },
  { id: 'pencere-8-16-6',   grup: 'Pencere', ad: 'Çift cam 8-16-6 mm, PVC doğrama',                 Rw: 36 },
  { id: 'pencere-lam-64',   grup: 'Pencere', ad: 'Lamine akustik cam 6,4-16-4 mm',                  Rw: 38 },
  { id: 'pencere-lamine',   grup: 'Pencere', ad: 'Lamine akustik cam 8,8-16-6 mm',                  Rw: 40 },
  { id: 'pencere-lam-108',  grup: 'Pencere', ad: 'Lamine akustik cam 10,8-20-6 mm',                 Rw: 42 },
  { id: 'pencere-uclu',     grup: 'Pencere', ad: 'Üçlü cam, akustik ara katmanlı',                  Rw: 43 },
  { id: 'pencere-cift-kat', grup: 'Pencere', ad: 'Çift kat pencere (kasa arası ≥ 100 mm)',          Rw: 48 },
  { id: 'pencere-cift-kat-200', grup: 'Pencere', ad: 'Çift kat pencere (kasa arası ≥ 200 mm, sönümlü)', Rw: 52 },

  { id: 'kapi-ic-basit',   grup: 'Kapı', ad: 'İç kapı, petek dolgulu (contasız)',                   Rw: 22 },
  { id: 'kapi-ic-conta',   grup: 'Kapı', ad: 'İç kapı, petek dolgulu + çevre contalı',              Rw: 26 },
  { id: 'kapi-ic-dolu',    grup: 'Kapı', ad: 'İç kapı, dolu panel + contalı',                       Rw: 30 },
  { id: 'kapi-akustik-32', grup: 'Kapı', ad: 'Akustik kapı, Rw 32 dB (contalı, eşikli)',            Rw: 32 },
  { id: 'kapi-akustik-35', grup: 'Kapı', ad: 'Akustik kapı, Rw 35 dB (contalı, eşikli)',            Rw: 35 },
  { id: 'kapi-akustik-38', grup: 'Kapı', ad: 'Akustik kapı, Rw 38 dB (contalı, eşikli)',            Rw: 38 },
  { id: 'kapi-akustik-42', grup: 'Kapı', ad: 'Akustik kapı, Rw 42 dB (contalı, eşikli)',            Rw: 42 },
  { id: 'kapi-akustik-45', grup: 'Kapı', ad: 'Akustik kapı, Rw 45 dB (çift contalı, otomatik eşikli)', Rw: 45 },
  { id: 'daire-kapisi',    grup: 'Kapı', ad: 'Daire giriş kapısı, çelik, çift contalı',             Rw: 38 },
  { id: 'daire-kapisi-42', grup: 'Kapı', ad: 'Daire giriş kapısı, çelik, akustik (Rw 42 dB)',       Rw: 42 },
  { id: 'kapi-cift',       grup: 'Kapı', ad: 'Çift kapı (ara hacimli, her ikisi contalı)',          Rw: 50 },
];

/* ═══════════════════════════════════════════════════════════════════════
   CEPHEDEKİ KÜÇÜK ELEMANLAR — Dn,e,w (dB)
   ═══════════════════════════════════════════════════════════════════════ */
export const KUCUK_ELEMANLAR = [
  { id: 'menfez-acik',      ad: 'Havalandırma menfezi (açık, yalıtımsız)',   Dnew: 33 },
  { id: 'menfez-akustik',   ad: 'Akustik havalandırma menfezi',              Dnew: 42 },
  { id: 'menfez-akustik-48',ad: 'Yüksek başarımlı akustik menfez',           Dnew: 48 },
  { id: 'menfez-susturucu', ad: 'Susturuculu havalandırma kanalı',           Dnew: 52 },
  { id: 'panjur-kutusu',    ad: 'Panjur kutusu (yalıtımsız)',                Dnew: 37 },
  { id: 'panjur-yalitimli', ad: 'Panjur kutusu (yalıtımlı)',                 Dnew: 45 },
  { id: 'klima-gecisi',     ad: 'Klima boru geçişi (sızdırmaz dolgulu)',     Dnew: 50 },
  { id: 'kablo-gecisi',     ad: 'Kablo/tesisat geçişi (akustik dolgulu)',    Dnew: 55 },
];

/* ═══════════════════════════════════════════════════════════════════════
   SES SOĞURUCU YÜZEYLER — oktav bandı soğurma katsayıları
   ═══════════════════════════════════════════════════════════════════════ */
export const SOGURUCULAR = [
  { id: 'siva',        grup: 'Yapı yüzeyi', ad: 'Sıvalı duvar / tavan',
    alfa: { 125: 0.02, 250: 0.02, 500: 0.03, 1000: 0.04, 2000: 0.05, 4000: 0.05 } },
  { id: 'beton',       grup: 'Yapı yüzeyi', ad: 'Brüt beton',
    alfa: { 125: 0.01, 250: 0.01, 500: 0.02, 1000: 0.02, 2000: 0.02, 4000: 0.03 } },
  { id: 'tugla-brut',  grup: 'Yapı yüzeyi', ad: 'Brüt tuğla duvar',
    alfa: { 125: 0.03, 250: 0.03, 500: 0.03, 1000: 0.04, 2000: 0.05, 4000: 0.07 } },
  { id: 'gazbeton-brut', grup: 'Yapı yüzeyi', ad: 'Brüt gazbeton yüzey',
    alfa: { 125: 0.10, 250: 0.15, 500: 0.20, 1000: 0.30, 2000: 0.40, 4000: 0.45 } },
  { id: 'seramik',     grup: 'Yapı yüzeyi', ad: 'Seramik / mermer döşeme',
    alfa: { 125: 0.01, 250: 0.01, 500: 0.02, 1000: 0.02, 2000: 0.02, 4000: 0.02 } },
  { id: 'cam',         grup: 'Yapı yüzeyi', ad: 'Cam yüzey (pencere)',
    alfa: { 125: 0.10, 250: 0.07, 500: 0.05, 1000: 0.03, 2000: 0.02, 4000: 0.02 } },
  { id: 'ahsap-parke', grup: 'Yapı yüzeyi', ad: 'Ahşap parke',
    alfa: { 125: 0.15, 250: 0.11, 500: 0.10, 1000: 0.07, 2000: 0.06, 4000: 0.07 } },
  { id: 'alci-levha',  grup: 'Yapı yüzeyi', ad: 'Alçı levha bölme (boşluklu)',
    alfa: { 125: 0.29, 250: 0.10, 500: 0.05, 1000: 0.04, 2000: 0.07, 4000: 0.09 } },
  { id: 'su-yuzeyi',   grup: 'Yapı yüzeyi', ad: 'Su yüzeyi (havuz)',
    alfa: { 125: 0.01, 250: 0.01, 500: 0.01, 1000: 0.01, 2000: 0.02, 4000: 0.02 } },

  { id: 'hali-ince',   grup: 'Kaplama',     ad: 'İnce halı (beton üzeri)',
    alfa: { 125: 0.05, 250: 0.10, 500: 0.20, 1000: 0.30, 2000: 0.40, 4000: 0.50 } },
  { id: 'hali-kalin',  grup: 'Kaplama',     ad: 'Kalın halı (altlıklı)',
    alfa: { 125: 0.15, 250: 0.25, 500: 0.50, 1000: 0.60, 2000: 0.70, 4000: 0.70 } },
  { id: 'perde-hafif', grup: 'Kaplama',     ad: 'Hafif perde (düz asılı)',
    alfa: { 125: 0.05, 250: 0.12, 500: 0.25, 1000: 0.35, 2000: 0.40, 4000: 0.45 } },
  { id: 'perde-agir',  grup: 'Kaplama',     ad: 'Ağır perde (kıvrımlı)',
    alfa: { 125: 0.14, 250: 0.35, 500: 0.55, 1000: 0.72, 2000: 0.70, 4000: 0.65 } },

  { id: 'akustik-tavan-15', grup: 'Akustik ürün', ad: 'Akustik asma tavan (mineral yün, 15 mm)',
    alfa: { 125: 0.25, 250: 0.45, 500: 0.65, 1000: 0.80, 2000: 0.85, 4000: 0.80 } },
  { id: 'akustik-tavan',    grup: 'Akustik ürün', ad: 'Akustik asma tavan (mineral yün, 20 mm)',
    alfa: { 125: 0.35, 250: 0.55, 500: 0.75, 1000: 0.85, 2000: 0.90, 4000: 0.85 } },
  { id: 'akustik-tavan-40', grup: 'Akustik ürün', ad: 'Akustik asma tavan (40 mm, 200 mm boşluklu)',
    alfa: { 125: 0.50, 250: 0.70, 500: 0.85, 1000: 0.95, 2000: 0.95, 4000: 0.90 } },
  { id: 'akustik-panel-25', grup: 'Akustik ürün', ad: 'Akustik duvar paneli (25 mm)',
    alfa: { 125: 0.15, 250: 0.45, 500: 0.75, 1000: 0.90, 2000: 0.90, 4000: 0.85 } },
  { id: 'akustik-panel',    grup: 'Akustik ürün', ad: 'Akustik duvar paneli (50 mm)',
    alfa: { 125: 0.30, 250: 0.65, 500: 0.90, 1000: 0.95, 2000: 0.95, 4000: 0.90 } },
  { id: 'akustik-panel-100',grup: 'Akustik ürün', ad: 'Akustik duvar paneli (100 mm)',
    alfa: { 125: 0.55, 250: 0.90, 500: 0.95, 1000: 0.95, 2000: 0.95, 4000: 0.90 } },
  { id: 'delikli-ahsap',    grup: 'Akustik ürün', ad: 'Delikli ahşap panel (arkası yalıtımlı)',
    alfa: { 125: 0.25, 250: 0.55, 500: 0.70, 1000: 0.60, 2000: 0.45, 4000: 0.35 } },
  { id: 'delikli-alci',     grup: 'Akustik ürün', ad: 'Delikli akustik alçı levha (arkası yalıtımlı)',
    alfa: { 125: 0.30, 250: 0.60, 500: 0.75, 1000: 0.70, 2000: 0.55, 4000: 0.45 } },
  { id: 'mineral-yun-acik', grup: 'Akustik ürün', ad: 'Açıkta mineral yün levha, 50 mm',
    alfa: { 125: 0.20, 250: 0.60, 500: 0.90, 1000: 0.95, 2000: 0.95, 4000: 0.90 } },
  { id: 'bafl',             grup: 'Akustik ürün', ad: 'Akustik baffle / ada (m² başına)',
    alfa: { 125: 0.35, 250: 0.70, 500: 1.00, 1000: 1.05, 2000: 1.00, 4000: 0.95 } },
  { id: 'membran',          grup: 'Akustik ürün', ad: 'Membran (bas tuzağı) panel',
    alfa: { 125: 0.55, 250: 0.40, 500: 0.20, 1000: 0.12, 2000: 0.10, 4000: 0.10 } },
];

/* ═══════════════════════════════════════════════════════════════════════
   NESNELER — kişi / mobilya başına eşdeğer soğurma alanı (m² Sabine)
   ═══════════════════════════════════════════════════════════════════════ */
export const NESNELER = [
  { id: 'kisi-ayakta', ad: 'Kişi (ayakta)',
    A: { 125: 0.15, 250: 0.25, 500: 0.40, 1000: 0.45, 2000: 0.45, 4000: 0.40 } },
  { id: 'kisi-koltuk', ad: 'Kişi (döşemeli koltukta)',
    A: { 125: 0.25, 250: 0.35, 500: 0.45, 1000: 0.50, 2000: 0.50, 4000: 0.45 } },
  { id: 'kisi-sira',   ad: 'Öğrenci (sırada)',
    A: { 125: 0.20, 250: 0.30, 500: 0.40, 1000: 0.45, 2000: 0.45, 4000: 0.40 } },
  { id: 'koltuk-bos',  ad: 'Boş döşemeli koltuk',
    A: { 125: 0.15, 250: 0.20, 500: 0.25, 1000: 0.30, 2000: 0.30, 4000: 0.25 } },
  { id: 'sira-ahsap',  ad: 'Ahşap sıra / sandalye',
    A: { 125: 0.02, 250: 0.02, 500: 0.03, 1000: 0.04, 2000: 0.04, 4000: 0.04 } },
  { id: 'calisma-masasi', ad: 'Çalışma masası (ofis)',
    A: { 125: 0.05, 250: 0.08, 500: 0.10, 1000: 0.12, 2000: 0.12, 4000: 0.10 } },
  { id: 'bolme-panel', ad: 'Ofis bölme paneli (akustik, 1,5 m)',
    A: { 125: 0.30, 250: 0.60, 500: 0.90, 1000: 1.00, 2000: 1.00, 4000: 0.95 } },
  { id: 'hasta-yatagi', ad: 'Hasta yatağı (donanımlı)',
    A: { 125: 0.10, 250: 0.15, 500: 0.20, 1000: 0.25, 2000: 0.25, 4000: 0.20 } },
];

/* ═══════════════════════════════════════════════════════════════════════
   Yardımcılar
   ═══════════════════════════════════════════════════════════════════════ */

/** Bir duvar/döşeme kaydının alan kütlesi (sıva hariç, kg/m²). */
export function elemanAlanKutlesi(eleman, yogunlukBeyan = null) {
  if (!eleman) return NaN;
  if (Number.isFinite(yogunlukBeyan) && !eleman.cokKatmanli) {
    return (eleman.kalinlik / 1000) * yogunlukBeyan;
  }
  if (Number.isFinite(eleman.mAlanSabit)) return eleman.mAlanSabit;
  return (eleman.kalinlik / 1000) * eleman.yogunluk;
}

/** id ile herhangi bir kütüphane kaydını bulur. */
export function bul(liste, id) {
  return liste.find((x) => x.id === id) || null;
}

/** Kütüphanedeki toplam kayıt sayıları — arayüzde göstermek için. */
export function kutuphaneOzeti() {
  return {
    duvar: DUVARLAR.length,
    doseme: DOSEMELER.length,
    yalitim: YALITIM_LEVHALARI.filter((y) => y.id !== 'yok').length,
    sap: SAP_KAPLAMALAR.length,
    giydirme: GIYDIRME_KABUKLAR.length - 1,
    dograma: DOGRAMALAR.length,
    kucuk: KUCUK_ELEMANLAR.length,
    sogurucu: SOGURUCULAR.length,
    nesne: NESNELER.length,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   Kimlik göçü — kütüphane genişletilirken değişen eski kimlikler
   ───────────────────────────────────────────────────────────────────────
   Daha önce kaydedilmiş projelerin açılabilmesi için eski kayıt
   kimlikleri, karşılık gelen yeni kayda yönlendirilir. Gazbeton
   yoğunlukları TS EN 771-4 sınıflarına göre düzeltildiğinden
   (G2 = 400, G3 = 500, G4 = 600 kg/m³), eski kayıtlar YOĞUNLUĞU
   KORUYACAK biçimde eşleştirilmiştir.
   ═══════════════════════════════════════════════════════════════════════ */
export const ESKI_ID_ESLESMESI = {
  // Tuğlalar
  'tugla-85': 'ydt-85', 'tugla-135': 'ydt-135', 'tugla-190': 'ydt-190',
  'tugla-d190': 'ddt-190', 'tugla-d250': 'ddt-240',
  // Gazbeton — eski etiketler hatalıydı; yoğunluk korunarak eşleştirilir
  'gb-100-g4': 'gb-g3-100', 'gb-150-g4': 'gb-g3-150',
  'gb-200-g4': 'gb-g3-200', 'gb-250-g4': 'gb-g3-250',
  'gb-200-g6': 'gb-g4-200',
  // Bims ve briket
  'bims-135': 'bims-s-135', 'bims-190': 'bims-s-190', 'bims-250': 'bims-s-250',
  'briket-190': 'blok-bos-190',
  // Alçı levha duvarlar
  'ap-75-1x1': 'ap-50-1x1-my', 'ap-75-2x2': 'ap-75-2x2-my',
  'ap-100-2x2': 'ap-100-2x2-my', 'ap-cift-ikiz': 'ap-ikiz-2x2',
  // Döşemeler
  'asmolen-300': 'asmolen-bims-300', 'kaburga-250': 'nervur-250',
  // Giydirme kabuklar
  'ap-metal-50': 'ap-bagimsiz-50', 'ap-metal-75': 'ap-bagimsiz-75',
  'asma-tavan': 'asma-tavan-elastik',
  // Şap / kaplamalar
  'kuru-sap': 'kuru-sap-20',
};

/** Eski bir kimliği güncel karşılığına çevirir. */
export function kimligiGuncelle(id) {
  return ESKI_ID_ESLESMESI[id] || id;
}

/**
 * Bir proje nesnesindeki tüm malzeme kimliklerini güncel karşılıklarına
 * çevirir (yerinde değiştirir). Eski sürümde kaydedilmiş projeler için.
 */
export function projeKimliklerinigGuncelle(nesne) {
  const ANAHTARLAR = ['elemanId', 'dosemeId', 'sapId', 'giydirmeId', 'kapiId', 'sogurucuId', 'nesneId', 'dolguId'];
  const gez = (o) => {
    if (Array.isArray(o)) return o.forEach(gez);
    if (o && typeof o === 'object') {
      for (const a of ANAHTARLAR) {
        if (typeof o[a] === 'string') o[a] = kimligiGuncelle(o[a]);
      }
      Object.values(o).forEach(gez);
    }
  };
  gez(nesne);
  return nesne;
}

/* ═══════════════════════════════════════════════════════════════════════
   KATMAN ÖN AYARLARI — katman düzenleyicide "hazır malzeme seç" listesini
   besler. Bunlar KATI referanslar değildir: seçildiğinde yalnızca katmanın
   kendi ad/yoğunluk alanlarını doldurur, kullanıcı her ikisini de serbestçe
   değiştirebilir. Kalınlık her zaman elle girilir.
   ═══════════════════════════════════════════════════════════════════════ */
export const KATMAN_ON_AYARLARI = [
  { grup: 'Betonarme / harç',  ad: 'Betonarme',                  yogunluk: 2400 },
  { grup: 'Betonarme / harç',  ad: 'Tesviye şapı',                yogunluk: 2000 },
  { grup: 'Betonarme / harç',  ad: 'Hafif beton şap',             yogunluk: 1600 },

  { grup: 'Duvar malzemesi',   ad: 'G2 Gazbeton',                 yogunluk: 400 },
  { grup: 'Duvar malzemesi',   ad: 'G3 Gazbeton',                 yogunluk: 500 },
  { grup: 'Duvar malzemesi',   ad: 'G4 Gazbeton',                 yogunluk: 600 },
  { grup: 'Duvar malzemesi',   ad: 'Blok bims (hafif)',           yogunluk: 500 },
  { grup: 'Duvar malzemesi',   ad: 'Blok bims (standart)',        yogunluk: 700 },
  { grup: 'Duvar malzemesi',   ad: 'Yatay delikli tuğla',         yogunluk: 700 },
  { grup: 'Duvar malzemesi',   ad: 'Düşey delikli tuğla',         yogunluk: 900 },
  { grup: 'Duvar malzemesi',   ad: 'Dolu tuğla',                  yogunluk: 1800 },
  { grup: 'Duvar malzemesi',   ad: 'Beton blok / briket',         yogunluk: 1400 },

  { grup: 'Sıva / kaplama',    ad: 'Alçı sıva',                   yogunluk: 1000 },
  { grup: 'Sıva / kaplama',    ad: 'Çimento esaslı sıva',         yogunluk: 1800 },
  { grup: 'Sıva / kaplama',    ad: 'Alçı levha',                  yogunluk: 800 },
  { grup: 'Sıva / kaplama',    ad: 'Seramik kaplama',             yogunluk: 2200 },
  { grup: 'Sıva / kaplama',    ad: 'Ahşap parke',                 yogunluk: 700 },

  { grup: 'Hafif / yalıtım',   ad: 'Akustik şilte',                yogunluk: 75 },
  { grup: 'Hafif / yalıtım',   ad: 'Taşyünü levha',                yogunluk: 100 },
  { grup: 'Hafif / yalıtım',   ad: 'Knauf mineral yün IPB 039',    yogunluk: 12.4 },
  { grup: 'Hafif / yalıtım',   ad: 'Camyünü şilte',                yogunluk: 20 },
  { grup: 'Hafif / yalıtım',   ad: 'EPS levha',                    yogunluk: 20 },
  { grup: 'Hafif / yalıtım',   ad: 'XPS levha',                    yogunluk: 33 },
];
