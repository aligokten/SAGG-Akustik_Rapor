/**
 * sekme-cephe.js — Dış yapı elemanlarında (cephe) ses yalıtımı
 * (TS EN 12354-3) ve EK-3 Tablo 3.1 değerlendirmesi.
 */

import { kacis, sayi, secenekler, uygunlukRozeti, sinifRozeti } from './ortak.js';
import { DUVARLAR, DOGRAMALAR, SIVALAR, KUCUK_ELEMANLAR } from '../veri/malzemeler.js';
import { BICIM_DUZELTMELERI, gerekliCepheYalitimi } from '../cekirdek/en12354-3.js';
import { HASSASIYET_DERECELERI } from '../veri/yonetmelik.js';
import { mekanSecenekleri } from './sekme-ayirici.js';

const BICIMLER = Object.entries(BICIM_DUZELTMELERI).map(([id, v]) => ({ id, ad: `${v.ad} (ΔLfs = ${v.dLfs} dB)` }));

export function ciz(durum, sonuclar) {
  const kayitlar = durum.cepheler;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Tanımlı cepheler <span class="rozet notr yalin">${kayitlar.length}</span></h3>
      <button class="dugme" data-eylem="ekle-cephe">+ Cephe ekle</button>
    </div>
    <div class="bilgi-kutu">
      TS EN 12354-3: cephenin bileşik yalıtımı, yüzeysel elemanların alanları ve küçük elemanların
      Dn,e,w değerleri ile bulunur; ardından
      <b>D2m,nT,w = R′w,bileşik + ΔLfs + 10·lg(V/(6·T₀·S))</b> hesaplanır.
      Sonuç <b>EK-3 Tablo 3.1</b> ile karşılaştırılır.
    </div>
    ${kayitlar.length === 0
      ? '<div class="bos-durum">Henüz cephe tanımlanmadı.</div>'
      : kayitlar.map((c, i) => kart(c, i, sonuclar.cepheler[i])).join('')}
  </section>`;
}

function kart(c, i, h) {
  const y = `cepheler.${i}`;
  const d = h.degerlendirme;
  const s = h.sonuc;
  const gerekliFizik = gerekliCepheYalitimi(c.disGurultu, 30);

  return `
  <section class="kart">
    <div class="kart-baslik">
      <div style="flex:1"><input data-yol="${y}.ad" value="${kacis(c.ad)}" class="baslik-girdi"></div>
      <div class="satir-eylem">
        <button class="dugme acik kucuk" data-eylem="kopyala-cephe" data-idx="${i}">Kopyala</button>
        <button class="dugme acik kucuk" data-eylem="sil-cephe" data-idx="${i}">Sil</button>
      </div>
    </div>

    <div class="izgara">
      <div class="alan"><label>Mekân</label>
        <select data-yol="${y}.mekanId">${mekanSecenekleri(c.mekanId)}</select>
        <span class="ipucu">Hassasiyet: <b>${kacis(HASSASIYET_DERECELERI[d?.mekan?.hassasiyet] || '—')}</b></span></div>
      <div class="alan"><label>Cephedeki gündüz gürültü düzeyi (dBA)</label>
        <input type="number" step="1" min="30" max="90" data-yol="${y}.disGurultu" data-tur="sayi" value="${c.disGurultu}">
        <span class="ipucu">Tablo aralığı: <b>${kacis(d?.aralik?.ad || '—')}</b></span></div>
      <div class="alan"><label>Mekân hacmi V (m³)</label>
        <input type="number" step="1" min="1" data-yol="${y}.V" data-tur="sayi" value="${c.V}"></div>
      <div class="alan"><label>Cephe biçimi</label>
        <select data-yol="${y}.bicim">${secenekler(BICIMLER, c.bicim)}</select></div>
    </div>

    <h3 style="margin-top:18px">Yüzeysel cephe elemanları</h3>
    <div class="tablo-sar"><table>
      <thead><tr><th>Ad</th><th>Tür</th><th>Eleman</th><th>Sıva</th><th class="sayi">Yüz</th>
        <th class="sayi">S (m²)</th><th class="sayi">Rw (dB)</th><th>Beyan Rw</th><th class="sayi">Pay (%)</th><th></th></tr></thead>
      <tbody>
      ${(c.elemanlar || []).map((e, j) => {
        const ey = `${y}.elemanlar.${j}`;
        const he = h.yuzeysel[j];
        const pay = s.paylar.find((p) => p.ad === he.ad && p.tip === 'yuzeysel');
        const duvarMi = e.tur === 'duvar';
        return `<tr>
          <td><input data-yol="${ey}.ad" value="${kacis(e.ad)}" style="min-width:130px"></td>
          <td><select data-yol="${ey}.tur" style="min-width:110px">
                <option value="duvar"${duvarMi ? ' selected' : ''}>Duvar</option>
                <option value="dograma"${!duvarMi ? ' selected' : ''}>Doğrama</option></select></td>
          <td><select data-yol="${ey}.elemanId" style="min-width:200px">${
                secenekler(duvarMi ? DUVARLAR : DOGRAMALAR, e.elemanId, { gruplu: true })}</select></td>
          <td>${duvarMi ? `<select data-yol="${ey}.sivaId" style="min-width:150px">${secenekler(SIVALAR, e.sivaId)}</select>` : '<span class="soluk">—</span>'}</td>
          <td>${duvarMi ? `<select data-yol="${ey}.sivaliYuzSayisi" data-tur="sayi">${[0, 1, 2].map((n) =>
                `<option value="${n}"${n === e.sivaliYuzSayisi ? ' selected' : ''}>${n}</option>`).join('')}</select>` : '<span class="soluk">—</span>'}</td>
          <td><input type="number" step="0.1" min="0" data-yol="${ey}.S" data-tur="sayi" value="${e.S}" style="width:80px"></td>
          <td class="sayi">${sayi(he.Rw)}</td>
          <td><input type="number" step="0.1" data-yol="${ey}.RwBeyan" data-tur="sayiVeyaNull" value="${e.RwBeyan ?? ''}" style="width:85px" placeholder="—"></td>
          <td class="sayi">${pay ? sayi(pay.payYuzde, 1) : '—'}</td>
          <td><button class="dugme acik kucuk" data-eylem="sil-cephe-eleman" data-idx="${i}" data-alt="${j}">Sil</button></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>
    <button class="dugme acik kucuk" data-eylem="ekle-cephe-eleman" data-idx="${i}">+ Yüzeysel eleman ekle</button>

    <h3 style="margin-top:18px">Küçük elemanlar (menfez, panjur kutusu vb.)</h3>
    <div class="tablo-sar"><table>
      <thead><tr><th>Eleman</th><th class="sayi">Adet</th><th class="sayi">Dn,e,w (dB)</th><th>Beyan Dn,e,w</th><th class="sayi">Pay (%)</th><th></th></tr></thead>
      <tbody>
      ${(c.kucukElemanlar || []).length === 0
        ? '<tr><td colspan="6" class="soluk">Küçük eleman tanımlanmadı.</td></tr>'
        : c.kucukElemanlar.map((k, j) => {
            const ky = `${y}.kucukElemanlar.${j}`;
            const hk = h.kucuk[j];
            const pay = s.paylar.find((p) => p.ad === hk.ad && p.tip === 'kucuk');
            return `<tr>
              <td><select data-yol="${ky}.elemanId" style="min-width:230px">${secenekler(KUCUK_ELEMANLAR, k.elemanId)}</select></td>
              <td><input type="number" step="1" min="0" data-yol="${ky}.adet" data-tur="sayi" value="${k.adet}" style="width:70px"></td>
              <td class="sayi">${sayi(hk.Dnew, 0)}</td>
              <td><input type="number" step="0.1" data-yol="${ky}.DnewBeyan" data-tur="sayiVeyaNull" value="${k.DnewBeyan ?? ''}" style="width:85px" placeholder="—"></td>
              <td class="sayi">${pay ? sayi(pay.payYuzde, 1) : '—'}</td>
              <td><button class="dugme acik kucuk" data-eylem="sil-kucuk" data-idx="${i}" data-alt="${j}">Sil</button></td>
            </tr>`;
          }).join('')}
      </tbody>
    </table></div>
    <button class="dugme acik kucuk" data-eylem="ekle-kucuk" data-idx="${i}">+ Küçük eleman ekle</button>

    <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
      <div class="hucre"><span class="etiket">Bileşik R′w</span><span class="deger">${sayi(s.RwBilesik)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">Cephe alanı S</span><span class="deger">${sayi(s.S)} <small>m²</small></span></div>
      <div class="hucre"><span class="etiket">ΔLfs + hacim terimi</span><span class="deger">${sayi(s.dLfs + s.hacimTerimi)} <small>dB</small></span></div>
      <div class="hucre one-cikan"><span class="etiket">D2m,nT,w (hesaplanan)</span><span class="deger">${sayi(s.D2mnTw)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">Gereken (${kacis(d?.hedefSinif ?? '—')} sınıfı)</span><span class="deger">${d ? sayi(d.gereken, 0) : '—'} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">Elde edilen sınıf</span><span>${sinifRozeti(d?.eldeEdilenSinif)}</span></div>
      <div class="hucre"><span class="etiket">Sonuç</span><span>${uygunlukRozeti(d)}${d && Number.isFinite(d.fark) ? ` <small>(${d.fark >= 0 ? '+' : ''}${sayi(d.fark)} dB)</small>` : ''}</span></div>
    </div>
    <p class="soluk" style="font-size:12px">
      Bilgi: 30 dBA iç gürültü hedefi için gereken kaba yalıtım farkı ${sayi(gerekliFizik, 0)} dB'dir
      (${sayi(c.disGurultu, 0)} − 30). Yönetmelik gereği ile bu değerden büyük olanı esas alınmalıdır.
    </p>

    ${d ? `<details><summary>${kacis(d.kaynak)} — sınıf değerleri</summary>
      <div class="tablo-sar"><table>
        <thead><tr><th>Sınıf</th>${Object.keys(d.satir).map((c2) => `<th class="sayi">${c2}</th>`).join('')}</tr></thead>
        <tbody><tr><td>D2m,nT,w en az (dB)</td>${Object.values(d.satir).map((v) => `<td class="sayi">${v}</td>`).join('')}</tr></tbody>
      </table></div>
      <p class="soluk" style="font-size:12px">Hassasiyet: ${kacis(d.mekan.hassasiyet)} · Dış gürültü aralığı: ${kacis(d.aralik.ad)}. ${kacis(d.dogrulama)}</p>
    </details>` : ''}
  </section>`;
}
