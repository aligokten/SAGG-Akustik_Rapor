/**
 * oda-cizimi.test.js — İzometrik oda diyagramı SVG üretici testleri.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { odaSVG } from '../js/arayuz/oda-cizimi.js';

test('Geçersiz geometride boş dize döner', () => {
  assert.equal(odaSVG(null), '');
  assert.equal(odaSVG({}), '');
  assert.equal(odaSVG({ L: 0, W: 3, H: 2.6 }), '');
  assert.equal(odaSVG({ L: 5, W: -1, H: 2.6 }), '');
});

test('Geçerli geometride bir <svg> öğesi üretir', () => {
  const svg = odaSVG({ L: 6, W: 3, H: 2.6, yon: 'on' });
  assert.match(svg, /^<svg /);
  assert.match(svg, /<\/svg>$/);
});

test('Dört yön kodu da (on/arka/sol/sag) hatasız SVG üretir', () => {
  for (const yon of ['on', 'arka', 'sol', 'sag']) {
    const svg = odaSVG({ L: 6, W: 3, H: 2.6, yon });
    assert.ok(svg.length > 200, `yon=${yon} için SVG üretilemedi`);
  }
});

test('Oda adları SVG metnine kaçışlı biçimde işlenir', () => {
  const svg = odaSVG({ L: 6, W: 3, H: 2.6, yon: 'on' }, { oda1Adi: 'A & B Odası', oda2Adi: 'C<D Odası' });
  assert.match(svg, /A &amp; B Odası/);
  assert.match(svg, /C&lt;D Odası/);
});

test('Boyut etiketleri metinde yer alır', () => {
  const svg = odaSVG({ L: 6.12, W: 3.03, H: 2.62, yon: 'sol' });
  assert.match(svg, /L = 6[.,]12 m/);
  assert.match(svg, /W = 3[.,]03 m/);
  assert.match(svg, /H = 2[.,]62 m/);
});

test('viewBox boyutları opts ile ayarlanabilir', () => {
  const svg = odaSVG({ L: 6, W: 3, H: 2.6, yon: 'on' }, { genislik: 800, yukseklik: 500 });
  assert.match(svg, /viewBox="0 0 800 500"/);
});

test('SVG içindeki tüm sayısal koordinatlar viewBox sınırları içindedir', () => {
  const genislik = 640, yukseklik = 420;
  const svg = odaSVG({ L: 6.12, W: 3.03, H: 2.62, yon: 'sol' }, { genislik, yukseklik });
  const noktalar = [...svg.matchAll(/points="([^"]+)"/g)].flatMap((m) => m[1].trim().split(/\s+/));
  for (const nokta of noktalar) {
    const [x, y] = nokta.split(',').map(Number);
    assert.ok(x >= -1 && x <= genislik + 1, `x=${x} viewBox dışında`);
    assert.ok(y >= -1 && y <= yukseklik + 1, `y=${y} viewBox dışında`);
  }
});
