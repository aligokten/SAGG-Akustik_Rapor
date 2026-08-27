/**
 * kutle-kanunu.js — Tek katmanlı (masif) yapı elemanlarının ağırlıklı ses
 * azaltma indisinin (Rw) alan kütlesinden kestirimi.
 *
 * Yönetmeliğin ekleri, yapı elemanlarının ses yalıtım değerlerinin
 * TS EN 12354 serisine göre hesaplanmasına veya TS EN ISO 10140 uyarınca
 * laboratuvarda ölçülmüş değerlerin kullanılmasına izin verir. Laboratuvar
 * değeri bulunmayan masif elemanlar için aşağıdaki ampirik bağıntılar
 * kullanılabilir.
 *
 * ÖNEMLİ: Ölçülmüş (beyan edilmiş) Rw değeri varsa her zaman o değer
 * kullanılmalıdır; buradaki bağıntılar yalnızca ön tasarım kestirimidir.
 */

import { log10 } from './temel.js';

/**
 * TS EN 12354-1 Ek-B — masif elemanlar için tek sayılı kestirim.
 *   m' < 200 kg/m² : Rw = 13·lg(m') + 14
 *   m' ≥ 200 kg/m² : Rw = 37,5·lg(m') − 42
 */
export function rwEN12354(mAlan) {
  if (!(mAlan > 0)) return NaN;
  return mAlan < 200 ? 13 * log10(mAlan) + 14 : 37.5 * log10(mAlan) - 42;
}

/**
 * DIN 4109-32 tipi masif duvar bağıntısı (KS-Schallschutzrechner'ın
 * dayandığı Alman modeli). Türkiye'de zorunlu değildir; karşılaştırma ve
 * kalibrasyon amacıyla sunulur.
 *   m' ≤ 150 kg/m² : Rw = 20,4·lg(m') + 0,9   (düşük kütle kolu)
 *   m' > 150 kg/m² : Rw = 30,9·lg(m') − 22,2
 */
export function rwDIN4109(mAlan) {
  if (!(mAlan > 0)) return NaN;
  return mAlan <= 150 ? 20.4 * log10(mAlan) + 0.9 : 30.9 * log10(mAlan) - 22.2;
}

/** Kullanılabilir kestirim modelleri. */
export const MODELLER = {
  'en12354': {
    ad: 'TS EN 12354-1 Ek-B (varsayılan)',
    fn: rwEN12354,
    aciklama: 'Yönetmeliğin atıf yaptığı TS EN 12354-1 standardının Ek-B kestirimi.',
  },
  'din4109': {
    ad: 'DIN 4109-32 (masif duvar)',
    fn: rwDIN4109,
    aciklama: 'Alman DIN 4109-32 masif duvar bağıntısı; karşılaştırma amaçlıdır.',
  },
};

/**
 * Alan kütlesinden Rw kestirimi.
 * @param {number} mAlan Alan kütlesi (kg/m²)
 * @param {string} model 'en12354' | 'din4109'
 */
export function rwKestir(mAlan, model = 'en12354') {
  const m = MODELLER[model] || MODELLER['en12354'];
  return m.fn(mAlan);
}

/**
 * TS EN 12354-2 Ek-B — masif döşemenin kaplamasız (çıplak) ağırlıklı
 * normalize darbe sesi düzeyi:
 *   Ln,w,eq = 164 − 35·lg(m')
 * @param {number} mAlan Döşemenin alan kütlesi (kg/m²)
 */
export function lnwEsdeger(mAlan) {
  if (!(mAlan > 0)) return NaN;
  return 164 - 35 * log10(mAlan);
}
