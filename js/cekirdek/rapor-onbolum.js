/**
 * rapor-onbolum.js — Akustik raporun "ön bölümü" (kapak sonrası anlatı kısmı).
 *
 * Yönetmelik hesapları raporun gövdesini oluşturur; ama teslim edilen
 * akustik rapor bundan ibaret değildir. Önünde parsel künyesi, çevresel
 * gürültü değerlendirmesi, anahtar paftalar (kat planları ve kesitler),
 * yapı elemanı kod anahtarı, mekân hassasiyet tablosu, nokta detaylar ve
 * malzeme özellikleri yer alır.
 *
 * Bu modül o bölümün *verisini* üretir: hangi tablo hangi satırlardan
 * oluşur, şekiller nasıl numaralanır, çevresel gürültü göstergesi nasıl
 * hesaplanır. Saf JavaScript'tir — DOM'a dokunmaz, böylece test edilebilir.
 */

import {
  EK2_TABLO_2_1, GURULTULULUK_KODU, HASSASIYET_KODU, BINA_TURLERI,
} from '../veri/yonetmelik.js';

/* ── Görsel bölümleri ────────────────────────────────────────────────
 *
 * Referans raporlarda şekil numaraları bölüm numarasını taşır:
 * vaziyet planı "Şekil 1.1", kat planları "Şekil 4.1…4.n", nokta
 * detaylar "Şekil 7.1…" gibi. Numaralandırma bu tablodan türetilir;
 * kullanıcı numara yazmaz.
 */
export const GORSEL_BOLUMLERI = [
  { tur: 'vaziyet',   bolum: '1', baslik: 'Vaziyet planı',
    aciklama: 'Parselin ve çevre yolların görüldüğü vaziyet planı. Raporun giriş bölümünde yer alır.' },
  { tur: 'katPlani',  bolum: '4', baslik: 'Kat planları',
    aciklama: 'Zemin kat, normal katlar ve çatı katı planları. Yapı elemanı kodları bu paftalar üzerinde gösterilir.' },
  { tur: 'kesit',     bolum: '4', baslik: 'Kesitler',
    aciklama: 'Binanın düşey kesitleri. Kat planlarıyla aynı bölümde, onların ardından numaralanır.' },
  { tur: 'noktaDetay', bolum: '7', baslik: 'Nokta detaylar',
    aciklama: 'Duvar–döşeme birleşimi, şaft, tesisat geçişi gibi kritik noktaların uygulama detayları.' },
  { tur: 'uygulama',  bolum: '9', baslik: 'Uygulama ve kontrol görselleri',
    aciklama: 'Şantiyede uyulacak uygulama kuralları ve kontrol aşamalarına ait görseller.' },
];

export const GORSEL_TURLERI = GORSEL_BOLUMLERI.map((b) => b.tur);

/* ── Çevresel gürültü ────────────────────────────────────────────────
 *
 * Çevre ve Şehircilik Bakanlığı "Çevresel Gürültünün Değerlendirilmesi ve
 * Yönetimi Yönetmeliği" EK-VII: yapılaşmanın olduğu alanlarda çevresel
 * gürültü sınır değerleri (dBA). "Mevcut yollar" sütunu, planlanmış ama
 * henüz yapılmamış yollara göre 5 dBA daha yüksektir.
 */
export const CEVRESEL_SINIR_DEGERLER = {
  kaynak: 'Çevresel Gürültünün Değerlendirilmesi ve Yönetimi Yönetmeliği, EK-VII',
  basliklar: ['Alan türü', 'Lgündüz', 'Lakşam', 'Lgece', 'Lgündüz', 'Lakşam', 'Lgece'],
  satirlar: [
    { id: 'hassas',      ad: 'Gürültüye hassas alanlar',       yeni: [60, 55, 50], mevcut: [65, 60, 55] },
    { id: 'ticari',      ad: 'Ticari alanlar',                 yeni: [63, 58, 53], mevcut: [68, 63, 58] },
    { id: 'karma',       ad: 'Karma alanlar (konut + ticari)', yeni: [65, 60, 55], mevcut: [70, 65, 60] },
    { id: 'endustriyel', ad: 'Endüstriyel alanlar',            yeni: [67, 62, 57], mevcut: [72, 67, 62] },
  ],
};

/**
 * Gürültü göstergesi Lgag (gündüz–akşam–gece), üç zaman diliminin süreyle
 * ağırlıklı 24 saatlik enerji ortalamasıdır:
 *
 *   Lgag = 10·lg( (12·10^(Lgündüz/10) + 4·10^(Lakşam/10) + 8·10^(Lgece/10)) / 24 )
 *
 * Ağırlıklar zaman dilimlerinin uzunluğudur: gündüz 07-19 (12 saat),
 * akşam 19-23 (4 saat), gece 23-07 (8 saat).
 *
 * DİKKAT — akşama +5, geceye +10 dBA CEZA UYGULANMAZ. Avrupa'daki Lden
 * göstergesi bu cezaları taşır ve iki bağıntı sık karıştırılır; Çevresel
 * Gürültünün Değerlendirilmesi ve Yönetimi Yönetmeliği'ndeki Lgag ise düz
 * enerji ortalamasıdır. Fark küçük değildir: 60/55/50 dBA girdisinde cezalı
 * bağıntı 60,0 — cezasız (doğru) bağıntı 57,7 dBA verir.
 *
 * @returns {number|null} Üç değer de sayı değilse null.
 */
export function lgagHesapla({ gunduz, aksam, gece } = {}) {
  const g = Number(gunduz), a = Number(aksam), n = Number(gece);
  if (!Number.isFinite(g) || !Number.isFinite(a) || !Number.isFinite(n)) return null;
  const toplam = 12 * 10 ** (g / 10) + 4 * 10 ** (a / 10) + 8 * 10 ** (n / 10);
  return 10 * Math.log10(toplam / 24);
}

/**
 * Ölçülen/kabul edilen çevresel gürültünün, seçilen alan türünün sınır
 * değerlerini aşıp aşmadığını söyler.
 */
export function cevreselDegerlendirme(cevresel = {}) {
  const satir = CEVRESEL_SINIR_DEGERLER.satirlar.find((x) => x.id === cevresel.alanTuru)
    || CEVRESEL_SINIR_DEGERLER.satirlar[0];
  const sinirlar = cevresel.mevcutYol ? satir.mevcut : satir.yeni;
  const olculen = [Number(cevresel.gunduz), Number(cevresel.aksam), Number(cevresel.gece)];
  const adlar = ['Lgündüz', 'Lakşam', 'Lgece'];

  const satirlar = adlar.map((ad, i) => ({
    ad,
    olculen: Number.isFinite(olculen[i]) ? olculen[i] : null,
    sinir: sinirlar[i],
    asiyor: Number.isFinite(olculen[i]) ? olculen[i] > sinirlar[i] : null,
  }));

  return {
    alan: satir, mevcutYol: !!cevresel.mevcutYol, satirlar,
    Lgag: lgagHesapla(cevresel),
    asanVar: satirlar.some((x) => x.asiyor === true),
  };
}

/* ── Giriş paragrafı ─────────────────────────────────────────────────── */

/**
 * Proje künyesinden raporun giriş cümlesini kurar.
 *
 * Boş alanlar cümleye hiç girmez; hepsi boşsa boş dize döner (arayüz o
 * zaman kullanıcıyı künyeyi doldurmaya yönlendirir).
 */
export function girisCumlesi(p = {}) {
  const yer = [p.il, p.ilce, p.mahalle && `${p.mahalle} mahallesi`].filter(Boolean).join(', ');
  const tapu = [p.ada && `${p.ada} ada`, p.parsel && `${p.parsel} parsel`].filter(Boolean).join(' ');
  const alan = p.toplamInsaatAlani && `${p.toplamInsaatAlani} m² toplam inşaat alanlı`;
  const tur = BINA_TURLERI[p.binaTuru];

  const parcalar = [];
  if (yer || tapu) {
    parcalar.push(`Rapora konu yapı, ${[yer, tapu].filter(Boolean).join(' ')} üzerinde yer almaktadır.`);
  }
  if (alan || tur || p.insaatYili) {
    parcalar.push(`Yapı, ${[alan, tur && tur.toLocaleLowerCase('tr')].filter(Boolean).join(' ')} niteliğindedir${
      p.insaatYili ? ` (inşaat yılı ${p.insaatYili})` : ''}.`);
  }
  if (p.isveren) parcalar.push(`Yapı sahibi ${p.isveren}'dir.`);
  return parcalar.join(' ');
}

/* ── Şekil numaralandırma ────────────────────────────────────────────── */

/**
 * Görselleri bölüm sırasına göre dizip "Şekil x.y" numaralarını verir.
 *
 * Kat planları ve kesitler aynı bölümü (4) paylaştığından numaralandırma
 * bölüm bazında, listedeki sıraya göre sürer: 4.1, 4.2 … kat planları,
 * ardından kesitler devam eder.
 */
export function sekilleriNumarala(gorseller = []) {
  const sayaclar = new Map();
  const sirali = [];
  for (const b of GORSEL_BOLUMLERI) {
    for (const g of gorseller.filter((x) => x.tur === b.tur)) {
      const n = (sayaclar.get(b.bolum) || 0) + 1;
      sayaclar.set(b.bolum, n);
      sirali.push({ ...g, bolum: b.bolum, no: `${b.bolum}.${n}`, etiket: `Şekil ${b.bolum}.${n}` });
    }
  }
  return sirali;
}

/** Numaralanmış görselleri bölüm türüne göre gruplar. */
export function gorselleriGrupla(gorseller = []) {
  const numarali = sekilleriNumarala(gorseller);
  return GORSEL_BOLUMLERI.map((b) => ({
    ...b, gorseller: numarali.filter((g) => g.tur === b.tur),
  }));
}

/* ── Tablo 4.1 — Yapı elemanı kod anahtarı ──────────────────────────── */

/** Bir hesap kaydının rapordaki kodu: kullanıcının verdiği ad, yoksa üretilen. */
function kod(kayit, onEk, sira) {
  const ad = String(kayit?.ad || '').trim();
  return ad || `${onEk}${sira}`;
}

/**
 * Hesaplardan, referans raporlardaki "Tablo 4.1 Yapı Elemanları" anahtarını
 * kurar: her kaydın kodu, yapı elemanı türü, kaynak ve alıcı mekânı.
 *
 * Gruplar cephe (DD), iç ayırıcı (ID) ve döşeme (DOS) olarak ayrılır —
 * cephede kaynak her zaman çevresel gürültüdür.
 */
export function yapiElemaniAnahtari(s = {}) {
  const cepheler = (s.cepheler || []).map((x, i) => ({
    eleman: 'Cephe / duvar',
    kod: kod(x.kayit, 'DD', i + 1),
    kaynak: 'Çevresel gürültü',
    alici: x.degerlendirme?.mekan?.ad || '—',
  }));

  const ayiricilar = (s.ayiricilar || []).map((x, i) => ({
    eleman: x.kayit?.geometri?.yon === 'taban' || x.kayit?.geometri?.yon === 'tavan' ? 'Döşeme' : 'Duvar',
    kod: kod(x.kayit, 'ID', i + 1),
    kaynak: x.degerlendirme?.kaynakMekan?.ad || '—',
    alici: x.degerlendirme?.aliciMekan?.ad || '—',
  }));

  const darbeler = (s.darbeler || []).map((x, i) => ({
    eleman: 'Döşeme',
    kod: kod(x.kayit, 'DOS', i + 1),
    kaynak: x.degerlendirme?.ustMekan?.ad || '—',
    alici: x.degerlendirme?.altMekan?.ad || '—',
  }));

  return [
    { grup: 'DD', baslik: 'Dış duvar / cephe elemanları', satirlar: cepheler },
    { grup: 'ID', baslik: 'İç ayırıcı elemanlar', satirlar: ayiricilar },
    { grup: 'DOS', baslik: 'Döşemeler (darbe sesi)', satirlar: darbeler },
  ].filter((g) => g.satirlar.length > 0);
}

/* ── Tablo 5.1 — Gürültülülük düzeyi ve hassasiyet dereceleri ───────── */

/**
 * Projede fiilen kullanılan mekânları, EK-2 Tablo 2.1'deki gürültülülük
 * düzeyi (YG/OG/DG) ve hassasiyet derecesiyle (I/II/III) listeler.
 *
 * Kullanılmayan mekânları listelemek raporu şişirir; bu yüzden tablo
 * hesaplardaki mekân kimliklerinden türetilir.
 */
export function mekanDereceleri(s = {}) {
  const kimlikler = new Set();
  for (const x of s.ayiricilar || []) {
    if (x.kayit?.kaynakMekanId) kimlikler.add(x.kayit.kaynakMekanId);
    if (x.kayit?.aliciMekanId) kimlikler.add(x.kayit.aliciMekanId);
  }
  for (const x of s.darbeler || []) {
    if (x.kayit?.ustMekanId) kimlikler.add(x.kayit.ustMekanId);
    if (x.kayit?.altMekanId) kimlikler.add(x.kayit.altMekanId);
  }
  for (const x of s.cepheler || []) {
    if (x.kayit?.mekanId) kimlikler.add(x.kayit.mekanId);
  }

  return EK2_TABLO_2_1.mekanlar
    .filter((m) => kimlikler.has(m.id))
    .map((m) => ({
      id: m.id,
      ad: m.ad,
      binaTuru: BINA_TURLERI[m.binaTuru] || m.binaTuru,
      gurultululuk: GURULTULULUK_KODU[m.gurultululuk] || '—',
      hassasiyet: HASSASIYET_KODU[m.hassasiyet] || '—',
    }));
}

/* ── Tablo 11.1 / 11.2 — Malzeme özellikleri ────────────────────────── */

function malzemeEkle(harita, ad, yogunluk) {
  const anahtar = String(ad || '').trim();
  if (!anahtar || !Number.isFinite(yogunluk) || yogunluk <= 0) return;
  if (!harita.has(anahtar)) harita.set(anahtar, yogunluk);
}

/** Bir çözülmüş yapı elemanından (elemanVeyaKatmanCoz çıktısı) malzeme toplar. */
function elemandanTopla(harita, coz) {
  if (!coz) return;
  if (coz.katmanli && coz.katmanDetay) {
    for (const d of coz.katmanDetay.katmanDetaylari || []) {
      malzemeEkle(harita, d.katman?.ad, Number(d.katman?.yogunluk));
    }
    return;
  }
  malzemeEkle(harita, coz.eleman?.grup || coz.ad, Number(coz.yogunluk));
}

/**
 * Raporda geçen malzemelerin birim hacim ağırlıklarını toplar.
 *
 * Aynı malzeme birden çok elemanda geçse de tabloya bir kez girer; sıra
 * yoğunluğa göre artan olduğundan tablo okunabilir kalır.
 */
export function malzemeYogunluklari(s = {}) {
  const harita = new Map();
  for (const x of s.ayiricilar || []) {
    elemandanTopla(harita, x.ana);
    for (const y of x.yanElemanlar || []) elemandanTopla(harita, y._cozum);
  }
  for (const x of s.darbeler || []) elemandanTopla(harita, x.doseme);
  for (const x of s.cepheler || []) {
    for (const y of x.yuzeysel || []) elemandanTopla(harita, y._cozum);
  }
  return [...harita.entries()]
    .map(([ad, yogunluk]) => ({ ad, yogunluk }))
    .sort((a, b) => a.yogunluk - b.yogunluk || a.ad.localeCompare(b.ad, 'tr'));
}
