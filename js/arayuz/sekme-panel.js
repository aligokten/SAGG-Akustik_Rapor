/**
 * sekme-panel.js — Panel (genel görünüm): projenin akustik başarımını tek
 * ekranda özetler; ölçüt kutucukları, bileşen listeleri ve marj çubukları.
 */

import { kacis, sayi, sinifRozeti, uygunlukRozeti } from './ortak.js';
import { SINIFLAR, ASGARI_SINIFLAR, BINA_TURLERI, SURUM } from '../veri/yonetmelik.js';

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

  return `
  ${uyariBandi()}

  <div class="olcut-izgara">
    ${olcutKart({
      etiket: 'Belirleyici performans sınıfı',
      icerik: `<span class="deger">${sinifRozeti(s.genelSinif, 'buyuk')}
                 <span>${s.genelSinif ? `${s.genelSinif} sınıfı` : '—'}</span></span>`,
      alt: s.genelSinif
        ? (SINIFLAR.indexOf(s.genelSinif) <= SINIFLAR.indexOf(p.hedefSinif)
            ? `Hedeflenen ${p.hedefSinif} sınıfını karşılıyor`
            : `Hedeflenen ${p.hedefSinif} sınıfının altında`)
        : 'Henüz değerlendirilebilir bileşen yok',
      renk: !s.genelSinif ? 'notr'
        : (SINIFLAR.indexOf(s.genelSinif) <= SINIFLAR.indexOf(p.hedefSinif) ? 'iyi' : 'kotu'),
    })}
    ${olcutKart({
      etiket: 'Gereksinimi sağlayan bileşen',
      icerik: `<span class="deger">${uygunSayisi}<small>/ ${degerlendirilen.length}</small></span>
               <div class="cubuk ${oran === 100 ? 'iyi' : 'kotu'}" style="margin-top:9px"><i style="width:${oran}%"></i></div>`,
      alt: `%${oran} uygunluk`,
      renk: degerlendirilen.length === 0 ? 'notr' : (oran === 100 ? 'iyi' : 'kotu'),
    })}
    ${olcutKart({
      etiket: 'Hedef sınıf',
      icerik: `<span class="deger">${kacis(p.hedefSinif)}</span>`,
      alt: `Yönetmelik asgarisi: ${asgari} · ${hedefYeterli ? 'karşılanıyor' : 'asgarinin altında'}`,
      renk: hedefYeterli ? '' : 'kotu',
    })}
    ${olcutKart({
      etiket: 'Bina türü',
      icerik: `<span class="deger" style="font-size:19px">${kacis(BINA_TURLERI[p.binaTuru] || p.binaTuru)}</span>`,
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
