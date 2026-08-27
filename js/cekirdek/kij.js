/**
 * kij.js — Birleşimlerdeki titreşim azaltma indisi Kij (dB).
 *
 * TS EN 12354-1 Ek-E'de rijit birleşimler için verilen ampirik bağıntılar:
 *
 *   M = lg( m'i / m'j )        (yolun giriş ve çıkış elemanlarının alan kütleleri)
 *
 *   Rijit T birleşimi:
 *      düz geçiş (in-line)  : K = 5,7 + 5,7·M²
 *      köşe (yön değiştiren): K = 5,7 + 14,1·M + 5,7·M²
 *
 *   Rijit X (haç) birleşimi:
 *      düz geçiş            : K = 8,7 + 5,7·M²
 *      köşe                 : K = 8,7 + 17,1·M + 5,7·M²
 *
 * Standart, rijit birleşimlerde Kij'nin 0 dB'in altına düşmemesini öngörür.
 *
 * Elastik (esnek) birleşimler — ör. ayırıcı duvarın yan elemandan derz ile
 * ayrılması — için tipik olarak belirgin biçimde daha yüksek bir Kij elde
 * edilir; burada muhafazakâr bir ek katkı uygulanır ve bu değer kullanıcı
 * tarafından ölçüm/beyan verisiyle değiştirilebilir.
 */

import { log10 } from './temel.js';

/** Esnek (elastik ara katmanlı) birleşim için uygulanan ilave (dB). */
export const ESNEK_BIRLESIM_ILAVESI = 5;

export const BIRLESIM_TIPLERI = {
  T: { ad: 'T birleşimi (yan eleman ayırıcıda sonlanıyor)', kod: 'T' },
  X: { ad: 'X (haç) birleşimi (yan eleman sürekli geçiyor)', kod: 'X' },
};

/**
 * @param {Object} p
 * @param {'T'|'X'} p.birlesim Birleşim tipi
 * @param {'duz'|'kose'} p.yol Yolun tipi: düz geçiş veya yön değiştiren köşe
 * @param {number} p.mGiris    Yola giren elemanın alan kütlesi (kg/m²)
 * @param {number} p.mCikis    Yoldan çıkan elemanın alan kütlesi (kg/m²)
 * @param {boolean} [p.esnek]  Birleşimde elastik ara katman var mı
 * @returns {number} Kij (dB)
 */
export function kijHesapla({ birlesim, yol, mGiris, mCikis, esnek = false }) {
  if (!(mGiris > 0) || !(mCikis > 0)) return 0;
  const M = log10(mGiris / mCikis);
  const X = birlesim === 'X';
  const taban = X ? 8.7 : 5.7;
  const koseKatsayisi = X ? 17.1 : 14.1;

  let K;
  if (yol === 'duz') {
    K = taban + 5.7 * M * M;
  } else {
    K = taban + koseKatsayisi * M + 5.7 * M * M;
  }

  if (esnek) K += ESNEK_BIRLESIM_ILAVESI;
  return Math.max(0, K);
}
