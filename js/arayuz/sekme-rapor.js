/**
 * sekme-rapor.js — Yönetmelik kapsamındaki akustik rapor için yazdırılabilir
 * özet çıktı.
 */

import { kacis, sayi, uygunlukRozeti, sinifRozeti } from './ortak.js';
import { SURUM, BINA_TURLERI, ASGARI_SINIFLAR } from '../veri/yonetmelik.js';
import { MODELLER } from '../cekirdek/kutle-kanunu.js';
import { OKTAV_BANTLARI } from '../cekirdek/temel.js';
import { odaSVG } from './oda-cizimi.js';

export function ciz(durum, s) {
  const p = durum.proje;
  const asgari = ASGARI_SINIFLAR[p.durum] || 'C';

  return `
  <div class="yazdirma-gizle" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    <button class="dugme" data-eylem="yazdir">Raporu yazdır / PDF'e aktar</button>
    <span class="soluk" style="align-self:center;font-size:12.5px">Tarayıcının yazdırma penceresinden "PDF olarak kaydet" seçilebilir.</span>
  </div>

  <div class="rapor">
    <h1 style="font-size:22px">Akustik Rapor Özeti</h1>
    <p class="soluk">${kacis(SURUM.yonetmelik)} — ${kacis(SURUM.resmiGazete)}</p>

    <h2>1. Proje künyesi</h2>
    <div class="kunye">
      <div><b>Proje:</b> ${kacis(p.ad || '—')}</div>
      <div><b>Ada / parsel:</b> ${kacis(p.adaParsel || '—')}</div>
      <div><b>İşveren:</b> ${kacis(p.isveren || '—')}</div>
      <div><b>Proje müellifi:</b> ${kacis(p.muellif || '—')}</div>
      <div><b>Akustik uzman:</b> ${kacis(p.akustikUzman || '—')}</div>
      <div><b>Tarih:</b> ${kacis(p.tarih || '—')}</div>
      <div><b>Bina türü:</b> ${kacis(BINA_TURLERI[p.binaTuru] || p.binaTuru)}</div>
      <div><b>Hedef akustik performans sınıfı:</b> ${kacis(p.hedefSinif)} (asgari: ${kacis(asgari)})</div>
    </div>

    <h2>2. Hesap yöntemi ve kabuller</h2>
    <ul style="font-size:13.5px">
      <li>Ayırıcı elemanlarda hava doğuşlu ses yalıtımı: TS EN 12354-1, basitleştirilmiş tek sayılı model
          (doğrudan yol Dd + yan yollar Ff, Fd, Df; Kij değerleri Ek-E bağıntıları ile).</li>
      <li>Döşemelerde darbe sesi yalıtımı: TS EN 12354-2, L′n,w = Ln,w,eq − ΔLw + K.</li>
      <li>Cephede ses yalıtımı: TS EN 12354-3, D2m,nT,w = R′w,bileşik + ΔLfs + 10·lg(V/(6·T₀·S)).</li>
      <li>Reverberasyon süresi: Sabine bağıntısı, hava soğurması dahil.</li>
      <li>Beyan edilmiş Rw değeri girilmemiş elemanlarda kestirim modeli:
          <b>${kacis(MODELLER[p.rwModeli]?.ad || p.rwModeli)}</b>.</li>
      <li>Referans reverberasyon süresi T₀ = ${sayi(p.T0, 1)} s; uygulanan emniyet payı ${sayi(p.emniyetPayi, 1)} dB.</li>
    </ul>
    ${p.notlar ? `<p><b>Proje notları:</b> ${kacis(p.notlar)}</p>` : ''}

    <h2>3. Genel sonuç</h2>
    <p>
      Hesaplanan bileşenlerin belirleyici akustik performans sınıfı
      ${sinifRozeti(s.genelSinif)} <b>${s.genelSinif ? `${s.genelSinif} sınıfı` : '(hesaplanmadı)'}</b>'dır.
      ${s.tumUygun
        ? `Değerlendirilen tüm bileşenler hedeflenen ${kacis(p.hedefSinif)} sınıfı gereksinimlerini sağlamaktadır.`
        : `<b>Değerlendirilen ${s.uygunsuzlar.length} bileşen hedeflenen ${kacis(p.hedefSinif)} sınıfı gereksinimini sağlamamaktadır:</b> ${s.uygunsuzlar.map(kacis).join('; ')}.`}
    </p>

    ${bolumAyirici(s)}
    ${bolumDarbe(s)}
    ${bolumCephe(s)}
    ${bolumReverberasyon(s)}

    <h2>Ekler ve doğrulama</h2>
    <p style="font-size:13px">
      Bu özet, kullanılan yönetmelik veri katmanının <b>${kacis(SURUM.veriSurumu)}</b> sürümüne dayanır.
      Veri katmanının doğrulama durumu: <b>${kacis(SURUM.dogrulama)}</b>. Rapor, resmî işlem öncesinde
      yetkili akustik uzman tarafından ürün beyan değerleri ve yönetmeliğin yürürlükteki metniyle
      kontrol edilmelidir.
    </p>
  </div>`;
}

function bolumAyirici(s) {
  if (!s.ayiricilar.length) return '';
  return `
  <h2>4. Ayırıcı elemanlarda hava doğuşlu ses yalıtımı (DnT,w)</h2>
  <div class="tablo-sar"><table>
    <thead><tr>
      <th>Eleman</th><th>Kaynak → Alıcı</th><th class="sayi">S (m²)</th><th class="sayi">V (m³)</th>
      <th class="sayi">Rw (dB)</th><th class="sayi">R′w (dB)</th><th class="sayi">DnT,w (dB)</th>
      <th class="sayi">Gereken</th><th>Sınıf</th><th>Sonuç</th>
    </tr></thead>
    <tbody>${s.ayiricilar.map((a) => {
      const d = a.degerlendirme;
      const S = a.geo ? a.geo.S : a.kayit.S;
      const V = a.geo ? a.geo.V : a.kayit.V;
      return `<tr>
        <td>${kacis(a.kayit.ad)}</td>
        <td>${kacis(d?.kaynakMekan?.ad || '—')} → ${kacis(d?.aliciMekan?.ad || '—')}</td>
        <td class="sayi">${sayi(S)}</td>
        <td class="sayi">${sayi(V, 0)}</td>
        <td class="sayi">${sayi(a.RwAyirici)}</td>
        <td class="sayi">${sayi(a.sonuc.RwAksan)}</td>
        <td class="sayi"><b>${sayi(a.sonuc.DnTw)}</b></td>
        <td class="sayi">${d ? sayi(d.gereken, 0) : '—'}</td>
        <td>${d?.eldeEdilenSinif || '—'}</td>
        <td>${uygunlukRozeti(d)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>
  ${s.ayiricilar.filter((a) => a.geo && a.kayit.geometri?.mod === 'olculer').map((a) => `
  <div style="max-width:520px;margin:14px auto;break-inside:avoid">
    <p style="text-align:center;font-size:12.5px;font-weight:600;margin-bottom:4px">${kacis(a.kayit.ad)}</p>
    ${odaSVG(a.kayit.geometri, { oda1Adi: 'Kaynak mekân', oda2Adi: 'Alıcı mekân', genislik: 520, yukseklik: 340 })}
  </div>`).join('')}`;
}

function bolumDarbe(s) {
  if (!s.darbeler.length) return '';
  return `
  <h2>5. Döşemelerde darbe sesi yalıtımı (L′nT,w)</h2>
  <div class="tablo-sar"><table>
    <thead><tr>
      <th>Döşeme</th><th>Üst → Alt</th><th class="sayi">Ln,w,eq</th><th class="sayi">ΔLw</th>
      <th class="sayi">K</th><th class="sayi">L′nT,w</th><th class="sayi">İzin verilen</th>
      <th>Sınıf</th><th>Sonuç</th>
    </tr></thead>
    <tbody>${s.darbeler.map((x) => {
      const d = x.degerlendirme;
      return `<tr>
        <td>${kacis(x.kayit.ad)}</td>
        <td>${kacis(d?.ustMekan?.ad || '—')} → ${kacis(d?.altMekan?.ad || '—')}</td>
        <td class="sayi">${sayi(x.sonuc.LnwEq)}</td>
        <td class="sayi">−${sayi(x.sonuc.dLwToplam)}</td>
        <td class="sayi">+${sayi(x.sonuc.K)}</td>
        <td class="sayi"><b>${sayi(x.sonuc.LnTw)}</b></td>
        <td class="sayi">${d ? sayi(d.gereken, 0) : '—'}</td>
        <td>${d?.eldeEdilenSinif || '—'}</td>
        <td>${uygunlukRozeti(d)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function bolumCephe(s) {
  if (!s.cepheler.length) return '';
  return `
  <h2>6. Cephede ses yalıtımı (D2m,nT,w)</h2>
  <div class="tablo-sar"><table>
    <thead><tr>
      <th>Cephe</th><th>Mekân</th><th class="sayi">Dış gürültü (dBA)</th><th class="sayi">R′w bileşik</th>
      <th class="sayi">S (m²)</th><th class="sayi">D2m,nT,w</th><th class="sayi">Gereken</th>
      <th>Sınıf</th><th>Sonuç</th>
    </tr></thead>
    <tbody>${s.cepheler.map((x) => {
      const d = x.degerlendirme;
      return `<tr>
        <td>${kacis(x.kayit.ad)}</td>
        <td>${kacis(d?.mekan?.ad || '—')}</td>
        <td class="sayi">${sayi(x.kayit.disGurultu, 0)}</td>
        <td class="sayi">${sayi(x.sonuc.RwBilesik)}</td>
        <td class="sayi">${sayi(x.sonuc.S)}</td>
        <td class="sayi"><b>${sayi(x.sonuc.D2mnTw)}</b></td>
        <td class="sayi">${d ? sayi(d.gereken, 0) : '—'}</td>
        <td>${d?.eldeEdilenSinif || '—'}</td>
        <td>${uygunlukRozeti(d)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function bolumReverberasyon(s) {
  if (!s.hacimler.length) return '';
  return `
  <h2>7. Reverberasyon süresi</h2>
  <div class="tablo-sar"><table>
    <thead><tr><th>Hacim</th><th class="sayi">V (m³)</th>
      ${OKTAV_BANTLARI.map((f) => `<th class="sayi">T ${f} Hz</th>`).join('')}
      <th class="sayi">T ort.</th><th class="sayi">İzin verilen</th><th>Sonuç</th></tr></thead>
    <tbody>${s.hacimler.map((x) => {
      const d = x.degerlendirme;
      return `<tr>
        <td>${kacis(x.kayit.ad)}</td>
        <td class="sayi">${sayi(x.kayit.V, 0)}</td>
        ${OKTAV_BANTLARI.map((f) => `<td class="sayi">${sayi(x.sonuc.T[f], 2)}</td>`).join('')}
        <td class="sayi"><b>${sayi(x.sonuc.Torta, 2)}</b></td>
        <td class="sayi">${d?.Tmax != null ? sayi(d.Tmax, 2) : '—'}</td>
        <td>${d ? (d.uygun ? '<span class="rozet uygun">Sağlanıyor</span>' : '<span class="rozet uygunsuz">Sağlanmıyor</span>') : '<span class="rozet notr">—</span>'}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}
