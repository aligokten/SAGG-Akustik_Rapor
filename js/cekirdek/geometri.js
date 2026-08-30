/**
 * geometri.js — İki bağımsız oda boyutundan (L×W×H) ayırıcı eleman alanı,
 * hacim ve yan eleman birleşim uzunluklarının (lf) hesabı.
 *
 * Eksen tanımı:
 *   L (derinlik) — 'on' (ön) ve 'arka' duvarlara dik eksen
 *   W (genişlik) — 'sol' ve 'sağ' duvarlara dik eksen
 *   H (yükseklik)
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  ORTAK (AYIRICI) ALAN — KAYDIRMA
 * ─────────────────────────────────────────────────────────────────────────
 *  İki mekân ayırıcı düzlem üzerinde birbirine göre KAYDIRILMIŞ olabilir.
 *  Bu durumda duvarın/döşemenin yalnızca örtüşen kısmı ayırıcı elemandır;
 *  kalan kısım kaynak ya da alıcı odanın kendi yan duvarı veya döşemesidir
 *  ve iki mekân arasında doğrudan bir iletim yolu oluşturmaz.
 *
 *  Ayırıcı düzlemin iki eksen içi doğrultusu A ve B ile gösterilir:
 *
 *    'on'/'arka' (duvar) : A = W (genişlik)  B = H (yükseklik)
 *    'sol'/'sag' (duvar) : A = L (derinlik)  B = H (yükseklik)
 *    'taban'   (döşeme)  : A = L (derinlik)  B = W (genişlik)
 *
 *  Kaydırma, HİZALI konumdan sapma olarak ölçülür:
 *    • yatay eksenlerde (L, W) hizalı konum ortalanmış konumdur,
 *    • düşey eksende (H) hizalı konum taban hizasıdır (odalar döşemeye oturur).
 *  Her iki durumda da kaydırma sıfırken örtüşme min(A1, A2) olur; yani
 *  kaydırma alanı olmayan eski kayıtlar birebir aynı sonucu verir.
 *
 *  Kaydırma yeterince büyükse örtüşme sıfırlanır: mekânlar artık temas
 *  etmiyordur ve ortada bir ayırıcı eleman yoktur (`temasVar: false`).
 *
 *  Hacim (V), DnT,w hesabında kullanılan ALICI mekânın (oda2) kendi
 *  hacmidir — TS EN 12354-1'in standart tanımı budur.
 *
 *  Geriye dönük uyumluluk: eski tek-oda (simetrik) geometri kaydı
 *  { L, W, H, yon } biçimindeydi; bu biçim algılanırsa iki oda da aynı
 *  boyutta kabul edilir. Kaydırma alanları yoksa 0 varsayılır, yani eski
 *  kayıtlar birebir aynı sonucu vermeye devam eder.
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
 * İki aralığın kesişim uzunluğu: [0, a] ile [d, d+b].
 * Kaydırma (d) sıfırken sonuç min(a, b)'dir.
 *
 * @param {number} a Oda 1'in bu eksendeki boyutu (m)
 * @param {number} b Oda 2'nin bu eksendeki boyutu (m)
 * @param {number} d Oda 2'nin oda 1'e göre kaydırması (m; işaretli)
 * @returns {number} Örtüşen uzunluk (m); temas yoksa 0
 */
export function ortakUzunluk(a, b, d = 0) {
  const kaydirma = Number.isFinite(d) ? d : 0;
  return Math.max(0, Math.min(a, kaydirma + b) - Math.max(0, kaydirma));
}

/**
 * Bir eksende "hizalı" kabul edilen konumun ofseti.
 *
 * Yatay eksenlerde odalar ortalanmış, düşey eksende taban hizasında kabul
 * edilir. İkisinde de sonuç min(a, b) örtüşmesidir.
 */
export function hizaOfseti(a, b, dikeyMi) {
  return dikeyMi ? 0 : (a - b) / 2;
}

/**
 * Hizalı konumdan `d` kadar kaydırılmış iki aralığın örtüşmesi.
 * `d = 0` iken sonuç min(a, b)'dir.
 */
export function ortakUzunlukHizali(a, b, d = 0, dikeyMi = false) {
  return ortakUzunluk(a, b, hizaOfseti(a, b, dikeyMi) + (Number.isFinite(d) ? d : 0));
}

/** Ayırıcı yönüne göre düzlem içi eksenlerin adları (arayüz etiketleri). */
export const KAYDIRMA_EKSENLERI = {
  on:    { A: 'Genişlik (W) ekseninde', B: 'Yükseklik (H) ekseninde' },
  arka:  { A: 'Genişlik (W) ekseninde', B: 'Yükseklik (H) ekseninde' },
  sol:   { A: 'Derinlik (L) ekseninde', B: 'Yükseklik (H) ekseninde' },
  sag:   { A: 'Derinlik (L) ekseninde', B: 'Yükseklik (H) ekseninde' },
  taban: { A: 'Derinlik (L) ekseninde', B: 'Genişlik (W) ekseninde' },
};

/** Bir yön için ayırıcı düzlemin iki eksen içi boyutunu odadan okur. */
function duzlemBoyutlari(oda, yon) {
  if (yon === 'taban') return { A: oda.L, B: oda.W };
  if (yon === 'sol' || yon === 'sag') return { A: oda.L, B: oda.H };
  return { A: oda.W, B: oda.H };            // 'on' | 'arka'
}

/** Düzlem içi B ekseni düşey mi? ('taban' dışında B her zaman yüksekliktir) */
export function bEkseniDikeyMi(yon) {
  return yon !== 'taban';
}

/**
 * @param {Object} girdi
 * @param {{L:number,W:number,H:number}} girdi.oda1 Kaynak mekân boyutları (m)
 * @param {{L:number,W:number,H:number}} girdi.oda2 Alıcı mekân boyutları (m)
 * @param {'on'|'arka'|'sol'|'sag'|'taban'} [girdi.yon] Ayırıcı elemanın yönü
 * @param {number} [girdi.kaydirmaA] Oda 2'nin A ekseninde kaydırması (m)
 * @param {number} [girdi.kaydirmaB] Oda 2'nin B ekseninde kaydırması (m)
 * @returns {Object|null}
 */
export function geometriHesapla(girdi) {
  const g = normallestir(girdi);
  if (!g) return null;
  const o1 = g.oda1, o2 = g.oda2;
  const gecerli = (o) => Number(o?.L) > 0 && Number(o?.W) > 0 && Number(o?.H) > 0;
  if (!gecerli(o1) || !gecerli(o2)) return null;

  const V = o2.L * o2.W * o2.H;   // alıcı mekânın kendi hacmi
  const V1 = o1.L * o1.W * o1.H;  // kaynak mekânın hacmi (yalnız bilgi amaçlı)

  const dA = Number(girdi?.kaydirmaA) || 0;
  const dB = Number(girdi?.kaydirmaB) || 0;

  if (!g.yon) {
    // Yön kavramı olmayan yalın döşeme kaydı (eski biçim).
    return {
      V, V1,
      S: ortakUzunlukHizali(o1.L, o2.L, dA) * ortakUzunlukHizali(o1.W, o2.W, dB),
    };
  }

  const b1 = duzlemBoyutlari(o1, g.yon);
  const b2 = duzlemBoyutlari(o2, g.yon);
  const dikeyB = bEkseniDikeyMi(g.yon);
  const ortakA = ortakUzunlukHizali(b1.A, b2.A, dA, false);
  const ortakB = ortakUzunlukHizali(b1.B, b2.B, dB, dikeyB);
  const S = ortakA * ortakB;

  // Ayırıcı düzlemde her odanın kendi yüzey alanı ve bu yüzeyin ortak
  // OLMAYAN kısmı. Ortak olmayan kısım, o odanın kendi yan duvarı /
  // döşemesidir; iki mekân arasında iletim yolu değildir.
  const oda1Yuzey = b1.A * b1.B;
  const oda2Yuzey = b2.A * b2.B;

  const ortak = {
    ortakA, ortakB,
    oda1Yuzey, oda2Yuzey,
    oda1OrtakOlmayan: Math.max(0, oda1Yuzey - S),
    oda2OrtakOlmayan: Math.max(0, oda2Yuzey - S),
    temasVar: S > 0,
    // Küçük yüzeyin tamamı paylaşılıyorsa kaydırmanın hesaba etkisi yoktur.
    tamOrtusme: S > 0 && Math.abs(S - Math.min(oda1Yuzey, oda2Yuzey)) < 1e-9,
    kaydirmaA: dA, kaydirmaB: dB,
  };

  if (g.yon === 'taban') {
    // Döşeme ayırıcıda dört yan elemanın hepsi düşey duvardır; rol etiketi
    // yalnızca hangi döşeme kenarı boyunca birleştiklerini seçer.
    // Kural her üç yönde de aynıdır: 0/1 dizinli yan elemanlar `yanDuvarLf`,
    // 2/3 dizinliler `tabanTavanLf` alır (referans motordaki spanA/spanB).
    return {
      V, V1, S, ...ortak,
      ayiriciGenislik: null,
      yanDuvarLf: ortakA, tabanTavanLf: ortakB,
    };
  }

  return {
    V, V1, S, ...ortak,
    ayiriciGenislik: ortakA,
    yanDuvarLf: ortakB,     // ayırıcı ile öteki iki düşey duvarın birleşimi
    tabanTavanLf: ortakA,   // ayırıcı ile taban/tavanın birleşimi
  };
}

/** Yön kodlarının Türkçe adları. */
export const YON_ADLARI = {
  on: 'Ön duvar (W × H)', arka: 'Arka duvar (W × H)',
  sol: 'Sol duvar (L × H)', sag: 'Sağ duvar (L × H)',
  taban: 'Taban / tavan döşemesi (L × W)',
};
