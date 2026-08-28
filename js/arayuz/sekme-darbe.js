/**
 * sekme-darbe.js — Döşemelerde darbe sesi yalıtımı (TS EN 12354-2) ve
 * EK-3 Tablo 3.3 değerlendirmesi.
 */

import { kacis, sayi, secenekler, uygunlukRozeti, sinifRozeti } from './ortak.js';
import { DOSEMELER, SAP_KAPLAMALAR } from '../veri/malzemeler.js';
import { GURULTULULUK_DERECELERI, HASSASIYET_DERECELERI } from '../veri/yonetmelik.js';
import { mekanSecenekleri } from './sekme-ayirici.js';
import { katmanEditoru } from './katman-editor.js';

export function ciz(durum, sonuclar) {
  const kayitlar = durum.darbeler;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Tanımlı döşemeler <span class="rozet notr yalin">${kayitlar.length}</span></h3>
      <button class="dugme" data-eylem="ekle-darbe">+ Döşeme ekle</button>
    </div>
    <div class="bilgi-kutu">
      TS EN 12354-2 basitleştirilmiş modeli: <b>L′n,w = Ln,w,eq − ΔLw + K</b>. Çıplak döşemenin
      Ln,w,eq değeri alan kütlesinden (164 − 35·lg m′) kestirilir, yüzer şap/şiltenin ΔLw'si düşülür,
      yan yol düzeltmesi K eklenir. Sonuç <b>L′nT,w = L′n,w − 10·lg(0,032·V)</b> ile yönetmelik
      göstergesine çevrilir ve <b>EK-3 Tablo 3.3</b> ile karşılaştırılır.
    </div>
    ${kayitlar.length === 0
      ? '<div class="bos-durum">Henüz döşeme tanımlanmadı.</div>'
      : kayitlar.map((d, i) => kart(d, i, sonuclar.darbeler[i])).join('')}
  </section>`;
}

function kart(k, i, h) {
  const y = `darbeler.${i}`;
  const d = h.degerlendirme;
  const s = h.sonuc;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <div style="flex:1"><input data-yol="${y}.ad" value="${kacis(k.ad)}" class="baslik-girdi"></div>
      <div class="satir-eylem">
        <button class="dugme acik kucuk" data-eylem="kopyala-darbe" data-idx="${i}">Kopyala</button>
        <button class="dugme acik kucuk" data-eylem="sil-darbe" data-idx="${i}">Sil</button>
      </div>
    </div>

    <div class="izgara">
      <div class="alan"><label>Üst kattaki (kaynak) mekân</label>
        <select data-yol="${y}.ustMekanId">${mekanSecenekleri(k.ustMekanId)}</select>
        <span class="ipucu">Gürültülülük: <b>${kacis(GURULTULULUK_DERECELERI[d?.ustMekan?.gurultululuk] || '—')}</b></span></div>
      <div class="alan"><label>Alt kattaki (alıcı) mekân</label>
        <select data-yol="${y}.altMekanId">${mekanSecenekleri(k.altMekanId)}</select>
        <span class="ipucu">Hassasiyet: <b>${kacis(HASSASIYET_DERECELERI[d?.altMekan?.hassasiyet] || '—')}</b></span></div>
    </div>

    ${geometriBolumu(y, k, h)}

    <h3 style="margin-top:18px">Taşıyıcı döşeme</h3>
    ${dosemeBolumu(y, k, h)}

    <h3 style="margin-top:18px">Kaplama ve yan yol</h3>
    <div class="izgara">
      <div class="alan"><label>Şap / kaplama</label>
        <select data-yol="${y}.sapId">${secenekler(SAP_KAPLAMALAR, k.sapId)}</select>
        <span class="ipucu">Kütüphane ΔLw = ${sayi(h.sap?.dLw ?? 0, 0)} dB</span></div>
      <div class="alan"><label>Beyan edilmiş ΔLw (dB) — isteğe bağlı</label>
        <input type="number" step="0.1" data-yol="${y}.dLwBeyan" data-tur="sayiVeyaNull" value="${k.dLwBeyan ?? ''}" placeholder="ürün beyan değeri"></div>
      <div class="alan"><label>Yan duvarların ortalama m′ (kg/m²)</label>
        <input type="number" step="10" min="50" data-yol="${y}.mYanOrtalama" data-tur="sayi" value="${k.mYanOrtalama}">
        <span class="ipucu">Yan yol düzeltmesi K = ${sayi(s.K)} dB</span></div>
      <div class="alan"><label><input type="checkbox" data-yol="${y}.asmaTavanVar" data-tur="bool" ${k.asmaTavanVar ? 'checked' : ''} style="width:auto;margin-right:6px">Elastik askılı asma tavan var</label>
        ${k.asmaTavanVar ? `<input type="number" step="1" min="0" max="20" data-yol="${y}.asmaTavanKazanci" data-tur="sayi" value="${k.asmaTavanKazanci}" placeholder="kazanç, dB">` : ''}
        <span class="ipucu">Asma tavanın darbe sesi kazancı (dB)</span></div>
    </div>

    <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
      <div class="hucre"><span class="etiket">Çıplak döşeme Ln,w,eq</span><span class="deger">${sayi(s.LnwEq)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">ΔLw (kaplama)</span><span class="deger">−${sayi(s.dLwToplam)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">K (yan yol)</span><span class="deger">+${sayi(s.K)} <small>dB</small></span></div>
      <div class="hucre one-cikan"><span class="etiket">L′nT,w (hesaplanan)</span><span class="deger">${sayi(s.LnTw)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">İzin verilen (${kacis(d?.hedefSinif ?? '—')} sınıfı)</span><span class="deger">${d ? sayi(d.gereken, 0) : '—'} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">Elde edilen sınıf</span><span>${sinifRozeti(d?.eldeEdilenSinif)}</span></div>
      <div class="hucre"><span class="etiket">Sonuç</span><span>${uygunlukRozeti(d)}${d && Number.isFinite(d.fark) ? ` <small>(${d.fark >= 0 ? '+' : ''}${sayi(d.fark)} dB)</small>` : ''}</span></div>
    </div>

    ${d ? `<details><summary>${kacis(d.kaynak)} — sınıf değerleri</summary>
      <div class="tablo-sar"><table>
        <thead><tr><th>Sınıf</th>${Object.keys(d.satir).map((c) => `<th class="sayi">${c}</th>`).join('')}</tr></thead>
        <tbody><tr><td>L′nT,w en çok (dB)</td>${Object.values(d.satir).map((v) => `<td class="sayi">${v}</td>`).join('')}</tr></tbody>
      </table></div>
      <p class="soluk" style="font-size:12px">Satır anahtarı: ${kacis(d.anahtar)}. ${kacis(d.dogrulama)}</p>
    </details>` : ''}
  </section>`;
}

/* ── Geometri (hacim ↔ boyutlar) ─────────────────────────────────────── */

function geometriBolumu(y, k, h) {
  const g = k.geometri || { mod: 'hacim' };
  const boyutMi = g.mod === 'olculer';

  return `
  <h3 style="margin-top:18px">Geometri</h3>
  <div class="satir-eylem" style="margin-bottom:10px">
    ${boyutMi
      ? `<span class="rozet bilgi">Oda boyutlarından hesaplanıyor</span>
         <button class="dugme acik kucuk" data-eylem="hacim-moda-don" data-yol-tabani="${y}">Doğrudan V girişine dön</button>`
      : `<button class="dugme acik kucuk" data-eylem="geometri-moda-gec" data-yol-tabani="${y}">Oda boyutlarından hesapla (L×W×H)</button>`}
  </div>
  ${!boyutMi ? `
  <div class="izgara">
    <div class="alan"><label>Alt mekân hacmi V (m³)</label>
      <input type="number" step="1" min="1" data-yol="${y}.V" data-tur="sayi" value="${k.V}"></div>
  </div>` : `
  <div class="izgara dar">
    <div class="alan"><label>Derinlik L (m)</label>
      <input type="number" step="0.01" min="0.1" data-yol="${y}.geometri.L" data-tur="sayi" value="${g.L}"></div>
    <div class="alan"><label>Genişlik W (m)</label>
      <input type="number" step="0.01" min="0.1" data-yol="${y}.geometri.W" data-tur="sayi" value="${g.W}"></div>
    <div class="alan"><label>Yükseklik H (m)</label>
      <input type="number" step="0.01" min="0.1" data-yol="${y}.geometri.H" data-tur="sayi" value="${g.H}"></div>
    <div class="alan"><label>Hesaplanan V</label><input readonly value="${h.geo ? sayi(h.geo.V) + ' m³' : '—'}"></div>
  </div>`}`;
}

/* ── Taşıyıcı döşeme (basit seçim ↔ katmanlı yapı) ───────────────────── */

function dosemeBolumu(y, k, h) {
  const katmanliMi = (k.katmanlar || []).length > 0;
  return `
  <div class="satir-eylem" style="margin-bottom:10px">
    ${katmanliMi
      ? `<span class="rozet bilgi">Katmanlı yapı</span>
         <button class="dugme acik kucuk" data-eylem="basit-moda-don" data-yol-tabani="${y}">Basit seçime dön</button>`
      : `<button class="dugme acik kucuk" data-eylem="katmanli-moda-gec" data-yol-tabani="${y}">Katmanlı yapıya geç</button>`}
  </div>
  ${katmanliMi
    ? katmanEditoru(y, k.katmanlar, { tur: 'doseme', katmanDetay: h.doseme.katmanDetay })
    : `
  <div class="izgara">
    <div class="alan"><label>Taşıyıcı döşeme</label>
      <select data-yol="${y}.dosemeId">${secenekler(DOSEMELER, k.dosemeId, { gruplu: true })}</select>
      <span class="ipucu">m′ = ${sayi(h.doseme.mAlan, 0)} kg/m²</span></div>
    <div class="alan"><label>Beyan edilmiş Ln,w,eq (dB) — isteğe bağlı</label>
      <input type="number" step="0.1" data-yol="${y}.LnwBeyan" data-tur="sayiVeyaNull" value="${k.LnwBeyan ?? ''}" placeholder="kütleden kestirilir"></div>
  </div>`}`;
}
