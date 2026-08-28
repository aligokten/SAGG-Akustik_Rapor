/**
 * katman-editor.js — Çok katmanlı (kullanıcı tanımlı) duvar/döşeme
 * yapılarını düzenleyen paylaşılan bileşen. Ayırıcı elemanlar, yan
 * elemanlar ve döşemeler tarafından ortak kullanılır.
 *
 * Bir katman satırının türü sabittir (masif/sıva/boşluk); değiştirmek
 * için satır silinip yeniden eklenir — bu, tür değişince geçersiz kalacak
 * alanların (malzemeId ↔ sivaId ↔ kalinlik/dolguId) karışmasını önler.
 */

import { kacis, sayi, secenekler } from './ortak.js';
import { DUVARLAR, DOSEMELER, SIVALAR, YALITIM_LEVHALARI } from '../veri/malzemeler.js';

const TUR_ADLARI = { masif: 'Masif tabaka', siva: 'Sıva', bosluk: 'Boşluk / dolgu' };

/**
 * Katman düzenleyiciyi çizer.
 *
 * @param {string} yolTabani  Bu katman listesinin durum içindeki yolu
 *   (ör. "ayiricilar.0" veya "ayiricilar.0.yanElemanlar.2" veya "darbeler.1")
 * @param {Object[]} katmanlar
 * @param {Object} [opts]
 * @param {'duvar'|'doseme'} [opts.tur] Masif malzeme listesi kaynağı
 * @param {Object} [opts.katmanDetay]   hesap.js'ten dönen katmanliElemaniCoz sonucu (canlı özet için)
 */
export function katmanEditoru(yolTabani, katmanlar, opts = {}) {
  const { tur = 'duvar', katmanDetay = null } = opts;
  const malzemeListesi = tur === 'doseme' ? DOSEMELER : DUVARLAR;
  const detaylar = katmanDetay?.katmanDetaylari || [];

  return `
  <div class="katman-editor">
    <div class="tablo-sar"><table>
      <thead><tr>
        <th style="width:26px"></th><th>Tür</th><th>Malzeme / özellik</th>
        <th class="sayi">m′ (kg/m²)</th><th></th>
      </tr></thead>
      <tbody>
        ${katmanlar.length === 0
          ? '<tr><td colspan="5" class="soluk" style="text-align:center;padding:14px">Henüz katman eklenmedi.</td></tr>'
          : katmanlar.map((k, idx) => katmanSatiri(yolTabani, k, idx, katmanlar.length, malzemeListesi, detaylar[idx])).join('')}
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

function katmanSatiri(yolTabani, k, idx, toplam, malzemeListesi, detay) {
  const y = `${yolTabani}.katmanlar.${idx}`;
  let hucre;
  if (k.tur === 'masif') {
    hucre = `<div class="izgara dar" style="gap:8px">
      <select data-yol="${y}.malzemeId" style="min-width:220px">
        <option value="">— malzeme seçin —</option>
        ${secenekler(malzemeListesi, k.malzemeId, { gruplu: true })}
      </select>
      <input type="number" step="10" min="50" data-yol="${y}.yogunlukBeyan" data-tur="sayiVeyaNull"
             value="${k.yogunlukBeyan ?? ''}" placeholder="beyan yoğunluk (kg/m³)" style="width:170px">
    </div>`;
  } else if (k.tur === 'siva') {
    hucre = `<select data-yol="${y}.sivaId" style="min-width:200px">${secenekler(SIVALAR, k.sivaId)}</select>`;
  } else {
    hucre = `<div class="izgara dar" style="gap:8px">
      <input type="number" step="5" min="5" data-yol="${y}.kalinlik" data-tur="sayi" value="${k.kalinlik}" style="width:110px" placeholder="kalınlık (mm)">
      <select data-yol="${y}.dolguId" style="min-width:210px">${secenekler(YALITIM_LEVHALARI, k.dolguId, { gruplu: true })}</select>
    </div>`;
  }

  return `<tr>
    <td>
      <div style="display:flex;flex-direction:column;gap:2px">
        <button class="dugme acik kucuk" data-eylem="katman-yukari" data-yol-tabani="${kacis(yolTabani)}" data-katman-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Yukarı taşı" style="padding:2px 6px">▲</button>
        <button class="dugme acik kucuk" data-eylem="katman-asagi" data-yol-tabani="${kacis(yolTabani)}" data-katman-idx="${idx}" ${idx === toplam - 1 ? 'disabled' : ''} title="Aşağı taşı" style="padding:2px 6px">▼</button>
      </div>
    </td>
    <td><span class="rozet notr yalin">${kacis(TUR_ADLARI[k.tur] || k.tur)}</span></td>
    <td>${hucre}</td>
    <td class="sayi">${detay ? sayi(detay.mAlan, 1) : '—'}</td>
    <td><button class="dugme acik kucuk" data-eylem="katman-sil" data-yol-tabani="${kacis(yolTabani)}" data-katman-idx="${idx}">Sil</button></td>
  </tr>`;
}

function katmanOzeti(katmanDetay) {
  if (!katmanDetay) return '';
  if (katmanDetay.tur === 'tekKabuk') {
    return `
    <div class="bilgi-kutu">
      <b>Tek kabuk</b> (boşluk katmanı yok — kütle kanunu ile hesaplanır)
      · Toplam m′ = <b>${sayi(katmanDetay.mAlan, 1)} kg/m²</b>
      · Kestirilen Rw = <b>${sayi(katmanDetay.Rw, 1)} dB</b>
      ${katmanDetay.fazlaBoslukUyarisi ? '<br><span style="color:var(--uyari)">Birden fazla boşluk katmanı algılandı; yalnızca ilki hesaba katıldı, geri kalanı sıva/masif gibi bağlı kabul edildi.</span>' : ''}
    </div>`;
  }
  const renk = { iyi: 'var(--basari)', orta: 'var(--uyari)', kotu: 'var(--hata)' }[katmanDetay.f0Yorum?.seviye] || 'var(--soluk)';
  return `
  <div class="bilgi-kutu">
    <b>İki kabuklu sistem</b> (boşluk kütleyi ayırıyor) —
    kabuk 1 m′ = <b>${sayi(katmanDetay.mA, 1)}</b>, kabuk 2 m′ = <b>${sayi(katmanDetay.mB, 1)}</b> kg/m²
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
