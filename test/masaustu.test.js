/**
 * masaustu.test.js — Windows masaüstü kabuğunun (Electron) saf mantığı:
 * özel protokol yol çözümü ve güncelleme penceresinde gösterilen metinler.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  guvenliYol, surumNotu, yuzde, menuSablonu, menuEtiketleri, BAGLANTILAR,
} from '../masaustu/yardimcilar.js';
import yapi from '../electron-builder.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── Özel protokol yol çözümü ────────────────────────────────────── */

test('sagg:// adresi depo kökündeki dosyaya çözülür', () => {
  assert.equal(guvenliYol('/uyg', 'sagg://yerel/index.html'), path.join('/uyg', 'index.html'));
  assert.equal(guvenliYol('/uyg', 'sagg://yerel/js/uygulama.js'), path.join('/uyg', 'js', 'uygulama.js'));
});

test('Kök adresi index.html verir', () => {
  assert.equal(guvenliYol('/uyg', 'sagg://yerel/'), path.join('/uyg', 'index.html'));
});

test('Yüzde kodlu Türkçe dosya adları çözülür', () => {
  assert.equal(guvenliYol('/uyg', 'sagg://yerel/assets/%C3%B6rnek.png'),
    path.join('/uyg', 'assets', 'örnek.png'));
});

test('Düz ../ dizileri URL çözümlemesinde eritilir, kök dışına çıkmaz', () => {
  // new URL() yolu zaten normalleştirir: '/../../etc/passwd' → '/etc/passwd'.
  // Sonuç kökün İÇİNDE kalır (var olmayan bir dosyaya işaret eder, 404 olur).
  assert.equal(guvenliYol('/uyg', 'sagg://yerel/../../etc/passwd'), path.join('/uyg', 'etc', 'passwd'));
  assert.equal(guvenliYol('/uyg', 'sagg://yerel/js/../../../../etc/shadow'), path.join('/uyg', 'etc', 'shadow'));
});

test('Kodlanmış dizin dışına çıkma girişimi reddedilir', () => {
  // Bunlar URL normalleştirmesini atlatıp decodeURIComponent sonrası ortaya
  // çıkar; koruma tam olarak bu durum için vardır.
  for (const kotu of [
    'sagg://yerel/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    'sagg://yerel/js/%2e%2e%2f%2e%2e%2f%2e%2e%2fgizli.txt',
    'sagg://yerel/%2e%2e%5c%2e%2e%5cgizli.txt',
  ]) assert.equal(guvenliYol('/uyg', kotu), null, kotu);
});

test('Geçersiz adres çökmez, null döner', () => {
  assert.equal(guvenliYol('/uyg', 'bu bir adres değil'), null);
});

/* ── Güncelleme penceresi metinleri ──────────────────────────────── */

test('HTML sürüm notu düz metne indirgenir', () => {
  const m = surumNotu({ releaseNotes: '<h2>Yenilikler</h2><ul><li>Kaydırma</li><li>Excel</li></ul>' });
  assert.ok(!m.includes('<'), m);
  assert.ok(m.includes('• Kaydırma'));
  assert.ok(m.includes('• Excel'));
});

test('Dizi biçimli sürüm notu birleştirilir', () => {
  const m = surumNotu({ releaseNotes: [{ version: '1.2.0', note: '<p>Düzeltmeler</p>' }] });
  assert.equal(m, 'Düzeltmeler');
});

test('Sürüm notu yoksa boş metin döner', () => {
  for (const g of [undefined, {}, { releaseNotes: null }]) assert.equal(surumNotu(g), '');
});

test('Sürüm notu pencereyi taşırmayacak kadar kırpılır', () => {
  assert.ok(surumNotu({ releaseNotes: 'x'.repeat(5000) }).length <= 1200);
});

test('İndirme yüzdesi 0–100 aralığına sıkıştırılır', () => {
  assert.equal(yuzde({ percent: 42.4 }), 42);
  assert.equal(yuzde({ percent: -5 }), 0);
  assert.equal(yuzde({ percent: 140 }), 100);
  assert.equal(yuzde({}), 0);
  assert.equal(yuzde(undefined), 0);
});

/* ── Paketleme yapılandırması ────────────────────────────────────── */

const paket = JSON.parse(fs.readFileSync(path.join(KOK, 'package.json'), 'utf8'));

test('package.json ana giriş noktası gerçekten vardır', () => {
  assert.equal(paket.main, 'masaustu/ana.js');
  assert.ok(fs.existsSync(path.join(KOK, paket.main)));
});

test('Sürüm numarası semver biçimindedir (güncelleme karşılaştırması buna dayanır)', () => {
  assert.match(paket.version, /^\d+\.\d+\.\d+$/);
});

test('electron-updater üretim bağımlılığıdır — pakete girmesi gerekir', () => {
  assert.ok(paket.dependencies?.['electron-updater'], 'devDependencies içinde olmamalı');
});

test('Yayın hedefi bu deponun GitHub Releases akışıdır', () => {
  assert.equal(yapi.publish.provider, 'github');
  assert.equal(yapi.publish.owner, 'aligokten');
  assert.equal(yapi.publish.repo, 'SAGG-Akustik_Rapor');
  // Önce taslak: GitHub yayımlanmış sürüm için var olan bir etiket şart
  // koşar. Taslağı, tüm dosyalar yüklendikten sonra iş akışı yayımlar.
  // Bu değer 'release' yapılırsa yayın 422 ile düşer (bkz. electron-builder.mjs).
  assert.equal(yapi.publish.releaseType, 'draft');
});

test('Windows hedefi NSIS kurulum sihirbazıdır ve simge dosyası vardır', () => {
  assert.equal(yapi.win.target[0].target, 'nsis');
  assert.ok(fs.existsSync(path.join(KOK, yapi.win.icon)), yapi.win.icon);
  assert.equal(yapi.nsis.oneClick, false);
  assert.equal(yapi.nsis.perMachine, false);         // yönetici hakkı gerekmesin
  assert.equal(yapi.nsis.deleteAppDataOnUninstall, false); // projeler korunsun
});

test('Pakete giren dosya listesi uygulamanın tamamını kapsar', () => {
  for (const gerekli of ['index.html', 'js/**/*', 'css/**/*', 'fonts/**/*', 'assets/**/*', 'masaustu/**/*']) {
    assert.ok(yapi.files.some((d) => String(d).startsWith(gerekli)), gerekli);
  }
});

test('Kod imzalama yokken publisherName tanımlı olmamalı', () => {
  // Tanımlıysa electron-updater indirdiği kurulum dosyasının imzasını bu ada
  // karşı doğrular; imzasız pakette bu, güncellemelerin sessizce reddedilmesi
  // demektir. Sertifika eklendiğinde bu test bilinçli olarak güncellenmelidir.
  const imzali = Boolean(yapi.win.certificateFile || yapi.win.certificateSubjectName);
  if (!imzali) assert.equal(yapi.win.publisherName, undefined);
});

test('Yayıncı adı package.json author alanından gelir', () => {
  // NSIS, Windows "Uygulamalar" listesindeki Publisher değerini buradan yazar.
  assert.equal(paket.author.name, 'SAGG+ App');
});

test('Yayıncı künyesi kurumsal alan adını ve destek adresini taşır', () => {
  // NSIS bu değerleri Windows "Uygulamalar" kaydına (Publisher, URLInfoAbout)
  // yazar; "Hakkında" ve "Yardım" menüsü de aynı adresleri gösterir.
  assert.equal(paket.author.email, 'info@saggplus.com');
  assert.equal(paket.homepage, 'https://www.saggplus.com');
});

test('appId ters çevrilmiş alan adıyla uyumludur', () => {
  // saggplus.com → com.saggplus.*  (Windows AppUserModelID ile aynı olmalı)
  assert.ok(yapi.appId.startsWith('com.saggplus.'), yapi.appId);
});

/* ── Uygulama menüsü ─────────────────────────────────────────────── */

const ETIKETLER = menuEtiketleri(menuSablonu({}, '9.9.9'));

test('Menüde geliştirici araçları yoktur', () => {
  // Son kullanıcıya yönelik bir programda geliştirici konsolu istenmiyor.
  assert.ok(!ETIKETLER.includes('role:toggleDevTools'), ETIKETLER.join(' | '));
  assert.ok(!ETIKETLER.some((e) => /geliştirici araçları/i.test(e)));
});

test('Menüde sürüm notları girdisi yoktur', () => {
  assert.ok(!ETIKETLER.some((e) => /sürüm notları/i.test(e)), ETIKETLER.join(' | '));
});

test('Dosya menüsünde yazdırma değil, PDF olarak kaydetme vardır', () => {
  assert.ok(ETIKETLER.some((e) => /PDF olarak kaydet/i.test(e)), ETIKETLER.join(' | '));
  // "Yazdır" seçeneği bilinçli olarak kaldırıldı: masaüstünde PDF doğrudan
  // yazılıyor, araya yazıcı seçme adımı girmiyor.
  assert.ok(!ETIKETLER.some((e) => /^yazdır/i.test(e)));
});

test('Menü, PDF ve güncelleme eylemlerini bağlar', () => {
  const cagrilan = [];
  const sablon = menuSablonu({
    pdf: () => cagrilan.push('pdf'),
    guncelleme: () => cagrilan.push('guncelleme'),
  }, '9.9.9');
  const bul = (ad) => sablon.flatMap((u) => u.submenu || []).find((a) => a.label === ad);
  bul('Raporu PDF olarak kaydet…').click();
  bul('Güncellemeleri denetle…').click();
  assert.deepEqual(cagrilan, ['pdf', 'guncelleme']);
});

test('Yardım menüsü kurumsal adresleri gösterir', () => {
  assert.ok(ETIKETLER.includes('SAGG+ — www.saggplus.com'));
  assert.ok(ETIKETLER.includes('Destek: info@saggplus.com'));
  assert.equal(BAGLANTILAR.site, 'https://www.saggplus.com');
});
