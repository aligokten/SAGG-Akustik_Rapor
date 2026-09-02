/**
 * rapor-onbolum-sayfalari.js — Raporun ön bölümünün yazdırılabilir sayfaları.
 *
 * Hesap sayfalarından önce gelen bölümleri üretir: giriş ve parsel künyesi,
 * içindekiler, çevresel gürültü, anahtar paftalar, yapı elemanı kod anahtarı,
 * nokta detaylar, uygulama görselleri, malzeme özellikleri, sonuç ve raporu
 * hazırlayan uzmanın yeterlilik belgesi.
 *
 * Bölüm NUMARALARI burada sabit yazılmaz. Boş bölümler (ör. hiç nokta detay
 * yüklenmemişse) hiç basılmadığından, numaralar gerçekten basılan bölümler
 * üzerinden sırayla verilir; içindekiler de aynı listeden üretilir. Böylece
 * başlıklarla içindekilerin ayrışması yapısal olarak olanaksızdır.
 */

import { kacis, sayi } from './ortak.js';
import {
  CEVRESEL_SINIR_DEGERLER, cevreselDegerlendirme, girisCumlesi, GIRIS_METNI,
  gorselleriGrupla, yapiElemaniAnahtari, mekanDereceleri, malzemeYogunluklari,
} from '../cekirdek/rapor-onbolum.js';

/**
 * Ön bölümün bölüm gruplarını döndürür.
 *
 * Her grup: { id, baslik, numarali, sayfalar(no) → [sayfa içeriği, …] }
 * `sayfalar`, atanan bölüm numarasını alır; başlığı o numarayla yazar.
 *
 * @returns {Array} Ön bölüm kapalıysa boş dizi.
 */
export function onBolumGruplari(p, s, ob) {
  if (!ob || ob.etkin === false) return [];

  const gruplar = gorselleriGrupla(ob.gorseller || []);
  const gor = (tur) => gruplar.find((g) => g.tur === tur)?.gorseller || [];

  const liste = [
    { id: 'giris', baslik: 'Giriş', numarali: true,
      /*
       * Vaziyet planı KENDİ sayfasında basılır. Künye tablosuyla aynı
       * sayfaya sığdırmak için küçültülüyordu; sabit giriş metni eklenince
       * sayfa taştı ve plan, arkasında koca bir boşlukla yetim kaldı.
       * Ayrı sayfa, aynı kâğıt sayısıyla düzgün bir düzen verir ve plan
       * tam boyunda basılır.
       */
      sayfalar: (no) => [
        bolumGiris(no, p, ob),
        ...(gor('vaziyet').length
          ? [`<h2>${no}.2 Vaziyet planı</h2>${gor('vaziyet').map((g) => sekil(g)).join('')}`]
          : []),
      ] },

    { id: 'cevresel', baslik: 'Çevresel gürültü', numarali: true,
      sayfalar: (no) => [bolumCevresel(no, ob)] },

    gorselGrubu('paftalar', 'Anahtar paftalar', [...gor('katPlani'), ...gor('kesit')],
      'Yapı elemanı kodları aşağıdaki paftalar üzerinde gösterilmiştir.'),

    { id: 'anahtar', baslik: 'Yapı elemanları ve mekân dereceleri', numarali: true,
      sayfalar: (no) => [bolumAnahtar(no, s, ob)] },

    gorselGrubu('detaylar', 'Nokta detaylar', gor('noktaDetay'),
      'Kritik birleşim noktalarının uygulama detayları.'),

    gorselGrubu('uygulama', 'Uygulama ve kontrol', gor('uygulama'),
      'Şantiyede uyulacak uygulama kuralları ve kontrol aşamaları.'),

    { id: 'malzeme', baslik: 'Malzeme özellikleri', numarali: true,
      sayfalar: (no) => [bolumMalzeme(no, s)] },

    bolumSonucGrubu(ob),

    // Uzman belgesi ön bölümün EN SONUNDA ve numarasız durur: bir rapor
    // bölümü değil, rapora eklenen bir yeterlilik belgesidir.
    gor('uzmanBelgesi').length
      ? { id: 'uzmanBelgesi', baslik: 'D1 Temel Bina Akustik Uzman Belgesi', numarali: false,
          sayfalar: () => gor('uzmanBelgesi').map((g) => `
            <h1 style="font-size:18px">D1 Temel Bina Akustik Uzman Belgesi</h1>
            <p>Bu raporu hazırlayan akustik uzmanın yeterlilik belgesi aşağıdadır.</p>
            ${belgeGorseli(g)}`) }
      : null,
  ];

  return liste.filter(Boolean);
}

/**
 * Görsel taşıyan bir bölüm; hiç görsel yoksa bölüm hiç oluşmaz.
 *
 * HER ÇİZİM KENDİ SAYFASINDA basılır. Önceden sayfaya iki şekil
 * konuyordu; bu, her şeklin yüksekliğini yarım sayfaya hapsediyor ve
 * kat planları gibi çizimleri sayfa genişliğinin çok altında bırakıyordu.
 *
 * Hepsini tek akışa vermek de çözüm değil: o zaman bir bölüm birkaç
 * kâğıda yayılıyor ve antet ile altbilgi yalnızca ilk ve son kâğıda
 * düşüyor — aradaki sayfalar başlıksız kalıyor. Her çizime bir sayfa
 * ayırmak ikisini birden çözer: çizim sayfa genişliğini kullanır ve her
 * kâğıt kendi antedini ve altbilgisini taşır.
 */
function gorselGrubu(id, baslik, gorseller, aciklama) {
  if (!gorseller.length) return null;
  return {
    id, baslik, numarali: true,
    sayfalar: (no) => gorseller.map((g, i) => `
      ${i === 0
        ? `<h1 style="font-size:18px">${no}. ${kacis(baslik)}</h1>
           ${aciklama ? `<p>${kacis(aciklama)}</p>` : ''}`
        : `<h2>${kacis(baslik)} (devam)</h2>`}
      ${sekil(g)}`),
  };
}

/** Sonuç bölümü; sonuç metni ve öneri yoksa hiç basılmaz. */
function bolumSonucGrubu(ob) {
  const sonuc = String(ob.sonuc || '').trim();
  const oneriler = (ob.oneriler || []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!sonuc && !oneriler.length) return null;

  return {
    id: 'sonuc', baslik: 'Sonuç ve öneriler', numarali: true,
    sayfalar: (no) => [`
      <h1 style="font-size:18px">${no}. Sonuç ve öneriler</h1>
      ${sonuc ? `<p>${kacis(sonuc)}</p>` : ''}
      ${oneriler.length ? `<h2>${no}.1 Uygulama önerileri</h2>
        <ol class="rapor-oneriler">${oneriler.map((o) => `<li>${kacis(o)}</li>`).join('')}</ol>` : ''}`],
  };
}

/* ── Giriş ──────────────────────────────────────────────────────────── */

function bolumGiris(no, p, ob) {
  const ek = String(ob.giris || '').trim() || girisCumlesi(p);

  return `
  <h1 style="font-size:18px">${no}. Giriş</h1>
  <p>${kacis(GIRIS_METNI)}</p>
  ${ek ? `<p>${kacis(ek)}</p>` : ''}

  <h2>${no}.1 Yapı ve parsel bilgileri</h2>
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
  </table></div>`;
}

/** Değeri boş olan künye satırı rapora hiç girmez. */
function satir(etiket, deger) {
  const v = String(deger ?? '').trim();
  return v ? `<tr><th style="text-align:left;width:38%">${kacis(etiket)}</th><td>${kacis(v)}</td></tr>` : '';
}

/* ── İçindekiler ────────────────────────────────────────────────────── */

/**
 * İçindekiler sayfasını üretir.
 *
 * Sayfa numaraları burada YAZILMAZ: kaç kâğıda basılacağı ancak yazdırma
 * düzeninde ölçülerek bilinir (bkz. arayuz/sayfa-numaralari.js). Buraya
 * yalnızca hedef bölümün kimliği konur; numarayı ölçüm doldurur.
 */
export function icindekilerSayfasi(girdiler) {
  return `
  <h1 style="font-size:18px">İçindekiler</h1>
  <table class="icindekiler"><tbody>
    ${girdiler.map((g) => `<tr>
      <td class="ic-baslik">${g.no ? `${g.no}. ` : ''}${kacis(g.baslik)}</td>
      <td class="ic-nokta"><span></span></td>
      <td class="ic-sayfa" data-bolum-ref="${kacis(g.id)}">—</td>
    </tr>`).join('')}
  </tbody></table>
  <p class="soluk" style="font-size:12px;margin-top:10px">
    Sayfa numaraları, raporun yazdırma düzenine göre hesaplanır.</p>`;
}

/* ── Çevresel gürültü ───────────────────────────────────────────────── */

function bolumCevresel(no, ob) {
  const d = cevreselDegerlendirme(ob.cevresel || {});

  return `
  <h1 style="font-size:18px">${no}. Çevresel gürültü</h1>
  <p>Parselin bulunduğu alan <b>${kacis(d.alan.ad)}</b> olarak değerlendirilmiştir.
    Çevredeki yollar ${d.mevcutYol ? 'mevcuttur' : 'henüz yapılmamış (planlanmış) yollardır'};
    sınır değerler buna göre okunmuştur.</p>

  <h2>${no}.1 Çevresel gürültü sınır değerleri</h2>
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

  <h2>${no}.2 Parselde kabul edilen gürültü düzeyleri</h2>
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

/* ── Şekiller ───────────────────────────────────────────────────────── */

/** Numaralı bir şekil bloğu (görsel + alt yazı). */
function sekil(g) {
  return `
  <figure class="rapor-sekil">
    ${g.veri ? `<img src="${kacis(g.veri)}" alt="${kacis(g.baslik || g.etiket)}">`
             : '<div class="rapor-sekil-bos">Görsel yüklenmedi</div>'}
    <figcaption>${kacis(g.etiket)}${g.baslik ? ` (${kacis(g.baslik)})` : ''}${
      g.aciklama ? ` — ${kacis(g.aciklama)}` : ''}</figcaption>
  </figure>`;
}

/** Uzman belgesi; sayfayı dolduracak biçimde, şekil numarası olmadan basılır. */
function belgeGorseli(g) {
  return `
  <figure class="rapor-sekil belge-gorsel">
    ${g.veri ? `<img src="${kacis(g.veri)}" alt="${kacis(g.etiket)}">`
             : '<div class="rapor-sekil-bos">Belge yüklenmedi</div>'}
    ${g.aciklama ? `<figcaption>${kacis(g.aciklama)}</figcaption>` : ''}
  </figure>`;
}

/* ── Yapı elemanı anahtarı ve mekân dereceleri ──────────────────────── */

function bolumAnahtar(no, s, ob) {
  const anahtar = yapiElemaniAnahtari(s);
  const mekanlar = mekanDereceleri(s);

  return `
  <h1 style="font-size:18px">${no}. Yapı elemanları ve mekân dereceleri</h1>

  <h2>${no}.1 Yapı elemanı kod anahtarı</h2>
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

  <h2>${no}.2 Gürültülülük düzeyi ve hassasiyet dereceleri</h2>
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

/* ── Malzeme özellikleri ────────────────────────────────────────────── */

function bolumMalzeme(no, s) {
  const malzemeler = malzemeYogunluklari(s);
  return `
  <h1 style="font-size:18px">${no}. Malzeme özellikleri</h1>
  <h2>${no}.1 Malzeme birim hacim ağırlıkları</h2>
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
