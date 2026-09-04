/**
 * sekme-rapor.js — Yazdırılabilir akustik rapor.
 *
 * Her ayırıcı eleman kaydı için, "Katmanlı Model v3" biçimine uygun tam bir
 * rapor sayfası üretir: sonuç şeridi, mekân geometrisi + izometrik şema,
 * ayırıcı eleman katman reçetesi, dört yan elemanın katman özeti, ses
 * iletim yollarının payları, yöntem notu ve (hedef sağlanmıyorsa) bir
 * uzman tavsiyesi. Birden fazla ayırıcı varsa her biri ayrı bir sayfa
 * olarak (yazdırmada sayfa sonuyla) art arda dizilir. Döşeme/cephe/hacim
 * kayıtları varsa, ayrıca daha yalın bir ek bölümde özetlenir.
 */

import { kacis, sayi, uygunlukRozeti, sinifRozeti } from './ortak.js';
import { SURUM, BINA_TURLERI, ASGARI_SINIFLAR, HASSASIYET_DERECELERI } from '../veri/yonetmelik.js';
import { MODELLER } from '../cekirdek/kutle-kanunu.js';
import { OKTAV_BANTLARI } from '../cekirdek/temel.js';
import { odaSVG, cepheSVG } from './oda-cizimi.js';
import { YON_ADLARI } from '../cekirdek/geometri.js';
import { katmanDizilimiMetni } from '../cekirdek/katmanli-eleman.js';
import { YALITIM_LEVHALARI, bul } from '../veri/malzemeler.js';
import { xlsxOlustur, blobIndir, STIL } from './xlsx-yazici.js';
import { LISANS, telifSatiri } from '../veri/lisans.js';
import { adaParselMetni, adresMetni, alanMetni } from '../durum.js';
import { SINIFLAR, EK2_TABLO_2_2 } from '../veri/yonetmelik.js';
import { belgeVerisi } from '../cekirdek/performans-belgesi.js';
import { onBolumGruplari, icindekilerSayfasi } from './rapor-onbolum-sayfalari.js';
import { kapakSayfasi, arkaKapakSayfasi } from './rapor-kapak.js';

const dolguBul = (id) => bul(YALITIM_LEVHALARI, id);

export function ciz(durum, s) {
  const p = durum.proje;
  const sayfalar = raporSayfalari(durum, s);

  return `
  <div class="yazdirma-gizle" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    <button class="dugme" data-eylem="pdfe-aktar">Raporu PDF'e aktar</button>
    <button class="dugme acik" data-eylem="excel-indir">Sınır değer tablosunu Excel'e aktar</button>
    <span class="soluk" style="align-self:center;font-size:12.5px">Windows uygulamasında PDF doğrudan kaydedilir; tarayıcıda hedef olarak "PDF olarak kaydet" seçilir.</span>
  </div>

  ${sayfalar.map((x) => x.html).join('')}`;
}

/**
 * Raporun bütün sayfalarını sırayla üretir.
 *
 * İki uçlu bir bağımlılık var: içindekiler bölüm listesini bilmeli, ama
 * bölüm başlıkları da numarayı bilmeli. Bu yüzden önce bölüm listesi
 * (üstveri) kuruluyor, numaralar sırayla veriliyor, sonra HTML üretiliyor.
 * Boş bölüm hiç oluşmadığı için numaralar kendiliğinden sıkışıyor ve
 * içindekiler ile başlıkların ayrışması olanaksız hâle geliyor.
 *
 * Her sayfaya `data-bolum-id` yazılır; içindekilerin sayfa numaraları
 * bunlara bakılarak ölçülür (bkz. arayuz/sayfa-numaralari.js).
 *
 * @returns {Array<{id:string, html:string}>}
 */
export function raporSayfalari(durum, s) {
  const p = durum.proje;
  const gruplar = [...onBolumGruplari(p, s, durum.onbolum), ...hesapGruplari(p, s)];

  // Numaralandırma: yalnızca `numarali` bölümler sayıya girer.
  let no = 0;
  const numarali = gruplar.map((g) => ({ ...g, no: g.numarali ? (no += 1) : null }));

  const sayfalar = [];
  /**
   * @param {boolean} hazir Hesap sayfaları antet ve altbilgiyi kendi
   *   içeriklerinde taşır; onlara ikinci kez sarılmaz.
   */
  const ekle = (id, icerik, { hazir = false, ekSinif = '' } = {}) => {
    const ilk = sayfalar.length === 0;
    const sinif = ['rapor', ilk ? '' : 'rapor-sayfa-sonu', ekSinif].filter(Boolean).join(' ');
    sayfalar.push({
      id,
      html: `<div class="${sinif}" data-bolum-id="${kacis(id)}">
        ${hazir ? icerik : `${antet(p)}${icerik}${altbilgi(p, false)}`}</div>`,
    });
  };

  /*
   * Kapak raporun ilk, arka kapak son sayfasıdır. İkisi de antet ve
   * altbilgi taşımaz (kendi tasarımları var) ve içindekilerde listelenmez —
   * ama sayfa sayımına girerler, bu yüzden içindekiler kapaktan sonrasını
   * doğru numaralar.
   */
  ekle('kapak', kapakSayfasi(p), { hazir: true, ekSinif: 'kapak-sayfa' });

  if (numarali.length) {
    ekle('icindekiler', icindekilerSayfasi(
      numarali.map((x) => ({ id: x.id, no: x.no, baslik: x.baslik }))));
  }

  for (const g of numarali) {
    const secenek = { hazir: !!g.hazir, ekSinif: g.ekSinif || '' };
    g.sayfalar(g.no).forEach((icerik, i) => ekle(i === 0 ? g.id : `${g.id}-${i}`, icerik, secenek));
  }

  ekle('arkaKapak', arkaKapakSayfasi(), { hazir: true, ekSinif: 'kapak-sayfa' });
  return sayfalar;
}

/**
 * Hesap sayfalarını ön bölümle aynı grup biçiminde sarar.
 *
 * Bu sayfalar kendi `.rapor` kabuklarını üretiyor; buradaki sarmalayıcı
 * yalnızca içindekiler için başlık ve kimlik sağlıyor, dolayısıyla ham
 * HTML olduğu gibi taşınıyor.
 */
function hesapGruplari(p, s) {
  const gruplar = [];

  if (s.ayiricilar.length) {
    gruplar.push({
      id: 'ayiricilar', baslik: 'Ayırıcı elemanlarda hava doğuşlu ses yalıtımı', numarali: true, hazir: true,
      sayfalar: () => s.ayiricilar.map((a, i) => icerikCikar(ayiriciRaporu(p, a, i, s.ayiricilar.length))),
    });
  }
  if (s.darbeler.length) {
    gruplar.push({
      id: 'darbeler', baslik: 'Döşemelerde darbe sesi yalıtımı', numarali: true, hazir: true,
      sayfalar: () => s.darbeler.map((x) => icerikCikar(darbeRaporu(p, x))),
    });
  }
  if (s.cepheler.length) {
    gruplar.push({
      id: 'cepheler', baslik: 'Cephede ses yalıtımı', numarali: true, hazir: true,
      sayfalar: () => s.cepheler.map((x, i) => icerikCikar(cepheRaporu(p, x, i))),
    });
  }
  const ozet = ekBolumler(p, s);
  if (ozet) {
    gruplar.push({ id: 'ozet', baslik: 'Hesap özetleri', numarali: true, hazir: true,
      sayfalar: () => [icerikCikar(ozet)] });
  }
  gruplar.push({ id: 'belge', baslik: 'Akustik performans belgesi (EK-10)', numarali: false, hazir: true,
    sayfalar: () => [icerikCikar(performansBelgesi(p, s))], ekSinif: 'belge' });

  return gruplar;
}

/**
 * Hazır bir `.rapor` kabuğundan iç içeriği çıkarır.
 *
 * Hesap sayfaları antet ve altbilgiyi kendileri sarıyor; sayfa üreticisi
 * bunları yeniden saracağı için dış kabuk ve tekrar eden antet/altbilgi
 * ayıklanır. Böylece hesap sayfalarının kendi kodu değişmeden kalır.
 */
function icerikCikar(html) {
  const bas = html.indexOf('>', html.indexOf('<div class="rapor'));
  const son = html.lastIndexOf('</div>');
  return bas < 0 || son < 0 ? html : html.slice(bas + 1, son);
}

/* ── Antet ────────────────────────────────────────────────────────── */

function antet(p) {
  return `
  <div class="rapor-antet">
    <div class="rapor-antet-marka">
      <span class="rapor-antet-logo"><img src="assets/logo.png" alt="SAGG"></span>
      <div>
        <div class="rapor-antet-sirket">${kacis(p.sirket || 'SAGG İnşaat Mimarlık Akustik')}</div>
        ${p.unvan ? `<div class="rapor-antet-unvan">${kacis(p.unvan)}</div>` : ''}
        ${p.akustikUzman ? `<div class="rapor-antet-unvan">MİMAR ${kacis(p.akustikUzman.toLocaleUpperCase('tr'))}</div>` : ''}
      </div>
    </div>
    <div class="rapor-antet-kod">
      <span class="etiket">Rapor kodu</span>
      <span class="deger">${kacis(p.kod || '—')}</span>
      <span class="tarih">${kacis(p.tarih || '')}</span>
    </div>
  </div>`;
}

/* ── Ayırıcı eleman raporu (bir sayfa) ───────────────────────────── */

function ayiriciRaporu(p, a, indeks, toplam) {
  const d = a.degerlendirme;
  const asgari = ASGARI_SINIFLAR[p.durum] || 'C';
  const geo = a.kayit.geometri;
  const boyutMi = geo?.mod === 'olculer';
  const { oda1Adi, oda2Adi } = odaAdlariCoz(a.kayit.ad, geo, d);

  return `
  <div class="rapor${indeks > 0 ? ' rapor-sayfa-sonu' : ''}">
    ${antet(p)}

    <p class="rapor-kategori">KATMANLI YAPI ELEMANI · TS EN 12354-1 ÖN BOYUTLANDIRMA</p>
    <h1>${kacis(p.ad || 'Adsız proje')}</h1>
    <p class="soluk">${kacis(a.kayit.ad)} — kaynak ve alıcı mekân geometrisi, ayırıcı eleman ile yan elemanların katman reçeteleri ve hesaplanan ses iletim yolları.</p>

    <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
      <div class="hucre"><span class="etiket">Sonuç</span>
        <span class="deger" style="font-size:16px;color:${d?.uygun ? 'var(--basari)' : 'var(--hata)'}">${d ? (d.uygun ? 'SAĞLIYOR' : 'SAĞLAMIYOR') : '—'}</span></div>
      <div class="hucre one-cikan"><span class="etiket">D<sub>nT,w</sub></span><span class="deger">${sayi(a.sonuc.DnTw)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">${d?.hedefKaynagi === 'manuel' ? 'Manuel hedef' : 'Yönetmelik hedefi'}</span><span class="deger">${d ? `≥ ${sayi(d.gereken, 0)}` : '—'} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">R′<sub>w</sub></span><span class="deger">${sayi(a.sonuc.RwAksan)} <small>dB</small></span></div>
    </div>

    <div class="rapor-kunye-tablo">
      <div><b>Proje müellifi</b><span>${kacis(p.muellif || '—')}</span></div>
      <div><b>Akustik uzman</b><span>${kacis(p.akustikUzman || '—')}</span></div>
      <div><b>İşveren</b><span>${kacis(p.isveren || '—')}</span></div>
      <div><b>Ada / parsel</b><span>${kacis(adaParselMetni(p) || '—')}</span></div>
      ${adresMetni(p) ? `<div><b>Yapı yeri</b><span>${kacis(adresMetni(p))}</span></div>` : ''}
      ${alanMetni(p) ? `<div><b>İnşaat alanı</b><span>${kacis(alanMetni(p))}</span></div>` : ''}
      <div><b>Yapı kapsamı</b><span>${kacis(BINA_TURLERI[p.binaTuru] || p.binaTuru)} · ${kacis(durumMetni(p.durum))}</span></div>
      <div><b>Hedef sınıf</b><span>${kacis(p.hedefSinif)} sınıfı (asgari ${kacis(asgari)})</span></div>
      <div><b>Kaynak mekân</b><span>${kacis(d?.kaynakMekan?.ad || '—')}</span></div>
      <div><b>Alıcı mekân</b><span>${kacis(d?.aliciMekan?.ad || '—')}</span></div>
      <div><b>Gereksinim tablosu</b><span>${kacis(d?.tabloAdi || '—')}${d?.komsuluk
        ? ` · ${kacis(d.komsuluk.kaynak)} → ${kacis(d.komsuluk.alici)}` : ''}</span></div>
    </div>

    <h2>1. Mekân geometrisi</h2>
    ${boyutMi ? `
    <div class="tablo-sar"><table>
      <thead><tr><th></th><th>Oda 1 / Kaynak</th><th>Oda 2 / Alıcı</th></tr></thead>
      <tbody>
        <tr><td>Mekân</td><td>${kacis(oda1Adi.toLocaleUpperCase('tr'))}</td><td>${kacis(oda2Adi.toLocaleUpperCase('tr'))}</td></tr>
        <tr><td>L × W × H</td><td>${boyutSatiri(geo.oda1)}</td><td>${boyutSatiri(geo.oda2)}</td></tr>
        <tr><td>Hacim</td><td>${sayi(geo.oda1.L * geo.oda1.W * geo.oda1.H)} m³</td><td>${sayi(geo.oda2.L * geo.oda2.W * geo.oda2.H)} m³</td></tr>
      </tbody>
    </table></div>
    <div class="rapor-kunye-tablo" style="margin-top:10px">
      <div><b>Ortak (ayırıcı) alan S</b><span style="font-size:16px;font-weight:700">${sayi(a.geo?.S)} m²</span></div>
      <div><b>Seçilen yüzey</b><span>${kacis(YON_ADLARI[geo.yon] || '—')}</span></div>
      ${a.geo && !a.geo.tamOrtusme && a.geo.temasVar ? `
      <div><b>Kaydırma</b><span>${sayi(a.geo.kaydirmaA)} m / ${sayi(a.geo.kaydirmaB)} m</span></div>
      <div><b>Ortak olmayan yüzey</b><span>kaynak ${sayi(a.geo.oda1OrtakOlmayan)} m² · alıcı ${sayi(a.geo.oda2OrtakOlmayan)} m²</span></div>` : ''}
    </div>
    ${a.geo && !a.geo.temasVar ? `
    <div class="bilgi-kutu kirmizi">
      <b>Mekânlar bu yüzde temas etmiyor.</b> Kaydırma iki odanın örtüşmesini tamamen
      ortadan kaldırdığı için ortak alan 0 m²'dir; aralarında ayırıcı eleman yoktur ve
      aşağıdaki hesap anlamlı değildir.
    </div>` : a.geo && !a.geo.tamOrtusme ? `
    <p class="soluk" style="font-size:12.5px">
      Mekânlar ayırıcı düzlem üzerinde kaydırılmıştır. Hesap yalnızca örtüşen
      <b>${sayi(a.geo.ortakA)} × ${sayi(a.geo.ortakB)} = ${sayi(a.geo.S)} m²</b>'lik ortak
      yüzey üzerinden yapılmıştır; bu yüzeyin dışında kalan kısımlar ilgili odanın kendi
      yan duvarı/döşemesidir ve iki mekân arasında iletim yolu oluşturmaz.
    </p>` : ''}
    <div class="canli-model yazdirma-goster">
      <div class="canli-model-baslik"><span class="canli-model-nokta"></span> Canlı 3B model</div>
      <div style="padding:6px">${odaSVG(geo, { oda1Adi, oda2Adi, genislik: 720, yukseklik: 320 })}</div>
    </div>` : `
    <div class="rapor-kunye-tablo">
      <div><b>Ayırıcı elemanın ortak alanı S</b><span>${sayi(a.kayit.S)} m²</span></div>
      <div><b>Alıcı mekân hacmi V</b><span>${sayi(a.kayit.V, 0)} m³</span></div>
    </div>
    <p class="soluk" style="font-size:12.5px">Bu ayırıcı eleman için oda boyutlarından hesaplama kullanılmamıştır; alan ve hacim elle girilmiştir.</p>`}

    <h2>2. Ayırıcı eleman katmanları</h2>
    ${katmanTablosu(a.ana)}

    <h2>3. Yan eleman katman özetleri</h2>
    ${yanElemanTablosu(a.yanElemanlar)}

    <h2>4. Ses iletim yolları</h2>
    <div class="tablo-sar"><table>
      <thead><tr><th>Yol</th><th class="sayi">Yalıtım R</th><th class="sayi">Enerji payı</th></tr></thead>
      <tbody>${a.sonuc.yollar.map((y) => `<tr><td>${kacis(y.ad)}</td><td class="sayi">${sayi(y.R)} dB</td><td class="sayi">%${sayi(y.payYuzde, 1)}</td></tr>`).join('')}</tbody>
    </table></div>

    <h2>5. Yöntem ve doğrulama notu</h2>
    <p style="font-size:13px">
      Hava doğuşlu ses yalıtımı; doğrudan Dd yolu ile Ff, Fd ve Df yan yollarının enerjik toplamı kullanılarak
      TS EN 12354-1 basitleştirilmiş tek sayılı modele göre hesaplanmıştır. Kij titreşim azaltma indisleri
      T/X birleşim seçimine göre değerlendirilmiştir. Beyan edilmiş sistem değeri bulunmayan katmanlı
      elemanlarda Rw, toplam alan kütlesi üzerinden ${kacis(MODELLER[p.rwModeli]?.ad || p.rwModeli)} kestirimiyle hesaplanır.
      Bu, resmî işlem öncesinde doğrulanması gereken bir ön boyutlandırma sonucudur (${kacis(SURUM.dogrulama)}).
    </p>

    ${uzmanTavsiyesi(a)}

    ${altbilgi(p)}
  </div>`;
}

/**
 * Raporun her sayfasında yinelenen altbilgi: hazırlayan, program künyesi ve
 * lisans / sorumluluk ibareleri.
 */
/**
 * Sayfa altbilgisi.
 *
 * Program lisans künyesi YALNIZCA hesap sayfalarında basılır: hesabı
 * üreten programın kim olduğu ve sorumluluğun kimde olduğu oralarda
 * anlamlıdır. Anlatı sayfalarında (giriş, paftalar, sonuç) her sayfanın
 * altında yinelenmesi yer kaplıyor ve raporu ağırlaştırıyordu.
 *
 * @param {Object} p
 * @param {boolean} [lisans] Lisans künyesi basılsın mı
 */
function altbilgi(p, lisans = true) {
  return `
  <div class="rapor-altbilgi">
    <span>Hazırlayan: ${kacis(p.akustikUzman || '—')}</span>
    <span>SAGG Akustik Hesap Paneli · Katmanlı Model v3</span>
  </div>
  ${lisans ? lisansKunyesi(p) : ''}`;
}

/** Program lisans ve sorumluluk künyesi. */
function lisansKunyesi(p) {
  return `
  <div class="rapor-lisans">
    <div class="rapor-lisans-satir"><b>Program lisans sahibi</b><span>${kacis(LISANS.sahip)}</span></div>
    <div class="rapor-lisans-satir"><b>Program geliştirici</b><span>${kacis(LISANS.gelistirici)}</span></div>
    <p class="rapor-lisans-telif">${kacis(telifSatiri(p.tarih))}</p>
    <p class="rapor-lisans-sorumluluk">${kacis(LISANS.sorumluluk)}</p>
  </div>`;
}

/**
 * Raporda gösterilecek mekân adlarını çözer.
 *
 * Öncelik sırası: geometriye girilen mekân adı → ayırıcının adı (yalnızca
 * "Kaynak → Alıcı" biçimindeyse) → mekân kullanım türünün adı → genel yedek.
 *
 * Ayırıcının adı, ancak ok işaretiyle GERÇEKTEN iki parçaya bölünüyorsa
 * kullanılır; aksi hâlde "ID1" gibi bir rapor kodu kaynak oda adı olarak
 * görünüyordu.
 *
 * @param {string} ayiriciAdi
 * @param {Object} geo Ayırıcının ham geometri kaydı ({oda1,oda2} taşıyabilir)
 * @param {Object} d   Değerlendirme (kaynakMekan / aliciMekan taşır)
 */
export function odaAdlariCoz(ayiriciAdi, geo, d) {
  const parcalar = String(ayiriciAdi || '').split(/→|->/).map((x) => x.trim()).filter(Boolean);
  const ikiParca = parcalar.length === 2;
  return {
    oda1Adi: geo?.oda1?.ad || (ikiParca ? parcalar[0] : '') || d?.kaynakMekan?.ad || 'Oda 1 / Kaynak',
    oda2Adi: geo?.oda2?.ad || (ikiParca ? parcalar[1] : '') || d?.aliciMekan?.ad || 'Oda 2 / Alıcı',
  };
}

function boyutSatiri(oda) {
  return `${sayi(oda.L)} × ${sayi(oda.W)} × ${sayi(oda.H)} m`;
}

function durumMetni(kod) {
  return { yeniBina: 'Yeni yapılacak bina', kullanimAmaciDegisikligi: 'Mevcut binada kullanım amacı değişikliği', esasliTadilat: 'Mevcut binada esaslı tadilat' }[kod] || kod;
}

function katmanTablosu(ana) {
  const kd = ana.katmanDetay;
  if (!kd || !kd.katmanDetaylari?.length) {
    return `<div class="rapor-kunye-tablo">
      <div><b>Yapı elemanı</b><span>${kacis(ana.ad)}</span></div>
      <div><b>Kaynak</b><span>${kacis(ana.kaynak)}</span></div>
      <div><b>Alan kütlesi m′</b><span>${sayi(ana.mAlan)} kg/m²</span></div>
      <div><b>Rw</b><span>${sayi(ana.Rw)} dB</span></div>
    </div>
    <p class="soluk" style="font-size:12px">Bu eleman için katmanlı yapı yerine kütüphaneden basit malzeme seçimi kullanılmıştır.</p>`;
  }
  const toplamKalinlik = kd.katmanDetaylari.reduce((t, x) => t + (Number(x.katman.kalinlik) || 0), 0);
  return `
  ${katmanSeridiHtml(kd.katmanDetaylari.map((x) => x.katman))}
  <div class="tablo-sar"><table>
    <thead><tr><th>#</th><th>Malzeme</th><th>Kalınlık</th><th>Yoğunluk</th><th>Alan kütlesi</th></tr></thead>
    <tbody>
      ${kd.katmanDetaylari.map((x, i) => `<tr>
        <td>${i + 1}</td>
        <td>${kacis(x.katman.tur === 'bosluk' ? (dolguBul(x.katman.dolguId)?.ad || 'Boşluk') : (x.katman.ad || '—'))}</td>
        <td>${sayi(x.katman.kalinlik, x.katman.kalinlik < 10 ? 1 : 0)} mm</td>
        <td>${x.katman.tur === 'bosluk' ? '—' : `${sayi(x.katman.yogunluk, 1)} kg/m³`}</td>
        <td>${sayi(x.mAlan)} kg/m²</td>
      </tr>`).join('')}
      <tr style="font-weight:700"><td colspan="2">Toplam</td><td>${sayi(toplamKalinlik, 0)} mm</td><td></td><td>${sayi(kd.mAlan)} kg/m²</td></tr>
    </tbody>
  </table></div>
  ${kd.tur === 'ikiKabuk' ? `<p class="soluk" style="font-size:12px">İki kabuklu (kavite ayrılmış) sistem: taban Rw = ${sayi(kd.RwTaban)} dB, kavite bonusu +${sayi(kd.dRKavite)} dB (f₀ = ${sayi(kd.f0, 0)} Hz) → Rw = ${sayi(kd.Rw)} dB.</p>` : ''}`;
}

function katmanSeridiHtml(katmanlar) {
  const toplam = katmanlar.reduce((t, k) => t + (Number(k.kalinlik) || 0), 0);
  if (!(toplam > 0)) return '';
  const renkler = { masif: '#8a94a3', siva: '#d8c9a8', bosluk: '#5fb8ad' };
  return `<div class="katman-seridi">${katmanlar.map((k) => {
    const kalinlik = Number(k.kalinlik) || 0;
    const yuzde = (kalinlik / toplam) * 100;
    const etiket = kacis((k.ad || 'Boşluk').toLocaleUpperCase('tr'));
    return `<div class="katman-seridi-parca" style="width:${yuzde}%;background:${renkler[k.tur] || '#ccc'}" title="${etiket} — ${sayi(kalinlik, 0)} mm">
      <span>${sayi(kalinlik, kalinlik < 10 ? 1 : 0)} mm${yuzde >= 9 ? ` ${etiket}` : ''}</span>
    </div>`;
  }).join('')}</div>`;
}

function yanElemanTablosu(yanElemanlar) {
  const ADLAR = ['F1', 'F2', 'F3', 'F4'];
  return `<div class="tablo-sar"><table>
    <thead><tr><th>Yüzey</th><th>Katman dizilimi</th><th class="sayi">m′</th><th class="sayi">Rw</th><th>Birleşim</th></tr></thead>
    <tbody>${yanElemanlar.map((y, i) => {
      const katmanlar = y._cozum.katmanDetay?.katmanDetaylari?.map((x) => x.katman);
      const dizilim = katmanlar?.length ? katmanDizilimiMetni(katmanlar, dolguBul) : y._cozum.ad;
      return `<tr>
        <td>${kacis(ADLAR[i] || `F${i + 1}`)} — ${kacis(y.ad)}</td>
        <td style="max-width:420px">${kacis(dizilim)}</td>
        <td class="sayi">${sayi(y.mKaynak)}</td>
        <td class="sayi">${sayi(y.RwKaynak)}</td>
        <td>${kacis(y.birlesim)}${y.esnekBaglanti ? ' / esnek' : ''}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

/** Hedef sağlanmıyorsa, baskın iletim yoluna göre uyarlanmış bir tavsiye üretir. */
function uzmanTavsiyesi(a) {
  const d = a.degerlendirme;
  if (!d || d.uygun) return '';
  const acik = Math.max(0, -(d.fark ?? 0));
  const gerekliIyilestirme = Math.ceil(acik + 2); // +2 dB güvenlik payı
  const enBuyukYol = a.sonuc.yollar[0];
  const dogrudanMi = !enBuyukYol || enBuyukYol.tip === 'Dd';

  const metin = dogrudanMi
    ? `Öncelik ayırıcı elemanın doğrudan yoludur${enBuyukYol ? ` (enerji payı %${sayi(enBuyukYol.payYuzde, 0)})` : ''}. Alıcı oda tarafında mevcut elemana rijit temas etmeyen bağımsız metal karkas, boşlukta mineral yün ve çift kat yüksek yoğunluklu alçı levhadan oluşan ölçülmüş bir giydirme sisteminin uygulanması en pratik çözümdür. Seçilecek sistemin beyan edilmiş iyileştirmesi en az ${gerekliIyilestirme} dB olmalıdır.`
    : `Baskın iletim yolu ${kacis(enBuyukYol.ad)} üzerinden geçmektedir (enerji payı %${sayi(enBuyukYol.payYuzde, 0)}). Yalnızca doğrudan yolu iyileştirmek yeterli olmayacaktır; öncelik bu yan elemanın titreşim azaltma indisini artırmaya (esnek/kesintili birleşim, giydirme kabuk veya kütle artışı) verilmelidir. Hedeflenen toplam iyileştirme en az ${gerekliIyilestirme} dB'dir.`;

  return `
  <h2>6. Uzman tavsiyesi</h2>
  <div class="bilgi-kutu sari">
    ${metin}
    <br><small>Bu öneri, hesaplanan iletim yollarına dayalı otomatik oluşturulmuş bir başlangıç noktasıdır;
    nihai çözüm yetkili akustik uzmanın saha koşullarını değerlendiren kararına bağlıdır.</small>
  </div>`;
}

/* ── Darbe sesi — kendi sayfasında ───────────────────────────────── */

/**
 * Darbe sesi kaydının canlı 3B mahal şeması.
 *
 * Ayırıcı eleman ve cephe sayfalarında olduğu gibi burada da şema bulunur.
 * Üç geometri kipinin ikisinde çizilebilir:
 *   'iki-oda' → üst ve alt mekân, aralarındaki kaydırmayla birlikte
 *   'olculer' → yalnızca alıcı (alt) mekân bilindiğinden üst mekân aynı
 *               boyutta varsayılıp döşeme düzlemi gösterilir
 * 'hacim' kipinde ölçü olmadığı için şema üretilemez.
 */
function darbeSemasi(k) {
  const g = k.geometri;
  if (!g) return '';

  let cizim, oda1Adi, oda2Adi;
  if (g.mod === 'iki-oda' && g.ustOda && g.altOda) {
    cizim = { oda1: g.ustOda, oda2: g.altOda, yon: 'taban',
      kaydirmaA: g.kaydirmaA, kaydirmaB: g.kaydirmaB };
    oda1Adi = g.ustOda.ad || 'Üst mekân (kaynak)';
    oda2Adi = g.altOda.ad || 'Alt mekân (alıcı)';
  } else if (g.mod === 'olculer' && Number(g.L) > 0) {
    const oda = { L: g.L, W: g.W, H: g.H };
    cizim = { oda1: oda, oda2: oda, yon: 'taban' };
    oda1Adi = 'Üst mekân (kaynak)';
    oda2Adi = 'Alt mekân (alıcı)';
  } else {
    return '';
  }

  return `
    <div class="canli-model yazdirma-goster">
      <div class="canli-model-baslik"><span class="canli-model-nokta"></span> Canlı 3B model</div>
      <div style="padding:6px">${odaSVG(cizim, {
        oda1Adi, oda2Adi, genislik: 720, yukseklik: 330,
      })}</div>
    </div>`;
}

/** Tek bir döşeme (darbe sesi) kaydının rapor sayfası. */
function darbeRaporu(p, x) {
  const k = x.kayit, d = x.degerlendirme, so = x.sonuc, geo = x.geo;
  const ikiOda = k.geometri?.mod === 'iki-oda';
  const ust = k.geometri?.ustOda, alt = k.geometri?.altOda;

  return `
  <div class="rapor rapor-sayfa-sonu">
    ${antet(p)}

    <p class="rapor-kategori">DÖŞEMEDE DARBE SESİ YALITIMI · TS EN 12354-2</p>
    <h1>${kacis(p.ad || 'Adsız proje')}</h1>
    <p class="soluk">${kacis(k.ad)} — mahal geometrisi, taşıyıcı döşeme, kaplama ve hesaplanan
      darbe sesi düzeyi.</p>

    <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
      <div class="hucre"><span class="etiket">Sonuç</span>
        <span class="deger" style="font-size:16px;color:${d?.uygun ? 'var(--basari)' : 'var(--hata)'}">${d ? (d.uygun ? 'SAĞLIYOR' : 'SAĞLAMIYOR') : '—'}</span></div>
      <div class="hucre one-cikan"><span class="etiket">L′<sub>nT,w</sub></span>
        <span class="deger">${sayi(so.LnTw)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">${d?.hedefKaynagi === 'manuel' ? 'Manuel sınır' : 'Yönetmelik sınırı'}</span>
        <span class="deger">${d ? `≤ ${sayi(d.gereken, 0)}` : '—'} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">Sınıf</span>
        <span class="deger">${d?.eldeEdilenSinif || '—'}</span></div>
    </div>

    <div class="rapor-kunye-tablo">
      <div><b>Üst (kaynak) mekân</b><span>${kacis(d?.ustMekan?.ad || '—')}</span></div>
      <div><b>Alt (alıcı) mekân</b><span>${kacis(d?.altMekan?.ad || '—')}</span></div>
      <div><b>Gereksinim tablosu</b><span>${kacis(d?.tabloAdi || '—')}</span></div>
    </div>

    <h2>1. Mahal geometrisi</h2>
    ${ikiOda && geo ? `
    <div class="tablo-sar"><table>
      <thead><tr><th></th><th>Üst mekân (kaynak)</th><th>Alt mekân (alıcı)</th></tr></thead>
      <tbody>
        <tr><td>Mekân</td><td>${kacis(ust.ad || d?.ustMekan?.ad || '—')}</td><td>${kacis(alt.ad || d?.altMekan?.ad || '—')}</td></tr>
        <tr><td>L × W × H</td><td>${boyutSatiri(ust)}</td><td>${boyutSatiri(alt)}</td></tr>
        <tr><td>Hacim</td><td>${sayi(geo.V1, 1)} m³</td><td><b>${sayi(geo.V, 1)} m³</b></td></tr>
      </tbody>
    </table></div>
    <div class="rapor-kunye-tablo">
      <div><b>Ortak döşeme alanı</b><span>${geo.temasVar ? `${sayi(geo.S)} m²` : 'yok — mekânlar örtüşmüyor'}</span></div>
      <div><b>Kaydırma (L / W)</b><span>${sayi(k.geometri.kaydirmaA || 0)} / ${sayi(k.geometri.kaydirmaB || 0)} m</span></div>
    </div>
    ${!geo.temasVar ? `<div class="bilgi-kutu kirmizi">Üst ve alt mekân hiç örtüşmüyor; aralarında ortak
      bir döşeme bulunmadığından bu hesap anlamlı değildir.</div>` : ''}
    ${darbeSemasi(k)}` : `
    <div class="rapor-kunye-tablo">
      <div><b>Alıcı (alt) mekân hacmi V</b><span>${sayi(geo ? geo.V : k.V, 1)} m³</span></div>
      ${k.geometri?.mod === 'olculer'
        ? `<div><b>Alıcı mekân ölçüleri</b><span>${boyutSatiri(k.geometri)}</span></div>` : ''}
    </div>
    <p class="soluk" style="font-size:12.5px">Bu döşeme için üst ve alt mekân ölçüleri ayrı ayrı
      girilmemiştir; bağıntıya giren hacim alıcı (alt) mekânın hacmidir.</p>
    ${darbeSemasi(k)}`}

    <h2>2. Taşıyıcı döşeme ve kaplama</h2>
    <div class="rapor-kunye-tablo">
      <div><b>Taşıyıcı döşeme</b><span>${kacis(x.doseme?.ad || '—')}</span></div>
      <div><b>Alan kütlesi m′</b><span>${sayi(x.doseme?.mAlan, 0)} kg/m²</span></div>
      <div><b>Kaplama / yüzer şap</b><span>${kacis(x.sap?.ad || '—')}</span></div>
      <div><b>Yan duvar ortalama m′</b><span>${sayi(k.mYanOrtalama, 0)} kg/m²</span></div>
    </div>
    ${x.doseme?.katmanlar?.length ? katmanTablosu(x.doseme) : ''}

    <h2>3. Hesap adımları</h2>
    <div class="tablo-sar"><table>
      <thead><tr><th>Adım</th><th>Bağıntı</th><th class="sayi">Değer</th></tr></thead>
      <tbody>
        <tr><td>Çıplak döşeme</td><td>L<sub>n,w,eq</sub> = 164 − 35·lg(m′)</td>
          <td class="sayi">${sayi(so.LnwEq)} dB</td></tr>
        <tr><td>Kaplama iyileştirmesi</td><td>ΔL<sub>w</sub>${k.asmaTavanVar ? ' + asma tavan' : ''}</td>
          <td class="sayi">−${sayi(so.dLwToplam)} dB</td></tr>
        <tr><td>Yan yol düzeltmesi</td><td>K (TS EN 12354-2 Ek-E)</td>
          <td class="sayi">+${sayi(so.K)} dB</td></tr>
        <tr class="belge-toplam"><td><b>Normalize darbe sesi düzeyi</b></td>
          <td>L′<sub>n,w</sub> = L<sub>n,w,eq</sub> − ΔL<sub>w</sub> + K</td>
          <td class="sayi"><b>${sayi(so.LnwAksan)} dB</b></td></tr>
        <tr><td>Hacim düzeltmesi</td><td>−10·lg(0,032·V), V = alıcı mekân</td>
          <td class="sayi">${sayi(so.LnTw - so.LnwAksan - p.emniyetPayi)} dB</td></tr>
        <tr><td>Emniyet payı</td><td>proje geneli</td>
          <td class="sayi">+${sayi(p.emniyetPayi, 1)} dB</td></tr>
        <tr class="belge-toplam"><td><b>Standartlaştırılmış düzey</b></td>
          <td>L′<sub>nT,w</sub></td>
          <td class="sayi"><b>${sayi(so.LnTw)} dB</b></td></tr>
      </tbody>
    </table></div>
    <p class="soluk" style="font-size:12px">
      Bağıntıya yalnızca <b>alıcı (alt) mekânın hacmi</b> girer; ortak döşeme alanı bu
      basitleştirilmiş modelde sonucu değiştirmez, yukarıda projenin geometrik kabulünü
      belgelemek için verilmiştir.
    </p>

    ${altbilgi(p)}
  </div>`;
}

/* ── Cephe — ayırıcı elemanla aynı ayrıntıda, kendi sayfasında ──── */

/**
 * Tek bir cephe kaydının ayrıntılı rapor sayfası.
 *
 * Ayırıcı eleman raporuyla aynı kurguyu izler: sonuç şeridi, mahal
 * geometrisi ve 3B şema, bileşen dökümü, yan yollar, hesap adımları ve
 * yöntem notu. Böylece cephe hesabı da özet bir tablo satırı olmaktan çıkıp
 * denetlenebilir bir belge hâline gelir.
 */
function cepheRaporu(p, x, indeks) {
  const c = x.kayit, d = x.degerlendirme, so = x.sonuc;
  const geo = x.geo;
  const boyutMi = c.geometri?.mod === 'olculer';
  const mekanAdi = d?.mekan?.ad || c.ad;

  return `
  <div class="rapor rapor-sayfa-sonu">
    ${antet(p)}

    <p class="rapor-kategori">CEPHEDE SES YALITIMI · TS EN 12354-3</p>
    <h1>${kacis(p.ad || 'Adsız proje')}</h1>
    <p class="soluk">${kacis(c.ad)} — mahal geometrisi, cephe bileşenleri, iç yan yollar ve
      hesaplanan cephe ses yalıtımı.</p>

    <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
      <div class="hucre"><span class="etiket">Sonuç</span>
        <span class="deger" style="font-size:16px;color:${d?.uygun ? 'var(--basari)' : 'var(--hata)'}">${d ? (d.uygun ? 'SAĞLIYOR' : 'SAĞLAMIYOR') : '—'}</span></div>
      <div class="hucre one-cikan"><span class="etiket">D<sub>nT,A,tr</sub></span>
        <span class="deger">${sayi(so.DnTAtr)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">${d?.hedefKaynagi === 'manuel' ? 'Manuel hedef' : 'Yönetmelik hedefi'}</span>
        <span class="deger">${d ? `≥ ${sayi(d.gereken, 0)}` : '—'} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">D<sub>2m,nT,w</sub></span>
        <span class="deger">${sayi(so.D2mnTw)} <small>dB</small></span></div>
    </div>

    <div class="rapor-kunye-tablo">
      <div><b>Mahal</b><span>${kacis(mekanAdi)}</span></div>
      <div><b>Hassasiyet derecesi</b><span>${kacis(HASSASIYET_DERECELERI[d?.mekan?.hassasiyet] || '—')}</span></div>
      <div><b>Cephe konumu</b><span>${c.konum === 'kose' ? 'Köşe — iki dış duvar (D1 + D2)' : 'Orta — tek dış duvar (D1)'}</span></div>
      <div><b>Çevresel gürültü L<sub>gag</sub></b><span>${sayi(c.disGurultu, 0)} dB</span></div>
      <div><b>Cephe biçimi (ΔL<sub>fs</sub>)</b><span>${sayi(so.dLfs, 1)} dB</span></div>
      <div><b>Sınıf</b><span>${d?.eldeEdilenSinif || '—'}</span></div>
    </div>

    <h2>1. Mahal geometrisi</h2>
    ${boyutMi && geo ? `
    <div class="rapor-kunye-tablo">
      <div><b>Oda ölçüleri (L × W × H)</b><span>${boyutSatiri(c.geometri)}</span></div>
      <div><b>Mahal hacmi V</b><span>${sayi(geo.V, 1)} m³</span></div>
      <div><b>Toplam cephe alanı S</b><span>${sayi(so.S)} m²</span></div>
      ${geo.duvarlar.map((w) => `<div><b>Dış duvar D${w.no} brüt alanı</b><span>${sayi(w.alan)} m²</span></div>`).join('')}
    </div>` : `
    <div class="rapor-kunye-tablo">
      <div><b>Toplam cephe alanı S</b><span>${sayi(so.S)} m²</span></div>
      <div><b>Mahal hacmi V</b><span>${sayi(c.V, 0)} m³</span></div>
    </div>
    <p class="soluk" style="font-size:12.5px">Bu cephe için oda boyutlarından hesaplama kullanılmamıştır;
      alan ve hacim elle girilmiştir. Bu durumda iç yan yollar (Df) hesaba katılmaz.</p>`}

    ${boyutMi ? `
    <div class="canli-model yazdirma-goster">
      <div class="canli-model-baslik"><span class="canli-model-nokta"></span> Mahal şeması</div>
      <div style="padding:6px">${cepheSVG(c, { mekanAdi, genislik: 720, yukseklik: 330 })}</div>
    </div>` : ''}

    <h2>2. Cephe bileşenleri</h2>
    <div class="tablo-sar"><table>
      <thead><tr><th>Bileşen</th><th>Tür</th><th class="sayi">Duvar</th>
        <th class="sayi">Alan S</th><th class="sayi">R<sub>w</sub></th><th class="sayi">Enerji payı</th></tr></thead>
      <tbody>${x.yuzeysel.map((y) => {
        const pay = so.paylar?.find((k) => k.ad === y.ad);
        return `<tr${y.etkin ? '' : ' class="soluk"'}>
          <td>${kacis(y.ad)}</td>
          <td>${y.tur === 'duvar' ? 'Opak duvar' : 'Doğrama'}</td>
          <td class="sayi">D${y.duvarNo}</td>
          <td class="sayi">${sayi(y.S)} m²</td>
          <td class="sayi">${sayi(y.Rw)} dB</td>
          <td class="sayi">${pay ? `%${sayi(pay.payYuzde, 1)}` : (y.etkin ? '—' : 'hesaba girmiyor')}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>

    ${x.kucuk.length ? `
    <h3 style="margin-top:14px">Küçük elemanlar</h3>
    <div class="tablo-sar"><table>
      <thead><tr><th>Eleman</th><th class="sayi">Adet</th><th class="sayi">D<sub>n,e,w</sub></th></tr></thead>
      <tbody>${x.kucuk.map((k) => `<tr><td>${kacis(k.ad)}</td>
        <td class="sayi">${sayi(k.adet, 0)}</td><td class="sayi">${sayi(k.Dnew, 0)} dB</td></tr>`).join('')}</tbody>
    </table></div>` : ''}

    <h2>3. Ses iletim yolları</h2>
    <div class="tablo-sar"><table>
      <thead><tr><th>Yol</th><th class="sayi">Yalıtım R</th><th class="sayi">Enerji payı</th></tr></thead>
      <tbody>${(so.yolPaylari || []).map((y) => `<tr>
        <td>${kacis(y.ad)}</td><td class="sayi">${sayi(y.R)} dB</td>
        <td class="sayi">%${sayi(y.payYuzde, 1)}</td></tr>`).join('')}</tbody>
    </table></div>
    ${so.yanYollar?.length ? `
    <p class="soluk" style="font-size:12px">Yan yollarda R = (R<sub>w,dış</sub> + R<sub>w,yan</sub>)/2
      + K<sub>ij</sub> + 10·lg(S / (l<sub>0</sub>·l<sub>f</sub>)) bağıntısı kullanılır.</p>` : `
    <p class="soluk" style="font-size:12px">Bu cephede iç yan yol (Df) hesaplanmamıştır; sonuç yalnızca
      doğrudan bileşik cephe yalıtımına dayanır.</p>`}

    <h2>4. Hesap adımları</h2>
    <div class="tablo-sar"><table>
      <thead><tr><th>Adım</th><th>Bağıntı</th><th class="sayi">Değer</th></tr></thead>
      <tbody>
        <tr><td>Bileşik cephe yalıtımı</td>
          <td>R′<sub>w,bileşik</sub> = −10·lg( Σ S<sub>i</sub>·10<sup>−R<sub>i</sub>/10</sup> / S )</td>
          <td class="sayi">${sayi(so.RwBilesik)} dB</td></tr>
        <tr><td>Yan yollarla görünür yalıtım</td>
          <td>Doğrudan yol ile Df yollarının enerjik toplamı</td>
          <td class="sayi">${sayi(so.RwGorunur)} dB</td></tr>
        <tr><td>Cephe biçimi düzeltmesi</td><td>ΔL<sub>fs</sub></td>
          <td class="sayi">${sayi(so.dLfs, 1)} dB</td></tr>
        <tr><td>Hacim terimi</td><td>10·lg( V / (6·T₀·S) )</td>
          <td class="sayi">${sayi(so.hacimTerimi)} dB</td></tr>
        <tr><td>Emniyet payı</td><td>proje geneli</td>
          <td class="sayi">−${sayi(p.emniyetPayi, 1)} dB</td></tr>
        <tr class="belge-toplam"><td><b>Cephe ses yalıtımı</b></td>
          <td>D<sub>2m,nT,w</sub> = R′<sub>w,görünür</sub> + ΔL<sub>fs</sub> + 10·lg(V/(6·T₀·S)) − emniyet</td>
          <td class="sayi"><b>${sayi(so.D2mnTw)} dB</b></td></tr>
        <tr><td>Spektrum uyarlama terimi</td><td>C<sub>tr</sub></td>
          <td class="sayi">${sayi(so.ctr, 0)} dB</td></tr>
        <tr class="belge-toplam"><td><b>Yönetmelik göstergesi</b></td>
          <td>D<sub>nT,A,tr</sub> = D<sub>2m,nT,w</sub> + C<sub>tr</sub></td>
          <td class="sayi"><b>${sayi(so.DnTAtr)} dB</b></td></tr>
      </tbody>
    </table></div>

    <h2>5. Gereksinim ve yöntem notu</h2>
    <p style="font-size:12.5px">
      Uygunluk kararı <b>EK-3 Tablo 3.1</b> ile <b>D<sub>nT,A,tr</sub></b> üzerinden verilir.
      Gereken değer sabit bir matristen değil, çevresel gürültü düzeyi
      L<sub>gag</sub> = ${sayi(c.disGurultu, 0)} dB'den mekânın hassasiyet derecesine ve hedef sınıfa
      bağlı bir indirim çıkarılarak bulunur:
      <b>${d ? `${sayi(c.disGurultu, 0)} − ${sayi(c.disGurultu - d.gereken, 0)} = ${sayi(d.gereken, 0)} dB` : '—'}</b>.
      ${d?.hedefKaynagi === 'manuel' ? 'Bu kayıtta yönetmelik hedefinin yerine manuel bir hedef girilmiştir.' : ''}
    </p>
    <p class="soluk" style="font-size:12px">
      Hesap TS EN 12354-3'ün basitleştirilmiş tek sayılı modeline dayanır ve ön boyutlandırma
      amaçlıdır; uygunluk beyanı için yerinde ölçüm esastır.
    </p>

    ${altbilgi(p)}
  </div>`;
}

/* ── Döşeme / cephe / hacim — daha yalın ek bölüm ────────────────── */

/**
 * Toplu özet sayfası.
 *
 * Darbe ve cephe kayıtlarının her biri artık kendi ayrıntılı sayfasında yer
 * alıyor; burada yalnızca hepsini bir arada gösteren özet tablolar ve
 * reverberasyon bölümü kalır. Özet tablolar korundu çünkü çok bileşenli
 * projelerde tek bakışta karşılaştırma yapmayı sağlıyorlar.
 */
function ekBolumler(p, s) {
  if (!s.darbeler.length && !s.cepheler.length && !s.hacimler.length) return '';
  return `
  <div class="rapor rapor-sayfa-sonu">
    ${antet(p)}
    <h1 style="font-size:18px">Hesap özetleri</h1>
    <p class="soluk">Döşeme, cephe ve reverberasyon kayıtlarının toplu dökümü. Her döşeme ve
      cephe hesabının ayrıntılı sayfası bu bölümden önce yer alır.</p>
    ${bolumDarbe(s)}
    ${bolumCephe(s)}
    ${bolumReverberasyon(s)}
    ${altbilgi(p)}
  </div>`;
}

function bolumDarbe(s) {
  if (!s.darbeler.length) return '';
  return `
  <h2>Döşemelerde darbe sesi yalıtımı (L′nT,w)</h2>
  <div class="tablo-sar"><table>
    <thead><tr>
      <th>Döşeme</th><th>Üst → Alt</th><th class="sayi">L′nT,w</th><th class="sayi">İzin verilen</th>
      <th>Tablo</th><th>Sınıf</th><th>Sonuç</th>
    </tr></thead>
    <tbody>${s.darbeler.map((x) => {
      const d = x.degerlendirme;
      return `<tr>
        <td>${kacis(x.kayit.ad)}</td>
        <td>${kacis(d?.ustMekan?.ad || '—')} → ${kacis(d?.altMekan?.ad || '—')}</td>
        <td class="sayi"><b>${sayi(x.sonuc.LnTw)}</b></td>
        <td class="sayi">${d ? sayi(d.gereken, 0) : '—'}${d?.hedefKaynagi === 'manuel' ? ' <small>(manuel)</small>' : ''}</td>
        <td><small>${kacis((d?.tabloAdi || '—').replace('EK-3 ', ''))}</small></td>
        <td>${d?.eldeEdilenSinif || '—'}</td>
        <td>${uygunlukRozeti(d)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>
  ${darbeGeometriNotlari(s)}`;
}

/**
 * İki oda kipiyle tanımlanmış döşemeler için geometri dökümü.
 *
 * Ortak döşeme alanı basitleştirilmiş TS EN 12354-2 bağıntısına girmez, ama
 * projenin kabulünü belgeler: hangi mekân hangi ölçüde, ne kadarı ortak.
 * Mekânlar hiç örtüşmüyorsa bu, sessizce geçilecek bir durum değildir.
 */
function darbeGeometriNotlari(s) {
  const kayitlar = s.darbeler.filter((x) => x.kayit.geometri?.mod === 'iki-oda' && x.geo);
  if (!kayitlar.length) return '';
  return `
  <div class="tablo-sar" style="margin-top:10px"><table>
    <thead><tr>
      <th>Döşeme</th><th>Üst mekân (kaynak)</th><th>Alt mekân (alıcı)</th>
      <th class="sayi">Kaydırma L / W</th><th class="sayi">Ortak döşeme</th><th class="sayi">V (alıcı)</th>
    </tr></thead>
    <tbody>${kayitlar.map((x) => {
      const g = x.kayit.geometri, o = x.geo;
      const olcu = (r) => `${sayi(r.L)} × ${sayi(r.W)} × ${sayi(r.H)} m`;
      return `<tr>
        <td>${kacis(x.kayit.ad)}</td>
        <td>${kacis(g.ustOda.ad || x.degerlendirme?.ustMekan?.ad || '—')}<br><small>${olcu(g.ustOda)}</small></td>
        <td>${kacis(g.altOda.ad || x.degerlendirme?.altMekan?.ad || '—')}<br><small>${olcu(g.altOda)}</small></td>
        <td class="sayi">${sayi(g.kaydirmaA || 0)} / ${sayi(g.kaydirmaB || 0)} m</td>
        <td class="sayi">${o.temasVar ? `${sayi(o.S)} m²` : '<b>yok</b>'}</td>
        <td class="sayi">${sayi(o.V)} m³</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>
  ${kayitlar.some((x) => !x.geo.temasVar) ? `
  <div class="bilgi-kutu kirmizi" style="margin-top:8px">
    <b>Uyarı:</b> Yukarıdaki döşemelerden en az birinde üst ve alt mekân hiç örtüşmüyor
    (ortak döşeme alanı 0 m²). Bu mekânlar arasında ortak bir döşeme bulunmadığından
    darbe sesi hesabı anlamlı değildir; geometri düzeltilmelidir.
  </div>` : `
  <p class="soluk" style="font-size:12px;margin-top:6px">
    Ortak döşeme alanı, basitleştirilmiş TS EN 12354-2 bağıntısına
    (L′nT,w = L′n,w − 10·lg(0,032·V)) girmez; bağıntı yalnızca alıcı mekânın hacmini kullanır.
    Tablo, projenin geometrik kabulünü belgelemek için verilmiştir.
  </p>`}`;
}

function bolumCephe(s) {
  if (!s.cepheler.length) return '';
  return `
  <h2>Cephede ses yalıtımı (D2m,nT,w)</h2>
  <div class="tablo-sar"><table>
    <thead><tr><th>Cephe</th><th>Mekân</th><th>Konum</th><th class="sayi">Bileşik R′w</th>
      <th class="sayi">Yan yollu R′w</th><th class="sayi">D2m,nT,w</th><th class="sayi">D<sub>nT,A,tr</sub></th>
      <th class="sayi">Gereken</th><th>Sınıf</th><th>Sonuç</th></tr></thead>
    <tbody>${s.cepheler.map((x) => {
      const d = x.degerlendirme;
      const so = x.sonuc;
      return `<tr>
        <td>${kacis(x.kayit.ad)}</td><td>${kacis(d?.mekan?.ad || '—')}</td>
        <td>${x.kayit.konum === 'kose' ? 'Köşe (D1+D2)' : 'Orta (D1)'}</td>
        <td class="sayi">${sayi(so.RwBilesik)}</td>
        <td class="sayi">${sayi(so.RwGorunur)}</td>
        <td class="sayi"><b>${sayi(so.D2mnTw)}</b></td>
        <td class="sayi">${sayi(so.DnTAtr)}</td>
        <td class="sayi">${d ? sayi(d.gereken, 0) : '—'}${d?.hedefKaynagi === 'manuel' ? ' <small>(manuel)</small>' : ''}</td>
        <td>${d?.eldeEdilenSinif || '—'}</td><td>${uygunlukRozeti(d)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>
  <p class="soluk" style="font-size:12px">
    Yan yollu R′w, bileşik cephe yalıtımı ile iç tavan/taban ve iç yan duvarların dış duvarla
    birleşimlerinden doğan Df yollarının enerjik toplamıdır (yalnızca oda boyutları girilmiş
    cephelerde hesaplanır). Uygunluk kararı EK-3 Tablo 3.1 ile
    <b>D<sub>nT,A,tr</sub> = D2m,nT,w + C<sub>tr</sub></b> üzerinden verilir; resmî tablonun
    göstergesi budur ve gereken değer sabit bir matristen değil,
    L<sub>gag</sub>'dan hassasiyet ve sınıfa bağlı bir indirim çıkarılarak bulunur.
  </p>

`;
}

function bolumReverberasyon(s) {
  if (!s.hacimler.length) return '';
  return `
  <h2>Reverberasyon süresi</h2>
  <div class="tablo-sar"><table>
    <thead><tr><th>Hacim</th><th class="sayi">T ort.</th><th class="sayi">İzin verilen</th><th>Sonuç</th></tr></thead>
    <tbody>${s.hacimler.map((x) => {
      const d = x.degerlendirme;
      return `<tr>
        <td>${kacis(x.kayit.ad)}</td><td class="sayi"><b>${sayi(x.sonuc.Torta, 2)}</b></td>
        <td class="sayi">${d?.Tmax != null ? sayi(d.Tmax, 2) : '—'}</td>
        <td>${d ? (d.uygun ? '<span class="rozet uygun">Sağlanıyor</span>' : '<span class="rozet uygunsuz">Sağlanmıyor</span>') : '<span class="rozet notr">—</span>'}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

/* ── Excel'e aktarım — "Katman Kesitleri ve Rw Değerleri" + "Sınır Değerler" ─
   İki sayfalı, sabit bir yerleşimi olan .xlsx paketi üretir: elemanlar
   DD (dış duvar/cephe), İD (iç duvar/ayırıcı) ve DOS (döşeme/ayırıcı taban)
   olarak kodlanır — kullanıcının elle hazırladığı referans tabloyla aynı
   düzende. ─────────────────────────────────────────────────────────── */

/** Bir dizi ayırıcı/cephe kaydını DD/İD/DOS satırlarına dönüştürür. */
export function excelKayitlariniTopla(s) {
  const dd = s.cepheler.map((x, i) => ({
    kod: `DD${i + 1}`,
    kaynak: 'Çevresel Gürültü',
    alici: x.degerlendirme?.mekan?.ad || x.kayit.ad || '—',
    deger: x.sonuc?.DnTAtr,
    gereken: x.degerlendirme?.gereken,
  }));

  const duvarAyiricilar = s.ayiricilar.filter((x) => x.kayit.geometri?.yon !== 'taban');
  const dosemeAyiricilar = s.ayiricilar.filter((x) => x.kayit.geometri?.yon === 'taban');

  const id = duvarAyiricilar.map((x, i) => ({
    kod: `İD${i + 1}`,
    kaynak: x.degerlendirme?.kaynakMekan?.ad || '—',
    alici: x.degerlendirme?.aliciMekan?.ad || '—',
    deger: x.sonuc?.DnTw,
    gereken: x.degerlendirme?.gereken,
  }));

  const dos = dosemeAyiricilar.map((x, i) => ({
    kod: `DOS${i + 1}`,
    kaynak: x.degerlendirme?.kaynakMekan?.ad || '—',
    alici: x.degerlendirme?.aliciMekan?.ad || '—',
    deger: x.sonuc?.DnTw,
    gereken: x.degerlendirme?.gereken,
  }));

  // Darbe sesi (döşeme) kayıtları. Ayrı bir kategoridir çünkü göstergesi
  // farklıdır (L′nT,w) ve sınır ÜST sınırdır: sağlanan değer sınırdan KÜÇÜK
  // olmalıdır. Aynı tabloya "≥" ile yazılsaydı sonuç yanlış okunurdu.
  //
  // Kod olarak kaydın KENDİ ADI kullanılır: kullanıcı döşemelerini raporda
  // göründüğü gibi (ör. "DOS1") adlandırıyor ve Excel'in başka bir kod
  // uydurması iki belgeyi eşleştirmeyi zorlaştırıyordu. Ad boşsa, ayırıcı
  // döşemelerin ardından gelecek biçimde DOS numaralandırması sürdürülür.
  const drb = s.darbeler.map((x, i) => ({
    kod: (x.kayit.ad || '').trim() || `DOS${dosemeAyiricilar.length + i + 1}`,
    kaynak: x.degerlendirme?.ustMekan?.ad || '—',
    alici: x.degerlendirme?.altMekan?.ad || '—',
    deger: x.sonuc?.LnTw,
    gereken: x.degerlendirme?.gereken,
    ustSinir: true,          // karşılaştırma yönü: ≤
    birim: 'dB',
  }));

  return { dd, id, dos, drb };
}

function bosMu(v) { return { deger: '', stil: v }; }

/** Sayfa 1: "Katman Kesitleri ve Rw Değerleri" — kategoriye göre gruplu liste. */
export function sayfa1Uret({ dd, id, dos, drb = [] }) {
  const kategoriler = [
    { baslik: 'DIŞ DUVAR DD', esyaTuru: 'DUVAR', kayitlar: dd },
    { baslik: 'İÇ DUVAR İD', esyaTuru: 'DUVAR', kayitlar: id },
    { baslik: 'DÖŞEMELER DOS', esyaTuru: 'DÖŞEME', kayitlar: dos },
    { baslik: 'DÖŞEMELER — DARBE SESİ', esyaTuru: 'DÖŞEME', kayitlar: drb, birim: 'dB' },
  ];

  const satirlar = [[
    { deger: 'NİTELİK', stil: STIL.BASLIK },
    { deger: 'YAPI ELEMANI', stil: STIL.BASLIK },
    { deger: 'KODU', stil: STIL.BASLIK },
    { deger: "Standartize Edilmiş Seviye Farkı (DₙT,A,tr)", stil: STIL.BASLIK },
    bosMu(STIL.BASLIK),
    { deger: 'Referans', stil: STIL.BASLIK },
  ]];
  const birlestirmeler = ['D1:E1'];

  let r = 2;
  for (const kat of kategoriler) {
    if (!kat.kayitlar.length) continue;
    const baslangic = r;
    kat.kayitlar.forEach((k, i) => {
      satirlar.push([
        i === 0 ? { deger: kat.baslik, stil: STIL.KATEGORI } : bosMu(STIL.KATEGORI),
        { deger: kat.esyaTuru, stil: STIL.VERI },
        { deger: k.kod, stil: STIL.VERI },
        Number.isFinite(k.deger) ? { deger: Number(k.deger.toFixed(1)), sayi: true, stil: STIL.VERI } : bosMu(STIL.VERI),
        { deger: kat.birim || 'dBA', stil: STIL.VERI },
        { deger: 'Yazılım', stil: STIL.VERI },
      ]);
      r += 1;
    });
    if (kat.kayitlar.length > 1) birlestirmeler.push(`A${baslangic}:A${r - 1}`);
  }

  return {
    ad: 'Katman Kesitleri ve Rw Değerler',
    sutunGenislikleri: [11, 15, 9, 12, 7, 11],
    satirlar,
    birlestirmeler,
  };
}

/** Sayfa 2: "Projedeki Sınır Değerler ve Sağlanan Değerler". */
export function sayfa2Uret({ dd, id, dos, drb = [] }) {
  const kategoriler = [
    { ana: 'Dış Yapı Elemanları', kod: 'DD', tur: 'Duvar', kayitlar: dd },
    { ana: 'İç Yapı Elemanları', kod: 'İD', tur: 'Duvar', kayitlar: id },
    { ana: 'Döşemeler', kod: 'DOS', tur: 'Döşeme', kayitlar: dos },
    { ana: 'Döşemeler — Darbe Sesi', kod: 'DOS', tur: 'Döşeme', kayitlar: drb },
  ];

  const satirlar = [[
    { deger: 'YAPI ELEMANLARI', stil: STIL.BASLIK },
    { deger: 'ÖRNEK KOD', stil: STIL.BASLIK },
    { deger: 'KAYNAK', stil: STIL.BASLIK },
    { deger: 'ALICI', stil: STIL.BASLIK },
    { deger: "EN DÜŞÜK SES YALITIMI (DₙT,A,tr)", stil: STIL.BASLIK },
    bosMu(STIL.BASLIK),
    { deger: "HAVA DOĞUŞLU DEĞERLER (DₙT,A,tr)", stil: STIL.BASLIK },
    bosMu(STIL.BASLIK),
  ]];
  const birlestirmeler = ['E1:F1', 'G1:H1'];

  let ilkKategoriYazildi = false;
  for (const kat of kategoriler) {
    if (!kat.kayitlar.length) continue;
    const rNo = satirlar.length + 1;
    const katSatiri = [
      { deger: kat.ana, stil: STIL.BASLIK },
      { deger: kat.kod, stil: STIL.BASLIK },
      bosMu(STIL.BASLIK),
      bosMu(STIL.BASLIK),
    ];
    if (!ilkKategoriYazildi) {
      katSatiri.push(
        { deger: 'Sınır Değer', stil: STIL.BASLIK }, bosMu(STIL.BASLIK),
        { deger: 'Sağlanan Değer', stil: STIL.BASLIK }, bosMu(STIL.BASLIK),
      );
      birlestirmeler.push(`E${rNo}:F${rNo}`, `G${rNo}:H${rNo}`);
      ilkKategoriYazildi = true;
    } else {
      katSatiri.push(bosMu(STIL.BASLIK), bosMu(STIL.BASLIK), bosMu(STIL.BASLIK), bosMu(STIL.BASLIK));
    }
    satirlar.push(katSatiri);

    for (const k of kat.kayitlar) {
      satirlar.push([
        { deger: kat.tur, stil: STIL.BASLIK },
        { deger: k.kod, stil: STIL.VERI },
        { deger: k.kaynak, stil: STIL.VERI },
        { deger: k.alici, stil: STIL.VERI },
        // Darbe sesinde sınır ÜST sınırdır (L′nT,w ≤ sınır); hava doğuşlu
        // ve cephede ise alt sınırdır. İşaret buna göre yazılır.
        { deger: Number.isFinite(k.gereken)
          ? `${k.ustSinir ? '≤' : '≥'}${sayi(k.gereken, 0)}` : '—', stil: STIL.VERI_SAG },
        { deger: 'dB', stil: STIL.VERI },
        Number.isFinite(k.deger) ? { deger: Number(k.deger.toFixed(1)), sayi: true, stil: STIL.VERI } : bosMu(STIL.VERI),
        { deger: 'dB', stil: STIL.VERI },
      ]);
    }
  }

  return {
    ad: 'Projedeki Sınır Değerler ve Seç',
    sutunGenislikleri: [15, 9, 20, 19, 9, 5, 9, 5],
    satirlar,
    birlestirmeler,
  };
}

/**
 * Hesaplanan sonuçlardan iki sayfalı bir .xlsx paketi üretir ve indirir.
 * @param {Object} p Proje künyesi (durum.proje)
 * @param {Object} s Hesap sonuçları (projeyiHesapla çıktısı)
 */
export function excelRaporunuIndir(p, s) {
  const kayitlar = excelKayitlariniTopla(s);
  const kitap = xlsxOlustur([sayfa1Uret(kayitlar), sayfa2Uret(kayitlar)]);
  const ad = (p.kod || p.ad || 'akustik-rapor').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'akustik-rapor';
  blobIndir(kitap, `${ad} - Sinir Degerler.xlsx`);
}

/* ═══════════════════════════════════════════════════════════════════════
   EK-10 · AKUSTİK PERFORMANS BELGESİ

   Yönetmeliğin EK-10 bölümündeki belge, raporun son sayfası olarak birebir
   düzende üretilir: künye + bina resmi alanı, A–F merdiveni ve sınıf
   tanımları, altı ölçütlü değerlendirme tablosu, açıklamalar ve imza
   bloğu. Sınıflar `cekirdek/performans-belgesi.js` içinde EK-10 §10.1(9)
   kuralıyla (en alt sınıf belirleyicidir) hesaplanır.
   ═══════════════════════════════════════════════════════════════════════ */

/** Sınıf tanımları — resmî belgedeki "Akustik Performans Sınıflarına ilişkin Tanımlamalar". */
const SINIF_TANIMLARI = {
  A: 'Gürültüye karşı yüksek koruma ile sağlanan sessiz bir ortam',
  B: 'Normal koşullarda, kullanıcının davranışlarını sınırlaması gerekmeksizin iyi bir koruma',
  C: 'Kullanıcıların davranışlarının normal sınırda olması durumunda rahatsızlığın fazla olmaması',
  D: 'Kullanıcıların davranışlarının normal sınırda olmasına rağmen genellikle rahatsızlık',
  E: 'Gürültüye karşı düşük koruma sağlanan bir ortam',
  F: 'Gürültüye karşı korumasız bir ortam',
};

/** A–F merdiveni: her sınıf bir ok biçiminde, seçili olan işaretlenir. */
function sinifMerdiveni(secili) {
  return `
  <div class="belge-merdiven">
    <div class="belge-merdiven-uc ust">Yüksek</div>
    ${SINIFLAR.map((s, i) => `
      <div class="belge-ok belge-ok-${s.toLowerCase()}${s === secili ? ' secili' : ''}"
           style="width:${44 + i * 9}%">
        <span>${s}</span>
      </div>`).join('')}
    <div class="belge-merdiven-uc alt">Düşük</div>
  </div>`;
}

function performansBelgesi(p, s) {
  const b = belgeVerisi(s);
  const T = b.toplamSinif;

  // Dikey "DEĞERLENDİRME ÖLÇÜTLERİ" başlığı ilk gövde satırında yer alır:
  // rowspan thead/tbody sınırını aşamaz, thead'de kalsaydı sütunu ayırmazdı.
  const satir = (r, ilk) => `
    <tr>
      ${ilk ? '<th class="belge-dikey" rowspan="7">DEĞERLENDİRME ÖLÇÜTLERİ</th>' : ''}
      <td class="belge-no">${r.no}</td>
      <td class="belge-olcut">${kacis(r.ad)} <span class="belge-gosterge">(${r.gosterge})</span></td>
      <td class="sayi">${r.toplam ? `${r.ornek} / ${r.toplam}` : '—'}</td>
      <td class="sayi">${r.enDusuk == null ? '—' : `${sayi(r.enDusuk, 1)} – ${sayi(r.enYuksek, 1)}`}</td>
      <td class="sayi">—</td>
      <td class="belge-sinif-hucre">${sinifSecimi(r.sinif)}</td>
    </tr>`;

  return `
  <div class="rapor rapor-sayfa-sonu belge">
    <div class="belge-baslik">
      <span class="belge-baslik-logo"><img src="assets/logo.png" alt=""></span>
      <h1>AKUSTİK PERFORMANS BELGESİ</h1>
    </div>

    <div class="belge-ust">
      <div class="belge-kutu belge-kunye">
        <div class="belge-satir"><b>Proje Adı</b><i>:</i><span>${kacis(p.ad || '')}</span></div>
        <div class="belge-alt-baslik">Binanın</div>
        <div class="belge-satir"><span class="e">Tipi</span><i>:</i><span>${kacis(BINA_TURLERI[p.binaTuru] || p.binaTuru || '')}</span></div>
        <div class="belge-satir"><span class="e">İnşaat Yılı</span><i>:</i><span>${kacis(p.insaatYili || '')}</span></div>
        <div class="belge-satir"><span class="e">Kapalı Kullanım Alanı</span><i>:</i><span>${kacis(p.kapaliAlan ? `${p.kapaliAlan} m²` : '')}</span></div>
        <div class="belge-satir"><span class="e">Toplam İnşaat Alanı</span><i>:</i><span>${kacis(p.toplamInsaatAlani ? `${p.toplamInsaatAlani} m²` : '')}</span></div>
        <div class="belge-satir"><span class="e">Ada, Parseli</span><i>:</i><span>${kacis(adaParselMetni(p))}</span></div>
        <div class="belge-satir"><span class="e">Adresi</span><i>:</i><span>${kacis(adresMetni(p))}</span></div>
        <div class="belge-alt-baslik">Bina Sahibinin</div>
        <div class="belge-satir"><span class="e">Adı Soyadı</span><i>:</i><span>${kacis(p.isveren || '')}</span></div>
        <div class="belge-satir"><span class="e">Adresi</span><i>:</i><span>${kacis(p.isverenAdres || '')}</span></div>
      </div>
      <div class="belge-kutu belge-resim">
        <div class="belge-kutu-baslik">Binanın Resmi</div>
        <div class="belge-resim-alan">${p.binaResmi
          ? `<img src="${kacis(p.binaResmi)}" alt="Binanın resmi">`
          : '<span class="belge-resim-yer">—</span>'}</div>
      </div>
    </div>

    <div class="belge-orta">
      <div class="belge-kutu belge-merdiven-kutu">
        ${sinifMerdiveni(T)}
        <div class="belge-rozet">
          <span>Bina Akustik<br>Performans Sınıfı</span>
          <b>${T || '—'}</b>
        </div>
      </div>
      <div class="belge-kutu belge-tanimlar">
        <div class="belge-kutu-baslik">Akustik Performans Sınıflarına ilişkin Tanımlamalar</div>
        ${SINIFLAR.map((k) => `
          <div class="belge-tanim${k === T ? ' secili' : ''}">
            <b>${k}</b><i>:</i><span>${kacis(SINIF_TANIMLARI[k])}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="tablo-sar"><table class="belge-tablo">
      <thead>
        <tr>
          <th class="belge-dikey-bos"></th>
          <th colspan="2"></th>
          <th>Ölçülen örnek sayısı / Toplam</th>
          <th>Max – Min değer</th>
          <th>Belirsizlik (standart sapma), dB</th>
          <th>Akustik Performans Sınıfı</th>
        </tr>
      </thead>
      <tbody>
        ${b.satirlar.map((r, i) => satir(r, i === 0)).join('')}
        <tr class="belge-toplam">
          <td colspan="5">Toplam</td>
          <td class="belge-sinif-hucre">${sinifSecimi(T)}</td>
        </tr>
      </tbody>
    </table></div>

    <div class="belge-kutu belge-aciklama">
      <div class="belge-kutu-baslik">Açıklamalar</div>
      <p>
        Bu belge, ${kacis(SURUM.yonetmelik)} EK-10'a göre düzenlenmiştir.
        Sınıflandırma, EK-10 §10.1(9) uyarınca elde edilen <b>en alt performans
        sınıfı</b> esas alınarak yapılmıştır.
        ${b.belirlenemeyen.length ? `<br><b>Performans belirlenemedi:</b> ${kacis(b.belirlenemeyen.join(', '))}
        — bu ölçütler yönetmelikçe ölçüme dayandırılır (EK-10 §10.1/4) ve bu araçta hesaplanmaz.` : ''}
        <br>Değerler, TS EN 12354 serisine göre yapılmış <b>ön boyutlandırma hesaplarıdır</b>;
        EK-9'da belirtilen standartlara uygun saha ölçümleriyle doğrulanmadan
        akustik performans belgesi yerine geçmez.
      </p>
    </div>

    <div class="belge-imza">
      <div>
        <div class="belge-alt-baslik">Belgenin</div>
        <div class="belge-satir"><span class="e">Numarası</span><i>:</i><span>${kacis(p.belgeNo || p.kod || '')}</span></div>
        <div class="belge-satir"><span class="e">Veriliş Tarihi</span><i>:</i><span>${kacis(p.tarih || '')}</span></div>
        <div class="belge-satir"><span class="e">Son Geçerlilik Tarihi</span><i>:</i><span>${kacis(sonGecerlilik(p.tarih))}</span></div>
      </div>
      <div>
        <div class="belge-alt-baslik">Belgeyi Düzenleyenin</div>
        <div class="belge-satir"><span class="e">Adı Soyadı</span><i>:</i><span>${kacis(p.akustikUzman || '')}</span></div>
        <div class="belge-satir"><span class="e">Firması</span><i>:</i><span>${kacis(p.sirket || '')}</span></div>
        <div class="belge-satir"><span class="e">Oda Sicil Nosu</span><i>:</i><span>${kacis(p.odaSicil || '')}</span></div>
      </div>
      <div class="belge-imza-alan">İmza</div>
    </div>

    ${altbilgi(p)}
  </div>`;
}

/** A B C D E F dizisi; belirlenen sınıf işaretlenir. */
function sinifSecimi(secili) {
  return `<span class="belge-sinif-dizi">${SINIFLAR.map((s) =>
    `<b class="${s === secili ? 'secili' : ''}">${s}</b>`).join('')}</span>`;
}

/** Akustik Performans Belgesi geçerliliği 10 yıldır (EK-10 §10.1/1). */
function sonGecerlilik(tarih) {
  const m = /^(\d{4})(-\d{2}-\d{2})$/.exec(String(tarih || ''));
  return m ? `${Number(m[1]) + 10}${m[2]}` : '';
}
