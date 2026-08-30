/**
 * kunye.test.js — Proje künyesindeki yapı yeri / bina bilgisi alanları ve
 * bunların rapor ile EK-10 belgesine akışı.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bosProje, ornekProje, adaParselMetni, adresMetni, alanMetni,
} from '../js/durum.js';
import { ciz as projeCiz } from '../js/arayuz/sekme-proje.js';
import { ciz as raporCiz } from '../js/arayuz/sekme-rapor.js';
import { projeyiHesapla } from '../js/hesap.js';

const YENI_ALANLAR = [
  'il', 'ilce', 'mahalle', 'pafta', 'ada', 'parsel', 'adres',
  'insaatYili', 'kapaliAlan', 'toplamInsaatAlani', 'binaResmi',
  'isverenAdres', 'odaSicil', 'belgeNo',
];

test('Boş proje künyesinde yeni alanların tümü tanımlıdır', () => {
  const p = bosProje().proje;
  for (const a of YENI_ALANLAR) {
    assert.ok(a in p, `${a} alanı yok`);
    assert.equal(p[a], '', `${a} boş dizge olmalı`);
  }
});

/* ── Metin birleştirme ───────────────────────────────────────────── */

test('Ada/parsel metni dolu alanlardan kurulur', () => {
  assert.equal(adaParselMetni({ pafta: '12', ada: '1234', parsel: '5' }),
    '12 pafta / 1234 ada / 5 parsel');
  assert.equal(adaParselMetni({ ada: '1234', parsel: '5' }), '1234 ada / 5 parsel');
  assert.equal(adaParselMetni({ parsel: '5' }), '5 parsel');
});

test('Ada/parsel boşsa eski serbest metne düşer', () => {
  assert.equal(adaParselMetni({ adaParsel: '900 ada / 12 parsel' }), '900 ada / 12 parsel');
  // Yeni alanlar doluysa eski metin yok sayılır
  assert.equal(adaParselMetni({ ada: '1', parsel: '2', adaParsel: 'ESKİ' }), '1 ada / 2 parsel');
  assert.equal(adaParselMetni({}), '');
  assert.equal(adaParselMetni(null), '');
});

test('Adres metni yalnızca dolu parçaları birleştirir', () => {
  assert.equal(adresMetni({ mahalle: 'Bağlar', adres: 'Sokak No:3', ilce: 'Çankaya', il: 'Ankara' }),
    'Bağlar Mah., Sokak No:3, Çankaya / Ankara');
  assert.equal(adresMetni({ il: 'Ankara' }), 'Ankara');
  assert.equal(adresMetni({ ilce: 'Çankaya' }), 'Çankaya');
  // Boş alanlar yarım ayraç bırakmaz
  assert.equal(adresMetni({}), '');
  assert.ok(!adresMetni({ mahalle: 'Bağlar' }).includes(','));
});

test('Alan metni yalnızca girilen alanları yazar', () => {
  assert.equal(alanMetni({ kapaliAlan: '1250', toplamInsaatAlani: '3400' }),
    'Kapalı 1250 m² · Toplam 3400 m²');
  assert.equal(alanMetni({ kapaliAlan: '1250' }), 'Kapalı 1250 m²');
  assert.equal(alanMetni({}), '');
});

/* ── Arayüzde ────────────────────────────────────────────────────── */

test('Proje künyesi ekranı her yeni alan için bir girdi çizer', () => {
  const html = projeCiz(bosProje());
  for (const a of YENI_ALANLAR) {
    if (a === 'binaResmi') continue;   // dosya girdisi, data-yol taşımaz
    assert.ok(html.includes(`data-yol="proje.${a}"`), `${a} için girdi yok`);
  }
  assert.ok(html.includes('id="bina-resmi"'), 'bina resmi dosya girdisi yok');
});

test('Resim seçiliyken kaldırma düğmesi çıkar, boşken çıkmaz', () => {
  const bos = bosProje();
  assert.ok(!projeCiz(bos).includes('bina-resmi-sil'));
  bos.proje.binaResmi = 'data:image/png;base64,AAAA';
  assert.ok(projeCiz(bos).includes('bina-resmi-sil'));
});

/* ── Rapora ve belgeye akış ──────────────────────────────────────── */

test('Yapı yeri bilgileri rapor künyesinde ve belgede görünür', () => {
  const durum = ornekProje();
  Object.assign(durum.proje, {
    il: 'İzmir', ilce: 'Konak', mahalle: 'Alsancak',
    pafta: '7', ada: '900', parsel: '12', adres: 'Test Sokak No:1',
    kapaliAlan: '800', toplamInsaatAlani: '2100',
  });
  const html = raporCiz(durum, projeyiHesapla(durum));

  assert.ok(html.includes('7 pafta / 900 ada / 12 parsel'));
  assert.ok(html.includes('Alsancak Mah., Test Sokak No:1, Konak / İzmir'));
  assert.ok(html.includes('800 m²'));
  assert.ok(html.includes('2100 m²'));
  // Belgedeki "Toplam İnşaat Alanı" satırı eklenmiş olmalı
  assert.ok(html.includes('Toplam İnşaat Alanı'));
});

test('Belge numarası boşsa rapor koduna düşer', () => {
  const durum = ornekProje();
  durum.proje.kod = 'RPR-7';
  durum.proje.belgeNo = '';
  assert.ok(raporCiz(durum, projeyiHesapla(durum)).includes('RPR-7'));

  durum.proje.belgeNo = 'BLG-42';
  const html = raporCiz(durum, projeyiHesapla(durum));
  assert.ok(html.includes('BLG-42'));
});

test('Bina resmi belgeye gömülür, yokken yer tutucu çizilir', () => {
  const durum = ornekProje();
  durum.proje.binaResmi = '';
  assert.ok(raporCiz(durum, projeyiHesapla(durum)).includes('belge-resim-yer'));

  durum.proje.binaResmi = 'data:image/png;base64,AAAA';
  const html = raporCiz(durum, projeyiHesapla(durum));
  assert.ok(html.includes('data:image/png;base64,AAAA'));
  assert.ok(!html.includes('belge-resim-yer'));
});

test('Künye alanları boşken rapor yarım ayraç ya da undefined basmaz', () => {
  const durum = bosProje();
  durum.ayiricilar = ornekProje().ayiricilar;
  const html = raporCiz(durum, projeyiHesapla(durum));
  assert.ok(!html.includes('undefined'));
  // Boş ada/parsel "—" olarak basılır; "12 ada / " gibi yarım metin çıkmaz.
  assert.ok(html.includes('<b>Ada / parsel</b><span>—</span>'));
  // Adres ve alan satırları hiç çizilmez (boş etiket kalmaz)
  assert.ok(!html.includes('<b>Yapı yeri</b>'));
  assert.ok(!html.includes('<b>İnşaat alanı</b>'));
  // Belgede de yarım ayraç yok
  assert.ok(!html.includes(' Mah.,,'));
  assert.ok(!html.includes('ada / </span>'));
});
