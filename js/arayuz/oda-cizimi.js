/**
 * oda-cizimi.js — Oda geometrisinden (bağımsız Oda1/Oda2 boyutları + ayırıcı
 * yön) izometrik bir şema (SVG) üretir: iki bitişik oda, ayırıcı eleman ve
 * yan yüzeyler.
 *
 * Görsel yaklaşım: yarı saydam bir dış hacim (tel kafes), ayırıcı eleman
 * vurgulu bir düzlem, ve yan yüzeyler hafif tonlu. Gerçek 3B render değil,
 * ölçekli bir izometrik şemadır — dış bağımlılık gerektirmeden yazdırılabilir
 * rapora da gömülebilir.
 *
 * Eksen tanımı (bkz. cekirdek/geometri.js): X = derinlik (L), Y = yükseklik
 * (H, yukarı), Z = genişlik (W). Oda 1 ve Oda 2 bağımsız boyutlarda olabilir;
 * her biri kendi kutusuyla çizilir ve ayırıcı düzlemde hizalanır.
 *
 * `donusAcisiDeg` parametresi izometrik azimut açısını değiştirir — canlı
 * döndürme etkileşimi (sürükle) için kullanılır.
 */

import { kacis } from './ortak.js';

/** Dünya koordinatını (m) izometrik düzleme (henüz ölçeksiz) projekte eder. */
function projeksiyonUret(azimutDeg) {
  const a = (azimutDeg * Math.PI) / 180;
  const cosA = Math.cos(a), sinA = Math.sin(a);
  return (x, y, z) => [x * cosA - z * sinA, (x * sinA + z * cosA) * 0.5 - y];
}

/** Bir kutunun (L,W,H, orijin ofseti) 8 köşesini hesaplar. */
function kutuKoseleri(proj, ofsetX, boyut) {
  const { L, W, H } = boyut;
  const k = (x, y, z) => proj(ofsetX + x, y, z);
  return {
    aaa: k(0, 0, 0), Aaa: k(L, 0, 0), aAa: k(0, H, 0), AAa: k(L, H, 0),
    aaZ: k(0, 0, W), AaZ: k(L, 0, W), aAZ: k(0, H, W), AAZ: k(L, H, W),
  };
}

/**
 * Oda geometrisinden izometrik SVG şeması üretir.
 *
 * @param {Object} geometri  Ham ayırıcı geometri kaydı: { oda1:{L,W,H}, oda2:{L,W,H}, yon }
 *   veya eski tek-oda biçimi { L, W, H, yon } (oda1=oda2 kabul edilir).
 * @param {Object} [opts]
 * @param {string} [opts.oda1Adi]
 * @param {string} [opts.oda2Adi]
 * @param {number} [opts.genislik]  SVG viewBox genişliği (px)
 * @param {number} [opts.yukseklik] SVG viewBox yüksekliği (px)
 * @param {number} [opts.donusAcisiDeg] İzometrik azimut açısı (derece, varsayılan 30)
 * @returns {string} <svg>…</svg> biçiminde işaretleme; geometri geçersizse ''
 */
export function odaSVG(geometriHam, opts = {}) {
  const geometri = geometriHam?.oda1 ? geometriHam
    : (Number.isFinite(geometriHam?.L) ? { oda1: geometriHam, oda2: geometriHam, yon: geometriHam.yon } : null);
  if (!geometri) return '';
  const oda1 = geometri.oda1, oda2 = geometri.oda2, yon = geometri.yon;
  const gecerli = (o) => Number(o?.L) > 0 && Number(o?.W) > 0 && Number(o?.H) > 0;
  if (!gecerli(oda1) || !gecerli(oda2)) return '';

  const {
    oda1Adi = 'Kaynak mekân', oda2Adi = 'Alıcı mekân',
    genislik = 640, yukseklik = 420, donusAcisiDeg = 30,
  } = opts;

  const proj = projeksiyonUret(donusAcisiDeg);
  const dikeyDuvarMi = yon === 'sol' || yon === 'sag';
  const tabanMi = yon === 'taban';

  // Her odanın kendi kutusu, ortak eksende ayırıcı düzlemde bitişik
  // yerleştirilir. Eksen: tabanMi ise dikey (Y) eksende üst üste; aksi
  // hâlde dikeyDuvarMi ise Z (genişlik) ekseninde, değilse X (derinlik)
  // ekseninde yan yana.
  let K1, K2, ayiracKoseleri, oda1Merkez, oda2Merkez, yanYuzeyler1, yanYuzeyler2;

  if (tabanMi) {
    // Oda1 altta, Oda2 üstte (dikey istif); L ve W ekseni ortak hizada,
    // her odanın kendi genişliğine göre ortalanır.
    const Lmax = Math.max(oda1.L, oda2.L), Wmax = Math.max(oda1.W, oda2.W);
    const k1 = (x, y, z) => proj(x + (Lmax - oda1.L) / 2, y, z + (Wmax - oda1.W) / 2);
    const k2 = (x, y, z) => proj(x + (Lmax - oda2.L) / 2, oda1.H + y, z + (Wmax - oda2.W) / 2);
    K1 = {
      aaa: k1(0, 0, 0), Aaa: k1(oda1.L, 0, 0), aAa: k1(0, oda1.H, 0), AAa: k1(oda1.L, oda1.H, 0),
      aaZ: k1(0, 0, oda1.W), AaZ: k1(oda1.L, 0, oda1.W), aAZ: k1(0, oda1.H, oda1.W), AAZ: k1(oda1.L, oda1.H, oda1.W),
    };
    K2 = {
      aaa: k2(0, 0, 0), Aaa: k2(oda2.L, 0, 0), aAa: k2(0, oda2.H, 0), AAa: k2(oda2.L, oda2.H, 0),
      aaZ: k2(0, 0, oda2.W), AaZ: k2(oda2.L, 0, oda2.W), aAZ: k2(0, oda2.H, oda2.W), AAZ: k2(oda2.L, oda2.H, oda2.W),
    };
    const ayL = Math.min(oda1.L, oda2.L), ayW = Math.min(oda1.W, oda2.W);
    const ayX = (Lmax - ayL) / 2, ayZ = (Wmax - ayW) / 2;
    ayiracKoseleri = [
      proj(ayX, oda1.H, ayZ), proj(ayX + ayL, oda1.H, ayZ),
      proj(ayX + ayL, oda1.H, ayZ + ayW), proj(ayX, oda1.H, ayZ + ayW),
    ];
    oda1Merkez = k1(oda1.L / 2, oda1.H * 0.7, oda1.W / 2);
    oda2Merkez = k2(oda2.L / 2, oda2.H * 0.7, oda2.W / 2);
    yanYuzeyler1 = []; yanYuzeyler2 = [];
  } else if (dikeyDuvarMi) {
    // Z (genişlik) ekseninde yan yana: Oda1 z=[0,W1], Oda2 z=[W1,W1+W2].
    const Lmax = Math.max(oda1.L, oda2.L);
    const k1 = (x, y, z) => proj(x + (Lmax - oda1.L) / 2, y, z);
    const k2 = (x, y, z) => proj(x + (Lmax - oda2.L) / 2, y, oda1.W + z);
    K1 = kutuKoseleriOzel(k1, oda1);
    K2 = kutuKoseleriOzel(k2, oda2);
    const ayH = Math.min(oda1.H, oda2.H), ayL = Math.min(oda1.L, oda2.L);
    const ayX = (Lmax - ayL) / 2;
    ayiracKoseleri = [proj(ayX, 0, oda1.W), proj(ayX + ayL, 0, oda1.W), proj(ayX + ayL, ayH, oda1.W), proj(ayX, ayH, oda1.W)];
    oda1Merkez = k1(oda1.L / 2, oda1.H * 0.72, oda1.W / 2);
    oda2Merkez = k2(oda2.L / 2, oda2.H * 0.72, oda2.W / 2);
    yanYuzeyler1 = [tabanYuz(K1), tavanYuz(K1)];
    yanYuzeyler2 = [tabanYuz(K2), tavanYuz(K2)];
  } else {
    // X (derinlik) ekseninde yan yana: Oda1 x=[0,L1], Oda2 x=[L1,L1+L2].
    const Wmax = Math.max(oda1.W, oda2.W);
    const k1 = (x, y, z) => proj(x, y, z + (Wmax - oda1.W) / 2);
    const k2 = (x, y, z) => proj(oda1.L + x, y, z + (Wmax - oda2.W) / 2);
    K1 = kutuKoseleriOzel(k1, oda1);
    K2 = kutuKoseleriOzel(k2, oda2);
    const ayH = Math.min(oda1.H, oda2.H), ayW = Math.min(oda1.W, oda2.W);
    const ayZ = (Wmax - ayW) / 2;
    ayiracKoseleri = [proj(oda1.L, 0, ayZ), proj(oda1.L, 0, ayZ + ayW), proj(oda1.L, ayH, ayZ + ayW), proj(oda1.L, ayH, ayZ)];
    oda1Merkez = k1(oda1.L / 2, oda1.H * 0.72, oda1.W / 2);
    oda2Merkez = k2(oda2.L / 2, oda2.H * 0.72, oda2.W / 2);
    yanYuzeyler1 = [tabanYuz(K1), tavanYuz(K1)];
    yanYuzeyler2 = [tabanYuz(K2), tavanYuz(K2)];
  }

  function kutuKoseleriOzel(k, o) {
    return {
      aaa: k(0, 0, 0), Aaa: k(o.L, 0, 0), aAa: k(0, o.H, 0), AAa: k(o.L, o.H, 0),
      aaZ: k(0, 0, o.W), AaZ: k(o.L, 0, o.W), aAZ: k(0, o.H, o.W), AAZ: k(o.L, o.H, o.W),
    };
  }
  function tabanYuz(K) { return { ad: 'Taban', koseler: [K.aaa, K.Aaa, K.AaZ, K.aaZ] }; }
  function tavanYuz(K) { return { ad: 'Tavan', koseler: [K.aAa, K.AAa, K.AAZ, K.aAZ] }; }

  const kutuKenarlariUret = (K) => [
    [K.aaa, K.Aaa], [K.Aaa, K.AAa], [K.AAa, K.aAa], [K.aAa, K.aaa],
    [K.aaZ, K.AaZ], [K.AaZ, K.AAZ], [K.AAZ, K.aAZ], [K.aAZ, K.aaZ],
    [K.aaa, K.aaZ], [K.Aaa, K.AaZ], [K.AAa, K.AAZ], [K.aAa, K.aAZ],
  ];
  const yuzUret = (K) => [[K.aAa, K.AAa, K.AAZ, K.aAZ], [K.aaZ, K.AaZ, K.AAZ, K.aAZ], [K.Aaa, K.AaZ, K.AAZ, K.AAa]];

  const kutuKenarlari = [...kutuKenarlariUret(K1), ...kutuKenarlariUret(K2)];
  const kutuYuzler = [...yuzUret(K1), ...yuzUret(K2)];
  const yanYuzeyler = [...yanYuzeyler1, ...yanYuzeyler2];

  // ── Sığdırma ─────────────────────────────────────────────────────────
  const geometrikNoktalar = [...kutuKenarlari.flat(), ...ayiracKoseleri];
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
    .oda-svg .oda-metin { font: 700 12.5px sans-serif; fill: var(--metin, #141d2b); }
    .oda-svg .aciklama { font: 600 10.5px sans-serif; fill: var(--vurgu-2, #0b5d57); }
  </style>

  ${kutuYuzler.map((y) => `<polygon class="kutu-yuz" points="${d(y)}"/>`).join('\n  ')}
  ${yanYuzeyler.map((y) => `<polygon class="yan-yuz" points="${d(y.koseler)}"><title>${kacis(y.ad)} — yan yol iletim yüzeyi</title></polygon>`).join('\n  ')}
  ${kutuKenarlari.map(([p1, p2]) => cizgi(p1, p2, 'kenar')).join('\n  ')}

  <polygon class="ayirici" points="${d(ayiracKoseleri)}"><title>Ayırıcı eleman</title></polygon>

  <text x="${o1x.toFixed(1)}" y="${(o1y - 6).toFixed(1)}" class="oda-metin" text-anchor="middle">${kacis(oda1Adi)}</text>
  <text x="${o2x.toFixed(1)}" y="${(o2y - 6).toFixed(1)}" class="oda-metin" text-anchor="middle">${kacis(oda2Adi)}</text>
  <text x="14" y="${yukseklik - 12}" class="aciklama">■ Ayırıcı eleman</text>
  ${yanYuzeyler.length ? `<text x="150" y="${yukseklik - 12}" class="aciklama" style="fill:#a9791f">■ Taban / tavan (yan yol)</text>` : ''}
</svg>`.trim();
}
