/**
 * electron-builder.js — Masaüstü paketleme ve yayın yapılandırması.
 *
 * Neden YAML değil de JS? Yapılandırmanın doğruluğu `test/masaustu.test.js`
 * içinde sınanıyor. JS modülü olduğu için test dosyayı doğrudan `import`
 * edebiliyor: ne bir YAML çözümleyici bağımlılığı gerekiyor, ne de testlerin
 * `npm install` beklemesi. Açıklama satırları da korunuyor.
 */

export default {
  appId: 'com.saggplus.akustik',
  productName: 'SAGG Akustik Hesap Aracı',
  copyright: '© Sinem Ali Gökten Grup İnşaat Mimarlık Akustik Müh. San. Tic. Ltd. Şti.',

  directories: {
    output: 'dist',
    buildResources: 'assets',
  },

  // Pakete YALNIZCA web uygulamasının kendisi ve Electron kabuğu girer;
  // testler, dokümanlar ve depo altyapısı dışarıda bırakılır.
  files: [
    'index.html',
    'js/**/*',
    'css/**/*',
    'fonts/**/*',
    'assets/**/*',
    'masaustu/**/*',
    'package.json',
    'node_modules/**/*',   // yalnızca üretim bağımlılıkları (electron-updater)
    '!**/*.map',
  ],

  // GitHub Releases hem dağıtım hem de otomatik güncelleme beslemesidir:
  // electron-builder kurulum .exe'sinin yanına `latest.yml` koyar, uygulama
  // içindeki electron-updater de bu dosyayı okur.
  publish: {
    provider: 'github',
    owner: 'aligokten',
    repo: 'SAGG-Akustik_Rapor',
    releaseType: 'release',   // taslak (draft) sürümleri electron-updater göremez
  },

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/uygulama.ico',
    artifactName: 'SAGG-Akustik-Hesap-Kurulum-${version}.${ext}',
  },

  nsis: {
    oneClick: false,                        // kurulum sihirbazı gösterilsin
    perMachine: false,                      // yönetici hakkı gerekmesin
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'SAGG Akustik Hesap',
    language: '1055',                       // Türkçe (LCID 1055)
    installerIcon: 'assets/uygulama.ico',
    uninstallerIcon: 'assets/uygulama.ico',
    installerHeaderIcon: 'assets/uygulama.ico',
    deleteAppDataOnUninstall: false,        // kayıtlı projeler kaldırmada silinmez
  },
};
