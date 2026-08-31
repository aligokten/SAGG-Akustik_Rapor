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

import { app, BrowserWindow, Menu, dialog, shell, protocol, net } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { guncellemeyiBaslat, guncellemeyiElleDenetle } from './guncelleyici.js';
import { guvenliYol } from './yardimcilar.js';

const buDosya = path.dirname(fileURLToPath(import.meta.url));
/** Web uygulamasının kökü (index.html'in bulunduğu dizin). */
const KOK = path.join(buDosya, '..');

const SEMA = 'sagg';
/** Sürüm notlarının yayınlandığı adres (Yardım menüsü). */
const SURUM_NOTLARI = 'https://github.com/aligokten/SAGG-Akustik_Rapor/releases';
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

function menuKur(pencere) {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Dosya',
      submenu: [
        { label: 'Yazdır / PDF olarak kaydet', accelerator: 'CmdOrCtrl+P',
          click: () => pencere.webContents.print({}, () => {}) },
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
        { label: 'Geliştirici araçları', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Yardım',
      submenu: [
        { label: 'Güncellemeleri denetle…', click: () => guncellemeyiElleDenetle(pencere) },
        { type: 'separator' },
        { label: 'Web sürümünü aç (tarayıcıda)',
          click: () => shell.openExternal('https://aligokten.github.io/SAGG-Akustik_Rapor/') },
        { label: 'SAGG+ — www.saggplus.com',
          click: () => shell.openExternal('https://www.saggplus.com') },
        { label: 'Destek: info@saggplus.com',
          click: () => shell.openExternal('mailto:info@saggplus.com'
            + '?subject=' + encodeURIComponent(`SAGG Akustik Hesap Aracı ${app.getVersion()} — destek`)) },
        { label: 'Sürüm notları', click: () => shell.openExternal(SURUM_NOTLARI) },
        { type: 'separator' },
        {
          label: 'Hakkında',
          click: () => dialog.showMessageBox(pencere, {
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
              'www.saggplus.com · info@saggplus.com',
              '',
              'Rapor içeriğinden ve hesaplamalardan proje müellifi sorumludur.',
            ].join('\n'),
            buttons: ['Tamam'],
          }),
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}
