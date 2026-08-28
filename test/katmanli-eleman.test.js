/**
 * katmanli-eleman.test.js — Çok katmanlı yapı elemanı hesabı testleri
 * (serbest ad/kalınlık/yoğunluk alanlı katman şeması).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ikiKabukBonusu } from '../js/cekirdek/temel.js';
import {
  katmanliElemaniCoz, segmentleAyir, yeniKatman, katmanOzetMetni, katmanDizilimiMetni,
  katmanAlanKutlesi,
} from '../js/cekirdek/katmanli-eleman.js';
import { YALITIM_LEVHALARI, bul } from '../js/veri/malzemeler.js';

const yakin = (a, b, tol = 0.05) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b} bekleniyordu (tolerans ${tol})`);

const dolguBul = (id) => bul(YALITIM_LEVHALARI, id);
const baglam = { dolguBul };

const masif = (ad, kalinlik, yogunluk) => ({ tur: 'masif', ad, kalinlik, yogunluk });
const siva = (ad, kalinlik, yogunluk) => ({ tur: 'siva', ad, kalinlik, yogunluk });
const bosluk = (kalinlik, dolguId) => ({ tur: 'bosluk', kalinlik, dolguId });

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

/* ── katmanAlanKutlesi ────────────────────────────────────────────── */

test('Masif ve sıva katmanları kalınlık×yoğunluktan kütle üretir', () => {
  yakin(katmanAlanKutlesi(masif('Beton', 200, 2400)), 480);
  yakin(katmanAlanKutlesi(siva('Alçı', 15, 1000)), 15);
});

test('Boşluk katmanının kütlesi sıfır kabul edilir', () => {
  assert.equal(katmanAlanKutlesi(bosluk(50, 'yok')), 0);
});

test('Eksik/geçersiz sayısal alanlar kütleyi çökertmez, sıfır üretir', () => {
  assert.equal(katmanAlanKutlesi({ tur: 'masif', ad: 'X', kalinlik: null, yogunluk: 400 }), 0);
  assert.equal(katmanAlanKutlesi({ tur: 'masif', ad: 'X', kalinlik: 100 }), 0);
});

/* ── segmentleAyir ────────────────────────────────────────────────── */

test('Boşluksuz katman listesi tek segmenttir', () => {
  const s = segmentleAyir([masif('A', 100, 400), siva('B', 15, 1000)]);
  assert.equal(s.length, 1);
  assert.equal(s[0].length, 2);
});

test('Bir boşluk iki segment üretir', () => {
  const s = segmentleAyir([masif('A', 100, 400), bosluk(50, 'yok'), masif('B', 100, 400)]);
  assert.equal(s.length, 2);
});

test('Boş katman listesi tek boş segmenttir', () => {
  assert.deepEqual(segmentleAyir([]), [[]]);
});

/* ── katmanliElemaniCoz — tek kabuk ──────────────────────────────── */

test('Boşluksuz katman listesi tek kabuk olarak değerlendirilir', () => {
  const r = katmanliElemaniCoz([masif('Betonarme', 150, 2400)], baglam);
  assert.equal(r.tur, 'tekKabuk');
  yakin(r.mAlan, 360);
  yakin(r.kalinlikToplam, 150);
  assert.equal(r.dRKavite, undefined);
});

test('DOS1 örneği (döşeme S katmanı) referans değerlerle birebir eşleşir', () => {
  // Kaynak: SAGG_Akustik_Rapor_DOS1.pdf, Bölüm 2 — Ayırıcı eleman katmanları.
  const r = katmanliElemaniCoz([
    masif('Seramik kaplama', 20, 2200),
    masif('Tesviye şapı', 70, 2000),
    masif('Akustik şilte', 5, 75),
    masif('Betonarme', 150, 2400),
    siva('Çimento esaslı sıva', 20, 1800),
    siva('Alçı sıva', 21, 1000),
  ], baglam);
  yakin(r.kalinlikToplam, 286, 0.1);
  yakin(r.mAlan, 601.4, 0.1);
  assert.equal(r.tur, 'tekKabuk');
});

test('DOS1 örneği (F1 yan duvarı, mineral yün BAĞLI katman olarak) referansla birebir eşleşir', () => {
  // Kaynak: aynı rapor, Bölüm 3 — F1: m′=245,4 kg/m², Rw=47,6 dB.
  // Mineral yün burada 'masif' (bağlı) katman olarak girilmiştir; bu,
  // referans aracın davranışıyla eşleşir (gerçek bir hava boşluğu
  // modellenmez, yalnızca kütle katkısı hesaba girer).
  const r = katmanliElemaniCoz([
    siva('Alçı sıva', 22, 1200),
    siva('Çimento esaslı sıva', 20, 1800),
    masif('G2 gazbeton', 150, 400),
    masif('Knauf mineral yün IPB 039', 50, 12.4),
    masif('G2 gazbeton', 150, 400),
    siva('Çimento esaslı sıva', 20, 1800),
    siva('Alçı sıva', 22, 1200),
  ], baglam);
  assert.equal(r.tur, 'tekKabuk');
  yakin(r.mAlan, 245.4, 0.1);
  yakin(r.Rw, 47.6, 0.1);
});

test('Sıva katmanları toplam kütleye eklenir', () => {
  const sivasiz = katmanliElemaniCoz([masif('Beton', 200, 2400)], baglam);
  const sivali = katmanliElemaniCoz([siva('Alçı', 15, 1000), masif('Beton', 200, 2400), siva('Alçı', 15, 1000)], baglam);
  yakin(sivali.mAlan, sivasiz.mAlan + 30);
  assert.ok(sivali.Rw > sivasiz.Rw);
});

/* ── katmanliElemaniCoz — iki kabuk ──────────────────────────────── */

test('Boşluk türünde katman iki kabuğa ayırır (mineral yün DOLGU olarak)', () => {
  const r = katmanliElemaniCoz([
    masif('G2 gazbeton', 150, 400),
    bosluk(50, 'knauf-ipb039'),
    masif('G2 gazbeton', 150, 400),
  ], baglam);
  assert.equal(r.tur, 'ikiKabuk');
  yakin(r.mA, 60); yakin(r.mB, 60);
  yakin(r.mAlan, 120);
  assert.ok(Number.isFinite(r.f0));
  assert.ok(r.dRKavite > 0);
  assert.ok(r.Rw > r.RwTaban, 'iki kabuklu sistem taban değerinden iyi olmalı');
});

test('Aynı malzeme BAĞLI (masif) girildiğinde bonus uygulanmaz, DOLGU (boşluk) girildiğinde uygulanır', () => {
  const bagli = katmanliElemaniCoz([
    masif('G2 gazbeton', 150, 400), masif('Mineral yün', 50, 12.4), masif('G2 gazbeton', 150, 400),
  ], baglam);
  const dolgulu = katmanliElemaniCoz([
    masif('G2 gazbeton', 150, 400), bosluk(50, 'knauf-ipb039'), masif('G2 gazbeton', 150, 400),
  ], baglam);
  assert.equal(bagli.tur, 'tekKabuk');
  assert.equal(dolgulu.tur, 'ikiKabuk');
  assert.ok(dolgulu.Rw > bagli.Rw, 'gerçek boşluk modeli daha yüksek Rw vermeli');
});

test('Dolgusuz (hava) boşluk, gözenekli dolguya göre daha düşük bonus verir', () => {
  const dolgulu = katmanliElemaniCoz([masif('A', 150, 400), bosluk(50, 'knauf-ipb039'), masif('A', 150, 400)], baglam);
  const dolgusuz = katmanliElemaniCoz([masif('A', 150, 400), bosluk(50, 'yok'), masif('A', 150, 400)], baglam);
  assert.ok(dolgusuz.f0 > dolgulu.f0);
  assert.ok(dolgusuz.dRKavite <= dolgulu.dRKavite);
});

test('Daha derin boşluk daha yüksek Rw verir', () => {
  const dar = katmanliElemaniCoz([masif('A', 150, 400), bosluk(20, 'knauf-ipb039'), masif('A', 150, 400)], baglam);
  const genis = katmanliElemaniCoz([masif('A', 150, 400), bosluk(100, 'knauf-ipb039'), masif('A', 150, 400)], baglam);
  assert.ok(genis.Rw >= dar.Rw);
});

test('Birden fazla boşluk katmanı tek kabuğa düşer ve uyarı bayrağı taşır', () => {
  const r = katmanliElemaniCoz([
    masif('A', 100, 400), bosluk(30, 'yok'), masif('A', 100, 400), bosluk(30, 'yok'), masif('A', 100, 400),
  ], baglam);
  assert.equal(r.tur, 'tekKabuk');
  assert.equal(r.fazlaBoslukUyarisi, true);
});

test('Bir taraf boş (kütlesiz) ise iki kabuk modeli devreye girmez', () => {
  const r = katmanliElemaniCoz([bosluk(50, 'knauf-ipb039'), masif('A', 150, 400)], baglam);
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
  assert.match(katmanOzetMetni(masif('G2 gazbeton', 150, 400), dolguBul), /150 mm G2 gazbeton/);
  assert.match(katmanOzetMetni(bosluk(50, 'knauf-ipb039'), dolguBul), /50 mm/);
  assert.match(katmanOzetMetni(bosluk(50, 'knauf-ipb039'), dolguBul), /Knauf/);
});

test('katmanDizilimiMetni katmanları "+" ile birleştirir', () => {
  const metin = katmanDizilimiMetni([masif('Beton', 150, 2400), siva('Alçı', 15, 1000)], dolguBul);
  assert.equal(metin, '150 mm Beton + 15 mm Alçı');
});
