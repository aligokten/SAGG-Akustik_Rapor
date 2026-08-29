/**
 * sekme-kutuphane.js — Malzeme kütüphanesinin gezilebilir dökümü.
 *
 * Kütüphane büyüdükçe hangi elemanın hangi alan kütlesine ve kestirilen
 * Rw'ye karşılık geldiğini görmek zorlaşır. Bu ekran tüm kayıtları
 * hesaplanmış değerleriyle listeler ve metin filtresiyle daraltır.
 */

import { kacis, sayi, aramaMetni } from './ortak.js';
import {
  DUVARLAR, DOSEMELER, YALITIM_LEVHALARI, SAP_KAPLAMALAR, GIYDIRME_KABUKLAR,
  DOGRAMALAR, KUCUK_ELEMANLAR, SOGURUCULAR, NESNELER,
  elemanAlanKutlesi, kutuphaneOzeti,
} from '../veri/malzemeler.js';
import { rwKestir, lnwEsdeger, MODELLER } from '../cekirdek/kutle-kanunu.js';
import { OKTAV_BANTLARI } from '../cekirdek/temel.js';
import { katmanDizilimiMetni } from '../cekirdek/katmanli-eleman.js';
import { FAVORI_KATEGORILERI, favorileriGrupla } from '../veri/favoriler.js';
import { YALITIM_LEVHALARI as DOLGULAR, bul } from '../veri/malzemeler.js';

/**
 * Katman favorileri kitaplığı — katman düzenleyicilerden kaydedilen
 * kombinasyonların yönetimi. Favoriler projeye değil kullanıcıya aittir;
 * tarayıcıda ayrı bir anahtarda saklanır.
 */
function favoriKitapligi() {
  const gruplar = favorileriGrupla();
  const toplam = Object.values(gruplar).reduce((a, g) => a + g.length, 0);
  const dolguBul = (id) => bul(DOLGULAR, id);

  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Katman favorileri</h3>
      <div class="satir-eylem">
        <span class="rozet notr yalin">${toplam} kayıt</span>
        <button class="dugme acik kucuk" data-eylem="favori-disa">JSON olarak indir</button>
        <label class="dugme acik kucuk" style="cursor:pointer">JSON yükle
          <input type="file" id="favori-ice" accept="application/json" style="display:none"></label>
      </div>
    </div>
    <div class="bilgi-kutu">
      Sık kullandığınız katman dizilimlerini, herhangi bir katman düzenleyicideki
      <b>★ Katmanı favoriye ekle</b> düğmesiyle kaydedin. Kayıtlı bir dizilimi aynı yerdeki
      <b>Favoriden yükle</b> listesinden tek tıkla uygulayabilirsiniz. Favoriler tarayıcınızda
      saklanır ve tüm projelerinizde kullanılabilir.
    </div>
    ${toplam === 0
      ? '<div class="bos-durum">Henüz favori kaydedilmedi.</div>'
      : Object.entries(gruplar).filter(([, g]) => g.length).map(([k, g]) => `
        <h3 style="margin-top:16px">${kacis(FAVORI_KATEGORILERI[k].ad)} <span class="rozet notr yalin">${g.length}</span></h3>
        <div class="favori-liste">
          ${g.map((f) => `
          <div class="favori-satir">
            <span class="ad">${kacis(f.ad)}</span>
            <span class="rozet notr yalin">${f.katmanlar.length} katman</span>
            <span class="dizilim" title="${kacis(katmanDizilimiMetni(f.katmanlar, dolguBul))}">${kacis(katmanDizilimiMetni(f.katmanlar, dolguBul))}</span>
            <span class="soluk" style="font-size:11.5px">${kacis(f.tarih || '')}</span>
            <button class="dugme acik kucuk tehlike" data-eylem="favori-sil" data-favori-id="${kacis(f.id)}">Sil</button>
          </div>`).join('')}
        </div>`).join('')}
  </section>`;
}

export function ciz(durum) {
  const model = durum.proje.rwModeli;
  const o = kutuphaneOzeti();

  return `
  ${favoriKitapligi()}

  <section class="kart">
    <div class="kart-baslik">
      <h3>Malzeme kütüphanesi</h3>
      <span class="rozet notr yalin">${Object.values(o).reduce((a, b) => a + b, 0)} kayıt</span>
    </div>
    <div class="izgara" style="margin-bottom:4px">
      <div class="alan" style="grid-column:1/-1">
        <label for="kutuphane-filtre">Ara</label>
        <input id="kutuphane-filtre" data-filtre="kutuphane" type="search"
               placeholder="Örn. gazbeton G2, bims 190, IPB 039, akustik kapı…" autocomplete="off">
        <span class="ipucu">Yazdıkça aşağıdaki tüm tablolar süzülür.</span>
      </div>
    </div>
    <div class="bilgi-kutu">
      Rw sütunu, beyan edilmiş değeri olmayan masif elemanlar için alan kütlesinden
      <b>${kacis(MODELLER[model]?.ad || model)}</b> bağıntısıyla kestirilmiştir; kestirim modeli
      <b>Proje künyesi</b> ekranından değiştirilebilir. Çok katmanlı sistemlerde (alçı levha duvar,
      giydirme kabuk, doğrama) kütle kanunu geçerli olmadığından tipik sistem değerleri gösterilir.
    </div>
  </section>

  ${yapiElemanlariTablosu('Duvar elemanları', DUVARLAR, model, o.duvar)}
  ${yapiElemanlariTablosu('Döşeme elemanları', DOSEMELER, model, DOSEMELER.length, true)}
  ${yalitimTablosu()}
  ${giydirmeTablosu()}
  ${sapTablosu()}
  ${dogramaTablosu()}
  ${kucukTablosu()}
  ${sogurucuTablosu()}
  ${nesneTablosu()}
  `;
}

/* ── Tablolar ─────────────────────────────────────────────────────── */

function yapiElemanlariTablosu(baslik, liste, model, adet, darbe = false) {
  return `
  <section class="kart" data-filtre-kapsam>
    <div class="kart-baslik"><h3>${kacis(baslik)}</h3><span class="rozet notr yalin">${adet} kayıt</span></div>
    <div class="tablo-sar"><table>
      <thead><tr>
        <th>Grup</th><th>Eleman</th><th class="sayi">Kalınlık (mm)</th><th class="sayi">Yoğunluk (kg/m³)</th>
        <th class="sayi">m′ (kg/m²)</th><th class="sayi">Rw (dB)</th>${darbe ? '<th class="sayi">Ln,w,eq (dB)</th>' : ''}
      </tr></thead>
      <tbody>${liste.map((e) => {
        const m = elemanAlanKutlesi(e);
        const Rw = Number.isFinite(e.Rw) ? e.Rw : rwKestir(m, model);
        return `<tr data-filtre-satir="${kacis(aramaMetni(`${e.grup} ${e.ad}`))}">
          <td class="soluk" style="font-size:12px">${kacis(e.grup)}</td>
          <td>${kacis(e.ad)}</td>
          <td class="sayi">${e.cokKatmanli ? '—' : sayi(e.kalinlik, 0)}</td>
          <td class="sayi">${e.cokKatmanli ? '—' : sayi(e.yogunluk, 0)}</td>
          <td class="sayi">${sayi(m, 0)}</td>
          <td class="sayi"><b>${sayi(Rw)}</b>${Number.isFinite(e.Rw) ? ' <small class="soluk">sistem</small>' : ''}</td>
          ${darbe ? `<td class="sayi">${e.cokKatmanli ? '—' : sayi(lnwEsdeger(m))}</td>` : ''}
        </tr>`;
      }).join('')}</tbody>
    </table></div>
  </section>`;
}

function yalitimTablosu() {
  const liste = YALITIM_LEVHALARI.filter((y) => y.id !== 'yok');
  return `
  <section class="kart" data-filtre-kapsam>
    <div class="kart-baslik"><h3>Yalıtım levhaları (boşluk dolgusu)</h3><span class="rozet notr yalin">${liste.length} kayıt</span></div>
    <div class="bilgi-kutu">
      Bir yalıtım levhasının tek başına Rw değeri yoktur; akustik başarım, levhanın içinde yer aldığı
      <b>sistemin</b> ölçülmüş değeriyle tanımlanır. Levhanın hesaba etkisi, boşluğu sönümleyip
      sönümlemediği (gözenekli olup olmadığı) üzerinden rezonans frekansına yansır.
    </div>
    <div class="tablo-sar"><table>
      <thead><tr><th>Ürün</th><th>Marka</th><th>Kalınlıklar (mm)</th><th class="sayi">λ (W/mK)</th>
        <th>Yangın</th><th>Boşluğu sönümler</th></tr></thead>
      <tbody>${liste.map((y) => `<tr data-filtre-satir="${kacis(aramaMetni(`${y.grup} ${y.ad} ${y.marka || ''}`))}">
        <td>${kacis(y.ad)}${y.olcu ? `<br><small class="soluk">${kacis(y.olcu)}</small>` : ''}</td>
        <td class="soluk">${kacis(y.marka || '—')}</td>
        <td>${y.kalinliklar.length ? kacis(y.kalinliklar.join(' · ')) : '—'}</td>
        <td class="sayi">${y.lambda != null ? sayi(y.lambda, 3) : '—'}</td>
        <td>${kacis(y.yanginSinifi || '—')}</td>
        <td>${y.gozenekli ? '<span class="rozet uygun">evet</span>' : '<span class="rozet uygunsuz">hayır</span>'}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    <details>
      <summary>Ürün notları</summary>
      <ul style="font-size:13px">${liste.map((y) =>
        `<li><b>${kacis(y.ad)}:</b> ${kacis(y.not || '—')}</li>`).join('')}</ul>
    </details>
  </section>`;
}

function giydirmeTablosu() {
  const liste = GIYDIRME_KABUKLAR.filter((g) => g.id !== 'yok');
  return basitTablo('Giydirme kabuklar ve asma tavanlar', liste,
    ['Sistem', 'Grup', 'ΔRw (dB)', 'Boşluk (mm)', 'Levha m′ (kg/m²)'],
    (g) => [kacis(g.ad), `<span class="soluk">${kacis(g.grup)}</span>`,
            `<b>${g.dRw >= 0 ? '+' : ''}${sayi(g.dRw, 0)}</b>`, sayi(g.bosluk, 0), sayi(g.levhaKutlesi, 0)],
    (g) => `${g.grup} ${g.ad}`, [2, 3, 4]);
}

function sapTablosu() {
  return basitTablo('Şap ve döşeme kaplamaları', SAP_KAPLAMALAR,
    ['Kaplama', 'İlave m′ (kg/m²)', 'ΔLw (dB)'],
    (k) => [kacis(k.ad), sayi(k.mAlan, 0), `<b>${sayi(k.dLw, 0)}</b>`],
    (k) => k.ad, [1, 2]);
}

function dogramaTablosu() {
  return basitTablo('Pencere ve kapılar', DOGRAMALAR,
    ['Eleman', 'Grup', 'Rw (dB)'],
    (d) => [kacis(d.ad), `<span class="soluk">${kacis(d.grup)}</span>`, `<b>${sayi(d.Rw, 0)}</b>`],
    (d) => `${d.grup} ${d.ad}`, [2]);
}

function kucukTablosu() {
  return basitTablo('Cephedeki küçük elemanlar', KUCUK_ELEMANLAR,
    ['Eleman', 'Dn,e,w (dB)'],
    (k) => [kacis(k.ad), `<b>${sayi(k.Dnew, 0)}</b>`],
    (k) => k.ad, [1]);
}

function sogurucuTablosu() {
  return `
  <section class="kart" data-filtre-kapsam>
    <div class="kart-baslik"><h3>Ses soğurucu yüzeyler</h3><span class="rozet notr yalin">${SOGURUCULAR.length} kayıt</span></div>
    <div class="tablo-sar"><table>
      <thead><tr><th>Yüzey</th><th>Grup</th>${OKTAV_BANTLARI.map((f) => `<th class="sayi">α ${f}</th>`).join('')}</tr></thead>
      <tbody>${SOGURUCULAR.map((y) => `<tr data-filtre-satir="${kacis(aramaMetni(`${y.grup} ${y.ad}`))}">
        <td>${kacis(y.ad)}</td><td class="soluk" style="font-size:12px">${kacis(y.grup)}</td>
        ${OKTAV_BANTLARI.map((f) => `<td class="sayi">${sayi(y.alfa[f] ?? 0, 2)}</td>`).join('')}
      </tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}

function nesneTablosu() {
  return `
  <section class="kart" data-filtre-kapsam>
    <div class="kart-baslik"><h3>Nesneler ve kullanıcılar</h3><span class="rozet notr yalin">${NESNELER.length} kayıt</span></div>
    <div class="tablo-sar"><table>
      <thead><tr><th>Nesne</th>${OKTAV_BANTLARI.map((f) => `<th class="sayi">A ${f}</th>`).join('')}</tr></thead>
      <tbody>${NESNELER.map((n) => `<tr data-filtre-satir="${kacis(aramaMetni(n.ad))}">
        <td>${kacis(n.ad)}</td>
        ${OKTAV_BANTLARI.map((f) => `<td class="sayi">${sayi(n.A[f] ?? 0, 2)}</td>`).join('')}
      </tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}

/** Ortak, tek satırlık tablo üreticisi. */
function basitTablo(baslik, liste, basliklar, hucreler, filtreMetni, sayiSutunlari = []) {
  return `
  <section class="kart" data-filtre-kapsam>
    <div class="kart-baslik"><h3>${kacis(baslik)}</h3><span class="rozet notr yalin">${liste.length} kayıt</span></div>
    <div class="tablo-sar"><table>
      <thead><tr>${basliklar.map((b, i) =>
        `<th${sayiSutunlari.includes(i) ? ' class="sayi"' : ''}>${kacis(b)}</th>`).join('')}</tr></thead>
      <tbody>${liste.map((x) => `<tr data-filtre-satir="${kacis(aramaMetni(filtreMetni(x)))}">
        ${hucreler(x).map((h, i) => `<td${sayiSutunlari.includes(i) ? ' class="sayi"' : ''}>${h}</td>`).join('')}
      </tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}
