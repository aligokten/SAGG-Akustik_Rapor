/**
 * katmanli-eleman.js — Çok katmanlı (kullanıcı tanımlı) duvar ve döşeme
 * elemanlarının hesabı.
 *
 * Bir katmanlı eleman, sıralı bir katman listesinden oluşur:
 *
 *   { tur: 'masif', malzemeId, yogunlukBeyan? }
 *     Kütüphaneden seçilmiş bir masif tabaka (ör. "G2 Gazbeton, 150 mm").
 *     Kalınlık ve anma yoğunluğu seçilen kayıttan gelir; yogunlukBeyan
 *     verilirse anma yoğunluğunun yerine geçer.
 *
 *   { tur: 'siva', sivaId }
 *     Tek yüzeye uygulanan sıva (SIVALAR kütüphanesinden).
 *
 *   { tur: 'bosluk', kalinlik, dolguId }
 *     Ara boşluk (mm) ve boşluk dolgusu (YALITIM_LEVHALARI kütüphanesinden,
 *     'yok' = dolgusuz hava boşluğu). Bir boşluk katmanı, elemanı iki
 *     bağımsız kabuğa ayırır.
 *
 * Örnekler (kullanıcının verdiği örnekler):
 *   "15 cm betonarme döşeme + 5 mm akustik şilte + 7 cm şap + 2 cm seramik"
 *     → tek kabuk (boşluk katmanı yok, yalıtım şilteleri yapışık/bonded
 *       kabul edilir); toplam kütleden kütle kanunu ile Rw kestirilir.
 *       (Şap/kaplamanın darbe sesine etkisi ayrı olarak en12354-2.js'de
 *       ΔLw ile ele alınır; bu modül yalnızca hava doğuşlu yalıtımı içindir.)
 *
 *   "2 cm sıva + 15 cm G2 gazbeton + 5 cm Knauf taşyünü + 15 cm G2 gazbeton
 *    + 2 cm sıva"
 *     → boşluk katmanı taşyünüyle dolu; eleman iki bağımsız kabuğa ayrılır
 *       (her biri kendi sıvası + gazbetonu), kütle-yay-kütle rezonansına
 *       dayalı ek yalıtım (ΔR) hesaba katılır.
 */

import { log10, rezonansFrekansi, ikiKabukBonusu, rezonansYorumu } from './temel.js';
import { rwKestir } from './kutle-kanunu.js';

/** Yeni, boş bir katman kaydı üretir. */
export function yeniKatman(tur = 'masif') {
  const taban = { tur };
  if (tur === 'masif') return { ...taban, malzemeId: null, yogunlukBeyan: null };
  if (tur === 'siva') return { ...taban, sivaId: 'alci-15' };
  if (tur === 'bosluk') return { ...taban, kalinlik: 50, dolguId: 'knauf-ipb039' };
  return taban;
}

/**
 * Bir katmanın alan kütlesini hesaplar (kg/m²).
 * @param {Object} katman
 * @param {(id:string)=>Object|null} malzemeBul  TUM_ELEMANLAR içinde arayan fonksiyon
 * @param {(id:string)=>Object|null} sivaBul      SIVALAR içinde arayan fonksiyon
 * @param {(mAlan:number, yogunlukBeyan:number|null)=>number} alanKutlesiHesapla
 */
export function katmanAlanKutlesi(katman, { malzemeBul, sivaBul, alanKutlesiHesapla }) {
  if (katman.tur === 'masif') {
    const eleman = malzemeBul(katman.malzemeId);
    if (!eleman) return 0;
    return alanKutlesiHesapla(eleman, katman.yogunlukBeyan);
  }
  if (katman.tur === 'siva') {
    return sivaBul(katman.sivaId)?.mAlan || 0;
  }
  return 0; // boşluk katmanının dolgusu ihmal edilebilir kütlede kabul edilir
}

/**
 * Katman listesini, boşluk katmanlarına göre bağımsız "segment"lere ayırır.
 * @returns {Array<Object[]>} her biri masif/sıva katmanlarından oluşan segment dizisi
 */
export function segmentleAyir(katmanlar) {
  const segmentler = [[]];
  for (const k of katmanlar) {
    if (k.tur === 'bosluk') segmentler.push([]);
    else segmentler[segmentler.length - 1].push(k);
  }
  return segmentler;
}

/**
 * Katmanlı bir elemanın toplam alan kütlesini ve Rw'sini hesaplar.
 *
 * @param {Object[]} katmanlar
 * @param {Object} baglam
 * @param {(id:string)=>Object|null} baglam.malzemeBul
 * @param {(id:string)=>Object|null} baglam.sivaBul
 * @param {(id:string)=>Object|null} baglam.dolguBul   YALITIM_LEVHALARI içinde arar
 * @param {(mAlan:number, yogunlukBeyan:number|null)=>number} baglam.alanKutlesiHesapla
 * @param {string} [baglam.model] Rw kestirim modeli ('en12354' | 'din4109')
 * @returns {Object} Ayrıntılı sonuç (bkz. aşağıdaki alanlar)
 */
export function katmanliElemaniCoz(katmanlar, baglam) {
  const { malzemeBul, sivaBul, dolguBul, alanKutlesiHesapla, model = 'en12354' } = baglam;
  const gecerli = (katmanlar || []).filter((k) => k && k.tur);

  const segmentler = segmentleAyir(gecerli);
  const boslukKatmanlari = gecerli.filter((k) => k.tur === 'bosluk');

  const segmentKutleleri = segmentler.map((seg) =>
    seg.reduce((toplam, k) => toplam + katmanAlanKutlesi(k, { malzemeBul, sivaBul, alanKutlesiHesapla }), 0));
  const mToplam = segmentKutleleri.reduce((a, b) => a + b, 0);

  const katmanDetaylari = gecerli.map((k) => ({
    katman: k,
    mAlan: katmanAlanKutlesi(k, { malzemeBul, sivaBul, alanKutlesiHesapla }),
  }));

  // Boşluk yoksa, ya da tam olarak iki dolu segmente ayırmıyorsa (0 veya
  // >2 segment kütlesi sıfırsa) tek kabuk gibi ele alınır.
  const ikiKabukGecerli = boslukKatmanlari.length >= 1
    && segmentler.length === 2
    && segmentKutleleri[0] > 0 && segmentKutleleri[1] > 0;

  if (!ikiKabukGecerli) {
    const Rw = rwKestir(mToplam, model);
    return {
      tur: 'tekKabuk',
      mAlan: mToplam,
      RwTaban: Rw,
      Rw,
      segmentKutleleri,
      katmanDetaylari,
      fazlaBoslukUyarisi: boslukKatmanlari.length > 1,
    };
  }

  const bosluk = boslukKatmanlari[0];
  const dolgu = dolguBul(bosluk.dolguId) || { gozenekli: false, ad: 'Dolgusuz' };
  const [mA, mB] = segmentKutleleri;
  const f0 = rezonansFrekansi(mA, mB, bosluk.kalinlik, !!dolgu.gozenekli);
  const dR = ikiKabukBonusu(f0);
  const RwTaban = rwKestir(mToplam, model);
  const Rw = RwTaban + dR;

  return {
    tur: 'ikiKabuk',
    mAlan: mToplam,
    mA, mB,
    RwTaban,
    f0,
    f0Yorum: rezonansYorumu(f0),
    dRKavite: dR,
    Rw,
    dolgu,
    bosluk,
    segmentKutleleri,
    katmanDetaylari,
    fazlaBoslukUyarisi: boslukKatmanlari.length > 1,
  };
}

/** Katman listesinin özet metnini üretir (rapor ve arayüz için). */
export function katmanOzetMetni(katman, malzemeBul, sivaBul, dolguBul) {
  if (katman.tur === 'masif') return malzemeBul(katman.malzemeId)?.ad || 'Masif tabaka (seçilmedi)';
  if (katman.tur === 'siva') return sivaBul(katman.sivaId)?.ad || 'Sıva';
  if (katman.tur === 'bosluk') {
    const d = dolguBul(katman.dolguId);
    return `Boşluk ${katman.kalinlik} mm${d && d.id !== 'yok' ? ` (${d.ad})` : ' (dolgusuz)'}`;
  }
  return '—';
}
