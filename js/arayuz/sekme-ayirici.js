/**
 * sekme-ayirici.js — Ayırıcı elemanlarda (düşey/yatay) hava doğuşlu ses
 * yalıtımı: TS EN 12354-1 yan yollu hesap ve EK-3 Tablo 3.2 değerlendirmesi.
 */

import { kacis, sayi, secenekler, uygunlukRozeti, sinifRozeti } from './ortak.js';
import {
  EK2_TABLO_2_1, GURULTULULUK_DERECELERI, HASSASIYET_DERECELERI,
  EK3_TABLO_3_4, komsulukSatirlari, BINA_TURLERI,
} from '../veri/yonetmelik.js';
import { DUVARLAR, DOSEMELER, DOGRAMALAR, SIVALAR, GIYDIRME_KABUKLAR, YALITIM_LEVHALARI } from '../veri/malzemeler.js';
import { BIRLESIM_TIPLERI } from '../cekirdek/kij.js';
import { YON_ADLARI, KAYDIRMA_EKSENLERI } from '../cekirdek/geometri.js';
import { katmanEditoru } from './katman-editor.js';
import { odaSVG } from './oda-cizimi.js';

const MEKANLAR = EK2_TABLO_2_1.mekanlar;
const YAPI_ELEMANLARI = [...DUVARLAR, ...DOSEMELER];

export function ciz(durum, sonuclar) {
  const kayitlar = durum.ayiricilar;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Tanımlı ayırıcı elemanlar <span class="rozet notr yalin">${kayitlar.length}</span></h3>
      <button class="dugme" data-eylem="ekle-ayirici">+ Ayırıcı eleman ekle</button>
    </div>
    <div class="bilgi-kutu">
      Hesap TS EN 12354-1'in basitleştirilmiş (tek sayılı) modeline göre yapılır: doğrudan yol (Dd) ile
      her yan eleman için üç yan yol (Ff, Fd, Df) enerjik olarak toplanarak <b>R′w</b> bulunur, ardından
      <b>DnT,w = R′w + 10·lg(0,32·V/S)</b> ile yönetmeliğin göstergesine dönüştürülür.
      Sonuç, her eleman için seçilen tabloyla karşılaştırılır: komşuluk ilişkisi seçildiyse
      <b>EK-3 Tablo 3.4</b>, seçilmediyse mekân derecelerine dayanan <b>EK-3 Tablo 3.2</b>.
    </div>
    ${kayitlar.length === 0
      ? '<div class="bos-durum">Henüz ayırıcı eleman tanımlanmadı. Yukarıdaki düğmeyle ekleyin.</div>'
      : kayitlar.map((a, i) => kart(a, i, sonuclar.ayiricilar[i], durum.proje.binaTuru)).join('')}
  </section>`;
}

function kart(a, i, h, binaTuru) {
  const y = `ayiricilar.${i}`;
  const d = h.degerlendirme;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <div style="flex:1">
        <input data-yol="${y}.ad" value="${kacis(a.ad)}" class="baslik-girdi">
      </div>
      <div class="satir-eylem">
        <button class="dugme acik kucuk" data-eylem="kopyala-ayirici" data-idx="${i}">Kopyala</button>
        <button class="dugme acik kucuk" data-eylem="sil-ayirici" data-idx="${i}">Sil</button>
      </div>
    </div>

    <h3>Mekânlar</h3>
    <div class="izgara">
      <div class="alan"><label>Gürültü kaynağı mekân</label>
        <select data-yol="${y}.kaynakMekanId">${mekanSecenekleri(a.kaynakMekanId)}</select>
        <span class="ipucu">Gürültülülük derecesi: <b>${kacis(GURULTULULUK_DERECELERI[d?.kaynakMekan?.gurultululuk] || '—')}</b></span></div>
      <div class="alan"><label>Alıcı (korunan) mekân</label>
        <select data-yol="${y}.aliciMekanId">${mekanSecenekleri(a.aliciMekanId)}</select>
        <span class="ipucu">Hassasiyet derecesi: <b>${kacis(HASSASIYET_DERECELERI[d?.aliciMekan?.hassasiyet] || '—')}</b></span></div>
      <div class="alan"><label>Manuel DnT,w hedefi (dB)</label>
        <input type="text" inputmode="decimal" data-yol="${y}.manuelHedef" data-tur="sayiVeyaNull" value="${a.manuelHedef ?? ''}"
               placeholder="${d ? sayi(d.yonetmelikGereken, 0) : '—'} (yönetmelik)">
        <span class="ipucu">${a.manuelHedef == null ? 'Yönetmelik hedefi etkin.' : 'Manuel hedef etkin — raporda etiketlenir.'}</span></div>
    </div>

    ${komsulukBolumu(y, a, d, binaTuru)}

    ${geometriBolumu(y, a, h)}

    <h3 style="margin-top:18px">Ayırıcı eleman</h3>
    ${anaElemanBolumu(y, a, h)}

    <h3 style="margin-top:18px">Giydirme kabuk</h3>
    <div class="izgara">
      <div class="alan"><label>Sistem</label>
        <select data-yol="${y}.giydirmeId">${secenekler(GIYDIRME_KABUKLAR, a.giydirmeId, { gruplu: true })}</select>
        <span class="ipucu">ΔRw = ${sayi(h.giydirmeCozum.dRw, 0)} dB${h.giydirmeCozum.dolguCezasi ? ` (dolgu cezası ${sayi(h.giydirmeCozum.dolguCezasi, 0)} dB dahil)` : ''}</span></div>
      ${h.giydirmeCozum.giydirme.bosluk > 0 ? `
      <div class="alan"><label>Boşluk dolgusu</label>
        <select data-yol="${y}.dolguId">${secenekler(YALITIM_LEVHALARI, h.giydirmeCozum.dolgu.id, { gruplu: true })}</select>
        <span class="ipucu">Boşluk derinliği ${sayi(h.giydirmeCozum.giydirme.bosluk, 0)} mm</span></div>
      <div class="alan"><label>Rezonans frekansı f₀</label>
        <input readonly value="${sayi(h.giydirmeCozum.f0, 0)} Hz">
        <span class="ipucu" style="color:${{ iyi: 'var(--basari)', orta: 'var(--uyari)', kotu: 'var(--hata)' }[h.giydirmeCozum.f0Yorum.seviye] || 'var(--soluk)'}">${kacis(h.giydirmeCozum.f0Yorum.metin)}</span></div>
      ` : ''}
    </div>
    ${h.giydirmeCozum.dolgu.not ? `<div class="bilgi-kutu${h.giydirmeCozum.dolguCezasi ? ' sari' : ''}"><b>${kacis(h.giydirmeCozum.dolgu.ad)}:</b> ${kacis(h.giydirmeCozum.dolgu.not)}</div>` : ''}
    <div class="izgara dar" style="margin-top:10px">
      <div class="alan"><label>Alan kütlesi m′</label><input readonly value="${sayi(h.ana.mAlan, 0)} kg/m²"></div>
      <div class="alan"><label>Eleman Rw (${kacis(h.ana.kaynak)})</label><input readonly value="${sayi(h.ana.Rw)} dB"></div>
      <div class="alan"><label>Ayırıcı elemanın toplam Rw'si</label><input readonly value="${sayi(h.RwAyirici)} dB"></div>
    </div>

    <div class="izgara" style="margin-top:12px">
      <div class="alan"><label><input type="checkbox" data-yol="${y}.kapiVar" data-tur="bool" ${a.kapiVar ? 'checked' : ''} style="width:auto;margin-right:6px">Ayırıcı elemanda kapı var</label></div>
      ${a.kapiVar ? `
      <div class="alan"><label>Kapı</label>
        <select data-yol="${y}.kapiId">${secenekler(DOGRAMALAR.filter((x) => x.grup === 'Kapı'), a.kapiId)}</select></div>
      <div class="alan"><label>Kapı alanı (m²)</label>
        <input type="text" inputmode="decimal" data-yol="${y}.kapiAlani" data-tur="sayi" value="${a.kapiAlani}"></div>
      ` : ''}
    </div>
    ${h.kapiBilgi ? `<div class="bilgi-kutu sari">Kapı (Rw ${sayi(h.kapiBilgi.Rw, 0)} dB, ${sayi(h.kapiBilgi.S)} m²) nedeniyle ayırıcı elemanın bileşik Rw'si <b>${sayi(h.RwAyirici)} dB</b>'e düşmüştür.</div>` : ''}

    <h3 style="margin-top:18px">Yan elemanlar (yan yol iletimi)</h3>
    <div class="tablo-sar"><table>
      <thead><tr>
        <th>Yan eleman</th><th>Yapı</th><th class="sayi">m′ (kg/m²)</th><th class="sayi">Rw (dB)</th>
        <th>Giydirme</th><th class="sayi">lf (m)</th><th>Birleşim</th><th>Esnek</th><th></th>
      </tr></thead>
      <tbody>
      ${(a.yanElemanlar || []).map((ye, j) => yanElemanSatirlari(y, i, ye, j, h.yanElemanlar[j])).join('')}
      </tbody>
    </table></div>
    <button class="dugme acik kucuk" data-eylem="ekle-yan" data-idx="${i}">+ Yan eleman ekle</button>
    <p class="soluk" style="font-size:12px">
      lf: ayırıcı eleman ile yan elemanın birleşim uzunluğu. Birleşim tipi <b>T</b> (yan eleman ayırıcıda
      sonlanıyor) veya <b>X</b> (yan eleman ayırıcıdan sürekli geçiyor). Titreşim azaltma indisi Kij,
      TS EN 12354-1 Ek-E bağıntıları ile hesaplanır. Geometri "boyutlardan hesapla" modundaysa, standart
      dört yan elemanın (iki yan duvar + taban + tavan) lf değeri oda boyutlarından otomatik hesaplanır.
    </p>

    ${sonucBolumu(h)}
  </section>`;
}

/* ── Geometri (hacim ↔ boyutlar) ─────────────────────────────────────── */

function geometriBolumu(y, a, h) {
  const g = a.geometri || { mod: 'hacim' };
  const boyutMi = g.mod === 'olculer';
  const oda1 = g.oda1 || { L: 6, W: 3, H: 2.62 };
  const oda2 = g.oda2 || { L: 6, W: 3, H: 2.62 };

  const odaAlani = (etiket, yol, oda, yerTutucu) => `
    <div class="alan"><label>${kacis(etiket)}</label>
      <input data-yol="${yol}.ad" value="${kacis(oda.ad ?? '')}" placeholder="${kacis(yerTutucu)}"
             title="Mekânın proje içindeki adı — raporda ve 3B modelde gösterilir">
      <div class="izgara dar" style="gap:6px;margin-top:6px">
        <input type="text" inputmode="decimal" data-yol="${yol}.L" data-tur="sayi" value="${oda.L}" title="Derinlik L (m)" placeholder="L">
        <input type="text" inputmode="decimal" data-yol="${yol}.W" data-tur="sayi" value="${oda.W}" title="Genişlik W (m)" placeholder="W">
        <input type="text" inputmode="decimal" data-yol="${yol}.H" data-tur="sayi" value="${oda.H}" title="Yükseklik H (m)" placeholder="H">
      </div>
      <span class="ipucu">Mekân adı · L (derinlik) × W (genişlik) × H (yükseklik), metre</span></div>`;

  return `
  <h3 style="margin-top:18px">Geometri</h3>
  <div class="satir-eylem" style="margin-bottom:10px">
    ${boyutMi
      ? `<span class="rozet bilgi">Oda boyutlarından hesaplanıyor</span>
         <button class="dugme acik kucuk" data-eylem="hacim-moda-don" data-yol-tabani="${y}">Doğrudan S/V girişine dön</button>`
      : `<button class="dugme acik kucuk" data-eylem="geometri-moda-gec" data-yol-tabani="${y}">Oda boyutlarından hesapla (L×W×H)</button>`}
  </div>

  ${!boyutMi ? `
  <div class="izgara">
    <div class="alan"><label>Ayırıcı elemanın ortak alanı S (m²)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.S" data-tur="sayi" value="${a.S}"></div>
    <div class="alan"><label>Alıcı mekân hacmi V (m³)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.V" data-tur="sayi" value="${a.V}"></div>
  </div>` : `
  <div class="izgara">
    ${odaAlani('Oda 1 / Kaynak', `${y}.geometri.oda1`, oda1, h.degerlendirme?.kaynakMekan?.ad || 'Kaynak mekân adı')}
    ${odaAlani('Oda 2 / Alıcı', `${y}.geometri.oda2`, oda2, h.degerlendirme?.aliciMekan?.ad || 'Alıcı mekân adı')}
    <div class="alan"><label>Ayırıcı elemanın bulunduğu yüz</label>
      <select data-yol="${y}.geometri.yon">
        ${Object.entries(YON_ADLARI).map(([k, v]) => `<option value="${k}"${k === g.yon ? ' selected' : ''}>${kacis(v)}</option>`).join('')}
      </select>
      <span class="ipucu">Ortak ayırıcı yüzey, iki odanın bu düzlemdeki örtüşen kısmıdır.</span></div>
  </div>

  ${kaydirmaBolumu(y, g, h)}

  <div class="izgara dar" style="margin-top:8px">
    <div class="alan"><label>Ortak (ayırıcı) alan S</label><input readonly value="${h.geo ? sayi(h.geo.S) + ' m²' : '—'}"></div>
    <div class="alan"><label>Alıcı mekân hacmi (hesaplanan)</label><input readonly value="${h.geo ? sayi(h.geo.V) + ' m³' : '—'}"></div>
    <div class="alan"><label>Kaynak mekân hacmi (bilgi)</label><input readonly value="${h.geo ? sayi(h.geo.V1) + ' m³' : '—'}"></div>
  </div>
  <div class="bilgi-kutu">
    Standart dört yan elemanın birleşim uzunluğu (lf) bu boyutlardan otomatik hesaplanır — bkz. aşağıdaki şema.
    DnT,w hesabında alıcı (Oda 2) mekânın kendi hacmi kullanılır.
  </div>
  ${h.geo ? `
  <div class="canli-model">
    <div class="canli-model-baslik">
      <span class="canli-model-nokta"></span> Canlı 3B model
      <span class="soluk" style="font-weight:500;margin-left:auto;font-size:11.5px">Döndürmek için sürükleyin</span>
    </div>
    ${(() => {
      const a1 = oda1.ad || h.degerlendirme?.kaynakMekan?.ad || 'Oda 1 / Kaynak';
      const a2 = oda2.ad || h.degerlendirme?.aliciMekan?.ad || 'Oda 2 / Alıcı';
      return `<div class="oda-svg-sarmalayici" data-yol-tabani="${y}.geometri" data-oda1-adi="${kacis(a1)}" data-oda2-adi="${kacis(a2)}">
        ${odaSVG(g, { oda1Adi: a1, oda2Adi: a2 })}
      </div>`;
    })()}
  </div>` : ''}
  `}`;
}

/* ── Ana eleman (basit seçim ↔ katmanlı yapı) ────────────────────────── */

function anaElemanBolumu(y, a, h) {
  const katmanliMi = (a.katmanlar || []).length > 0;
  return `
  <div class="satir-eylem" style="margin-bottom:10px">
    ${katmanliMi
      ? `<span class="rozet bilgi">Katmanlı yapı</span>
         <button class="dugme acik kucuk" data-eylem="basit-moda-don" data-yol-tabani="${y}">Basit seçime dön</button>`
      : `<button class="dugme acik kucuk" data-eylem="katmanli-moda-gec" data-yol-tabani="${y}">Katmanlı yapıya geç</button>`}
  </div>
  ${katmanliMi
    ? katmanEditoru(y, a.katmanlar, { tur: 'duvar', kategori: 'icDuvar', katmanDetay: h.ana.katmanDetay })
    : `
  <div class="izgara">
    <div class="alan"><label>Yapı elemanı</label>
      <select data-yol="${y}.elemanId">${secenekler(YAPI_ELEMANLARI, a.elemanId, { gruplu: true })}</select></div>
    <div class="alan"><label>Sıva</label>
      <select data-yol="${y}.sivaId">${secenekler(SIVALAR, a.sivaId)}</select></div>
    <div class="alan"><label>Sıvalı yüz sayısı</label>
      <select data-yol="${y}.sivaliYuzSayisi" data-tur="sayi">
        ${[0, 1, 2].map((n) => `<option value="${n}"${n === a.sivaliYuzSayisi ? ' selected' : ''}>${n}</option>`).join('')}
      </select></div>
    <div class="alan"><label>Beyan edilmiş yoğunluk (kg/m³)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.yogunlukBeyan" data-tur="sayiVeyaNull"
             value="${a.yogunlukBeyan ?? ''}" placeholder="${kacis(String(h.ana.eleman?.yogunluk ?? '—'))} (kütüphane)">
      <span class="ipucu">Ürününüzün gerçek birim hacim ağırlığı.</span></div>
    <div class="alan"><label>Beyan edilmiş Rw (dB) — isteğe bağlı</label>
      <input type="text" inputmode="decimal" data-yol="${y}.RwBeyan" data-tur="sayiVeyaNull" value="${a.RwBeyan ?? ''}" placeholder="laboratuvar değeri">
      <span class="ipucu">Girilirse kestirim yerine bu değer kullanılır.</span></div>
  </div>`}`;
}

/* ── Yan elemanlar tablosu ────────────────────────────────────────────── */

function yanElemanSatirlari(y, i, ye, j, hy) {
  const yy = `${y}.yanElemanlar.${j}`;
  const katmanliMi = (ye.katmanlar || []).length > 0;

  const anaSatir = `<tr>
    <td><input data-yol="${yy}.ad" value="${kacis(ye.ad)}" style="min-width:130px"></td>
    <td>${katmanliMi
        ? `<span class="rozet bilgi">Katmanlı</span>`
        : `<select data-yol="${yy}.elemanId" style="min-width:190px">${secenekler(YAPI_ELEMANLARI, ye.elemanId, { gruplu: true })}</select>`}
    </td>
    <td class="sayi">${sayi(hy.mKaynak, 0)}</td>
    <td class="sayi">${sayi(hy.RwKaynak)}</td>
    <td><select data-yol="${yy}.giydirmeId" style="min-width:150px">${secenekler(GIYDIRME_KABUKLAR, ye.giydirmeId)}</select></td>
    <td><input type="text" inputmode="decimal" data-yol="${yy}.lf" data-tur="sayi" value="${ye.lf}" style="width:75px" ${ye.geometriRolu ? 'title="Geometri modunda otomatik hesaplanır; burada girilen değer o modda kullanılmaz."' : ''}></td>
    <td><select data-yol="${yy}.birlesim">${Object.values(BIRLESIM_TIPLERI).map((b) =>
          `<option value="${b.kod}"${b.kod === ye.birlesim ? ' selected' : ''}>${b.kod}</option>`).join('')}</select></td>
    <td style="text-align:center"><input type="checkbox" data-yol="${yy}.esnekBaglanti" data-tur="bool" ${ye.esnekBaglanti ? 'checked' : ''} style="width:auto"></td>
    <td><button class="dugme acik kucuk" data-eylem="sil-yan" data-idx="${i}" data-alt="${j}">Sil</button></td>
  </tr>`;

  const detaySatir = `<tr>
    <td></td>
    <td colspan="8" style="background:var(--yuzey-2)">
      <div class="satir-eylem" style="margin:8px 0">
        ${katmanliMi
          ? `<span class="rozet bilgi">Katmanlı yapı</span>
             <button class="dugme acik kucuk" data-eylem="basit-moda-don" data-yol-tabani="${yy}">Basit seçime dön</button>`
          : `<button class="dugme acik kucuk" data-eylem="katmanli-moda-gec" data-yol-tabani="${yy}">Katmanlı yapıya geç</button>`}
      </div>
      ${katmanliMi ? katmanEditoru(yy, ye.katmanlar, { tur: 'duvar', kategori: ye.geometriRolu === 'tabanTavan' ? 'doseme' : 'icDuvar', katmanDetay: hy._cozum.katmanDetay }) : `
      <div class="izgara dar" style="max-width:520px">
        <div class="alan"><label>Sıva</label><select data-yol="${yy}.sivaId">${secenekler(SIVALAR, ye.sivaId)}</select></div>
        <div class="alan"><label>Sıvalı yüz sayısı</label>
          <select data-yol="${yy}.sivaliYuzSayisi" data-tur="sayi">${[0, 1, 2].map((n) => `<option value="${n}"${n === ye.sivaliYuzSayisi ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="alan"><label>Beyan yoğunluk (kg/m³)</label>
          <input type="text" inputmode="decimal" data-yol="${yy}.yogunlukBeyan" data-tur="sayiVeyaNull" value="${ye.yogunlukBeyan ?? ''}" placeholder="${kacis(String(hy._cozum.eleman?.yogunluk ?? '—'))}"></div>
        <div class="alan"><label>Beyan Rw (dB)</label>
          <input type="text" inputmode="decimal" data-yol="${yy}.RwBeyan" data-tur="sayiVeyaNull" value="${ye.RwBeyan ?? ''}" placeholder="—"></div>
      </div>`}
    </td>
  </tr>`;

  return anaSatir + detaySatir;
}

function sonucBolumu(h) {
  const d = h.degerlendirme;
  const s = h.sonuc;
  return `
  <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
    <div class="hucre"><span class="etiket">Doğrudan yol (Dd)</span><span class="deger">${sayi(s.Dd)} <small>dB</small></span></div>
    <div class="hucre"><span class="etiket">Yan yollu R′w</span><span class="deger">${sayi(s.RwAksan)} <small>dB</small></span></div>
    <div class="hucre one-cikan"><span class="etiket">DnT,w (hesaplanan)</span><span class="deger">${sayi(s.DnTw)} <small>dB</small></span></div>
    <div class="hucre"><span class="etiket">${d?.hedefKaynagi === 'manuel' ? 'Manuel hedef' : `Gereken (${kacis(d?.hedefSinif ?? '—')} sınıfı)`}</span><span class="deger">${d ? sayi(d.gereken, 0) : '—'} <small>dB</small></span></div>
    <div class="hucre"><span class="etiket">Elde edilen sınıf</span><span>${sinifRozeti(d?.eldeEdilenSinif)}</span></div>
    <div class="hucre"><span class="etiket">Sonuç</span><span>${uygunlukRozeti(d)}${d && Number.isFinite(d.fark) ? ` <small>(${d.fark >= 0 ? '+' : ''}${sayi(d.fark)} dB)</small>` : ''}</span></div>
  </div>
  <p class="soluk" style="font-size:12px">Yan yollar nedeniyle kayıp: <b>${sayi(s.yanYolKaybi)} dB</b> · Gereksinim kaynağı: ${kacis(d?.kaynak || '—')}</p>

  <details>
    <summary>Ses iletim yollarının payları</summary>
    <div class="tablo-sar"><table>
      <thead><tr><th>Yol</th><th class="sayi">R (dB)</th><th class="sayi">Pay (%)</th></tr></thead>
      <tbody>${s.yollar.map((yy) =>
        `<tr><td>${kacis(yy.ad)}</td><td class="sayi">${sayi(yy.R)}</td><td class="sayi">${sayi(yy.payYuzde, 1)}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="soluk" style="font-size:12px">En büyük paya sahip yol iyileştirilmeden toplam yalıtım anlamlı biçimde artmaz.</p>
  </details>

  ${d ? `<details><summary>${kacis(d.kaynak)} — sınıf değerleri</summary>
    <div class="tablo-sar"><table>
      <thead><tr><th>Sınıf</th>${Object.keys(d.satir).map((k) => `<th class="sayi">${k}</th>`).join('')}</tr></thead>
      <tbody><tr><td>DnT,w en az (dB)</td>${Object.values(d.satir).map((v) => `<td class="sayi">${v}</td>`).join('')}</tr></tbody>
    </table></div>
    <p class="soluk" style="font-size:12px">Satır anahtarı: ${kacis(d.anahtar)} (kaynak gürültülülük – alıcı hassasiyet). ${kacis(d.dogrulama)}</p>
  </details>` : ''}`;
}

/**
 * Ayırıcı düzlemdeki kaydırma girişi ve örtüşme dökümü.
 *
 * İki mekân ayırıcı düzlem üzerinde kaydırılmışsa duvarın/döşemenin
 * yalnızca örtüşen kısmı ayırıcı elemandır; kalan kısım o odanın kendi
 * yan duvarı/döşemesidir ve iki mekân arasında iletim yolu değildir.
 */
function kaydirmaBolumu(y, g, h) {
  const eksen = KAYDIRMA_EKSENLERI[g.yon] || KAYDIRMA_EKSENLERI.on;
  const geo = h.geo;
  const kA = Number(g.kaydirmaA) || 0;
  const kB = Number(g.kaydirmaB) || 0;
  const kaymaVar = kA !== 0 || kB !== 0;

  const dokum = !geo ? '' : !geo.temasVar ? `
    <div class="bilgi-kutu kirmizi" style="margin-top:8px">
      <b>Mekânlar bu yüzde temas etmiyor.</b> Kaydırma, iki odanın örtüşmesini
      tamamen ortadan kaldırdı (ortak alan 0 m²). Aralarında ayırıcı eleman
      yoktur; hesap anlamlı bir sonuç veremez. Kaydırmayı azaltın ya da
      ayırıcının bulunduğu yüzü değiştirin.
    </div>` : geo.tamOrtusme ? `
    <p class="soluk" style="font-size:12.5px;margin-top:6px">
      Küçük yüzeyin tamamı paylaşılıyor — kaydırmanın ortak alana etkisi yok.
    </p>` : `
    <div class="bilgi-kutu sari" style="margin-top:8px">
      <b>Kısmi örtüşme.</b> Ortak (ayırıcı) alan
      <b>${sayi(geo.ortakA)} × ${sayi(geo.ortakB)} = ${sayi(geo.S)} m²</b>.
      Bu yüzeyin geri kalanı ayırıcı eleman değildir:
      kaynak odada <b>${sayi(geo.oda1OrtakOlmayan)} m²</b>
      (toplam ${sayi(geo.oda1Yuzey)} m²),
      alıcı odada <b>${sayi(geo.oda2OrtakOlmayan)} m²</b>
      (toplam ${sayi(geo.oda2Yuzey)} m²) o odanın kendi yan duvarı/döşemesidir.
    </div>`;

  return `
  <div class="izgara dar" style="margin-top:8px">
    <div class="alan"><label>Kaydırma — ${kacis(eksen.A)} (m)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.geometri.kaydirmaA" data-tur="sayi" value="${kA}">
      <span class="ipucu">Alıcı mekânın kaynağa göre öteleme miktarı; 0 = hizalı</span></div>
    <div class="alan"><label>Kaydırma — ${kacis(eksen.B)} (m)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.geometri.kaydirmaB" data-tur="sayi" value="${kB}">
      <span class="ipucu">${kaymaVar ? 'Ortak alan aşağıda güncellendi.' : 'İki eksende de 0 ise odalar hizalıdır'}</span></div>
  </div>
  ${dokum}`;
}

/**
 * Gereksinim tablosu seçimi — EK-3 Tablo 3.4 (komşuluk ilişkisi) ya da
 * mekân derecelerine dayanan Tablo 3.2.
 *
 * Tablo 3.4 yalnızca bazı bina işlevlerini kapsar; kapsanmayan bir bina
 * türünde seçim gösterilmez ve Tablo 3.2 kullanılır.
 */
function komsulukBolumu(y, a, d, binaTuru) {
  const satirlar = komsulukSatirlari(EK3_TABLO_3_4, binaTuru);
  if (!satirlar.length) {
    return `<p class="soluk" style="font-size:12.5px">
      Gereksinim <b>EK-3 Tablo 3.2</b>'den (mekân dereceleri) okunuyor —
      EK-3 Tablo 3.4 bu bina işlevini kapsamıyor.</p>`;
  }
  const secili = a.komsulukId || '';
  return `
    <h3 style="margin-top:18px">Gereksinim tablosu</h3>
    <div class="izgara">
      <div class="alan"><label>Komşuluk ilişkisi (EK-3 Tablo 3.4)</label>
        <select data-yol="${y}.komsulukId">
          <option value=""${secili === '' ? ' selected' : ''}>Kullanma — Tablo 3.2 (mekân dereceleri)</option>
          ${satirlar.map((r) => `<option value="${kacis(r.id)}"${r.id === secili ? ' selected' : ''}>${kacis(r.kaynak)} → ${kacis(r.alici)}</option>`).join('')}
        </select>
        <span class="ipucu">${d?.komsuluk
          ? '<b>EK-3 Tablo 3.4</b> kullanılıyor.'
          : '<b>EK-3 Tablo 3.2</b> kullanılıyor (kaynak/alıcı derecelerine göre).'}</span></div>
    </div>`;
}

function mekanSecenekleri(secili) {
  const gruplar = new Map();
  for (const m of MEKANLAR) {
    if (!gruplar.has(m.binaTuru)) gruplar.set(m.binaTuru, []);
    gruplar.get(m.binaTuru).push(m);
  }
  return Array.from(gruplar.entries()).map(([bt, liste]) =>
    `<optgroup label="${kacis(BINA_TURLERI[bt] || bt)}">` +
    liste.map((m) => `<option value="${kacis(m.id)}"${m.id === secili ? ' selected' : ''}>${kacis(m.ad)}</option>`).join('') +
    '</optgroup>').join('');
}

export { mekanSecenekleri };
