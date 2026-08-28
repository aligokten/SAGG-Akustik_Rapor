/**
 * katmanli-eleman.test.js — Çok katmanlı yapı elemanı hesabı testleri.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ikiKabukBonusu } from '../js/cekirdek/temel.js';
import {
  katmanliElemaniCoz, segmentleAyir, yeniKatman, katmanOzetMetni,
} from '../js/cekirdek/katmanli-eleman.js';
import {
  DUVARLAR, DOSEMELER, SIVALAR, YALITIM_LEVHALARI, bul, elemanAlanKutlesi,
} from '../js/veri/malzemeler.js';

const yakin = (a, b, tol = 0.05) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b} bekleniyordu (tolerans ${tol})`);

const TUM = [...DUVARLAR, ...DOSEMELER];
const baglam = {
  malzemeBul: (id) => bul(TUM, id),
  sivaBul: (id) => bul(SIVALAR, id),
  dolguBul: (id) => bul(YALITIM_LEVHALARI, id),
  alanKutlesiHesapla: elemanAlanKutlesi,
};

/* ── ikiKabukBonusu ───────────────────────────────────────────────── */

test('ikiKabukBonusu düşük f0 için üst sınıra (25 dB) yakınsar', () => {
  yakin(ikiKabukBonusu(10), 25, 0.5);
});

test('ikiKabukBonusu yüksek f0 için sıfıra kilitlenir', () => {
  assert.equal(ikiKabukBonusu(1000), 0);
  assert.equal(ikiKabukBonusu(500), 0);
});

test('ikiKabukBonusu monoton azalandır', () => {
  const degerler = [40, 80, 125, 160, 200, 250, 300].map(ikiKabukBonusu);
  for (let i = 1; i < degerler.length; i++) assert.ok(degerler[i] <= degerler[i - 1]);
});

test('ikiKabukBonusu geçersiz girdide 0 döner', () => {
  assert.equal(ikiKabukBonusu(NaN), 0);
  assert.equal(ikiKabukBonusu(0), 0);
  assert.equal(ikiKabukBonusu(-5), 0);
});

/* ── segmentleAyir ────────────────────────────────────────────────── */

test('Boşluksuz katman listesi tek segmenttir', () => {
  const s = segmentleAyir([{ tur: 'masif' }, { tur: 'siva' }]);
  assert.equal(s.length, 1);
  assert.equal(s[0].length, 2);
});

test('Bir boşluk iki segment üretir', () => {
  const s = segmentleAyir([{ tur: 'masif' }, { tur: 'bosluk' }, { tur: 'masif' }]);
  assert.equal(s.length, 2);
  assert.equal(s[0].length, 1);
  assert.equal(s[1].length, 1);
});

test('Boş katman listesi tek boş segmenttir', () => {
  const s = segmentleAyir([]);
  assert.deepEqual(s, [[]]);
});

/* ── katmanliElemaniCoz — tek kabuk ──────────────────────────────── */

test('Boşluksuz katman listesi tek kabuk olarak değerlendirilir', () => {
  const r = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'ba-d-150' },
  ], baglam);
  assert.equal(r.tur, 'tekKabuk');
  yakin(r.mAlan, 0.15 * 2400);
  assert.equal(r.dRKavite, undefined);
});

test('Kullanıcının döşeme örneği tek kabuk olarak hesaplanır (yapışık katmanlar)', () => {
  // 15 cm betonarme + 5 mm şilte (kütlesiz kabul, ayrı ΔLw modülünde ele
  // alınır) + 7 cm şap + 2 cm seramik: burada yalnızca taşıyıcı döşemenin
  // hava doğuşlu yalıtımı test edilir.
  const r = katmanliElemaniCoz([{ tur: 'masif', malzemeId: 'ba-d-150' }], baglam);
  assert.ok(Number.isFinite(r.Rw));
  assert.equal(r.tur, 'tekKabuk');
});

test('Sıva katmanları toplam kütleye eklenir', () => {
  const sivasiz = katmanliElemaniCoz([{ tur: 'masif', malzemeId: 'ba-200' }], baglam);
  const sivali = katmanliElemaniCoz([
    { tur: 'siva', sivaId: 'alci-15' },
    { tur: 'masif', malzemeId: 'ba-200' },
    { tur: 'siva', sivaId: 'alci-15' },
  ], baglam);
  yakin(sivali.mAlan, sivasiz.mAlan + 30);
  assert.ok(sivali.Rw > sivasiz.Rw);
});

test('Boş malzeme seçimi (malzemeId=null) sıfır kütle katkısı verir', () => {
  const r = katmanliElemaniCoz([{ tur: 'masif', malzemeId: null }], baglam);
  assert.equal(r.mAlan, 0);
});

/* ── katmanliElemaniCoz — iki kabuk ──────────────────────────────── */

test('Boşluklu iki masif katman iki kabuk olarak ayrılır', () => {
  const r = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'gb-g2-150' },
    { tur: 'bosluk', kalinlik: 50, dolguId: 'knauf-ipb039' },
    { tur: 'masif', malzemeId: 'gb-g2-150' },
  ], baglam);
  assert.equal(r.tur, 'ikiKabuk');
  yakin(r.mA, 60); yakin(r.mB, 60);
  yakin(r.mAlan, 120);
  assert.ok(Number.isFinite(r.f0));
  assert.ok(r.dRKavite > 0);
  assert.ok(r.Rw > r.RwTaban, 'iki kabuklu sistem taban değerinden iyi olmalı');
});

test('İki kabuklu sistemde toplam Rw, tek kabuklu (aynı kütleli) sistemden yüksektir', () => {
  const ikiKabuk = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'gb-g2-150' },
    { tur: 'bosluk', kalinlik: 50, dolguId: 'knauf-ipb039' },
    { tur: 'masif', malzemeId: 'gb-g2-150' },
  ], baglam);
  const tekKabukEsdeger = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'gb-g2-300' }, // aynı toplam kalınlık, boşluksuz
  ], baglam);
  assert.ok(ikiKabuk.Rw > tekKabuk_veya_hata(tekKabukEsdeger));
  function tekKabuk_veya_hata(x) { return x.Rw; }
});

test('Dolgusuz (hava) boşluk, gözenekli dolguya göre daha düşük bonus verir', () => {
  const dolgulu = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'gb-g2-150' },
    { tur: 'bosluk', kalinlik: 50, dolguId: 'knauf-ipb039' },
    { tur: 'masif', malzemeId: 'gb-g2-150' },
  ], baglam);
  const dolgusuz = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'gb-g2-150' },
    { tur: 'bosluk', kalinlik: 50, dolguId: 'yok' },
    { tur: 'masif', malzemeId: 'gb-g2-150' },
  ], baglam);
  assert.ok(dolgusuz.f0 > dolgulu.f0);
  assert.ok(dolgusuz.dRKavite <= dolgulu.dRKavite);
});

test('Daha derin boşluk daha yüksek Rw verir', () => {
  const dar = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'gb-g2-150' },
    { tur: 'bosluk', kalinlik: 20, dolguId: 'knauf-ipb039' },
    { tur: 'masif', malzemeId: 'gb-g2-150' },
  ], baglam);
  const genis = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'gb-g2-150' },
    { tur: 'bosluk', kalinlik: 100, dolguId: 'knauf-ipb039' },
    { tur: 'masif', malzemeId: 'gb-g2-150' },
  ], baglam);
  assert.ok(genis.Rw >= dar.Rw);
});

test('Birden fazla boşluk katmanı tek kabuğa düşer ve uyarı bayrağı taşır', () => {
  const r = katmanliElemaniCoz([
    { tur: 'masif', malzemeId: 'gb-g2-100' },
    { tur: 'bosluk', kalinlik: 30, dolguId: 'yok' },
    { tur: 'masif', malzemeId: 'gb-g2-100' },
    { tur: 'bosluk', kalinlik: 30, dolguId: 'yok' },
    { tur: 'masif', malzemeId: 'gb-g2-100' },
  ], baglam);
  assert.equal(r.tur, 'tekKabuk');
  assert.equal(r.fazlaBoslukUyarisi, true);
});

test('Bir taraf boş (kütlesiz) ise iki kabuk modeli devreye girmez', () => {
  const r = katmanliElemaniCoz([
    { tur: 'bosluk', kalinlik: 50, dolguId: 'knauf-ipb039' },
    { tur: 'masif', malzemeId: 'gb-g2-150' },
  ], baglam);
  assert.equal(r.tur, 'tekKabuk');
});

test('Boş katman listesi çökmeden sıfır kütleli tek kabuk döner', () => {
  const r = katmanliElemaniCoz([], baglam);
  assert.equal(r.tur, 'tekKabuk');
  assert.equal(r.mAlan, 0);
});

/* ── Yardımcılar ──────────────────────────────────────────────────── */

test('yeniKatman her tür için geçerli varsayılan alanlar üretir', () => {
  assert.equal(yeniKatman('masif').tur, 'masif');
  assert.equal(yeniKatman('siva').tur, 'siva');
  const b = yeniKatman('bosluk');
  assert.equal(b.tur, 'bosluk');
  assert.ok(b.kalinlik > 0);
});

test('katmanOzetMetni okunabilir bir açıklama üretir', () => {
  const metin = katmanOzetMetni(
    { tur: 'masif', malzemeId: 'gb-g2-150' },
    baglam.malzemeBul, baglam.sivaBul, baglam.dolguBul,
  );
  assert.match(metin, /Gazbeton/);

  const bosluk = katmanOzetMetni(
    { tur: 'bosluk', kalinlik: 50, dolguId: 'knauf-ipb039' },
    baglam.malzemeBul, baglam.sivaBul, baglam.dolguBul,
  );
  assert.match(bosluk, /50 mm/);
  assert.match(bosluk, /Knauf/);
});
