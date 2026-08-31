/**
 * yazdirma.test.js — Yazdırma / PDF çıktısının biçem kuralları.
 *
 * Bu testler CSS metnini denetler. Gerçek yerleşim ölçümü tarayıcı gerektirir
 * (bkz. README, "Akustik performans belgesi tek A4 sayfada"); buradaki
 * denetimler, o ölçümle bulunmuş kuralların sessizce geri alınmasını önler.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS = fs.readFileSync(path.join(KOK, 'css', 'stil.css'), 'utf8');

/** @media print blokları (iç içe blok yok; kaba ama yeterli bir ayıklama). */
function yazdirmaBloklari() {
  const bloklar = [];
  const re = /@media print\{/g;
  let m;
  while ((m = re.exec(CSS))) {
    let derinlik = 1, i = m.index + m[0].length;
    while (i < CSS.length && derinlik > 0) {
      if (CSS[i] === '{') derinlik++;
      else if (CSS[i] === '}') derinlik--;
      i++;
    }
    bloklar.push(CSS.slice(m.index, i));
  }
  return bloklar;
}

const YAZDIRMA = yazdirmaBloklari().join('\n');

test('Yazdırmada @media print blokları bulunur', () => {
  assert.ok(yazdirmaBloklari().length >= 2);
});

/* ── Sayfa boyu zemin dolgusu ────────────────────────────────────── */

test('Sayfa düzeyindeki zeminler yazdırmada saydamdır', () => {
  // Zemin rengi tanımlıysa Chromium PDF'e sayfayı kaplayan bir dolgu
  // dikdörtgeni koyar; PDF düzenleyicilerde içeriğin üstünde duran bir nesne
  // olarak görünür. Kâğıt zaten beyaz olduğu için dolguya gerek yoktur.
  assert.match(YAZDIRMA, /html,body,\.kabuk,\.govde,\.icerik,\.rapor\{background:transparent !important\}/);
});

test('Gövdeye yazdırmada beyaz zemin atanmaz', () => {
  assert.ok(!/\bbody\{background:#fff/.test(YAZDIRMA), 'body{background:#fff} geri gelmiş');
});

test('Anlamlı dolgular korunur', () => {
  // Belge başlık bandı ve tablo başlıkları basılmaya devam etmeli.
  assert.match(YAZDIRMA, /\.belge-baslik h1\{ background:#f2dfa0 !important/);
  assert.match(YAZDIRMA, /th\{background:#f1f1f1 !important/);
});

/* ── Akustik performans belgesi: tek A4 sayfası ──────────────────── */

test('Belge kendi sayfasında başlar ve bölünmez', () => {
  assert.match(YAZDIRMA, /\.belge\{[^}]*break-before:page/);
  assert.match(YAZDIRMA, /\.belge\{[^}]*break-inside:avoid/);
});

test('Belgenin sütunlu yerleşimi yazdırmada geri getirilir', () => {
  // A4'ün basılabilir genişliği (~717 px) dar ekran eşiğinin (820 px) altında
  // kaldığı için, önlem alınmazsa belge tek sütuna iner ve iki sayfaya taşar.
  for (const kural of [/\.belge-ust\{ grid-template-columns:.*!important \}/,
                       /\.belge-orta\{ grid-template-columns:.*!important \}/,
                       /\.belge-imza\{ grid-template-columns:.*!important \}/]) {
    assert.match(YAZDIRMA, kural);
  }
});

test('Dar ekran kuralı hâlâ ekran için duruyor', () => {
  // Yazdırma düzeltmesi, ekrandaki duyarlı davranışı kaldırmamalı.
  assert.match(CSS, /@media \(max-width:820px\)\{\s*\.belge-ust, \.belge-orta\{/);
});

test('Sığdırma ölçüleri yerinde', () => {
  // Tarayıcıda ölçülerek bulunan değerler; biri kaldırılırsa belge taşar.
  for (const kural of ['.belge-baslik h1{ font-size:19px', '.belge-satir{ font-size:10.5px',
                       '.belge-tablo{ font-size:10px', '.belge-resim-alan{ min-height:92px']) {
    assert.ok(YAZDIRMA.includes(kural), kural);
  }
});

/* ── Beyaz sayfa ve A4 ───────────────────────────────────────────── */

test('Yazdırmada renk şeması açığa sabitlenir', () => {
  // index.html "light dark" bildirir ve uygulama koyu temada çalışır. Sayfa
  // zemini saydam bırakıldığı için (dolgu nesnesi üretmemek adına) kâğıdı
  // tarayıcı color-scheme'e göre boyar; koyu şemada #121212 çıkar, yani PDF
  // simsiyah basılırdı. Bu kural olmadan çıktı temaya göre değişir.
  assert.match(YAZDIRMA, /:root\{ color-scheme:light !important \}/);
});

test('Sayfa boyutu A4 olarak tanımlıdır', () => {
  assert.match(CSS, /@page\{ size:A4; margin:10mm \}/);
});

test('Masaüstü PDF dışa aktarımı CSS sayfa boyutunu kullanır', () => {
  const ana = fs.readFileSync(path.join(KOK, 'masaustu', 'ana.js'), 'utf8');
  // preferCSSPageSize olmadan Electron kendi kâğıt boyutunu seçer ve
  // tarayıcı çıktısıyla masaüstü çıktısı ayrışır.
  assert.match(ana, /preferCSSPageSize:\s*true/);
  assert.match(ana, /pageSize:\s*'A4'/);
});
