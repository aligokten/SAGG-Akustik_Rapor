/**
 * rapor-onbolum-sayfalari.js — Raporun ön bölümünün yazdırılabilir sayfaları.
 *
 * Hesap sayfalarından önce gelen bölümleri A4 sayfaları olarak üretir:
 *   1. Giriş ve parsel bilgileri (+ vaziyet planı)
 *   2. Çevresel gürültü
 *   4. Anahtar paftalar (kat planları ve kesitler)
 *   5. Yapı elemanı kod anahtarı ve mekân hassasiyet dereceleri
 *   7. Nokta detaylar
 *   9. Uygulama ve kontrol görselleri
 *  11. Malzeme özellikleri
 *  12. Sonuç ve öneriler
 *
 * Bölüm numaraları, sektörde kullanılan rapor düzenine uyacak biçimde
 * sabittir; hesap sayfaları (3, 6, 8, 10) aradaki numaraları taşır.
 */

import { kacis, sayi } from './ortak.js';
import {
  CEVRESEL_SINIR_DEGERLER, cevreselDegerlendirme, girisCumlesi,
  gorselleriGrupla, yapiElemaniAnahtari, mekanDereceleri, malzemeYogunluklari,
} from '../cekirdek/rapor-onbolum.js';

/**
 * Ön bölümün bütün sayfalarını üretir.
 *
 * @param {Object} p       Proje künyesi
 * @param {Object} s       Hesap sonuçları
 * @param {Object} ob      Ön bölüm verisi
 * @param {Function} antet Sayfa antedini üreten işlev (sekme-rapor'dan gelir)
 * @param {Function} altbilgi Sayfa altbilgisini üreten işlev
 */
export function onBolumSayfalari(p, s, ob, antet, altbilgi) {
  if (!ob || ob.etkin === false) return '';

  const gruplar = gorselleriGrupla(ob.gorseller || []);
  const grup = (tur) => gruplar.find((g) => g.tur === tur)?.gorseller || [];

  const sayfa = (icerik) => `<div class="rapor rapor-sayfa-sonu">
    ${antet(p)}${icerik}${altbilgi(p)}</div>`;

  return [
    sayfa(bolumGiris(p, ob, grup('vaziyet'))),
    sayfa(bolumCevresel(ob)),
    gorselSayfalari('4', 'Anahtar paftalar', [...grup('katPlani'), ...grup('kesit')],
      'Yapı elemanı kodları aşağıdaki paftalar üzerinde gösterilmiştir.', sayfa),
    sayfa(bolumAnahtar(s, ob)),
    gorselSayfalari('7', 'Nokta detaylar', grup('noktaDetay'),
      'Kritik birleşim noktalarının uygulama detayları.', sayfa),
    gorselSayfalari('9', 'Uygulama ve kontrol', grup('uygulama'),
      'Şantiyede uyulacak uygulama kuralları ve kontrol aşamaları.', sayfa),
    sayfa(bolumMalzeme(s)),
    bolumSonuc(ob) ? sayfa(bolumSonuc(ob)) : '',
  ].join('');
}

/* ── 1. Giriş ───────────────────────────────────────────────────────── */

function bolumGiris(p, ob, vaziyet) {
  const metin = String(ob.giris || '').trim() || girisCumlesi(p);

  return `
  <h1 style="font-size:18px">1. Giriş</h1>
  ${metin ? `<p>${kacis(metin)}</p>` : ''}

  <h2>1.1 Yapı ve parsel bilgileri</h2>
  <div class="tablo-sar"><table>
    <tbody>
      ${satir('İl / İlçe', [p.il, p.ilce].filter(Boolean).join(' / '))}
      ${satir('Mahalle', p.mahalle)}
      ${satir('Pafta', p.pafta)}
      ${satir('Ada / Parsel', [p.ada, p.parsel].filter(Boolean).join(' / '))}
      ${satir('Açık adres', p.adres)}
      ${satir('Yapı sahibi', p.isveren)}
      ${satir('Yapı sahibinin adresi', p.isverenAdres)}
      ${satir('Proje müellifi', p.muellif)}
      ${satir('Toplam inşaat alanı', p.toplamInsaatAlani ? `${p.toplamInsaatAlani} m²` : '')}
      ${satir('Kapalı kullanım alanı', p.kapaliAlan ? `${p.kapaliAlan} m²` : '')}
      ${satir('İnşaat yılı', p.insaatYili)}
    </tbody>
  </table></div>

  ${vaziyet.map((g) => sekil(g, 'kucuk')).join('')}`;
}

/** Değeri boş olan künye satırı rapora hiç girmez. */
function satir(etiket, deger) {
  const v = String(deger ?? '').trim();
  return v ? `<tr><th style="text-align:left;width:38%">${kacis(etiket)}</th><td>${kacis(v)}</td></tr>` : '';
}

/* ── 2. Çevresel gürültü ────────────────────────────────────────────── */

function bolumCevresel(ob) {
  const d = cevreselDegerlendirme(ob.cevresel || {});

  return `
  <h1 style="font-size:18px">2. Çevresel gürültü</h1>
  <p>Parselin bulunduğu alan <b>${kacis(d.alan.ad)}</b> olarak değerlendirilmiştir.
    Çevredeki yollar ${d.mevcutYol ? 'mevcuttur' : 'henüz yapılmamış (planlanmış) yollardır'};
    sınır değerler buna göre okunmuştur.</p>

  <h2>2.1 Çevresel gürültü sınır değerleri</h2>
  <div class="tablo-sar"><table>
    <thead>
      <tr><th rowspan="2">Alan türü</th>
        <th colspan="3">Planlanmış yollar (dBA)</th>
        <th colspan="3">Mevcut yollar (dBA)</th></tr>
      <tr><th class="sayi">L<sub>gündüz</sub></th><th class="sayi">L<sub>akşam</sub></th><th class="sayi">L<sub>gece</sub></th>
        <th class="sayi">L<sub>gündüz</sub></th><th class="sayi">L<sub>akşam</sub></th><th class="sayi">L<sub>gece</sub></th></tr>
    </thead>
    <tbody>${CEVRESEL_SINIR_DEGERLER.satirlar.map((r) => `<tr${r.id === d.alan.id ? ' class="vurgu"' : ''}>
      <td>${kacis(r.ad)}</td>
      ${r.yeni.map((v) => `<td class="sayi">${v}</td>`).join('')}
      ${r.mevcut.map((v) => `<td class="sayi">${v}</td>`).join('')}
    </tr>`).join('')}</tbody>
  </table></div>
  <p class="soluk" style="font-size:12px">Kaynak: ${kacis(CEVRESEL_SINIR_DEGERLER.kaynak)}</p>

  <h2>2.2 Parselde kabul edilen gürültü düzeyleri</h2>
  <div class="tablo-sar"><table>
    <thead><tr><th>Gösterge</th><th class="sayi">Kabul edilen</th>
      <th class="sayi">Sınır</th><th>Durum</th></tr></thead>
    <tbody>
      ${d.satirlar.map((r) => `<tr>
        <td>${gosterge(r.ad)}</td>
        <td class="sayi">${r.olculen == null ? '—' : `${sayi(r.olculen)} dBA`}</td>
        <td class="sayi">${r.sinir} dBA</td>
        <td>${r.asiyor == null ? '—' : r.asiyor ? 'Sınır aşılıyor' : 'Sağlanıyor'}</td>
      </tr>`).join('')}
      ${d.Lgag == null ? '' : `<tr><td><b>L<sub>gag</sub></b></td>
        <td class="sayi"><b>${sayi(d.Lgag)} dBA</b></td><td class="sayi">—</td>
        <td>Cephe hesabında dış gürültü düzeyi</td></tr>`}
    </tbody>
  </table></div>
  <p class="soluk" style="font-size:12px">
    L<sub>gag</sub> = 10·lg[(12·10<sup>L<sub>gündüz</sub>/10</sup>
    + 4·10<sup>L<sub>akşam</sub>/10</sup>
    + 8·10<sup>L<sub>gece</sub>/10</sup>) / 24] &nbsp;·&nbsp;
    Ağırlıklar zaman dilimlerinin uzunluğudur: gündüz 07–19, akşam 19–23, gece 23–07.
  </p>
  ${ob.cevresel?.aciklama ? `<p>${kacis(ob.cevresel.aciklama)}</p>` : ''}`;
}

/**
 * Gösterge adını alt indisli yazar (L<sub>gündüz</sub> gibi).
 *
 * Çekirdek modül düz metin döndürür — biçimlendirme sunum katmanının işidir.
 */
function gosterge(ad) {
  const alt = { 'Lgündüz': 'gündüz', 'Lakşam': 'akşam', 'Lgece': 'gece' }[ad];
  return alt ? `L<sub>${alt}</sub>` : kacis(ad);
}

/* ── 4/7/9. Görsel bölümleri ────────────────────────────────────────── */

/**
 * Görselleri sayfalara böler.
 *
 * Bir A4 sayfasına en çok iki görsel sığar; daha fazlası varsa bölüm
 * başlığı ilk sayfada kalır ve kalanlar arkasından gelen sayfalara akar.
 */
function gorselSayfalari(bolumNo, baslik, gorseller, aciklama, sayfa) {
  if (!gorseller.length) return '';
  const sayfalar = [];
  for (let i = 0; i < gorseller.length; i += 2) sayfalar.push(gorseller.slice(i, i + 2));

  return sayfalar.map((grup, i) => sayfa(`
    ${i === 0 ? `<h1 style="font-size:18px">${kacis(bolumNo)}. ${kacis(baslik)}</h1>
      ${aciklama ? `<p>${kacis(aciklama)}</p>` : ''}`
      : `<h2>${kacis(baslik)} (devam)</h2>`}
    ${grup.map((g) => sekil(g)).join('')}`)).join('');
}

/**
 * Numaralı bir şekil bloğu (görsel + alt yazı).
 *
 * `sinif` ile şekil küçültülebilir: künye tablosuyla aynı sayfayı paylaşan
 * vaziyet planı, tam boyda basıldığında sayfayı taşırıyordu.
 */
function sekil(g, sinif = '') {
  return `
  <figure class="rapor-sekil${sinif ? ` ${sinif}` : ''}">
    ${g.veri ? `<img src="${kacis(g.veri)}" alt="${kacis(g.baslik || g.etiket)}">`
             : '<div class="rapor-sekil-bos">Görsel yüklenmedi</div>'}
    <figcaption>${kacis(g.etiket)}${g.baslik ? ` (${kacis(g.baslik)})` : ''}${
      g.aciklama ? ` — ${kacis(g.aciklama)}` : ''}</figcaption>
  </figure>`;
}

/* ── 5. Yapı elemanı anahtarı ve mekân dereceleri ───────────────────── */

function bolumAnahtar(s, ob) {
  const anahtar = yapiElemaniAnahtari(s);
  const mekanlar = mekanDereceleri(s);

  return `
  <h1 style="font-size:18px">5. Yapı elemanları ve mekân dereceleri</h1>

  <h2>5.1 Yapı elemanı kod anahtarı</h2>
  ${ob.yapiElemaniNotu ? `<p>${kacis(ob.yapiElemaniNotu)}</p>` : ''}
  ${anahtar.length === 0 ? '<p class="soluk">Hesap kaydı bulunmadığından anahtar üretilmedi.</p>'
    : anahtar.map((g) => `
      <div class="tablo-sar" style="margin-bottom:10px"><table>
        <thead><tr><th colspan="4">${kacis(g.grup)} — ${kacis(g.baslik)}</th></tr>
          <tr><th>Yapı elemanı</th><th>Kod</th><th>Kaynak</th><th>Alıcı</th></tr></thead>
        <tbody>${g.satirlar.map((r) => `<tr>
          <td>${kacis(r.eleman)}</td><td><b>${kacis(r.kod)}</b></td>
          <td>${kacis(r.kaynak)}</td><td>${kacis(r.alici)}</td></tr>`).join('')}</tbody>
      </table></div>`).join('')}

  <h2>5.2 Gürültülülük düzeyi ve hassasiyet dereceleri</h2>
  ${mekanlar.length === 0 ? '<p class="soluk">Hesaplarda mekân seçilmedi.</p>'
    : `<div class="tablo-sar"><table>
        <thead><tr><th>Mekân</th><th>Bina türü</th>
          <th>Gürültülülük düzeyi</th><th>Hassasiyet derecesi</th></tr></thead>
        <tbody>${mekanlar.map((m) => `<tr><td>${kacis(m.ad)}</td><td>${kacis(m.binaTuru)}</td>
          <td>${kacis(m.gurultululuk)}</td><td>${kacis(m.hassasiyet)}</td></tr>`).join('')}</tbody>
      </table></div>
      <p class="soluk" style="font-size:12px">
        Kaynak: BGKKHY EK-2 Tablo 2.1. YG: yüksek gürültülü, OG: orta gürültülü, DG: düşük gürültülü.
        I: çok hassas, II: hassas, III: az hassas.</p>`}`;
}

/* ── 11. Malzeme özellikleri ────────────────────────────────────────── */

function bolumMalzeme(s) {
  const malzemeler = malzemeYogunluklari(s);
  return `
  <h1 style="font-size:18px">11. Malzeme özellikleri</h1>
  <h2>11.1 Malzeme birim hacim ağırlıkları</h2>
  ${malzemeler.length === 0 ? '<p class="soluk">Hesaplarda malzeme çözülemedi.</p>'
    : `<div class="tablo-sar"><table>
        <thead><tr><th>Malzeme</th><th class="sayi">Birim hacim ağırlığı (kg/m³)</th></tr></thead>
        <tbody>${malzemeler.map((m) => `<tr><td>${kacis(m.ad)}</td>
          <td class="sayi">${sayi(m.yogunluk, 0)}</td></tr>`).join('')}</tbody>
      </table></div>
      <p class="soluk" style="font-size:12px">
        Tablo, raporda geçen yapı elemanlarının katmanlarından türetilmiştir.
        Ses geçiş kaybı kestirimleri bu yoğunluklara dayanır.</p>`}`;
}

/* ── 12. Sonuç ──────────────────────────────────────────────────────── */

function bolumSonuc(ob) {
  const sonuc = String(ob.sonuc || '').trim();
  const oneriler = (ob.oneriler || []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!sonuc && !oneriler.length) return '';

  return `
  <h1 style="font-size:18px">12. Sonuç ve öneriler</h1>
  ${sonuc ? `<p>${kacis(sonuc)}</p>` : ''}
  ${oneriler.length ? `<h2>12.1 Uygulama önerileri</h2>
    <ol class="rapor-oneriler">${oneriler.map((o) => `<li>${kacis(o)}</li>`).join('')}</ol>` : ''}`;
}
