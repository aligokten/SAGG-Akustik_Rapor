/**
 * reverberasyon.js — Mekân içi reverberasyon (çınlama) süresi hesabı.
 *
 * Yönetmelik, bina türüne ve mekân işlevine göre izin verilen reverberasyon
 * sürelerini tanımlar. Hesap, TS EN 12354-6 ve klasik Sabine bağıntısı ile
 * yapılır:
 *
 *   T = 0,161 · V / ( Σ Si·αi + Σ An + 4·m·V )
 *
 *   Si, αi : yüzey alanı ve o frekanstaki ses soğurma katsayısı
 *   An     : nesne/kişi başına eşdeğer soğurma alanı (m² Sabine)
 *   m      : havanın soğurma katsayısı (1/m), yüksek frekanslarda önemlidir
 */

import { OKTAV_BANTLARI } from './temel.js';

/**
 * Havanın ses soğurma katsayısı m (1/m) — 20 °C, %50 bağıl nem için
 * yaklaşık değerler (TS EN 12354-6 / ISO 9613-1).
 */
export const HAVA_SOGURMASI = {
  125: 0.0001, 250: 0.0003, 500: 0.0006,
  1000: 0.0010, 2000: 0.0025, 4000: 0.0070,
};

/**
 * @typedef {Object} Yuzey
 * @property {string} ad
 * @property {number} alan  (m²)
 * @property {Object<number, number>} alfa Oktav bandına göre soğurma katsayıları
 */

/**
 * @typedef {Object} Nesne
 * @property {string} ad
 * @property {number} adet
 * @property {Object<number, number>} A Nesne başına eşdeğer soğurma alanı (m²)
 */

/**
 * Reverberasyon süresini oktav bantlarında hesaplar.
 *
 * @param {Object} girdi
 * @param {number} girdi.V Hacim (m³)
 * @param {Yuzey[]} girdi.yuzeyler
 * @param {Nesne[]} [girdi.nesneler]
 * @param {boolean} [girdi.havaSogurmasi] Hava soğurması hesaba katılsın mı
 * @returns {{bantlar:number[], T:Object<number,number>, A:Object<number,number>, Torta:number}}
 */
export function reverberasyonSuresi(girdi) {
  const { V, yuzeyler = [], nesneler = [], havaSogurmasi = true } = girdi;
  const T = {};
  const A = {};

  for (const f of OKTAV_BANTLARI) {
    let toplamA = 0;
    for (const y of yuzeyler) toplamA += (y.alan || 0) * (y.alfa?.[f] ?? 0);
    for (const n of nesneler) toplamA += (n.adet || 0) * (n.A?.[f] ?? 0);
    if (havaSogurmasi) toplamA += 4 * (HAVA_SOGURMASI[f] || 0) * V;

    A[f] = toplamA;
    T[f] = toplamA > 0 ? (0.161 * V) / toplamA : Infinity;
  }

  // Yönetmelik değerlendirmelerinde yaygın olarak 500–1000–2000 Hz ortalaması kullanılır.
  const orta = [500, 1000, 2000].map((f) => T[f]).filter(Number.isFinite);
  const Torta = orta.length ? orta.reduce((a, b) => a + b, 0) / orta.length : NaN;

  return { bantlar: OKTAV_BANTLARI, T, A, Torta };
}

/**
 * Hedef reverberasyon süresine ulaşmak için gereken ilave soğurma alanı (m²).
 * @param {number} V Hacim (m³)
 * @param {number} Amevcut Mevcut soğurma alanı (m² Sabine)
 * @param {number} Thedef Hedef reverberasyon süresi (s)
 */
export function gerekliIlaveSogurma(V, Amevcut, Thedef) {
  const Agerekli = (0.161 * V) / Thedef;
  return Math.max(0, Agerekli - Amevcut);
}
