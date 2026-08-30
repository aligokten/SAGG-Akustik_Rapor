/**
 * komsuluk.test.js — EK-3 Tablo 3.4 / 3.5 (komşuluk ilişkisine göre
 * gereksinim) ve cephede Lgag varsayılanı.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EK3_TABLO_3_4, EK3_TABLO_3_5, komsulukSatirlari, komsulukSatiri,
  varsayilanKomsuluk, BINA_TURLERI,
} from '../js/veri/yonetmelik.js';
import { havaDogusluDegerlendir, darbeSesiDegerlendir, cepheSatiri } from '../js/cekirdek/degerlendirme.js';
import { bosProje, yeniAyirici, yeniDarbe, yeniCephe } from '../js/durum.js';
import { projeyiHesapla } from '../js/hesap.js';

/* ── Cephe: C sınıfı hedefinde Lgag = 58 ─────────────────────────── */

test('Lgag 58 dBA, C sınıfında 36 / 33 / 30 dB gereksinim verir', () => {
  assert.equal(cepheSatiri(58, 'cok').C, 36);    // I
  assert.equal(cepheSatiri(58, 'orta').C, 33);   // II
  assert.equal(cepheSatiri(58, 'az').C, 30);     // III
});

test('Yeni cephe kaydının Lgag varsayılanı 58 dBA', () => {
  assert.equal(yeniCephe().disGurultu, 58);
});

test('Varsayılan cephe, C sınıfında I. derece mekân için 36 dB ister', () => {
  const d = bosProje();
  d.proje.hedefSinif = 'C';
  d.cepheler = [yeniCephe()];
  const c = projeyiHesapla(d).cepheler[0].degerlendirme;
  assert.equal(c.mekan.hassasiyet, 'cok');       // yatak odası = I
  assert.equal(c.disGurultu, 58);
  assert.equal(c.gereken, 36);
});

/* ── Tablo 3.4 — odalar arası ────────────────────────────────────── */

test('Komşuluk seçiliyse gereksinim Tablo 3.4\'ten okunur', () => {
  const ortak = {
    kaynakMekanId: 'konut-yasam-alanlari', aliciMekanId: 'konut-yatak-odalari',
    DnTw: 55, hedefSinif: 'C',
  };
  const t32 = havaDogusluDegerlendir(ortak);
  assert.equal(t32.tabloAdi, 'EK-3 Tablo 3.2');
  assert.equal(t32.komsuluk, null);
  assert.equal(t32.gereken, 52);                  // OG / I

  const t34 = havaDogusluDegerlendir({ ...ortak, komsulukId: 'konut-ici' });
  assert.equal(t34.tabloAdi, 'EK-3 Tablo 3.4');
  assert.equal(t34.gereken, 44);                  // bağımsız birim içi
  assert.equal(t34.komsuluk.id, 'konut-ici');
});

test('Konut içi bölme elemanı Tablo 3.4 ile daha düşük hedef alır', () => {
  const ortak = {
    kaynakMekanId: 'konut-yasam-alanlari', aliciMekanId: 'konut-yatak-odalari',
    DnTw: 48, hedefSinif: 'C',
  };
  const birimler = havaDogusluDegerlendir({ ...ortak, komsulukId: 'konut-birim-birim' });
  const ici = havaDogusluDegerlendir({ ...ortak, komsulukId: 'konut-ici' });
  assert.equal(birimler.gereken, 52);
  assert.equal(ici.gereken, 44);
  // 48 dB birimler arası için yetersiz, birim içi için yeterli
  assert.equal(birimler.uygun, false);
  assert.equal(ici.uygun, true);
});

test('Geçersiz komşuluk kimliği Tablo 3.2\'ye düşer, çökmez', () => {
  const d = havaDogusluDegerlendir({
    kaynakMekanId: 'konut-yasam-alanlari', aliciMekanId: 'konut-yatak-odalari',
    DnTw: 55, hedefSinif: 'C', komsulukId: 'boyle-bir-satir-yok',
  });
  assert.equal(d.tabloAdi, 'EK-3 Tablo 3.2');
  assert.equal(d.gereken, 52);
});

/* ── Tablo 3.5 — darbe sesi ──────────────────────────────────────── */

test('Darbe sesinde komşuluk seçiliyse Tablo 3.5 kullanılır', () => {
  const ortak = {
    ustMekanId: 'konut-yasam-alanlari', altMekanId: 'konut-yatak-odalari',
    LnTw: 58, hedefSinif: 'C',
  };
  const t33 = darbeSesiDegerlendir(ortak);
  assert.equal(t33.tabloAdi, 'EK-3 Tablo 3.3');
  assert.equal(t33.gereken, 54);                  // OG kaynak

  const t35 = darbeSesiDegerlendir({ ...ortak, komsulukId: 'konut-ici' });
  assert.equal(t35.tabloAdi, 'EK-3 Tablo 3.5');
  assert.equal(t35.gereken, 62);                  // bağımsız birim içi döşeme
  assert.equal(t35.uygun, true);                  // 58 ≤ 62
});

test('Darbe sesinde manuel hedef artık gerçekten geçerli oluyor', () => {
  const d = bosProje();
  d.darbeler = [yeniDarbe()];
  d.darbeler[0].manuelHedef = 45;
  const k = projeyiHesapla(d).darbeler[0].degerlendirme;
  assert.equal(k.hedefKaynagi, 'manuel');
  assert.equal(k.gereken, 45);
});

/* ── Varsayılanlar ───────────────────────────────────────────────── */

test('Yeni kayıtlar komşuluk tablolarını varsayılan olarak kullanır', () => {
  assert.equal(yeniAyirici().komsulukId, 'konut-birim-birim');
  assert.equal(yeniDarbe().komsulukId, 'konut-birim');

  const d = bosProje();
  d.proje.hedefSinif = 'C';
  d.ayiricilar = [yeniAyirici()];
  d.darbeler = [yeniDarbe()];
  const s = projeyiHesapla(d);
  assert.equal(s.ayiricilar[0].degerlendirme.tabloAdi, 'EK-3 Tablo 3.4');
  assert.equal(s.ayiricilar[0].degerlendirme.gereken, 52);
  assert.equal(s.darbeler[0].degerlendirme.tabloAdi, 'EK-3 Tablo 3.5');
  assert.equal(s.darbeler[0].degerlendirme.gereken, 54);
});

test('Her varsayılan komşuluk kimliği ilgili tabloda gerçekten vardır', () => {
  for (const [tur, tablo] of [['hava', EK3_TABLO_3_4], ['darbe', EK3_TABLO_3_5]]) {
    for (const binaTuru of Object.keys(BINA_TURLERI)) {
      const id = varsayilanKomsuluk(tur, binaTuru);
      if (!id) continue;                          // tablo bu işlevi kapsamıyor
      assert.ok(komsulukSatiri(tablo, id), `${tur}/${binaTuru} → ${id} yok`);
    }
  }
});

test('Tablo 3.4/3.5 kapsamadığı bina işlevleri için satır döndürmez', () => {
  // Kültürel, ticari, terminal, dini, spor, sanayi resmî tablolarda yok
  for (const b of ['kulterel', 'ticari', 'terminal', 'dini', 'spor', 'sanayi']) {
    assert.equal(komsulukSatirlari(EK3_TABLO_3_4, b).length, 0, b);
    assert.equal(komsulukSatirlari(EK3_TABLO_3_5, b).length, 0, b);
    assert.equal(varsayilanKomsuluk('hava', b), null, b);
  }
  // Kapsananlarda satır var
  assert.ok(komsulukSatirlari(EK3_TABLO_3_4, 'konut').length >= 3);
  assert.ok(komsulukSatirlari(EK3_TABLO_3_5, 'konut').length >= 3);
});
