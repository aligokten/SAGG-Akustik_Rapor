/**
 * sekme-yonetmelik.js — Yönetmelik eklerindeki sınır değerlerinin
 * görüntülenmesi, düzenlenmesi ve JSON olarak içe/dışa aktarılması.
 *
 * Amaç: sayısal sınır değerlerin koda gömülü kalmaması; kullanıcının bu
 * değerleri resmî metinle karşılaştırıp doğrudan arayüzden düzeltebilmesi.
 */

import { kacis, sayi } from './ortak.js';
import {
  SURUM, SINIFLAR, ASGARI_SINIFLAR,
  EK2_TABLO_2_1, EK3_TABLO_3_1, EK3_TABLO_3_2, EK3_TABLO_3_3,
  EK4_TABLO_4_1, EK6_TABLO_6_1,
  GURULTULULUK_DERECELERI, HASSASIYET_DERECELERI,
} from '../veri/yonetmelik.js';

export function ciz() {
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Sınır değer tabloları</h3>
      <div class="satir-eylem">
        <button class="dugme acik kucuk" data-eylem="yonetmelik-disa">JSON olarak indir</button>
        <label class="dugme acik kucuk" for="yonetmelik-ice">JSON yükle</label>
        <input type="file" id="yonetmelik-ice" accept="application/json" hidden>
        <button class="dugme acik kucuk" data-eylem="yonetmelik-varsayilan">Varsayılana dön</button>
      </div>
    </div>

    <div class="bilgi sari">
      <b>${kacis(SURUM.yonetmelik)}</b> — ${kacis(SURUM.resmiGazete)} · Veri sürümü ${kacis(SURUM.veriSurumu)}<br>
      <b>Doğrulama durumu: ${kacis(SURUM.dogrulama)}</b><br>
      Aşağıdaki tablolardaki değerler doğrudan düzenlenebilir. Değişiklikler projeyle birlikte
      tarayıcıya kaydedilir ve JSON olarak dışa aktarılabilir. Resmî işlemlerde değerleri
      Resmî Gazete metniyle karşılaştırarak doğrulayınız.
    </div>

    <div class="izgara dar">
      <div class="alan"><label>Yeni bina asgari sınıfı</label><input readonly value="${ASGARI_SINIFLAR.yeniBina}"></div>
      <div class="alan"><label>Kullanım amacı değişikliği</label><input readonly value="${ASGARI_SINIFLAR.kullanimAmaciDegisikligi}"></div>
      <div class="alan"><label>Esaslı tadilat</label><input readonly value="${ASGARI_SINIFLAR.esasliTadilat}"></div>
    </div>
  </section>

  ${ciftGirisliTablo(EK3_TABLO_3_2, 'EK3_TABLO_3_2', 'Kaynak gürültülülük / alıcı hassasiyet')}
  ${ciftGirisliTablo(EK3_TABLO_3_3, 'EK3_TABLO_3_3', 'Üst mekân gürültülülük / alt mekân hassasiyet')}
  ${cepheTablosu()}
  ${icGurultuTablosu()}
  ${reverberasyonTablosu()}
  ${mekanTablosu()}
  `;
}

function anahtarAdi(anahtar) {
  const [g, h] = anahtar.split('-');
  return `${GURULTULULUK_DERECELERI[g]} → ${HASSASIYET_DERECELERI[h]}`;
}

function ciftGirisliTablo(tablo, tabloAdi, basligi) {
  return `
  <section class="kart">
    <div class="kart-baslik"><h3>${kacis(tablo.kaynak)}</h3><span class="rozet notr">${kacis(tablo.dogrulama)}</span></div>
    <p class="soluk" style="font-size:12.5px">${kacis(basligi)} — ${tablo.yon === 'enAz' ? 'sağlanması gereken en az değer' : 'aşılmaması gereken en çok değer'} (${kacis(tablo.birim)})</p>
    <div class="tablo-sar"><table>
      <thead><tr><th>Mekân eşleşmesi</th>${SINIFLAR.map((s) => `<th class="sayi">${s}</th>`).join('')}</tr></thead>
      <tbody>
      ${Object.entries(tablo.degerler).map(([anahtar, satir]) => `<tr>
        <td>${kacis(anahtarAdi(anahtar))}</td>
        ${SINIFLAR.map((s) => `<td class="sayi"><input type="text" inputmode="decimal" style="width:64px;text-align:right"
            data-yonetmelik="${tabloAdi}" data-anahtar="${kacis(anahtar)}" data-sinif="${s}"
            value="${satir[s] ?? ''}"></td>`).join('')}
      </tr>`).join('')}
      </tbody>
    </table></div>
  </section>`;
}

function cepheTablosu() {
  const t = EK3_TABLO_3_1;
  return `
  <section class="kart">
    <div class="kart-baslik"><h3>${kacis(t.kaynak)}</h3><span class="rozet notr">${kacis(t.dogrulama)}</span></div>
    <p class="soluk" style="font-size:12.5px">
      Resmî tablo sabit bir dB matrisi değildir: gereken yalıtım, cephedeki
      L<sub>gag</sub> değerinden hassasiyet ve sınıfa bağlı bir indirim
      çıkarılarak bulunur — <b>D<sub>nT,A,tr</sub> ≥ L<sub>gag</sub> − indirim</b>.
      Aşağıdaki değerler bu indirimlerdir (dB).
    </p>
    <div class="tablo-sar"><table>
      <thead><tr><th>Alıcı odası hassasiyeti</th>${SINIFLAR.map((s) => `<th class="sayi">${s}</th>`).join('')}</tr></thead>
      <tbody>
      ${Object.entries(t.indirim).map(([hass, satir]) => `<tr>
          <td><b>${kacis(HASSASIYET_DERECELERI[hass])}</b></td>
          ${SINIFLAR.map((s) => `<td class="sayi"><input type="text" inputmode="decimal" style="width:64px;text-align:right"
              data-yonetmelik="EK3_TABLO_3_1" data-anahtar="indirim" data-alt-anahtar="${kacis(hass)}" data-sinif="${s}"
              value="${satir[s] ?? ''}"></td>`).join('')}
        </tr>`).join('')}
      </tbody>
    </table></div>
  </section>`;
}

function icGurultuTablosu() {
  const t = EK4_TABLO_4_1;
  const mekanAdi = (id) => EK2_TABLO_2_1.mekanlar.find((m) => m.id === id)?.ad || id;
  return `
  <section class="kart">
    <div class="kart-baslik"><h3>${kacis(t.kaynak)}</h3><span class="rozet notr">${kacis(t.dogrulama)}</span></div>
    <p class="soluk" style="font-size:12.5px">Mekân içinde izin verilen en yüksek eşdeğer gürültü düzeyi (dBA)</p>
    <div class="tablo-sar"><table>
      <thead><tr><th>Mekân</th>${SINIFLAR.map((s) => `<th class="sayi">${s}</th>`).join('')}</tr></thead>
      <tbody>
      ${Object.entries(t.degerler).map(([id, satir]) => `<tr>
        <td>${kacis(mekanAdi(id))}</td>
        ${SINIFLAR.map((s) => `<td class="sayi"><input type="text" inputmode="decimal" style="width:64px;text-align:right"
            data-yonetmelik="EK4_TABLO_4_1" data-anahtar="${kacis(id)}" data-sinif="${s}"
            value="${satir[s] ?? ''}"></td>`).join('')}
      </tr>`).join('')}
      </tbody>
    </table></div>
  </section>`;
}

function reverberasyonTablosu() {
  const t = EK6_TABLO_6_1;
  return `
  <section class="kart">
    <div class="kart-baslik"><h3>${kacis(t.kaynak)}</h3><span class="rozet notr">${kacis(t.dogrulama)}</span></div>
    <div class="tablo-sar"><table>
      <thead><tr><th>Mekân</th><th class="sayi">T en az (s)</th><th class="sayi">T en çok (s)</th></tr></thead>
      <tbody>
      ${t.mekanlar.map((m, i) => `<tr>
        <td>${kacis(m.ad)}</td>
        <td class="sayi"><input type="text" inputmode="decimal" style="width:80px;text-align:right"
            data-yonetmelik="EK6_TABLO_6_1" data-anahtar="${i}" data-alan="Tmin" value="${m.Tmin ?? ''}" placeholder="—"></td>
        <td class="sayi"><input type="text" inputmode="decimal" style="width:80px;text-align:right"
            data-yonetmelik="EK6_TABLO_6_1" data-anahtar="${i}" data-alan="Tmax" value="${m.Tmax ?? ''}" placeholder="—"></td>
      </tr>`).join('')}
      </tbody>
    </table></div>
  </section>`;
}

function mekanTablosu() {
  const t = EK2_TABLO_2_1;
  return `
  <section class="kart">
    <div class="kart-baslik"><h3>${kacis(t.kaynak)}</h3><span class="rozet notr">${kacis(t.dogrulama)}</span></div>
    <p class="soluk" style="font-size:12.5px">Mekânların kaynak olmaları hâlinde gürültülülük, alıcı olmaları hâlinde hassasiyet dereceleri</p>
    <div class="tablo-sar"><table>
      <thead><tr><th>Mekân</th><th>Gürültülülük derecesi</th><th>Hassasiyet derecesi</th></tr></thead>
      <tbody>
      ${t.mekanlar.map((m, i) => `<tr>
        <td>${kacis(m.ad)}</td>
        <td><select data-yonetmelik="EK2_TABLO_2_1" data-anahtar="${i}" data-alan="gurultululuk">
          ${Object.entries(GURULTULULUK_DERECELERI).map(([k, v]) =>
            `<option value="${k}"${k === m.gurultululuk ? ' selected' : ''}>${kacis(v)}</option>`).join('')}</select></td>
        <td><select data-yonetmelik="EK2_TABLO_2_1" data-anahtar="${i}" data-alan="hassasiyet">
          ${Object.entries(HASSASIYET_DERECELERI).map(([k, v]) =>
            `<option value="${k}"${k === m.hassasiyet ? ' selected' : ''}>${kacis(v)}</option>`).join('')}</select></td>
      </tr>`).join('')}
      </tbody>
    </table></div>
  </section>`;
}
