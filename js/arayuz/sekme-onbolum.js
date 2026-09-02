/**
 * sekme-onbolum.js — Raporun ön bölümünü (hesaplardan önceki kısmı) düzenler.
 *
 * Teslim edilen akustik rapor, hesap sayfalarından ibaret değildir: önünde
 * parsel künyesi, çevresel gürültü değerlendirmesi, anahtar paftalar
 * (kat planları ve kesitler), yapı elemanı kod anahtarı, mekân hassasiyet
 * tablosu ve nokta detaylar yer alır.
 *
 * Bu sekme o bölümün girdilerini toplar. Parsel, mal sahibi ve bina
 * bilgileri proje künyesinden kendiliğinden gelir; kullanıcı yalnızca
 * çizimleri yükler ve anlatı metnini gözden geçirir.
 */

import { kacis, sayi, secenekler } from './ortak.js';
import {
  GORSEL_BOLUMLERI, CEVRESEL_SINIR_DEGERLER, cevreselDegerlendirme,
  girisCumlesi, gorselleriGrupla, yapiElemaniAnahtari, mekanDereceleri,
  malzemeYogunluklari,
} from '../cekirdek/rapor-onbolum.js';

export function ciz(durum, s) {
  const p = durum.proje;
  const ob = durum.onbolum;
  const otomatikGiris = girisCumlesi(p);

  return `
  ${kartEtkin(ob)}
  ${kartGiris(p, ob, otomatikGiris)}
  ${kartCevresel(ob)}
  ${kartGorseller(ob)}
  ${kartOtomatikTablolar(s, ob)}
  ${kartSonuc(ob)}
  `;
}

/* ── Bölümü açma/kapama ─────────────────────────────────────────────── */

function kartEtkin(ob) {
  return `
  <section class="kart">
    <div class="kart-baslik"><h2>Rapor ön bölümü</h2></div>
    <div class="bilgi-kutu">
      Bu bölüm, akustik raporun hesap sayfalarından <b>önce</b> gelen kısmıdır: giriş ve
      parsel bilgileri, çevresel gürültü değerlendirmesi, anahtar paftalar, yapı elemanı
      kod anahtarı, mekân hassasiyet tablosu, nokta detaylar ve sonuç. Aşağıdaki
      tabloların çoğu proje künyesinden ve hesaplardan kendiliğinden doldurulur.
    </div>
    <label class="onay">
      <input type="checkbox" data-yol="onbolum.etkin" data-tur="bool"${ob.etkin ? ' checked' : ''}>
      <span>Ön bölüm rapora eklensin</span>
    </label>
  </section>`;
}

/* ── 1. Giriş ───────────────────────────────────────────────────────── */

function kartGiris(p, ob, otomatik) {
  const eksik = [
    !p.il && 'İl', !p.ilce && 'İlçe', !p.mahalle && 'Mahalle',
    !p.ada && 'Ada', !p.parsel && 'Parsel', !p.isveren && 'İşveren',
  ].filter(Boolean);

  return `
  <section class="kart">
    <div class="kart-baslik"><h2>1. Giriş ve parsel bilgileri</h2></div>

    <div class="tablo-sar"><table>
      <thead><tr><th>Künye alanı</th><th>Değer</th></tr></thead>
      <tbody>
        ${kunyeSatiri('İl / İlçe', [p.il, p.ilce].filter(Boolean).join(' / '))}
        ${kunyeSatiri('Mahalle', p.mahalle)}
        ${kunyeSatiri('Pafta', p.pafta)}
        ${kunyeSatiri('Ada / Parsel', [p.ada, p.parsel].filter(Boolean).join(' / '))}
        ${kunyeSatiri('Açık adres', p.adres)}
        ${kunyeSatiri('Yapı sahibi (işveren)', p.isveren)}
        ${kunyeSatiri('İşverenin adresi', p.isverenAdres)}
        ${kunyeSatiri('Toplam inşaat alanı', p.toplamInsaatAlani ? `${p.toplamInsaatAlani} m²` : '')}
        ${kunyeSatiri('Kapalı kullanım alanı', p.kapaliAlan ? `${p.kapaliAlan} m²` : '')}
        ${kunyeSatiri('İnşaat yılı', p.insaatYili)}
      </tbody>
    </table></div>
    ${eksik.length ? `<div class="bilgi-kutu sari" style="margin-top:8px">
      Proje künyesinde şu alanlar boş: <b>${kacis(eksik.join(', '))}</b>.
      Raporun giriş bölümü bu alanlardan kurulur; <b>Proje künyesi</b> sekmesinden doldurun.
    </div>` : ''}

    <div class="alan" style="margin-top:14px">
      <label for="ob-giris">Giriş metni</label>
      <textarea id="ob-giris" rows="4" data-yol="onbolum.giris"
        placeholder="${kacis(otomatik || 'Künyeyi doldurduğunuzda buraya önerilen metin gelir.')}">${kacis(ob.giris)}</textarea>
      <span class="ipucu">Boş bırakırsanız raporda künyeden türetilen aşağıdaki cümle kullanılır.</span>
    </div>
    ${otomatik ? `<p class="soluk" style="font-size:12.5px">
      Önerilen: <i>${kacis(otomatik)}</i></p>` : ''}
  </section>`;
}

function kunyeSatiri(etiket, deger) {
  const dolu = String(deger ?? '').trim();
  return `<tr><td>${kacis(etiket)}</td>
    <td>${dolu ? `<b>${kacis(dolu)}</b>` : '<span class="soluk">— künyede boş —</span>'}</td></tr>`;
}

/* ── 2. Çevresel gürültü ────────────────────────────────────────────── */

function kartCevresel(ob) {
  const c = ob.cevresel;
  const d = cevreselDegerlendirme(c);

  return `
  <section class="kart">
    <div class="kart-baslik"><h2>2. Çevresel gürültü</h2></div>
    <div class="bilgi-kutu">
      Parselin maruz kaldığı çevresel gürültü düzeyleri. Gündüz–akşam–gece göstergesi
      <b>L<sub>gag</sub></b>, üç dilimin süreyle ağırlıklı enerji ortalamasıdır
      (gündüz 07–19, akşam 19–23, gece 23–07) ve cephe hesaplarında dış gürültü düzeyi
      olarak kullanılabilir. Avrupa'daki L<sub>den</sub>'den farklı olarak akşama ve
      geceye ceza eklenmez.
    </div>

    <div class="izgara">
      <div class="alan"><label for="ob-alan">Alan türü</label>
        <select id="ob-alan" data-yol="onbolum.cevresel.alanTuru">
          ${secenekler(CEVRESEL_SINIR_DEGERLER.satirlar, c.alanTuru)}
        </select></div>
      <div class="alan"><label for="ob-lg">L<sub>gündüz</sub> (dBA)</label>
        <input id="ob-lg" type="text" inputmode="decimal" data-tur="sayiVeyaNull"
          data-yol="onbolum.cevresel.gunduz" value="${c.gunduz ?? ''}"></div>
      <div class="alan"><label for="ob-la">L<sub>akşam</sub> (dBA)</label>
        <input id="ob-la" type="text" inputmode="decimal" data-tur="sayiVeyaNull"
          data-yol="onbolum.cevresel.aksam" value="${c.aksam ?? ''}"></div>
      <div class="alan"><label for="ob-lge">L<sub>gece</sub> (dBA)</label>
        <input id="ob-lge" type="text" inputmode="decimal" data-tur="sayiVeyaNull"
          data-yol="onbolum.cevresel.gece" value="${c.gece ?? ''}"></div>
    </div>

    <label class="onay" style="margin-top:8px">
      <input type="checkbox" data-yol="onbolum.cevresel.mevcutYol" data-tur="bool"${c.mevcutYol ? ' checked' : ''}>
      <span>Parselin çevresindeki yollar mevcut (planlanmış ama yapılmamış değil)</span>
    </label>
    <span class="ipucu">Mevcut yollarda EK-VII sınır değerleri 5 dBA daha yüksektir.</span>

    ${d.Lgag == null ? `<div class="bilgi-kutu" style="margin-top:12px">
      Üç düzeyi de girdiğinizde L<sub>gag</sub> burada hesaplanır.</div>`
    : `<div class="olcut-izgara" style="margin-top:14px">
        ${olcutKutu('Gösterge L(gag)', sayi(d.Lgag), 'dBA', d.asanVar ? 'kotu' : 'iyi')}
        ${olcutKutu('Gündüz sınırı', String(d.satirlar[0].sinir), 'dBA', 'notr')}
        ${olcutKutu('Değerlendirme', d.asanVar ? 'Aşıyor' : 'Sağlıyor', '', d.asanVar ? 'kotu' : 'iyi')}
      </div>`}

    <div class="tablo-sar" style="margin-top:12px"><table>
      <thead><tr><th>Gösterge</th><th class="sayi">Ölçülen / kabul</th>
        <th class="sayi">Sınır (${kacis(d.alan.ad)})</th><th>Durum</th></tr></thead>
      <tbody>${d.satirlar.map((r) => `<tr>
        <td>${gosterge(r.ad)}</td>
        <td class="sayi">${r.olculen == null ? '—' : `${sayi(r.olculen)} dBA`}</td>
        <td class="sayi">${r.sinir} dBA</td>
        <td>${r.asiyor == null ? '<span class="rozet notr">girilmedi</span>'
          : r.asiyor ? '<span class="rozet uygunsuz">aşıyor</span>'
                     : '<span class="rozet uygun">sağlıyor</span>'}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    <p class="soluk" style="font-size:12px">Kaynak: ${kacis(CEVRESEL_SINIR_DEGERLER.kaynak)}</p>

    <div class="alan" style="margin-top:12px">
      <label for="ob-cev-ac">Çevresel gürültü açıklaması</label>
      <textarea id="ob-cev-ac" rows="3" data-yol="onbolum.cevresel.aciklama"
        placeholder="Ölçüm tarihi, cihaz, kabul edilen değerin dayanağı…">${kacis(c.aciklama)}</textarea>
    </div>
  </section>`;
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

/** Panelin ölçüt kartı biçimi (durum noktası etiketin başında görünür). */
function olcutKutu(etiket, deger, birim = '', durum = '') {
  return `<div class="olcut-kart${durum ? ` ${durum}` : ''}">
    <span class="etiket">${kacis(etiket)}</span>
    <span class="deger">${kacis(deger)}${birim ? ` <small>${kacis(birim)}</small>` : ''}</span>
  </div>`;
}

/* ── Görseller (kat planı, kesit, nokta detay) ──────────────────────── */

function kartGorseller(ob) {
  const gruplar = gorselleriGrupla(ob.gorseller);
  return gruplar.map((g) => `
  <section class="kart">
    <div class="kart-baslik">
      <h2>${kacis(g.baslik)}</h2>
      <button type="button" class="dugme acik kucuk" data-eylem="gorsel-ekle" data-tur="${kacis(g.tur)}">
        + ${g.numarasiz ? 'Belge sayfası ekle' : 'Görsel ekle'}</button>
    </div>
    <div class="bilgi-kutu">${kacis(g.aciklama)}
      ${g.numarasiz
        ? 'Şekil numarası verilmez. Belge birden çok sayfaysa her sayfayı ayrı ekleyin.'
        : `Raporda <b>Şekil ${kacis(g.bolum)}.x</b> olarak numaralanır.`}</div>

    ${g.gorseller.length === 0
      ? `<div class="bos-durum">${g.numarasiz
          ? 'Belge henüz yüklenmedi. Belgenizin taranmış görüntüsünü (PNG/JPG) ekleyin.'
          : 'Bu bölüme henüz görsel eklenmedi.'}</div>`
      : g.gorseller.map((x) => gorselSatiri(x)).join('')}
  </section>`).join('');
}

function gorselSatiri(g) {
  return `
  <div class="gorsel-satir" data-gorsel="${kacis(g.id)}">
    <div class="gorsel-onizleme">
      ${g.veri ? `<img src="${kacis(g.veri)}" alt="${kacis(g.baslik || g.etiket)}">`
               : '<span class="soluk">Görsel seçilmedi</span>'}
    </div>
    <div class="gorsel-alanlar">
      <div class="alan">
        <label for="gb-${kacis(g.id)}">${kacis(g.etiket)}${g.numarasiz ? '' : ' başlığı'}</label>
        <input id="gb-${kacis(g.id)}" data-yol-gorsel="${kacis(g.id)}.baslik"
          value="${kacis(g.baslik)}" placeholder="${g.numarasiz ? 'Belge adı (isteğe bağlı)' : 'Örn. ZEMİN KAT PLANI'}"
          ${g.numarasiz ? 'disabled title="Belge başlığı sabittir"' : ''}>
      </div>
      <div class="alan">
        <label for="ga-${kacis(g.id)}">Açıklama</label>
        <input id="ga-${kacis(g.id)}" data-yol-gorsel="${kacis(g.id)}.aciklama"
          value="${kacis(g.aciklama)}" placeholder="İsteğe bağlı alt yazı">
      </div>
      <div class="gorsel-dugmeler">
        <label class="dugme acik kucuk" for="gd-${kacis(g.id)}">
          ${g.veri ? 'Görseli değiştir' : 'Görsel seç'}</label>
        <input type="file" id="gd-${kacis(g.id)}" accept="image/*" data-gorsel-dosya="${kacis(g.id)}" hidden>
        <button type="button" class="dugme acik kucuk" data-eylem="gorsel-yukari" data-id="${kacis(g.id)}" title="Yukarı taşı">↑</button>
        <button type="button" class="dugme acik kucuk" data-eylem="gorsel-asagi" data-id="${kacis(g.id)}" title="Aşağı taşı">↓</button>
        <button type="button" class="dugme tehlike kucuk" data-eylem="gorsel-sil" data-id="${kacis(g.id)}">Sil</button>
      </div>
    </div>
  </div>`;
}

/* ── Hesaplardan türeyen tablolar (önizleme) ────────────────────────── */

function kartOtomatikTablolar(s, ob) {
  const anahtar = yapiElemaniAnahtari(s);
  const mekanlar = mekanDereceleri(s);
  const malzemeler = malzemeYogunluklari(s);

  return `
  <section class="kart">
    <div class="kart-baslik"><h2>Hesaplardan türeyen tablolar</h2></div>
    <div class="bilgi-kutu">
      Bu üç tablo raporda kendiliğinden oluşur; burada yalnızca önizlenir.
      İçerikleri değiştirmek için ilgili hesap sekmesindeki kayıtları düzenleyin.
    </div>

    <h3>Yapı elemanı kod anahtarı</h3>
    ${anahtar.length === 0
      ? '<div class="bos-durum">Henüz hesap kaydı yok.</div>'
      : anahtar.map((g) => `
        <div class="tablo-sar" style="margin-bottom:10px"><table>
          <thead><tr><th colspan="4">${kacis(g.grup)} — ${kacis(g.baslik)}</th></tr>
            <tr><th>Yapı elemanı</th><th>Kod</th><th>Kaynak mekân</th><th>Alıcı mekân</th></tr></thead>
          <tbody>${g.satirlar.map((r) => `<tr>
            <td>${kacis(r.eleman)}</td><td><b>${kacis(r.kod)}</b></td>
            <td>${kacis(r.kaynak)}</td><td>${kacis(r.alici)}</td></tr>`).join('')}</tbody>
        </table></div>`).join('')}

    <h3 style="margin-top:16px">Gürültülülük düzeyi ve hassasiyet dereceleri</h3>
    ${mekanlar.length === 0
      ? '<div class="bos-durum">Hesaplarda mekân seçilmedi.</div>'
      : `<div class="tablo-sar"><table>
          <thead><tr><th>Mekân</th><th>Bina türü</th><th>Gürültülülük düzeyi</th><th>Hassasiyet derecesi</th></tr></thead>
          <tbody>${mekanlar.map((m) => `<tr><td>${kacis(m.ad)}</td><td>${kacis(m.binaTuru)}</td>
            <td>${kacis(m.gurultululuk)}</td><td>${kacis(m.hassasiyet)}</td></tr>`).join('')}</tbody>
        </table></div>`}

    <h3 style="margin-top:16px">Malzeme birim hacim ağırlıkları</h3>
    ${malzemeler.length === 0
      ? '<div class="bos-durum">Hesaplarda malzeme çözülemedi.</div>'
      : `<div class="tablo-sar"><table>
          <thead><tr><th>Malzeme</th><th class="sayi">Yoğunluk (kg/m³)</th></tr></thead>
          <tbody>${malzemeler.map((m) => `<tr><td>${kacis(m.ad)}</td>
            <td class="sayi">${sayi(m.yogunluk, 0)}</td></tr>`).join('')}</tbody>
        </table></div>`}

    <div class="alan" style="margin-top:14px">
      <label for="ob-ye-not">Yapı elemanları bölümü notu</label>
      <textarea id="ob-ye-not" rows="3" data-yol="onbolum.yapiElemaniNotu"
        placeholder="Kod anahtarının paftalarda nasıl okunacağı, özel durumlar…">${kacis(ob.yapiElemaniNotu)}</textarea>
    </div>
  </section>`;
}

/* ── Sonuç ve öneriler ──────────────────────────────────────────────── */

function kartSonuc(ob) {
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h2>Sonuç ve öneriler</h2>
      <button type="button" class="dugme acik kucuk" data-eylem="oneri-ekle">+ Öneri ekle</button>
    </div>

    <div class="alan">
      <label for="ob-sonuc">Sonuç metni</label>
      <textarea id="ob-sonuc" rows="4" data-yol="onbolum.sonuc"
        placeholder="Hesaplar sonucunda yapının hedeflenen akustik performans sınıfını sağladığı…">${kacis(ob.sonuc)}</textarea>
    </div>

    <h3 style="margin-top:14px">Uygulama önerileri</h3>
    ${ob.oneriler.length === 0
      ? '<div class="bos-durum">Henüz öneri eklenmedi. Raporda madde madde listelenirler.</div>'
      : ob.oneriler.map((o, i) => `
        <div class="oneri-satir">
          <span class="oneri-no">${i + 1}.</span>
          <input data-yol-oneri="${i}" value="${kacis(o)}" placeholder="Örn. Bütün pencerelerin Rw ≥ 34 dB (C;Ctr = −1;−2) olacaktır.">
          <button type="button" class="dugme tehlike kucuk" data-eylem="oneri-sil" data-indeks="${i}">Sil</button>
        </div>`).join('')}
  </section>`;
}
