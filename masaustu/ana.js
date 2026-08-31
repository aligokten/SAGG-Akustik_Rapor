/**
 * ana.js — Electron ana süreci (main process).
 *
 * SAGG Akustik Hesap Aracı aslında saf bir web uygulamasıdır. Bu katman aynı
 * kodu Windows'ta kurulabilir bir masaüstü uygulaması olarak çalıştırır:
 * web sürümünde tek bir satır değişmez, `js/` ve `index.html` olduğu gibi
 * paketlenir.
 *
 * Neden `file://` değil de özel bir protokol?
 * ------------------------------------------
 * Uygulama projeleri, malzeme favorilerini, temayı ve yönetmelik veri paketini
 * `localStorage`'da tutar. Chromium `file://` kaynağına opak (opaque) bir origin
 * verdiği için orada `localStorage` erişimi SecurityError atar — yani dosyadan
 * açılan bir Electron penceresinde kayıt tutulamaz. Bu yüzden depo içeriği
 * `sagg://yerel/...` adresinden, gerçek ve güvenli bir origin üzerinden servis
 * edilir. Böylece kayıtlar, çerezler ve güvenlik davranışı web sürümüyle
 * birebir aynı olur.
 */

import { app, BrowserWindow, Menu, dialog, shell, protocol, net, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { guncellemeyiBaslat, guncellemeyiElleDenetle } from './guncelleyici.js';
import { guvenliYol, menuSablonu, BAGLANTILAR } from './yardimcilar.js';

const buDosya = path.dirname(fileURLToPath(import.meta.url));
/** Web uygulamasının kökü (index.html'in bulunduğu dizin). */
const KOK = path.join(buDosya, '..');

const SEMA = 'sagg';
const ANA_SAYFA = `${SEMA}://yerel/index.html`;

/** Tek örnek kilidi: ikinci kez açılırsa var olan pencere öne getirilir. */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  kur();
}

function kur() {
  // Özel şema, sayfa yüklenmeden önce "standart + güvenli" olarak tanıtılmalı;
  // aksi halde origin opak kalır ve localStorage yine çalışmaz.
  protocol.registerSchemesAsPrivileged([{
    scheme: SEMA,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  }]);

  app.setAppUserModelId('com.saggplus.akustik');

  app.on('second-instance', () => {
    const p = BrowserWindow.getAllWindows()[0];
    if (p) { if (p.isMinimized()) p.restore(); p.focus(); }
  });

  app.whenReady().then(() => {
    protokolBagla();
    ipcMain.handle('sagg:pdfe-aktar', (olay, dosyaAdi) =>
      pdfeAktar(BrowserWindow.fromWebContents(olay.sender), dosyaAdi));
    const pencere = pencereAc();
    menuKur(pencere);
    guncellemeyiBaslat(pencere);
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) pencereAc(); });
}

/**
 * `sagg://yerel/<yol>` isteklerini depo kökündeki dosyalara bağlar.
 * Yol, KOK dizininin dışına çıkamaz (path traversal koruması).
 */
function protokolBagla() {
  protocol.handle(SEMA, (istek) => {
    const hedef = guvenliYol(KOK, istek.url);
    if (!hedef) return new Response('Yasak', { status: 403 });
    return net.fetch(pathToFileURL(hedef).toString());
  });
}

function pencereAc() {
  const pencere = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#12161d',
    title: 'SAGG Akustik Hesap Aracı',
    icon: path.join(KOK, 'assets', 'favicon-512.png'),
    webPreferences: {
      preload: path.join(buDosya, 'onyukleme.cjs'),
      additionalArguments: [`--sagg-surum=${app.getVersion()}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  pencere.once('ready-to-show', () => pencere.show());
  pencere.loadURL(ANA_SAYFA);

  // Dış bağlantılar (yönetmelik/mevzuat adresleri) uygulamanın içinde değil,
  // kullanıcının kendi tarayıcısında açılır.
  pencere.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  pencere.webContents.on('will-navigate', (olay, url) => {
    if (!url.startsWith(`${SEMA}://`)) { olay.preventDefault(); shell.openExternal(url); }
  });

  return pencere;
}

/**
 * Raporu doğrudan PDF dosyasına yazar.
 *
 * Yazdırma penceresi açılmaz: masaüstü sürümünde kullanıcı bir yazıcı seçip
 * "PDF olarak kaydet" hedefini bulmak zorunda değildir; yalnızca dosyanın
 * nereye kaydedileceğini söyler. Sayfa, ekrandaki hâliyle değil `@media print`
 * kurallarıyla dökülür — yani kenar çubuğu ve düğmeler çıktıya girmez, sayfa
 * sonları rapordaki tanımlara uyar.
 *
 * @param {BrowserWindow} pencere
 * @param {string} [dosyaAdi] Arayüzün önerdiği dosya adı (proje adından türer)
 * @returns {Promise<{durum:'kaydedildi'|'iptal'|'hata', yol?:string, mesaj?:string}>}
 */
async function pdfeAktar(pencere, dosyaAdi) {
  if (!pencere || pencere.isDestroyed()) return { durum: 'hata', mesaj: 'Pencere yok' };

  const onerilen = (dosyaAdi || 'akustik-rapor').replace(/[\\/:*?"<>|]/g, '-');
  const secim = await dialog.showSaveDialog(pencere, {
    title: 'Raporu PDF olarak kaydet',
    defaultPath: path.join(app.getPath('documents'), `${onerilen}.pdf`),
    filters: [{ name: 'PDF belgesi', extensions: ['pdf'] }],
    buttonLabel: 'Kaydet',
  });
  if (secim.canceled || !secim.filePath) return { durum: 'iptal' };

  try {
    const veri = await pencere.webContents.printToPDF({
      // Sayfa boyutu ve kenar boşlukları css/stil.css içindeki `@page`
      // kuralından okunur (preferCSSPageSize). Böylece masaüstü çıktısı ile
      // tarayıcının yazdırma penceresinden alınan çıktı birebir aynı olur.
      preferCSSPageSize: true,
      pageSize: 'A4',            // @page okunamazsa yedek
      printBackground: true,
    });
    await fs.writeFile(secim.filePath, veri);
    shell.showItemInFolder(secim.filePath);
    return { durum: 'kaydedildi', yol: secim.filePath };
  } catch (hata) {
    dialog.showMessageBox(pencere, {
      type: 'error',
      title: 'PDF oluşturulamadı',
      message: 'Rapor PDF dosyasına yazılamadı.',
      detail: String(hata?.message || hata),
      buttons: ['Tamam'],
    });
    return { durum: 'hata', mesaj: String(hata?.message || hata) };
  }
}

function menuKur(pencere) {
  // Menünün içeriği masaustu/yardimcilar.js içinde saf veri olarak durur;
  // burada yalnızca davranışlar bağlanır. Böylece hangi girdilerin bulunduğu
  // (ve bulunmadığı) testlerle sabitlenebiliyor.
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuSablonu({
    pdf: () => pdfeAktar(pencere),
    guncelleme: () => guncellemeyiElleDenetle(pencere),
    web: () => shell.openExternal(BAGLANTILAR.web),
    site: () => shell.openExternal(BAGLANTILAR.site),
    destek: () => shell.openExternal(`mailto:${BAGLANTILAR.destek}?subject=`
      + encodeURIComponent(`SAGG Akustik Hesap Aracı ${app.getVersion()} — destek`)),
    hakkinda: () => dialog.showMessageBox(pencere, {
      type: 'info',
      title: 'SAGG Akustik Hesap Aracı hakkında',
      message: `SAGG Akustik Hesap Aracı ${app.getVersion()}`,
      detail: [
        'Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik',
        '(RG 31/05/2017 – 30082) ve eklerine göre bina akustiği hesabı.',
        '',
        'Program Lisans Sahibi: Sinem Ali Gökten Grup İnşaat Mimarlık',
        'Akustik Müh. San. Tic. Ltd. Şti.',
        'Program Geliştirici: SAGG+ App — Tüm hakları saklıdır.',
        '',
        `${BAGLANTILAR.site.replace('https://', '')} · ${BAGLANTILAR.destek}`,
        '',
        'Rapor içeriğinden ve hesaplamalardan proje müellifi sorumludur.',
      ].join('\n'),
      buttons: ['Tamam'],
    }),
  }, app.getVersion())));
}
