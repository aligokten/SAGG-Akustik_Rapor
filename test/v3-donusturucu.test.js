/**
 * v3-donusturucu.test.js — "Katmanlı Model v3" JSON içe aktarma testleri.
 * Referans değerler yüklenen SAGG_Akustik_Rapor_DOS1.pdf raporundan alınmıştır.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { v3ProjeyiDonustur, v3SemasiMi } from '../js/veri/v3-donusturucu.js';
import { projeyiHesapla } from '../js/hesap.js';

const yakin = (a, b, tol = 0.05) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b} bekleniyordu (tolerans ${tol})`);

const DOS1 = {
  version: 3, projectName: 'MARINA VISTA BODRUM', projectCode: 'DOS1', parcel: '',
  employer: 'MARLIN OTEL', architect: 'SAGG İnşaat Mimarlık Akustik', author: 'ALİ GÖKTEN',
  date: '2026-08-27', buildingType: 'otel', buildingStatus: 'esasliTadilat', targetClass: 'D',
  sourceRoomUseId: 'konaklama-yatak-odalari', receiverRoomUseId: 'konaklama-yatak-odalari', rwModel: 'en12354',
  referenceT0: 0.5, projectNotes: '',
  room1: { name: 'TİP 2 YATAK ODASI', length: 6.25, width: 3.18, height: 2.65 },
  room2: { name: 'TİP 1 YATAK ODASI', length: 10.25, width: 3.03, height: 2.62 },
  separatorFace: 'floor', targetDnTw: 44, safetyMargin: 2, activeSurface: 'separator',
  surfaces: {
    separator: {
      layers: [
        { name: 'Seramik kaplama', density: 2200, defaultMm: 20, role: 'finish' },
        { name: 'Tesviye şapı', density: 2000, defaultMm: 70, role: 'mass' },
        { name: 'Akustik şilte', density: 75, defaultMm: 5, role: 'resilient' },
        { name: 'Betonarme', density: 2400, defaultMm: 150, role: 'mass' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
        { name: 'Alçı sıva', density: 1000, defaultMm: 21, role: 'finish' },
      ],
      declaredRw: null, declaredDeltaLw: 19, jointType: 'T', elastic: false,
    },
    f1: {
      layers: [
        { name: 'Alçı sıva', density: 1200, defaultMm: 22, role: 'finish' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
        { name: 'G2 gazbeton', density: 400, defaultMm: 150, role: 'mass' },
        { name: 'Knauf mineral yün IPB 039', density: 12.4, defaultMm: 50, role: 'insulation' },
        { name: 'G2 gazbeton', density: 400, defaultMm: 150, role: 'mass' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
        { name: 'Alçı sıva', density: 1200, defaultMm: 22, role: 'finish' },
      ],
      declaredRw: null, declaredDeltaLw: null, jointType: 'T', elastic: true,
    },
    f2: {
      layers: [
        { name: 'Alçı sıva', density: 1000, defaultMm: 21, role: 'finish' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
        { name: 'G2 gazbeton', density: 400, defaultMm: 200, role: 'mass' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
      ],
      declaredRw: null, declaredDeltaLw: null, jointType: 'T', elastic: false,
    },
    f3: {
      layers: [
        { name: 'Alçı sıva', density: 1000, defaultMm: 21, role: 'finish' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
        { name: 'G2 gazbeton', density: 400, defaultMm: 150, role: 'mass' },
        { name: 'Knauf mineral yün IPB 039', density: 12.4, defaultMm: 50, role: 'insulation' },
        { name: 'G2 gazbeton', density: 400, defaultMm: 150, role: 'mass' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
        { name: 'Alçı sıva', density: 1000, defaultMm: 21, role: 'finish' },
      ],
      declaredRw: null, declaredDeltaLw: null, jointType: 'T', elastic: false,
    },
    f4: {
      layers: [
        { name: 'Alçı sıva', density: 1000, defaultMm: 21, role: 'finish' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
        { name: 'G2 gazbeton', density: 400, defaultMm: 150, role: 'mass' },
        { name: 'Çimento esaslı sıva', density: 1800, defaultMm: 20, role: 'finish' },
        { name: 'Alçı sıva', density: 1000, defaultMm: 21, role: 'finish' },
      ],
      declaredRw: null, declaredDeltaLw: null, jointType: 'T', elastic: false,
    },
  },
};

test('v3SemasiMi doğru dosyaları tanır', () => {
  assert.equal(v3SemasiMi(DOS1), true);
  assert.equal(v3SemasiMi({ proje: {} }), false);
  assert.equal(v3SemasiMi(null), false);
  assert.equal(v3SemasiMi({ version: 3 }), false); // surfaces yok
});

test('Proje künyesi alanları doğru eşlenir', () => {
  const p = v3ProjeyiDonustur(DOS1);
  assert.equal(p.proje.ad, 'MARINA VISTA BODRUM');
  assert.equal(p.proje.kod, 'DOS1');
  assert.equal(p.proje.isveren, 'MARLIN OTEL');
  assert.equal(p.proje.muellif, 'SAGG İnşaat Mimarlık Akustik');
  assert.equal(p.proje.akustikUzman, 'ALİ GÖKTEN');
  assert.equal(p.proje.binaTuru, 'otel');
  assert.equal(p.proje.durum, 'esasliTadilat');
  assert.equal(p.proje.hedefSinif, 'D');
  assert.equal(p.proje.emniyetPayi, 2);
});

test('Oda geometrisi ve yön (taban) doğru aktarılır', () => {
  const p = v3ProjeyiDonustur(DOS1);
  const g = p.ayiricilar[0].geometri;
  assert.equal(g.mod, 'olculer');
  assert.equal(g.yon, 'taban');
  yakin(g.oda1.L, 6.25); yakin(g.oda2.L, 10.25);
});

test('Ana ayırıcı katmanları ve yan eleman katmanları taşınır', () => {
  const p = v3ProjeyiDonustur(DOS1);
  const a = p.ayiricilar[0];
  assert.equal(a.katmanlar.length, 6);
  assert.equal(a.katmanlar[0].tur, 'siva');   // role:'finish' -> siva
  assert.equal(a.katmanlar[1].tur, 'masif');  // role:'mass' -> masif
  assert.equal(a.katmanlar[2].tur, 'masif');  // role:'resilient' -> masif (bağlı, boşluk değil)
  assert.equal(a.yanElemanlar.every((y) => y.katmanlar.length > 0), true);
});

test('S, V ve ana eleman kütlesi referans PDF ile birebir eşleşir', () => {
  const p = v3ProjeyiDonustur(DOS1);
  const s = projeyiHesapla(p);
  const a = s.ayiricilar[0];
  yakin(a.geo.S, 18.94, 0.01);
  yakin(a.geo.V, 81.37, 0.01);
  yakin(a.ana.mAlan, 601.4, 0.1);
});

test('Hesap uçtan uca çökmeden tamamlanır', () => {
  const p = v3ProjeyiDonustur(DOS1);
  const s = projeyiHesapla(p);
  assert.ok(Number.isFinite(s.ayiricilar[0].sonuc.DnTw));
  assert.ok(s.ayiricilar[0].degerlendirme);
});

test('Eksik oda/surfaces alanlarıyla da çökmez (savunmacı varsayılanlar)', () => {
  const kucuk = { version: 3, surfaces: { separator: { layers: [] } } };
  assert.equal(v3SemasiMi(kucuk), false); // room1/room2 yok
  const p = v3ProjeyiDonustur({ ...kucuk, room1: {}, room2: {} });
  assert.ok(p.ayiricilar[0]);
});
