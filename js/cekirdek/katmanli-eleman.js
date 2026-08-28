/**
 * katmanli-eleman.js — Çok katmanlı (kullanıcı tanımlı) duvar ve döşeme
 * elemanlarının hesabı.
 *
 * Bir katmanlı eleman, sıralı bir katman listesinden oluşur:
 *
 *   { tur: 'masif', ad, kalinlik(mm), yogunluk(kg/m³) }
 *   { tur: 'siva',  ad, kalinlik(mm), yogunluk(kg/m³) }
 *     Serbest girişli bir katman — malzeme adı, kalınlığı ve birim hacim
 *     ağırlığı doğrudan kullanıcı tarafından girilir (kütüphaneden bir ön
 *     ayar seçilerek hızlı doldurulabilir, ancak değerler her zaman serbestçe
 *     düzenlenebilir). 'masif' ve 'siva' hesapça eşdeğerdir; ayrım yalnızca
 *     arayüzde etiketleme/simge amaçlıdır. Bu katmanlar BAĞLI (yapışık)
 *     kabul edilir: kütleleri toplanır, tek bir kabuğun parçası sayılır.
 *
 *   { tur: 'bosluk', kalinlik(mm), dolguId }
 *     Gerçek bir ara BOŞLUK (hava aralığı) — kalınlığı ve dolgusu
 *     (YALITIM_LEVHALARI kütüphanesinden, 'yok' = dolgusuz). Bir boşluk
 *     katmanı, elemanı iki bağımsız (rezonansla ayrılmış) kabuğa böler.
 *
 * ÖNEMLİ AYRIM: Düşük yoğunluklu bir malzeme (ör. mineral yün) 'masif'
 * katman olarak eklenirse BAĞLI kabul edilir ve yalnızca kütlesiyle katkı
 * verir (basit kütle kanunu) — birçok ticari hesap aracının varsayılan
 * davranışı budur. Aynı malzeme 'bosluk' katmanı olarak eklenirse gerçek
 * bir hava aralığı temsil eder ve kütle-yay-kütle rezonans fiziği
 * (ikiKabukBonusu) devreye girer. Hangisinin doğru olduğu, gerçekte bir
 * hava boşluğu bulunup bulunmadığına bağlıdır.
 *
 * Örnekler:
 *   "15 cm betonarme döşeme + 5 mm akustik şilte + 7 cm şap + 2 cm seramik"
 *     → tüm katmanlar bağlı (boşluk yok); toplam kütleden kütle kanunu ile
 *       tek kabuk Rw kestirilir. (Şap/kaplamanın darbe sesine etkisi ayrıca
 *       en12354-2.js'de ΔLw ile ele alınır; bu modül yalnızca hava doğuşlu
 *       yalıtım içindir.)
 *
 *   "2 cm sıva + 15 cm G2 gazbeton + 5 cm Knauf taşyünü + 15 cm G2 gazbeton
 *    + 2 cm sıva" — taşyünü BAĞLI (masif) katman olarak girilirse: toplam
 *       kütleden düz kütle kanunu (basit, hızlı ön boyutlandırma).
 *       Taşyünü BOŞLUK/DOLGU olarak girilirse: iki kabuk + kavite bonusu
 *       (daha gerçekçi, gerçek bir hava aralığı varsa).
 */

import { log10, rezonansFrekansi, ikiKabukBonusu, rezonansYorumu } from './temel.js';
import { rwKestir } from './kutle-kanunu.js';

/** Yeni, boş bir katman kaydı üretir. */
export function yeniKatman(tur = 'masif') {
  if (tur === 'masif') return { tur, ad: '', kalinlik: 150, yogunluk: 400 };
  if (tur === 'siva') return { tur, ad: 'Sıva', kalinlik: 20, yogunluk: 1800 };
  if (tur === 'bosluk') return { tur, kalinlik: 50, dolguId: 'knauf-ipb039' };
  return { tur };
}

/** Bir katmanın alan kütlesini hesaplar (kg/m²). */
export function katmanAlanKutlesi(katman) {
  if (katman.tur === 'masif' || katman.tur === 'siva') {
    const kalinlik = Number(katman.kalinlik) || 0;
    const yogunluk = Number(katman.yogunluk) || 0;
    return (kalinlik / 1000) * yogunluk;
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
 * @param {(id:string)=>Object|null} baglam.dolguBul  YALITIM_LEVHALARI içinde arar
 * @param {string} [baglam.model] Rw kestirim modeli ('en12354' | 'din4109')
 * @returns {Object} Ayrıntılı sonuç (bkz. aşağıdaki alanlar)
 */
export function katmanliElemaniCoz(katmanlar, baglam) {
  const { dolguBul, model = 'en12354' } = baglam;
  const gecerli = (katmanlar || []).filter((k) => k && k.tur);

  const segmentler = segmentleAyir(gecerli);
  const boslukKatmanlari = gecerli.filter((k) => k.tur === 'bosluk');

  const segmentKutleleri = segmentler.map((seg) =>
    seg.reduce((toplam, k) => toplam + katmanAlanKutlesi(k), 0));
  const mToplam = segmentKutleleri.reduce((a, b) => a + b, 0);
  const kalinlikToplam = gecerli.reduce((t, k) => t + (Number(k.kalinlik) || 0), 0);

  const katmanDetaylari = gecerli.map((k) => ({ katman: k, mAlan: katmanAlanKutlesi(k) }));

  // Boşluk yoksa, ya da tam olarak iki dolu segmente ayırmıyorsa (0 veya
  // >2 segment kütlesi sıfırsa) tek kabuk gibi ele alınır.
  const ikiKabukGecerli = boslukKatmanlari.length >= 1
    && segmentler.length === 2
    && segmentKutleleri[0] > 0 && segmentKutleleri[1] > 0;

  if (!ikiKabukGecerli) {
    const Rw = rwKestir(mToplam, model);
    return {
      tur: 'tekKabuk',
      mAlan: mToplam, kalinlikToplam,
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
    mAlan: mToplam, kalinlikToplam,
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
export function katmanOzetMetni(katman, dolguBul) {
  if (katman.tur === 'masif' || katman.tur === 'siva') {
    return `${Number(katman.kalinlik) || 0} mm ${katman.ad || (katman.tur === 'siva' ? 'Sıva' : 'Malzeme')}`;
  }
  if (katman.tur === 'bosluk') {
    const d = dolguBul?.(katman.dolguId);
    return `${katman.kalinlik} mm ${d && d.id !== 'yok' ? d.ad : 'boşluk (dolgusuz)'}`;
  }
  return '—';
}

/** Tüm katman listesinin tek satırlık dizilim metnini üretir ("+" ile ayrık). */
export function katmanDizilimiMetni(katmanlar, dolguBul) {
  return (katmanlar || []).map((k) => katmanOzetMetni(k, dolguBul)).join(' + ');
}
