/**
 * performans-belgesi.test.js — EK-10 Akustik Performans Belgesi.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { OLCUTLER, enDusukSinif, olcutOzeti, belgeVerisi } from '../js/cekirdek/performans-belgesi.js';
import { ciz } from '../js/arayuz/sekme-rapor.js';
import { ornekProje, bosProje } from '../js/durum.js';
import { projeyiHesapla } from '../js/hesap.js';

/* ── Sınıf birleştirme kuralı (EK-10 §10.1/9) ────────────────────── */

test('İki sınıftan performansı düşük olan seçilir', () => {
  assert.equal(enDusukSinif('A', 'C'), 'C');
  assert.equal(enDusukSinif('F', 'A'), 'F');
  assert.equal(enDusukSinif('C', 'C'), 'C');
  // Eksik sınıf, var olanı bozmaz
  assert.equal(enDusukSinif(null, 'B'), 'B');
  assert.equal(enDusukSinif('B', null), 'B');
  assert.equal(enDusukSinif(null, null), null);
});

test('Ölçüt özeti en kötü sınıfı ve değer aralığını verir', () => {
  const o = olcutOzeti([
    { hesaplanan: 52, eldeEdilenSinif: 'B' },
    { hesaplanan: 47, eldeEdilenSinif: 'D' },
    { hesaplanan: 61, eldeEdilenSinif: 'A' },
  ]);
  assert.equal(o.sinif, 'D');          // en alt sınıf belirleyicidir
  assert.equal(o.toplam, 3);
  assert.equal(o.enDusuk, 47);
  assert.equal(o.enYuksek, 61);
});

test('Boş ölçüt "belirlenemedi" (sinif null) döner', () => {
  const o = olcutOzeti([]);
  assert.equal(o.sinif, null);
  assert.equal(o.toplam, 0);
  assert.equal(o.enDusuk, null);
});

test('Ölçüt özeti null kayıtları eler, çökmez', () => {
  const o = olcutOzeti([null, undefined, { hesaplanan: 50, eldeEdilenSinif: 'C' }]);
  assert.equal(o.toplam, 1);
  assert.equal(o.sinif, 'C');
});

/* ── Belge verisi ────────────────────────────────────────────────── */

test('Belge altı resmî ölçütü sırasıyla taşır', () => {
  assert.equal(OLCUTLER.length, 6);
  assert.deepEqual(OLCUTLER.map((o) => o.no), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(OLCUTLER.map((o) => o.id),
    ['icGurultu', 'cephe', 'hava', 'darbe', 'tesisat', 'reverb']);
});

test('Örnek projede belge sınıfı en kötü ölçüte eşittir', () => {
  const durum = ornekProje();
  const b = belgeVerisi(projeyiHesapla(durum));
  const siniflar = b.satirlar.map((r) => r.sinif).filter(Boolean);
  assert.ok(siniflar.length > 0);
  assert.equal(b.toplamSinif, siniflar.reduce(enDusukSinif, null));
});

test('Hesaplanmayan ölçütler "belirlenemedi" olarak listelenir', () => {
  const durum = ornekProje();
  const b = belgeVerisi(projeyiHesapla(durum));
  // İç gürültü ve tesisat gürültüsü ölçüme dayanır, bu araçta hesaplanmaz.
  assert.ok(b.belirlenemeyen.includes('İç gürültü düzeyleri'));
  assert.ok(b.belirlenemeyen.includes('Tesisat gürültüsü'));
});

test('Boş projede belge çöker değil, sınıfsız döner', () => {
  const b = belgeVerisi(projeyiHesapla(bosProje()));
  assert.equal(b.toplamSinif, null);
  assert.equal(b.satirlar.length, 6);
  assert.equal(b.belirlenemeyen.length, 6);
});

/* ── Raporda görünüm ─────────────────────────────────────────────── */

test('Belge raporun sonunda tek sayfa olarak yer alır', () => {
  const durum = ornekProje();
  const html = ciz(durum, projeyiHesapla(durum));
  assert.equal(html.split('AKUSTİK PERFORMANS BELGESİ').length - 1, 1);
  assert.ok(html.includes('belge-tablo'));
  assert.ok(html.includes('Bina Akustik'));
  // Resmî belgedeki altı ölçüt başlığı
  for (const o of OLCUTLER) assert.ok(html.includes(o.ad), `eksik ölçüt: ${o.ad}`);
  // Sınıf tanımları
  assert.ok(html.includes('Gürültüye karşı korumasız bir ortam'));
});

test('Belge tablosunun sütun sayısı başlıkla uyumludur', () => {
  const durum = ornekProje();
  const html = ciz(durum, projeyiHesapla(durum));
  const tablo = html.slice(html.indexOf('belge-tablo'), html.indexOf('</table>', html.indexOf('belge-tablo')));

  // Dikey başlık gövdededir: rowspan thead/tbody sınırını aşamaz.
  assert.ok(tablo.includes('<th class="belge-dikey" rowspan="7">'));
  assert.ok(tablo.includes('belge-dikey-bos'));
  // 1 başlık + 6 ölçüt + 1 toplam satırı ("<tr class=...>" da sayılmalı)
  assert.equal(tablo.split('<tr').length - 1, 8);
});

test('Belgenin son geçerlilik tarihi 10 yıl sonrasıdır (EK-10 §10.1/1)', () => {
  const durum = ornekProje();
  durum.proje.tarih = '2024-03-15';
  const html = ciz(durum, projeyiHesapla(durum));
  assert.ok(html.includes('2034-03-15'));
});
