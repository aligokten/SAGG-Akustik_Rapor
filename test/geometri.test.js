/**
 * geometri.test.js — Oda boyutlarından (L×W×H) alan, hacim ve birleşim
 * uzunluğu hesabı testleri.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { geometriHesapla } from '../js/cekirdek/geometri.js';
import { ornekProje } from '../js/durum.js';
import { ayiriciHesapla, darbeHesapla } from '../js/hesap.js';

const yakin = (a, b, tol = 0.01) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b} bekleniyordu (tolerans ${tol})`);

/* ── geometriHesapla ──────────────────────────────────────────────── */

test('Geçersiz veya eksik boyutlarda null döner', () => {
  assert.equal(geometriHesapla({}), null);
  assert.equal(geometriHesapla({ L: 0, W: 3, H: 2.6 }), null);
  assert.equal(geometriHesapla({ L: 5, W: -1, H: 2.6 }), null);
  assert.equal(geometriHesapla({ L: 5, W: 3 }), null); // H eksik
});

test('Yön verilmezse döşeme (yatay) olarak S = L×W hesaplanır', () => {
  const r = geometriHesapla({ L: 6, W: 3, H: 2.6 });
  yakin(r.V, 46.8);
  yakin(r.S, 18);
  assert.equal(r.yanDuvarLf, undefined);
});

test('KS-Rechner örneği ile eşleşir: L=6,12 W=3,03 H=2,62, yön=sol → S=16,03 m²', () => {
  const r = geometriHesapla({ L: 6.12, W: 3.03, H: 2.62, yon: 'sol' });
  yakin(r.S, 16.03, 0.01);
  yakin(r.ayiriciGenislik, 6.12);
  yakin(r.yanDuvarLf, 2.62);
  yakin(r.tabanTavanLf, 6.12);
});

test('Ön/arka yön için ayırıcı genişliği W eksenidir', () => {
  const on = geometriHesapla({ L: 6, W: 3, H: 2.6, yon: 'on' });
  const arka = geometriHesapla({ L: 6, W: 3, H: 2.6, yon: 'arka' });
  yakin(on.ayiriciGenislik, 3);
  yakin(on.S, 3 * 2.6);
  assert.deepEqual(on, arka, 'ön ve arka simetrik olmalı');
});

test('Sol/sağ yön için ayırıcı genişliği L eksenidir', () => {
  const sol = geometriHesapla({ L: 6, W: 3, H: 2.6, yon: 'sol' });
  const sag = geometriHesapla({ L: 6, W: 3, H: 2.6, yon: 'sag' });
  yakin(sol.ayiriciGenislik, 6);
  yakin(sol.S, 6 * 2.6);
  assert.deepEqual(sol, sag);
});

test('Hacim, yönden bağımsız her zaman L×W×H\'dir', () => {
  for (const yon of ['on', 'arka', 'sol', 'sag']) {
    yakin(geometriHesapla({ L: 5, W: 4, H: 2.5, yon }).V, 50);
  }
});

test('Yan duvar birleşim uzunluğu her zaman H, taban/tavan her zaman ayırıcı genişliğidir', () => {
  for (const yon of ['on', 'arka', 'sol', 'sag']) {
    const r = geometriHesapla({ L: 5, W: 4, H: 2.5, yon });
    yakin(r.yanDuvarLf, 2.5);
    yakin(r.tabanTavanLf, r.ayiriciGenislik);
  }
});

/* ── hesap.js entegrasyonu ────────────────────────────────────────── */

test('Geometri modu S ve V\'yi otomatik hesaplayıp ayırıcı hesabına uygular', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri = { mod: 'olculer', L: 6.12, W: 3.03, H: 2.62, yon: 'sol' };
  const a = ayiriciHesapla(p.ayiricilar[0], p.proje);
  assert.ok(a.geo);
  yakin(a.geo.S, 16.03, 0.01);
  yakin(a.sonuc.DnTw, a.sonuc.DnTw); // hesap çökmeden tamamlanmalı
});

test('mod=\'hacim\' iken geo null\'dur ve elle girilen S/V kullanılır', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri.mod = 'hacim';
  p.ayiricilar[0].S = 9.5; p.ayiricilar[0].V = 35;
  const a = ayiriciHesapla(p.ayiricilar[0], p.proje);
  assert.equal(a.geo, null);
  yakin(a.sonuc.RwAksan, a.sonuc.RwAksan);
});

test('Standart 4 yan elemanın lf değeri geometri moduna göre otomatik güncellenir', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri = { mod: 'olculer', L: 6, W: 4, H: 2.5, yon: 'on' };
  const a = ayiriciHesapla(p.ayiricilar[0], p.proje);
  const yanDuvarlar = a.yanElemanlar.filter((_, i) => p.ayiricilar[0].yanElemanlar[i].geometriRolu === 'yanDuvar');
  const tabanTavan = a.yanElemanlar.filter((_, i) => p.ayiricilar[0].yanElemanlar[i].geometriRolu === 'tabanTavan');
  for (const y of yanDuvarlar) yakin(y.lf, 2.5);
  for (const y of tabanTavan) yakin(y.lf, 4);
});

test('Kullanıcının elle eklediği (geometriRolu tanımsız) yan eleman geometri modunda bile manuel lf\'sini korur', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri = { mod: 'olculer', L: 6, W: 4, H: 2.5, yon: 'on' };
  p.ayiricilar[0].yanElemanlar.push({
    id: 'ozel', ad: 'Özel yan eleman', elemanId: 'ba-200', sivaId: 'sivasiz', sivaliYuzSayisi: 0,
    RwBeyan: null, yogunlukBeyan: null, lf: 1.5, birlesim: 'T', giydirmeId: 'yok', dolguId: null,
    esnekBaglanti: false, katmanlar: [],
    // geometriRolu kasıtlı olarak yok
  });
  const a = ayiriciHesapla(p.ayiricilar[0], p.proje);
  const ozel = a.yanElemanlar[a.yanElemanlar.length - 1];
  yakin(ozel.lf, 1.5);
});

test('Döşeme geometri modu V\'yi otomatik hesaplar', () => {
  const p = ornekProje();
  p.darbeler[0].geometri = { mod: 'olculer', L: 6, W: 4, H: 2.6 };
  const d = darbeHesapla(p.darbeler[0], p.proje);
  assert.ok(d.geo);
  yakin(d.geo.V, 62.4);
  yakin(d.sonuc.LnTw, d.sonuc.LnTw); // çökmeden tamamlanmalı
});
