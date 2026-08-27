/**
 * en12354-2.js — Döşemelerde darbe sesi yalıtımı (TS EN 12354-2,
 * basitleştirilmiş tek sayılı model).
 *
 *   L'n,w = Ln,w,eq − ΔLw + K
 *
 *   Ln,w,eq : Kaplamasız masif döşemenin eşdeğer ağırlıklı normalize darbe
 *             sesi düzeyi (Ek-B: 164 − 35·lg(m'))
 *   ΔLw     : Yüzer şap / darbe sesi şiltesi / esnek kaplamanın ağırlıklı
 *             darbe sesi düzeyi azalması (TS EN ISO 10140-3 / 717-2)
 *   K       : Yan yol iletimi düzeltmesi (Ek-E) — döşemenin ve yan
 *             duvarların alan kütlelerine bağlıdır
 *
 * Yönetmeliğin kullandığı gösterge L'nT,w'dir:
 *   L'nT,w = L'n,w − 10·lg( 0,064·T0·V )
 */

import { log10, LndenLnT } from './temel.js';
import { lnwEsdeger } from './kutle-kanunu.js';

/**
 * TS EN 12354-2 Ek-E — homojen, rijit bağlantılı yapılarda yan yol
 * düzeltmesi K (dB). Satırlar döşemenin, sütunlar yan duvarların ortalama
 * alan kütlesidir (kg/m²). Ara değerler iki yönlü doğrusal ara değerleme
 * ile bulunur.
 */
const K_DOSEME_KUTLELERI = [100, 150, 200, 250, 300, 350, 400, 450, 500];
const K_YAN_KUTLELERI    = [100, 150, 200, 250, 300, 350, 400];
const K_TABLOSU = [
  //  100 150 200 250 300 350 400   ← yan duvar ortalama m' (kg/m²)
  [    2,  1,  1,  0,  0,  0,  0 ], // döşeme 100
  [    3,  2,  1,  1,  0,  0,  0 ], // 150
  [    3,  2,  2,  1,  1,  1,  0 ], // 200
  [    4,  3,  2,  2,  1,  1,  1 ], // 250
  [    4,  3,  2,  2,  2,  1,  1 ], // 300
  [    4,  3,  3,  2,  2,  2,  1 ], // 350
  [    4,  3,  3,  2,  2,  2,  2 ], // 400
  [    4,  4,  3,  3,  2,  2,  2 ], // 450
  [    4,  4,  3,  3,  2,  2,  2 ], // 500
];

function araDegerIndeksi(dizi, x) {
  if (x <= dizi[0]) return { i: 0, j: 0, t: 0 };
  if (x >= dizi[dizi.length - 1]) {
    const son = dizi.length - 1;
    return { i: son, j: son, t: 0 };
  }
  let i = 0;
  while (i < dizi.length - 1 && dizi[i + 1] < x) i++;
  const t = (x - dizi[i]) / (dizi[i + 1] - dizi[i]);
  return { i, j: i + 1, t };
}

/**
 * Yan yol düzeltmesi K (dB).
 * @param {number} mDoseme Döşemenin alan kütlesi (kg/m²)
 * @param {number} mYan    Yan duvarların ortalama alan kütlesi (kg/m²)
 */
export function yanYolDuzeltmesiK(mDoseme, mYan) {
  if (!(mDoseme > 0) || !(mYan > 0)) return 0;
  const s = araDegerIndeksi(K_DOSEME_KUTLELERI, mDoseme);
  const y = araDegerIndeksi(K_YAN_KUTLELERI, mYan);
  const ust = K_TABLOSU[s.i][y.i] * (1 - y.t) + K_TABLOSU[s.i][y.j] * y.t;
  const alt = K_TABLOSU[s.j][y.i] * (1 - y.t) + K_TABLOSU[s.j][y.j] * y.t;
  return ust * (1 - s.t) + alt * s.t;
}

/**
 * Döşemede darbe sesi yalıtımı hesabı.
 *
 * @param {Object} girdi
 * @param {number}  girdi.mDoseme      Taşıyıcı döşemenin alan kütlesi (kg/m²)
 * @param {number} [girdi.LnwEsdeger]  Ölçülmüş/beyan edilmiş Ln,w,eq (dB); verilmezse kütleden kestirilir
 * @param {number} [girdi.dLw]         Yüzer şap/şilte veya kaplamanın ΔLw'si (dB)
 * @param {number} [girdi.dLwAsmaTavan] Asma tavanın darbe sesi katkısı (dB)
 * @param {number}  girdi.mYanOrtalama Yan duvarların ortalama alan kütlesi (kg/m²)
 * @param {number} [girdi.K]           Ölçüm/hesap ile bilinen yan yol düzeltmesi (dB)
 * @param {number}  girdi.V            Alıcı (alt) mekânın hacmi (m³)
 * @param {number} [girdi.T0]          Referans reverberasyon süresi (s)
 * @param {number} [girdi.emniyetPayi] Güvenlik payı (dB, sonuca eklenir)
 */
export function darbeSesiYalitimi(girdi) {
  const {
    mDoseme, LnwEsdeger, dLw = 0, dLwAsmaTavan = 0,
    mYanOrtalama, K, V, T0 = 0.5, emniyetPayi = 0,
  } = girdi;

  const LnwEq = Number.isFinite(LnwEsdeger) ? LnwEsdeger : lnwEsdeger(mDoseme);
  const Kdegeri = Number.isFinite(K) ? K : yanYolDuzeltmesiK(mDoseme, mYanOrtalama);
  const LnwAksan = LnwEq - dLw - dLwAsmaTavan + Kdegeri;
  const LnTw = LndenLnT(LnwAksan, V, T0) + emniyetPayi;

  return {
    LnwEq,        // Ln,w,eq — çıplak döşeme
    K: Kdegeri,   // yan yol düzeltmesi
    dLwToplam: dLw + dLwAsmaTavan,
    LnwAksan,     // L'n,w
    LnTw,         // L'nT,w — yönetmeliğin kullandığı gösterge
  };
}

export { lnwEsdeger };
