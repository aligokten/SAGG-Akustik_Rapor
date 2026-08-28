/**
 * oda-cizimi.test.js — İzometrik oda diyagramı SVG üretici testleri.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { odaSVG } from '../js/arayuz/oda-cizimi.js';

const oda = (L, W, H) => ({ L, W, H });

test('Geçersiz geometride boş dize döner', () => {
  assert.equal(odaSVG(null), '');
  assert.equal(odaSVG({}), '');
  assert.equal(odaSVG({ oda1: oda(0, 3, 2.6), oda2: oda(5, 3, 2.6) }), '');
  assert.equal(odaSVG({ oda1: oda(5, -1, 2.6), oda2: oda(5, 3, 2.6) }), '');
});

test('Geçerli geometride bir <svg> öğesi üretir', () => {
  const svg = odaSVG({ oda1: oda(6, 3, 2.6), oda2: oda(6, 3, 2.6), yon: 'on' });
  assert.match(svg, /^<svg /);
  assert.match(svg, /<\/svg>$/);
});

test('Beş yön kodu da (on/arka/sol/sag/taban) hatasız SVG üretir', () => {
  for (const yon of ['on', 'arka', 'sol', 'sag', 'taban']) {
    const svg = odaSVG({ oda1: oda(6, 3, 2.6), oda2: oda(5, 3.5, 2.6), yon });
    assert.ok(svg.length > 200, `yon=${yon} için SVG üretilemedi`);
    assert.ok(!svg.includes('NaN'), `yon=${yon} çıktısında NaN var`);
  }
});

test('Eski tek-oda { L, W, H, yon } biçimi de kabul edilir', () => {
  const svg = odaSVG({ L: 6, W: 3, H: 2.6, yon: 'sol' });
  assert.ok(svg.length > 200);
  assert.ok(!svg.includes('NaN'));
});

test('Bağımsız (asimetrik) oda boyutlarında da NaN üretmez', () => {
  const svg = odaSVG({ oda1: oda(3.18, 1.57, 2.65), oda2: oda(3.18, 3.63, 2.65), yon: 'sol' });
  assert.ok(!svg.includes('NaN'));
});

test('Oda adları SVG metnine kaçışlı biçimde işlenir', () => {
  const svg = odaSVG({ oda1: oda(6, 3, 2.6), oda2: oda(6, 3, 2.6), yon: 'on' }, { oda1Adi: 'A & B Odası', oda2Adi: 'C<D Odası' });
  assert.match(svg, /A &amp; B Odası/);
  assert.match(svg, /C&lt;D Odası/);
});

test('viewBox boyutları opts ile ayarlanabilir', () => {
  const svg = odaSVG({ oda1: oda(6, 3, 2.6), oda2: oda(6, 3, 2.6), yon: 'on' }, { genislik: 800, yukseklik: 500 });
  assert.match(svg, /viewBox="0 0 800 500"/);
});

test('donusAcisiDeg ile farklı açılarda da geçerli koordinatlar üretir', () => {
  for (const aci of [0, 15, 45, 90, -30]) {
    const svg = odaSVG({ oda1: oda(6, 3, 2.6), oda2: oda(5, 3.5, 2.7), yon: 'sol' }, { donusAcisiDeg: aci });
    assert.ok(!svg.includes('NaN'), `açı=${aci} NaN üretti`);
  }
});

test('SVG içindeki tüm sayısal koordinatlar viewBox sınırları içindedir', () => {
  const genislik = 640, yukseklik = 420;
  for (const yon of ['on', 'sol', 'taban']) {
    const svg = odaSVG({ oda1: oda(6.12, 3.03, 2.62), oda2: oda(5, 3.5, 2.5), yon }, { genislik, yukseklik });
    const noktalar = [...svg.matchAll(/points="([^"]+)"/g)].flatMap((m) => m[1].trim().split(/\s+/));
    for (const nokta of noktalar) {
      const [x, y] = nokta.split(',').map(Number);
      assert.ok(x >= -1 && x <= genislik + 1, `yon=${yon}: x=${x} viewBox dışında`);
      assert.ok(y >= -1 && y <= yukseklik + 1, `yon=${yon}: y=${y} viewBox dışında`);
    }
  }
});
