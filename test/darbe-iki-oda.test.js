/**
 * darbe-iki-oda.test.js — Darbe sesi hesabında üst (kaynak) ve alt (alıcı)
 * mekân ölçülerinin ayrı ayrı verilebildiği kip.
 *
 * Kritik nokta: bağıntıya giren hacim HER ZAMAN alıcı (alt) mekânın
 * hacmidir — L'nT,w = L'n,w − 10·lg(0,032·V).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { bosProje, yeniDarbe, darbeKipiDegistir } from '../js/durum.js';
import { projeyiHesapla, darbeGeometrisi, darbeHesapla } from '../js/hesap.js';
import { LndenLnT } from '../js/cekirdek/temel.js';

const UST = { ad: 'Salon', L: 7, W: 4, H: 3.0 };
const ALT = { ad: 'Yatak odası', L: 5, W: 3, H: 2.6 };

function darbeIle(geometri) {
  const d = bosProje();
  const k = yeniDarbe();
  k.geometri = { ...k.geometri, ...geometri };
  d.darbeler = [k];
  return { durum: d, kayit: k, sonuc: projeyiHesapla(d).darbeler[0] };
}

/* ── Hangi hacim kullanılıyor? ───────────────────────────────────── */

test('İki oda kipinde bağıntı ALICI (alt) mekânın hacmini kullanır', () => {
  const { sonuc } = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT });
  assert.equal(sonuc.geo.V, 5 * 3 * 2.6);        // alt mekân
  assert.equal(sonuc.geo.V1, 7 * 4 * 3.0);       // üst mekân yalnızca bilgi
});

test('Üst mekân büyüdüğünde sonuç DEĞİŞMEZ; alt mekân büyüdüğünde değişir', () => {
  const a = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT }).sonuc;
  const b = darbeIle({ mod: 'iki-oda', ustOda: { ...UST, L: 12 }, altOda: ALT }).sonuc;
  const c = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: { ...ALT, L: 9 } }).sonuc;
  assert.equal(a.sonuc.LnTw, b.sonuc.LnTw, 'üst mekân bağıntıya girmemeli');
  assert.notEqual(a.sonuc.LnTw, c.sonuc.LnTw, 'alıcı hacmi sonucu değiştirmeli');
});

test("L'nT,w değeri alıcı hacminden gelen bağıntıyla birebir tutar", () => {
  const { durum, sonuc } = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT });
  const { T0, emniyetPayi } = durum.proje;   // sonuca emniyet payı da eklenir
  const V = 5 * 3 * 2.6;
  const beklenen = LndenLnT(sonuc.sonuc.LnwAksan, V, T0) + emniyetPayi;
  assert.ok(Math.abs(sonuc.sonuc.LnTw - beklenen) < 1e-9,
    `${sonuc.sonuc.LnTw} ≠ ${beklenen}`);
});

/* ── Ortak döşeme ve kaydırma ────────────────────────────────────── */

test('Ortak döşeme, iki mekânın örtüşen taban izdüşümüdür', () => {
  const { sonuc } = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT });
  assert.equal(sonuc.geo.S, Math.min(7, 5) * Math.min(4, 3));   // 5 × 3
  assert.equal(sonuc.geo.tamOrtusme, true);
});

test('Küçük oda büyüğün içinde kaldığı sürece kaydırma ortak alanı değiştirmez', () => {
  // Kaydırma referans KENARDAN ölçülür. Üst oda 7 m, alt oda 5 m; alt oda
  // 1,5 m içeri kaydırılınca hâlâ [1,5 – 6,5] aralığında, yani tümüyle
  // üstün altında. Örtüşme 5 m olarak kalır — fiziksel olarak doğrudur.
  const hizali = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT }).sonuc;
  const icerde = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT, kaydirmaA: 1.5 }).sonuc;
  assert.equal(icerde.geo.S, hizali.geo.S);
});

test('Kaydırma taşmaya başlayınca ortak döşeme küçülür ama hacim değişmez', () => {
  const hizali = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT }).sonuc;
  // 3 m kaydırınca alt oda [3 – 8], üst oda [0 – 7] → örtüşme 4 m.
  const kaymis = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT, kaydirmaA: 3 }).sonuc;
  assert.equal(kaymis.geo.ortakA, 4);
  assert.ok(kaymis.geo.S < hizali.geo.S);
  assert.equal(kaymis.geo.V, hizali.geo.V);
  // Basitleştirilmiş modelde alan bağıntıya girmediği için sonuç aynı kalır.
  assert.equal(kaymis.sonuc.LnTw, hizali.sonuc.LnTw);
});

test('Örtüşme tamamen kalkarsa temasVar false olur ve hesap çökmez', () => {
  const { sonuc } = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT, kaydirmaA: 20 });
  assert.equal(sonuc.geo.S, 0);
  assert.equal(sonuc.geo.temasVar, false);
  assert.ok(Number.isFinite(sonuc.sonuc.LnTw), 'hacim hâlâ geçerli olduğu için sonuç üretilir');
});

/* ── Geriye dönük uyumluluk ──────────────────────────────────────── */

test('Tek oda kipi, kayıtta ustOda/altOda bulunsa bile kök L/W/H kullanır', () => {
  // Tuzak: geometriHesapla iki oda görürse onları kullanırdı; darbeGeometrisi
  // kipe göre girdiyi açıkça kuruyor.
  const geo = darbeGeometrisi({
    mod: 'olculer', L: 4, W: 3, H: 2.5,
    ustOda: { L: 99, W: 99, H: 99 }, altOda: { L: 88, W: 88, H: 88 },
  });
  assert.equal(geo.V, 4 * 3 * 2.5);
});

test('Hacim kipi geometriyi yok sayar, doğrudan V kullanır', () => {
  assert.equal(darbeGeometrisi({ mod: 'hacim', L: 4, W: 3, H: 2.5 }), null);
  const { durum, sonuc, kayit } = darbeIle({ mod: 'hacim' });
  const { T0, emniyetPayi } = durum.proje;
  assert.equal(sonuc.geo, null);
  const beklenen = LndenLnT(sonuc.sonuc.LnwAksan, kayit.V, T0) + emniyetPayi;
  assert.ok(Math.abs(sonuc.sonuc.LnTw - beklenen) < 1e-9);
});

test('Eski kayıtlar (yalnızca mod/L/W/H) aynı sonucu verir', () => {
  const d = bosProje();
  const k = yeniDarbe();
  k.geometri = { mod: 'olculer', L: 6, W: 3, H: 2.62 };   // ustOda/altOda yok
  d.darbeler = [k];
  const s = projeyiHesapla(d).darbeler[0];
  assert.ok(Math.abs(s.geo.V - 6 * 3 * 2.62) < 1e-9);
});

/* ── Değerlendirme akışı ─────────────────────────────────────────── */

test('İki oda kipi değerlendirmeyi ve sınıfı üretmeyi sürdürür', () => {
  const { sonuc } = darbeIle({ mod: 'iki-oda', ustOda: UST, altOda: ALT });
  assert.ok(sonuc.degerlendirme, 'değerlendirme üretilmeli');
  assert.ok(Number.isFinite(sonuc.degerlendirme.gereken));
  assert.ok(typeof sonuc.degerlendirme.uygun === 'boolean');
});

test('darbeHesapla doğrudan çağrıldığında da aynı hacmi seçer', () => {
  const d = bosProje();
  const k = yeniDarbe();
  k.geometri = { mod: 'iki-oda', ustOda: UST, altOda: ALT, kaydirmaA: 0, kaydirmaB: 0 };
  const h = darbeHesapla(k, d.proje);
  assert.equal(h.geo.V, 5 * 3 * 2.6);
});

/* ── Kipler arası geçişte ölçü taşıma ────────────────────────────── */

test('Tek odadan iki odaya geçince ölçüler her iki odaya taşınır', () => {
  // Kullanıcı tek oda kipinde 4,2 yazdıysa kip değiştirince o sayıyı görmeli;
  // hazır duran bir varsayılan onu gölgelememeli.
  const g = darbeKipiDegistir({ mod: 'olculer', L: 4.2, W: 3.1, H: 2.8 }, 'iki-oda');
  assert.equal(g.mod, 'iki-oda');
  assert.deepEqual({ L: g.altOda.L, W: g.altOda.W, H: g.altOda.H }, { L: 4.2, W: 3.1, H: 2.8 });
  assert.deepEqual({ L: g.ustOda.L, W: g.ustOda.W, H: g.ustOda.H }, { L: 4.2, W: 3.1, H: 2.8 });
  assert.equal(g.kaydirmaA, 0);
  assert.equal(g.kaydirmaB, 0);
});

test('İki odadan tek odaya dönünce ALICI mekânın ölçüleri yazılır', () => {
  const g = darbeKipiDegistir({
    mod: 'iki-oda', L: 6, W: 3, H: 2.62,
    ustOda: { L: 9, W: 5, H: 3.2 }, altOda: { L: 4, W: 2.5, H: 2.4 },
  }, 'olculer');
  // Üst mekânın (9) değil, alıcının (4) ölçüsü gelmeli.
  assert.deepEqual({ L: g.L, W: g.W, H: g.H }, { L: 4, W: 2.5, H: 2.4 });
});

test('Ayrıca tanımlanmış üst mekân, tek odaya uğramadan korunur', () => {
  const g = { mod: 'iki-oda', ustOda: { L: 9, W: 5, H: 3.2 }, altOda: { L: 4, W: 2.5, H: 2.4 } };
  darbeKipiDegistir(g, 'hacim');
  darbeKipiDegistir(g, 'iki-oda');
  assert.equal(g.ustOda.L, 9, 'üst mekân ezilmemeli');
  assert.equal(g.altOda.L, 4);
});

test('Oda adları kip değişiminde kaybolmaz', () => {
  const g = { mod: 'olculer', L: 5, W: 3, H: 2.6, altOda: { ad: 'Yatak odası', L: 1, W: 1, H: 1 } };
  darbeKipiDegistir(g, 'iki-oda');
  assert.equal(g.altOda.ad, 'Yatak odası');
  assert.equal(g.altOda.L, 5, 'ölçü tek oda kipinden gelmeli');
});
