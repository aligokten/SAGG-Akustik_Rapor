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
import { odaSVG } from './oda-cizimi.js';
import { YON_ADLARI } from '../cekirdek/geometri.js';
import { katmanDizilimiMetni } from '../cekirdek/katmanli-eleman.js';
import { YALITIM_LEVHALARI, bul } from '../veri/malzemeler.js';

const dolguBul = (id) => bul(YALITIM_LEVHALARI, id);

export function ciz(durum, s) {
  const p = durum.proje;

  return `
  <div class="yazdirma-gizle" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    <button class="dugme" data-eylem="yazdir">Raporu yazdır / PDF'e aktar</button>
    <span class="soluk" style="align-self:center;font-size:12.5px">Tarayıcının yazdırma penceresinden "PDF olarak kaydet" seçilebilir.</span>
  </div>

  ${s.ayiricilar.length === 0
    ? '<div class="bos-durum">Henüz ayırıcı eleman tanımlanmadı. Rapor, en az bir ayırıcı eleman gerektirir.</div>'
    : s.ayiricilar.map((a, i) => ayiriciRaporu(p, a, i, s.ayiricilar.length)).join('')}

  ${ekBolumler(p, s)}`;
}

/* ── Antet ────────────────────────────────────────────────────────── */

function antet(p) {
  return `
  <div class="rapor-antet">
    <div class="rapor-antet-marka">
      <span class="rapor-antet-logo">SAGG</span>
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
  const [oda1AdiVarsayilan, oda2AdiVarsayilan] = (a.kayit.ad || '').split(/→|->/).map((x) => x?.trim());
  const oda1Adi = oda1AdiVarsayilan || d?.kaynakMekan?.ad || 'Oda 1 / Kaynak';
  const oda2Adi = oda2AdiVarsayilan || d?.aliciMekan?.ad || 'Oda 2 / Alıcı';

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
      <div><b>Ada / parsel</b><span>${kacis(p.adaParsel || '—')}</span></div>
      <div><b>Yapı kapsamı</b><span>${kacis(BINA_TURLERI[p.binaTuru] || p.binaTuru)} · ${kacis(durumMetni(p.durum))}</span></div>
      <div><b>Hedef sınıf</b><span>${kacis(p.hedefSinif)} sınıfı (asgari ${kacis(asgari)})</span></div>
      <div><b>Kaynak mekân</b><span>${kacis(d?.kaynakMekan?.ad || '—')}</span></div>
      <div><b>Alıcı mekân</b><span>${kacis(d?.aliciMekan?.ad || '—')}</span></div>
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
      <div><b>Ayırıcı alan S</b><span style="font-size:16px;font-weight:700">${sayi(a.geo?.S)} m²</span></div>
      <div><b>Seçilen yüzey</b><span>${kacis(YON_ADLARI[geo.yon] || '—')}</span></div>
    </div>
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

    <div class="rapor-altbilgi">
      <span>Hazırlayan: ${kacis(p.akustikUzman || '—')}</span>
      <span>SAGG Akustik Rapor · Katmanlı Model v3</span>
    </div>
  </div>`;
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
  </div>`;
}

function bolumDarbe(s) {
  if (!s.darbeler.length) return '';
  return `
  <h2>Döşemelerde darbe sesi yalıtımı (L′nT,w)</h2>
  <div class="tablo-sar"><table>
    <thead><tr>
      <th>Döşeme</th><th>Üst → Alt</th><th class="sayi">L′nT,w</th><th class="sayi">İzin verilen</th>
      <th>Sınıf</th><th>Sonuç</th>
    </tr></thead>
    <tbody>${s.darbeler.map((x) => {
      const d = x.degerlendirme;
      return `<tr>
        <td>${kacis(x.kayit.ad)}</td>
        <td>${kacis(d?.ustMekan?.ad || '—')} → ${kacis(d?.altMekan?.ad || '—')}</td>
        <td class="sayi"><b>${sayi(x.sonuc.LnTw)}</b></td>
        <td class="sayi">${d ? sayi(d.gereken, 0) : '—'}${d?.hedefKaynagi === 'manuel' ? ' <small>(manuel)</small>' : ''}</td>
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
    cephelerde hesaplanır). D<sub>nT,A,tr</sub> = D2m,nT,w + C<sub>tr</sub> bilgi amaçlıdır;
    uygunluk kararı EK-3 Tablo 3.1 ile D2m,nT,w üzerinden verilir.
  </p>`;
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
