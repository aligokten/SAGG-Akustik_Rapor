/**
 * cephe-model.test.js — Cephe 3B şeması, doğrama yerleşimi ve doğrama
 * alanından türeyen opak duvar alanı.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { cepheSVG, dogramaYerlesimi, sesKaynagiSimgesi } from '../js/arayuz/oda-cizimi.js';
import { dogramaAlani, yeniCephe, cepheleriNormallestir } from '../js/durum.js';
import { cepheHesapla } from '../js/hesap.js';
import { bosProje } from '../js/durum.js';

const ODA = { L: 4.5, W: 3.4, H: 2.62 };

/* ── Doğrama alanı ────────────────────────────────────────────────── */

test('Doğrama alanı en × boy ile hesaplanır', () => {
  assert.equal(dogramaAlani({ en: 1.8, boy: 1.4 }), 1.8 * 1.4);
  assert.equal(dogramaAlani({ en: 2, boy: 2.1 }), 4.2);
});

test('En/boy yoksa elle girilen S korunur', () => {
  assert.equal(dogramaAlani({ S: 3.6 }), 3.6);
  assert.equal(dogramaAlani({ en: 0, boy: 1.4, S: 3.6 }), 3.6);
  assert.equal(dogramaAlani({}), 0);
});

/* ── Doğrama yerleşimi ────────────────────────────────────────────── */

test('Tek doğrama duvarda ortalanır', () => {
  const [r] = dogramaYerlesimi([{ en: 1.8, boy: 1.4 }], 4.5, 2.62);
  const orta = (r.u0 + r.u1) / 2;
  assert.ok(Math.abs(orta - 4.5 / 2) < 1e-9, `orta ${orta} ≠ 2.25`);
  assert.ok(Math.abs((r.u1 - r.u0) - 1.8) < 1e-9);
  assert.ok(Math.abs((r.y1 - r.y0) - 1.4) < 1e-9);
});

test('Birden çok doğrama çakışmadan, sırayla dizilir', () => {
  const kutular = dogramaYerlesimi(
    [{ en: 1.2, boy: 1.4 }, { en: 1.0, boy: 1.4 }, { en: 0.9, boy: 2.1 }], 6, 2.8,
  );
  assert.equal(kutular.length, 3);
  for (let i = 1; i < kutular.length; i++) {
    assert.ok(kutular[i].u0 >= kutular[i - 1].u1, `${i}. doğrama öncekiyle çakışıyor`);
  }
  // Hepsi duvar içinde kalır.
  assert.ok(kutular[0].u0 >= 0);
  assert.ok(kutular[kutular.length - 1].u1 <= 6 + 1e-9);
});

test('Doğrama duvardan yüksekse kat yüksekliğine kırpılır', () => {
  const [r] = dogramaYerlesimi([{ en: 1, boy: 9 }], 4, 2.6);
  assert.ok(r.y1 <= 2.6, `y1 ${r.y1} kat yüksekliğini aşıyor`);
  assert.ok(r.y0 >= 0);
});

test('Boş liste veya geçersiz duvar boyu boş sonuç verir', () => {
  assert.deepEqual(dogramaYerlesimi([], 4, 2.6), []);
  assert.deepEqual(dogramaYerlesimi([{ en: 1, boy: 1 }], 0, 2.6), []);
  assert.deepEqual(dogramaYerlesimi([{ en: 1, boy: 1 }], 4, 0), []);
});

/* ── SVG üretimi ──────────────────────────────────────────────────── */

function cepheOrnegi(konum = 'orta') {
  return {
    ad: 'Yatak odası cephesi',
    konum,
    geometri: { mod: 'olculer', ...ODA },
    elemanlar: [
      { tur: 'duvar', duvarNo: 1, ad: 'Dolu duvar', S: 9 },
      { tur: 'dograma', duvarNo: 1, ad: 'Pencere', en: 1.8, boy: 1.4 },
      { tur: 'dograma', duvarNo: 2, ad: 'Balkon kapısı', en: 0.9, boy: 2.1 },
    ],
  };
}

test('Orta mahalde tek dış duvar, köşe mahalde iki dış duvar çizilir', () => {
  const orta = cepheSVG(cepheOrnegi('orta'));
  const kose = cepheSVG(cepheOrnegi('kose'));
  const say = (svg, sinif) => (svg.match(new RegExp(`class="${sinif}"`, 'g')) || []).length;
  assert.equal(say(orta, 'dis-duvar'), 1);
  assert.equal(say(kose, 'dis-duvar'), 2);
});

test('Doğramalar yalnızca etkin duvarlarda çizilir', () => {
  const say = (svg) => (svg.match(/class="dograma"/g) || []).length;
  // Orta mahalde D2 yoktur; oradaki doğrama çizilmez.
  assert.equal(say(cepheSVG(cepheOrnegi('orta'))), 1);
  assert.equal(say(cepheSVG(cepheOrnegi('kose'))), 2);
});

test('Ses kaynağı simgesi ve geliş yönü çizgisi bulunur', () => {
  const svg = cepheSVG(cepheOrnegi());
  assert.match(svg, /class="ses-kaynagi"/);
  assert.match(svg, /class="kaynak-yonu"/);
});

test('SVG çıktısında NaN koordinat bulunmaz', () => {
  for (const konum of ['orta', 'kose']) {
    for (const aci of [0, 30, 90, 200, -45]) {
      const svg = cepheSVG(cepheOrnegi(konum), { donusAcisiDeg: aci });
      assert.ok(!svg.includes('NaN'), `${konum} / ${aci}° çıktısında NaN var`);
    }
  }
});

test('Geçersiz geometride boş dizge döner', () => {
  assert.equal(cepheSVG({ geometri: { L: 0, W: 3, H: 2.6 } }), '');
  assert.equal(cepheSVG({}), '');
  assert.equal(cepheSVG(null), '');
});

test('Ses kaynağı simgesi kendi başına geçerli işaretleme üretir', () => {
  const g = sesKaynagiSimgesi(100, 50, 1, 'Test kaynağı');
  assert.match(g, /<g class="ses-kaynagi"/);
  assert.match(g, /Test kaynağı/);
  assert.ok(!g.includes('NaN'));
});

/* ── Opak alanın doğramalardan türemesi ───────────────────────────── */

test('Geometri modunda opak duvar alanı = brüt − doğramalar', () => {
  const p = bosProje();
  const c = yeniCephe();
  c.geometri = { mod: 'olculer', ...ODA };
  c.konum = 'orta';
  c.elemanlar = [
    { tur: 'duvar', duvarNo: 1, ad: 'Duvar', elemanId: 'ddt-240', sivaId: 'cimento-20', sivaliYuzSayisi: 2, S: 99, katmanlar: [] },
    { tur: 'dograma', duvarNo: 1, ad: 'Pencere', elemanId: 'pencere-6-16-4', en: 1.8, boy: 1.4 },
  ];
  p.cepheler = [c];

  const h = cepheHesapla(c, p.proje);
  const brut = ODA.L * ODA.H;
  const pencere = 1.8 * 1.4;

  const duvar = h.yuzeysel.find((x) => x.tur === 'duvar');
  const dograma = h.yuzeysel.find((x) => x.tur !== 'duvar');
  assert.ok(Math.abs(duvar.S - (brut - pencere)) < 1e-9, `opak ${duvar.S} ≠ ${brut - pencere}`);
  assert.ok(Math.abs(dograma.S - pencere) < 1e-9);
  // Toplam cephe alanı brüt duvar alanına eşitlenir.
  assert.ok(Math.abs(h.sonuc.S - brut) < 1e-9, `toplam ${h.sonuc.S} ≠ ${brut}`);
});

test('Hacim modunda elle girilen duvar alanı korunur', () => {
  const p = bosProje();
  const c = yeniCephe();
  c.geometri = { mod: 'hacim', ...ODA };
  p.cepheler = [c];

  const h = cepheHesapla(c, p.proje);
  const duvar = h.yuzeysel.find((x) => x.tur === 'duvar');
  assert.equal(duvar.S, 9);   // yeniCephe() varsayılanı
});

test('Orta mahalde D2 elemanları hesaba katılmaz', () => {
  const p = bosProje();
  const c = yeniCephe();
  c.geometri = { mod: 'olculer', ...ODA };
  c.konum = 'orta';
  c.elemanlar = [
    { tur: 'duvar', duvarNo: 1, ad: 'D1 duvar', elemanId: 'ddt-240', sivaId: 'cimento-20', sivaliYuzSayisi: 2, S: 9, katmanlar: [] },
    { tur: 'duvar', duvarNo: 2, ad: 'D2 duvar', elemanId: 'ddt-240', sivaId: 'cimento-20', sivaliYuzSayisi: 2, S: 9, katmanlar: [] },
  ];
  p.cepheler = [c];

  const h = cepheHesapla(c, p.proje);
  const d2 = h.yuzeysel.find((x) => x.ad === 'D2 duvar');
  assert.equal(d2.etkin, false);
  assert.equal(d2.S, 0);
  // Toplam alan yalnızca D1'in brütüdür.
  assert.ok(Math.abs(h.sonuc.S - ODA.L * ODA.H) < 1e-9);
});

/* ── Eski kayıtların göçü ─────────────────────────────────────────── */

test('En/boy taşımayan eski doğrama kaydı, alanı bozulmadan göç eder', () => {
  const d = {
    proje: {},
    cepheler: [{
      elemanlar: [
        { tur: 'duvar', S: 9 },
        { tur: 'dograma', S: 3.6 },
      ],
    }],
  };
  cepheleriNormallestir(d);
  const dg = d.cepheler[0].elemanlar[1];
  assert.ok(dg.en > 0 && dg.boy > 0, 'en/boy türetilmeli');
  assert.ok(Math.abs(dogramaAlani(dg) - 3.6) < 0.02, `alan ${dogramaAlani(dg)} ≈ 3,6 olmalı`);
  // Duvar elemanına katman dizisi ve duvar numarası eklenir.
  assert.deepEqual(d.cepheler[0].elemanlar[0].katmanlar, []);
  assert.equal(d.cepheler[0].elemanlar[0].duvarNo, 1);
  // Eksik alanlar tamamlanır.
  assert.equal(d.cepheler[0].konum, 'orta');
  assert.equal(d.cepheler[0].yanElemanlar.length, 4);
});
