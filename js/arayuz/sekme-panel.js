/**
 * sekme-panel.js — Panel (genel görünüm): projenin akustik başarımını tek
 * ekranda özetler; ölçüt kutucukları, bileşen listeleri ve marj çubukları.
 */

import { kacis, sayi, sinifRozeti, uygunlukRozeti, halka, marjGrafigi } from './ortak.js';
import { SINIFLAR, ASGARI_SINIFLAR, BINA_TURLERI, SURUM } from '../veri/yonetmelik.js';
import { simge } from './simgeler.js';

/**
 * Marj grafiğindeki bölüm süzgeci. Panel her çizimde yeniden üretildiğinden
 * seçim modül düzeyinde tutulur; kalıcı proje verisine yazılmaz.
 */
let marjSuzgeci = 'hepsi';

/** Süzgeç düğmelerinin (`data-eylem="panel-filtre"`) çağırdığı ayarlayıcı. */
export function suzgeciAyarla(deger) {
  marjSuzgeci = deger || 'hepsi';
}

const BOLUMLER = [
  { id: 'ayirici', ad: 'Ayırıcı', liste: (s) => s.ayiricilar },
  { id: 'darbe', ad: 'Darbe', liste: (s) => s.darbeler },
  { id: 'cephe', ad: 'Cephe', liste: (s) => s.cepheler },
  { id: 'reverberasyon', ad: 'Reverb.', liste: (s) => s.hacimler },
];

export function ciz(durum, s) {
  const p = durum.proje;
  const asgari = ASGARI_SINIFLAR[p.durum] || 'C';
  const hedefYeterli = SINIFLAR.indexOf(p.hedefSinif) <= SINIFLAR.indexOf(asgari);

  const degerlendirilen = [
    ...s.ayiricilar, ...s.darbeler, ...s.cepheler, ...s.hacimler,
  ].filter((x) => x.degerlendirme);
  const uygunSayisi = degerlendirilen.filter((x) => x.degerlendirme.uygun).length;
  const oran = degerlendirilen.length ? Math.round((uygunSayisi / degerlendirilen.length) * 100) : 0;

  if (s.toplamBilesen === 0 && s.hacimler.length === 0) return bosPanel();

  const hedefTutuyor = s.genelSinif && SINIFLAR.indexOf(s.genelSinif) <= SINIFLAR.indexOf(p.hedefSinif);

  return `
  ${uyariBandi()}

  <div class="bento">
    <section class="kart genis-4">
      <div class="kart-baslik">
        <h3>${simge('panel')} Genel uygunluk</h3>
        <span class="rozet ${oran === 100 ? 'uygun' : 'uygunsuz'}">${uygunSayisi}/${degerlendirilen.length}</span>
      </div>
      <div class="halka-yuva">
        ${halka(oran, {
          buyuk: `%${oran}`,
          kucuk: 'sağlıyor',
          renk: degerlendirilen.length === 0 ? '' : (oran === 100 ? 'iyi' : 'kotu'),
          cap: 152,
        })}
      </div>
      ${bolumDokumu(s)}
      <div class="kart-not">
        ${degerlendirilen.length
          ? `${degerlendirilen.length} bileşenin ${uygunSayisi} tanesi yönetmelik gereksinimini karşılıyor.`
          : 'Henüz değerlendirilebilir bileşen yok.'}
      </div>
    </section>

    <section class="kart genis-8">
      <div class="kart-baslik">
        <h3>${simge('reverberasyon')} Bileşen başarım marjı</h3>
        ${suzgecSeridi(s)}
      </div>
      ${marjBolumu(s)}
    </section>
  </div>

  <div class="bento">
    ${olcutKart({
      etiket: 'Belirleyici sınıf',
      icerik: `<span class="deger">${sinifRozeti(s.genelSinif, 'buyuk')}
                 <span>${s.genelSinif ? `${s.genelSinif} sınıfı` : '—'}</span></span>`,
      alt: s.genelSinif
        ? (hedefTutuyor ? `Hedeflenen ${p.hedefSinif} sınıfını karşılıyor`
                        : `Hedeflenen ${p.hedefSinif} sınıfının altında`)
        : 'Henüz değerlendirilebilir bileşen yok',
      renk: !s.genelSinif ? 'notr' : (hedefTutuyor ? 'iyi' : 'kotu'),
    })}
    ${olcutKart({
      etiket: 'Hedef sınıf',
      icerik: `<span class="deger">${kacis(p.hedefSinif)}<small>sınıfı</small></span>`,
      alt: `Yönetmelik asgarisi ${asgari} · ${hedefYeterli ? 'karşılanıyor' : 'asgarinin altında'}`,
      renk: 'dolu',
    })}
    ${olcutKart({
      etiket: 'Dikkat gerektiren',
      icerik: `<span class="deger">${s.uygunsuzlar.length}<small>bileşen</small></span>`,
      alt: s.uygunsuzlar.length ? 'Aşağıdaki listeden ayrıntıya gidin' : 'Tüm bileşenler gereksinimi sağlıyor',
      renk: s.uygunsuzlar.length ? 'kotu' : 'iyi',
    })}
    ${olcutKart({
      etiket: 'Kapsam',
      icerik: `<span class="deger" style="font-size:17px;line-height:1.3">${kacis(BINA_TURLERI[p.binaTuru] || p.binaTuru)}</span>`,
      alt: `${s.ayiricilar.length} ayırıcı · ${s.darbeler.length} döşeme · ${s.cepheler.length} cephe · ${s.hacimler.length} hacim`,
      renk: 'notr',
    })}
  </div>

  ${s.uygunsuzlar.length ? `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Dikkat gerektiren bileşenler</h3>
      <span class="rozet uygunsuz">${s.uygunsuzlar.length} bileşen</span>
    </div>
    <div class="tablo-sar"><table>
      <thead><tr><th>Bileşen</th><th>Bölüm</th><th class="sayi">Hesaplanan</th><th class="sayi">Gereken</th><th>Açık</th><th></th></tr></thead>
      <tbody>${eksikSatirlar(s)}</tbody>
    </table></div>
  </section>` : ''}

  ${bolum('Ayırıcı elemanlar — hava doğuşlu ses', 'DnT,w', 'ayirici', s.ayiricilar,
    (x) => ({ ad: x.kayit.ad, hesap: x.sonuc.DnTw, d: x.degerlendirme }))}
  ${bolum('Döşemeler — darbe sesi', "L'nT,w", 'darbe', s.darbeler,
    (x) => ({ ad: x.kayit.ad, hesap: x.sonuc.LnTw, d: x.degerlendirme }))}
  ${bolum('Cepheler', 'D2m,nT,w', 'cephe', s.cepheler,
    (x) => ({ ad: x.kayit.ad, hesap: x.sonuc.D2mnTw, d: x.degerlendirme }))}
  ${reverberasyonBolumu(s.hacimler)}
  `;
}

/* ── Parçalar ─────────────────────────────────────────────────────── */

function olcutKart({ etiket, icerik, alt, renk = '' }) {
  return `<div class="olcut-kart ${renk}">
    <span class="etiket">${kacis(etiket)}</span>
    ${icerik}
    ${alt ? `<div class="alt-not">${kacis(alt)}</div>` : ''}
  </div>`;
}

/** Halkanın altında bölüm bölüm "kaç/kaç sağlıyor" dökümü. */
function bolumDokumu(s) {
  const satirlar = BOLUMLER.map((b) => {
    const liste = b.liste(s).filter((x) => x.degerlendirme);
    if (!liste.length) return '';
    const uygun = liste.filter((x) => x.degerlendirme.uygun).length;
    const tam = uygun === liste.length;
    return `<div class="dokum-satir">
      <span class="dokum-ad">${kacis(b.ad)}</span>
      <div class="cubuk ${tam ? 'iyi' : 'kotu'}"><i style="width:${(uygun / liste.length) * 100}%"></i></div>
      <span class="dokum-sayi">${uygun}/${liste.length}</span>
    </div>`;
  }).join('');
  return satirlar ? `<div class="dokum">${satirlar}</div>` : '';
}

/** Marj grafiğinin bölüm süzgeci — yalnızca verisi olan bölümler gösterilir. */
function suzgecSeridi(s) {
  const dolu = BOLUMLER.filter((b) => b.liste(s).length > 0);
  if (dolu.length < 2) return '';
  const secenekler = [{ id: 'hepsi', ad: 'Tümü' }, ...dolu];
  // Seçili bölüm bu arada boşalmış olabilir; o durumda "Tümü"ne düşülür.
  const etkin = secenekler.some((x) => x.id === marjSuzgeci) ? marjSuzgeci : 'hepsi';

  return `<div class="segment">${secenekler.map((x) =>
    `<button type="button" class="${x.id === etkin ? 'etkin' : ''}"
             data-eylem="panel-filtre" data-deger="${kacis(x.id)}">${kacis(x.ad)}</button>`
  ).join('')}</div>`;
}

/**
 * Her bileşenin gereksinime göre marjını tek grafikte toplar.
 *
 * `degerlendirme.fark` yön farkından bağımsız olarak normalleştirilmiştir
 * (pozitif = gereksinimi sağlıyor), bu yüzden hava doğuşlu ses, darbe sesi
 * ve cephe aynı eksende karşılaştırılabilir. Reverberasyonda `fark`
 * bulunmadığından izin verilen süre ile hesaplanan süre farkı kullanılır.
 */
function marjVerileri(s) {
  const veriler = [];
  for (const b of BOLUMLER) {
    if (marjSuzgeci !== 'hepsi' && marjSuzgeci !== b.id) continue;
    for (const x of b.liste(s)) {
      const d = x.degerlendirme;
      if (!d) continue;
      const deger = b.id === 'reverberasyon'
        ? (Number.isFinite(d.Tmax) ? d.Tmax - x.sonuc.Torta : NaN)
        : d.fark;
      veriler.push({ ad: x.kayit.ad, deger, bolum: b.id });
    }
  }
  return veriler;
}

function marjBolumu(s) {
  const veriler = marjVerileri(s);
  if (!veriler.length) {
    return '<p class="soluk" style="font-size:13px;margin:18px 0">Bu süzgeçte değerlendirilebilir bileşen yok.</p>';
  }
  const birim = marjSuzgeci === 'reverberasyon' ? 's' : 'dB';
  return `
    ${marjGrafigi(veriler, { birim })}
    <div class="efsane">
      <span><i class="iyi"></i> Gereksinimi sağlıyor (marj ${birim} cinsinden pozitif)</span>
      <span><i class="kotu"></i> Açık veriyor</span>
    </div>`;
}

function uyariBandi() {
  return `<div class="uyari-bandi" id="dogrulama-uyarisi">
    <span style="font-size:16px;line-height:1.2">⚠</span>
    <div>
      <b>Doğrulama uyarısı.</b> Yönetmelik eklerindeki sınır değerleri düzenlenebilir bir veri
      katmanında tutulur ve <i>${kacis(SURUM.dogrulama)}</i> olarak işaretlidir. Resmî işlem öncesinde
      <b>Yönetmelik verileri</b> bölümünden değerleri Resmî Gazete metniyle karşılaştırınız.
    </div>
    <button type="button" class="kapat" aria-label="Kapat">&times;</button>
  </div>`;
}

function bosPanel() {
  return `${uyariBandi()}
  <div class="bos-durum">
    <h2>Projeye başlayın</h2>
    <p>Henüz hesaplanacak bileşen tanımlanmadı. Örnek bir konut projesiyle başlayabilir<br>
       ya da doğrudan kendi bileşenlerinizi ekleyebilirsiniz.</p>
    <div class="satir-eylem" style="justify-content:center">
      <button class="dugme" data-eylem="ornek-yukle">Örnek projeyi yükle</button>
      <button class="dugme acik" data-eylem="git-proje">Proje künyesini doldur</button>
      <button class="dugme acik" data-eylem="git-ayirici">Ayırıcı eleman ekle</button>
    </div>
  </div>`;
}

function eksikSatirlar(s) {
  const satirlar = [];
  const ekle = (liste, bolum, sekme, deger) => {
    for (const x of liste) {
      const d = x.degerlendirme;
      if (!d || d.uygun) continue;
      const hesap = deger(x);
      const gereken = d.Tmax != null ? d.Tmax : d.gereken;
      const acik = d.Tmax != null ? hesap - d.Tmax : Math.abs(d.fark);
      satirlar.push(`<tr>
        <td>${kacis(x.kayit.ad)}</td>
        <td><span class="rozet notr yalin">${kacis(bolum)}</span></td>
        <td class="sayi">${sayi(hesap, d.Tmax != null ? 2 : 1)}</td>
        <td class="sayi">${sayi(gereken, d.Tmax != null ? 2 : 1)}</td>
        <td class="sayi" style="color:var(--hata);font-weight:650">${sayi(acik, d.Tmax != null ? 2 : 1)}</td>
        <td><button class="dugme acik kucuk" data-eylem="git-${sekme}">Aç</button></td>
      </tr>`);
    }
  };
  ekle(s.ayiricilar, 'Ayırıcı', 'ayirici', (x) => x.sonuc.DnTw);
  ekle(s.darbeler, 'Darbe sesi', 'darbe', (x) => x.sonuc.LnTw);
  ekle(s.cepheler, 'Cephe', 'cephe', (x) => x.sonuc.D2mnTw);
  ekle(s.hacimler, 'Reverberasyon', 'reverberasyon', (x) => x.sonuc.Torta);
  return satirlar.join('');
}

function bolum(baslik, gosterge, sekme, liste, cikar) {
  if (!liste.length) return '';
  const uygun = liste.filter((x) => x.degerlendirme?.uygun).length;
  const enBuyukMarj = Math.max(6, ...liste.map((x) => Math.abs(x.degerlendirme?.fark ?? 0)));

  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>${kacis(baslik)}</h3>
      <div class="satir-eylem" style="align-items:center">
        <span class="rozet ${uygun === liste.length ? 'uygun' : 'uygunsuz'}">${uygun}/${liste.length} sağlıyor</span>
        <button class="dugme acik kucuk" data-eylem="git-${sekme}">Ayrıntı</button>
      </div>
    </div>
    <div class="tablo-sar"><table>
      <thead><tr>
        <th>Bileşen</th><th>Mekânlar</th><th class="sayi">${kacis(gosterge)}</th>
        <th class="sayi">Gereken</th><th>Marj</th><th>Sınıf</th><th>Durum</th>
      </tr></thead>
      <tbody>${liste.map((x) => {
        const { ad, hesap, d } = cikar(x);
        const marj = d?.fark ?? NaN;
        const genislik = Number.isFinite(marj) ? Math.min(100, (Math.abs(marj) / enBuyukMarj) * 100) : 0;
        return `<tr>
          <td>${kacis(ad)}</td>
          <td class="soluk" style="font-size:12px">${kacis(mekanMetni(d))}</td>
          <td class="sayi"><b>${sayi(hesap)}</b> dB</td>
          <td class="sayi">${d ? sayi(d.gereken, 0) : '—'} dB</td>
          <td><div class="marj">
                <span class="sayi-metin" style="color:${marj >= 0 ? 'var(--basari)' : 'var(--hata)'}">
                  ${Number.isFinite(marj) ? `${marj >= 0 ? '+' : ''}${sayi(marj)}` : '—'}</span>
                <div class="cubuk ${marj >= 0 ? 'iyi' : 'kotu'}"><i style="width:${genislik}%"></i></div>
              </div></td>
          <td>${sinifRozeti(d?.eldeEdilenSinif)}</td>
          <td>${uygunlukRozeti(d)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
  </section>`;
}

function reverberasyonBolumu(liste) {
  if (!liste.length) return '';
  const uygun = liste.filter((x) => x.degerlendirme?.uygun).length;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Hacimler — reverberasyon süresi</h3>
      <div class="satir-eylem" style="align-items:center">
        <span class="rozet ${uygun === liste.length ? 'uygun' : 'uygunsuz'}">${uygun}/${liste.length} sağlıyor</span>
        <button class="dugme acik kucuk" data-eylem="git-reverberasyon">Ayrıntı</button>
      </div>
    </div>
    <div class="tablo-sar"><table>
      <thead><tr><th>Hacim</th><th class="sayi">V (m³)</th><th class="sayi">T ort. (s)</th>
        <th class="sayi">İzin verilen</th><th>Durum</th></tr></thead>
      <tbody>${liste.map((x) => {
        const d = x.degerlendirme;
        return `<tr>
          <td>${kacis(x.kayit.ad)}</td>
          <td class="sayi">${sayi(x.kayit.V, 0)}</td>
          <td class="sayi"><b>${sayi(x.sonuc.Torta, 2)}</b></td>
          <td class="sayi">${d?.Tmax != null ? `≤ ${sayi(d.Tmax, 2)}` : '—'}</td>
          <td>${d ? (d.uygun ? '<span class="rozet uygun">Sağlanıyor</span>'
                             : '<span class="rozet uygunsuz">Sağlanmıyor</span>')
                  : '<span class="rozet notr">—</span>'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
  </section>`;
}

function mekanMetni(d) {
  if (!d) return '—';
  if (d.kaynakMekan) return `${d.kaynakMekan.ad} → ${d.aliciMekan.ad}`;
  if (d.ustMekan) return `${d.ustMekan.ad} → ${d.altMekan.ad}`;
  if (d.mekan) return `${d.mekan.ad}${d.aralik ? ` · dış gürültü ${d.aralik.ad}` : ''}`;
  return '—';
}
