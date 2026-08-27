/**
 * malzemeler.js — Yapı elemanı ve malzeme kütüphanesi.
 *
 * Türkiye'de yaygın kullanılan duvar, döşeme ve cephe elemanlarının tipik
 * birim hacim ağırlıkları ile ses yalıtım değerleri.
 *
 * ÖNEMLİ: Buradaki Rw / ΔLw / ΔRw değerleri TİPİK TASARIM DEĞERLERİDİR.
 * Yönetmelik kapsamındaki bir akustik projede, kullanılacak ürünün
 * TS EN ISO 10140 serisine göre akredite laboratuvarda ölçülmüş ve
 * üretici tarafından beyan edilmiş değerleri esas alınmalıdır.
 * Rw kolonu boş (null) bırakılan elemanlarda değer, alan kütlesinden
 * TS EN 12354-1 Ek-B bağıntısı ile kestirilir.
 */

/** Sıva tipleri — tek yüzdeki alan kütlesi (kg/m²). */
export const SIVALAR = [
  { id: 'sivasiz',    ad: 'Sıvasız',                          mAlan: 0 },
  { id: 'alci-10',    ad: 'Alçı sıva, 10 mm',                 mAlan: 10 },
  { id: 'alci-15',    ad: 'Alçı sıva, 15 mm',                 mAlan: 15 },
  { id: 'cimento-15', ad: 'Çimento esaslı sıva, 15 mm',       mAlan: 27 },
  { id: 'cimento-20', ad: 'Çimento esaslı sıva, 20 mm',       mAlan: 36 },
  { id: 'cimento-25', ad: 'Çimento esaslı sıva, 25 mm',       mAlan: 45 },
];

/**
 * Duvar elemanları.
 * @property {number} kalinlik  Sıvasız kalınlık (mm)
 * @property {number} yogunluk  Birim hacim ağırlığı (kg/m³)
 * @property {number|null} Rw   Beyan edilmiş ağırlıklı ses azaltma indisi (dB)
 * @property {boolean} [cokKatmanli] Kütle kanunu geçerli değilse true
 */
export const DUVARLAR = [
  // ── Betonarme ────────────────────────────────────────────────────────
  { id: 'ba-100',  grup: 'Betonarme', ad: 'Betonarme perde, 100 mm', kalinlik: 100, yogunluk: 2400, Rw: null },
  { id: 'ba-150',  grup: 'Betonarme', ad: 'Betonarme perde, 150 mm', kalinlik: 150, yogunluk: 2400, Rw: null },
  { id: 'ba-200',  grup: 'Betonarme', ad: 'Betonarme perde, 200 mm', kalinlik: 200, yogunluk: 2400, Rw: null },
  { id: 'ba-250',  grup: 'Betonarme', ad: 'Betonarme perde, 250 mm', kalinlik: 250, yogunluk: 2400, Rw: null },
  { id: 'ba-300',  grup: 'Betonarme', ad: 'Betonarme perde, 300 mm', kalinlik: 300, yogunluk: 2400, Rw: null },

  // ── Delikli tuğla (fabrika tuğlası) ──────────────────────────────────
  { id: 'tugla-85',  grup: 'Delikli tuğla', ad: 'Yatay delikli tuğla, 85 mm',  kalinlik: 85,  yogunluk: 700,  Rw: null },
  { id: 'tugla-135', grup: 'Delikli tuğla', ad: 'Yatay delikli tuğla, 135 mm', kalinlik: 135, yogunluk: 700,  Rw: null },
  { id: 'tugla-190', grup: 'Delikli tuğla', ad: 'Yatay delikli tuğla, 190 mm', kalinlik: 190, yogunluk: 700,  Rw: null },
  { id: 'tugla-d190',grup: 'Delikli tuğla', ad: 'Düşey delikli tuğla, 190 mm', kalinlik: 190, yogunluk: 900,  Rw: null },
  { id: 'tugla-d250',grup: 'Delikli tuğla', ad: 'Düşey delikli tuğla, 250 mm', kalinlik: 250, yogunluk: 900,  Rw: null },

  // ── Dolu tuğla ───────────────────────────────────────────────────────
  { id: 'dolu-100', grup: 'Dolu tuğla', ad: 'Dolu tuğla duvar, 100 mm', kalinlik: 100, yogunluk: 1800, Rw: null },
  { id: 'dolu-200', grup: 'Dolu tuğla', ad: 'Dolu tuğla duvar, 200 mm', kalinlik: 200, yogunluk: 1800, Rw: null },

  // ── Gazbeton (AAC) ───────────────────────────────────────────────────
  { id: 'gb-100-g4', grup: 'Gazbeton', ad: 'Gazbeton G4, 100 mm', kalinlik: 100, yogunluk: 500, Rw: null },
  { id: 'gb-150-g4', grup: 'Gazbeton', ad: 'Gazbeton G4, 150 mm', kalinlik: 150, yogunluk: 500, Rw: null },
  { id: 'gb-200-g4', grup: 'Gazbeton', ad: 'Gazbeton G4, 200 mm', kalinlik: 200, yogunluk: 500, Rw: null },
  { id: 'gb-250-g4', grup: 'Gazbeton', ad: 'Gazbeton G4, 250 mm', kalinlik: 250, yogunluk: 500, Rw: null },
  { id: 'gb-200-g6', grup: 'Gazbeton', ad: 'Gazbeton G6, 200 mm', kalinlik: 200, yogunluk: 700, Rw: null },

  // ── Bims / hafif beton blok ──────────────────────────────────────────
  { id: 'bims-135', grup: 'Bims blok', ad: 'Bims blok, 135 mm', kalinlik: 135, yogunluk: 800, Rw: null },
  { id: 'bims-190', grup: 'Bims blok', ad: 'Bims blok, 190 mm', kalinlik: 190, yogunluk: 800, Rw: null },
  { id: 'bims-250', grup: 'Bims blok', ad: 'Bims blok, 250 mm', kalinlik: 250, yogunluk: 800, Rw: null },

  // ── Beton briket ─────────────────────────────────────────────────────
  { id: 'briket-190', grup: 'Beton briket', ad: 'Beton briket, 190 mm', kalinlik: 190, yogunluk: 1400, Rw: null },

  // ── Alçı levha (kuru duvar) — kütle kanunu geçerli değil ─────────────
  { id: 'ap-75-1x1',  grup: 'Alçı levha duvar', ad: 'Alçı levha, 75 mm profil, tek kat + tek kat, taşyünü dolgulu',
    kalinlik: 100, yogunluk: 0, mAlanSabit: 25, Rw: 44, cokKatmanli: true },
  { id: 'ap-75-2x2',  grup: 'Alçı levha duvar', ad: 'Alçı levha, 75 mm profil, çift kat + çift kat, taşyünü dolgulu',
    kalinlik: 125, yogunluk: 0, mAlanSabit: 50, Rw: 52, cokKatmanli: true },
  { id: 'ap-100-2x2', grup: 'Alçı levha duvar', ad: 'Alçı levha, 100 mm profil, çift kat + çift kat, taşyünü dolgulu',
    kalinlik: 150, yogunluk: 0, mAlanSabit: 50, Rw: 55, cokKatmanli: true },
  { id: 'ap-cift-ikiz', grup: 'Alçı levha duvar', ad: 'Alçı levha, çift iskelet (ikiz duvar), çift kat + çift kat, taşyünü dolgulu',
    kalinlik: 205, yogunluk: 0, mAlanSabit: 50, Rw: 62, cokKatmanli: true },
];

/** Döşeme elemanları. */
export const DOSEMELER = [
  { id: 'ba-d-120', grup: 'Betonarme döşeme', ad: 'Betonarme plak döşeme, 120 mm', kalinlik: 120, yogunluk: 2400, Rw: null },
  { id: 'ba-d-140', grup: 'Betonarme döşeme', ad: 'Betonarme plak döşeme, 140 mm', kalinlik: 140, yogunluk: 2400, Rw: null },
  { id: 'ba-d-160', grup: 'Betonarme döşeme', ad: 'Betonarme plak döşeme, 160 mm', kalinlik: 160, yogunluk: 2400, Rw: null },
  { id: 'ba-d-180', grup: 'Betonarme döşeme', ad: 'Betonarme plak döşeme, 180 mm', kalinlik: 180, yogunluk: 2400, Rw: null },
  { id: 'ba-d-200', grup: 'Betonarme döşeme', ad: 'Betonarme plak döşeme, 200 mm', kalinlik: 200, yogunluk: 2400, Rw: null },
  { id: 'asmolen-300', grup: 'Asmolen döşeme', ad: 'Asmolen döşeme, 300 mm (eşdeğer)', kalinlik: 300, yogunluk: 1300, Rw: null },
  { id: 'kaburga-250', grup: 'Nervürlü döşeme', ad: 'Nervürlü/kaburgalı döşeme, 250 mm (eşdeğer)', kalinlik: 250, yogunluk: 1500, Rw: null },
];

/**
 * Kaplama / şap katmanları — döşemenin üzerine gelen ilave alan kütlesi ve
 * (yüzer ise) darbe sesi düzeyi azalması ΔLw.
 */
export const SAP_KAPLAMALAR = [
  { id: 'yok',            ad: 'Kaplama yok (çıplak döşeme)',                            mAlan: 0,  dLw: 0 },
  { id: 'sap-50',         ad: 'Yapışık şap, 50 mm (yüzer değil)',                       mAlan: 100, dLw: 0 },
  { id: 'yuzer-sap-5',    ad: 'Yüzer şap 50 mm + 5 mm darbe sesi şiltesi',              mAlan: 105, dLw: 19 },
  { id: 'yuzer-sap-10',   ad: 'Yüzer şap 50 mm + 10 mm darbe sesi şiltesi',             mAlan: 110, dLw: 24 },
  { id: 'yuzer-sap-20',   ad: 'Yüzer şap 50 mm + 20 mm elastik şilte (E ≤ 10 MN/m³)',   mAlan: 120, dLw: 28 },
  { id: 'yuzer-sap-30',   ad: 'Yüzer şap 60 mm + 30 mm taşyünü şilte',                  mAlan: 145, dLw: 32 },
  { id: 'kuru-sap',       ad: 'Kuru şap (alçı levha) + 20 mm şilte',                    mAlan: 45,  dLw: 22 },
  { id: 'lamine-parke',   ad: 'Lamine parke + 3 mm şilte (yüzer şapsız)',               mAlan: 12,  dLw: 16 },
  { id: 'hali',           ad: 'Halı kaplama (yüzer şapsız)',                            mAlan: 5,   dLw: 20 },
];

/**
 * Giydirme kabuk (ön duvar) ve asma tavanların ağırlıklı ses azaltma indisi
 * iyileştirmesi ΔRw. TS EN 12354-1'e göre hem doğrudan hem yan yollara
 * uygulanabilir.
 */
export const GIYDIRME_KABUKLAR = [
  { id: 'yok',        ad: 'Giydirme kabuk yok',                                            dRw: 0 },
  { id: 'ap-metal-50',ad: 'Alçı levha, metal iskelet 50 mm, taşyünü dolgulu (bağımsız)',   dRw: 12 },
  { id: 'ap-metal-75',ad: 'Alçı levha, metal iskelet 75 mm, taşyünü dolgulu (bağımsız)',   dRw: 15 },
  { id: 'ap-yapisik', ad: 'Alçı levha, duvara yapıştırma (yalıtımsız)',                    dRw: 2 },
  { id: 'ap-eps',     ad: 'Alçı levha + EPS kompozit levha, yapıştırma',                   dRw: -2 },
  { id: 'asma-tavan', ad: 'Asma tavan, elastik askılı, taşyünü dolgulu',                   dRw: 10 },
];

/** Pencere / kapı gibi cephe ve iç kapı elemanları. */
export const DOGRAMALAR = [
  { id: 'pencere-4-16-4',  grup: 'Pencere', ad: 'Çift cam 4-16-4 mm, PVC doğrama',              Rw: 30 },
  { id: 'pencere-6-16-4',  grup: 'Pencere', ad: 'Çift cam 6-16-4 mm, PVC doğrama',              Rw: 33 },
  { id: 'pencere-8-16-6',  grup: 'Pencere', ad: 'Çift cam 8-16-6 mm, PVC doğrama',              Rw: 36 },
  { id: 'pencere-lamine',  grup: 'Pencere', ad: 'Lamine akustik cam 8,8-16-6 mm',               Rw: 40 },
  { id: 'pencere-uclu',    grup: 'Pencere', ad: 'Üçlü cam, akustik ara katmanlı',               Rw: 43 },
  { id: 'pencere-cift-kat',grup: 'Pencere', ad: 'Çift kat pencere (kasa arası ≥ 100 mm)',       Rw: 48 },
  { id: 'kapi-ic-basit',   grup: 'Kapı',    ad: 'İç kapı, petek dolgulu (contasız)',            Rw: 22 },
  { id: 'kapi-ic-dolu',    grup: 'Kapı',    ad: 'İç kapı, dolu panel + contalı',                Rw: 30 },
  { id: 'kapi-akustik-35', grup: 'Kapı',    ad: 'Akustik kapı, Rw 35 dB (contalı, eşikli)',     Rw: 35 },
  { id: 'kapi-akustik-42', grup: 'Kapı',    ad: 'Akustik kapı, Rw 42 dB (contalı, eşikli)',     Rw: 42 },
  { id: 'daire-kapisi',    grup: 'Kapı',    ad: 'Daire giriş kapısı, çelik, çift contalı',      Rw: 38 },
];

/** Cephedeki küçük elemanlar — Dn,e,w (dB) ile hesaba katılır. */
export const KUCUK_ELEMANLAR = [
  { id: 'menfez-acik',     ad: 'Havalandırma menfezi (açık)',              Dnew: 33 },
  { id: 'menfez-akustik',  ad: 'Akustik havalandırma menfezi',             Dnew: 42 },
  { id: 'menfez-susturucu',ad: 'Susturuculu havalandırma kanalı',          Dnew: 52 },
  { id: 'panjur-kutusu',   ad: 'Panjur kutusu (yalıtımsız)',              Dnew: 37 },
  { id: 'panjur-yalitimli',ad: 'Panjur kutusu (yalıtımlı)',               Dnew: 45 },
];

/**
 * Yüzey soğurma katsayıları (oktav bantlarında) — reverberasyon hesabı için.
 */
export const SOGURUCULAR = [
  { id: 'siva',        grup: 'Yapı yüzeyi', ad: 'Sıvalı duvar / tavan',
    alfa: { 125: 0.02, 250: 0.02, 500: 0.03, 1000: 0.04, 2000: 0.05, 4000: 0.05 } },
  { id: 'beton',       grup: 'Yapı yüzeyi', ad: 'Brüt beton',
    alfa: { 125: 0.01, 250: 0.01, 500: 0.02, 1000: 0.02, 2000: 0.02, 4000: 0.03 } },
  { id: 'seramik',     grup: 'Yapı yüzeyi', ad: 'Seramik / mermer döşeme',
    alfa: { 125: 0.01, 250: 0.01, 500: 0.02, 1000: 0.02, 2000: 0.02, 4000: 0.02 } },
  { id: 'cam',         grup: 'Yapı yüzeyi', ad: 'Cam yüzey (pencere)',
    alfa: { 125: 0.10, 250: 0.07, 500: 0.05, 1000: 0.03, 2000: 0.02, 4000: 0.02 } },
  { id: 'ahsap-parke', grup: 'Yapı yüzeyi', ad: 'Ahşap parke',
    alfa: { 125: 0.15, 250: 0.11, 500: 0.10, 1000: 0.07, 2000: 0.06, 4000: 0.07 } },
  { id: 'alci-levha',  grup: 'Yapı yüzeyi', ad: 'Alçı levha bölme (boşluklu)',
    alfa: { 125: 0.29, 250: 0.10, 500: 0.05, 1000: 0.04, 2000: 0.07, 4000: 0.09 } },
  { id: 'hali-ince',   grup: 'Kaplama',     ad: 'İnce halı (beton üzeri)',
    alfa: { 125: 0.05, 250: 0.10, 500: 0.20, 1000: 0.30, 2000: 0.40, 4000: 0.50 } },
  { id: 'hali-kalin',  grup: 'Kaplama',     ad: 'Kalın halı (altlıklı)',
    alfa: { 125: 0.15, 250: 0.25, 500: 0.50, 1000: 0.60, 2000: 0.70, 4000: 0.70 } },
  { id: 'perde-agir',  grup: 'Kaplama',     ad: 'Ağır perde (kıvrımlı)',
    alfa: { 125: 0.14, 250: 0.35, 500: 0.55, 1000: 0.72, 2000: 0.70, 4000: 0.65 } },
  { id: 'akustik-tavan',grup: 'Akustik ürün', ad: 'Akustik asma tavan (taşyünü, 20 mm)',
    alfa: { 125: 0.35, 250: 0.55, 500: 0.75, 1000: 0.85, 2000: 0.90, 4000: 0.85 } },
  { id: 'akustik-panel',grup: 'Akustik ürün', ad: 'Akustik duvar paneli (50 mm)',
    alfa: { 125: 0.30, 250: 0.65, 500: 0.90, 1000: 0.95, 2000: 0.95, 4000: 0.90 } },
  { id: 'delikli-ahsap',grup: 'Akustik ürün', ad: 'Delikli ahşap panel (arkası yalıtımlı)',
    alfa: { 125: 0.25, 250: 0.55, 500: 0.70, 1000: 0.60, 2000: 0.45, 4000: 0.35 } },
];

/** Nesne / kişi başına eşdeğer soğurma alanları (m² Sabine). */
export const NESNELER = [
  { id: 'kisi-ayakta', ad: 'Kişi (ayakta)',
    A: { 125: 0.15, 250: 0.25, 500: 0.40, 1000: 0.45, 2000: 0.45, 4000: 0.40 } },
  { id: 'kisi-koltuk', ad: 'Kişi (döşemeli koltukta)',
    A: { 125: 0.25, 250: 0.35, 500: 0.45, 1000: 0.50, 2000: 0.50, 4000: 0.45 } },
  { id: 'koltuk-bos',  ad: 'Boş döşemeli koltuk',
    A: { 125: 0.15, 250: 0.20, 500: 0.25, 1000: 0.30, 2000: 0.30, 4000: 0.25 } },
  { id: 'sira-ahsap',  ad: 'Ahşap sıra / sandalye',
    A: { 125: 0.02, 250: 0.02, 500: 0.03, 1000: 0.04, 2000: 0.04, 4000: 0.04 } },
];

/** Bir duvar/döşeme kaydının alan kütlesini hesaplar (sıva hariç). */
export function elemanAlanKutlesi(eleman) {
  if (!eleman) return NaN;
  if (Number.isFinite(eleman.mAlanSabit)) return eleman.mAlanSabit;
  return (eleman.kalinlik / 1000) * eleman.yogunluk;
}

/** id ile herhangi bir kütüphane kaydını bulur. */
export function bul(liste, id) {
  return liste.find((x) => x.id === id) || null;
}
