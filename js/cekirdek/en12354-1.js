/**
 * en12354-1.js — Mekânlar arası hava doğuşlu ses yalıtımının, doğrudan ve
 * yan yollar birlikte hesaplanması (TS EN 12354-1, basitleştirilmiş model).
 *
 * Yönetmelik, düşey ve yatay ayırıcı elemanlarda sağlanması gereken
 * DnT,w değerlerini tanımlar; bu değerin hesabı yan yol iletimini de
 * içermek zorundadır. Bu modül TS EN 12354-1'in tek sayılı (Rw tabanlı)
 * basitleştirilmiş yöntemini uygular.
 *
 *   R'w = −10·lg( 10^(−Rw,Dd/10) + Σ 10^(−Rw,Ff/10)
 *                              + Σ 10^(−Rw,Fd/10) + Σ 10^(−Rw,Df/10) )
 *
 *   R_Ff = (R_F,w + R_f,w)/2 + ΔR_Ff + K_Ff + 10·lg( Ss / (l0·lf) )
 *   R_Fd = (R_F,w + R_s,w)/2 + ΔR_Fd + K_Fd + 10·lg( Ss / (l0·lf) )
 *   R_Df = (R_s,w + R_f,w)/2 + ΔR_Df + K_Df + 10·lg( Ss / (l0·lf) )
 *
 * l0 = 1 m (referans bağlantı uzunluğu), Ss = ayırıcı elemanın alanı,
 * lf = bağlantı (birleşim) uzunluğu.
 */

import { log10, yalitimlariBirlestir, RdenDnT } from './temel.js';
import { kijHesapla } from './kij.js';

const L0 = 1; // m

/**
 * @typedef {Object} YanEleman
 * @property {string}  ad          Yan elemanın adı (ör. "Cephe duvarı")
 * @property {number}  RwKaynak    Kaynak mekân tarafındaki yan elemanın Rw'si (dB)
 * @property {number}  RwAlici     Alıcı mekân tarafındaki yan elemanın Rw'si (dB)
 * @property {number}  mKaynak     Kaynak taraftaki yan elemanın alan kütlesi (kg/m²)
 * @property {number}  mAlici      Alıcı taraftaki yan elemanın alan kütlesi (kg/m²)
 * @property {number}  lf          Bağlantı uzunluğu (m)
 * @property {'T'|'X'} birlesim    Birleşim tipi: 'T' veya 'X' (haç)
 * @property {boolean} [surekli]   Yan eleman birleşimden sürekli geçiyor mu (düz yol)
 * @property {number}  [dRFf]      Ff yolundaki giydirme kabuk iyileştirmesi (dB)
 * @property {number}  [dRFd]      Fd yolundaki giydirme kabuk iyileştirmesi (dB)
 * @property {number}  [dRDf]      Df yolundaki giydirme kabuk iyileştirmesi (dB)
 * @property {boolean} [esnekBaglanti] Elastik/kesintili birleşim (ör. derz) var mı
 */

/**
 * Tek bir yan elemanın üç yan yolunun (Ff, Fd, Df) yalıtım değerlerini hesaplar.
 *
 * @param {YanEleman} yan
 * @param {{RwAyirici:number, mAyirici:number, S:number}} ayirici
 * @returns {{Ff:number, Fd:number, Df:number, Kff:number, Kfd:number, Kdf:number, alanTerimi:number}}
 */
export function yanYolHesapla(yan, ayirici) {
  const { RwAyirici, mAyirici, S } = ayirici;
  const lf = yan.lf > 0 ? yan.lf : 1;
  const alanTerimi = 10 * log10(S / (L0 * lf));

  // Titreşim azaltma indisleri (dB)
  const Kff = kijHesapla({
    birlesim: yan.birlesim,
    yol: 'duz',                   // F → f : yan elemandan yan elemana (düz geçiş)
    mGiris: yan.mKaynak,
    mCikis: yan.mAlici,
    mDik: mAyirici,
    esnek: yan.esnekBaglanti,
  });
  const Kfd = kijHesapla({
    birlesim: yan.birlesim,
    yol: 'kose',                  // F → d : yan elemandan ayırıcıya (yön değiştirme)
    mGiris: yan.mKaynak,
    mCikis: mAyirici,
    mDik: yan.mAlici,
    esnek: yan.esnekBaglanti,
  });
  const Kdf = kijHesapla({
    birlesim: yan.birlesim,
    yol: 'kose',                  // D → f : ayırıcıdan yan elemana (yön değiştirme)
    mGiris: mAyirici,
    mCikis: yan.mAlici,
    mDik: yan.mKaynak,
    esnek: yan.esnekBaglanti,
  });

  const Ff = (yan.RwKaynak + yan.RwAlici) / 2 + (yan.dRFf || 0) + Kff + alanTerimi;
  const Fd = (yan.RwKaynak + RwAyirici) / 2 + (yan.dRFd || 0) + Kfd + alanTerimi;
  const Df = (RwAyirici + yan.RwAlici) / 2 + (yan.dRDf || 0) + Kdf + alanTerimi;

  return { Ff, Fd, Df, Kff, Kfd, Kdf, alanTerimi };
}

/**
 * Mekânlar arası hava doğuşlu ses yalıtımı.
 *
 * @param {Object} girdi
 * @param {number} girdi.RwAyirici   Ayırıcı elemanın laboratuvar Rw'si (dB)
 * @param {number} girdi.mAyirici    Ayırıcı elemanın alan kütlesi (kg/m²)
 * @param {number} girdi.S           Ayırıcı elemanın ortak alanı (m²)
 * @param {number} girdi.V           Alıcı mekânın hacmi (m³)
 * @param {number} [girdi.dRDd]      Ayırıcı eleman üzerindeki giydirme kabuk iyileştirmesi (dB)
 * @param {YanEleman[]} girdi.yanElemanlar
 * @param {number} [girdi.T0]        Referans reverberasyon süresi (s)
 * @param {number} [girdi.emniyetPayi] Güvenlik payı / öngörü belirsizliği (dB, sonuçtan düşülür)
 * @returns {Object} Ayrıntılı sonuç
 */
export function havaDogusluYalitim(girdi) {
  const {
    RwAyirici, mAyirici, S, V,
    dRDd = 0, yanElemanlar = [], T0 = 0.5, emniyetPayi = 0,
  } = girdi;

  const Dd = RwAyirici + dRDd;
  const yollar = [{ ad: 'Dd — doğrudan yol', tip: 'Dd', R: Dd }];
  const yanDetay = [];

  for (const yan of yanElemanlar) {
    const h = yanYolHesapla(yan, { RwAyirici, mAyirici, S });
    yanDetay.push({ ad: yan.ad, ...h });
    yollar.push({ ad: `Ff — ${yan.ad}`, tip: 'Ff', R: h.Ff });
    yollar.push({ ad: `Fd — ${yan.ad}`, tip: 'Fd', R: h.Fd });
    yollar.push({ ad: `Df — ${yan.ad}`, tip: 'Df', R: h.Df });
  }

  const RwAksan = yalitimlariBirlestir(yollar.map((y) => y.R));
  const DnTw = RdenDnT(RwAksan, V, S, T0) - emniyetPayi;

  // Hangi yolun ne kadar pay aldığı (%)
  const toplamEnerji = yollar.reduce((a, y) => a + Math.pow(10, -y.R / 10), 0);
  const paylar = yollar.map((y) => ({
    ...y,
    payYuzde: (Math.pow(10, -y.R / 10) / toplamEnerji) * 100,
  })).sort((a, b) => b.payYuzde - a.payYuzde);

  return {
    Dd,
    RwAksan,          // R'w — yerinde ses azaltma indisi
    DnTw,             // DnT,w — yönetmeliğin kullandığı gösterge
    yollar: paylar,
    yanDetay,
    yanYolKaybi: Dd - RwAksan,  // yan yollar nedeniyle kaybedilen dB
  };
}

/**
 * Karma (kapılı/pencereli) ayırıcı elemanın bileşik Rw'si.
 * R_bileşik = −10·lg( (1/S_top)·Σ Si·10^(−Rwi/10) )
 * @param {{S:number, Rw:number}[]} parcalar
 */
export function bilesikRw(parcalar) {
  const Stop = parcalar.reduce((a, p) => a + p.S, 0);
  if (!(Stop > 0)) return NaN;
  const tau = parcalar.reduce((a, p) => a + p.S * Math.pow(10, -p.Rw / 10), 0) / Stop;
  return -10 * log10(tau);
}
