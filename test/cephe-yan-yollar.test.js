/**
 * cephe-yan-yollar.test.js — Cephede iç yan yollar (Df), köşe mahal,
 * Ctr → DnT,A,tr ve manuel hedef davranışı.
 *
 * Bağıntılar referans "Katmanlı Model v3" motoruyla aynıdır:
 *
 *   R_Df = (Rw_dış + Rw_yan)/2 + Kij,köşe + 10·lg( S / lf )
 *   R'w,görünür = −10·lg( 10^(−Rw,bileşik/10) + Σ 10^(−R_Df/10) )
 *   D2m,nT,w = R'w,görünür + ΔLfs + 10·lg( V/(6·T0·S) ) − emniyet payı
 *   DnT,A,tr = D2m,nT,w + Ctr
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cepheYalitimi, cepheGeometrisi, yanElemanBaglantilari,
} from '../js/cekirdek/en12354-3.js';
import { kijHesapla } from '../js/cekirdek/kij.js';
import { cepheDegerlendir } from '../js/cekirdek/degerlendirme.js';

const yakin = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (fark ${Math.abs(a - b)})`);

const ODA = { L: 4.5, W: 3.4, H: 2.62 };

/* ── Geometri ─────────────────────────────────────────────────────── */

test('Orta mahalde tek dış duvar (D1 = L×H) bulunur', () => {
  const g = cepheGeometrisi(ODA, 'orta');
  assert.equal(g.duvarlar.length, 1);
  yakin(g.duvarlar[0].alan, 4.5 * 2.62);
  yakin(g.toplamCepheAlani, 4.5 * 2.62);
  yakin(g.V, 4.5 * 3.4 * 2.62);
});

test('Köşe mahalde iki dış duvar (D1 = L×H, D2 = W×H) bulunur', () => {
  const g = cepheGeometrisi(ODA, 'kose');
  assert.equal(g.duvarlar.length, 2);
  yakin(g.duvarlar[0].alan, 4.5 * 2.62);
  yakin(g.duvarlar[1].alan, 3.4 * 2.62);
  yakin(g.toplamCepheAlani, 4.5 * 2.62 + 3.4 * 2.62);
});

test('İç tavan/taban her aktif dış duvara, iç duvarlar tek duvara bağlanır', () => {
  const orta = cepheGeometrisi(ODA, 'orta');
  const kose = cepheGeometrisi(ODA, 'kose');

  // Tavan/taban: birleşim uzunluğu o duvarın yatay boyudur.
  assert.deepEqual(yanElemanBaglantilari('icTavan', orta), [{ duvarNo: 1, lf: 4.5 }]);
  assert.deepEqual(yanElemanBaglantilari('icTavan', kose), [
    { duvarNo: 1, lf: 4.5 }, { duvarNo: 2, lf: 3.4 },
  ]);

  // İç yan duvarlar cepheye dik bağlanır; birleşim uzunluğu H'dir.
  assert.deepEqual(yanElemanBaglantilari('icSolDuvar', orta), [{ duvarNo: 1, lf: 2.62 }]);

  // İç arka duvar yalnızca köşe mahalde etkindir.
  assert.deepEqual(yanElemanBaglantilari('icArkaDuvar', orta), []);
  assert.deepEqual(yanElemanBaglantilari('icArkaDuvar', kose), [{ duvarNo: 2, lf: 2.62 }]);
});

/* ── Yan yol hesabı ───────────────────────────────────────────────── */

const ELEMANLAR = [{ ad: 'Duvar', S: 9.9, Rw: 52 }, { ad: 'Pencere', S: 3.6, Rw: 36 }];

function coz(yanYollar, ek = {}) {
  return cepheYalitimi({
    yuzeyselElemanlar: ELEMANLAR, kucukElemanlar: [],
    V: 40, bicim: 'duz', T0: 0.5, emniyetPayi: 0, ...ek, yanYollar,
  });
}

test('Yan yol yoksa görünür R′w bileşik R′w ile aynıdır', () => {
  const s = coz([]);
  yakin(s.RwGorunur, s.RwBilesik);
});

test('Yan yol eklendiğinde görünür R′w düşer ve bağıntıya uyar', () => {
  const yol = {
    ad: 'D1f — İç tavan', duvarNo: 1, lf: 4.5,
    RwYan: 55.3, mYan: 394, RwDis: 52, mDis: 300, birlesim: 'T', esnek: false,
  };
  const s = coz([yol]);

  const alanTerimi = 10 * Math.log10(s.S / 4.5);
  const K = kijHesapla({ birlesim: 'T', yol: 'kose', mGiris: 300, mCikis: 394, esnek: false });
  const beklenenR = (52 + 55.3) / 2 + K + alanTerimi;
  yakin(s.yanYollar[0].R, beklenenR, 1e-9);

  const beklenenGorunur = -10 * Math.log10(
    Math.pow(10, -s.RwBilesik / 10) + Math.pow(10, -beklenenR / 10),
  );
  yakin(s.RwGorunur, beklenenGorunur, 1e-9);
  assert.ok(s.RwGorunur < s.RwBilesik, 'yan yol yalıtımı düşürmelidir');
});

test('Daha fazla yan yol, görünür R′w′yi daha da düşürür (köşe mahal etkisi)', () => {
  const yol = (ad, lf) => ({
    ad, duvarNo: 1, lf, RwYan: 55.3, mYan: 394, RwDis: 52, mDis: 300, birlesim: 'T', esnek: false,
  });
  const tek = coz([yol('a', 4.5)]);
  const cok = coz([yol('a', 4.5), yol('b', 3.4), yol('c', 2.62)]);
  assert.ok(cok.RwGorunur < tek.RwGorunur);
});

test('Esnek bağlantı yan yolu zayıflatır, görünür R′w yükselir', () => {
  const temel = {
    ad: 'D1f', duvarNo: 1, lf: 4.5, RwYan: 55.3, mYan: 394, RwDis: 52, mDis: 300, birlesim: 'T',
  };
  const rijit = coz([{ ...temel, esnek: false }]);
  const esnek = coz([{ ...temel, esnek: true }]);
  assert.ok(esnek.RwGorunur > rijit.RwGorunur);
  // Esnek birleşim Kij'ye +5 dB ekler.
  yakin(esnek.yanYollar[0].R - rijit.yanYollar[0].R, 5, 1e-9);
});

/* ── Ctr ve göstergeler ───────────────────────────────────────────── */

test('DnT,A,tr = D2m,nT,w + Ctr', () => {
  for (const ctr of [0, -3, -8]) {
    const s = coz([], { ctr });
    yakin(s.DnTAtr, s.D2mnTw + ctr, 1e-9);
  }
});

test('Yol payları %100 toplar ve doğrudan yolu içerir', () => {
  const s = coz([{
    ad: 'D1f', duvarNo: 1, lf: 4.5, RwYan: 55.3, mYan: 394, RwDis: 52, mDis: 300,
    birlesim: 'T', esnek: false,
  }]);
  const toplam = s.yolPaylari.reduce((a, p) => a + p.payYuzde, 0);
  yakin(toplam, 100, 1e-6);
  assert.ok(s.yolPaylari.some((p) => p.tip === 'dogrudan'));
  assert.ok(s.yolPaylari.some((p) => p.tip === 'Df'));
});

/* ── Manuel hedef ─────────────────────────────────────────────────── */

test('Manuel hedef, yönetmelik hedefinin yerine geçer ve etiketlenir', () => {
  const ortak = { mekanId: 'konut-yatak', disGurultu: 68, D2mnTw: 44.2, hedefSinif: 'C' };

  const yonetmelik = cepheDegerlendir(ortak);
  assert.equal(yonetmelik.hedefKaynagi, 'yonetmelik');
  assert.equal(yonetmelik.gereken, yonetmelik.yonetmelikGereken);

  const manuel = cepheDegerlendir({ ...ortak, manuelHedef: 40 });
  assert.equal(manuel.hedefKaynagi, 'manuel');
  assert.equal(manuel.gereken, 40);
  // Yönetmelik değeri bilgi olarak korunur; sınıf yine tablodan okunur.
  assert.equal(manuel.yonetmelikGereken, yonetmelik.yonetmelikGereken);
  assert.equal(manuel.eldeEdilenSinif, yonetmelik.eldeEdilenSinif);
  assert.equal(manuel.uygun, true);
});

test('Manuel hedef null/NaN ise yönetmelik hedefi korunur', () => {
  const ortak = { mekanId: 'konut-yatak', disGurultu: 68, D2mnTw: 44.2, hedefSinif: 'C' };
  for (const m of [null, undefined, NaN]) {
    const d = cepheDegerlendir({ ...ortak, manuelHedef: m });
    assert.equal(d.hedefKaynagi, 'yonetmelik');
    assert.equal(d.gereken, d.yonetmelikGereken);
  }
});
