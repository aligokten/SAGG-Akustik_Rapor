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

/** Akustik performans sınıfı rozeti. */
export function sinifRozeti(sinif) {
  const s = sinif || '—';
  const sinif_ = sinif ? `sinif-${sinif}` : 'sinif-yok';
  return `<span class="sinif-rozeti ${sinif_}" title="Akustik performans sınıfı">${kacis(s)}</span>`;
}

/** Bir ölçüt kutucuğu. */
export function olcut(etiket, deger, birim = '') {
  return `<div class="olcut">
    <span class="etiket">${kacis(etiket)}</span>
    <span class="buyuk-deger">${kacis(deger)}${birim ? ` <small>${kacis(birim)}</small>` : ''}</span>
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

/** Sayısal girdiyi güvenle okur. */
export function sayiOku(deger, varsayilan = 0) {
  const s = String(deger).replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : varsayilan;
}
