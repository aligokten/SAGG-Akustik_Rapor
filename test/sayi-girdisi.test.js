/**
 * sayi-girdisi.test.js — Ölçü/değer kutularının metin girdisini sayıya
 * çevirme davranışı.
 *
 * Bu alanlar `type="number"` yerine `type="text" inputmode="decimal"`
 * kullanır: number girdisi metin seçimi API'sini desteklemediğinden, araya
 * giren yeniden çizimlerde imleç konumu geri yüklenemiyor ve yazım
 * bozuluyordu. Metin girdisine geçince ayrıştırma tümüyle `sayiOku`'ya
 * kaldı; yazım sırasındaki ara durumların (ör. "6," veya "-") makul bir
 * değere düşmesi gerekir.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { sayiOku } from '../js/arayuz/ortak.js';

test('Türkçe ondalık virgülü nokta gibi okunur', () => {
  assert.equal(sayiOku('6,25'), 6.25);
  assert.equal(sayiOku('2,62'), 2.62);
  assert.equal(sayiOku('0,5'), 0.5);
});

test('Nokta ile yazım da çalışır', () => {
  assert.equal(sayiOku('6.25'), 6.25);
  assert.equal(sayiOku('18.75'), 18.75);
});

test('Negatif değerler okunur (ör. Ctr)', () => {
  assert.equal(sayiOku('-3'), -3);
  assert.equal(sayiOku('-8,5'), -8.5);
});

test('Yazım sırasındaki ara durumlar varsayılana düşer, çökmez', () => {
  // Kullanıcı henüz rakam yazmadan önceki hâller.
  assert.equal(sayiOku(''), 0);
  assert.equal(sayiOku('-'), 0);
  assert.equal(sayiOku(','), 0);
  assert.equal(sayiOku('abc'), 0);
  // "sayiVeyaNull" alanlarında boş girdi null'a düşürülür (arayüz katmanı
  // boş dizgeyi ayrıca ele alır); burada varsayılanın geçtiği doğrulanır.
  assert.equal(sayiOku('', null), null);
  assert.equal(sayiOku('-', null), null);
});

test('Yarım yazılmış ondalık, o ana kadarki değeri verir', () => {
  // "6," → 6 ; "6,2" → 6.2 — canlı hesap yazarken makul biçimde ilerler.
  assert.equal(sayiOku('6,'), 6);
  assert.equal(sayiOku('6,2'), 6.2);
  assert.equal(sayiOku('18.'), 18);
});

test('Baştaki/sondaki boşluklar sorun çıkarmaz', () => {
  assert.equal(sayiOku(' 12,5 '), 12.5);
});
