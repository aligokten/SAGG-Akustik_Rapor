/**
 * sekme-darbe.js — Döşemelerde darbe sesi yalıtımı (TS EN 12354-2) ve
 * EK-3 Tablo 3.3 değerlendirmesi.
 */

import { kacis, sayi, secenekler, uygunlukRozeti, sinifRozeti, katliMi, katlamaDugmesi, tumunuKatlaDugmesi } from './ortak.js';
import { DOSEMELER, SAP_KAPLAMALAR } from '../veri/malzemeler.js';
import {
  GURULTULULUK_DERECELERI, HASSASIYET_DERECELERI,
  EK3_TABLO_3_5, komsulukSatirlari,
} from '../veri/yonetmelik.js';
import { mekanSecenekleri } from './sekme-ayirici.js';
import { katmanEditoru } from './katman-editor.js';
import { odaSVG } from './oda-cizimi.js';

export function ciz(durum, sonuclar) {
  const kayitlar = durum.darbeler;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Tanımlı döşemeler <span class="rozet notr yalin">${kayitlar.length}</span></h3>
      ${tumunuKatlaDugmesi(kayitlar.map((r) => r.id), 'darbeler')}
      <button class="dugme" data-eylem="ekle-darbe">+ Döşeme ekle</button>
    </div>
    <div class="bilgi-kutu">
      TS EN 12354-2 basitleştirilmiş modeli: <b>L′n,w = Ln,w,eq − ΔLw + K</b>. Çıplak döşemenin
      Ln,w,eq değeri alan kütlesinden (164 − 35·lg m′) kestirilir, yüzer şap/şiltenin ΔLw'si düşülür,
      yan yol düzeltmesi K eklenir. Sonuç <b>L′nT,w = L′n,w − 10·lg(0,032·V)</b> ile yönetmelik
      göstergesine çevrilir. Karşılaştırma, her döşeme için seçilen tabloyla yapılır: komşuluk
      ilişkisi seçildiyse <b>EK-3 Tablo 3.5</b>, seçilmediyse <b>EK-3 Tablo 3.3</b>.
    </div>
    ${kayitlar.length === 0
      ? '<div class="bos-durum">Henüz döşeme tanımlanmadı.</div>'
      : kayitlar.map((d, i) => kart(d, i, sonuclar.darbeler[i], durum.proje.binaTuru)).join('')}
  </section>`;
}

function kart(k, i, h, binaTuru) {
  const y = `darbeler.${i}`;
  const d = h.degerlendirme;
  const s = h.sonuc;
  return `
  <section class="kart${katliMi(k.id) ? ' katli' : ''}">
    <div class="kart-baslik">
      <div style="flex:1"><input data-yol="${y}.ad" value="${kacis(k.ad)}" class="baslik-girdi"></div>
      <div class="satir-eylem">
        ${katliMi(k.id) ? `<span class="kart-ozet">
          <b>${h.sonuc ? sayi(h.sonuc.LnTw) : '—'}</b> dB ${uygunlukRozeti(h.degerlendirme)}</span>` : ''}
        ${katlamaDugmesi(k.id)}
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
      <div class="alan"><label>Manuel L′nT,w üst sınırı (dB)</label>
        <input type="text" inputmode="decimal" data-yol="${y}.manuelHedef" data-tur="sayiVeyaNull" value="${k.manuelHedef ?? ''}"
               placeholder="${d ? sayi(d.yonetmelikGereken, 0) : '—'} (yönetmelik)">
        <span class="ipucu">${k.manuelHedef == null ? 'Yönetmelik sınırı etkin.' : 'Manuel sınır etkin — raporda etiketlenir.'}</span></div>
    </div>

    ${komsulukBolumu(y, k, d, binaTuru)}

    ${geometriBolumu(y, k, h)}

    <h3 style="margin-top:18px">Taşıyıcı döşeme</h3>
    ${dosemeBolumu(y, k, h)}

    <h3 style="margin-top:18px">Kaplama ve yan yol</h3>
    <div class="izgara">
      <div class="alan"><label>Şap / kaplama</label>
        <select data-yol="${y}.sapId">${secenekler(SAP_KAPLAMALAR, k.sapId)}</select>
        <span class="ipucu">Kütüphane ΔLw = ${sayi(h.sap?.dLw ?? 0, 0)} dB</span></div>
      <div class="alan"><label>Beyan edilmiş ΔLw (dB) — isteğe bağlı</label>
        <input type="text" inputmode="decimal" data-yol="${y}.dLwBeyan" data-tur="sayiVeyaNull" value="${k.dLwBeyan ?? ''}" placeholder="ürün beyan değeri"></div>
      <div class="alan"><label>Yan duvarların ortalama m′ (kg/m²)</label>
        <input type="text" inputmode="decimal" data-yol="${y}.mYanOrtalama" data-tur="sayi" value="${k.mYanOrtalama}">
        <span class="ipucu">Yan yol düzeltmesi K = ${sayi(s.K)} dB</span></div>
      <div class="alan"><label><input type="checkbox" data-yol="${y}.asmaTavanVar" data-tur="bool" ${k.asmaTavanVar ? 'checked' : ''} style="width:auto;margin-right:6px">Elastik askılı asma tavan var</label>
        ${k.asmaTavanVar ? `<input type="text" inputmode="decimal" data-yol="${y}.asmaTavanKazanci" data-tur="sayi" value="${k.asmaTavanKazanci}" placeholder="kazanç, dB">` : ''}
        <span class="ipucu">Asma tavanın darbe sesi kazancı (dB)</span></div>
    </div>

    <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
      <div class="hucre"><span class="etiket">Çıplak döşeme Ln,w,eq</span><span class="deger">${sayi(s.LnwEq)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">ΔLw (kaplama)</span><span class="deger">−${sayi(s.dLwToplam)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">K (yan yol)</span><span class="deger">+${sayi(s.K)} <small>dB</small></span></div>
      <div class="hucre one-cikan"><span class="etiket">L′nT,w (hesaplanan)</span><span class="deger">${sayi(s.LnTw)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">${d?.hedefKaynagi === 'manuel' ? 'Manuel üst sınır' : `İzin verilen (${kacis(d?.hedefSinif ?? '—')} sınıfı)`}</span><span class="deger">${d ? sayi(d.gereken, 0) : '—'} <small>dB</small></span></div>
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

/**
 * Gereksinim tablosu seçimi — EK-3 Tablo 3.5 (komşuluk ilişkisi) ya da
 * kaynak mekân derecesine dayanan Tablo 3.3.
 */
function komsulukBolumu(y, k, d, binaTuru) {
  const satirlar = komsulukSatirlari(EK3_TABLO_3_5, binaTuru);
  if (!satirlar.length) {
    return `<p class="soluk" style="font-size:12.5px">
      Gereksinim <b>EK-3 Tablo 3.3</b>'ten (kaynak mekân derecesi) okunuyor —
      EK-3 Tablo 3.5 bu bina işlevini kapsamıyor.</p>`;
  }
  const secili = k.komsulukId || '';
  return `
    <h3 style="margin-top:18px">Gereksinim tablosu</h3>
    <div class="izgara">
      <div class="alan"><label>Kaynak odası (üst kat) — EK-3 Tablo 3.5</label>
        <select data-yol="${y}.komsulukId">
          <option value=""${secili === '' ? ' selected' : ''}>Kullanma — Tablo 3.3 (kaynak mekân derecesi)</option>
          ${satirlar.map((r) => `<option value="${kacis(r.id)}"${r.id === secili ? ' selected' : ''}>${kacis(r.kaynak)}</option>`).join('')}
        </select>
        <span class="ipucu">${d?.komsuluk
          ? '<b>EK-3 Tablo 3.5</b> kullanılıyor.'
          : '<b>EK-3 Tablo 3.3</b> kullanılıyor (kaynak mekân derecesine göre).'}</span></div>
    </div>`;
}

function odaAlani(baslik, yol, oda, adYerTutucu) {
  return `
  <div class="alan" style="grid-column:1/-1">
    <label>${kacis(baslik)}</label>
    <input type="text" data-yol="${yol}.ad" value="${kacis(oda.ad || '')}" placeholder="${kacis(adYerTutucu)}">
  </div>
  <div class="alan"><label>Derinlik L (m)</label>
    <input type="text" inputmode="decimal" data-yol="${yol}.L" data-tur="sayi" value="${oda.L}"></div>
  <div class="alan"><label>Genişlik W (m)</label>
    <input type="text" inputmode="decimal" data-yol="${yol}.W" data-tur="sayi" value="${oda.W}"></div>
  <div class="alan"><label>Yükseklik H (m)</label>
    <input type="text" inputmode="decimal" data-yol="${yol}.H" data-tur="sayi" value="${oda.H}"></div>`;
}

/**
 * İki oda kipinde döşeme düzlemindeki kaydırma ve örtüşme dökümü.
 *
 * Kaydırma hizalı (ortalanmış) konumdan sapmadır; sıfırken ortak alan
 * min(L₁,L₂)×min(W₁,W₂) olur.
 */
function kaydirmaBolumu(y, g, h) {
  const geo = h.geo;
  const kA = Number(g.kaydirmaA) || 0;
  const kB = Number(g.kaydirmaB) || 0;

  const dokum = !geo ? '' : (!geo.temasVar
    ? `<div class="bilgi-kutu kirmizi">
        <b>Mekânlar üst üste gelmiyor.</b> Kaydırma, iki mekânın örtüşmesini tamamen
        ortadan kaldırdı (ortak döşeme alanı 0 m²). Aralarında ortak bir döşeme yoktur;
        darbe sesi hesabı anlamlı bir sonuç veremez. Kaydırmayı azaltın.
      </div>`
    : `<div class="bilgi-kutu">
        ${geo.tamOrtusme
          ? `<b>Tam örtüşme.</b> Ortak döşeme alanı ${sayi(geo.S)} m².`
          : `<b>Kısmi örtüşme.</b> Ortak döşeme alanı ${sayi(geo.ortakA)} × ${sayi(geo.ortakB)}
             = <b>${sayi(geo.S)} m²</b>. Bu alanın dışında kalan kısım ortak döşeme değildir:
             üst mekânda ${sayi(geo.oda1OrtakOlmayan)} m² (toplam ${sayi(geo.oda1Yuzey)} m²),
             alt mekânda ${sayi(geo.oda2OrtakOlmayan)} m² (toplam ${sayi(geo.oda2Yuzey)} m²).`}
      </div>`);

  return `
  <div class="izgara dar" style="margin-top:8px">
    <div class="alan"><label>Kaydırma — derinlik (L) ekseninde (m)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.geometri.kaydirmaA" data-tur="sayi" value="${kA}">
      <span class="ipucu">Alt mekânın <b>ön kenarı</b>nın, üst mekânın ön kenarına uzaklığı.
        0 = kenarlar hizalı.</span></div>
    <div class="alan"><label>Kaydırma — genişlik (W) ekseninde (m)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.geometri.kaydirmaB" data-tur="sayi" value="${kB}">
      <span class="ipucu">Alt mekânın <b>sol kenarı</b>nın uzaklığı. 0 = kenarlar hizalı.</span></div>
  </div>
  ${dokum}`;
}

function geometriBolumu(y, k, h) {
  const g = k.geometri || { mod: 'hacim' };
  const kip = g.mod === 'iki-oda' ? 'iki-oda' : (g.mod === 'olculer' ? 'olculer' : 'hacim');
  const ust = g.ustOda || { ad: '', L: 6, W: 3, H: 2.62 };
  const alt = g.altOda || { ad: '', L: 6, W: 3, H: 2.62 };

  const dugme = (eylem, etiket) =>
    `<button class="dugme acik kucuk" data-eylem="${eylem}" data-yol-tabani="${y}">${etiket}</button>`;

  const secim = {
    hacim: `${dugme('geometri-moda-gec', 'Tek oda ölçülerinden hesapla (L×W×H)')}
            ${dugme('iki-oda-moda-gec', 'Üst ve alt mekân ölçüleri ayrı')}`,
    olculer: `<span class="rozet bilgi">Alt mekân ölçülerinden hesaplanıyor</span>
              ${dugme('iki-oda-moda-gec', 'Üst ve alt mekân ölçüleri ayrı')}
              ${dugme('hacim-moda-don', 'Doğrudan V girişine dön')}`,
    'iki-oda': `<span class="rozet bilgi">Üst ve alt mekân ayrı ayrı</span>
                ${dugme('geometri-moda-gec', 'Tek odaya dön')}
                ${dugme('hacim-moda-don', 'Doğrudan V girişine dön')}`,
  }[kip];

  const govde = {
    hacim: `
      <div class="izgara">
        <div class="alan"><label>Alt (alıcı) mekân hacmi V (m³)</label>
          <input type="text" inputmode="decimal" data-yol="${y}.V" data-tur="sayi" value="${k.V}"></div>
      </div>`,
    olculer: `
      <div class="izgara dar">
        <div class="alan"><label>Derinlik L (m)</label>
          <input type="text" inputmode="decimal" data-yol="${y}.geometri.L" data-tur="sayi" value="${g.L}"></div>
        <div class="alan"><label>Genişlik W (m)</label>
          <input type="text" inputmode="decimal" data-yol="${y}.geometri.W" data-tur="sayi" value="${g.W}"></div>
        <div class="alan"><label>Yükseklik H (m)</label>
          <input type="text" inputmode="decimal" data-yol="${y}.geometri.H" data-tur="sayi" value="${g.H}"></div>
        <div class="alan"><label>Hesaplanan V</label>
          <input readonly value="${h.geo ? sayi(h.geo.V) + ' m³' : '—'}"></div>
      </div>
      <div class="bilgi-kutu">Girilen ölçüler <b>alt (alıcı) mekâna</b> aittir; bağıntıya giren
        hacim odur. Üst mekân farklı boyuttaysa "üst ve alt mekân ölçüleri ayrı" kipini kullanın.</div>`,
    'iki-oda': `
      <div class="izgara">
        ${odaAlani('Üst mekân (kaynak — darbenin uygulandığı kat)', `${y}.geometri.ustOda`, ust,
          h.degerlendirme?.ustMekan?.ad || 'Üst mekân adı')}
        ${odaAlani('Alt mekân (alıcı — sesin duyulduğu kat)', `${y}.geometri.altOda`, alt,
          h.degerlendirme?.altMekan?.ad || 'Alt mekân adı')}
      </div>
      ${kaydirmaBolumu(y, g, h)}
      <div class="izgara dar" style="margin-top:8px">
        <div class="alan"><label>Alt (alıcı) mekân hacmi V</label>
          <input readonly value="${h.geo ? sayi(h.geo.V) + ' m³' : '—'}"></div>
        <div class="alan"><label>Üst mekân hacmi (bilgi)</label>
          <input readonly value="${h.geo ? sayi(h.geo.V1) + ' m³' : '—'}"></div>
        <div class="alan"><label>Ortak döşeme alanı</label>
          <input readonly value="${h.geo ? sayi(h.geo.S) + ' m²' : '—'}"></div>
      </div>
      <div class="bilgi-kutu">
        <b>Hangi ölçü sonucu değiştirir?</b> Bağıntı L′nT,w = L′n,w − 10·lg(0,032·V) yalnızca
        <b>alt (alıcı) mekânın hacmini</b> kullanır; ortak döşeme alanı basitleştirilmiş
        TS EN 12354-2 modeline girmez. İki oda kipinin değeri, üst ve alt mekân farklı
        boyuttayken doğru hacmin karışmamasını sağlaması ve ortak döşeme alanını
        belgelemesidir.
      </div>
      ${h.geo ? `
      <div class="canli-model">
        <div class="canli-model-baslik">
          <span class="canli-model-nokta"></span> Canlı 3B model
          <span class="soluk" style="font-weight:500;margin-left:auto;font-size:11.5px">Döndürmek için sürükleyin</span>
        </div>
        ${(() => {
          const a1 = ust.ad || h.degerlendirme?.ustMekan?.ad || 'Üst mekân (kaynak)';
          const a2 = alt.ad || h.degerlendirme?.altMekan?.ad || 'Alt mekân (alıcı)';
          const cizim = { oda1: ust, oda2: alt, yon: 'taban',
            kaydirmaA: g.kaydirmaA, kaydirmaB: g.kaydirmaB };
          return `<div class="oda-svg-sarmalayici" data-oda1-adi="${kacis(a1)}" data-oda2-adi="${kacis(a2)}">
            ${odaSVG(cizim, { oda1Adi: a1, oda2Adi: a2 })}
          </div>`;
        })()}
      </div>` : ''}`,
  }[kip];

  return `
  <h3 style="margin-top:18px">Geometri</h3>
  <div class="satir-eylem" style="margin-bottom:10px">${secim}</div>
  ${govde}`;
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
    ? katmanEditoru(y, k.katmanlar, { tur: 'doseme', kategori: 'doseme', katmanDetay: h.doseme.katmanDetay })
    : `
  <div class="izgara">
    <div class="alan"><label>Taşıyıcı döşeme</label>
      <select data-yol="${y}.dosemeId">${secenekler(DOSEMELER, k.dosemeId, { gruplu: true })}</select>
      <span class="ipucu">m′ = ${sayi(h.doseme.mAlan, 0)} kg/m²</span></div>
    <div class="alan"><label>Beyan edilmiş Ln,w,eq (dB) — isteğe bağlı</label>
      <input type="text" inputmode="decimal" data-yol="${y}.LnwBeyan" data-tur="sayiVeyaNull" value="${k.LnwBeyan ?? ''}" placeholder="kütleden kestirilir"></div>
  </div>`}`;
}
