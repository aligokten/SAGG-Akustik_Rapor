/**
 * rapor-excel.test.js — Raporun "Excel'e aktar" çıktısı: DD/İD/DOS
 * kodlaması, sayfa yerleşimi ve üretilen .xlsx paketinin geçerliliği.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { excelKayitlariniTopla, sayfa1Uret, sayfa2Uret } from '../js/arayuz/sekme-rapor.js';
import { xlsxOlustur } from '../js/arayuz/xlsx-yazici.js';
import { ornekProje } from '../js/durum.js';
import { projeyiHesapla } from '../js/hesap.js';

test('Ayırıcı duvarlar İD, taban ayırıcılar DOS, cepheler DD olarak kodlanır', () => {
  const durum = ornekProje();
  durum.ayiricilar.push({
    ...durum.ayiricilar[0],
    ad: 'Taban ayırıcı',
    geometri: { ...durum.ayiricilar[0].geometri, yon: 'taban' },
  });
  const s = projeyiHesapla(durum);
  const k = excelKayitlariniTopla(s);

  assert.equal(k.dd.length, s.cepheler.length);
  assert.equal(k.id.length + k.dos.length, s.ayiricilar.length);
  assert.ok(k.dd.every((x, i) => x.kod === `DD${i + 1}`));
  assert.ok(k.id.every((x, i) => x.kod === `İD${i + 1}`));
  assert.ok(k.dos.every((x, i) => x.kod === `DOS${i + 1}`));
  assert.ok(k.dos.length >= 1, 'taban ayırıcısı DOS listesine düşmeli');
  assert.equal(k.dd[0].kaynak, 'Çevresel Gürültü');
});

test('excelKayitlariniTopla değerleri hesap sonucundan alır (DnTw / DnTAtr)', () => {
  const durum = ornekProje();
  const s = projeyiHesapla(durum);
  const k = excelKayitlariniTopla(s);
  assert.equal(k.id[0].deger, s.ayiricilar[0].sonuc.DnTw);
  assert.equal(k.dd[0]?.deger, s.cepheler[0]?.sonuc.DnTAtr);
});

test('Sayfa 1: kategori hücresi yalnızca ilk satırda dolu, diğerleri boş kalır ve birleştirilir', () => {
  const kayitlar = {
    dd: [],
    id: [
      { kod: 'İD1', kaynak: 'A', alici: 'B', deger: 50, gereken: 44 },
      { kod: 'İD2', kaynak: 'C', alici: 'D', deger: 51, gereken: 44 },
    ],
    dos: [],
  };
  const sayfa = sayfa1Uret(kayitlar);
  assert.equal(sayfa.satirlar.length, 3); // başlık + 2 veri satırı
  assert.equal(sayfa.satirlar[1][0].deger, 'İÇ DUVAR İD');
  assert.equal(sayfa.satirlar[2][0].deger, '');
  assert.ok(sayfa.birlestirmeler.includes('A2:A3'));
});

test('Sayfa 1: tek kayıtlı kategori birleştirme üretmez', () => {
  const kayitlar = { dd: [{ kod: 'DD1', kaynak: 'X', alici: 'Y', deger: 40, gereken: 33 }], id: [], dos: [] };
  const sayfa = sayfa1Uret(kayitlar);
  assert.ok(!sayfa.birlestirmeler.some((m) => m.startsWith('A2:')));
});

test('Sayfa 2: sınır değer sağa yaslı biçimde "≥N" olarak yazılır', () => {
  const kayitlar = { dd: [{ kod: 'DD1', kaynak: 'Çevresel Gürültü', alici: 'Salon', deger: 44, gereken: 33 }], id: [], dos: [] };
  const sayfa = sayfa2Uret(kayitlar);
  const veriSatiri = sayfa.satirlar.find((s) => s[1]?.deger === 'DD1');
  assert.equal(veriSatiri[4].deger, '≥33');
});

test('Sayfa 2: yalnızca ilk kategori satırı "Sınır Değer"/"Sağlanan Değer" alt başlıklarını taşır', () => {
  const kayitlar = {
    dd: [{ kod: 'DD1', kaynak: 'Çevresel Gürültü', alici: 'Salon', deger: 44, gereken: 33 }],
    id: [{ kod: 'İD1', kaynak: 'A', alici: 'B', deger: 50, gereken: 44 }],
    dos: [],
  };
  const sayfa = sayfa2Uret(kayitlar);
  const ddKategori = sayfa.satirlar.find((s) => s[0]?.deger === 'Dış Yapı Elemanları');
  const idKategori = sayfa.satirlar.find((s) => s[0]?.deger === 'İç Yapı Elemanları');
  assert.equal(ddKategori[4].deger, 'Sınır Değer');
  assert.equal(ddKategori[6].deger, 'Sağlanan Değer');
  assert.equal(idKategori[4].deger, '');
});

test('Boş kategoriler sayfa yerleşiminden tamamen düşer', () => {
  const kayitlar = { dd: [], id: [{ kod: 'İD1', kaynak: 'A', alici: 'B', deger: 50, gereken: 44 }], dos: [] };
  const sayfa1 = sayfa1Uret(kayitlar);
  const sayfa2 = sayfa2Uret(kayitlar);
  assert.ok(!sayfa1.satirlar.some((s) => s[0]?.deger?.includes?.('DIŞ DUVAR')));
  assert.ok(!sayfa2.satirlar.some((s) => s[0]?.deger === 'Dış Yapı Elemanları'));
});

/* ── xlsx-yazici.js — üretilen paketin ZIP/OOXML geçerliliği ────────── */

test('xlsxOlustur geçerli bir ZIP (PK) imzasıyla başlayan bir Blob üretir', async () => {
  const blob = xlsxOlustur([{ ad: 'Sayfa1', satirlar: [[{ deger: 'Merhaba' }]] }]);
  assert.ok(blob instanceof Blob);
  const buf = new Uint8Array(await blob.arrayBuffer());
  assert.equal(buf[0], 0x50); // 'P'
  assert.equal(buf[1], 0x4b); // 'K'
});

test('xlsxOlustur, 31 karakteri aşan sayfa adlarında bile geçerli bir paket üretir', async () => {
  const uzunAd = 'A'.repeat(40);
  const blob = xlsxOlustur([{ ad: uzunAd, satirlar: [[{ deger: 'x' }]] }]);
  const buf = new Uint8Array(await blob.arrayBuffer());
  assert.equal(buf[0], 0x50);
});
