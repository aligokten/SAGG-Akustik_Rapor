/**
 * rapor-onbolum.test.js — Raporun ön bölümü: çevresel gürültü, şekil
 * numaralandırma, hesaplardan türeyen tablolar ve rapora akışı.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  lgagHesapla, cevreselDegerlendirme, girisCumlesi, sekilleriNumarala,
  gorselleriGrupla, yapiElemaniAnahtari, mekanDereceleri, malzemeYogunluklari,
  CEVRESEL_SINIR_DEGERLER, GORSEL_BOLUMLERI,
} from '../js/cekirdek/rapor-onbolum.js';
import { bosProje, ornekProje, bosOnBolum, yeniGorsel, cepheleriNormallestir } from '../js/durum.js';
import { projeyiHesapla } from '../js/hesap.js';
import { ciz as raporCiz } from '../js/arayuz/sekme-rapor.js';
import { ciz as onBolumCiz } from '../js/arayuz/sekme-onbolum.js';
import { raporSayfalari } from '../js/arayuz/sekme-rapor.js';
import { GIRIS_METNI } from '../js/cekirdek/rapor-onbolum.js';

/* ── Lgag ────────────────────────────────────────────────────────── */

test('Lgag, yönetmelikteki bağıntıyı verir (akşam/gece cezası YOK)', () => {
  // Referans akustik raporun kendi sayıları: 60/55/50 dBA girdisinde
  // Lgag = 58 dBA. Cezalı (Avrupa Lden) bağıntısı burada 60,0 verir ve
  // yanlıştır; yönetmelik düz enerji ortalaması kullanır.
  const x = lgagHesapla({ gunduz: 60, aksam: 55, gece: 50 });
  assert.ok(Math.abs(x - 57.68) < 0.01, `beklenen ≈57,68 — bulunan ${x}`);
  assert.equal(Math.round(x), 58);
});

test('Lgag, akşam ve geceye ceza EKLEMEZ', () => {
  // Ceza uygulansaydı sonuç düz ortalamadan yüksek çıkardı. Bu test,
  // Lden bağıntısının sessizce geri gelmesini engeller.
  const duz = lgagHesapla({ gunduz: 60, aksam: 60, gece: 60 });
  assert.ok(Math.abs(duz - 60) < 1e-9, 'üç dilim eşitken Lgag o değere eşit olmalı');
});

test('Lgag, ağırlıkları zaman dilimi uzunluğundan alır', () => {
  // Yalnızca gece 10 dB yükselince artış, gecenin 8/24 payıyla sınırlıdır.
  const temel = lgagHesapla({ gunduz: 60, aksam: 60, gece: 60 });
  const geceli = lgagHesapla({ gunduz: 60, aksam: 60, gece: 70 });
  const beklenen = 10 * Math.log10((12 * 10 ** 6 + 4 * 10 ** 6 + 8 * 10 ** 7) / 24);
  assert.ok(Math.abs(geceli - beklenen) < 1e-9);
  assert.ok(geceli > temel);
});

test('Lgag, gece düzeyi yükselince artar', () => {
  const az = lgagHesapla({ gunduz: 60, aksam: 55, gece: 50 });
  const cok = lgagHesapla({ gunduz: 60, aksam: 55, gece: 60 });
  assert.ok(cok > az, 'gece gürültüsü Lgag\'ı yükseltmeli');
});

test('Lgag, eksik girdide null döner', () => {
  assert.equal(lgagHesapla({ gunduz: 60, aksam: 55 }), null);
  assert.equal(lgagHesapla({}), null);
  assert.equal(lgagHesapla(), null);
});

/* ── Çevresel değerlendirme ──────────────────────────────────────── */

test('Mevcut yollarda sınır değerler 5 dBA yükselir', () => {
  const temel = { alanTuru: 'hassas', gunduz: 63, aksam: 58, gece: 53 };
  const planli = cevreselDegerlendirme({ ...temel, mevcutYol: false });
  const mevcut = cevreselDegerlendirme({ ...temel, mevcutYol: true });

  assert.equal(planli.satirlar[0].sinir, 60);
  assert.equal(mevcut.satirlar[0].sinir, 65);
  assert.equal(planli.asanVar, true, '63 dBA, 60 dBA sınırını aşar');
  assert.equal(mevcut.asanVar, false, '63 dBA, 65 dBA sınırının altındadır');
});

test('Girilmeyen düzey "aşıyor mu" sorusunu null bırakır', () => {
  const d = cevreselDegerlendirme({ alanTuru: 'ticari' });
  assert.deepEqual(d.satirlar.map((x) => x.asiyor), [null, null, null]);
  assert.equal(d.asanVar, false);
  assert.equal(d.Lgag, null);
});

test('Tanınmayan alan türünde ilk satıra düşülür (çökmez)', () => {
  const d = cevreselDegerlendirme({ alanTuru: 'yok-boyle-bir-alan' });
  assert.equal(d.alan.id, CEVRESEL_SINIR_DEGERLER.satirlar[0].id);
});

/* ── Giriş cümlesi ───────────────────────────────────────────────── */

test('Giriş cümlesi künyeden kurulur, boş alanlar cümleye girmez', () => {
  const metin = girisCumlesi({
    il: 'Muğla', ilce: 'Milas', mahalle: 'Hayıtlı', ada: '265', parsel: '17',
    isveren: 'Örnek A.Ş.', binaTuru: 'konut',
  });
  assert.match(metin, /Muğla, Milas, Hayıtlı mahallesi 265 ada 17 parsel/);
  assert.match(metin, /Örnek A\.Ş\./);
  assert.doesNotMatch(metin, /undefined|null/);
});

test('Boş künyede giriş cümlesi boş kalır', () => {
  const p = bosProje().proje;
  p.binaTuru = '';
  assert.equal(girisCumlesi(p), '');
});

/* ── Şekil numaralandırma ────────────────────────────────────────── */

test('Kat planları ve kesitler aynı bölümde art arda numaralanır', () => {
  const g = [
    { id: '1', tur: 'kesit' },
    { id: '2', tur: 'katPlani' },
    { id: '3', tur: 'katPlani' },
    { id: '4', tur: 'vaziyet' },
  ];
  const n = sekilleriNumarala(g);
  const no = Object.fromEntries(n.map((x) => [x.id, x.no]));

  assert.equal(no['4'], '1.1', 'vaziyet planı 1. bölümdedir');
  assert.equal(no['2'], '4.1');
  assert.equal(no['3'], '4.2');
  // Kesit, listede önce gelse de kat planlarından sonra numaralanır:
  // bölüm sırası GORSEL_BOLUMLERI tarafından belirlenir.
  assert.equal(no['1'], '4.3');
});

test('Numaralandırma, listedeki sırayı bölüm içinde korur', () => {
  const g = [{ id: 'b', tur: 'katPlani' }, { id: 'a', tur: 'katPlani' }];
  assert.deepEqual(sekilleriNumarala(g).map((x) => x.id), ['b', 'a']);
});

test('Gruplama, her bölümü GORSEL_BOLUMLERI sırasında döner', () => {
  const gruplar = gorselleriGrupla([{ id: '1', tur: 'noktaDetay' }]);
  assert.deepEqual(gruplar.map((x) => x.tur), GORSEL_BOLUMLERI.map((x) => x.tur));
  assert.equal(gruplar.find((x) => x.tur === 'noktaDetay').gorseller.length, 1);
});

/* ── Hesaplardan türeyen tablolar ────────────────────────────────── */

test('Yapı elemanı anahtarı, kaydın kendi adını kod olarak kullanır', () => {
  const d = ornekProje();
  d.ayiricilar[0].ad = 'ID1';
  const anahtar = yapiElemaniAnahtari(projeyiHesapla(d));
  const ic = anahtar.find((g) => g.grup === 'ID');
  assert.equal(ic.satirlar[0].kod, 'ID1');
});

test('Adı boş bırakılan kayda sırasına göre kod üretilir', () => {
  const d = ornekProje();
  d.darbeler[0].ad = '   ';
  const anahtar = yapiElemaniAnahtari(projeyiHesapla(d));
  assert.equal(anahtar.find((g) => g.grup === 'DOS').satirlar[0].kod, 'DOS1');
});

test('Boş projede anahtar tablosu hiç grup üretmez', () => {
  assert.deepEqual(yapiElemaniAnahtari(projeyiHesapla(bosProje())), []);
});

test('Mekân dereceleri yalnızca kullanılan mekânları listeler', () => {
  const d = ornekProje();
  const mekanlar = mekanDereceleri(projeyiHesapla(d));
  const kimlikler = new Set();
  for (const a of d.ayiricilar) { kimlikler.add(a.kaynakMekanId); kimlikler.add(a.aliciMekanId); }
  for (const x of d.darbeler) { kimlikler.add(x.ustMekanId); kimlikler.add(x.altMekanId); }
  for (const c of d.cepheler) kimlikler.add(c.mekanId);

  assert.ok(mekanlar.length > 0);
  for (const m of mekanlar) assert.ok(kimlikler.has(m.id), `${m.id} projede kullanılmıyor`);
  assert.equal(new Set(mekanlar.map((m) => m.id)).size, mekanlar.length, 'yinelenen satır olmamalı');
});

test('Mekân dereceleri YG/OG/DG ve I/II/III kodlarını verir', () => {
  const m = mekanDereceleri(projeyiHesapla(ornekProje()));
  for (const x of m) {
    assert.match(x.gurultululuk, /^(YG|OG|DG)$/);
    assert.match(x.hassasiyet, /^(I|II|III)$/);
  }
});

test('Malzeme tablosu yinelemesizdir ve yoğunluğa göre sıralıdır', () => {
  const liste = malzemeYogunluklari(projeyiHesapla(ornekProje()));
  assert.ok(liste.length > 0);
  assert.equal(new Set(liste.map((m) => m.ad)).size, liste.length);
  for (let i = 1; i < liste.length; i += 1) {
    assert.ok(liste[i].yogunluk >= liste[i - 1].yogunluk, 'artan sırada olmalı');
  }
});

/* ── Durum ve göç ────────────────────────────────────────────────── */

test('Boş projede ön bölüm tanımlıdır', () => {
  const ob = bosProje().onbolum;
  assert.equal(ob.etkin, true);
  assert.deepEqual(ob.gorseller, []);
  assert.deepEqual(ob.oneriler, []);
  assert.equal(ob.cevresel.alanTuru, 'hassas');
});

test('Ön bölümü olmayan eski proje yüklenince tamamlanır', () => {
  const eski = { proje: {}, ayiricilar: [], darbeler: [], cepheler: [], hacimler: [] };
  const d = cepheleriNormallestir(eski);
  assert.deepEqual(d.onbolum, bosOnBolum());
});

test('Eksik alanlar tamamlanırken kullanıcının verisi korunur', () => {
  const eski = {
    proje: {}, cepheler: [],
    onbolum: { giris: 'Kullanıcı metni', gorseller: [{ id: 'x', tur: 'kesit' }] },
  };
  const d = cepheleriNormallestir(eski);
  assert.equal(d.onbolum.giris, 'Kullanıcı metni');
  assert.equal(d.onbolum.gorseller.length, 1);
  assert.equal(d.onbolum.etkin, true, 'yeni alan varsayılanla gelmeli');
  assert.deepEqual(d.onbolum.oneriler, []);
  assert.equal(d.onbolum.cevresel.alanTuru, 'hassas');
});

test('Yeni görsel kaydı benzersiz kimlik ve boş alanlarla gelir', () => {
  const a = yeniGorsel('katPlani');
  const b = yeniGorsel('katPlani');
  assert.notEqual(a.id, b.id);
  assert.equal(a.tur, 'katPlani');
  assert.equal(a.veri, '');
});

/* ── Rapora ve panele akış ───────────────────────────────────────── */

test('Ön bölüm rapora, hesap sayfalarından önce girer', () => {
  const d = ornekProje();
  d.onbolum.sonuc = 'Yapı hedeflenen sınıfı sağlamaktadır.';
  const html = raporCiz(d, projeyiHesapla(d));

  const onbolumYeri = html.indexOf('1. Giriş');
  const hesapYeri = html.indexOf('Ayırıcı eleman');
  assert.ok(onbolumYeri > -1, 'giriş bölümü raporda yok');
  assert.ok(hesapYeri > -1 && onbolumYeri < hesapYeri, 'ön bölüm hesaplardan sonra kalmış');
  assert.match(html, /Yapı hedeflenen sınıfı sağlamaktadır/);
});

test('Ön bölüm kapatılınca rapordan tümüyle çıkar', () => {
  const d = ornekProje();
  d.onbolum.etkin = false;
  const html = raporCiz(d, projeyiHesapla(d));
  assert.doesNotMatch(html, /1\. Giriş/);
  assert.doesNotMatch(html, /Çevresel gürültü sınır değerleri/);
});

test('Görselli bölümler raporda numaralanmış şekil olarak basılır', () => {
  const d = ornekProje();
  d.onbolum.gorseller = [
    { ...yeniGorsel('katPlani'), baslik: 'ZEMİN KAT PLANI', veri: 'data:image/png;base64,AAA' },
    { ...yeniGorsel('kesit'), baslik: 'A-A KESİTİ', veri: 'data:image/png;base64,BBB' },
  ];
  const html = raporCiz(d, projeyiHesapla(d));
  assert.match(html, /Şekil 4\.1.*ZEMİN KAT PLANI/s);
  assert.match(html, /Şekil 4\.2.*A-A KESİTİ/s);
  // Bölüm numarası, basılan bölümlere göre sırayla verilir; sabit değildir.
  assert.match(html, /\d+\. Anahtar paftalar/);
});

test('Sonuç ve öneri boşken sonuç bölümü hiç basılmaz', () => {
  const d = ornekProje();
  d.onbolum.sonuc = '';
  d.onbolum.oneriler = ['', '   '];
  assert.doesNotMatch(raporCiz(d, projeyiHesapla(d)), /Sonuç ve öneriler/);
});

test('Öneriler raporda numaralı liste olur', () => {
  const d = ornekProje();
  d.onbolum.oneriler = ['Pencereler Rw ≥ 34 dB olacaktır.', 'Şaftlar yalıtılacaktır.'];
  const html = raporCiz(d, projeyiHesapla(d));
  assert.match(html, /\d+\.1 Uygulama önerileri/);
  assert.match(html, /Şaftlar yalıtılacaktır/);
});

test('Ön bölüm sekmesi künyeyi ve otomatik tabloları gösterir', () => {
  const d = ornekProje();
  const html = onBolumCiz(d, projeyiHesapla(d));
  assert.match(html, /Rapor ön bölümü/);
  assert.match(html, /Ada \/ Parsel/);
  assert.match(html, /1234 \/ 5/, 'ada-parsel künyeden gelmeli');
  assert.match(html, /Yapı elemanı kod anahtarı/);
  assert.match(html, /data-eylem="gorsel-ekle" data-tur="katPlani"/);
});

test('Ön bölüm sekmesi boş projede de çizilir', () => {
  const d = bosProje();
  const html = onBolumCiz(d, projeyiHesapla(d));
  assert.ok(html.length > 0);
  assert.doesNotMatch(html, /undefined/);
});

test('Kullanıcı metni, künyeden türetilen cümlenin yerine geçer', () => {
  const d = ornekProje();
  d.onbolum.giris = 'Elle yazılmış giriş.';
  const html = raporCiz(d, projeyiHesapla(d));
  assert.match(html, /Elle yazılmış giriş\./);
  assert.doesNotMatch(html, /Rapora konu yapı, Ankara/);
});

/* ── Sabit giriş metni ───────────────────────────────────────────── */

test('Sabit giriş metni her raporda yer alır', () => {
  const d = ornekProje();
  assert.ok(raporCiz(d, projeyiHesapla(d)).includes(GIRIS_METNI.slice(0, 120)));
});

test('Kullanıcı kendi metnini yazsa da sabit metin kalır', () => {
  const d = ornekProje();
  d.onbolum.giris = 'Elle yazılmış ek açıklama.';
  const html = raporCiz(d, projeyiHesapla(d));
  assert.ok(html.includes(GIRIS_METNI.slice(0, 120)), 'sabit metin silinmemeli');
  assert.match(html, /Elle yazılmış ek açıklama\./);
});

test('Boş künyeli projede bile sabit metin basılır', () => {
  const d = bosProje();
  assert.ok(raporCiz(d, projeyiHesapla(d)).includes(GIRIS_METNI.slice(0, 120)));
});

/* ── İçindekiler ─────────────────────────────────────────────────── */

test('İçindekiler, girişin hemen ardından gelir', () => {
  const d = ornekProje();
  const idler = raporSayfalari(d, projeyiHesapla(d)).map((x) => x.id);
  assert.equal(idler[0], 'giris');
  assert.equal(idler[1], 'icindekiler');
});

test('İçindekilerdeki her girdinin karşılığı bir sayfadır', () => {
  const d = ornekProje();
  const sayfalar = raporSayfalari(d, projeyiHesapla(d));
  const idler = new Set(sayfalar.map((x) => x.id));
  const html = sayfalar.map((x) => x.html).join('');

  const referanslar = [...html.matchAll(/data-bolum-ref="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(referanslar.length > 0, 'içindekiler girdisi yok');
  for (const r of referanslar) {
    assert.ok(idler.has(r), `"${r}" girdisinin sayfası yok — içindekiler ayrışmış`);
  }
});

test('İçindekiler kendini listelemez', () => {
  const d = ornekProje();
  const html = raporSayfalari(d, projeyiHesapla(d)).map((x) => x.html).join('');
  const referanslar = [...html.matchAll(/data-bolum-ref="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(!referanslar.includes('icindekiler'));
});

test('Bölüm numaraları boşluksuz ve sırayla verilir', () => {
  const d = ornekProje();
  // Nokta detay ve uygulama görseli yok → o bölümler hiç basılmaz;
  // numaralar yine 1'den başlayıp birer birer artmalı.
  const html = raporSayfalari(d, projeyiHesapla(d)).map((x) => x.html).join('');
  const numaralar = [...html.matchAll(/<h1 style="font-size:18px">(\d+)\./g)].map((m) => Number(m[1]));
  assert.ok(numaralar.length >= 4);
  assert.deepEqual(numaralar, numaralar.map((_, i) => i + 1));
});

test('Bölüm eklenince numaralar kendiliğinden kayar', () => {
  const d = ornekProje();
  const oncekiSayi = raporSayfalari(d, projeyiHesapla(d))
    .map((x) => x.html).join('').match(/<h1 style="font-size:18px">\d+\./g).length;

  d.onbolum.gorseller = [{ ...yeniGorsel('noktaDetay'), veri: 'data:image/png;base64,AAA' }];
  const sonrakiSayi = raporSayfalari(d, projeyiHesapla(d))
    .map((x) => x.html).join('').match(/<h1 style="font-size:18px">\d+\./g).length;

  assert.equal(sonrakiSayi, oncekiSayi + 1);
});

test('Her sayfada tam olarak bir antet ve bir altbilgi bulunur', () => {
  const d = ornekProje();
  for (const sayfa of raporSayfalari(d, projeyiHesapla(d))) {
    const altbilgi = (sayfa.html.match(/rapor-altbilgi/g) || []).length;
    assert.equal(altbilgi, 1, `${sayfa.id}: altbilgi ${altbilgi} kez`);
  }
});

/* ── D1 uzman belgesi ────────────────────────────────────────────── */

test('Uzman belgesi şekil numarası almaz', () => {
  const n = sekilleriNumarala([
    { id: 'a', tur: 'katPlani' },
    { id: 'b', tur: 'uzmanBelgesi' },
  ]);
  const belge = n.find((x) => x.tur === 'uzmanBelgesi');
  assert.equal(belge.no, null);
  assert.equal(belge.numarasiz, true);
  assert.match(belge.etiket, /D1 Temel Bina Akustik Uzman Belgesi/);
});

test('Uzman belgesi ön bölümün EN SONUNDA yer alır', () => {
  const d = ornekProje();
  d.onbolum.gorseller = [
    { ...yeniGorsel('uzmanBelgesi'), veri: 'data:image/png;base64,AAA' },
    { ...yeniGorsel('katPlani'), baslik: 'ZEMİN KAT', veri: 'data:image/png;base64,BBB' },
  ];
  const idler = raporSayfalari(d, projeyiHesapla(d)).map((x) => x.id);
  const belge = idler.indexOf('uzmanBelgesi');
  const paftalar = idler.indexOf('paftalar');
  const hesap = idler.indexOf('ayiricilar');

  assert.ok(belge > paftalar, 'belge, paftalardan sonra olmalı');
  assert.ok(belge < hesap, 'belge, hesap sayfalarından önce olmalı');
});

test('Belge yüklenmediyse o bölüm hiç basılmaz', () => {
  const d = ornekProje();
  const idler = raporSayfalari(d, projeyiHesapla(d)).map((x) => x.id);
  assert.ok(!idler.includes('uzmanBelgesi'));
});

test('Çok sayfalı belge her sayfası ayrı basılır', () => {
  const d = ornekProje();
  d.onbolum.gorseller = [
    { ...yeniGorsel('uzmanBelgesi'), veri: 'data:image/png;base64,AAA' },
    { ...yeniGorsel('uzmanBelgesi'), veri: 'data:image/png;base64,BBB' },
  ];
  const idler = raporSayfalari(d, projeyiHesapla(d)).map((x) => x.id);
  assert.ok(idler.includes('uzmanBelgesi'));
  assert.ok(idler.includes('uzmanBelgesi-1'));
});

test('Uzman belgesi panelde kendi kartıyla görünür', () => {
  const d = ornekProje();
  const html = onBolumCiz(d, projeyiHesapla(d));
  assert.match(html, /D1 Temel Bina Akustik Uzman Belgesi/);
  assert.match(html, /data-eylem="gorsel-ekle" data-tur="uzmanBelgesi"/);
});
