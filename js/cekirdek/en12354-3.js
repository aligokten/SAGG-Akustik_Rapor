/**
 * en12354-3.js — Dış yapı elemanlarının (cephe) ses yalıtımı,
 * TS EN 12354-3'e göre.
 *
 * Yönetmelik, gürültüye hassasiyet derecesi belirlenen mekânların dış yapı
 * elemanları için en düşük hava doğuşlu ses yalıtım gereğini D2m,nT,w
 * (gerektiğinde D2m,nT,A veya D2m,nT,50) cinsinden tanımlar.
 *
 *   D2m,nT,w = R'w,görünür + ΔLfs + 10·lg( V / (6·T0·S) )
 *
 *   R'w,görünür : Bileşik cephe yalıtımı ile iç yan yolların enerjik toplamı
 *   ΔLfs        : Cephe biçim düzeltmesi (düz cephede 0 dB)
 *   S           : Mekândan görülen toplam cephe alanı (m²)
 *   V           : Mekân hacmi (m³)
 *   T0          : Referans reverberasyon süresi (s)
 *
 * İç yan yollar: mekânın iç tavanı, iç tabanı ve cepheye dik bağlanan iç
 * duvarları, dış duvarla birleşimlerinden Df yolu olarak ses iletir:
 *
 *   R_Df = (Rw_dış + Rw_yan)/2 + Kij,köşe + 10·lg( S / lf )
 *   R'w,görünür = −10·lg( 10^(−Rw,bileşik/10) + Σ 10^(−R_Df/10) )
 *
 * Spektrum uyarlama terimiyle:  DnT,A,tr = D2m,nT,w + Ctr
 */

import { log10, yalitimlariBirlestir } from './temel.js';
import { kijHesapla } from './kij.js';

/**
 * Cephe biçim düzeltmesi ΔLfs (dB) — TS EN 12354-3 Ek-B'ye dayalı tipik
 * değerler. Ayrıntılı hesap gerektiğinde standarda başvurulmalıdır.
 */
export const BICIM_DUZELTMELERI = {
  duz:        { ad: 'Düz cephe (çıkıntısız)', dLfs: 0 },
  balkon:     { ad: 'Balkonlu cephe (soğurucu tavanlı)', dLfs: 1 },
  balkonYans: { ad: 'Balkonlu cephe (yansıtıcı tavanlı)', dLfs: -1 },
  loggia:     { ad: 'Loggia', dLfs: 1.5 },
  gunesKesici:{ ad: 'Güneş kesici / jaluzili cephe', dLfs: -2 },
};

/**
 * Cephenin bileşik ses yalıtımı.
 *
 * Yüzeysel elemanlar (duvar, pencere, kapı) alanları ile,
 * küçük elemanlar (menfez, panjur kutusu, havalandırma) Dn,e,w değerleri ile
 * hesaba katılır:
 *
 *   τ = ( Σ Si·10^(−Rwi/10) + Σ n·A0·10^(−Dn,e,w/10) ) / S_top
 *   R'w,bileşik = −10·lg( τ )     (A0 = 10 m²)
 *
 * @param {{ad?:string, S:number, Rw:number}[]} yuzeyselElemanlar
 * @param {{ad?:string, adet:number, Dnew:number}[]} [kucukElemanlar]
 */
export function bilesikCepheYalitimi(yuzeyselElemanlar, kucukElemanlar = []) {
  const A0 = 10; // m²
  const Stop = yuzeyselElemanlar.reduce((a, e) => a + e.S, 0);
  if (!(Stop > 0)) return { Stop: 0, Rw: NaN, paylar: [] };

  const katkilar = [];
  let tauToplam = 0;

  for (const e of yuzeyselElemanlar) {
    const t = e.S * Math.pow(10, -e.Rw / 10);
    tauToplam += t;
    katkilar.push({ ad: e.ad || 'Yüzeysel eleman', tip: 'yuzeysel', tau: t });
  }
  for (const e of kucukElemanlar) {
    const t = (e.adet || 0) * A0 * Math.pow(10, -e.Dnew / 10);
    tauToplam += t;
    katkilar.push({ ad: e.ad || 'Küçük eleman', tip: 'kucuk', tau: t });
  }

  const Rw = -10 * log10(tauToplam / Stop);
  const paylar = katkilar
    .map((k) => ({ ad: k.ad, tip: k.tip, payYuzde: (k.tau / tauToplam) * 100 }))
    .sort((a, b) => b.payYuzde - a.payYuzde);

  return { Stop, Rw, paylar };
}

/**
 * Cephe ses yalıtımı hesabı.
 *
 * @param {Object} girdi
 * @param {{ad?:string, S:number, Rw:number}[]} girdi.yuzeyselElemanlar
 * @param {{ad?:string, adet:number, Dnew:number}[]} [girdi.kucukElemanlar]
 * @param {number} girdi.V         Mekân hacmi (m³)
 * @param {string|number} [girdi.bicim] BICIM_DUZELTMELERI anahtarı ya da doğrudan ΔLfs (dB)
 * @param {number} [girdi.T0]      Referans reverberasyon süresi (s)
 * @param {number} [girdi.emniyetPayi] Güvenlik payı (dB, sonuçtan düşülür)
 */
export function cepheYalitimi(girdi) {
  const {
    yuzeyselElemanlar, kucukElemanlar = [], V,
    bicim = 'duz', T0 = 0.5, emniyetPayi = 0,
    ctr = 0, yanYollar = [],
  } = girdi;

  const bilesik = bilesikCepheYalitimi(yuzeyselElemanlar, kucukElemanlar);
  const dLfs = typeof bicim === 'number'
    ? bicim
    : (BICIM_DUZELTMELERI[bicim]?.dLfs ?? 0);

  const S = bilesik.Stop;

  // İç yan yollar (Df): her biri bir dış duvarla bir iç elemanın birleşimidir.
  const yolDetay = yanYollar.map((y) => {
    const lf = y.lf > 0 ? y.lf : 1;
    const alanTerimi = 10 * log10(Math.max(S, 0.1) / lf);
    const Kij = kijHesapla({
      birlesim: y.birlesim || 'T',
      yol: 'kose',
      mGiris: y.mDis,
      mCikis: y.mYan,
      esnek: y.esnek,
    });
    return {
      ad: y.ad,
      duvarNo: y.duvarNo,
      Kij,
      alanTerimi,
      R: (y.RwDis + y.RwYan) / 2 + Kij + alanTerimi,
    };
  }).filter((y) => Number.isFinite(y.R));

  // Bileşik doğrudan yol ile yan yolların enerjik toplamı.
  const RwGorunur = yolDetay.length
    ? yalitimlariBirlestir([bilesik.Rw, ...yolDetay.map((y) => y.R)])
    : bilesik.Rw;

  const hacimTerimi = 10 * log10(V / (6 * T0 * S));
  const D2mnTw = RwGorunur + dLfs + hacimTerimi - emniyetPayi;
  const DnTAtr = D2mnTw + ctr;

  // Yol payları: doğrudan bileşik cephe + her yan yol.
  const enerji = (R) => Math.pow(10, -R / 10);
  const toplamEnerji = enerji(bilesik.Rw) + yolDetay.reduce((a, y) => a + enerji(y.R), 0);
  const yolPaylari = [
    { ad: 'Doğrudan — bileşik cephe', tip: 'dogrudan', R: bilesik.Rw, payYuzde: (enerji(bilesik.Rw) / toplamEnerji) * 100 },
    ...yolDetay.map((y) => ({ ad: y.ad, tip: 'Df', R: y.R, payYuzde: (enerji(y.R) / toplamEnerji) * 100 })),
  ].sort((a, b) => b.payYuzde - a.payYuzde);

  return {
    RwBilesik: bilesik.Rw,
    RwGorunur,          // iç yan yollar dâhil görünür yalıtım
    S,
    dLfs,
    hacimTerimi,
    D2mnTw,
    ctr,
    DnTAtr,             // D2m,nT,w + Ctr
    yanYollar: yolDetay,
    yolPaylari,
    paylar: bilesik.paylar,
  };
}

/**
 * Cephe geometrisinden dış duvar alanlarını ve iç yan elemanların birleşim
 * uzunluklarını türetir.
 *
 * Orta mahalde tek dış duvar (D1 = L×H), köşe mahalde iki dış duvar
 * (D1 = L×H, D2 = W×H) bulunur. İç tavan ve iç taban her aktif dış duvara
 * bağlanır; birleşim uzunluğu o duvarın yatay boyudur (D1 için L, D2 için W).
 * İç yan duvarlar cepheye dik bağlanır; birleşim uzunlukları H'dir.
 *
 * @param {{L:number, W:number, H:number}} oda
 * @param {'orta'|'kose'} konum
 */
export function cepheGeometrisi(oda, konum = 'orta') {
  const { L = 0, W = 0, H = 0 } = oda || {};
  const kose = konum === 'kose';
  const duvarlar = kose
    ? [{ no: 1, alan: L * H, yatay: L }, { no: 2, alan: W * H, yatay: W }]
    : [{ no: 1, alan: L * H, yatay: L }];

  return {
    V: L * W * H,
    duvarlar,
    toplamCepheAlani: duvarlar.reduce((a, d) => a + d.alan, 0),
    yukseklik: H,
  };
}

/**
 * Bir mekânın iç yan elemanlarının hangi dış duvarlara, hangi birleşim
 * uzunluğuyla bağlandığını verir.
 *
 * @param {'icTavan'|'icTaban'|'icSolDuvar'|'icArkaDuvar'} rol
 * @param {ReturnType<typeof cepheGeometrisi>} geo
 * @returns {{duvarNo:number, lf:number}[]}
 */
export function yanElemanBaglantilari(rol, geo) {
  const kose = geo.duvarlar.length > 1;
  if (rol === 'icTavan' || rol === 'icTaban') {
    return geo.duvarlar.map((d) => ({ duvarNo: d.no, lf: d.yatay }));
  }
  if (rol === 'icArkaDuvar') {
    return kose ? [{ duvarNo: 2, lf: geo.yukseklik }] : [];
  }
  return [{ duvarNo: 1, lf: geo.yukseklik }];   // icSolDuvar
}

/** İç yan eleman rolleri ve görünen adları. */
export const CEPHE_YAN_ROLLERI = {
  icTavan:     { ad: 'İç tavan döşemesi', kod: 'İT' },
  icTaban:     { ad: 'İç taban döşemesi', kod: 'İD' },
  icSolDuvar:  { ad: 'İç yan duvar', kod: 'İS' },
  icArkaDuvar: { ad: 'İç arka duvar (köşe mahal)', kod: 'İA' },
};

/**
 * Verilen dış gürültü düzeyi ve hedeflenen iç gürültü düzeyi için gerekli
 * cephe yalıtımı:  D2m,nT,w,gerekli = L_dış,2m − L_iç,hedef
 * (Yönetmelik EK'lerindeki en düşük gerek ile birlikte değerlendirilir;
 * ikisinden büyük olanı esas alınır.)
 */
export function gerekliCepheYalitimi(disGurultu, icHedef) {
  return disGurultu - icHedef;
}
