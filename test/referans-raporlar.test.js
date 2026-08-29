/**
 * referans-raporlar.test.js — "Katmanlı Model v3" referans raporlarına karşı
 * uçtan uca regresyon.
 *
 * Aşağıdaki iki senaryo, referans aracın yayımladığı PDF raporlarından
 * (SAGG_Akustik_Rapor_ID1.pdf ve SAGG_Akustik_Rapor_DOS1.pdf) birebir
 * alınmıştır. Amaç, kendi hesap çekirdeğimizin aynı çalışma prensibini
 * uyguladığını sayısal olarak sabitlemektir:
 *
 *   • Rw kestirimi  : TS EN 12354-1 Ek-B iki kollu kütle kanunu
 *                     (m′ < 200 → 13·lg m′ + 14 ; m′ ≥ 200 → 37,5·lg m′ − 42)
 *   • Yan yollar    : Dd + Ff/Fd/Df enerjik toplamı, Kij birleşim tipinden
 *   • Göstergeye    : DnT,w = R′w + 10·lg(0,32·V_alıcı / S) − emniyet payı
 *     dönüşüm         (referans dosyalarda emniyet payı 2 dB)
 *
 * ID1 düşey duvar ayırıcıyı, DOS1 ise döşeme (taban/tavan) ayırıcıyı ve
 * asimetrik oda çiftini kapsar. İkisi birlikte, v3 F1–F4 yüzeylerinin kendi
 * yan eleman dizinimize eşlenmesini de kilitler.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { v3ProjeyiDonustur } from '../js/veri/v3-donusturucu.js';
import { projeyiHesapla } from '../js/hesap.js';

/** Katman kaydı kısayolu. */
const K = (name, defaultMm, density, role = 'mass') => ({ name, defaultMm, density, role });
/** Yüzey kaydı kısayolu. */
const Y = (layers, jointType, elastic) => ({ layers, declaredRw: null, jointType, elastic });

const ORTAK = {
  version: 3,
  projectName: 'MARINA VISTA BODRUM',
  employer: 'MARLIN OTEL',
  architect: 'SAGG İnşaat Mimarlık Akustik',
  author: 'ALİ GÖKTEN',
  buildingType: 'otel',
  buildingStatus: 'esasliTadilat',
  targetClass: 'D',
  sourceRoomUseId: 'otel-oda',
  receiverRoomUseId: 'otel-oda',
  rwModel: 'en12354',
  referenceT0: 0.5,
  safetyMargin: 2,
};

/* ── ID1 — düşey duvar (L × H) ayırıcı, simetrik odalar ─────────────── */

const ID1 = {
  ...ORTAK,
  projectCode: 'ID1',
  room1: { name: 'TİP 1 YATAK ODASI', length: 6.12, width: 3.03, height: 2.62 },
  room2: { name: 'TİP 1 YATAK ODASI', length: 6.12, width: 3.03, height: 2.62 },
  separatorFace: 'LH',
  surfaces: {
    separator: Y([
      K('Alçı sıva', 22, 1200, 'finish'), K('Çimento esaslı sıva', 20, 2000, 'finish'),
      K('G2 gazbeton', 150, 400), K('Knauf mineral yün IPB 039', 50, 12.4, 'insulation'),
      K('G2 gazbeton', 100, 400), K('Çimento esaslı sıva', 20, 2000, 'finish'),
      K('Alçı sıva', 22, 1200, 'finish'),
    ], 'T', false),
    f1: Y([
      K('Alçı sıva', 21, 1200, 'finish'), K('Çimento esaslı sıva', 20, 2000, 'finish'),
      K('G2 gazbeton', 200, 400), K('Çimento esaslı sıva', 30, 2000, 'finish'),
    ], 'T', true),
    f2: Y([
      K('Seramik kaplama', 20, 2200, 'finish'), K('Betonarme', 150, 2400),
      K('Taşyünü levha', 50, 70, 'insulation'), K('Çimento esaslı sıva', 20, 2000, 'finish'),
      K('Alçı sıva', 21, 1200, 'finish'),
    ], 'X', true),
    f3: Y([
      K('Alçı sıva', 21, 1200, 'finish'), K('Çimento esaslı sıva', 20, 2000, 'finish'),
      K('G2 gazbeton', 200, 400), K('Çimento esaslı sıva', 20, 2000, 'finish'),
      K('Alçı sıva', 21, 1200, 'finish'),
    ], 'T', true),
    f4: Y([
      K('Seramik kaplama', 20, 2200, 'finish'), K('Tesviye şapı', 70, 2000),
      K('Akustik şilte', 5, 75, 'resilient'), K('Betonarme', 150, 2400),
      K('Çimento esaslı sıva', 20, 2000, 'finish'), K('Alçı sıva', 20, 1000, 'finish'),
    ], 'X', true),
  },
};

/* ── DOS1 — döşeme (L × W) ayırıcı, asimetrik odalar ────────────────── */

const DOS1 = {
  ...ORTAK,
  projectCode: 'DOS1',
  room1: { name: 'TİP 2 YATAK ODASI', length: 6.25, width: 3.18, height: 2.65 },
  room2: { name: 'TİP 1 YATAK ODASI', length: 10.25, width: 3.03, height: 2.62 },
  separatorFace: 'floor',
  surfaces: {
    separator: Y([
      K('Seramik kaplama', 20, 2200, 'finish'), K('Tesviye şapı', 70, 2000),
      K('Akustik şilte', 5, 75, 'resilient'), K('Betonarme', 150, 2400),
      K('Çimento esaslı sıva', 20, 1800, 'finish'), K('Alçı sıva', 21, 1000, 'finish'),
    ], 'T', false),
    f1: Y([
      K('Alçı sıva', 22, 1200, 'finish'), K('Çimento esaslı sıva', 20, 1800, 'finish'),
      K('G2 gazbeton', 150, 400), K('Knauf mineral yün IPB 039', 50, 12.4, 'insulation'),
      K('G2 gazbeton', 150, 400), K('Çimento esaslı sıva', 20, 1800, 'finish'),
      K('Alçı sıva', 22, 1200, 'finish'),
    ], 'T', true),
    f2: Y([
      K('Alçı sıva', 21, 1000, 'finish'), K('Çimento esaslı sıva', 20, 1800, 'finish'),
      K('G2 gazbeton', 200, 400), K('Çimento esaslı sıva', 20, 1800, 'finish'),
    ], 'T', false),
    f3: Y([
      K('Alçı sıva', 21, 1000, 'finish'), K('Çimento esaslı sıva', 20, 1800, 'finish'),
      K('G2 gazbeton', 150, 400), K('Knauf mineral yün IPB 039', 50, 12.4, 'insulation'),
      K('G2 gazbeton', 150, 400), K('Çimento esaslı sıva', 20, 1800, 'finish'),
      K('Alçı sıva', 21, 1000, 'finish'),
    ], 'T', false),
    f4: Y([
      K('Alçı sıva', 21, 1000, 'finish'), K('Çimento esaslı sıva', 20, 1800, 'finish'),
      K('G2 gazbeton', 150, 400), K('Çimento esaslı sıva', 20, 1800, 'finish'),
      K('Alçı sıva', 21, 1000, 'finish'),
    ], 'T', false),
  },
};

/** v3 dosyasını hesaplayıp tek ayırıcı elemanın sonucunu döndürür. */
function coz(v3) {
  return projeyiHesapla(v3ProjeyiDonustur(v3)).ayiricilar[0];
}

/** Yan elemanları ada göre indeksler (dizin sırası eşleşmeye bağlıdır). */
function yanAdaGore(a) {
  return Object.fromEntries(a.yanElemanlar.map((y) => [y.ad, y]));
}

/** Bir yolun raporda göründüğü R değerini bulur. */
function yol(a, ad) {
  return a.sonuc.yollar.find((y) => y.ad === ad);
}

const yaklasik = (a, b, tolerans = 0.05) =>
  assert.ok(Math.abs(a - b) <= tolerans, `${a} ≉ ${b} (tolerans ${tolerans})`);

/* ── ID1 ────────────────────────────────────────────────────────────── */

test('ID1: geometri ve ayırıcı eleman referans raporla eşleşir', () => {
  const a = coz(ID1);
  yaklasik(a.geo.S, 16.03, 0.01);
  yaklasik(a.geo.V, 48.58, 0.01);
  yaklasik(a.ana.mAlan, 233.4, 0.05);
  yaklasik(a.ana.Rw, 46.8, 0.05);
});

test('ID1: yan elemanların m′ ve Rw değerleri referans raporla eşleşir', () => {
  const y = yanAdaGore(coz(ID1));
  const beklenen = {
    'Ön yan eleman': [205.2, 44.7],
    'Tavan': [472.7, 58.3],
    'Arka yan eleman': [210.4, 45.1],
    'Döşeme': [604.4, 62.3],
  };
  for (const [ad, [m, rw]] of Object.entries(beklenen)) {
    assert.ok(y[ad], `${ad} yan elemanı bulunamadı`);
    yaklasik(y[ad].mKaynak, m, 0.05);
    yaklasik(y[ad].RwKaynak, rw, 0.05);
  }
});

test("ID1: R'w ve DnT,w referans raporla eşleşir", () => {
  const a = coz(ID1);
  yaklasik(a.sonuc.RwAksan, 46.2, 0.05);
  yaklasik(a.sonuc.DnTw, 44.1, 0.05);
});

test('ID1: ses iletim yolları referans raporla eşleşir', () => {
  const a = coz(ID1);
  const beklenen = {
    'Dd — doğrudan yol': 46.8,
    'Ff — Ön yan eleman': 63.3,
    'Fd — Ön yan eleman': 63.6,
    'Ff — Arka yan eleman': 63.7,
    'Fd — Arka yan eleman': 63.9,
    'Df — Ön yan eleman': 65.1,
    'Df — Arka yan eleman': 65.2,
    'Df — Tavan': 65.7,
  };
  for (const [ad, R] of Object.entries(beklenen)) {
    const y = yol(a, ad);
    assert.ok(y, `${ad} yolu bulunamadı`);
    yaklasik(y.R, R, 0.05);
  }
  // Doğrudan yol baskın: referans raporda enerji payı %87,7.
  yaklasik(yol(a, 'Dd — doğrudan yol').payYuzde, 87.7, 0.15);
});

/* ── DOS1 ───────────────────────────────────────────────────────────── */

test('DOS1: döşeme ayırıcının geometrisi referans raporla eşleşir', () => {
  const a = coz(DOS1);
  yaklasik(a.geo.S, 18.94, 0.01);   // min(L) × min(W)
  yaklasik(a.geo.V, 81.37, 0.01);   // alıcı (oda 2) hacmi
  yaklasik(a.geo.V1, 52.67, 0.01);  // kaynak (oda 1) hacmi
  yaklasik(a.ana.mAlan, 601.4, 0.05);
  yaklasik(a.ana.Rw, 62.2, 0.05);
});

test('DOS1: yan elemanların m′ ve Rw değerleri referans raporla eşleşir', () => {
  const y = yanAdaGore(coz(DOS1));
  const beklenen = {
    'Ön yan duvar': [245.4, 47.6],
    'Sol yan duvar': [173.0, 43.1],
    'Arka yan duvar': [234.6, 46.9],
    'Sağ yan duvar': [174.0, 43.1],
  };
  for (const [ad, [m, rw]] of Object.entries(beklenen)) {
    assert.ok(y[ad], `${ad} yan elemanı bulunamadı`);
    yaklasik(y[ad].mKaynak, m, 0.05);
    yaklasik(y[ad].RwKaynak, rw, 0.05);
  }
});

test("DOS1: R'w ve DnT,w referans raporla eşleşir", () => {
  const a = coz(DOS1);
  yaklasik(a.sonuc.RwAksan, 49.9, 0.05);
  yaklasik(a.sonuc.DnTw, 49.3, 0.05);
});

test('DOS1: yan yolların birleşim uzunluğu eşleşmesi doğrudur', () => {
  // Döşeme ayırıcıda Ön/Arka yüzeyler döşemenin uzun kenarı (min L = 6,25 m),
  // Sol/Sağ yüzeyler kısa kenarı (min W = 3,03 m) boyunca birleşir. Ters
  // eşleşme bu yolları ±3,15 dB kaydırırdı.
  const a = coz(DOS1);
  const beklenen = {
    'Ff — Sol yan duvar': 56.8,
    'Ff — Sağ yan duvar': 56.8,
    'Ff — Arka yan duvar': 57.4,
    'Fd — Arka yan duvar': 60.3,
    'Fd — Sol yan duvar': 60.6,
    'Fd — Sağ yan duvar': 60.6,
    'Dd — doğrudan yol': 62.2,
    'Ff — Ön yan duvar': 63.1,
  };
  for (const [ad, R] of Object.entries(beklenen)) {
    const y = yol(a, ad);
    assert.ok(y, `${ad} yolu bulunamadı`);
    yaklasik(y.R, R, 0.05);
  }
});

/* ── Çalışma prensibinin kendisi ────────────────────────────────────── */

test('DnT,w dönüşümü: R′w + 10·lg(0,32·V/S) − emniyet payı', () => {
  // Referans araçla aynı bağıntı; alıcı mekân hacmi ve 2 dB emniyet payı ile.
  for (const v3 of [ID1, DOS1]) {
    const a = coz(v3);
    const beklenen = a.sonuc.RwAksan
      + 10 * Math.log10((0.32 * a.geo.V) / a.geo.S)
      - v3.safetyMargin;
    yaklasik(a.sonuc.DnTw, beklenen, 0.05);
  }
});

test('Kütle kanunu: kavite katmanı bonus üretmez (saf toplam kütle)', () => {
  // DOS1'in F1 yüzeyi 50 mm mineral yün içerir; referans araç bunu iki
  // kabuğa ayırmaz, Rw yalnızca toplam alan kütlesinden gelir.
  const y = yanAdaGore(coz(DOS1))['Ön yan duvar'];
  yaklasik(y.mKaynak, 245.4, 0.05);
  yaklasik(y.RwKaynak, 37.5 * Math.log10(245.4) - 42, 0.05);
});
