/**
 * yardimcilar.js — Masaüstü kabuğunun Electron'a ihtiyaç duymayan saf mantığı.
 *
 * Ana süreç ve güncelleyici, `electron` modülünü içe aktardıkları için ancak
 * Electron çalışırken yüklenebilir. Sınanmaya değer mantık bu dosyada durur:
 * böylece `node --test` ile depo genelindeki diğer testlerle birlikte koşar.
 */

import path from 'node:path';

/**
 * `sagg://yerel/<yol>` adresini depo kökündeki gerçek dosya yoluna çevirir.
 *
 * Dizin dışına çıkma (path traversal) girişimlerinde `null` döner; ana süreç
 * bunu 403 olarak yanıtlar. Yol boşsa `index.html` varsayılır.
 *
 * @param {string} kok Web uygulamasının kök dizini (mutlak)
 * @param {string} url İstenen tam adres
 * @returns {string|null} Mutlak dosya yolu ya da izin verilmiyorsa null
 */
export function guvenliYol(kok, url) {
  let pathname;
  try { ({ pathname } = new URL(url)); } catch { return null; }
  const goreli = decodeURIComponent(pathname).replace(/^[\\/]+/, '') || 'index.html';

  // 1. katman: çözülmüş yolda '..' parçası varsa reddet. Bu denetim platformdan
  // bağımsızdır — ters bölü (\) Linux'ta sıradan bir karakter, Windows'ta ise
  // dizin ayırıcısıdır; uygulama Windows'ta çalıştığı için ikisi de ayırıcı
  // sayılır. (Düz '../' dizileri new URL() aşamasında zaten erimiş olur;
  // buraya yalnızca %2e%2e gibi kodlanmış olanlar ulaşır.)
  if (goreli.split(/[\\/]+/).some((parca) => parca === '..')) return null;

  // 2. katman: her ihtimale karşı sonucun gerçekten kökün altında kaldığını doğrula.
  const kokMutlak = path.resolve(kok);
  const hedef = path.resolve(path.join(kokMutlak, goreli));
  if (hedef !== kokMutlak && !hedef.startsWith(kokMutlak + path.sep)) return null;
  return hedef;
}

/**
 * Sürüm notlarını (GitHub'dan HTML ya da dizi olarak gelebilir) pencerede
 * gösterilebilecek düz metne indirger.
 */
export function surumNotu(bilgi) {
  const ham = bilgi?.releaseNotes;
  const metin = Array.isArray(ham)
    ? ham.map((n) => (typeof n === 'string' ? n : n?.note || '')).join('\n')
    : (ham || '');
  return String(metin)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h\d)>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 1200);
}

/** İndirme ilerlemesini 0–100 arası tam sayıya sıkıştırır. */
export function yuzde(ilerleme) {
  const d = Number(ilerleme?.percent);
  if (!Number.isFinite(d)) return 0;
  return Math.min(100, Math.max(0, Math.round(d)));
}

/* ── Uygulama menüsü ─────────────────────────────────────────────── */

/** Menüde açılacak dış adresler. */
/**
 * Pencerenin taban rengi.
 *
 * Koyu tema açılışında beyaz bir parlama olmasın diye uygulama penceresi
 * koyu bir zeminle açılır.
 */
export const PENCERE_ZEMINI = '#12161d';

/**
 * PDF'e aktarırken kullanılan taban rengi — BEYAZ OLMAK ZORUNDA.
 *
 * `@page` kenar boşlukları belge tuvalinin dışında kalır; oraya
 * biçemlerdeki `html{background:#fff}` ulaşmaz ve Chromium boşluğu
 * pencerenin taban rengiyle doldurur. Taban koyu kaldığında PDF'in
 * kenarları koyu basılıyordu; tarayıcıda taban beyaz olduğu için web
 * sürümünde bu sorun hiç görülmüyordu.
 *
 * Ölçüldü: düzeltme öncesi sayfa kenarları (18,22,29), sonrasında
 * (255,255,255).
 */
export const YAZDIRMA_ZEMINI = '#ffffff';

export const BAGLANTILAR = {
  web: 'https://aligokten.github.io/SAGG-Akustik_Rapor/',
  site: 'https://www.saggplus.com',
  destek: 'info@saggplus.com',
};

/**
 * Uygulama menüsünün şablonu — saf veri, Electron'a bağımlı değildir.
 *
 * Menü buradan üretilir ki içeriği sınanabilsin: hangi girdilerin bulunduğu
 * (ve BULUNMADIĞI) test edilebilir bir olgudur. Örneğin "Geliştirici
 * araçları" ve "Sürüm notları" girdileri bilinçli olarak yoktur.
 *
 * @param {Object} eylemler Tıklama davranışları (ana süreç sağlar)
 * @param {string} surum Uygulama sürümü ("Hakkında" ve destek konusu için)
 */
export function menuSablonu(eylemler, surum) {
  const e = eylemler || {};
  return [
    {
      label: 'Dosya',
      submenu: [
        { label: 'Raporu PDF olarak kaydet…', accelerator: 'CmdOrCtrl+P', click: e.pdf },
        { type: 'separator' },
        { label: 'Çıkış', role: 'quit' },
      ],
    },
    {
      label: 'Düzen',
      submenu: [
        { label: 'Geri al', role: 'undo' }, { label: 'Yinele', role: 'redo' },
        { type: 'separator' },
        { label: 'Kes', role: 'cut' }, { label: 'Kopyala', role: 'copy' },
        { label: 'Yapıştır', role: 'paste' }, { label: 'Tümünü seç', role: 'selectAll' },
      ],
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yeniden yükle', role: 'reload' },
        { label: 'Yakınlaştır', role: 'zoomIn' },
        { label: 'Uzaklaştır', role: 'zoomOut' },
        { label: 'Normal boyut', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tam ekran', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Yardım',
      submenu: [
        { label: 'Güncellemeleri denetle…', click: e.guncelleme },
        { type: 'separator' },
        { label: 'Web sürümünü aç (tarayıcıda)', click: e.web },
        { label: `SAGG+ — ${BAGLANTILAR.site.replace('https://', '')}`, click: e.site },
        { label: `Destek: ${BAGLANTILAR.destek}`, click: e.destek },
        { type: 'separator' },
        { label: 'Hakkında', click: e.hakkinda },
      ],
    },
  ];
}

/** Şablondaki tüm girdi etiketlerini (ve rollerini) düz listeye indirger. */
export function menuEtiketleri(sablon) {
  const cikti = [];
  for (const ust of sablon || []) {
    cikti.push(ust.label);
    for (const alt of ust.submenu || []) {
      if (alt.label) cikti.push(alt.label);
      if (alt.role) cikti.push(`role:${alt.role}`);
    }
  }
  return cikti;
}
