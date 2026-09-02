/**
 * lisans.test.js — Rapor altbilgisindeki lisans / sorumluluk bilgileri.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { LISANS, telifSatiri } from '../js/veri/lisans.js';

test('Lisans künyesi beklenen metinleri taşır', () => {
  assert.equal(LISANS.sahip,
    'Sinem Ali Gökten Grup İnşaat Mimarlık Akustik Müh. San. Tic. Ltd. Şti.');
  assert.equal(LISANS.gelistirici, 'SAGG+ App');
  assert.equal(LISANS.haklar, 'Tüm hakları saklıdır.');
  assert.equal(LISANS.sorumluluk,
    'Rapor içeriğinden ve hesaplamalardan proje müellifi sorumludur.');
});

test('Telif satırı yılı rapor tarihinden alır', () => {
  const s = telifSatiri('2024-03-15');
  assert.match(s, /^© 2024 /);
  assert.ok(s.includes(LISANS.sahip));
  assert.ok(s.endsWith(LISANS.haklar));
});

test('Tarih yoksa veya bozuksa içinde bulunulan yıl kullanılır', () => {
  const buYil = String(new Date().getFullYear());
  for (const t of [undefined, null, '', 'tarih-yok']) {
    assert.match(telifSatiri(t), new RegExp(`^© ${buYil} `), `"${t}" için yıl düşmedi`);
  }
});

/* ── Raporda gerçekten görünüyor mu ───────────────────────────────── */

const { ciz, raporSayfalari } = await import('../js/arayuz/sekme-rapor.js');
const { ornekProje } = await import('../js/durum.js');
const { projeyiHesapla } = await import('../js/hesap.js');

/**
 * Lisans künyesi, HESAP sayfalarının altbilgisinde bulunur.
 *
 * Anlatı sayfalarında (içindekiler, giriş, paftalar, sonuç) basılmaz:
 * hesabı üreten programın kim olduğu ve sorumluluğun kimde olduğu
 * hesapların yanında anlamlıdır; her sayfanın altında yinelenmesi yalnızca
 * yer kaplıyordu.
 */
const HESAP_SAYFALARI = ['ayiricilar', 'darbeler', 'cepheler', 'ozet', 'belge'];
const hesapSayfasiMi = (id) => HESAP_SAYFALARI.some((x) => id === x || id.startsWith(`${x}-`));

test('Lisans künyesi hesap sayfalarında bulunur', () => {
  const durum = ornekProje();
  const sayfalar = raporSayfalari(durum, projeyiHesapla(durum));
  const hesaplar = sayfalar.filter((x) => hesapSayfasiMi(x.id));

  assert.ok(hesaplar.length >= durum.ayiricilar.length + 1, `hesap sayfası: ${hesaplar.length}`);
  for (const sayfa of hesaplar) {
    assert.ok(sayfa.html.includes('Program lisans sahibi'), `${sayfa.id}: künye yok`);
    assert.ok(sayfa.html.includes(LISANS.gelistirici), `${sayfa.id}: geliştirici yok`);
    assert.ok(sayfa.html.includes(LISANS.sorumluluk), `${sayfa.id}: sorumluluk notu yok`);
  }
});

test('Lisans künyesi anlatı sayfalarında yinelenmez', () => {
  const durum = ornekProje();
  const sayfalar = raporSayfalari(durum, projeyiHesapla(durum));
  const anlati = sayfalar.filter((x) => !hesapSayfasiMi(x.id));

  assert.ok(anlati.length > 0, 'anlatı sayfası bulunamadı');
  for (const sayfa of anlati) {
    assert.ok(!sayfa.html.includes('Program lisans sahibi'), `${sayfa.id}: künye yinelenmiş`);
  }
});

test('Lisans künyesi raporda en az bir kez geçer', () => {
  const durum = ornekProje();
  const html = ciz(durum, projeyiHesapla(durum));
  assert.ok(html.includes(LISANS.haklar));
  assert.ok(html.includes(LISANS.sorumluluk));
});

test('Lisans sahibinin unvanı raporda kaçışsız bozulmadan görünür', () => {
  const durum = ornekProje();
  const html = ciz(durum, projeyiHesapla(durum));
  // Unvanda kaçış gerektiren karakter yok; olduğu gibi geçmeli.
  assert.ok(html.includes(LISANS.sahip));
});
