/**
 * oda-cizimi.js — Oda geometrisinden (L×W×H + ayırıcı yön) izometrik bir
 * şema (SVG) üretir: iki bitişik oda, ayırıcı eleman ve yan yüzeyler.
 *
 * Görsel yaklaşım KS-Schallschutzrechner'in oda diyagramına benzer:
 * yarı saydam bir dış hacim (tel kafes), ayırıcı eleman vurgulu bir
 * düzlem, ve yan yüzeyler hafif tonlu. Gerçek 3B render değil, ölçekli
 * bir izometrik şemadır — dış bağımlılık gerektirmeden yazdırılabilir
 * rapora da gömülebilir.
 *
 * Eksen tanımı (bkz. cekirdek/geometri.js): X = derinlik (L), Y = yükseklik
 * (H, yukarı), Z = genişlik (W). İki oda simetrik büyüklükte varsayılır.
 */

import { kacis } from './ortak.js';

const KACIS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

/** Dünya koordinatını (m) izometrik düzlem koordinatına (henüz ölçeksiz) projekte eder. */
function proj(x, y, z) {
  return [(x - z) * KACIS30, (x + z) * SIN30 - y];
}

/**
 * Oda geometrisinden izometrik SVG şeması üretir.
 *
 * @param {Object} geometri  { L, W, H, yon }  — bkz. cekirdek/geometri.js
 * @param {Object} [opts]
 * @param {string} [opts.oda1Adi]
 * @param {string} [opts.oda2Adi]
 * @param {number} [opts.genislik]  SVG viewBox genişliği (px)
 * @param {number} [opts.yukseklik] SVG viewBox yüksekliği (px)
 * @returns {string} <svg>…</svg> biçiminde işaretleme; geometri geçersizse ''
 */
export function odaSVG(geometri, opts = {}) {
  const { L, W, H, yon } = geometri || {};
  if (!(L > 0) || !(W > 0) || !(H > 0)) return '';

  const {
    oda1Adi = 'Kaynak mekân', oda2Adi = 'Alıcı mekân',
    genislik = 640, yukseklik = 420,
  } = opts;

  const dikeyDuvarMi = yon === 'sol' || yon === 'sag';
  // Ayırıcının bulunduğu eksen boyunca toplam boyut iki katına çıkarılır
  // (iki oda simetrik büyüklükte varsayılır); öteki eksen değişmez.
  const Lciz = dikeyDuvarMi ? L : 2 * L;
  const Wciz = dikeyDuvarMi ? 2 * W : W;

  // Ayırıcı düzlemin konumu ve normali.
  const ayiracEkseni = dikeyDuvarMi ? 'z' : 'x';
  const ayiracKonum = dikeyDuvarMi ? W : L;

  const kose = (x, y, z) => proj(x, y, z);

  // Dış kutunun 8 köşesi.
  const K = {
    aaa: kose(0, 0, 0), Aaa: kose(Lciz, 0, 0),
    aAa: kose(0, H, 0), AAa: kose(Lciz, H, 0),
    aaZ: kose(0, 0, Wciz), AaZ: kose(Lciz, 0, Wciz),
    aAZ: kose(0, H, Wciz), AAZ: kose(Lciz, H, Wciz),
  };

  // Görünür üç yüz: üst (y=H), ön-A (z=Wciz), ön-B (x=Lciz).
  const yuzUst = [K.aAa, K.AAa, K.AAZ, K.aAZ];
  const yuzOnA = [K.aaZ, K.AaZ, K.AAZ, K.aAZ];
  const yuzOnB = [K.Aaa, K.AaZ, K.AAZ, K.AAa];

  // Ayırıcı eleman düzlemi.
  const ayiracKoseleri = ayiracEkseni === 'x'
    ? [kose(ayiracKonum, 0, 0), kose(ayiracKonum, 0, Wciz), kose(ayiracKonum, H, Wciz), kose(ayiracKonum, H, 0)]
    : [kose(0, 0, ayiracKonum), kose(Lciz, 0, ayiracKonum), kose(Lciz, H, ayiracKonum), kose(0, H, ayiracKonum)];

  // Yan (flanking) yüzeyler: taban ve tavan, ekran görüntüsündeki gibi
  // hafif tonla vurgulanır.
  const yanYuzeyler = [
    { ad: 'Taban', koseler: [K.aaa, K.Aaa, K.AaZ, K.aaZ] },
    { ad: 'Tavan', koseler: [K.aAa, K.AAa, K.AAZ, K.aAZ] },
  ];

  // Boyut çizgileri: uç noktaları dünya koordinatında, etiket kaydırması
  // yalnızca PİKSEL uzayında (ölçeklemeden sonra) uygulanır.
  const boyutCizgileri = ayiracEkseni === 'x'
    ? [
        { p1: K.aaa, p2: kose(ayiracKonum, 0, 0), etiket: `L = ${L.toFixed(2)} m`, dx: 6, dy: 22 },
        { p1: K.aaa, p2: K.aaZ, etiket: `W = ${W.toFixed(2)} m`, dx: -30, dy: 6 },
        { p1: K.aaa, p2: K.aAa, etiket: `H = ${H.toFixed(2)} m`, dx: -24, dy: -4 },
      ]
    : [
        { p1: K.aaa, p2: kose(0, 0, ayiracKonum), etiket: `W = ${W.toFixed(2)} m`, dx: -30, dy: 10 },
        { p1: K.aaa, p2: K.Aaa, etiket: `L = ${L.toFixed(2)} m`, dx: 6, dy: 26 },
        { p1: K.aaa, p2: K.aAa, etiket: `H = ${H.toFixed(2)} m`, dx: -24, dy: -4 },
      ];

  // Oda etiketlerinin konumu (her odanın taban orta noktası).
  const etiketYuksekligi = H * 0.72;
  const oda1Merkez = ayiracEkseni === 'x'
    ? kose(L / 2, etiketYuksekligi, Wciz / 2)
    : kose(Lciz / 2, etiketYuksekligi, W / 2);
  const oda2Merkez = ayiracEkseni === 'x'
    ? kose(L + L / 2, etiketYuksekligi, Wciz / 2)
    : kose(Lciz / 2, etiketYuksekligi, W + W / 2);

  // ── Sığdırma: yalnızca GEOMETRİK noktalar (kutu + ayırıcı + yan
  // yüzeyler) bounding box'a katılır; etiket kaydırmaları piksel
  // uzayında olduğundan ölçeği etkilemez. ─────────────────────────────
  const geometrikNoktalar = [
    ...Object.values(K), ...ayiracKoseleri, ...yanYuzeyler.flatMap((y) => y.koseler),
  ];
  const xs = geometrikNoktalar.map((p) => p[0]);
  const ys = geometrikNoktalar.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const kenarBosluk = 56;
  const olcekX = (genislik - 2 * kenarBosluk) / Math.max(0.01, maxX - minX);
  const olcekY = (yukseklik - 2 * kenarBosluk) / Math.max(0.01, maxY - minY);
  const olcek = Math.min(olcekX, olcekY);

  const kaydirX = kenarBosluk + (genislik - 2 * kenarBosluk - (maxX - minX) * olcek) / 2;
  const kaydirY = kenarBosluk + (yukseklik - 2 * kenarBosluk - (maxY - minY) * olcek) / 2;

  const donustur = ([x, y]) => [(x - minX) * olcek + kaydirX, (y - minY) * olcek + kaydirY];

  const d = (dizi) => dizi.map(donustur).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const cizgi = (p1, p2, sinif = '') => {
    const [x1, y1] = donustur(p1); const [x2, y2] = donustur(p2);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${sinif}"/>`;
  };

  const kutuKenarlari = [
    [K.aaa, K.Aaa], [K.Aaa, K.AAa], [K.AAa, K.aAa], [K.aAa, K.aaa],
    [K.aaZ, K.AaZ], [K.AaZ, K.AAZ], [K.AAZ, K.aAZ], [K.aAZ, K.aaZ],
    [K.aaa, K.aaZ], [K.Aaa, K.AaZ], [K.AAa, K.AAZ], [K.aAa, K.aAZ],
  ];

  const [o1x, o1y] = donustur(oda1Merkez);
  const [o2x, o2y] = donustur(oda2Merkez);

  return `
<svg viewBox="0 0 ${genislik} ${yukseklik}" xmlns="http://www.w3.org/2000/svg" class="oda-svg" role="img"
     aria-label="Ayırıcı eleman ve yan yüzeyleri gösteren izometrik oda şeması">
  <style>
    .oda-svg .kutu-yuz { fill: var(--vurgu, #0f766e); fill-opacity: .05; stroke: none; }
    .oda-svg .yan-yuz { fill: #f5c453; fill-opacity: .24; stroke: #d9a62b; stroke-width: 1; stroke-opacity: .55; }
    .oda-svg .kenar { stroke: var(--soluk, #6b7c95); stroke-width: 1; opacity: .55; }
    .oda-svg .ayirici { fill: var(--vurgu, #0f766e); fill-opacity: .55; stroke: var(--vurgu-2, #0b5d57); stroke-width: 1.75; }
    .oda-svg .boyut-cizgi { stroke: var(--metin-2, #43526a); stroke-width: 1; opacity: .55; }
    .oda-svg .boyut-metin { font: 600 11px sans-serif; fill: var(--metin-2, #43526a); }
    .oda-svg .oda-metin { font: 700 12.5px sans-serif; fill: var(--metin, #141d2b); }
    .oda-svg .aciklama { font: 600 10.5px sans-serif; fill: var(--vurgu-2, #0b5d57); }
  </style>

  <polygon class="kutu-yuz" points="${d(yuzUst)}"/>
  <polygon class="kutu-yuz" points="${d(yuzOnA)}"/>
  <polygon class="kutu-yuz" points="${d(yuzOnB)}"/>
  ${yanYuzeyler.map((y) => `<polygon class="yan-yuz" points="${d(y.koseler)}"><title>${kacis(y.ad)} — yan yol iletim yüzeyi</title></polygon>`).join('\n  ')}

  ${kutuKenarlari.map(([p1, p2]) => cizgi(p1, p2, 'kenar')).join('\n  ')}

  <polygon class="ayirici" points="${d(ayiracKoseleri)}">
    <title>Ayırıcı eleman</title>
  </polygon>

  ${boyutCizgileri.map((b) => {
    const [x1, y1] = donustur(b.p1); const [x2, y2] = donustur(b.p2);
    const tx = (x1 + x2) / 2 + b.dx; const ty = (y1 + y2) / 2 + b.dy;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="boyut-cizgi" stroke-dasharray="2 2"/>
    <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="boyut-metin" text-anchor="middle">${kacis(b.etiket)}</text>`;
  }).join('\n  ')}

  <text x="${o1x.toFixed(1)}" y="${(o1y - 6).toFixed(1)}" class="oda-metin" text-anchor="middle">${kacis(oda1Adi)}</text>
  <text x="${o2x.toFixed(1)}" y="${(o2y - 6).toFixed(1)}" class="oda-metin" text-anchor="middle">${kacis(oda2Adi)}</text>
  <text x="14" y="${yukseklik - 12}" class="aciklama">■ Ayırıcı eleman</text>
  <text x="150" y="${yukseklik - 12}" class="aciklama" style="fill:#a9791f">■ Taban / tavan (yan yol)</text>
</svg>`.trim();
}
