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

const { ciz } = await import('../js/arayuz/sekme-rapor.js');
const { ornekProje } = await import('../js/durum.js');
const { projeyiHesapla } = await import('../js/hesap.js');

test('Lisans bilgileri her rapor sayfasının altbilgisinde yer alır', () => {
  const durum = ornekProje();
  const html = ciz(durum, projeyiHesapla(durum));

  // Ayırıcı sayfaları + "Ek hesap özetleri" + EK-10 performans belgesi.
  const sayfaSayisi = durum.ayiricilar.length + 2;
  const say = (metin) => html.split(metin).length - 1;

  assert.equal(say('Program lisans sahibi'), sayfaSayisi);
  assert.equal(say('Program geliştirici'), sayfaSayisi);
  assert.equal(say(LISANS.gelistirici), sayfaSayisi);
  assert.equal(say(LISANS.sorumluluk), sayfaSayisi);
  assert.ok(html.includes(LISANS.haklar));
});

test('Lisans sahibinin unvanı raporda kaçışsız bozulmadan görünür', () => {
  const durum = ornekProje();
  const html = ciz(durum, projeyiHesapla(durum));
  // Unvanda kaçış gerektiren karakter yok; olduğu gibi geçmeli.
  assert.ok(html.includes(LISANS.sahip));
});
