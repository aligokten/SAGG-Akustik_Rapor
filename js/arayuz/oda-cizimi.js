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

/**
 * Ses kaynağını temsil eden simge: bir hoparlör gövdesi ve yayılan üç yay.
 *
 * İzometrik şemada gerçek bir hacim değil, ekran düzleminde çizilen bir
 * gösterge olarak durur; bu yüzden döndürmeden etkilenmez ve her açıda
 * okunur kalır.
 *
 * @param {number} cx Ekran koordinatı (px)
 * @param {number} cy Ekran koordinatı (px)
 * @param {number} olcek 1 = varsayılan boyut
 * @param {string} etiket Erişilebilirlik/başlık metni
 */
export function sesKaynagiSimgesi(cx, cy, olcek = 1, etiket = 'Ses kaynağı') {
  const b = 9 * olcek;                       // gövde yarı yüksekliği
  const x = cx - b * 1.5;
  const yay = (r) => {
    const rx = r * b;
    return `M ${(x + b * 1.15).toFixed(1)} ${(cy - rx * 0.75).toFixed(1)}`
         + ` A ${rx.toFixed(1)} ${rx.toFixed(1)} 0 0 1 ${(x + b * 1.15).toFixed(1)} ${(cy + rx * 0.75).toFixed(1)}`;
  };
  return `
  <g class="ses-kaynagi" aria-label="${kacis(etiket)}">
    <title>${kacis(etiket)}</title>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(b * 2.1).toFixed(1)}" class="sk-hale"/>
    <path class="sk-govde" d="M ${(x - b * 0.9).toFixed(1)} ${(cy - b * 0.42).toFixed(1)}
      h ${(b * 0.62).toFixed(1)} l ${(b * 0.78).toFixed(1)} ${(-b * 0.72).toFixed(1)}
      v ${(b * 2.28).toFixed(1)} l ${(-b * 0.78).toFixed(1)} ${(-b * 0.72).toFixed(1)}
      h ${(-b * 0.62).toFixed(1)} z"/>
    <path class="sk-yay" d="${yay(0.62)}"/>
    <path class="sk-yay" d="${yay(1.02)}"/>
    <path class="sk-yay" d="${yay(1.42)}"/>
  </g>`;
}

/** Şemalarda ortak kullanılan biçem bloğu. */
function ortakBicem() {
  return `
    .oda-svg .kutu-yuz { fill: var(--vurgu, #0f766e); fill-opacity: .05; stroke: none; }
    .oda-svg .yan-yuz { fill: #f5c453; fill-opacity: .24; stroke: #d9a62b; stroke-width: 1; stroke-opacity: .55; }
    .oda-svg .kenar { stroke: var(--soluk, #6b7c95); stroke-width: 1; opacity: .55; }
    .oda-svg .ayirici { fill: var(--vurgu, #0f766e); fill-opacity: .55; stroke: var(--vurgu-2, #0b5d57); stroke-width: 1.75; }
    .oda-svg .oda-metin { font: 700 12.5px sans-serif; fill: var(--metin, #141d2b); }
    .oda-svg .aciklama { font: 600 10.5px sans-serif; fill: var(--vurgu-2, #0b5d57); }
    /* Ölçü etiketleri kenar çizgilerinin üstüne düştüğü için ince bir dış
       hat (paint-order: stroke) ile okunur kalır. */
    .oda-svg .olcu { font: 700 10px sans-serif; fill: var(--metin-2, #26242a);
      paint-order: stroke; stroke: var(--yuzey, #fff); stroke-width: 3px;
      stroke-linejoin: round; }
    .oda-svg .olcu-cizgi { stroke: var(--soluk, #6b7c95); stroke-width: .9; opacity: .5;
      stroke-dasharray: 3 2; }
    .oda-svg .ses-kaynagi .sk-govde { fill: #e0483c; stroke: #a5271d; stroke-width: 1; stroke-linejoin: round; }
    .oda-svg .ses-kaynagi .sk-yay { fill: none; stroke: #e0483c; stroke-width: 1.6; stroke-linecap: round; opacity: .9; }
    .oda-svg .ses-kaynagi .sk-hale { fill: #e0483c; fill-opacity: .12; }`;
}

/** Şemada gösterilen ölçüyü Türkçe biçimde yazar (bir ondalık). */
function olcuMetni(deger) {
  return `${Number(deger).toFixed(1).replace('.', ',')} m`;
}

/**
 * Bir kutunun üç kenarına L / W / H ölçülerini yazar.
 *
 * Etiketler, izleyiciye dönük ön-sağ-alt köşede (AaZ) buluşan üç kenarın
 * orta noktasına konur ve kutunun merkezinden dışa doğru itilir; böylece
 * kenar çizgilerinin ve öteki odanın üzerine binmezler.
 *
 * @param {Object} K Kutunun köşeleri (projeksiyon uygulanmış, ölçeksiz)
 * @param {Object} oda { L, W, H }
 * @param {Function} donustur Ölçekleyip SVG koordinatına çeviren işlev
 * @param {Array} merkez Kutunun merkezi (ölçeksiz) — itme yönü için
 * @returns {string} SVG parçası
 */
function olcuEtiketleri(K, oda, donustur, merkez) {
  const [mx, my] = donustur(merkez);
  const parcalar = [
    { a: K.aaZ, b: K.AaZ, metin: `L ${olcuMetni(oda.L)}` },   // derinlik
    { a: K.Aaa, b: K.AaZ, metin: `W ${olcuMetni(oda.W)}` },   // genişlik
    { a: K.AaZ, b: K.AAZ, metin: `H ${olcuMetni(oda.H)}` },   // yükseklik
  ];
  return parcalar.map(({ a, b, metin }) => {
    const [ax, ay] = donustur(a), [bx, by] = donustur(b);
    const ox = (ax + bx) / 2, oy = (ay + by) / 2;
    // Merkezden dışa doğru sabit uzunlukta it.
    const dx = ox - mx, dy = oy - my;
    const boy = Math.hypot(dx, dy) || 1;
    const ex = ox + (dx / boy) * 17, ey = oy + (dy / boy) * 17;
    return `<line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" class="olcu-cizgi"/>`
      + `<text x="${ex.toFixed(1)}" y="${(ey + 3.5).toFixed(1)}" class="olcu" text-anchor="middle">${kacis(metin)}</text>`;
  }).join('\n  ');
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

  // Kaydırma, HİZALI konumdan sapma olarak uygulanır: yatay eksenlerde
  // ortalanmış, düşey eksende taban hizası. Kaydırma 0 iken çizim eskisiyle
  // birebir aynıdır. Örtüşme aralığı `cekirdek/geometri.js` ile aynı kuralla
  // bulunur, böylece şema ve hesap hiçbir zaman ayrışmaz.
  const dA = Number(geometri.kaydirmaA) || 0;
  const dB = Number(geometri.kaydirmaB) || 0;
  const kesisim = (a1, u1, a2, u2) => [Math.max(a1, a2), Math.min(a1 + u1, a2 + u2)];
  // Kaydırma, iki mekânın REFERANS KENARLARI arasındaki uzaklıktır (bkz.
  // cekirdek/geometri.js): her odanın yerel koordinatı kendi referans
  // kenarında sıfırdan başlar, kaydırma da Oda 2'nin başlangıcını doğrudan
  // verir. Bu yüzden burada ortalama düzeltmesi YOKTUR — çizim ile hesap
  // aynı kuralı kullanmalı, aksi hâlde şema yanlış yeri gösterir.

  if (tabanMi) {
    // Oda1 altta, Oda2 üstte (dikey istif). Düzlem içi eksenler: L (x), W (z).
    const x2 = dA;
    const z2 = dB;
    const k1 = (x, y, z) => proj(x, y, z);
    const k2 = (x, y, z) => proj(x + x2, oda1.H + y, z + z2);
    K1 = kutuKoseleriOzel(k1, oda1);
    K2 = kutuKoseleriOzel(k2, oda2);
    const [xa, xb] = kesisim(0, oda1.L, x2, oda2.L);
    const [za, zb] = kesisim(0, oda1.W, z2, oda2.W);
    ayiracKoseleri = xb > xa && zb > za
      ? [proj(xa, oda1.H, za), proj(xb, oda1.H, za), proj(xb, oda1.H, zb), proj(xa, oda1.H, zb)]
      : [];
    oda1Merkez = k1(oda1.L / 2, oda1.H * 0.7, oda1.W / 2);
    oda2Merkez = k2(oda2.L / 2, oda2.H * 0.7, oda2.W / 2);
    yanYuzeyler1 = []; yanYuzeyler2 = [];
  } else if (dikeyDuvarMi) {
    // Z (genişlik) ekseninde yan yana. Düzlem içi eksenler: L (x), H (y).
    const x2 = dA;
    const y2 = dB;
    const k1 = (x, y, z) => proj(x, y, z);
    const k2 = (x, y, z) => proj(x + x2, y + y2, oda1.W + z);
    K1 = kutuKoseleriOzel(k1, oda1);
    K2 = kutuKoseleriOzel(k2, oda2);
    const [xa, xb] = kesisim(0, oda1.L, x2, oda2.L);
    const [ya, yb] = kesisim(0, oda1.H, y2, oda2.H);
    ayiracKoseleri = xb > xa && yb > ya
      ? [proj(xa, ya, oda1.W), proj(xb, ya, oda1.W), proj(xb, yb, oda1.W), proj(xa, yb, oda1.W)]
      : [];
    oda1Merkez = k1(oda1.L / 2, oda1.H * 0.72, oda1.W / 2);
    oda2Merkez = k2(oda2.L / 2, oda2.H * 0.72, oda2.W / 2);
    yanYuzeyler1 = [tabanYuz(K1), tavanYuz(K1)];
    yanYuzeyler2 = [tabanYuz(K2), tavanYuz(K2)];
  } else {
    // X (derinlik) ekseninde yan yana. Düzlem içi eksenler: W (z), H (y).
    const z2 = dA;
    const y2 = dB;
    const k1 = (x, y, z) => proj(x, y, z);
    const k2 = (x, y, z) => proj(oda1.L + x, y + y2, z + z2);
    K1 = kutuKoseleriOzel(k1, oda1);
    K2 = kutuKoseleriOzel(k2, oda2);
    const [za, zb] = kesisim(0, oda1.W, z2, oda2.W);
    const [ya, yb] = kesisim(0, oda1.H, y2, oda2.H);
    ayiracKoseleri = zb > za && yb > ya
      ? [proj(oda1.L, ya, za), proj(oda1.L, ya, zb), proj(oda1.L, yb, zb), proj(oda1.L, yb, za)]
      : [];
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

  // Ölçü etiketleri kutunun dışına taştığı için kenar payı geniş tutulur;
  // aksi hâlde "H 2,6 m" gibi etiketler viewBox dışına çıkıp kırpılır.
  const kenarBosluk = 74;
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

  // Ses kaynağı, kaynak mekânın (Oda 1) içinde, ad etiketinin altında durur.
  const [skx, sky] = donustur(oda1Merkez);

  return `
<svg viewBox="0 0 ${genislik} ${yukseklik}" xmlns="http://www.w3.org/2000/svg" class="oda-svg" role="img"
     aria-label="Ayırıcı eleman, yan yüzeyler ve kaynak mekândaki ses kaynağını gösteren izometrik oda şeması">
  <style>${ortakBicem()}</style>

  ${kutuYuzler.map((y) => `<polygon class="kutu-yuz" points="${d(y)}"/>`).join('\n  ')}
  ${yanYuzeyler.map((y) => `<polygon class="yan-yuz" points="${d(y.koseler)}"><title>${kacis(y.ad)} — yan yol iletim yüzeyi</title></polygon>`).join('\n  ')}
  ${kutuKenarlari.map(([p1, p2]) => cizgi(p1, p2, 'kenar')).join('\n  ')}

  ${ayiracKoseleri.length
    ? `<polygon class="ayirici" points="${d(ayiracKoseleri)}"><title>Ayırıcı eleman</title></polygon>`
    : ''}

  ${olcuEtiketleri(K1, oda1, donustur, oda1Merkez)}
  ${olcuEtiketleri(K2, oda2, donustur, oda2Merkez)}

  ${sesKaynagiSimgesi(skx, sky + 20, 1, `Ses kaynağı — ${oda1Adi}`)}

  <text x="${o1x.toFixed(1)}" y="${(o1y - 6).toFixed(1)}" class="oda-metin" text-anchor="middle">${kacis(oda1Adi)}</text>
  <text x="${o2x.toFixed(1)}" y="${(o2y - 6).toFixed(1)}" class="oda-metin" text-anchor="middle">${kacis(oda2Adi)}</text>
  <text x="14" y="${yukseklik - 12}" class="aciklama">■ Ayırıcı eleman</text>
  ${yanYuzeyler.length ? `<text x="150" y="${yukseklik - 12}" class="aciklama" style="fill:#a9791f">■ Taban / tavan (yan yol)</text>` : ''}
  <text x="${yanYuzeyler.length ? 330 : 150}" y="${yukseklik - 12}" class="aciklama" style="fill:#c8362a">◉ Ses kaynağı</text>
</svg>`.trim();
}

/* ═══════════════════════════════════════════════════════════════════════
   Cephe şeması
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Bir doğramanın bulunduğu duvardaki yerleşimini belirler.
 *
 * Kullanıcı doğramanın duvar üzerindeki konumunu girmez; yalnızca en ve boy
 * ölçüsü vardır. Bu nedenle doğramalar duvar boyunca eşit aralıklarla,
 * tipik bir denizlik yüksekliğinde dizilir: ölçüler ve hangi duvarda
 * oldukları doğrudur, yatay konum temsilîdir.
 *
 * @param {{en:number, boy:number}[]} dogramalar
 * @param {number} duvarBoyu Duvarın yatay uzunluğu (m)
 * @param {number} H Kat yüksekliği (m)
 * @returns {{u0:number, u1:number, y0:number, y1:number}[]} duvar düzlemindeki dikdörtgenler
 */
export function dogramaYerlesimi(dogramalar, duvarBoyu, H) {
  const n = dogramalar.length;
  if (!n || !(duvarBoyu > 0) || !(H > 0)) return [];

  const enToplam = dogramalar.reduce((a, d) => a + Math.max(0, d.en), 0);
  // Aralık, artan boşluğun (n+1)'e bölünmesiyle; taşma varsa asgariye iner.
  const aralik = Math.max(0.04, (duvarBoyu - enToplam) / (n + 1));

  let u = aralik;
  return dogramalar.map((dg) => {
    const en = Math.max(0.05, Math.min(dg.en, duvarBoyu));
    const boy = Math.max(0.05, Math.min(dg.boy, H * 0.94));
    // Denizlik: kalan yüksekliğin biraz altına oturur (tipik pencere).
    const y0 = Math.max(0.03, (H - boy) * 0.45);
    const kutu = { u0: u, u1: u + en, y0, y1: y0 + boy };
    u += en + aralik;
    return kutu;
  });
}

/**
 * Cephe mekânından izometrik SVG şeması üretir.
 *
 * Tek bir oda kutusu çizilir; orta mahalde bir (D1 = L×H), köşe mahalde iki
 * (D1 ve D2 = W×H) dış duvar vurgulanır. Doğramalar ait oldukları duvarda
 * gerçek en × boy ölçüleriyle işlenir. İç tavan, iç taban ve iç yan duvarlar
 * yan yol (Df) yüzeyi olarak hafif tonlanır. Ses kaynağı, dış ortamı temsilen
 * cephenin dışında durur.
 *
 * @param {Object} cephe { geometri:{L,W,H}, konum, elemanlar:[…] }
 * @param {Object} [opts] { mekanAdi, genislik, yukseklik, donusAcisiDeg }
 * @returns {string} <svg>…</svg>; geometri geçersizse ''
 */
export function cepheSVG(cephe, opts = {}) {
  const g = cephe?.geometri;
  const L = Number(g?.L), W = Number(g?.W), H = Number(g?.H);
  if (!(L > 0) || !(W > 0) || !(H > 0)) return '';

  const {
    mekanAdi = 'Mahal', genislik = 640, yukseklik = 360, donusAcisiDeg = 30,
  } = opts;
  const kose = cephe.konum === 'kose';
  const proj = projeksiyonUret(donusAcisiDeg);

  const K = {
    aaa: proj(0, 0, 0), Aaa: proj(L, 0, 0), aAa: proj(0, H, 0), AAa: proj(L, H, 0),
    aaZ: proj(0, 0, W), AaZ: proj(L, 0, W), aAZ: proj(0, H, W), AAZ: proj(L, H, W),
  };

  // D1 = L×H düzlemi (z = 0), D2 = W×H düzlemi (x = 0). İkisi köşede buluşur.
  const D1 = [K.aaa, K.Aaa, K.AAa, K.aAa];
  const D2 = [K.aaa, K.aaZ, K.aAZ, K.aAa];

  // İç yan yol yüzeyleri: tavan, taban ve (D1'e dik) iç yan duvar.
  const yanYuzeyler = [
    { ad: 'İç tavan', koseler: [K.aAa, K.AAa, K.AAZ, K.aAZ] },
    { ad: 'İç taban', koseler: [K.aaa, K.Aaa, K.AaZ, K.aaZ] },
  ];
  if (!kose) yanYuzeyler.push({ ad: 'İç yan duvar', koseler: D2 });

  const kenarlar = [
    [K.aaa, K.Aaa], [K.Aaa, K.AAa], [K.AAa, K.aAa], [K.aAa, K.aaa],
    [K.aaZ, K.AaZ], [K.AaZ, K.AAZ], [K.AAZ, K.aAZ], [K.aAZ, K.aaZ],
    [K.aaa, K.aaZ], [K.Aaa, K.AaZ], [K.AAa, K.AAZ], [K.aAa, K.aAZ],
  ];

  // ── Doğramalar: her biri kendi duvarının düzleminde ────────────────────
  const dogramalar = (cephe.elemanlar || []).filter((e) => e.tur !== 'duvar');
  const duvarlar = kose ? [1, 2] : [1];
  const dogramaYuzleri = [];

  for (const no of duvarlar) {
    const buDuvar = dogramalar
      .filter((e) => (e.duvarNo || 1) === no)
      .map((e) => ({ ad: e.ad, en: Number(e.en) || 0, boy: Number(e.boy) || 0 }))
      .filter((e) => e.en > 0 && e.boy > 0);
    if (!buDuvar.length) continue;

    const duvarBoyu = no === 1 ? L : W;
    // Duvar düzleminde (u = yatay, y = düşey) → dünya koordinatı.
    const noktaya = no === 1
      ? (u, y) => proj(u, y, 0)     // D1: z = 0 düzlemi, u = x
      : (u, y) => proj(0, y, u);    // D2: x = 0 düzlemi, u = z

    dogramaYerlesimi(buDuvar, duvarBoyu, H).forEach((r, i) => {
      dogramaYuzleri.push({
        ad: buDuvar[i].ad,
        en: buDuvar[i].en,
        boy: buDuvar[i].boy,
        duvarNo: no,
        koseler: [noktaya(r.u0, r.y0), noktaya(r.u1, r.y0), noktaya(r.u1, r.y1), noktaya(r.u0, r.y1)],
      });
    });
  }

  // Ses kaynağı: dış ortamı temsilen D1'in önünde (z < 0). Kutudan belirgin
  // biçimde ayrı dursun diye en az 1,8 m dışarı taşınır; cepheye uzanan
  // kesikli kılavuz çizgi geliş yönünü gösterir.
  const kaynakDerinlik = -Math.max(W * 0.8, 1.8);
  const kaynakNokta = proj(L / 2, H * 0.55, kaynakDerinlik);
  const kaynakHedef = proj(L / 2, H * 0.5, 0);

  // ── Sığdırma ──────────────────────────────────────────────────────────
  const noktalar = [...kenarlar.flat(), ...D1, ...D2, kaynakNokta, kaynakHedef,
    ...dogramaYuzleri.flatMap((f) => f.koseler)];
  const xs = noktalar.map((p) => p[0]);
  const ys = noktalar.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  // Ölçü etiketleri kutunun dışına taşar; kenar payı ona göre geniş tutulur.
  const kenarBosluk = 72;
  const olcek = Math.min(
    (genislik - 2 * kenarBosluk) / Math.max(0.01, maxX - minX),
    (yukseklik - 2 * kenarBosluk) / Math.max(0.01, maxY - minY),
  );
  const kaydirX = kenarBosluk + (genislik - 2 * kenarBosluk - (maxX - minX) * olcek) / 2;
  const kaydirY = kenarBosluk + (yukseklik - 2 * kenarBosluk - (maxY - minY) * olcek) / 2;
  const donustur = ([x, y]) => [(x - minX) * olcek + kaydirX, (y - minY) * olcek + kaydirY];
  const d = (dizi) => dizi.map(donustur).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const cizgi = (p1, p2) => {
    const [x1, y1] = donustur(p1); const [x2, y2] = donustur(p2);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="kenar"/>`;
  };

  const [mx, my] = donustur(proj(L / 2, H * 0.78, W / 2));
  const [skx, sky] = donustur(kaynakNokta);
  const olculer = olcuEtiketleri(K, { L, W, H }, donustur, proj(L / 2, H / 2, W / 2));

  return `
<svg viewBox="0 0 ${genislik} ${yukseklik}" xmlns="http://www.w3.org/2000/svg" class="oda-svg" role="img"
     aria-label="Cephe duvarlarını, doğramaları ve dış ortam ses kaynağını gösteren izometrik mahal şeması">
  <style>${ortakBicem()}
    .oda-svg .dis-duvar { fill: var(--vurgu, #0f766e); fill-opacity: .42; stroke: var(--vurgu-2, #0b5d57); stroke-width: 1.75; }
    .oda-svg .dograma { fill: #7fc3e8; fill-opacity: .92; stroke: #1d6c95; stroke-width: 1.2; }
    .oda-svg .dograma-etiket { font: 600 9px sans-serif; fill: #0f4763; }
    .oda-svg .kaynak-yonu { stroke: #e0483c; stroke-width: 1.4; stroke-dasharray: 5 4; opacity: .75; }
  </style>

  <polygon class="kutu-yuz" points="${d([K.aAa, K.AAa, K.AAZ, K.aAZ])}"/>
  <polygon class="kutu-yuz" points="${d([K.aaZ, K.AaZ, K.AAZ, K.aAZ])}"/>
  ${yanYuzeyler.map((y) => `<polygon class="yan-yuz" points="${d(y.koseler)}"><title>${kacis(y.ad)} — Df yan yol yüzeyi</title></polygon>`).join('\n  ')}
  ${kenarlar.map(([p1, p2]) => cizgi(p1, p2)).join('\n  ')}

  <polygon class="dis-duvar" points="${d(D1)}"><title>D1 — dış duvar (L × H = ${L.toFixed(2)} × ${H.toFixed(2)} m)</title></polygon>
  ${kose ? `<polygon class="dis-duvar" points="${d(D2)}"><title>D2 — dış duvar (W × H = ${W.toFixed(2)} × ${H.toFixed(2)} m)</title></polygon>` : ''}

  ${dogramaYuzleri.map((f) => `<polygon class="dograma" points="${d(f.koseler)}"><title>${kacis(f.ad)} — D${f.duvarNo} · ${f.en.toFixed(2)} × ${f.boy.toFixed(2)} m</title></polygon>`).join('\n  ')}

  ${(() => { const [hx, hy] = donustur(kaynakHedef);
      return `<line class="kaynak-yonu" x1="${skx.toFixed(1)}" y1="${sky.toFixed(1)}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}"/>`; })()}
  ${sesKaynagiSimgesi(skx, sky, 1.1, 'Çevresel gürültü kaynağı (Lgag) — dış ortam')}

  ${olculer}
  <text x="${mx.toFixed(1)}" y="${(my - 6).toFixed(1)}" class="oda-metin" text-anchor="middle">${kacis(mekanAdi)}</text>
  <text x="14" y="${yukseklik - 12}" class="aciklama">■ Dış duvar${kose ? ' (D1 + D2)' : ' (D1)'}</text>
  <text x="150" y="${yukseklik - 12}" class="aciklama" style="fill:#1d6c95">■ Pencere / kapı</text>
  <text x="272" y="${yukseklik - 12}" class="aciklama" style="fill:#a9791f">■ İç yüzeyler (Df)</text>
  <text x="404" y="${yukseklik - 12}" class="aciklama" style="fill:#c8362a">◉ Dış gürültü kaynağı</text>
</svg>`.trim();
}
