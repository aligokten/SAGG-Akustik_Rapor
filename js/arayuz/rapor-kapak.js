/**
 * rapor-kapak.js — Raporun ön kapağı ve arka kapağı.
 *
 * Tasarım, kullanıcının Canva'da hazırladığı kapaktan alınmıştır. Kapak
 * düz bir görüntü olarak gömülmez: proje adı, belediye ve mahalle/ada/parsel
 * proje künyesinden gelir, bu yüzden metin CANLI olmak zorundadır. Sabit
 * olan yalnızca dekoratif parçalardır (mimari çizim filigranı, SAGG marka
 * işareti ve satır simgeleri); onlar kapak PDF'inden çıkarılıp
 * `assets/kapak-*.png` olarak depoya alınmıştır.
 */

import { kacis } from './ortak.js';
import { LISANS, programSurumu } from '../veri/lisans.js';

/** Kapak ve arka kapakta yinelenen çerçeve (filigran, kenar çizgileri, künye). */
function cerceve(yanEtiket, ic) {
  return `
  <div class="kapak">
    <img class="kapak-filigran" src="assets/kapak-filigran.png" alt="">
    <div class="kapak-yan">${kacis(yanEtiket)}</div>
    <div class="kapak-ust-cizgi"><span class="kapak-arti">+</span></div>
    <div class="kapak-ic">${ic}</div>
    <div class="kapak-alt">
      <span class="kapak-kure" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18"/>
        </svg>
      </span>
      <span>${kacis(LISANS.alanAdi)}</span>
      <span class="kapak-ayrac">|</span>
      <span>${kacis(LISANS.eposta)}</span>
    </div>
  </div>`;
}

/** Marka bloğu: SAGG işareti ve alt başlık. */
function marka() {
  return `
  <div class="kapak-marka">
    <img class="kapak-sagg" src="assets/kapak-sagg.png" alt="SAGG">
    <div class="kapak-marka-alt">İnşaat Mimarlık Akustik</div>
  </div>`;
}

/** "SAGG AKUSTİK HESAP v… ile hazırlanmıştır." satırı. */
function surumSatiri() {
  return `
  <div class="kapak-surum">
    <img src="assets/logo.png" alt="">
    <span>SAGG AKUSTİK HESAP v${kacis(programSurumu())} ile hazırlanmıştır.</span>
  </div>`;
}

/**
 * Kapaktaki künye satırları.
 *
 * Değeri boş olan satır kapağa GİRMEZ: boş bir "İlgili Belediye Adı"
 * satırı, doldurulmayı bekleyen bir form gibi görünürdü.
 */
function kunyeSatirlari(p) {
  const mahalleAdaParsel = [
    p.mahalle && `${p.mahalle}`,
    [p.ada, p.parsel].filter(Boolean).join('/'),
  ].filter(Boolean).join(' / ');

  const satirlar = [
    { simge: 'assets/kapak-ikon-proje.png', etiket: 'Proje Adı', deger: p.ad },
    { simge: 'assets/kapak-ikon-belediye.png', etiket: 'İlgili Belediye Adı', deger: p.belediye },
    { simge: 'assets/kapak-ikon-konum.png', etiket: 'Mahalle / Ada / Parsel', deger: mahalleAdaParsel },
  ].filter((s) => String(s.deger || '').trim());

  if (!satirlar.length) return '';
  return `<div class="kapak-kunye">${satirlar.map((s) => `
    <div class="kapak-kunye-satir">
      <img class="kapak-kunye-simge" src="${s.simge}" alt="">
      <div class="kapak-kunye-etiket">${kacis(s.etiket)}</div>
      <div class="kapak-kunye-deger">${kacis(s.deger.toLocaleUpperCase('tr'))}</div>
    </div>`).join('')}</div>`;
}

/** Ön kapak sayfası. */
export function kapakSayfasi(p) {
  return cerceve('MİMARİ AKUSTİK RAPOR', `
    ${marka()}
    <h1 class="kapak-baslik">Mimari<br>Akustik<br>Rapor</h1>
    ${surumSatiri()}
    ${kunyeSatirlari(p)}
    <div class="kapak-imza"><span>{e-imza</span><span>e-imza}</span></div>
  `);
}

/** Arka kapak sayfası — marka bloğu sayfanın altındadır. */
export function arkaKapakSayfasi() {
  return cerceve('MİMARİ AKUSTİK RAPOR', `
    <div class="kapak-arka-alt">
      ${marka()}
      ${surumSatiri()}
    </div>
  `);
}
