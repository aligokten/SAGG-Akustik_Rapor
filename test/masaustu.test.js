/**
 * masaustu.test.js — Windows masaüstü kabuğunun (Electron) saf mantığı:
 * özel protokol yol çözümü ve güncelleme penceresinde gösterilen metinler.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { guvenliYol, surumNotu, yuzde } from '../masaustu/yardimcilar.js';
import yapi from '../electron-builder.js';

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
  // Taslak (draft) sürümleri electron-updater göremez; tam sürüm olmalı.
  assert.equal(yapi.publish.releaseType, 'release');
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
