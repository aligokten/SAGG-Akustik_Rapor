/**
 * en12354-3.js — Dış yapı elemanlarının (cephe) ses yalıtımı,
 * TS EN 12354-3'e göre.
 *
 * Yönetmelik, gürültüye hassasiyet derecesi belirlenen mekânların dış yapı
 * elemanları için en düşük hava doğuşlu ses yalıtım gereğini D2m,nT,w
 * (gerektiğinde D2m,nT,A veya D2m,nT,50) cinsinden tanımlar.
 *
 *   D2m,nT,w = R'w,bileşik + ΔLfs + 10·lg( V / (6·T0·S) )
 *
 *   R'w,bileşik : Cephenin bileşik (pencere + duvar + küçük elemanlar) yalıtımı
 *   ΔLfs        : Cephe biçim düzeltmesi (düz cephede 0 dB)
 *   S           : Mekândan görülen cephe alanı (m²)
 *   V           : Mekân hacmi (m³)
 *   T0          : Referans reverberasyon süresi (s)
 */

import { log10 } from './temel.js';

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
  } = girdi;

  const bilesik = bilesikCepheYalitimi(yuzeyselElemanlar, kucukElemanlar);
  const dLfs = typeof bicim === 'number'
    ? bicim
    : (BICIM_DUZELTMELERI[bicim]?.dLfs ?? 0);

  const S = bilesik.Stop;
  const hacimTerimi = 10 * log10(V / (6 * T0 * S));
  const D2mnTw = bilesik.Rw + dLfs + hacimTerimi - emniyetPayi;

  return {
    RwBilesik: bilesik.Rw,
    S,
    dLfs,
    hacimTerimi,
    D2mnTw,
    paylar: bilesik.paylar,
  };
}

/**
 * Verilen dış gürültü düzeyi ve hedeflenen iç gürültü düzeyi için gerekli
 * cephe yalıtımı:  D2m,nT,w,gerekli = L_dış,2m − L_iç,hedef
 * (Yönetmelik EK'lerindeki en düşük gerek ile birlikte değerlendirilir;
 * ikisinden büyük olanı esas alınır.)
 */
export function gerekliCepheYalitimi(disGurultu, icHedef) {
  return disGurultu - icHedef;
}
