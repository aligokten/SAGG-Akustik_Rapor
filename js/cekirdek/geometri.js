/**
 * geometri.js — Oda boyutlarından (L×W×H) ayırıcı eleman alanı, hacim ve
 * yan eleman birleşim uzunluklarının (lf) hesabı.
 *
 * Eksen tanımı:
 *   L (derinlik) — 'on' (ön) ve 'arka' duvarlara dik eksen
 *   W (genişlik) — 'sol' ve 'sağ' duvarlara dik eksen
 *   H (yükseklik)
 *
 * Ayırıcı eleman düşey bir yüzeyse ('on'|'arka'|'sol'|'sag'), o yüzün
 * kendi genişliği ile yükseklik çarpımı alanı verir; yan duvarların
 * (ayırıcıya dik diğer iki düşey yüzey) birleşim uzunluğu her zaman H'dir,
 * taban/tavanın birleşim uzunluğu ise ayırıcının kendi genişliğidir.
 *
 * Döşeme (yatay ayırıcı) için yön yoktur; taban alanı S = L×W'dir.
 */

/**
 * @param {Object} g
 * @param {number} g.L Derinlik (m)
 * @param {number} g.W Genişlik (m)
 * @param {number} g.H Yükseklik (m)
 * @param {'on'|'arka'|'sol'|'sag'} [g.yon] Ayırıcı elemanın bulunduğu düşey yüz;
 *   verilmezse döşeme (yatay ayırıcı) olarak değerlendirilir.
 * @returns {Object|null} { V, S, ayiriciGenislik?, yanDuvarLf?, tabanTavanLf? }
 */
export function geometriHesapla(g) {
  const L = Number(g?.L), W = Number(g?.W), H = Number(g?.H);
  if (!(L > 0) || !(W > 0) || !(H > 0)) return null;

  const V = L * W * H;

  if (!g.yon) {
    // Döşeme: taban/tavan alanı L×W, düşey birleşimler yok.
    return { V, S: L * W };
  }

  const dikeyDuvarMi = g.yon === 'sol' || g.yon === 'sag';
  const ayiriciGenislik = dikeyDuvarMi ? L : W;
  const S = ayiriciGenislik * H;

  return {
    V, S, ayiriciGenislik,
    yanDuvarLf: H,               // ayırıcı ile öteki iki düşey duvarın birleşimi
    tabanTavanLf: ayiriciGenislik, // ayırıcı ile taban/tavanın birleşimi
  };
}

/** Yön kodlarının Türkçe adları. */
export const YON_ADLARI = {
  on: 'Ön duvar', arka: 'Arka duvar', sol: 'Sol duvar', sag: 'Sağ duvar',
};
