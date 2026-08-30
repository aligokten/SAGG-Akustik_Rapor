/**
 * yonetmelik-resmi.test.js — Yönetmelik tablolarının resmî ek dosyasındaki
 * (7.5.23616-Ek.docx) değerlerle birebir örtüştüğünü sabitler.
 *
 * Buradaki sayılar resmî tablolardan alınmıştır; bir hesap değişikliği
 * bunları sessizce kaydırırsa test düşer.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EK2_TABLO_2_1, EK3_TABLO_3_1, EK3_TABLO_3_2, EK3_TABLO_3_3,
  EK3_TABLO_3_4, EK3_TABLO_3_5, EK4_TABLO_4_1, EK6_TABLO_6_1,
  MEKAN_KIMLIK_GOCU, mekanKimligiGuncelle, SINIFLAR,
} from '../js/veri/yonetmelik.js';
import {
  cepheSatiri, cepheDegerlendir, havaDogusluDegerlendir, darbeSesiDegerlendir,
} from '../js/cekirdek/degerlendirme.js';

/* ── EK-2 Tablo 2.1 ──────────────────────────────────────────────── */

test('Tablo 2.1 resmî mekân sayısını ve derecelerini taşır', () => {
  assert.equal(EK2_TABLO_2_1.mekanlar.length, 65);
  const bul = (id) => EK2_TABLO_2_1.mekanlar.find((m) => m.id === id);

  // Konutlar — resmî tabloda hepsi OG kaynak; hassasiyet I / II / III
  assert.deepEqual(
    ['gurultululuk', 'hassasiyet'].map((k) => bul('konut-yatak-odalari')[k]),
    ['orta', 'cok']);                                    // OG / I
  assert.deepEqual(
    ['gurultululuk', 'hassasiyet'].map((k) => bul('konut-yasam-alanlari')[k]),
    ['orta', 'orta']);                                   // OG / II
  assert.deepEqual(
    ['gurultululuk', 'hassasiyet'].map((k) => bul('konut-teknik-merkezler')[k]),
    ['cok', 'az']);                                      // YG / III
  // Eğitim — okuma odaları DG / I
  assert.deepEqual(
    ['gurultululuk', 'hassasiyet'].map((k) => bul('egitim-okuma-odalari')[k]),
    ['az', 'cok']);
});

test('Her mekânın derecesi geçerli bir koddur', () => {
  for (const m of EK2_TABLO_2_1.mekanlar) {
    assert.ok(['cok', 'orta', 'az'].includes(m.gurultululuk), `${m.id} gürültülülük`);
    assert.ok(['cok', 'orta', 'az'].includes(m.hassasiyet), `${m.id} hassasiyet`);
    assert.ok(m.ad && m.binaTuru, `${m.id} eksik alan`);
  }
});

test('Eski mekân kimlikleri geçerli yeni kimliklere göç eder', () => {
  const idler = new Set(EK2_TABLO_2_1.mekanlar.map((m) => m.id));
  for (const [eski, yeni] of Object.entries(MEKAN_KIMLIK_GOCU)) {
    assert.ok(idler.has(yeni), `${eski} → ${yeni} hedefi yok`);
    assert.equal(mekanKimligiGuncelle(eski), yeni);
  }
  // Bilinmeyen kimlik olduğu gibi kalır
  assert.equal(mekanKimligiGuncelle('bilinmeyen-mekan'), 'bilinmeyen-mekan');
});

/* ── EK-3 Tablo 3.1 — cephe (Lgag'dan indirim) ───────────────────── */

test('Tablo 3.1 indirimleri resmî değerlerdir', () => {
  assert.deepEqual(EK3_TABLO_3_1.indirim.cok,  { A: 14, B: 18, C: 22, D: 26, E: 30, F: 34 });
  assert.deepEqual(EK3_TABLO_3_1.indirim.orta, { A: 17, B: 21, C: 25, D: 29, E: 33, F: 37 });
  assert.deepEqual(EK3_TABLO_3_1.indirim.az,   { A: 20, B: 24, C: 28, D: 32, E: 36, F: 40 });
  assert.equal(EK3_TABLO_3_1.gosterge, 'DnT,A,tr');
});

test('Cephe gereksinimi Lgag ile birlikte kayar', () => {
  // I. derece, C sınıfı: Lgag − 22
  const d1 = cepheDegerlendir({ mekanId: 'konut-yatak-odalari', disGurultu: 65, DnTAtr: 50, hedefSinif: 'C' });
  assert.equal(d1.gereken, 65 - 22);
  const d2 = cepheDegerlendir({ mekanId: 'konut-yatak-odalari', disGurultu: 75, DnTAtr: 50, hedefSinif: 'C' });
  assert.equal(d2.gereken, 75 - 22);
  assert.equal(d2.gereken - d1.gereken, 10);
});

test('cepheSatiri sınıflar arasında monotondur', () => {
  const s = cepheSatiri(70, 'orta');
  for (let i = 1; i < SINIFLAR.length; i++) {
    assert.ok(s[SINIFLAR[i - 1]] > s[SINIFLAR[i]], `${SINIFLAR[i - 1]} > ${SINIFLAR[i]}`);
  }
});

/* ── EK-3 Tablo 3.2 — hava doğuşlu ───────────────────────────────── */

test('Tablo 3.2 resmî değerleri taşır', () => {
  assert.deepEqual(EK3_TABLO_3_2.degerler['cok-cok'],   { A: 68, B: 64, C: 58, D: 54, E: 50, F: 46 });
  assert.deepEqual(EK3_TABLO_3_2.degerler['orta-orta'], { A: 59, B: 55, C: 49, D: 45, E: 41, F: 37 });
  assert.deepEqual(EK3_TABLO_3_2.degerler['az-az'],     { A: 50, B: 46, C: 40, D: 36, E: 32, F: 28 });
  assert.equal(EK3_TABLO_3_2.gosterge, 'DnT,A');
});

test('Tablo 3.2 adımları tekdüze değildir (B→C 6 dB)', () => {
  const r = EK3_TABLO_3_2.degerler['cok-cok'];
  assert.equal(r.A - r.B, 4);
  assert.equal(r.B - r.C, 6);   // resmî tablodaki sıçrama
  assert.equal(r.C - r.D, 4);
});

test('Hava doğuşlu değerlendirme resmî satırı kullanır', () => {
  // OG kaynak (yaşam alanı) → I hassasiyet (yatak odası), C sınıfı = 52
  const d = havaDogusluDegerlendir({
    kaynakMekanId: 'konut-yasam-alanlari', aliciMekanId: 'konut-yatak-odalari',
    DnTw: 52, hedefSinif: 'C',
  });
  assert.equal(d.anahtar, 'orta-cok');
  assert.equal(d.gereken, 52);
  assert.equal(d.uygun, true);
});

/* ── EK-3 Tablo 3.3 — darbe ──────────────────────────────────────── */

test('Tablo 3.3 yalnızca kaynak gürültülülüğüne bağlıdır', () => {
  assert.deepEqual(Object.keys(EK3_TABLO_3_3.degerler), ['cok', 'orta', 'az']);
  assert.deepEqual(EK3_TABLO_3_3.degerler.cok,  { A: 40, B: 44, C: 48, D: 52, E: 56, F: 60 });
  assert.deepEqual(EK3_TABLO_3_3.degerler.orta, { A: 46, B: 50, C: 54, D: 58, E: 62, F: 66 });
  assert.deepEqual(EK3_TABLO_3_3.degerler.az,   { A: 50, B: 54, C: 58, D: 62, E: 66, F: 70 });
});

test('Darbe gereksinimi alıcının hassasiyetinden etkilenmez', () => {
  const ortak = { ustMekanId: 'konut-yasam-alanlari', LnTw: 55, hedefSinif: 'C' };
  const a = darbeSesiDegerlendir({ ...ortak, altMekanId: 'konut-yatak-odalari' });        // I
  const b = darbeSesiDegerlendir({ ...ortak, altMekanId: 'konut-mutfaklar-banyo' });      // III
  assert.equal(a.gereken, b.gereken);
  assert.equal(a.gereken, 54);   // OG kaynak, C sınıfı
});

/* ── EK-3 Tablo 3.4 / 3.5 — bina tipine göre ─────────────────────── */

test('Tablo 3.4 ve 3.5 konut içi satırlarını taşır', () => {
  const ici = EK3_TABLO_3_4.satirlar.find((r) => r.id === 'konut-ici');
  assert.deepEqual([ici.A, ici.C, ici.F], [54, 44, 32]);
  const ici5 = EK3_TABLO_3_5.satirlar.find((r) => r.id === 'konut-ici');
  assert.deepEqual([ici5.A, ici5.C, ici5.F], [54, 62, 74]);
});

test('Tablo 3.4/3.5 satırlarının tümü altı sınıf değeri taşır', () => {
  for (const t of [EK3_TABLO_3_4, EK3_TABLO_3_5]) {
    for (const r of t.satirlar) {
      for (const s of SINIFLAR) assert.ok(Number.isFinite(r[s]), `${t.kaynak} ${r.id} ${s}`);
    }
  }
});

/* ── EK-4 Tablo 4.1 ve EK-6 Tablo 6.1 ────────────────────────────── */

test('Tablo 4.1 resmî değerleri taşır ve 4 dB adımlıdır', () => {
  assert.deepEqual(
    ['A', 'B', 'C', 'D', 'E', 'F'].map((s) => EK4_TABLO_4_1.degerler['konut-yatak-odalari'][s]),
    [26, 30, 34, 38, 42, 46]);
  assert.equal(EK4_TABLO_4_1.degerler['konut-yatak-odalari'].zaman, 'Gece');
});

test('Tablo 6.1 resmî reverberasyon sınırlarını taşır', () => {
  const bul = (id) => EK6_TABLO_6_1.mekanlar.find((m) => m.id === id);
  assert.equal(bul('konut-yatak-odalari').Tmax, 0.5);
  assert.equal(bul('konut-yasam-alanlari').Tmax, 0.8);
  assert.equal(bul('konut-sirkulasyon-alanlari').Tmax, 1.2);
  assert.equal(EK6_TABLO_6_1.sinifBandi, 'C-D');
  // Değer verilmeyen mekânlar (özel akustik tasarım) null taşır
  assert.ok(EK6_TABLO_6_1.mekanlar.some((m) => m.Tmax === null));
});
