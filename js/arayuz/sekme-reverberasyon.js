/**
 * sekme-reverberasyon.js — Mekân içi reverberasyon süresi hesabı ve
 * EK-5 gereksinimleriyle karşılaştırma.
 */

import { kacis, sayi, secenekler, uygunlukRozeti } from './ortak.js';
import { SOGURUCULAR, NESNELER } from '../veri/malzemeler.js';
import { EK5_REVERBERASYON } from '../veri/yonetmelik.js';
import { gerekliIlaveSogurma } from '../cekirdek/reverberasyon.js';
import { OKTAV_BANTLARI } from '../cekirdek/temel.js';
import { mekanSecenekleri } from './sekme-ayirici.js';

export function ciz(durum, sonuclar) {
  const kayitlar = durum.hacimler;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Tanımlı hacimler <span class="rozet notr yalin">${kayitlar.length}</span></h3>
      <button class="dugme" data-eylem="ekle-hacim">+ Hacim ekle</button>
    </div>
    <div class="bilgi-kutu">
      Sabine bağıntısı: <b>T = 0,161·V / (Σ Sᵢ·αᵢ + Σ Aₙ + 4·m·V)</b>.
      Değerlendirme, 500–1000–2000 Hz ortalaması üzerinden <b>EK-5</b> gereksinimleriyle yapılır.
      Hava soğurması hesaba dahildir.
    </div>
    ${kayitlar.length === 0
      ? '<div class="bos-durum">Henüz hacim tanımlanmadı.</div>'
      : kayitlar.map((h, i) => kart(h, i, sonuclar.hacimler[i])).join('')}
  </section>`;
}

function kart(k, i, h) {
  const y = `hacimler.${i}`;
  const d = h.degerlendirme;
  const s = h.sonuc;
  const Aorta = [500, 1000, 2000].reduce((a, f) => a + s.A[f], 0) / 3;
  const ilave = d?.Tmax ? gerekliIlaveSogurma(k.V, Aorta, d.Tmax) : 0;

  return `
  <section class="kart">
    <div class="kart-baslik">
      <div style="flex:1"><input data-yol="${y}.ad" value="${kacis(k.ad)}" class="baslik-girdi"></div>
      <div class="satir-eylem">
        <button class="dugme acik kucuk" data-eylem="kopyala-hacim" data-idx="${i}">Kopyala</button>
        <button class="dugme acik kucuk" data-eylem="sil-hacim" data-idx="${i}">Sil</button>
      </div>
    </div>

    <div class="izgara">
      <div class="alan"><label>Mekân türü (EK-5 gereksinimi için)</label>
        <select data-yol="${y}.mekanId">
          ${secenekler(EK5_REVERBERASYON.mekanlar, k.mekanId)}
        </select>
        ${d ? `<span class="ipucu">İzin verilen: ${d.Tmin != null ? `${sayi(d.Tmin, 2)} – ` : '≤ '}${d.Tmax != null ? sayi(d.Tmax, 2) : '—'} s</span>`
             : '<span class="ipucu" style="color:var(--uyari)">Bu mekân için EK-5\'te gereksinim tanımlı değil.</span>'}</div>
      <div class="alan"><label>Hacim V (m³)</label>
        <input type="number" step="1" min="1" data-yol="${y}.V" data-tur="sayi" value="${k.V}"></div>
    </div>

    <h3 style="margin-top:18px">Yüzeyler</h3>
    <div class="tablo-sar"><table>
      <thead><tr><th>Yüzey / kaplama</th><th class="sayi">Alan (m²)</th>
        ${OKTAV_BANTLARI.map((f) => `<th class="sayi">α ${f}</th>`).join('')}<th></th></tr></thead>
      <tbody>
      ${(k.yuzeyler || []).map((yu, j) => {
        const hy = h.yuzeyler[j];
        return `<tr>
          <td><select data-yol="${y}.yuzeyler.${j}.sogurucuId" style="min-width:250px">${secenekler(SOGURUCULAR, yu.sogurucuId, { gruplu: true })}</select></td>
          <td><input type="number" step="1" min="0" data-yol="${y}.yuzeyler.${j}.alan" data-tur="sayi" value="${yu.alan}" style="width:90px"></td>
          ${OKTAV_BANTLARI.map((f) => `<td class="sayi">${sayi(hy.alfa[f] ?? 0, 2)}</td>`).join('')}
          <td><button class="dugme acik kucuk" data-eylem="sil-yuzey" data-idx="${i}" data-alt="${j}">Sil</button></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>
    <button class="dugme acik kucuk" data-eylem="ekle-yuzey" data-idx="${i}">+ Yüzey ekle</button>

    <h3 style="margin-top:18px">Nesneler ve kullanıcılar</h3>
    <div class="tablo-sar"><table>
      <thead><tr><th>Nesne</th><th class="sayi">Adet</th>${OKTAV_BANTLARI.map((f) => `<th class="sayi">A ${f}</th>`).join('')}<th></th></tr></thead>
      <tbody>
      ${(k.nesneler || []).length === 0
        ? `<tr><td colspan="${OKTAV_BANTLARI.length + 3}" class="soluk">Nesne tanımlanmadı.</td></tr>`
        : k.nesneler.map((n, j) => {
            const hn = h.nesneler[j];
            return `<tr>
              <td><select data-yol="${y}.nesneler.${j}.nesneId" style="min-width:230px">${secenekler(NESNELER, n.nesneId)}</select></td>
              <td><input type="number" step="1" min="0" data-yol="${y}.nesneler.${j}.adet" data-tur="sayi" value="${n.adet}" style="width:80px"></td>
              ${OKTAV_BANTLARI.map((f) => `<td class="sayi">${sayi(hn.A[f] ?? 0, 2)}</td>`).join('')}
              <td><button class="dugme acik kucuk" data-eylem="sil-nesne" data-idx="${i}" data-alt="${j}">Sil</button></td>
            </tr>`;
          }).join('')}
      </tbody>
    </table></div>
    <button class="dugme acik kucuk" data-eylem="ekle-nesne" data-idx="${i}">+ Nesne ekle</button>

    <h3 style="margin-top:18px">Sonuç</h3>
    <div class="tablo-sar"><table>
      <thead><tr><th>Frekans (Hz)</th>${OKTAV_BANTLARI.map((f) => `<th class="sayi">${f}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td>Soğurma alanı A (m² Sabine)</td>${OKTAV_BANTLARI.map((f) => `<td class="sayi">${sayi(s.A[f])}</td>`).join('')}</tr>
        <tr><td>Reverberasyon süresi T (s)</td>${OKTAV_BANTLARI.map((f) => `<td class="sayi">${sayi(s.T[f], 2)}</td>`).join('')}</tr>
      </tbody>
    </table></div>

    <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
      <div class="hucre one-cikan"><span class="etiket">T (500–2000 Hz ort.)</span><span class="deger">${sayi(s.Torta, 2)} <small>s</small></span></div>
      <div class="hucre"><span class="etiket">İzin verilen en çok</span><span class="deger">${d?.Tmax != null ? sayi(d.Tmax, 2) : '—'} <small>s</small></span></div>
      <div class="hucre"><span class="etiket">Sonuç</span><span>${uygunlukRozeti(d ? { ...d, gereken: d.Tmax ?? NaN } : null)}</span></div>
      ${ilave > 0 ? `<div class="hucre"><span class="etiket">Gereken ilave soğurma</span><span class="deger">${sayi(ilave)} <small>m² Sabine</small></span></div>` : ''}
    </div>
    ${d ? `<p class="soluk" style="font-size:12px">Kaynak: ${kacis(d.kaynak)} — ${kacis(d.dogrulama)}</p>` : ''}
  </section>`;
}
