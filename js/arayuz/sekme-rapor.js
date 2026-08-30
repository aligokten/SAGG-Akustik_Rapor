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
import { SURUM, BINA_TURLERI, ASGARI_SINIFLAR } from '../veri/yonetmelik.js';
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

const dolguBul = (id) => bul(YALITIM_LEVHALARI, id);

export function ciz(durum, s) {
  const p = durum.proje;

  return `
  <div class="yazdirma-gizle" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    <button class="dugme" data-eylem="yazdir">Raporu yazdır / PDF'e aktar</button>
    <button class="dugme acik" data-eylem="excel-indir">Sınır değer tablosunu Excel'e aktar</button>
    <span class="soluk" style="align-self:center;font-size:12.5px">Tarayıcının yazdırma penceresinden "PDF olarak kaydet" seçilebilir.</span>
  </div>

  ${s.ayiricilar.length === 0
    ? '<div class="bos-durum">Henüz ayırıcı eleman tanımlanmadı. Rapor, en az bir ayırıcı eleman gerektirir.</div>'
    : s.ayiricilar.map((a, i) => ayiriciRaporu(p, a, i, s.ayiricilar.length)).join('')}

  ${ekBolumler(p, s)}

  ${performansBelgesi(p, s)}`;
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
function altbilgi(p) {
  return `
  <div class="rapor-altbilgi">
    <span>Hazırlayan: ${kacis(p.akustikUzman || '—')}</span>
    <span>SAGG Akustik Hesap Paneli · Katmanlı Model v3</span>
  </div>
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

/* ── Döşeme / cephe / hacim — daha yalın ek bölüm ────────────────── */

function ekBolumler(p, s) {
  if (!s.darbeler.length && !s.cepheler.length && !s.hacimler.length) return '';
  return `
  <div class="rapor rapor-sayfa-sonu">
    ${antet(p)}
    <h1 style="font-size:18px">Ek hesap özetleri</h1>
    <p class="soluk">Döşeme, cephe ve reverberasyon kayıtları — "Katmanlı Model v3" biçiminin kapsamı dışındaki ek bileşenler.</p>
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
  </table></div>`;
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

  ${s.cepheler.filter((x) => x.kayit.geometri?.mod === 'olculer').map((x) => `
    <div class="canli-model yazdirma-goster" style="margin-top:14px">
      <div class="canli-model-baslik"><span class="canli-model-nokta"></span> ${kacis(x.kayit.ad)} — mahal şeması</div>
      <div style="padding:6px">${cepheSVG(x.kayit, { mekanAdi: x.kayit.ad, genislik: 720, yukseklik: 320 })}</div>
    </div>`).join('')}`;
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

  return { dd, id, dos };
}

function bosMu(v) { return { deger: '', stil: v }; }

/** Sayfa 1: "Katman Kesitleri ve Rw Değerleri" — kategoriye göre gruplu liste. */
export function sayfa1Uret({ dd, id, dos }) {
  const kategoriler = [
    { baslik: 'DIŞ DUVAR DD', esyaTuru: 'DUVAR', kayitlar: dd },
    { baslik: 'İÇ DUVAR İD', esyaTuru: 'DUVAR', kayitlar: id },
    { baslik: 'DÖŞEMELER DOS', esyaTuru: 'DÖŞEME', kayitlar: dos },
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
        { deger: 'dBA', stil: STIL.VERI },
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
export function sayfa2Uret({ dd, id, dos }) {
  const kategoriler = [
    { ana: 'Dış Yapı Elemanları', kod: 'DD', tur: 'Duvar', kayitlar: dd },
    { ana: 'İç Yapı Elemanları', kod: 'İD', tur: 'Duvar', kayitlar: id },
    { ana: 'Döşemeler', kod: 'DOS', tur: 'Döşeme', kayitlar: dos },
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
        { deger: Number.isFinite(k.gereken) ? `≥${sayi(k.gereken, 0)}` : '—', stil: STIL.VERI_SAG },
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
