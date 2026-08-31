/**
 * sekme-cephe.js — Dış yapı elemanlarında (cephe) ses yalıtımı
 * (TS EN 12354-3) ve EK-3 Tablo 3.1 değerlendirmesi.
 */

import { kacis, sayi, secenekler, uygunlukRozeti, sinifRozeti, katliMi, katlamaDugmesi, tumunuKatlaDugmesi } from './ortak.js';
import { DUVARLAR, DOSEMELER, DOGRAMALAR, SIVALAR, KUCUK_ELEMANLAR } from '../veri/malzemeler.js';
import { BICIM_DUZELTMELERI, gerekliCepheYalitimi, CEPHE_YAN_ROLLERI } from '../cekirdek/en12354-3.js';
import { HASSASIYET_DERECELERI } from '../veri/yonetmelik.js';
import { mekanSecenekleri } from './sekme-ayirici.js';
import { katmanEditoru } from './katman-editor.js';
import { cepheSVG } from './oda-cizimi.js';

const BICIMLER = Object.entries(BICIM_DUZELTMELERI).map(([id, v]) => ({ id, ad: `${v.ad} (ΔLfs = ${v.dLfs} dB)` }));

export function ciz(durum, sonuclar) {
  const kayitlar = durum.cepheler;
  return `
  <section class="kart">
    <div class="kart-baslik">
      <h3>Tanımlı cepheler <span class="rozet notr yalin">${kayitlar.length}</span></h3>
      ${tumunuKatlaDugmesi(kayitlar.map((r) => r.id), 'cepheler')}
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

/**
 * Mekân geometrisi ve iç yan elemanlar.
 *
 * Yan yol hesabı yalnızca 'olculer' modunda yapılır: iç tavan/taban ve iç
 * duvarların dış duvarla birleşim uzunlukları oda boyutlarından türetilir.
 */
function geometriBolumu(y, c, h, i) {
  const g = c.geometri || {};
  const olcuMu = g.mod === 'olculer';
  const geo = h.geo;

  if (!olcuMu) {
    return `
    <div class="izgara" style="margin-top:14px">
      <div class="alan"><label>Mekân hacmi V (m³)</label>
        <input type="text" inputmode="decimal" data-yol="${y}.V" data-tur="sayi" value="${c.V}"></div>
      <div class="alan" style="justify-content:flex-end">
        <button class="dugme acik kucuk" data-eylem="cephe-olcu-moda-gec" data-idx="${i}">Oda boyutlarından hesapla (L×W×H)</button>
        <span class="ipucu">İç yan yolların (Df) hesaba katılması için oda boyutları gerekir.</span></div>
    </div>`;
  }

  return `
  <div class="izgara" style="margin-top:14px">
    <div class="alan"><label>Derinlik L (m)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.geometri.L" data-tur="sayi" value="${g.L}"></div>
    <div class="alan"><label>Genişlik W (m)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.geometri.W" data-tur="sayi" value="${g.W}"></div>
    <div class="alan"><label>Yükseklik H (m)</label>
      <input type="text" inputmode="decimal" data-yol="${y}.geometri.H" data-tur="sayi" value="${g.H}"></div>
    <div class="alan"><label>Hacim V (m³)</label>
      <input readonly value="${sayi(geo?.V, 2)}"></div>
    <div class="alan" style="justify-content:flex-end">
      <button class="dugme acik kucuk" data-eylem="cephe-hacim-moda-don" data-idx="${i}">Hacmi elle gir</button></div>
  </div>
  ${geo ? `<p class="soluk" style="font-size:12px">
    Dış duvar brüt alanları: ${geo.duvarlar.map((dv) => `D${dv.no} = ${sayi(dv.alan, 2)} m²`).join(' · ')}.
    Opak duvar alanı, brüt alandan o duvardaki doğramalar düşülerek bulunur.
    İç yan elemanlar cephe alanına eklenmez; dış duvarla birleşimlerinden Df yolu oluştururlar.
  </p>` : ''}

  <div class="canli-model">
    <div class="canli-model-baslik"><span class="canli-model-nokta"></span> Canlı 3B model
      <span class="soluk" style="margin-left:auto;text-transform:none;letter-spacing:0;font-weight:500">Döndürmek için sürükleyin</span>
    </div>
    <div class="oda-svg-sarmalayici" data-cephe-yolu="${kacis(y)}" data-mekan-adi="${kacis(c.ad || 'Mahal')}">
      ${cepheSVG(c, { mekanAdi: c.ad || 'Mahal', genislik: 720, yukseklik: 340 })}
    </div>
  </div>
  <p class="soluk" style="font-size:12px">
    Doğramalar ait oldukları duvarda gerçek en × boy ölçüleriyle çizilir; duvar üzerindeki
    yatay konumları temsilîdir (hesabı etkilemez).
  </p>

  <h3 style="margin-top:18px">İç yan elemanlar (Df yolları)</h3>
  <div class="tablo-sar"><table>
    <thead><tr><th>Yüzey</th><th>Eleman</th><th>Sıva</th><th class="sayi">Yüz</th>
      <th class="sayi">m′</th><th class="sayi">Rw</th><th>Birleşim</th><th>Esnek</th><th>Bağlantı</th></tr></thead>
    <tbody>
    ${(c.yanElemanlar || []).map((ye, j) => {
      const yy = `${y}.yanElemanlar.${j}`;
      const hy = h.yanElemanlar?.find((x) => x.rol === ye.rol);
      const pasif = ye.rol === 'icArkaDuvar' && c.konum !== 'kose';
      const katmanliMi = (ye.katmanlar || []).length > 0;
      return `<tr${pasif ? ' style="opacity:.45"' : ''}>
        <td><b>${kacis(CEPHE_YAN_ROLLERI[ye.rol]?.kod || '')}</b> ${kacis(ye.ad)}</td>
        <td>${katmanliMi ? '<span class="rozet bilgi">Katmanlı</span>' : `<select data-yol="${yy}.elemanId" style="min-width:200px">${
              secenekler(ye.rol === 'icTavan' || ye.rol === 'icTaban' ? DOSEMELER : DUVARLAR, ye.elemanId, { gruplu: true })}</select>`}</td>
        <td>${katmanliMi ? '<span class="soluk">—</span>' : `<select data-yol="${yy}.sivaId" style="min-width:140px">${secenekler(SIVALAR, ye.sivaId)}</select>`}</td>
        <td>${katmanliMi ? '<span class="soluk">—</span>' : `<select data-yol="${yy}.sivaliYuzSayisi" data-tur="sayi" style="width:62px">${[0, 1, 2].map((n) =>
              `<option value="${n}"${n === ye.sivaliYuzSayisi ? ' selected' : ''}>${n}</option>`).join('')}</select>`}</td>
        <td class="sayi">${sayi(hy?._cozum?.mAlan)}</td>
        <td class="sayi">${sayi(hy?._cozum?.Rw)}</td>
        <td><select data-yol="${yy}.birlesim">
              <option value="T"${ye.birlesim === 'T' ? ' selected' : ''}>T</option>
              <option value="X"${ye.birlesim === 'X' ? ' selected' : ''}>X</option></select></td>
        <td style="text-align:center"><input type="checkbox" data-yol="${yy}.esnekBaglanti" data-tur="bool"${ye.esnekBaglanti ? ' checked' : ''}></td>
        <td class="soluk" style="font-size:12px">${pasif ? 'orta mahalde pasif' : `${hy?.baglantiSayisi ?? 0} dış duvar`}</td>
      </tr>
      <tr${pasif ? ' style="opacity:.45"' : ''}>
        <td colspan="9" style="background:var(--yuzey-2)">
          <div class="satir-eylem" style="margin:8px 0">
            ${katmanliMi
              ? `<span class="rozet bilgi">Katmanlı yapı</span>
                 <button class="dugme acik kucuk" data-eylem="basit-moda-don" data-yol-tabani="${yy}">Basit seçime dön</button>`
              : `<button class="dugme acik kucuk" data-eylem="katmanli-moda-gec" data-yol-tabani="${yy}">Katmanlı yapıya geç</button>`}
          </div>
          ${katmanliMi ? katmanEditoru(yy, ye.katmanlar, { tur: 'duvar', kategori: (ye.rol === 'icTavan' || ye.rol === 'icTaban') ? 'doseme' : 'icDuvar', katmanDetay: hy?._cozum?.katmanDetay }) : ''}
        </td>
      </tr>`;
    }).join('')}
    </tbody>
  </table></div>`;
}

function kart(c, i, h) {
  const y = `cepheler.${i}`;
  const d = h.degerlendirme;
  const s = h.sonuc;
  const gerekliFizik = gerekliCepheYalitimi(c.disGurultu, 30);

  return `
  <section class="kart${katliMi(c.id) ? ' katli' : ''}">
    <div class="kart-baslik">
      <div style="flex:1"><input data-yol="${y}.ad" value="${kacis(c.ad)}" class="baslik-girdi"></div>
      <div class="satir-eylem">
        ${katliMi(c.id) ? `<span class="kart-ozet">
          <b>${s ? sayi(s.D2mnTw) : '—'}</b> dB ${uygunlukRozeti(d)}</span>` : ''}
        ${katlamaDugmesi(c.id)}
        <button class="dugme acik kucuk" data-eylem="kopyala-cephe" data-idx="${i}">Kopyala</button>
        <button class="dugme acik kucuk" data-eylem="sil-cephe" data-idx="${i}">Sil</button>
      </div>
    </div>

    <div class="izgara">
      <div class="alan"><label>Mekân</label>
        <select data-yol="${y}.mekanId">${mekanSecenekleri(c.mekanId)}</select>
        <span class="ipucu">Hassasiyet: <b>${kacis(HASSASIYET_DERECELERI[d?.mekan?.hassasiyet] || '—')}</b></span></div>
      <div class="alan"><label>Cephedeki çevresel gürültü düzeyi L<sub>gag</sub> (dBA)</label>
        <input type="text" inputmode="decimal" data-yol="${y}.disGurultu" data-tur="sayi" value="${c.disGurultu}">
        <span class="ipucu">Gündüz-akşam-gece eşdeğer düzeyi · Tablo aralığı: <b>${kacis(d?.aralik?.ad || '—')}</b></span></div>
      <div class="alan"><label>Cephe biçimi</label>
        <select data-yol="${y}.bicim">${secenekler(BICIMLER, c.bicim)}</select></div>
      <div class="alan"><label>Mahal konumu</label>
        <select data-yol="${y}.konum">
          <option value="orta"${c.konum !== 'kose' ? ' selected' : ''}>Orta mahal — tek dış duvar</option>
          <option value="kose"${c.konum === 'kose' ? ' selected' : ''}>Köşe mahal — iki dış duvar</option>
        </select>
        <span class="ipucu">Köşe mahalde D1 (L×H) ve D2 (W×H) birlikte değerlendirilir.</span></div>
      <div class="alan"><label>Spektrum düzeltmesi C<sub>tr</sub> (dB)</label>
        <input type="text" inputmode="decimal" data-yol="${y}.ctr" data-tur="sayi" value="${c.ctr ?? -3}">
        <span class="ipucu">D<sub>nT,A,tr</sub> = D2m,nT,w + C<sub>tr</sub> — uygunluk bu değerle karara bağlanır (EK-3 Tablo 3.1).</span></div>
      <div class="alan"><label>Manuel D2m,nT,w hedefi (dB)</label>
        <input type="text" inputmode="decimal" data-yol="${y}.manuelHedef" data-tur="sayiVeyaNull" value="${c.manuelHedef ?? ''}"
               placeholder="${d ? sayi(d.yonetmelikGereken, 0) : '—'} (yönetmelik)">
        <span class="ipucu">${c.manuelHedef == null ? 'Yönetmelik hedefi etkin.' : 'Manuel hedef etkin — raporda etiketlenir.'}</span></div>
    </div>

    ${geometriBolumu(y, c, h, i)}

    <h3 style="margin-top:18px">Yüzeysel cephe elemanları</h3>
    <div class="tablo-sar"><table>
      <thead><tr><th>Ad</th><th>Tür</th><th>Duvar</th><th>Eleman / yapı</th>
        <th class="sayi">En (m)</th><th class="sayi">Boy (m)</th><th class="sayi">S (m²)</th>
        <th class="sayi">Rw (dB)</th><th class="sayi">Pay (%)</th><th></th></tr></thead>
      <tbody>
      ${(c.elemanlar || []).map((e, j) => cepheElemanSatirlari(y, i, c, e, j, h)).join('')}
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
              <td><input type="text" inputmode="decimal" data-yol="${ky}.adet" data-tur="sayi" value="${k.adet}" style="width:70px"></td>
              <td class="sayi">${sayi(hk.Dnew, 0)}</td>
              <td><input type="text" inputmode="decimal" data-yol="${ky}.DnewBeyan" data-tur="sayiVeyaNull" value="${k.DnewBeyan ?? ''}" style="width:85px" placeholder="—"></td>
              <td class="sayi">${pay ? sayi(pay.payYuzde, 1) : '—'}</td>
              <td><button class="dugme acik kucuk" data-eylem="sil-kucuk" data-idx="${i}" data-alt="${j}">Sil</button></td>
            </tr>`;
          }).join('')}
      </tbody>
    </table></div>
    <button class="dugme acik kucuk" data-eylem="ekle-kucuk" data-idx="${i}">+ Küçük eleman ekle</button>

    <div class="sonuc-serit${d && !d.uygun ? ' uygunsuz' : ''}">
      <div class="hucre"><span class="etiket">Bileşik R′w</span><span class="deger">${sayi(s.RwBilesik)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">Yan yollarla R′w</span><span class="deger">${sayi(s.RwGorunur)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">Cephe alanı S</span><span class="deger">${sayi(s.S)} <small>m²</small></span></div>
      <div class="hucre"><span class="etiket">ΔLfs + hacim terimi</span><span class="deger">${sayi(s.dLfs + s.hacimTerimi)} <small>dB</small></span></div>
      <div class="hucre one-cikan"><span class="etiket">D2m,nT,w (hesaplanan)</span><span class="deger">${sayi(s.D2mnTw)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">D<sub>nT,A,tr</sub> (C<sub>tr</sub> ${sayi(s.ctr, 0)})</span><span class="deger">${sayi(s.DnTAtr)} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">${d?.hedefKaynagi === 'manuel' ? 'Manuel hedef' : `Gereken (${kacis(d?.hedefSinif ?? '—')} sınıfı)`}</span><span class="deger">${d ? sayi(d.gereken, 0) : '—'} <small>dB</small></span></div>
      <div class="hucre"><span class="etiket">Elde edilen sınıf</span><span>${sinifRozeti(d?.eldeEdilenSinif)}</span></div>
      <div class="hucre"><span class="etiket">Sonuç</span><span>${uygunlukRozeti(d)}${d && Number.isFinite(d.fark) ? ` <small>(${d.fark >= 0 ? '+' : ''}${sayi(d.fark)} dB)</small>` : ''}</span></div>
    </div>
    ${s.yanYollar?.length ? `<details><summary>Ses iletim yolları ve enerji payları</summary>
      <div class="tablo-sar"><table>
        <thead><tr><th>Yol</th><th class="sayi">Yalıtım R</th><th class="sayi">Enerji payı</th></tr></thead>
        <tbody>${s.yolPaylari.map((p) => `<tr>
          <td>${kacis(p.ad)}</td><td class="sayi">${sayi(p.R)} dB</td><td class="sayi">%${sayi(p.payYuzde, 1)}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </details>` : ''}

    <p class="soluk" style="font-size:12px">
      Bilgi: 30 dBA iç gürültü hedefi için gereken kaba yalıtım farkı ${sayi(gerekliFizik, 0)} dB'dir
      (${sayi(c.disGurultu, 0)} − 30). Yönetmelik gereği ile bu değerden büyük olanı esas alınmalıdır.
    </p>

    ${d ? `<details><summary>${kacis(d.kaynak)} — sınıf değerleri</summary>
      <div class="tablo-sar"><table>
        <thead><tr><th>Sınıf</th>${Object.keys(d.satir).map((c2) => `<th class="sayi">${c2}</th>`).join('')}</tr></thead>
        <tbody>
          <tr><td>D<sub>nT,A,tr</sub> en az (dB)</td>${Object.values(d.satir).map((v) => `<td class="sayi">${sayi(v, 0)}</td>`).join('')}</tr>
          <tr><td class="soluk">L<sub>gag</sub>'dan indirim (dB)</td>${Object.keys(d.satir).map((c2) => `<td class="sayi soluk">−${sayi(d.indirim?.[c2], 0)}</td>`).join('')}</tr>
        </tbody>
      </table></div>
      <p class="soluk" style="font-size:12px">
        Hassasiyet: ${kacis(HASSASIYET_DERECELERI[d.mekan.hassasiyet] || d.mekan.hassasiyet)} ·
        L<sub>gag</sub> = ${sayi(d.disGurultu, 0)} dBA. ${kacis(d.dogrulama)}</p>
    </details>` : ''}
  </section>`;
}

/* ── Cephe elemanı satırları (ana satır + katman/ayrıntı satırı) ─────── */

function cepheElemanSatirlari(y, i, c, e, j, h) {
  const ey = `${y}.elemanlar.${j}`;
  const he = h.yuzeysel[j];
  const s = h.sonuc;
  const pay = s.paylar.find((p) => p.ad === he.ad && p.tip === 'yuzeysel');
  const duvarMi = e.tur === 'duvar';
  const katmanliMi = (e.katmanlar || []).length > 0;
  const olcuModu = c.geometri?.mod === 'olculer';

  // Geometri modunda opak duvar alanı brütten doğramalar düşülerek bulunur.
  const alanHucresi = duvarMi
    ? (olcuModu
        ? `<input readonly value="${sayi(he.S, 2)}" style="width:82px" title="Brüt duvar alanından doğramalar düşülerek hesaplanır">`
        : `<input type="text" inputmode="decimal" data-yol="${ey}.S" data-tur="sayi" value="${e.S}" style="width:82px">`)
    : `<input readonly value="${sayi(he.S, 2)}" style="width:82px" title="En × boy">`;

  const anaSatir = `<tr${he.etkin === false ? ' style="opacity:.45"' : ''}>
    <td><input data-yol="${ey}.ad" value="${kacis(e.ad)}" style="min-width:120px"></td>
    <td><select data-yol="${ey}.tur" style="min-width:104px">
          <option value="duvar"${duvarMi ? ' selected' : ''}>Duvar</option>
          <option value="dograma"${!duvarMi ? ' selected' : ''}>Doğrama</option></select></td>
    <td><select data-yol="${ey}.duvarNo" data-tur="sayi" style="width:72px">
          <option value="1"${(e.duvarNo || 1) === 1 ? ' selected' : ''}>D1</option>
          <option value="2"${e.duvarNo === 2 ? ' selected' : ''}>D2</option></select></td>
    <td>${duvarMi && katmanliMi
          ? '<span class="rozet bilgi">Katmanlı</span>'
          : `<select data-yol="${ey}.elemanId" style="min-width:190px">${
              secenekler(duvarMi ? DUVARLAR : DOGRAMALAR, e.elemanId, { gruplu: true })}</select>`}</td>
    <td>${duvarMi ? '<span class="soluk">—</span>'
          : `<input type="text" inputmode="decimal" data-yol="${ey}.en" data-tur="sayi" value="${e.en ?? ''}" style="width:72px">`}</td>
    <td>${duvarMi ? '<span class="soluk">—</span>'
          : `<input type="text" inputmode="decimal" data-yol="${ey}.boy" data-tur="sayi" value="${e.boy ?? ''}" style="width:72px">`}</td>
    <td>${alanHucresi}</td>
    <td class="sayi">${sayi(he.Rw)}</td>
    <td class="sayi">${pay ? sayi(pay.payYuzde, 1) : '—'}</td>
    <td><button class="dugme acik kucuk" data-eylem="sil-cephe-eleman" data-idx="${i}" data-alt="${j}">Sil</button></td>
  </tr>`;

  // Doğramalarda katman kavramı yoktur; yalnızca beyan Rw alanı gösterilir.
  const ayrinti = duvarMi
    ? `<div class="satir-eylem" style="margin:8px 0">
         ${katmanliMi
           ? `<span class="rozet bilgi">Katmanlı yapı</span>
              <button class="dugme acik kucuk" data-eylem="basit-moda-don" data-yol-tabani="${ey}">Basit seçime dön</button>`
           : `<button class="dugme acik kucuk" data-eylem="katmanli-moda-gec" data-yol-tabani="${ey}">Katmanlı yapıya geç</button>`}
       </div>
       ${katmanliMi
         ? katmanEditoru(ey, e.katmanlar, { tur: 'duvar', kategori: 'disDuvar', katmanDetay: he._cozum.katmanDetay })
         : `<div class="izgara dar" style="max-width:520px">
              <div class="alan"><label>Sıva</label>
                <select data-yol="${ey}.sivaId">${secenekler(SIVALAR, e.sivaId)}</select></div>
              <div class="alan"><label>Sıvalı yüz sayısı</label>
                <select data-yol="${ey}.sivaliYuzSayisi" data-tur="sayi">${[0, 1, 2].map((n) =>
                  `<option value="${n}"${n === e.sivaliYuzSayisi ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
              <div class="alan"><label>Beyan yoğunluk (kg/m³)</label>
                <input type="text" inputmode="decimal" data-yol="${ey}.yogunlukBeyan" data-tur="sayiVeyaNull" value="${e.yogunlukBeyan ?? ''}" placeholder="${kacis(String(he._cozum.eleman?.yogunluk ?? '—'))}"></div>
              <div class="alan"><label>Beyan Rw (dB)</label>
                <input type="text" inputmode="decimal" data-yol="${ey}.RwBeyan" data-tur="sayiVeyaNull" value="${e.RwBeyan ?? ''}" placeholder="—"></div>
            </div>`}`
    : `<div class="izgara dar" style="max-width:420px;margin:8px 0">
         <div class="alan"><label>Beyan Rw (dB)</label>
           <input type="text" inputmode="decimal" data-yol="${ey}.RwBeyan" data-tur="sayiVeyaNull" value="${e.RwBeyan ?? ''}" placeholder="—">
           <span class="ipucu">Doğramalarda ölçülmüş sistem değeri (çerçeve + cam) esastır.</span></div>
       </div>`;

  const detaySatir = `<tr>
    <td></td>
    <td colspan="9" style="background:var(--yuzey-2)">${ayrinti}</td>
  </tr>`;

  return anaSatir + detaySatir;
}
