/**
 * favoriler.test.js — Katman favorileri kitaplığı ve raporda mekân adı
 * çözümü.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// favoriler.js tarayıcı deposunu kullanır; Node'da basit bir vekil kurulur.
// Modül, localStorage'a yalnızca fonksiyon gövdelerinde dokunduğu için bu
// atamanın import'lardan sonra yapılması yeterlidir.
const depo = new Map();
globalThis.localStorage = {
  getItem: (k) => (depo.has(k) ? depo.get(k) : null),
  setItem: (k, v) => depo.set(k, String(v)),
  removeItem: (k) => depo.delete(k),
};

const {
  FAVORI_KATEGORILERI, kategoriDogrula, favoriEkle, favoriSil, favoriBul,
  favorileriListele, favorileriGrupla, favoriKatmanlari, favoriPaketi,
  favorileriIceAktar, favorileriTemizle,
} = await import('../js/veri/favoriler.js');

const KATMANLAR = [
  { tur: 'siva', ad: 'Alçı sıva', kalinlik: 15, yogunluk: 1000 },
  { tur: 'masif', ad: 'G2 Gazbeton', kalinlik: 200, yogunluk: 400 },
];

test.beforeEach(() => favorileriTemizle());

/* ── Kategoriler ──────────────────────────────────────────────────── */

test('Üç kategori tanımlıdır: iç duvar, dış duvar, döşeme', () => {
  assert.deepEqual(Object.keys(FAVORI_KATEGORILERI), ['icDuvar', 'disDuvar', 'doseme']);
});

test('Bilinmeyen kategori iç duvara indirgenir', () => {
  assert.equal(kategoriDogrula('disDuvar'), 'disDuvar');
  assert.equal(kategoriDogrula('doseme'), 'doseme');
  assert.equal(kategoriDogrula('saçma'), 'icDuvar');
  assert.equal(kategoriDogrula(undefined), 'icDuvar');
});

/* ── Ekleme ───────────────────────────────────────────────────────── */

test('Favori eklenir ve kategorisiyle saklanır', () => {
  const r = favoriEkle('Standart iç duvar', 'icDuvar', KATMANLAR);
  assert.equal(r.ok, true);
  assert.equal(r.favori.ad, 'Standart iç duvar');
  assert.equal(r.favori.kategori, 'icDuvar');
  assert.equal(r.favori.katmanlar.length, 2);
  assert.equal(favorileriListele().length, 1);
});

test('Adsız veya katmansız favori reddedilir', () => {
  assert.equal(favoriEkle('', 'icDuvar', KATMANLAR).ok, false);
  assert.equal(favoriEkle('   ', 'icDuvar', KATMANLAR).ok, false);
  assert.equal(favoriEkle('Boş', 'icDuvar', []).ok, false);
  assert.equal(favoriEkle('Boş', 'icDuvar', null).ok, false);
  assert.equal(favorileriListele().length, 0);
});

test('Favori, katmanların anlık kopyasını tutar', () => {
  const katmanlar = [{ tur: 'masif', ad: 'ÖNCE', kalinlik: 100, yogunluk: 2400 }];
  const r = favoriEkle('Kopya sınaması', 'icDuvar', katmanlar);
  katmanlar[0].ad = 'SONRA';
  assert.equal(favoriBul(r.favori.id).katmanlar[0].ad, 'ÖNCE');
});

test('Yüklenen katmanlar bağımsız kopyadır', () => {
  const r = favoriEkle('Bağımsızlık', 'icDuvar', KATMANLAR);
  const a = favoriKatmanlari(r.favori.id);
  a[0].ad = 'DEĞİŞTİ';
  assert.equal(favoriBul(r.favori.id).katmanlar[0].ad, 'Alçı sıva');
  assert.notEqual(favoriKatmanlari(r.favori.id)[0].ad, 'DEĞİŞTİ');
});

test('Aynı kategoride aynı ad üzerine yazılır, farklı kategoride ayrı kalır', () => {
  favoriEkle('20 cm gazbeton', 'icDuvar', KATMANLAR);
  const ikinci = favoriEkle('20 cm gazbeton', 'icDuvar', [KATMANLAR[0]]);
  assert.equal(ikinci.guncellendi, true);
  assert.equal(favorileriListele().length, 1);
  assert.equal(favorileriListele()[0].katmanlar.length, 1);

  favoriEkle('20 cm gazbeton', 'disDuvar', KATMANLAR);
  assert.equal(favorileriListele().length, 2);
});

test('Ad karşılaştırması büyük/küçük harfe duyarsızdır', () => {
  favoriEkle('Standart Duvar', 'icDuvar', KATMANLAR);
  const r = favoriEkle('standart duvar', 'icDuvar', KATMANLAR);
  assert.equal(r.guncellendi, true);
  assert.equal(favorileriListele().length, 1);
});

/* ── Gruplama ve silme ────────────────────────────────────────────── */

test('Gruplama üç kategoriyi de döndürür, sıralama kategoriye göredir', () => {
  favoriEkle('Döşeme A', 'doseme', KATMANLAR);
  favoriEkle('Dış B', 'disDuvar', KATMANLAR);
  favoriEkle('İç C', 'icDuvar', KATMANLAR);

  const g = favorileriGrupla();
  assert.deepEqual(Object.keys(g), ['icDuvar', 'disDuvar', 'doseme']);
  assert.equal(g.icDuvar.length, 1);
  assert.equal(g.disDuvar.length, 1);
  assert.equal(g.doseme.length, 1);

  // Liste kategori sırasına göre gelir.
  assert.deepEqual(favorileriListele().map((f) => f.kategori), ['icDuvar', 'disDuvar', 'doseme']);
});

test('Favori silinir', () => {
  const r = favoriEkle('Silinecek', 'doseme', KATMANLAR);
  favoriSil(r.favori.id);
  assert.equal(favorileriListele().length, 0);
  assert.equal(favoriBul(r.favori.id), null);
  assert.equal(favoriKatmanlari(r.favori.id), null);
});

/* ── Dışa / içe aktarma ───────────────────────────────────────────── */

test('Dışa aktarılan paket geri yüklenebilir', () => {
  favoriEkle('Dış duvar 1', 'disDuvar', KATMANLAR);
  favoriEkle('Döşeme 1', 'doseme', KATMANLAR);
  const paket = favoriPaketi();
  assert.equal(paket.favoriler.length, 2);

  favorileriTemizle();
  const r = favorileriIceAktar(paket);
  assert.equal(r.eklenen, 2);
  assert.equal(r.guncellenen, 0);
  assert.equal(favorileriListele().length, 2);
});

test('Aynı kimlikli kayıt içe aktarmada güncellenir', () => {
  const ilk = favoriEkle('Aynı', 'icDuvar', KATMANLAR);
  const paket = { favoriler: [{ ...ilk.favori, ad: 'Yeni ad' }] };
  const r = favorileriIceAktar(paket);
  assert.equal(r.guncellenen, 1);
  assert.equal(r.eklenen, 0);
  assert.equal(favoriBul(ilk.favori.id).ad, 'Yeni ad');
});

test('Bozuk içe aktarma girdileri atlanır, çökmez', () => {
  const r = favorileriIceAktar({ favoriler: [
    null, {}, { id: 'x', ad: 'Katmansız', katmanlar: [] }, 'metin',
    { id: 'ok1', ad: 'Geçerli', kategori: 'doseme', katmanlar: KATMANLAR },
  ] });
  assert.equal(r.eklenen, 1);
  assert.equal(favorileriListele().length, 1);
  assert.equal(favorileriListele()[0].kategori, 'doseme');
});

test('İçe aktarmada bilinmeyen kategori indirgenir', () => {
  favorileriIceAktar([{ id: 'k1', ad: 'Tuhaf', kategori: 'uzayDuvari', katmanlar: KATMANLAR }]);
  assert.equal(favorileriListele()[0].kategori, 'icDuvar');
});

/* ═══════════════════════════════════════════════════════════════════════
   Raporda mekân adı çözümü
   ═══════════════════════════════════════════════════════════════════════ */

const { odaAdlariCoz } = await import('../js/arayuz/sekme-rapor.js');

const DEG = { kaynakMekan: { ad: 'Oturma odası / salon' }, aliciMekan: { ad: 'Yatak odası' } };

test('Ayırıcı adı "ID1" iken kaynak oda adı olarak kullanılmaz', () => {
  const r = odaAdlariCoz('ID1', { oda1: {}, oda2: {} }, DEG);
  assert.equal(r.oda1Adi, 'Oturma odası / salon');
  assert.equal(r.oda2Adi, 'Yatak odası');
});

test('Ok içermeyen hiçbir ayırıcı adı mekân adına sızmaz', () => {
  for (const ad of ['ID1', 'DOS1', 'Daireler arası duvar', '', null, undefined]) {
    const r = odaAdlariCoz(ad, {}, DEG);
    assert.equal(r.oda1Adi, 'Oturma odası / salon', `"${ad}" için oda1 sızdı`);
    assert.equal(r.oda2Adi, 'Yatak odası', `"${ad}" için oda2 sızdı`);
  }
});

test('"Kaynak → Alıcı" biçimindeki ad iki mekâna bölünür', () => {
  const r = odaAdlariCoz('TİP 2 YATAK ODASI → TİP 1 YATAK ODASI', {}, DEG);
  assert.equal(r.oda1Adi, 'TİP 2 YATAK ODASI');
  assert.equal(r.oda2Adi, 'TİP 1 YATAK ODASI');
  // ASCII ok da kabul edilir.
  const r2 = odaAdlariCoz('A -> B', {}, DEG);
  assert.equal(r2.oda1Adi, 'A');
  assert.equal(r2.oda2Adi, 'B');
});

test('Geometriye girilen mekân adı her şeyin önündedir', () => {
  const geo = { oda1: { ad: 'TİP 1 YATAK ODASI' }, oda2: { ad: 'KORİDOR' } };
  const r = odaAdlariCoz('X → Y', geo, DEG);
  assert.equal(r.oda1Adi, 'TİP 1 YATAK ODASI');
  assert.equal(r.oda2Adi, 'KORİDOR');
});

test('Hiçbir kaynak yoksa genel yedek adlar kullanılır', () => {
  const r = odaAdlariCoz('ID1', {}, null);
  assert.equal(r.oda1Adi, 'Oda 1 / Kaynak');
  assert.equal(r.oda2Adi, 'Oda 2 / Alıcı');
});

test('İkiden fazla ok parçası varsa ad bölünmez', () => {
  const r = odaAdlariCoz('A → B → C', {}, DEG);
  assert.equal(r.oda1Adi, 'Oturma odası / salon');
});
