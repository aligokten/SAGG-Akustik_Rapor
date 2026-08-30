/**
 * degerlendirme.js — Hesaplanan yalıtım değerlerinin yönetmelik gereksinimleri
 * ile karşılaştırılması ve akustik performans sınıfının belirlenmesi.
 */

import {
  SINIFLAR, ASGARI_SINIFLAR,
  EK2_TABLO_2_1, EK3_TABLO_3_1, EK3_TABLO_3_2, EK3_TABLO_3_3,
  EK4_TABLO_4_1, EK6_TABLO_6_1,
} from '../veri/yonetmelik.js';

/** Mekân tanımını id ile bulur. */
export function mekanBul(id, tablo = EK2_TABLO_2_1) {
  return tablo.mekanlar.find((m) => m.id === id) || null;
}

/**
 * EK-3 Tablo 3.1 satırını üretir.
 *
 * Resmî tablo sabit bir dB matrisi değildir: her sınıf için gereken yalıtım,
 * cephedeki çevresel gürültü göstergesi Lgag'dan hassasiyet ve sınıfa bağlı
 * bir indirim çıkarılarak bulunur (DnT,A,tr ≥ Lgag − indirim).
 *
 * @param {number} Lgag       Cephedeki çevresel gürültü göstergesi (dBA)
 * @param {string} hassasiyet 'cok' | 'orta' | 'az'  (I / II / III)
 * @returns {Object|null} { A..F } biçiminde sınıf-değer satırı
 */
export function cepheSatiri(Lgag, hassasiyet) {
  const ind = EK3_TABLO_3_1.indirim[hassasiyet];
  if (!ind || !Number.isFinite(Lgag)) return null;
  const satir = {};
  for (const s of SINIFLAR) satir[s] = Lgag - ind[s];
  return satir;
}

/**
 * Bir sınıf-değer satırından, elde edilen değere karşılık gelen akustik
 * performans sınıfını bulur.
 *
 * @param {Object} satir  { A:..., B:..., ... F:... }
 * @param {number} deger  Hesaplanan değer
 * @param {'enAz'|'enCok'} yon 'enAz': büyük olan iyidir; 'enCok': küçük olan iyidir
 * @returns {string|null} Sağlanan en iyi sınıf, hiçbiri sağlanmıyorsa null
 */
export function sinifBelirle(satir, deger, yon) {
  if (!satir || !Number.isFinite(deger)) return null;
  for (const s of SINIFLAR) {
    const sinir = satir[s];
    if (!Number.isFinite(sinir)) continue;
    if (yon === 'enAz' ? deger >= sinir : deger <= sinir) return s;
  }
  return null;
}

/** Sınıf sıralamasında a, b'den iyi (veya eşit) mi? */
export function sinifYeterliMi(elde, hedef) {
  if (!elde) return false;
  return SINIFLAR.indexOf(elde) <= SINIFLAR.indexOf(hedef);
}

/**
 * Bir gereksinim değerlendirmesinin ortak sonuç yapısı.
 * @typedef {Object} Degerlendirme
 * @property {string}  gosterge
 * @property {number}  hesaplanan
 * @property {number}  gereken
 * @property {string}  hedefSinif
 * @property {string|null} eldeEdilenSinif
 * @property {boolean} uygun
 * @property {number}  fark      Hesaplanan − gereken (enAz) / gereken − hesaplanan (enCok)
 * @property {string}  kaynak
 * @property {Object}  satir     Sınıf-değer satırının tamamı
 */

/**
 * @param {Object} tablo   Yönetmelik tablosu (yön ve gösterge bilgisiyle)
 * @param {Object} satir   Hedef sınıfa göre okunacak değer satırı
 * @param {number} hesaplanan
 * @param {string} hedefSinif
 * @param {number|null} [manuelHedef] Girilirse yönetmelik değerinin yerine
 *   geçer. Elde edilen sınıf yine yönetmelik satırından okunur; yalnızca
 *   uygunluk kararı manuel hedefe göre verilir.
 */
function degerlendir(tablo, satir, hesaplanan, hedefSinif, manuelHedef = null) {
  const yonetmelikGereken = satir?.[hedefSinif];
  const manuelVar = Number.isFinite(manuelHedef);
  const gereken = manuelVar ? manuelHedef : yonetmelikGereken;
  const yon = tablo.yon;
  const fark = yon === 'enAz' ? hesaplanan - gereken : gereken - hesaplanan;
  return {
    gosterge: tablo.gosterge,
    birim: tablo.birim,
    hesaplanan,
    gereken,
    yonetmelikGereken,
    hedefKaynagi: manuelVar ? 'manuel' : 'yonetmelik',
    hedefSinif,
    eldeEdilenSinif: sinifBelirle(satir, hesaplanan, yon),
    uygun: Number.isFinite(gereken) && Number.isFinite(hesaplanan) && fark >= 0,
    fark,
    kaynak: tablo.kaynak,
    dogrulama: tablo.dogrulama,
    satir,
  };
}

/**
 * Ayırıcı elemanda hava doğuşlu ses yalıtımı değerlendirmesi (EK-3 Tablo 3.2).
 * @param {Object} p
 * @param {string} p.kaynakMekanId  Gürültü kaynağı mekân
 * @param {string} p.aliciMekanId   Alıcı (korunan) mekân
 * @param {number} p.DnTw           Hesaplanan DnT,w (dB)
 * @param {string} [p.hedefSinif]
 */
export function havaDogusluDegerlendir({ kaynakMekanId, aliciMekanId, DnTw, hedefSinif = ASGARI_SINIFLAR.yeniBina, manuelHedef = null }) {
  const kaynak = mekanBul(kaynakMekanId);
  const alici = mekanBul(aliciMekanId);
  if (!kaynak || !alici) return null;
  const anahtar = `${kaynak.gurultululuk}-${alici.hassasiyet}`;
  const satir = EK3_TABLO_3_2.degerler[anahtar];
  return {
    ...degerlendir(EK3_TABLO_3_2, satir, DnTw, hedefSinif, manuelHedef),
    kaynakMekan: kaynak, aliciMekan: alici, anahtar,
  };
}

/**
 * Döşemede darbe sesi değerlendirmesi (EK-3 Tablo 3.3).
 * @param {Object} p
 * @param {string} p.ustMekanId
 * @param {string} p.altMekanId
 * @param {number} p.LnTw  Hesaplanan L'nT,w (dB)
 */
export function darbeSesiDegerlendir({ ustMekanId, altMekanId, LnTw, hedefSinif = ASGARI_SINIFLAR.yeniBina, manuelHedef = null }) {
  const ust = mekanBul(ustMekanId);
  const alt = mekanBul(altMekanId);
  if (!ust || !alt) return null;
  // Resmî Tablo 3.3 YALNIZCA kaynak (üst) mekânın gürültülülük derecesine
  // bağlıdır; alıcı mekânın hassasiyeti bu tabloya girmez.
  const anahtar = ust.gurultululuk;
  const satir = EK3_TABLO_3_3.degerler[anahtar];
  return {
    ...degerlendir(EK3_TABLO_3_3, satir, LnTw, hedefSinif, manuelHedef),
    ustMekan: ust, altMekan: alt, anahtar,
  };
}

/**
 * Cephede hava doğuşlu ses yalıtımı değerlendirmesi (EK-3 Tablo 3.1).
 * @param {Object} p
 * @param {string} p.mekanId
 * @param {number} p.disGurultu Cephedeki çevresel gürültü göstergesi Lgag (dBA)
 * @param {number} p.D2mnTw     Hesaplanan D2m,nT,w (dB)
 */
export function cepheDegerlendir({ mekanId, disGurultu, DnTAtr, hedefSinif = ASGARI_SINIFLAR.yeniBina, manuelHedef = null }) {
  const mekan = mekanBul(mekanId);
  if (!mekan) return null;
  const satir = cepheSatiri(disGurultu, mekan.hassasiyet);
  return {
    ...degerlendir(EK3_TABLO_3_1, satir, DnTAtr, hedefSinif, manuelHedef),
    mekan, disGurultu, indirim: EK3_TABLO_3_1.indirim[mekan.hassasiyet],
  };
}

/**
 * Mekân içi gürültü düzeyi değerlendirmesi (EK-4 Tablo 4.1).
 * @param {Object} p
 * @param {string} p.mekanId
 * @param {number} p.LAeq Hesaplanan/ölçülen iç gürültü düzeyi (dBA)
 */
export function icGurultuDegerlendir({ mekanId, LAeq, hedefSinif = ASGARI_SINIFLAR.yeniBina }) {
  const satir = EK4_TABLO_4_1.degerler[mekanId];
  if (!satir) return null;
  return { ...degerlendir(EK4_TABLO_4_1, satir, LAeq, hedefSinif), mekan: mekanBul(mekanId) };
}

/**
 * Reverberasyon süresi değerlendirmesi (EK-5).
 * @param {Object} p
 * @param {string} p.mekanId
 * @param {number} p.T Hesaplanan reverberasyon süresi (s, 500–2000 Hz ort.)
 */
export function reverberasyonDegerlendir({ mekanId, T }) {
  const kayit = EK6_TABLO_6_1.mekanlar.find((m) => m.id === mekanId);
  if (!kayit) return null;
  const altUygun = kayit.Tmin == null || T >= kayit.Tmin;
  const ustUygun = kayit.Tmax == null || T <= kayit.Tmax;
  const uygun = altUygun && ustUygun;
  return {
    gosterge: 'T (500–2000 Hz ort.)',
    birim: 's',
    hesaplanan: T,
    Tmin: kayit.Tmin,
    Tmax: kayit.Tmax,
    uygun,
    // EK-6 Tablo 6.1 tek bir sınır verir; bu sınır C–D bandı içindir.
    // Belge (EK-10) tüm ölçütlerde sınıf beklediğinden sınır sağlanıyorsa
    // C, sağlanmıyorsa E atanır. Değer verilmeyen mekânlarda sınıf yoktur.
    eldeEdilenSinif: kayit.Tmax == null ? null : (uygun ? 'C' : 'E'),
    kaynak: EK6_TABLO_6_1.kaynak,
    dogrulama: EK6_TABLO_6_1.dogrulama,
    mekanAdi: kayit.ad,
  };
}

/**
 * Bir dizi değerlendirmenin genel (belirleyici) akustik performans sınıfı:
 * en düşük performanslı bileşen belirler.
 */
export function genelSinif(degerlendirmeler) {
  const siniflar = degerlendirmeler
    .map((d) => d?.eldeEdilenSinif)
    .filter(Boolean);
  if (!siniflar.length) return null;
  return siniflar.reduce((enKotu, s) =>
    SINIFLAR.indexOf(s) > SINIFLAR.indexOf(enKotu) ? s : enKotu);
}

/**
 * Bir gereksinimin sağlanması için gereken en düşük DnT,w / en yüksek L'nT,w
 * gibi hedef değeri döndürür — tasarım aşamasında hedef belirlemek için.
 */
export function hedefDeger(tabloAdi, anahtar, sinif = ASGARI_SINIFLAR.yeniBina) {
  const tablolar = {
    'ek3-3.2': EK3_TABLO_3_2,
    'ek3-3.3': EK3_TABLO_3_3,
  };
  return tablolar[tabloAdi]?.degerler?.[anahtar]?.[sinif] ?? null;
}
