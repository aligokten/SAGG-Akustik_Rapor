/** ortak.js — Arayüz yardımcıları. */

/** Basit HTML kaçışı. */
export function kacis(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Sayıyı Türkçe biçimde ve verilen basamakla yazar. */
export function sayi(x, basamak = 1) {
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('tr-TR', {
    minimumFractionDigits: basamak, maximumFractionDigits: basamak,
  });
}

/** Sekme/DOM seçici kısayolları. */
export const $ = (sec, kok = document) => kok.querySelector(sec);
export const $$ = (sec, kok = document) => Array.from(kok.querySelectorAll(sec));

/** Benzersiz kimlik. */
let sayac = 0;
export function yeniId(onek = 'k') {
  sayac += 1;
  return `${onek}${Date.now().toString(36)}${sayac}`;
}

/** <option> listesi üretir. */
export function secenekler(liste, seciliId, { deger = 'id', etiket = 'ad', gruplu = false } = {}) {
  if (!gruplu) {
    return liste.map((o) =>
      `<option value="${kacis(o[deger])}"${o[deger] === seciliId ? ' selected' : ''}>${kacis(o[etiket])}</option>`
    ).join('');
  }
  const gruplar = new Map();
  for (const o of liste) {
    const g = o.grup || 'Diğer';
    if (!gruplar.has(g)) gruplar.set(g, []);
    gruplar.get(g).push(o);
  }
  return Array.from(gruplar.entries()).map(([g, ogeler]) =>
    `<optgroup label="${kacis(g)}">` +
    ogeler.map((o) =>
      `<option value="${kacis(o[deger])}"${o[deger] === seciliId ? ' selected' : ''}>${kacis(o[etiket])}</option>`
    ).join('') +
    '</optgroup>'
  ).join('');
}

/** Uygun/uygun değil rozeti. */
export function uygunlukRozeti(degerlendirme) {
  if (!degerlendirme || !Number.isFinite(degerlendirme.gereken)) {
    return '<span class="rozet notr">değerlendirilemedi</span>';
  }
  return degerlendirme.uygun
    ? '<span class="rozet uygun">Sağlanıyor</span>'
    : '<span class="rozet uygunsuz">Sağlanmıyor</span>';
}

/** Akustik performans sınıfı rozeti. `boyut` = 'buyuk' daha iri gösterir. */
export function sinifRozeti(sinif, boyut = '') {
  const metin = sinif || '—';
  const renk = sinif ? `sinif-${sinif}` : 'sinif-yok';
  return `<span class="sinif-rozeti ${renk}${boyut === 'buyuk' ? ' buyuk' : ''}" title="Akustik performans sınıfı">${kacis(metin)}</span>`;
}

/**
 * Halka (donut) gösterge — ortasında büyük bir sayı taşır.
 *
 * @param {number} oran   0–100 arası doluluk yüzdesi.
 * @param {object} opts   `buyuk` (ortadaki sayı), `kucuk` (alt etiket),
 *                        `renk` ('iyi' | 'kotu' | ''), `capMm` (piksel çap).
 */
export function halka(oran, { buyuk = '', kucuk = '', renk = '', cap = 132 } = {}) {
  const guvenliOran = Math.max(0, Math.min(100, Number(oran) || 0));
  const kalinlik = Math.max(7, Math.round(cap * 0.085));
  const yaricap = (cap - kalinlik) / 2;
  const cevre = 2 * Math.PI * yaricap;
  const bosluk = cevre * (1 - guvenliOran / 100);

  return `<div class="halka ${kacis(renk)}" style="width:${cap}px;height:${cap}px">
    <svg width="${cap}" height="${cap}" viewBox="0 0 ${cap} ${cap}" aria-hidden="true">
      <circle class="iz" cx="${cap / 2}" cy="${cap / 2}" r="${yaricap}" fill="none" stroke-width="${kalinlik}"/>
      <circle class="yay" cx="${cap / 2}" cy="${cap / 2}" r="${yaricap}" fill="none" stroke-width="${kalinlik}"
              stroke-dasharray="${cevre.toFixed(2)}" stroke-dashoffset="${bosluk.toFixed(2)}"/>
    </svg>
    <div class="orta">
      <div>
        <div class="buyuk">${kacis(buyuk)}</div>
        ${kucuk ? `<div class="kucuk">${kacis(kucuk)}</div>` : ''}
      </div>
    </div>
  </div>`;
}

/**
 * Dikey çubuk grafik — her bileşenin gereksinime göre marjını gösterir.
 *
 * Sıfır çizgisi ortadadır: pozitif marj (gereksinimi aşan) yukarı, negatif
 * marj (açık veren) aşağı çizilir; böylece referans arayüzdeki haftalık
 * etkinlik grafiğiyle aynı okuma biçimi elde edilir.
 *
 * SVG yerine CSS/flex ile kurulur: viewBox ölçeklendiği için SVG metinleri
 * kart genişliğine göre büyüyüp küçülürdü; HTML çubuklarda yazı puntosu
 * kart genişliğinden bağımsız kalır.
 *
 * @param {Array<{ad:string, deger:number}>} veriler
 */
export function marjGrafigi(veriler, { birim = 'dB' } = {}) {
  if (!veriler.length) return '';

  // Ölçek: en büyük mutlak marj tepeyi doldurur; çok küçük değerlerde
  // çubukların tümü ezilmesin diye alt sınır konur.
  const enBuyuk = Math.max(3, ...veriler.map((v) => Math.abs(Number(v.deger)) || 0));

  const sutunlar = veriler.map((v) => {
    const gecerli = Number.isFinite(v.deger);
    const deger = gecerli ? v.deger : 0;
    // Tepe %80'de tutulur: kalan pay, çubuğun dışına yazılan değer etiketine
    // yer bırakır (aksi hâlde etiket bileşen adının üstüne biner).
    // Sıfır marj da görünür bir iz bıraksın diye en az %3 yükseklik verilir.
    const oran = gecerli ? Math.max(3, (Math.abs(deger) / enBuyuk) * 80) : 3;
    const sinif = !gecerli ? 'sonuk' : (deger >= 0 ? 'iyi' : 'kotu');
    const etiketMetni = gecerli ? `${deger >= 0 ? '+' : ''}${sayi(deger, 0)}` : '—';
    const pozitif = gecerli && deger >= 0;

    return `<div class="mg-sutun" title="${kacis(v.ad)}: ${etiketMetni} ${kacis(birim)}">
      <div class="mg-ust">
        ${pozitif ? `<span class="mg-deger">${kacis(etiketMetni)}</span>
                     <i class="mg-bar ${sinif}" style="height:${oran.toFixed(1)}%"></i>` : ''}
      </div>
      <div class="mg-alt">
        ${!pozitif ? `<i class="mg-bar ${sinif}" style="height:${oran.toFixed(1)}%"></i>
                      <span class="mg-deger">${kacis(etiketMetni)}</span>` : ''}
      </div>
      <div class="mg-ad">${kacis(v.ad)}</div>
    </div>`;
  }).join('');

  return `<div class="marj-grafik" role="img"
               aria-label="Bileşenlerin gereksinime göre marjı (${kacis(birim)})">${sutunlar}</div>`;
}

/** Sonuç şeridinde bir hücre. */
export function olcut(etiket, deger, birim = '', oneCikan = false) {
  return `<div class="hucre${oneCikan ? ' one-cikan' : ''}">
    <span class="etiket">${kacis(etiket)}</span>
    <span class="deger">${kacis(deger)}${birim ? ` <small>${kacis(birim)}</small>` : ''}</span>
  </div>`;
}

/** Alan (input) üretici. */
export function alan({ etiket, ad, tip = 'text', deger = '', ipucu = '', ekAttr = '' }) {
  return `<div class="alan">
    <label for="${kacis(ad)}">${kacis(etiket)}</label>
    <input id="${kacis(ad)}" name="${kacis(ad)}" type="${tip}" value="${kacis(deger)}" ${ekAttr}>
    ${ipucu ? `<span class="ipucu">${kacis(ipucu)}</span>` : ''}
  </div>`;
}

/** Seçim (select) alanı üretici. */
export function secimAlani({ etiket, ad, liste, secili, ipucu = '', gruplu = false, ekAttr = '' }) {
  return `<div class="alan">
    <label for="${kacis(ad)}">${kacis(etiket)}</label>
    <select id="${kacis(ad)}" name="${kacis(ad)}" ${ekAttr}>${secenekler(liste, secili, { gruplu })}</select>
    ${ipucu ? `<span class="ipucu">${kacis(ipucu)}</span>` : ''}
  </div>`;
}

/**
 * Arama/filtre metnini normalleştirir.
 *
 * Türkçede `"IPB".toLocaleLowerCase('tr')` → `"ıpb"` olduğundan, kullanıcının
 * yazdığı "ipb" ile ürün adındaki "IPB" eşleşmez. Bu nedenle küçük harfe
 * çevirmek yetmez; Türkçeye özgü harfler ASCII karşılıklarına katlanır.
 * Yan fayda olarak arama, aksan duyarsız hâle gelir ("gorultu" → "gürültü").
 */
const HARF_KATLAMA = {
  'ı': 'i', 'İ': 'i', 'I': 'i', 'i': 'i',
  'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
  'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c',
  'â': 'a', 'Â': 'a', 'î': 'i', 'Î': 'i', 'û': 'u', 'Û': 'u',
};

export function aramaMetni(metin) {
  return String(metin ?? '')
    .replace(/[ıİIişŞğĞüÜöÖçÇâÂîÎûÛ]/g, (c) => HARF_KATLAMA[c] || c)
    .toLowerCase();
}

/** Sayısal girdiyi güvenle okur. */
export function sayiOku(deger, varsayilan = 0) {
  const s = String(deger).replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : varsayilan;
}
