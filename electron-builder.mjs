/**
 * electron-builder.mjs — Masaüstü paketleme ve yayın yapılandırması.
 *
 * Neden YAML değil de JS modülü? Yapılandırmanın doğruluğu
 * `test/masaustu.test.js` içinde sınanıyor. JS modülü olduğu için test dosyayı
 * doğrudan `import` edebiliyor: ne bir YAML çözümleyici bağımlılığı gerekiyor,
 * ne de testlerin `npm install` beklemesi. Açıklama satırları da korunuyor.
 *
 * Neden `.mjs`? Uzantı `.js` olduğunda dosya adı `electron-builder` komutuyla
 * çakışıyor: Windows'ta `.JS` varsayılan olarak PATHEXT içindedir, bu yüzden
 * kabuk `electron-builder` komutunu çözerken önce çalışma dizinindeki bu
 * dosyayı buluyor ve aracın kendisi hiç çalışmıyordu (çıktısız, hatasız,
 * kurulum dosyası üretilmeden). `.mjs` PATHEXT'te yer almaz; electron-builder
 * ise bu adı da kendiliğinden bulur.
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
    // ÖNCE TASLAK. GitHub, yayımlanmış bir sürümün var olan bir etikete
    // işaret etmesini şart koşar ("Published releases must have a valid tag");
    // `release` seçildiğinde etiket henüz yokken sürüm oluşturma 422 ile
    // düşüyor ve yükleme yarıda kalıyordu. Taslak sürüm var olmayan bir
    // etikete işaret edebilir. Taslağı, tüm dosyalar yüklendikten sonra
    // .github/workflows/windows-yayin.yml yayımlar — etiketi de o an GitHub
    // oluşturur. electron-updater yalnızca yayımlanmış sürümü gördüğü için
    // besleme ancak her şey tamamlandığında ortaya çıkar; yarım bir sürüm
    // kullanıcılara hiç görünmez.
    releaseType: 'draft',
  },

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/uygulama.ico',
    artifactName: 'SAGG-Akustik-Hesap-Kurulum-${version}.${ext}',

    // DİKKAT — `publisherName` burada BİLEREK tanımlı değildir.
    // Windows "Uygulamalar" listesindeki yayıncı adı zaten package.json
    // içindeki author.name alanından ("SAGG+ App") gelir. `win.publisherName`
    // ise kod imzalama sertifikasındaki adı bildirir: tanımlıysa
    // electron-updater, indirdiği kurulum dosyasının imzasını bu ada karşı
    // DOĞRULAR. Uygulama şu an imzasız olduğu için bu alanı doldurmak
    // güncellemelerin kurulmayı reddetmesine yol açardı. Sertifika alındığında
    // aşağıdaki üç satır açılır ve publisherName sertifikadaki adla birebir
    // aynı yazılır:
    //
    //   publisherName: 'Sertifikadaki tam ad',
    //   certificateFile: process.env.WIN_SERTIFIKA_DOSYASI,
    //   certificatePassword: process.env.WIN_SERTIFIKA_PAROLASI,
  },

  // macOS: tek bir "universal" paket hem Apple Silicon (M1–M4) hem Intel
  // Mac'te doğal çalışır; kullanıcının işlemcisini bilmesi gerekmez.
  //   - dmg: kullanıcının indirip açtığı disk görüntüsü (sürükle → Uygulamalar)
  //   - zip: electron-builder `latest-mac.yml` beslemesini bununla üretir;
  //     uygulama yeni sürümü bu dosyadan öğrenir.
  mac: {
    target: [
      { target: 'dmg', arch: ['universal'] },
      { target: 'zip', arch: ['universal'] },
    ],
    icon: 'assets/favicon-512.png',
    category: 'public.app-category.productivity',
    artifactName: 'SAGG-Akustik-Hesap-${version}-mac.${ext}',
    darkModeSupport: true,
    // AD-HOC İMZA ('-'). Apple Developer sertifikası olmadan da Apple Silicon
    // Mac'te uygulamanın açılabilmesi için zorunludur: arm64 ikili dosyaları
    // hiç imzasızsa macOS onları "hasarlı" sayıp çalıştırmaz. Ad-hoc imza
    // Gatekeeper onayı (notarization) sağlamaz; kullanıcı ilk açılışta bir kez
    // "Yine de aç" der (bkz. README → macOS uygulaması).
    // hardenedRuntime kapalı: ad-hoc imzayla birlikte açık kalırsa kütüphane
    // doğrulaması Electron çerçevesini yüklemeyi reddedebilir.
    // Sertifika alındığında: identity kaldırılır (otomatik bulunur),
    // hardenedRuntime açılır ve notarize ayarı eklenir.
    identity: '-',
    hardenedRuntime: false,
    gatekeeperAssess: false,
  },

  dmg: {
    title: 'SAGG Akustik Hesap ${version}',
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
