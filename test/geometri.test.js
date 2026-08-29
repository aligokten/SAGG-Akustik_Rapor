/**
 * geometri.test.js — Bağımsız oda boyutlarından (Oda1/Oda2 L×W×H) alan,
 * hacim ve birleşim uzunluğu hesabı testleri.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { geometriHesapla } from '../js/cekirdek/geometri.js';
import { ornekProje } from '../js/durum.js';
import { ayiriciHesapla, darbeHesapla } from '../js/hesap.js';

const yakin = (a, b, tol = 0.01) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b} bekleniyordu (tolerans ${tol})`);

const oda = (L, W, H) => ({ L, W, H });

/* ── geometriHesapla — geçersiz girdi ─────────────────────────────── */

test('Geçersiz veya eksik boyutlarda null döner', () => {
  assert.equal(geometriHesapla({}), null);
  assert.equal(geometriHesapla({ oda1: oda(0, 3, 2.6), oda2: oda(5, 3, 2.6) }), null);
  assert.equal(geometriHesapla({ oda1: oda(5, 3, 2.6), oda2: oda(5, -1, 2.6) }), null);
  assert.equal(geometriHesapla({ oda1: oda(5, 3, 2.6) }), null); // oda2 eksik
});

/* ── Referans doğrulama (yüklenen PDF raporlarından) ─────────────── */

test('DOS1 örneği: taban (döşeme) ayırıcı — S ve V referansla birebir eşleşir', () => {
  const r = geometriHesapla({ oda1: oda(6.25, 3.18, 2.65), oda2: oda(10.25, 3.03, 2.62), yon: 'taban' });
  yakin(r.S, 18.94, 0.01);
  yakin(r.V, 81.37, 0.01);   // alıcı (oda2) hacmi
  yakin(r.V1, 52.67, 0.01);  // kaynak (oda1) hacmi, bilgi amaçlı
});

test('ID3 örneği: sol duvar ayırıcı — S referansla birebir eşleşir', () => {
  const r = geometriHesapla({ oda1: oda(3.18, 1.57, 2.65), oda2: oda(3.18, 3.63, 2.65), yon: 'sol' });
  yakin(r.S, 8.43, 0.01);
});

/* ── Yön davranışları ─────────────────────────────────────────────── */

test('Yön verilmezse basit döşeme: S = min(L)×min(W)', () => {
  const r = geometriHesapla({ oda1: oda(6, 4, 2.6), oda2: oda(5, 3, 2.6) });
  yakin(r.S, 15); // min(6,5)×min(4,3)
  assert.equal(r.yanDuvarLf, undefined);
});

test('Ön/arka yön: S = min(W)×min(H)', () => {
  const r = geometriHesapla({ oda1: oda(6, 4, 2.6), oda2: oda(5, 3, 2.5), yon: 'on' });
  yakin(r.S, 3 * 2.5); // min(W)=3, min(H)=2.5
  yakin(r.ayiriciGenislik, 3);
});

test('Sol/sağ yön: S = min(L)×min(H)', () => {
  const r = geometriHesapla({ oda1: oda(6, 4, 2.6), oda2: oda(5, 3, 2.5), yon: 'sol' });
  yakin(r.S, 5 * 2.5); // min(L)=5, min(H)=2.5
  yakin(r.ayiriciGenislik, 5);
});

test('Taban yönü: S = min(L)×min(W)', () => {
  const r = geometriHesapla({ oda1: oda(6, 4, 2.6), oda2: oda(5, 3, 2.5), yon: 'taban' });
  yakin(r.S, 5 * 3); // min(L)=5, min(W)=3 — H bu yönde S'i etkilemez

  // Döşeme ayırıcıda dört yan elemanın hepsi düşey duvardır; rol etiketi
  // yalnızca hangi döşeme kenarı boyunca birleştiklerini seçer. Kural her üç
  // yönde de aynı: 0/1 dizinli yan elemanlar yanDuvarLf, 2/3 dizinliler
  // tabanTavanLf alır (referans motordaki spanA/spanB).
  yakin(r.yanDuvarLf, 5);   // uzun kenar, min(L)
  yakin(r.tabanTavanLf, 3); // kısa kenar, min(W)
});

test('Hacim her zaman alıcı (oda2) mekânın kendi hacmidir', () => {
  const r = geometriHesapla({ oda1: oda(10, 10, 10), oda2: oda(2, 2, 2), yon: 'on' });
  yakin(r.V, 8);
  yakin(r.V1, 1000);
});

test('Yan duvar birleşim uzunluğu min(H), taban/tavan ayırıcı genişliğidir', () => {
  for (const yon of ['on', 'arka', 'sol', 'sag']) {
    const r = geometriHesapla({ oda1: oda(5, 4, 2.5), oda2: oda(5, 4, 2.7), yon });
    yakin(r.yanDuvarLf, 2.5); // min(H)
    yakin(r.tabanTavanLf, r.ayiriciGenislik);
  }
});

/* ── Geriye dönük uyumluluk (eski tek-oda kaydı) ─────────────────── */

test('Eski { L, W, H, yon } biçimi simetrik oda1=oda2 kabul edilir', () => {
  const eski = geometriHesapla({ L: 6.12, W: 3.03, H: 2.62, yon: 'sol' });
  const yeni = geometriHesapla({ oda1: oda(6.12, 3.03, 2.62), oda2: oda(6.12, 3.03, 2.62), yon: 'sol' });
  assert.deepEqual(eski, yeni);
});

/* ── hesap.js entegrasyonu ────────────────────────────────────────── */

test('Geometri modu S ve V\'yi otomatik hesaplayıp ayırıcı hesabına uygular', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri = { mod: 'olculer', oda1: oda(6.12, 3.03, 2.62), oda2: oda(6.12, 3.03, 2.62), yon: 'sol' };
  const a = ayiriciHesapla(p.ayiricilar[0], p.proje);
  assert.ok(a.geo);
  yakin(a.geo.S, 16.03, 0.01);
});

test('mod=\'hacim\' iken geo null\'dur ve elle girilen S/V kullanılır', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri.mod = 'hacim';
  p.ayiricilar[0].S = 9.5; p.ayiricilar[0].V = 35;
  const a = ayiriciHesapla(p.ayiricilar[0], p.proje);
  assert.equal(a.geo, null);
});

test('Standart 4 yan elemanın lf değeri geometri moduna göre otomatik güncellenir', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri = { mod: 'olculer', oda1: oda(6, 4, 2.5), oda2: oda(6, 4, 2.5), yon: 'on' };
  const a = ayiriciHesapla(p.ayiricilar[0], p.proje);
  const yanDuvarlar = a.yanElemanlar.filter((_, i) => p.ayiricilar[0].yanElemanlar[i].geometriRolu === 'yanDuvar');
  const tabanTavan = a.yanElemanlar.filter((_, i) => p.ayiricilar[0].yanElemanlar[i].geometriRolu === 'tabanTavan');
  for (const y of yanDuvarlar) yakin(y.lf, 2.5);
  for (const y of tabanTavan) yakin(y.lf, 4);
});

test('Taban ayırıcı yönünde de yan eleman lf\'leri otomatik hesaplanır', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri = { mod: 'olculer', oda1: oda(6, 4, 2.5), oda2: oda(6, 4, 2.5), yon: 'taban' };
  const a = ayiriciHesapla(p.ayiricilar[0], p.proje);
  assert.ok(a.geo.S > 0);
  for (const y of a.yanElemanlar) assert.ok(Number.isFinite(y.lf) && y.lf > 0);
});

test('Kullanıcının elle eklediği (geometriRolu tanımsız) yan eleman geometri modunda bile manuel lf\'sini korur', () => {
  const p = ornekProje();
  p.ayiricilar[0].geometri = { mod: 'olculer', oda1: oda(6, 4, 2.5), oda2: oda(6, 4, 2.5), yon: 'on' };
  p.ayiricilar[0].yanElemanlar.push({
    id: 'ozel', ad: 'Özel yan eleman', elemanId: 'ba-200', sivaId: 'sivasiz', sivaliYuzSayisi: 0,
    RwBeyan: null, yogunlukBeyan: null, lf: 1.5, birlesim: 'T', giydirmeId: 'yok', dolguId: null,
    esnekBaglanti: false, katmanlar: [],
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
});
