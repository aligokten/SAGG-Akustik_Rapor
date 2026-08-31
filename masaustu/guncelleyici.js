/**
 * guncelleyici.js — GitHub Releases üzerinden otomatik güncelleme.
 *
 * Akış (kullanıcı hiçbir şey aramak zorunda kalmaz):
 *   1. Uygulama açıldıktan birkaç saniye sonra GitHub Releases sessizce
 *      denetlenir. Yeni sürüm yoksa kullanıcı hiçbir şey görmez.
 *   2. Yeni sürüm varsa Türkçe bir pencere çıkar; sürüm notları da gösterilir.
 *      İndirme kullanıcı onaylamadan BAŞLAMAZ (autoDownload = false).
 *   3. İndirme sırasında görev çubuğu simgesinde ilerleme çubuğu ve pencere
 *      başlığında yüzde görünür.
 *   4. İndirme bitince "şimdi yeniden başlat" ya da "çıkışta yükle" sorulur.
 *
 * Sürüm karşılaştırmasını, imza/bütünlük denetimini ve fark (differential)
 * indirmeyi electron-updater yapar; beslemesi electron-builder'ın yayınladığı
 * `latest.yml` dosyasıdır.
 *
 * Geliştirme sırasında (paketlenmemiş uygulama) denetim hiç yapılmaz.
 */

import { app, dialog } from 'electron';
import elektronGuncelleyici from 'electron-updater';
import { surumNotu, yuzde } from './yardimcilar.js';

const { autoUpdater } = elektronGuncelleyici;

/** Otomatik denetimlerin yinelenme aralığı (6 saat). */
const YINELEME_MS = 6 * 60 * 60 * 1000;

let baglandi = false;
let elleDenetim = false;   // Denetimi kullanıcı mı istedi? (sessiz/gürültülü ayrımı)
let surerken = false;      // Aynı anda ikinci denetim başlatılmasın

function olaylariBagla(pencere) {
  if (baglandi) return;
  baglandi = true;

  autoUpdater.autoDownload = false;              // İndirmeyi kullanıcı onaylar
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = null;

  autoUpdater.on('update-available', async (bilgi) => {
    const not = surumNotu(bilgi);
    const secim = await dialog.showMessageBox(pencere, {
      type: 'info',
      title: 'Yeni sürüm var',
      message: `SAGG Akustik Hesap Aracı ${bilgi.version} yayınlandı.`,
      detail: [
        `Kullandığınız sürüm: ${app.getVersion()}`,
        not ? `\nBu sürümde:\n${not}` : '',
        '\nGüncelleme arka planda indirilir; çalışmanız kesilmez.',
      ].join('\n').trim(),
      buttons: ['Şimdi indir', 'Daha sonra'],
      defaultId: 0,
      cancelId: 1,
    });
    if (secim.response === 0) {
      autoUpdater.downloadUpdate().catch((h) => hataBildir(pencere, h));
    } else {
      surerken = false;
    }
  });

  autoUpdater.on('update-not-available', () => {
    surerken = false;
    if (!elleDenetim) return;
    elleDenetim = false;
    dialog.showMessageBox(pencere, {
      type: 'info',
      title: 'Güncelleme yok',
      message: 'En güncel sürümü kullanıyorsunuz.',
      detail: `Yüklü sürüm: ${app.getVersion()}`,
      buttons: ['Tamam'],
    });
  });

  autoUpdater.on('download-progress', (ilerleme) => {
    const o = yuzde(ilerleme);
    if (pencere.isDestroyed()) return;
    pencere.setProgressBar(o / 100);
    pencere.setTitle(`SAGG Akustik Hesap Aracı — güncelleme indiriliyor %${o}`);
  });

  autoUpdater.on('update-downloaded', async (bilgi) => {
    surerken = false;
    if (!pencere.isDestroyed()) {
      pencere.setProgressBar(-1);
      pencere.setTitle('SAGG Akustik Hesap Aracı');
    }
    const secim = await dialog.showMessageBox(pencere, {
      type: 'question',
      title: 'Güncelleme indirildi',
      message: `Sürüm ${bilgi.version} kurulmaya hazır.`,
      detail: 'Kurulum için uygulamanın yeniden başlatılması gerekir. '
        + 'Şimdi yeniden başlatmazsanız güncelleme, uygulamayı bir sonraki '
        + 'kapatışınızda kendiliğinden kurulur.',
      buttons: ['Şimdi yeniden başlat', 'Çıkışta yükle'],
      defaultId: 0,
      cancelId: 1,
    });
    if (secim.response === 0) setImmediate(() => autoUpdater.quitAndInstall());
  });

  autoUpdater.on('error', (hata) => {
    surerken = false;
    if (!pencere.isDestroyed()) { pencere.setProgressBar(-1); pencere.setTitle('SAGG Akustik Hesap Aracı'); }
    // Sessiz denetimde ağ hatası kullanıcıyı rahatsız etmemeli.
    if (elleDenetim) { elleDenetim = false; hataBildir(pencere, hata); }
  });
}

function hataBildir(pencere, hata) {
  dialog.showMessageBox(pencere, {
    type: 'error',
    title: 'Güncelleme denetlenemedi',
    message: 'Güncelleme sunucusuna ulaşılamadı.',
    detail: `İnternet bağlantınızı denetleyip yeniden deneyin.\n\n${hata?.message || hata}`,
    buttons: ['Tamam'],
  });
}

function denetle(pencere, elle) {
  if (surerken && !elle) return;
  surerken = true;
  elleDenetim = elle;
  autoUpdater.checkForUpdates().catch((h) => {
    surerken = false;
    if (elle) { elleDenetim = false; hataBildir(pencere, h); }
  });
}

/** Açılışta sessiz denetim + 6 saatte bir yineleme. */
export function guncellemeyiBaslat(pencere) {
  if (!app.isPackaged) return;      // Geliştirme kopyasında güncelleme aranmaz
  olaylariBagla(pencere);
  setTimeout(() => denetle(pencere, false), 4000);
  const zamanlayici = setInterval(() => denetle(pencere, false), YINELEME_MS);
  pencere.on('closed', () => clearInterval(zamanlayici));
}

/** "Yardım → Güncellemeleri denetle…" menüsü: sonucu her hâlükârda bildirir. */
export function guncellemeyiElleDenetle(pencere) {
  if (!app.isPackaged) {
    dialog.showMessageBox(pencere, {
      type: 'info',
      title: 'Güncelleme denetimi',
      message: 'Geliştirme kopyasında güncelleme denetlenmez.',
      detail: 'Otomatik güncelleme yalnızca kurulmuş (.exe ile yüklenmiş) sürümde çalışır.',
      buttons: ['Tamam'],
    });
    return;
  }
  olaylariBagla(pencere);
  denetle(pencere, true);
}
