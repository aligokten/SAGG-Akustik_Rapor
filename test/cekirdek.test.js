/**
 * cekirdek.test.js — Hesap çekirdeğinin doğrulama testleri.
 * Çalıştırma:  node --test test/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  RdenDnT, DnTdenR, LndenLnT, LnTdenLn,
  yalitimlariBirlestir, enerjikTopla, alanKutlesi, sogurmaAlani,
} from '../js/cekirdek/temel.js';
import { rwEN12354, rwDIN4109, lnwEsdeger } from '../js/cekirdek/kutle-kanunu.js';
import { kijHesapla } from '../js/cekirdek/kij.js';
import { havaDogusluYalitim, bilesikRw } from '../js/cekirdek/en12354-1.js';
import { darbeSesiYalitimi, yanYolDuzeltmesiK } from '../js/cekirdek/en12354-2.js';
import { cepheYalitimi, bilesikCepheYalitimi } from '../js/cekirdek/en12354-3.js';
import { reverberasyonSuresi, gerekliIlaveSogurma } from '../js/cekirdek/reverberasyon.js';
import {
  sinifBelirle, havaDogusluDegerlendir, darbeSesiDegerlendir,
  cepheDegerlendir, disGurultuAraligi, genelSinif,
} from '../js/cekirdek/degerlendirme.js';
import { projeyiHesapla, elemanCoz } from '../js/hesap.js';
import { ornekProje, bosProje, yeniAyirici } from '../js/durum.js';

const yakin = (a, b, tol = 0.05) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b} bekleniyordu (tolerans ${tol})`);

/* ── Temel dönüşümler ─────────────────────────────────────────────── */

test('DnT = R\' + 10·lg(0,32·V/S) bağıntısı', () => {
  // V/S öyle seçilir ki 0,32·V/S = 1 → düzeltme 0 dB
  yakin(RdenDnT(50, 12.5, 4), 50);
  yakin(RdenDnT(50, 50, 12), 51.25);
});

test('DnT ↔ R\' dönüşümleri birbirinin tersidir', () => {
  const R = 52.3;
  yakin(DnTdenR(RdenDnT(R, 45, 11), 45, 11), R, 1e-9);
});

test('L\'nT = L\'n − 10·lg(0,032·V) bağıntısı', () => {
  yakin(LndenLnT(60, 31.25), 60);   // 0,032·31,25 = 1
  yakin(LndenLnT(60, 50), 57.96);
});

test('L\'nT ↔ L\'n dönüşümleri birbirinin tersidir', () => {
  yakin(LnTdenLn(LndenLnT(58, 62), 62), 58, 1e-9);
});

test('Eşit yalıtımlı n yol birleştirildiğinde 10·lg(n) kadar düşer', () => {
  yakin(yalitimlariBirlestir([50, 50]), 50 - 10 * Math.log10(2));
  yakin(yalitimlariBirlestir([50, 50, 50, 50]), 50 - 10 * Math.log10(4));
});

test('Enerjik toplama: iki eşit kaynak +3 dB', () => {
  yakin(enerjikTopla([60, 60]), 63.01);
});

test('Alan kütlesi sıvayı iki yüzden ekler', () => {
  yakin(alanKutlesi(200, 2400, 15, 2), 480 + 30);
});

test('Sabine soğurma alanı A = 0,16·V/T', () => {
  yakin(sogurmaAlani(100, 0.8), 20);
});

/* ── Kütle kanunu ─────────────────────────────────────────────────── */

test('TS EN 12354-1 Ek-B kolları 200 kg/m²\'de süreklidir', () => {
  yakin(rwEN12354(199.99), rwEN12354(200.01), 0.5);
});

test('Rw kütle ile monoton artar', () => {
  const kutleler = [80, 120, 200, 300, 500, 700];
  for (let i = 1; i < kutleler.length; i++) {
    assert.ok(rwEN12354(kutleler[i]) > rwEN12354(kutleler[i - 1]));
    assert.ok(rwDIN4109(kutleler[i]) > rwDIN4109(kutleler[i - 1]));
  }
});

test('12 cm betonarme döşemenin Ln,w,eq değeri gerçekçi aralıktadır', () => {
  const L = lnwEsdeger(288);   // 120 mm × 2400 kg/m³
  assert.ok(L > 74 && L < 82, `Ln,w,eq = ${L}`);
});

/* ── Kij ──────────────────────────────────────────────────────────── */

test('Eşit kütleli rijit T birleşiminde düz yol Kij = 5,7 dB', () => {
  yakin(kijHesapla({ birlesim: 'T', yol: 'duz', mGiris: 300, mCikis: 300 }), 5.7);
});

test('Eşit kütleli rijit X birleşiminde düz yol Kij = 8,7 dB', () => {
  yakin(kijHesapla({ birlesim: 'X', yol: 'duz', mGiris: 300, mCikis: 300 }), 8.7);
});

test('Kij hiçbir zaman negatif değildir', () => {
  const K = kijHesapla({ birlesim: 'T', yol: 'kose', mGiris: 50, mCikis: 600 });
  assert.ok(K >= 0, `Kij = ${K}`);
});

test('Esnek birleşim Kij değerini artırır', () => {
  const rijit = kijHesapla({ birlesim: 'T', yol: 'duz', mGiris: 300, mCikis: 300 });
  const esnek = kijHesapla({ birlesim: 'T', yol: 'duz', mGiris: 300, mCikis: 300, esnek: true });
  assert.ok(esnek > rijit);
});

/* ── TS EN 12354-1 ────────────────────────────────────────────────── */

test('Yan eleman yoksa R\'w doğrudan yola eşittir', () => {
  const r = havaDogusluYalitim({ RwAyirici: 55, mAyirici: 400, S: 12, V: 40, yanElemanlar: [] });
  yakin(r.RwAksan, 55);
  yakin(r.yanYolKaybi, 0);
});

test('Yan yollar R\'w değerini daima düşürür', () => {
  const yan = {
    ad: 'Duvar', RwKaynak: 45, RwAlici: 45, mKaynak: 220, mAlici: 220,
    lf: 2.8, birlesim: 'T',
  };
  const r = havaDogusluYalitim({ RwAyirici: 58, mAyirici: 480, S: 12, V: 40, yanElemanlar: [yan] });
  assert.ok(r.RwAksan < 58, `R'w = ${r.RwAksan}`);
  assert.ok(r.yanYolKaybi > 0);
});

test('Yol paylarının toplamı %100\'dür', () => {
  const yan = { ad: 'D', RwKaynak: 48, RwAlici: 48, mKaynak: 250, mAlici: 250, lf: 3, birlesim: 'X' };
  const r = havaDogusluYalitim({ RwAyirici: 55, mAyirici: 400, S: 12, V: 40, yanElemanlar: [yan, yan] });
  yakin(r.yollar.reduce((a, y) => a + y.payYuzde, 0), 100, 0.01);
});

test('Emniyet payı DnT,w değerinden düşülür', () => {
  const ortak = { RwAyirici: 55, mAyirici: 400, S: 12, V: 40, yanElemanlar: [] };
  const a = havaDogusluYalitim(ortak);
  const b = havaDogusluYalitim({ ...ortak, emniyetPayi: 3 });
  yakin(a.DnTw - b.DnTw, 3);
});

test('Bileşik Rw, zayıf elemana yakınsar', () => {
  const R = bilesikRw([{ S: 10, Rw: 55 }, { S: 2, Rw: 25 }]);
  assert.ok(R > 25 && R < 40, `bileşik Rw = ${R}`);
});

/* ── TS EN 12354-2 ────────────────────────────────────────────────── */

test('ΔLw arttıkça L\'nT,w düşer', () => {
  const ortak = { mDoseme: 400, mYanOrtalama: 250, V: 45 };
  const a = darbeSesiYalitimi({ ...ortak, dLw: 0 });
  const b = darbeSesiYalitimi({ ...ortak, dLw: 28 });
  yakin(a.LnTw - b.LnTw, 28);
});

test('Yan yol düzeltmesi K, 0–4 dB aralığındadır', () => {
  for (const md of [100, 250, 400, 600]) {
    for (const my of [80, 200, 350, 500]) {
      const K = yanYolDuzeltmesiK(md, my);
      assert.ok(K >= 0 && K <= 4, `K(${md},${my}) = ${K}`);
    }
  }
});

test('Ağır yan duvar, K düzeltmesini azaltır', () => {
  assert.ok(yanYolDuzeltmesiK(300, 400) <= yanYolDuzeltmesiK(300, 100));
});

test('Darbe sesinde emniyet payı sonuca eklenir (aleyhte)', () => {
  const ortak = { mDoseme: 400, mYanOrtalama: 250, V: 45, dLw: 20 };
  const a = darbeSesiYalitimi(ortak);
  const b = darbeSesiYalitimi({ ...ortak, emniyetPayi: 2 });
  yakin(b.LnTw - a.LnTw, 2);
});

/* ── TS EN 12354-3 ────────────────────────────────────────────────── */

test('Tek elemanlı cephede bileşik Rw, elemanın Rw\'sine eşittir', () => {
  const r = bilesikCepheYalitimi([{ ad: 'Duvar', S: 12, Rw: 50 }]);
  yakin(r.Rw, 50);
});

test('Zayıf pencere cephenin bileşik yalıtımını sınırlar', () => {
  const r = bilesikCepheYalitimi([
    { ad: 'Duvar', S: 9, Rw: 55 },
    { ad: 'Pencere', S: 6, Rw: 30 },
  ]);
  assert.ok(r.Rw > 30 && r.Rw < 36, `bileşik Rw = ${r.Rw}`);
  assert.equal(r.paylar[0].ad, 'Pencere');
});

test('Havalandırma menfezi cephe yalıtımını düşürür', () => {
  const elemanlar = [{ ad: 'Duvar', S: 12, Rw: 50 }];
  const a = bilesikCepheYalitimi(elemanlar);
  const b = bilesikCepheYalitimi(elemanlar, [{ ad: 'Menfez', adet: 1, Dnew: 33 }]);
  assert.ok(b.Rw < a.Rw);
});

test('Cephe hacim terimi: V/(6·T₀·S) = 1 iken katkı 0 dB', () => {
  const S = 10, T0 = 0.5, V = 6 * T0 * S;
  const r = cepheYalitimi({ yuzeyselElemanlar: [{ ad: 'D', S, Rw: 45 }], V, T0 });
  yakin(r.D2mnTw, 45);
});

/* ── Reverberasyon ────────────────────────────────────────────────── */

test('Sabine: soğurma iki katına çıkınca T yarıya iner', () => {
  const alfa = { 125: 0.2, 250: 0.2, 500: 0.2, 1000: 0.2, 2000: 0.2, 4000: 0.2 };
  const a = reverberasyonSuresi({ V: 200, yuzeyler: [{ ad: 'y', alan: 100, alfa }], havaSogurmasi: false });
  const b = reverberasyonSuresi({ V: 200, yuzeyler: [{ ad: 'y', alan: 200, alfa }], havaSogurmasi: false });
  yakin(a.T[500] / b.T[500], 2, 0.001);
});

test('Gerekli ilave soğurma, hedef sağlanıyorsa sıfırdır', () => {
  assert.equal(gerekliIlaveSogurma(100, 100, 0.5), 0);
  assert.ok(gerekliIlaveSogurma(100, 10, 0.5) > 0);
});

/* ── Değerlendirme ────────────────────────────────────────────────── */

test('sinifBelirle en iyi sağlanan sınıfı döndürür (enAz)', () => {
  const satir = { A: 64, B: 60, C: 56, D: 52, E: 48, F: 44 };
  assert.equal(sinifBelirle(satir, 65, 'enAz'), 'A');
  assert.equal(sinifBelirle(satir, 57, 'enAz'), 'C');
  assert.equal(sinifBelirle(satir, 40, 'enAz'), null);
});

test('sinifBelirle küçük değerin iyi olduğu tabloda doğru çalışır (enCok)', () => {
  const satir = { A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 };
  assert.equal(sinifBelirle(satir, 38, 'enCok'), 'A');
  assert.equal(sinifBelirle(satir, 50, 'enCok'), 'D');
  assert.equal(sinifBelirle(satir, 70, 'enCok'), null);
});

test('Dış gürültü aralığı doğru seçilir', () => {
  assert.equal(disGurultuAraligi(50).id, 'a');
  assert.equal(disGurultuAraligi(60).id, 'b');
  assert.equal(disGurultuAraligi(61).id, 'c');
  assert.equal(disGurultuAraligi(90).id, 'f');
});

test('Hava doğuşlu değerlendirme, sınırda "uygun" sayar', () => {
  const d = havaDogusluDegerlendir({
    kaynakMekanId: 'konut-oturma', aliciMekanId: 'konut-yatak', DnTw: 56, hedefSinif: 'C',
  });
  assert.equal(d.gereken, 56);
  assert.equal(d.uygun, true);
  assert.equal(d.fark, 0);
});

test('Darbe sesinde sınırın üstü uygunsuzdur', () => {
  const d = darbeSesiDegerlendir({
    ustMekanId: 'konut-oturma', altMekanId: 'konut-yatak', LnTw: 60, hedefSinif: 'C',
  });
  assert.equal(d.uygun, false);
  assert.ok(d.fark < 0);
});

test('Cephe değerlendirmesi dış gürültü arttıkça sıkılaşır', () => {
  const az = cepheDegerlendir({ mekanId: 'konut-yatak', disGurultu: 52, D2mnTw: 40 });
  const cok = cepheDegerlendir({ mekanId: 'konut-yatak', disGurultu: 78, D2mnTw: 40 });
  assert.ok(cok.gereken > az.gereken);
});

test('Genel sınıf, en düşük performanslı bileşen tarafından belirlenir', () => {
  assert.equal(genelSinif([{ eldeEdilenSinif: 'A' }, { eldeEdilenSinif: 'D' }, { eldeEdilenSinif: 'B' }]), 'D');
  assert.equal(genelSinif([]), null);
});

/* ── Bütünleşik ───────────────────────────────────────────────────── */

test('Beyan edilmiş Rw, kestirimin yerine geçer', () => {
  const a = elemanCoz({ elemanId: 'ba-200', sivaId: 'sivasiz', sivaliYuzSayisi: 0 });
  const b = elemanCoz({ elemanId: 'ba-200', sivaId: 'sivasiz', sivaliYuzSayisi: 0, RwBeyan: 61 });
  assert.equal(b.Rw, 61);
  assert.notEqual(a.Rw, 61);
  assert.match(b.kaynak, /beyan/);
});

test('Boş proje hesaplanabilir ve çökmez', () => {
  const s = projeyiHesapla(bosProje());
  assert.equal(s.toplamBilesen, 0);
  assert.equal(s.genelSinif, null);
  assert.equal(s.tumUygun, true);
});

test('Örnek proje uçtan uca hesaplanır', () => {
  const s = projeyiHesapla(ornekProje());
  assert.ok(s.ayiricilar.length >= 2);
  assert.ok(s.darbeler.length >= 1);
  assert.ok(s.cepheler.length >= 1);
  assert.ok(s.hacimler.length >= 1);
  for (const a of s.ayiricilar) {
    assert.ok(Number.isFinite(a.sonuc.DnTw), 'DnT,w sayısal olmalı');
    assert.ok(a.degerlendirme, 'değerlendirme üretilmeli');
  }
  for (const d of s.darbeler) assert.ok(Number.isFinite(d.sonuc.LnTw));
  for (const c of s.cepheler) assert.ok(Number.isFinite(c.sonuc.D2mnTw));
  for (const h of s.hacimler) assert.ok(Number.isFinite(h.sonuc.Torta));
});

test('Örnek projede giydirme kabuk DnT,w değerini yükseltir', () => {
  const p = ornekProje();
  const iyilestirilmis = projeyiHesapla(p).ayiricilar[0].sonuc.DnTw;
  p.ayiricilar[0].giydirmeId = 'yok';
  p.ayiricilar[0].yanElemanlar[1].giydirmeId = 'yok';
  const cipla = projeyiHesapla(p).ayiricilar[0].sonuc.DnTw;
  assert.ok(iyilestirilmis > cipla + 3, `${iyilestirilmis} > ${cipla}`);
});

test('Kapı, ayırıcı elemanın yalıtımını belirgin biçimde düşürür', () => {
  const p = bosProje();
  const a = yeniAyirici();
  a.kapiVar = false;
  p.ayiricilar = [a];
  const kapisiz = projeyiHesapla(p).ayiricilar[0].sonuc.DnTw;
  p.ayiricilar[0] = { ...a, kapiVar: true, kapiId: 'kapi-ic-basit', kapiAlani: 1.8 };
  const kapili = projeyiHesapla(p).ayiricilar[0].sonuc.DnTw;
  assert.ok(kapili < kapisiz - 10, `${kapili} << ${kapisiz}`);
});
