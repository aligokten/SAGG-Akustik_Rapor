/** sekme-proje.js — Proje künyesi, hedef sınıf ve hesap ayarları. */

import { kacis, secenekler, sinifRozeti } from './ortak.js';
import { BINA_TURLERI, SINIFLAR, ASGARI_SINIFLAR, EK2_TABLO_2_2 } from '../veri/yonetmelik.js';
import { MODELLER } from '../cekirdek/kutle-kanunu.js';

const DURUMLAR = {
  yeniBina: 'Yeni yapılacak bina',
  kullanimAmaciDegisikligi: 'Mevcut binada kullanım amacı değişikliği',
  esasliTadilat: 'Mevcut binada esaslı tadilat',
};

export function ciz(durum) {
  const p = durum.proje;
  const asgari = ASGARI_SINIFLAR[p.durum] || 'C';

  return `
  <section class="kart">
    <div class="kart-baslik"><h2>Proje künyesi</h2></div>
    <div class="izgara">
      <div class="alan"><label for="pr-ad">Proje adı</label>
        <input id="pr-ad" data-yol="proje.ad" value="${kacis(p.ad)}" placeholder="Örn. Yeşil Vadi Konutları A Blok"></div>
      <div class="alan"><label for="pr-kod">Rapor kodu</label>
        <input id="pr-kod" data-yol="proje.kod" value="${kacis(p.kod)}" placeholder="Örn. ID1, DOS1"></div>
      <div class="alan"><label for="pr-ap">Ada / parsel</label>
        <input id="pr-ap" data-yol="proje.adaParsel" value="${kacis(p.adaParsel)}"></div>
      <div class="alan"><label for="pr-is">İşveren</label>
        <input id="pr-is" data-yol="proje.isveren" value="${kacis(p.isveren)}"></div>
      <div class="alan"><label for="pr-mu">Proje müellifi</label>
        <input id="pr-mu" data-yol="proje.muellif" value="${kacis(p.muellif)}"></div>
      <div class="alan"><label for="pr-au">Akustik uzman</label>
        <input id="pr-au" data-yol="proje.akustikUzman" value="${kacis(p.akustikUzman)}"></div>
      <div class="alan"><label for="pr-ta">Tarih</label>
        <input id="pr-ta" type="date" data-yol="proje.tarih" value="${kacis(p.tarih)}"></div>
    </div>
  </section>

  <section class="kart">
    <div class="kart-baslik"><h2>Rapor antedi</h2></div>
    <div class="bilgi-kutu">Yazdırılabilir raporun üst bilgisinde (letterhead) gösterilir.</div>
    <div class="izgara">
      <div class="alan"><label for="pr-sirket">Şirket / ofis adı</label>
        <input id="pr-sirket" data-yol="proje.sirket" value="${kacis(p.sirket)}"></div>
      <div class="alan"><label for="pr-unvan">Akustik uzmanın unvanı</label>
        <input id="pr-unvan" data-yol="proje.unvan" value="${kacis(p.unvan)}" placeholder="Örn. D1 Temel Bina Akustiği Uzmanı"></div>
    </div>
  </section>

  <section class="kart">
    <div class="kart-baslik"><h2>Yönetmelik kapsamı ve hedef sınıf</h2></div>
    <div class="izgara">
      <div class="alan"><label for="pr-bt">Bina türü</label>
        <select id="pr-bt" data-yol="proje.binaTuru">
          ${Object.entries(BINA_TURLERI).map(([k, v]) =>
            `<option value="${k}"${k === p.binaTuru ? ' selected' : ''}>${kacis(v)}</option>`).join('')}
        </select></div>
      <div class="alan"><label for="pr-du">Yapının durumu</label>
        <select id="pr-du" data-yol="proje.durum">
          ${Object.entries(DURUMLAR).map(([k, v]) =>
            `<option value="${k}"${k === p.durum ? ' selected' : ''}>${kacis(v)}</option>`).join('')}
        </select>
        <span class="ipucu">Bu durumda sağlanması gereken asgari sınıf: <b>${asgari}</b></span></div>
      <div class="alan"><label for="pr-hs">Hedeflenen akustik performans sınıfı</label>
        <select id="pr-hs" data-yol="proje.hedefSinif">
          ${SINIFLAR.map((s) => `<option value="${s}"${s === p.hedefSinif ? ' selected' : ''}>${s} sınıfı</option>`).join('')}
        </select>
        ${SINIFLAR.indexOf(p.hedefSinif) > SINIFLAR.indexOf(asgari)
          ? '<span class="ipucu" style="color:var(--hata)">Hedef sınıf, yönetmeliğin asgari sınıfının altında.</span>'
          : '<span class="ipucu">Yönetmeliğin asgari gereğini karşılıyor.</span>'}
      </div>
    </div>

    <details>
      <summary>Akustik performans sınıflarının öznel karşılığı (EK-2 Tablo 2.2)</summary>
      <div class="tablo-sar"><table>
        <thead><tr><th>Gürültü kaynağı</th>${SINIFLAR.map((s) => `<th>${sinifRozeti(s)}</th>`).join('')}</tr></thead>
        <tbody>
          ${EK2_TABLO_2_2.satirlar.map((r) => `<tr>
            <td><b>${kacis(r.grup)}</b> — ${kacis(r.kaynak)}</td>
            ${SINIFLAR.map((s) => `<td>${kacis(r[s])}</td>`).join('')}</tr>`).join('')}
          <tr><td><b>Ses yalıtımının zayıf nitelendirilme oranı</b></td>
            ${SINIFLAR.map((s) => `<td>${kacis(EK2_TABLO_2_2.zayifOran[s])}</td>`).join('')}</tr>
        </tbody>
      </table></div>
      <p class="soluk" style="font-size:12px">Kaynak: ${kacis(EK2_TABLO_2_2.kaynak)} — ${kacis(EK2_TABLO_2_2.dogrulama)}</p>
    </details>
  </section>

  <section class="kart">
    <div class="kart-baslik"><h2>Hesap ayarları</h2></div>
    <div class="izgara">
      <div class="alan"><label for="pr-mo">Rw kestirim modeli</label>
        <select id="pr-mo" data-yol="proje.rwModeli">
          ${Object.entries(MODELLER).map(([k, v]) =>
            `<option value="${k}"${k === p.rwModeli ? ' selected' : ''}>${kacis(v.ad)}</option>`).join('')}
        </select>
        <span class="ipucu">Yalnızca beyan edilmiş Rw değeri girilmemiş elemanlarda kullanılır.</span></div>
      <div class="alan"><label for="pr-ep">Emniyet payı (dB)</label>
        <input id="pr-ep" type="text" inputmode="decimal" data-yol="proje.emniyetPayi" data-tur="sayi" value="${p.emniyetPayi}">
        <span class="ipucu">Öngörü belirsizliği; hava doğuşlu ve cephe sonuçlarından düşülür, darbe sesine eklenir.</span></div>
      <div class="alan"><label for="pr-t0">Referans reverberasyon süresi T₀ (s)</label>
        <input id="pr-t0" type="text" inputmode="decimal" data-yol="proje.T0" data-tur="sayi" value="${p.T0}">
        <span class="ipucu">Konut ve benzeri mekânlarda 0,5 s.</span></div>
    </div>
    <div class="alan" style="margin-top:14px">
      <label for="pr-no">Proje notları</label>
      <textarea id="pr-no" rows="3" data-yol="proje.notlar" placeholder="Kabuller, varsayımlar, özel durumlar…">${kacis(p.notlar)}</textarea>
    </div>
  </section>

  `;
}
