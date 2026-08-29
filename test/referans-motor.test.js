/**
 * referans-motor.test.js — Referans "Katmanlı Model v3" hesap motoruyla
 * formül düzeyinde denklik.
 *
 * Referans uygulamanın (Next.js sürümü, `app/page.tsx`) bağıntıları burada
 * bağımsız bir "oracle" olarak yeniden yazılmıştır. Testler, kendi
 * çekirdeğimizin bu oracle ile geniş bir girdi kümesinde aynı sonucu
 * verdiğini doğrular. Böylece denklik tek tek örneklere değil bağıntının
 * kendisine bağlanır; bir katsayı değişirse test kırılır.
 *
 * Oracle kaynağı — referans uygulamadaki karşılıkları:
 *   rwEstimate()   → Rw kestirimi (en12354 / din4109)
 *   kij()          → titreşim azaltma indisi
 *   calculate()    → yan yollar, R′w, DnT,w, L′nT,w
 *   geometry()     → ayırıcı alanı ve spanA/spanB
 *   calculateFacade() → cephe geometri düzeltmesi
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { rwEN12354, rwDIN4109, lnwEsdeger } from '../js/cekirdek/kutle-kanunu.js';
import { kijHesapla } from '../js/cekirdek/kij.js';
import { RdenDnT, LndenLnT, yalitimlariBirlestir } from '../js/cekirdek/temel.js';
import { yanYolHesapla } from '../js/cekirdek/en12354-1.js';
import { geometriHesapla } from '../js/cekirdek/geometri.js';
import { cepheYalitimi, BICIM_DUZELTMELERI } from '../js/cekirdek/en12354-3.js';

/* ══ Referans oracle — referans uygulamanın bağıntıları ═══════════════ */

const O = {
  rwEstimate(m, model = 'en12354') {
    if (!(m > 0)) return NaN;
    if (model === 'din4109') {
      return m <= 150 ? 20.4 * Math.log10(m) + 0.9 : 30.9 * Math.log10(m) - 22.2;
    }
    return m < 200 ? 13 * Math.log10(m) + 14 : 37.5 * Math.log10(m) - 42;
  },
  kij(jointType, path, inMass, outMass, elastic) {
    if (!(inMass > 0) || !(outMass > 0)) return 0;
    const ratio = Math.log10(inMass / outMass);
    const isX = jointType === 'X';
    const base = isX ? 8.7 : 5.7;
    const cornerCoefficient = isX ? 17.1 : 14.1;
    const result = path === 'straight'
      ? base + 5.7 * ratio * ratio
      : base + cornerCoefficient * ratio + 5.7 * ratio * ratio;
    return Math.max(0, result + (elastic ? 5 : 0));
  },
  combineInsulations(values) {
    const energy = values.reduce((s, v) => s + Math.pow(10, -v / 10), 0);
    return energy > 0 ? -10 * Math.log10(energy) : 0;
  },
  areaTerm(area, lf) {
    return 10 * Math.log10(Math.max(area, 0.1) / Math.max(lf, 0.1));
  },
  dnTw(rPrime, T0, receiverVolume, area, safetyMargin) {
    return rPrime + 10 * Math.log10((0.64 * T0 * receiverVolume) / Math.max(area, 0.1)) - safetyMargin;
  },
  lnTw(floorMass, deltaLw, T0, receiverVolume, safetyMargin) {
    const lnEq = 164 - 35 * Math.log10(floorMass);
    return lnEq - deltaLw - 10 * Math.log10(0.064 * T0 * receiverVolume) + safetyMargin;
  },
  geometry(r1, r2, separatorFace) {
    if (separatorFace === 'length-wall') {
      return {
        area: Math.min(r1.length, r2.length) * Math.min(r1.height, r2.height),
        spanA: Math.min(r1.height, r2.height),
        spanB: Math.min(r1.length, r2.length),
      };
    }
    if (separatorFace === 'width-wall') {
      return {
        area: Math.min(r1.width, r2.width) * Math.min(r1.height, r2.height),
        spanA: Math.min(r1.height, r2.height),
        spanB: Math.min(r1.width, r2.width),
      };
    }
    return {
      area: Math.min(r1.length, r2.length) * Math.min(r1.width, r2.width),
      spanA: Math.min(r1.length, r2.length),
      spanB: Math.min(r1.width, r2.width),
    };
  },
  geometryCorrection(volume, T0, totalFacadeArea) {
    return 10 * Math.log10(volume / (6 * T0 * totalFacadeArea));
  },
};

const yakin = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (fark ${Math.abs(a - b)})`);

/** Test girdileri için yayılmış örnek kümeleri. */
const KUTLELER = [1, 12.4, 40, 75, 149.9, 150, 173, 199.9, 200, 233.4, 400, 601.4, 1200];
const BIRLESIMLER = ['T', 'X'];
const ESNEK = [false, true];

/* ══ Rw kestirimi ═════════════════════════════════════════════════════ */

test('Rw kestirimi (en12354) referans motorla birebir aynı', () => {
  for (const m of KUTLELER) yakin(rwEN12354(m), O.rwEstimate(m, 'en12354'));
});

test('Rw kestirimi (din4109) referans motorla birebir aynı', () => {
  for (const m of KUTLELER) yakin(rwDIN4109(m), O.rwEstimate(m, 'din4109'));
});

test('Kol değişim noktaları referans motorla aynı yerde', () => {
  // en12354 kolu 200 kg/m²'de, din4109 kolu 150 kg/m²'de değişir.
  yakin(rwEN12354(199.999), O.rwEstimate(199.999, 'en12354'));
  yakin(rwEN12354(200), O.rwEstimate(200, 'en12354'));
  yakin(rwDIN4109(150), O.rwEstimate(150, 'din4109'));
  yakin(rwDIN4109(150.001), O.rwEstimate(150.001, 'din4109'));
});

/* ══ Kij ══════════════════════════════════════════════════════════════ */

test('Kij referans motorla birebir aynı (T/X × düz/köşe × esnek)', () => {
  for (const birlesim of BIRLESIMLER) {
    for (const esnek of ESNEK) {
      for (const mGiris of KUTLELER) {
        for (const mCikis of KUTLELER) {
          yakin(
            kijHesapla({ birlesim, yol: 'duz', mGiris, mCikis, esnek }),
            O.kij(birlesim, 'straight', mGiris, mCikis, esnek),
          );
          yakin(
            kijHesapla({ birlesim, yol: 'kose', mGiris, mCikis, esnek }),
            O.kij(birlesim, 'corner', mGiris, mCikis, esnek),
          );
        }
      }
    }
  }
});

test('Kij sıfırın altına kırpılır (referans koddaki Math.max(0, …))', () => {
  // T köşe kolu M = −14,1/(2·5,7) ≈ −1,237'de en küçük değerini (−3,0 dB)
  // alır; 40/690 kütle oranı tam bu bölgeye düşer.
  const ham = 5.7 + 14.1 * Math.log10(40 / 690) + 5.7 * Math.log10(40 / 690) ** 2;
  assert.ok(ham < 0, `kırpma örneği negatif olmalı, ham = ${ham}`);

  const K = kijHesapla({ birlesim: 'T', yol: 'kose', mGiris: 40, mCikis: 690, esnek: false });
  assert.equal(K, 0);
  yakin(K, O.kij('T', 'corner', 40, 690, false));
});

/* ══ Yan yollar ═══════════════════════════════════════════════════════ */

test('Ff / Fd / Df yolları referans motorla birebir aynı', () => {
  const senaryolar = [
    { mF: 205.2, rwF: null, mS: 233.4, S: 16.03, lf: 2.62, birlesim: 'T', esnek: true },
    { mF: 472.7, rwF: null, mS: 233.4, S: 16.03, lf: 6.12, birlesim: 'X', esnek: true },
    { mF: 173.0, rwF: null, mS: 601.4, S: 18.94, lf: 3.03, birlesim: 'T', esnek: false },
    { mF: 245.4, rwF: null, mS: 601.4, S: 18.94, lf: 6.25, birlesim: 'T', esnek: true },
    { mF: 40, rwF: null, mS: 1200, S: 9.62, lf: 2.65, birlesim: 'X', esnek: false },
  ];

  for (const s of senaryolar) {
    const rwF = O.rwEstimate(s.mF);
    const rwS = O.rwEstimate(s.mS);

    const bizim = yanYolHesapla(
      {
        ad: 'yan', RwKaynak: rwF, RwAlici: rwF, mKaynak: s.mF, mAlici: s.mF,
        lf: s.lf, birlesim: s.birlesim, esnekBaglanti: s.esnek,
      },
      { RwAyirici: rwS, mAyirici: s.mS, S: s.S },
    );

    const areaTerm = O.areaTerm(s.S, s.lf);
    const ff = rwF + O.kij(s.birlesim, 'straight', s.mF, s.mF, s.esnek) + areaTerm;
    const fd = (rwF + rwS) / 2 + O.kij(s.birlesim, 'corner', s.mF, s.mS, s.esnek) + areaTerm;
    const df = (rwS + rwF) / 2 + O.kij(s.birlesim, 'corner', s.mS, s.mF, s.esnek) + areaTerm;

    yakin(bizim.Ff, ff, 1e-9);
    yakin(bizim.Fd, fd, 1e-9);
    yakin(bizim.Df, df, 1e-9);
  }
});

test('Enerjik birleştirme referans motorla aynı', () => {
  const kumeler = [[46.8], [46.8, 63.3, 63.6], [62.2, 56.8, 56.8, 57.4, 60.3, 60.6, 60.6, 63.1]];
  for (const k of kumeler) yakin(yalitimlariBirlestir(k), O.combineInsulations(k), 1e-9);
});

/* ══ Göstergeye dönüşüm ═══════════════════════════════════════════════ */

test('DnT,w dönüşümü referans motorla birebir aynı (T0 genel)', () => {
  const ornekler = [
    { rPrime: 46.2, T0: 0.5, V: 48.58, S: 16.03, pay: 2 },
    { rPrime: 49.9, T0: 0.5, V: 81.37, S: 18.94, pay: 2 },
    { rPrime: 52.0, T0: 0.8, V: 120.0, S: 22.5, pay: 0 },
    { rPrime: 44.0, T0: 1.2, V: 30.59, S: 9.62, pay: 3 },
  ];
  for (const o of ornekler) {
    yakin(
      RdenDnT(o.rPrime, o.V, o.S, o.T0) - o.pay,
      O.dnTw(o.rPrime, o.T0, o.V, o.S, o.pay),
      1e-9,
    );
  }
});

test("L'nT,w dönüşümü referans motorla birebir aynı", () => {
  const ornekler = [
    { m: 601.4, dLw: 19, T0: 0.5, V: 81.37, pay: 2 },
    { m: 360.0, dLw: 0, T0: 0.5, V: 48.58, pay: 2 },
    { m: 604.4, dLw: 25, T0: 0.9, V: 120.0, pay: 0 },
  ];
  for (const o of ornekler) {
    const LnwAksan = lnwEsdeger(o.m) - o.dLw;
    yakin(
      LndenLnT(LnwAksan, o.V, o.T0) + o.pay,
      O.lnTw(o.m, o.dLw, o.T0, o.V, o.pay),
      1e-9,
    );
  }
});

/* ══ Geometri ve lf eşleşmesi ═════════════════════════════════════════ */

test('Ayırıcı alanı ve lf eşleşmesi referans motorla aynı (üç yüzey)', () => {
  const odaCiftleri = [
    [{ L: 6.12, W: 3.03, H: 2.62 }, { L: 6.12, W: 3.03, H: 2.62 }],
    [{ L: 6.25, W: 3.18, H: 2.65 }, { L: 10.25, W: 3.03, H: 2.62 }],
    [{ L: 3.18, W: 1.57, H: 2.65 }, { L: 3.18, W: 3.63, H: 2.65 }],
  ];
  // Kendi yön kodumuz ↔ referans yüzey kodu
  const yonler = [['sol', 'length-wall'], ['on', 'width-wall'], ['taban', 'floor']];

  for (const [oda1, oda2] of odaCiftleri) {
    for (const [yon, face] of yonler) {
      const bizim = geometriHesapla({ oda1, oda2, yon });
      const ref = O.geometry(
        { length: oda1.L, width: oda1.W, height: oda1.H },
        { length: oda2.L, width: oda2.W, height: oda2.H },
        face,
      );
      yakin(bizim.S, ref.area, 1e-9);

      // Referans motorda lf = (index % 2 === 0 ? spanA : spanB); F1/F3 → spanA,
      // F2/F4 → spanB. Bizde bu, yanDuvarLf / tabanTavanLf rollerine karşılık gelir.
      yakin(bizim.yanDuvarLf, ref.spanA, 1e-9);
      yakin(bizim.tabanTavanLf, ref.spanB, 1e-9);
    }
  }
});

/* ══ Cephe ════════════════════════════════════════════════════════════ */

test('Cephe geometri düzeltmesi ve biçim katsayıları referans motorla aynı', () => {
  // Referans motordaki şekil düzeltmeleri (TECHNICAL-HANDOFF §6.4).
  const refSekil = { duz: 0, balkon: 1, balkonYans: -1, loggia: 1.5, gunesKesici: -2 };
  for (const [anahtar, dB] of Object.entries(refSekil)) {
    yakin(BICIM_DUZELTMELERI[anahtar].dLfs, dB, 1e-9);
  }

  const senaryolar = [
    { V: 48.58, T0: 0.5, elemanlar: [{ S: 9.9, Rw: 52 }, { S: 3.6, Rw: 36 }] },
    { V: 120.0, T0: 0.8, elemanlar: [{ S: 14.0, Rw: 55 }, { S: 6.0, Rw: 33 }] },
  ];
  for (const s of senaryolar) {
    const sonuc = cepheYalitimi({
      yuzeyselElemanlar: s.elemanlar, kucukElemanlar: [], V: s.V,
      bicim: 'duz', T0: s.T0, emniyetPayi: 0,
    });
    yakin(sonuc.hacimTerimi, O.geometryCorrection(s.V, s.T0, sonuc.S), 1e-9);
  }
});

test('Bileşik cephe Rw: küçük elemanlar A0 = 10 m² ile katılır', () => {
  // Referans: E_small = Σ adet × 10 × 10^(−Dn,e,w/10)
  const alanli = [{ S: 12, Rw: 50 }];
  const kucuk = [{ adet: 2, Dnew: 40 }];
  const sonuc = cepheYalitimi({
    yuzeyselElemanlar: alanli, kucukElemanlar: kucuk, V: 50, bicim: 'duz', T0: 0.5, emniyetPayi: 0,
  });
  const eAlan = 12 * Math.pow(10, -50 / 10);
  const eKucuk = 2 * 10 * Math.pow(10, -40 / 10);
  const beklenen = -10 * Math.log10((eAlan + eKucuk) / 12);
  yakin(sonuc.RwBilesik, beklenen, 1e-9);
});
