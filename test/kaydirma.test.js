/**
 * kaydirma.test.js — Ayırıcı düzlem üzerinde kaydırılmış mekânlarda ortak
 * (ayırıcı) alanın hesabı.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  geometriHesapla, ortakUzunluk, KAYDIRMA_EKSENLERI,
} from '../js/cekirdek/geometri.js';
import { odaSVG } from '../js/arayuz/oda-cizimi.js';
import { bosProje, yeniAyirici } from '../js/durum.js';
import { projeyiHesapla } from '../js/hesap.js';

const ODA = { L: 6, W: 4, H: 2.6 };

/* ── Aralık kesişimi ─────────────────────────────────────────────── */

test('ortakUzunluk iki aralığın kesişimini verir', () => {
  assert.equal(ortakUzunluk(6, 4, 0), 4);      // içerilen
  assert.equal(ortakUzunluk(6, 4, 1), 4);
  assert.equal(ortakUzunluk(6, 4, 3), 3);      // taşma
  assert.equal(ortakUzunluk(6, 4, 6), 0);      // tam bitişik → temas yok
  assert.equal(ortakUzunluk(6, 4, 9), 0);      // uzakta
  assert.equal(ortakUzunluk(6, 4, -2), 2);     // ters yön
  assert.equal(ortakUzunluk(6, 4, -4), 0);
});

test('Kaydırma geçersizse 0 kabul edilir', () => {
  assert.equal(ortakUzunluk(6, 4, NaN), 4);
  assert.equal(ortakUzunluk(6, 4, undefined), 4);
});

test('Kaydırma referans KENARDAN ölçülür, merkezden değil', () => {
  // Oda 2, kaydırma kadar ilerideki noktadan başlar. Plandan okunan
  // "duvardan şu kadar içeride" ölçüsü doğrudan yazılabilsin diye.
  assert.equal(ortakUzunluk(6, 4, 0), 4);   // kenarlar hizalı → küçük oda içeride
  assert.equal(ortakUzunluk(6, 4, 1), 4);   // hâlâ tümüyle içeride
  assert.equal(ortakUzunluk(6, 4, 2), 4);   // tam sığıyor (2 + 4 = 6)
  assert.equal(ortakUzunluk(6, 4, 3), 3);   // taşmaya başladı
  assert.equal(ortakUzunluk(6, 4, 5), 1);
});

test('Kaydırma 0 iken kenarlar hizalıdır ve örtüşme min(a, b) olur', () => {
  for (const [a, b] of [[6, 4], [4, 6], [5, 5], [3, 7]]) {
    assert.equal(ortakUzunluk(a, b, 0), Math.min(a, b), `${a}/${b}`);
  }
});

/* ── Geriye dönük uyumluluk ──────────────────────────────────────── */

test('Kaydırma 0 iken sonuç eski min() davranışıyla aynıdır', () => {
  const A = { L: 6, W: 4, H: 2.6 }, B = { L: 5, W: 3, H: 2.4 };
  for (const yon of ['on', 'arka', 'sol', 'sag', 'taban']) {
    const g = geometriHesapla({ oda1: A, oda2: B, yon });
    const beklenen = yon === 'taban' ? Math.min(A.L, B.L) * Math.min(A.W, B.W)
      : (yon === 'sol' || yon === 'sag') ? Math.min(A.L, B.L) * Math.min(A.H, B.H)
      : Math.min(A.W, B.W) * Math.min(A.H, B.H);
    assert.ok(Math.abs(g.S - beklenen) < 1e-9, `${yon}: ${g.S} ≠ ${beklenen}`);
    assert.equal(g.tamOrtusme, true, yon);
  }
});

test('Kaydırma alanı hiç olmayan eski kayıt da aynı sonucu verir', () => {
  const eski = geometriHesapla({ oda1: ODA, oda2: ODA, yon: 'on' });
  const yeni = geometriHesapla({ oda1: ODA, oda2: ODA, yon: 'on', kaydirmaA: 0, kaydirmaB: 0 });
  assert.equal(eski.S, yeni.S);
});

/* ── Kısmi örtüşme ───────────────────────────────────────────────── */

test('Yatay kaydırma ortak alanı küçültür', () => {
  // Eşit boyutlu odalarda her kaydırma doğrudan örtüşmeyi kısaltır.
  const g = geometriHesapla({ oda1: ODA, oda2: ODA, yon: 'on', kaydirmaA: 1.5 });
  assert.equal(g.ortakA, 4 - 1.5);
  assert.equal(g.ortakB, 2.6);
  assert.ok(Math.abs(g.S - (2.5 * 2.6)) < 1e-9);
  assert.equal(g.tamOrtusme, false);
  assert.equal(g.temasVar, true);
});

test('Düşey kaydırma (kot farkı) ortak alanı küçültür', () => {
  const g = geometriHesapla({ oda1: ODA, oda2: ODA, yon: 'on', kaydirmaB: 0.6 });
  assert.ok(Math.abs(g.ortakB - 2.0) < 1e-9);
  assert.ok(Math.abs(g.S - (4 * 2.0)) < 1e-9);
});

test('Ortak olmayan yüzeyler her iki oda için ayrı raporlanır', () => {
  const buyuk = { L: 6, W: 6, H: 3 };
  const kucuk = { L: 6, W: 3, H: 3 };
  const g = geometriHesapla({ oda1: buyuk, oda2: kucuk, yon: 'on', kaydirmaA: 1 });
  // W ekseninde: büyük [0,6], küçük sol kenardan 1 m içeride → [1,4]
  assert.equal(g.ortakA, 3);
  assert.equal(g.oda1Yuzey, 6 * 3);
  assert.equal(g.oda2Yuzey, 3 * 3);
  assert.equal(g.S, 3 * 3);
  assert.equal(g.oda1OrtakOlmayan, 18 - 9);   // kaynak odanın kendi yan duvarı
  assert.equal(g.oda2OrtakOlmayan, 0);        // küçük oda tamamen örtüşüyor
});

test('Ortak alan, her iki odanın kendi yüzeyini aşamaz', () => {
  for (const dA of [0, 0.5, 1, 2, 3, 5]) {
    const g = geometriHesapla({ oda1: ODA, oda2: ODA, yon: 'on', kaydirmaA: dA });
    assert.ok(g.S <= g.oda1Yuzey + 1e-9, `dA=${dA}`);
    assert.ok(g.S <= g.oda2Yuzey + 1e-9, `dA=${dA}`);
    assert.ok(g.oda1OrtakOlmayan >= 0 && g.oda2OrtakOlmayan >= 0);
  }
});

/* ── Temas yok ───────────────────────────────────────────────────── */

test('Kaydırma örtüşmeyi kaldırınca temasVar false olur', () => {
  const g = geometriHesapla({ oda1: ODA, oda2: ODA, yon: 'on', kaydirmaA: 4 });
  assert.equal(g.S, 0);
  assert.equal(g.temasVar, false);
  assert.equal(g.tamOrtusme, false);
  assert.equal(g.oda1OrtakOlmayan, g.oda1Yuzey);
});

test('Temassız geometride hesap çökmez', () => {
  const d = bosProje();
  const a = yeniAyirici();
  a.geometri = { mod: 'olculer', oda1: { ...ODA }, oda2: { ...ODA }, yon: 'on', kaydirmaA: 9, kaydirmaB: 0 };
  d.ayiricilar = [a];
  const s = projeyiHesapla(d);
  assert.equal(s.ayiricilar[0].geo.temasVar, false);
  assert.equal(s.ayiricilar[0].geo.S, 0);
});

/* ── lf değerleri örtüşmeyi izler ────────────────────────────────── */

test('Birleşim uzunlukları (lf) ortak boyutlardan türer', () => {
  const g = geometriHesapla({ oda1: ODA, oda2: ODA, yon: 'on', kaydirmaA: 1 });
  assert.equal(g.tabanTavanLf, g.ortakA);   // ayırıcı ile taban/tavan birleşimi
  assert.equal(g.yanDuvarLf, g.ortakB);     // ayırıcı ile yan duvarlar

  const t = geometriHesapla({ oda1: ODA, oda2: ODA, yon: 'taban', kaydirmaA: 1 });
  assert.equal(t.yanDuvarLf, t.ortakA);
  assert.equal(t.tabanTavanLf, t.ortakB);
});

/* ── Şema ────────────────────────────────────────────────────────── */

test('3B şema kaydırmayı çizer, temas yoksa ayırıcı çokgeni basmaz', () => {
  const hizali = odaSVG({ oda1: ODA, oda2: ODA, yon: 'on' });
  const kaymis = odaSVG({ oda1: ODA, oda2: ODA, yon: 'on', kaydirmaA: 2 });
  const temassiz = odaSVG({ oda1: ODA, oda2: ODA, yon: 'on', kaydirmaA: 9 });

  assert.ok(hizali.includes('class="ayirici"'));
  assert.ok(kaymis.includes('class="ayirici"'));
  assert.ok(!temassiz.includes('class="ayirici"'));
  // Kaydırma çizimi gerçekten değiştirmeli
  assert.notEqual(hizali, kaymis);
});

test('Her yön için kaydırma ekseni ve referans kenarı tanımlıdır', () => {
  for (const yon of ['on', 'arka', 'sol', 'sag', 'taban']) {
    assert.ok(KAYDIRMA_EKSENLERI[yon]?.A, yon);
    assert.ok(KAYDIRMA_EKSENLERI[yon]?.B, yon);
    // Kullanıcı ölçüyü hangi kenardan alacağını bilmeli.
    assert.ok(KAYDIRMA_EKSENLERI[yon]?.Akenar, `${yon} Akenar`);
    assert.ok(KAYDIRMA_EKSENLERI[yon]?.Bkenar, `${yon} Bkenar`);
  }
});
