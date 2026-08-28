/**
 * geometri.js — İki bağımsız oda boyutundan (L×W×H) ayırıcı eleman alanı,
 * hacim ve yan eleman birleşim uzunluklarının (lf) hesabı.
 *
 * Eksen tanımı:
 *   L (derinlik) — 'on' (ön) ve 'arka' duvarlara dik eksen
 *   W (genişlik) — 'sol' ve 'sağ' duvarlara dik eksen
 *   H (yükseklik)
 *
 * Oda 1 (kaynak) ve Oda 2 (alıcı) BAĞIMSIZ boyutlarda olabilir. Paylaşılan
 * ayırıcı yüzeyin boyutu, iki odanın örtüşen kısmıyla sınırlıdır; bu
 * nedenle ilgili doğrultularda KÜÇÜK OLAN boyut esas alınır:
 *
 *   'on'/'arka' (duvar, W×H)  : S = min(W1,W2) × min(H1,H2)
 *   'sol'/'sag' (duvar, L×H)  : S = min(L1,L2) × min(H1,H2)
 *   'taban'     (döşeme, L×W) : S = min(L1,L2) × min(W1,W2)
 *
 * Hacim (V), DnT,w hesabında kullanılan ALICI mekânın (oda2) kendi
 * hacmidir — ISO/TS EN 12354-1'in standart tanımı budur.
 *
 * Geriye dönük uyumluluk: eski tek-oda (simetrik) geometri kaydı
 * { L, W, H, yon } biçimindeydi; bu biçim algılanırsa iki oda da aynı
 * boyutta kabul edilir.
 */

/** Eski tek-oda kaydını { oda1, oda2 } biçimine normalleştirir. */
function normallestir(g) {
  if (g?.oda1 && g?.oda2) return g;
  if (Number.isFinite(g?.L)) {
    const oda = { L: g.L, W: g.W, H: g.H };
    return { oda1: oda, oda2: oda, yon: g.yon };
  }
  return null;
}

/**
 * @param {Object} g
 * @param {{L:number,W:number,H:number}} g.oda1 Kaynak mekân boyutları (m)
 * @param {{L:number,W:number,H:number}} g.oda2 Alıcı mekân boyutları (m)
 * @param {'on'|'arka'|'sol'|'sag'|'taban'} [g.yon] Ayırıcı elemanın yönü;
 *   verilmezse basit döşeme (yalnızca L×W, yön kavramı olmadan) kabul edilir.
 * @returns {Object|null} { V, S, V1, S1yerel?, ayiriciGenislik?, yanDuvarLf?, tabanTavanLf? }
 */
export function geometriHesapla(girdi) {
  const g = normallestir(girdi);
  if (!g) return null;
  const o1 = g.oda1, o2 = g.oda2;
  const gecerli = (o) => Number(o?.L) > 0 && Number(o?.W) > 0 && Number(o?.H) > 0;
  if (!gecerli(o1) || !gecerli(o2)) return null;

  const V = o2.L * o2.W * o2.H;   // alıcı mekânın kendi hacmi
  const V1 = o1.L * o1.W * o1.H;  // kaynak mekânın hacmi (yalnız bilgi amaçlı)
  const kucukH = Math.min(o1.H, o2.H);

  if (!g.yon) {
    return { V, V1, S: Math.min(o1.L, o2.L) * Math.min(o1.W, o2.W) };
  }

  if (g.yon === 'taban') {
    const onArkaLf = Math.min(o1.W, o2.W);
    const solSagLf = Math.min(o1.L, o2.L);
    return {
      V, V1, S: solSagLf * onArkaLf,
      ayiriciGenislik: null,
      yanDuvarLf: onArkaLf, tabanTavanLf: solSagLf,
    };
  }

  const dikeyDuvarMi = g.yon === 'sol' || g.yon === 'sag';
  const ayiriciGenislik = dikeyDuvarMi ? Math.min(o1.L, o2.L) : Math.min(o1.W, o2.W);
  const S = ayiriciGenislik * kucukH;

  return {
    V, V1, S, ayiriciGenislik,
    yanDuvarLf: kucukH,             // ayırıcı ile öteki iki düşey duvarın birleşimi
    tabanTavanLf: ayiriciGenislik,  // ayırıcı ile taban/tavanın birleşimi
  };
}

/** Yön kodlarının Türkçe adları. */
export const YON_ADLARI = {
  on: 'Ön duvar (W × H)', arka: 'Arka duvar (W × H)',
  sol: 'Sol duvar (L × H)', sag: 'Sağ duvar (L × H)',
  taban: 'Taban / tavan döşemesi (L × W)',
};
