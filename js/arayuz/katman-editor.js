/**
 * katman-editor.js — Çok katmanlı (kullanıcı tanımlı) duvar/döşeme
 * yapılarını düzenleyen paylaşılan bileşen. Ayırıcı elemanlar, yan
 * elemanlar ve döşemeler tarafından ortak kullanılır.
 *
 * Her katmanın adı, kalınlığı ve yoğunluğu serbestçe girilir; "hazır
 * malzeme" seçimi yalnızca bu alanları hızlıca doldurmak için bir
 * kısayoldur — katı bir referans değildir, seçildikten sonra değerler
 * dilendiği gibi değiştirilebilir. Bir katman satırının türü (masif/sıva/
 * boşluk) sabittir; değiştirmek için satır silinip yeniden eklenir.
 */

import { kacis, sayi } from './ortak.js';
import { KATMAN_ON_AYARLARI, YALITIM_LEVHALARI } from '../veri/malzemeler.js';

const TUR_ADLARI = { masif: 'Masif tabaka', siva: 'Sıva', bosluk: 'Boşluk / dolgu' };
const TUR_RENKLERI = { masif: '#8a94a3', siva: '#d8c9a8', bosluk: '#5fb8ad' };

/**
 * Katman düzenleyiciyi çizer.
 *
 * @param {string} yolTabani  Bu katman listesinin durum içindeki yolu
 *   (ör. "ayiricilar.0" veya "ayiricilar.0.yanElemanlar.2" veya "darbeler.1")
 * @param {Object[]} katmanlar
 * @param {Object} [opts]
 * @param {Object} [opts.katmanDetay]   hesap.js'ten dönen katmanliElemaniCoz sonucu (canlı özet için)
 */
export function katmanEditoru(yolTabani, katmanlar, opts = {}) {
  const { katmanDetay = null } = opts;
  const detaylar = katmanDetay?.katmanDetaylari || [];

  return `
  <div class="katman-editor">
    ${katmanSeridi(katmanlar, detaylar)}
    <div class="tablo-sar"><table>
      <thead><tr>
        <th style="width:26px"></th><th>Tür</th><th>Malzeme adı</th>
        <th class="sayi">Kalınlık (mm)</th><th class="sayi">Yoğunluk (kg/m³)</th>
        <th class="sayi">m′ (kg/m²)</th><th></th>
      </tr></thead>
      <tbody>
        ${katmanlar.length === 0
          ? '<tr><td colspan="7" class="soluk" style="text-align:center;padding:14px">Henüz katman eklenmedi.</td></tr>'
          : katmanlar.map((k, idx) => katmanSatiri(yolTabani, k, idx, katmanlar.length, detaylar[idx])).join('')}
      </tbody>
    </table></div>

    <div class="satir-eylem">
      <button class="dugme acik kucuk" data-eylem="katman-ekle" data-yol-tabani="${kacis(yolTabani)}" data-tur="masif">+ Masif tabaka</button>
      <button class="dugme acik kucuk" data-eylem="katman-ekle" data-yol-tabani="${kacis(yolTabani)}" data-tur="siva">+ Sıva</button>
      <button class="dugme acik kucuk" data-eylem="katman-ekle" data-yol-tabani="${kacis(yolTabani)}" data-tur="bosluk">+ Boşluk / dolgu</button>
    </div>

    ${katmanOzeti(katmanDetay)}
  </div>`;
}

/** Katman kalınlıklarını orantılı, renkli bir şerit olarak gösterir. */
function katmanSeridi(katmanlar, detaylar) {
  if (!katmanlar.length) return '';
  const toplamKalinlik = katmanlar.reduce((t, k) => t + (Number(k.kalinlik) || 0), 0);
  if (!(toplamKalinlik > 0)) return '';
  return `
  <div class="katman-seridi">
    ${katmanlar.map((k, i) => {
      const kalinlik = Number(k.kalinlik) || 0;
      const yuzde = (kalinlik / toplamKalinlik) * 100;
      const etiket = k.tur === 'bosluk' ? 'BOŞLUK' : (k.ad || TUR_ADLARI[k.tur] || '').toLocaleUpperCase('tr');
      return `<div class="katman-seridi-parca" style="width:${yuzde}%;background:${TUR_RENKLERI[k.tur] || '#ccc'}${k.tur === 'bosluk' ? ';background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 4px,transparent 4px 8px)' : ''}"
            title="${kacis(etiket)} — ${sayi(kalinlik, 0)} mm">
        <span>${sayi(kalinlik, kalinlik < 10 ? 1 : 0)} mm</span>
      </div>`;
    }).join('')}
  </div>`;
}

function katmanSatiri(yolTabani, k, idx, toplam, detay) {
  const y = `${yolTabani}.katmanlar.${idx}`;

  let hucreler;
  if (k.tur === 'bosluk') {
    hucreler = `
      <td colspan="2">
        <select data-yol="${y}.dolguId" style="min-width:220px">${dolguSecenekleri(k.dolguId)}</select>
      </td>
      <td><input type="number" step="5" min="5" data-yol="${y}.kalinlik" data-tur="sayi" value="${k.kalinlik}" style="width:90px"></td>
      <td class="soluk">—</td>`;
  } else {
    hucreler = `
      <td>
        <select data-onayar="${kacis(y)}" style="min-width:170px">
          <option value="">— hazır malzeme seç —</option>
          ${onAyarSecenekleri()}
        </select>
      </td>
      <td><input data-yol="${y}.ad" value="${kacis(k.ad || '')}" placeholder="malzeme adı" style="min-width:170px"></td>
      <td><input type="number" step="1" min="1" data-yol="${y}.kalinlik" data-tur="sayi" value="${k.kalinlik}" style="width:80px"></td>
      <td><input type="number" step="10" min="1" data-yol="${y}.yogunluk" data-tur="sayi" value="${k.yogunluk}" style="width:90px"></td>`;
  }

  return `<tr>
    <td>
      <div style="display:flex;flex-direction:column;gap:2px">
        <button class="dugme acik kucuk" data-eylem="katman-yukari" data-yol-tabani="${kacis(yolTabani)}" data-katman-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Yukarı taşı" style="padding:2px 6px">▲</button>
        <button class="dugme acik kucuk" data-eylem="katman-asagi" data-yol-tabani="${kacis(yolTabani)}" data-katman-idx="${idx}" ${idx === toplam - 1 ? 'disabled' : ''} title="Aşağı taşı" style="padding:2px 6px">▼</button>
      </div>
    </td>
    <td><span class="rozet notr yalin">${kacis(TUR_ADLARI[k.tur] || k.tur)}</span></td>
    ${hucreler}
    <td class="sayi">${detay ? sayi(detay.mAlan, 1) : '—'}</td>
    <td><button class="dugme acik kucuk" data-eylem="katman-sil" data-yol-tabani="${kacis(yolTabani)}" data-katman-idx="${idx}">Sil</button></td>
  </tr>`;
}

function onAyarSecenekleri() {
  const gruplar = new Map();
  for (const o of KATMAN_ON_AYARLARI) {
    if (!gruplar.has(o.grup)) gruplar.set(o.grup, []);
    gruplar.get(o.grup).push(o);
  }
  return Array.from(gruplar.entries()).map(([grup, liste]) =>
    `<optgroup label="${kacis(grup)}">${liste.map((o) =>
      `<option value="${kacis(o.ad)}" data-yogunluk="${o.yogunluk}">${kacis(o.ad)} (${sayi(o.yogunluk, o.yogunluk < 100 ? 1 : 0)} kg/m³)</option>`).join('')}</optgroup>`
  ).join('');
}

function dolguSecenekleri(secili) {
  return YALITIM_LEVHALARI.map((y) =>
    `<option value="${kacis(y.id)}"${y.id === secili ? ' selected' : ''}>${kacis(y.ad)}</option>`).join('');
}

function katmanOzeti(katmanDetay) {
  if (!katmanDetay) return '';
  if (katmanDetay.tur === 'tekKabuk') {
    return `
    <div class="bilgi-kutu">
      <b>Tek kabuk</b> (boşluk katmanı yok — tüm katmanlar bağlı kabul edilir, kütle kanunu ile hesaplanır)
      · Toplam kalınlık = <b>${sayi(katmanDetay.kalinlikToplam, 0)} mm</b>
      · Toplam m′ = <b>${sayi(katmanDetay.mAlan, 1)} kg/m²</b>
      · Kestirilen Rw = <b>${sayi(katmanDetay.Rw, 1)} dB</b>
      ${katmanDetay.fazlaBoslukUyarisi ? '<br><span style="color:var(--uyari)">Birden fazla boşluk katmanı algılandı; yalnızca ilki hesaba katıldı, geri kalanı bağlı kabul edildi.</span>' : ''}
    </div>`;
  }
  const renk = { iyi: 'var(--basari)', orta: 'var(--uyari)', kotu: 'var(--hata)' }[katmanDetay.f0Yorum?.seviye] || 'var(--soluk)';
  return `
  <div class="bilgi-kutu">
    <b>İki kabuklu sistem</b> (boşluk katmanı gerçek bir hava aralığı olarak değerlendirildi) —
    kabuk 1 m′ = <b>${sayi(katmanDetay.mA, 1)}</b>, kabuk 2 m′ = <b>${sayi(katmanDetay.mB, 1)}</b> kg/m²
    · Toplam kalınlık = <b>${sayi(katmanDetay.kalinlikToplam, 0)} mm</b>
    · Toplam m′ = <b>${sayi(katmanDetay.mAlan, 1)} kg/m²</b><br>
    Taban Rw (kütle kanunu) = ${sayi(katmanDetay.RwTaban, 1)} dB, kavite bonusu
    <b style="color:${renk}">+${sayi(katmanDetay.dRKavite, 1)} dB</b>
    (f₀ = ${sayi(katmanDetay.f0, 0)} Hz — ${kacis(katmanDetay.f0Yorum?.metin || '')})
    → Kestirilen Rw = <b>${sayi(katmanDetay.Rw, 1)} dB</b><br>
    <small class="soluk">Bu, rijit köprüleme bulunmayan, düzgün ayrılmış boşluklar için yaklaşık bir mühendislik
    kestirimidir; kritik tasarımlarda ölçüm veya üretici beyan verisi kullanılmalıdır.</small>
    ${katmanDetay.fazlaBoslukUyarisi ? '<br><span style="color:var(--uyari)">Birden fazla boşluk katmanı algılandı; yalnızca ilki iki kabuk ayrımı için kullanıldı.</span>' : ''}
  </div>`;
}
