/**
 * durum.js — Uygulama durumu (proje verisi), kalıcılık ve örnek proje.
 */

import { yeniId } from './arayuz/ortak.js';
import { projeKimliklerinigGuncelle } from './veri/malzemeler.js';

const DEPO_ANAHTARI = 'sagg-akustik-proje-v1';

/** Boş bir proje. */
export function bosProje() {
  return {
    surum: 1,
    proje: {
      ad: '',
      kod: '',                    // rapor kodu (ör. "ID1", "DOS1") — raporun sağ üst köşesinde gösterilir
      adaParsel: '',
      isveren: '',
      muellif: '',
      akustikUzman: '',
      sirket: 'SAGG İnşaat Mimarlık Akustik',  // rapor antetindeki şirket/ofis adı
      unvan: '',                  // akustik uzmanın unvanı (ör. "D1 Temel Bina Akustiği Uzmanı")
      tarih: new Date().toISOString().slice(0, 10),
      binaTuru: 'konut',
      hedefSinif: 'C',
      durum: 'yeniBina',           // yeniBina | kullanimAmaciDegisikligi | esasliTadilat
      rwModeli: 'en12354',
      emniyetPayi: 2,              // dB — öngörü belirsizliği payı
      T0: 0.5,                     // s — referans reverberasyon süresi
      notlar: '',
    },
    ayiricilar: [],
    darbeler: [],
    cepheler: [],
    hacimler: [],
  };
}

/** Yeni bir ayırıcı eleman kaydı (düşey veya yatay). */
export function yeniAyirici() {
  return {
    id: yeniId('a'),
    ad: 'Daireler arası duvar',
    kaynakMekanId: 'konut-yasam-alanlari',
    aliciMekanId: 'konut-yatak-odalari',
    S: 12,
    V: 40,
    elemanId: 'ba-200',
    sivaId: 'alci-15',
    sivaliYuzSayisi: 2,
    manuelHedef: null,        // girilirse yönetmelik DnT,w hedefinin yerine geçer (dB)
    RwBeyan: null,            // beyan edilmiş Rw varsa kestirimin yerine geçer
    yogunlukBeyan: null,      // ürünün gerçek birim hacim ağırlığı (kg/m³)
    giydirmeId: 'yok',
    dolguId: null,            // giydirme kabuk boşluk dolgusu (YALITIM_LEVHALARI)
    kapiVar: false,
    kapiId: 'kapi-ic-dolu',
    kapiAlani: 1.8,
    yanElemanlar: varsayilanYanElemanlar(),
    katmanlar: [],             // doluysa "Malzeme seçimi" yerine "Katmanlı yapı" kullanılır
    geometri: {                // mod: 'hacim' (S,V doğrudan) | 'olculer' (oda1/oda2 L×W×H + yön)
      mod: 'hacim',
      // `ad`, mekânın proje içindeki kendi adıdır (ör. "TİP 1 YATAK ODASI");
      // boşsa raporda mekân kullanım türünün adı kullanılır.
      oda1: { ad: '', L: 6.0, W: 3.0, H: 2.62 },
      oda2: { ad: '', L: 6.0, W: 3.0, H: 2.62 },
      yon: 'on',
    },
  };
}

/**
 * Tipik dört yan eleman (iki yan duvar + taban + tavan).
 *
 * `geometriRolu`, ayırıcı elemanın geometri modunda ('olculer') bu
 * elemanın birleşim uzunluğunun (lf) oda boyutlarından otomatik
 * hesaplanacağını işaretler: 'yanDuvar' → H, 'tabanTavan' → ayırıcının
 * kendi genişliği. Kullanıcının sonradan eklediği yan elemanlarda bu alan
 * boş bırakılır ve manuel girilen lf kullanılır.
 */
export function varsayilanYanElemanlar() {
  return [
    { id: yeniId('y'), ad: 'Yan duvar (cephe)', elemanId: 'ddt-240', sivaId: 'cimento-20', sivaliYuzSayisi: 2, RwBeyan: null, yogunlukBeyan: null, lf: 2.8, birlesim: 'T', giydirmeId: 'yok', dolguId: null, esnekBaglanti: false, geometriRolu: 'yanDuvar', katmanlar: [] },
    { id: yeniId('y'), ad: 'Yan duvar (koridor)', elemanId: 'ddt-190', sivaId: 'cimento-20', sivaliYuzSayisi: 2, RwBeyan: null, yogunlukBeyan: null, lf: 2.8, birlesim: 'T', giydirmeId: 'yok', dolguId: null, esnekBaglanti: false, geometriRolu: 'yanDuvar', katmanlar: [] },
    { id: yeniId('y'), ad: 'Taban (döşeme)', elemanId: 'ba-d-160', sivaId: 'alci-10', sivaliYuzSayisi: 1, RwBeyan: null, yogunlukBeyan: null, lf: 4.3, birlesim: 'X', giydirmeId: 'yok', dolguId: null, esnekBaglanti: false, geometriRolu: 'tabanTavan', katmanlar: [] },
    { id: yeniId('y'), ad: 'Tavan (döşeme)', elemanId: 'ba-d-160', sivaId: 'alci-10', sivaliYuzSayisi: 1, RwBeyan: null, yogunlukBeyan: null, lf: 4.3, birlesim: 'X', giydirmeId: 'yok', dolguId: null, esnekBaglanti: false, geometriRolu: 'tabanTavan', katmanlar: [] },
  ];
}

/** Yeni bir darbe sesi (döşeme) kaydı. */
export function yeniDarbe() {
  return {
    id: yeniId('d'),
    ad: 'Daireler arası döşeme',
    ustMekanId: 'konut-yasam-alanlari',
    altMekanId: 'konut-yatak-odalari',
    dosemeId: 'ba-d-160',
    manuelHedef: null,        // girilirse yönetmelik L'nT,w üst sınırının yerine geçer (dB)
    LnwBeyan: null,
    sapId: 'yuzer-sap-20',
    dLwBeyan: null,
    asmaTavanVar: false,
    asmaTavanKazanci: 10,
    mYanOrtalama: 250,
    V: 40,
    katmanlar: [],
    geometri: { mod: 'hacim', L: 6.0, W: 3.0, H: 2.62 },
  };
}

/** Yeni bir cephe kaydı. */
export function yeniCephe() {
  return {
    id: yeniId('c'),
    ad: 'Yatak odası cephesi',
    mekanId: 'konut-yatak-odalari',
    disGurultu: 65,
    V: 40,
    bicim: 'duz',
    konum: 'orta',            // orta (tek dış duvar) | kose (iki dış duvar)
    ctr: -3,                  // spektrum uyarlama terimi — DnT,A,tr için
    manuelHedef: null,        // girilirse yönetmelik hedefinin yerine geçer (dB)
    geometri: {               // mod: 'hacim' (V doğrudan) | 'olculer' (L×W×H)
      mod: 'hacim',
      L: 4.5, W: 3.4, H: 2.62,
    },
    elemanlar: [
      { id: yeniId('e'), ad: 'Dolu cephe duvarı', tur: 'duvar', duvarNo: 1, elemanId: 'ddt-240', sivaId: 'cimento-20', sivaliYuzSayisi: 2, RwBeyan: null, yogunlukBeyan: null, S: 9, katmanlar: [] },
      // Doğramalarda alan en × boy'dan türetilir; 3B modelde de bu ölçülerle çizilir.
      { id: yeniId('e'), ad: 'Pencere', tur: 'dograma', duvarNo: 1, elemanId: 'pencere-6-16-4', RwBeyan: null, en: 1.8, boy: 1.4, S: 2.52 },
    ],
    kucukElemanlar: [],
    yanElemanlar: varsayilanCepheYanElemanlari(),
  };
}

/** Bir doğramanın alanı: en × boy (ikisi de girilmişse), yoksa elle girilen S. */
export function dogramaAlani(e) {
  const en = Number(e?.en);
  const boy = Number(e?.boy);
  if (en > 0 && boy > 0) return en * boy;
  return Number(e?.S) || 0;
}

/**
 * Eski cephe kayıtlarını güncel şemaya taşır.
 *
 * Sayısal sonuç korunur: doğramalarda en/boy yoksa, elle girilmiş S alanı
 * değişmeyecek biçimde makul bir en × boy çiftine çözülür (boy 1,40 m kabul
 * edilir). Böylece kayıt 3B modelde çizilebilir hâle gelir ama hesap
 * değişmez.
 */
export function cepheleriNormallestir(d) {
  for (const c of (d?.cepheler || [])) {
    if (!c.konum) c.konum = 'orta';
    if (!Number.isFinite(c.ctr)) c.ctr = -3;
    if (c.manuelHedef === undefined) c.manuelHedef = null;
    if (!c.geometri) c.geometri = { mod: 'hacim', L: 4.5, W: 3.4, H: 2.62 };
    if (!c.yanElemanlar?.length) c.yanElemanlar = varsayilanCepheYanElemanlari();

    for (const e of (c.elemanlar || [])) {
      if (!e.duvarNo) e.duvarNo = 1;
      if (e.tur === 'duvar') {
        if (!Array.isArray(e.katmanlar)) e.katmanlar = [];
      } else if (!(Number(e.en) > 0 && Number(e.boy) > 0)) {
        const S = Number(e.S) || 0;
        const boy = Math.min(1.4, Math.max(0.6, Math.sqrt(S / 1.3) || 1.4));
        e.boy = Number(boy.toFixed(2));
        e.en = S > 0 ? Number((S / e.boy).toFixed(2)) : 1;
        e.S = e.en * e.boy;
      }
    }
  }
  return d;
}

/**
 * Cephe mekânının iç yan elemanları.
 *
 * Bunlar cephe alanına dâhil değildir; dış duvarla birleşimlerinden Df yan
 * yolu oluştururlar. `icArkaDuvar` yalnızca köşe mahalde (konum === 'kose')
 * değerlendirmeye katılır.
 */
export function varsayilanCepheYanElemanlari() {
  return [
    { id: yeniId('cy'), rol: 'icTavan',     ad: 'İç tavan döşemesi', elemanId: 'ba-d-160', sivaId: 'alci-10', sivaliYuzSayisi: 1, RwBeyan: null, yogunlukBeyan: null, birlesim: 'T', esnekBaglanti: false, katmanlar: [] },
    { id: yeniId('cy'), rol: 'icTaban',     ad: 'İç taban döşemesi', elemanId: 'ba-d-160', sivaId: 'alci-10', sivaliYuzSayisi: 1, RwBeyan: null, yogunlukBeyan: null, birlesim: 'T', esnekBaglanti: false, katmanlar: [] },
    { id: yeniId('cy'), rol: 'icSolDuvar',  ad: 'İç yan duvar', elemanId: 'ddt-190', sivaId: 'alci-15', sivaliYuzSayisi: 2, RwBeyan: null, yogunlukBeyan: null, birlesim: 'T', esnekBaglanti: false, katmanlar: [] },
    { id: yeniId('cy'), rol: 'icArkaDuvar', ad: 'İç arka duvar', elemanId: 'ddt-190', sivaId: 'alci-15', sivaliYuzSayisi: 2, RwBeyan: null, yogunlukBeyan: null, birlesim: 'T', esnekBaglanti: false, katmanlar: [] },
  ];
}

/** Yeni bir hacim (reverberasyon) kaydı. */
export function yeniHacim() {
  return {
    id: yeniId('h'),
    ad: 'Derslik',
    mekanId: 'egitim-derslikler',
    V: 180,
    yuzeyler: [
      { id: yeniId('s'), sogurucuId: 'siva', alan: 190 },
      { id: yeniId('s'), sogurucuId: 'seramik', alan: 60 },
      { id: yeniId('s'), sogurucuId: 'cam', alan: 12 },
    ],
    nesneler: [
      { id: yeniId('n'), nesneId: 'sira-ahsap', adet: 30 },
    ],
  };
}

/** Tarayıcıya kaydeder. */
export function kaydet(durum) {
  try {
    localStorage.setItem(DEPO_ANAHTARI, JSON.stringify(durum));
  } catch { /* depolama kullanılamıyor olabilir */ }
}

/** Tarayıcıdan okur. */
export function yukle() {
  try {
    const ham = localStorage.getItem(DEPO_ANAHTARI);
    if (!ham) return null;
    const d = JSON.parse(ham);
    return d && d.proje ? cepheleriNormallestir(projeKimliklerinigGuncelle(d)) : null;
  } catch { return null; }
}

/** Depoyu temizler. */
export function temizle() {
  try { localStorage.removeItem(DEPO_ANAHTARI); } catch { /* yoksay */ }
}

/** Örnek (gösterim) projesi. */
export function ornekProje() {
  const p = bosProje();
  p.proje.ad = 'Örnek Konut Projesi — B Blok';
  p.proje.adaParsel = '1234 ada / 5 parsel';
  p.proje.isveren = 'Örnek Yapı A.Ş.';
  p.proje.muellif = 'Mimarlık Ofisi';
  p.proje.akustikUzman = 'Akustik Uzmanı (Bakanlık kayıtlı)';
  p.proje.binaTuru = 'konut';
  p.proje.hedefSinif = 'C';

  const a1 = yeniAyirici();
  a1.ad = 'Daireler arası ayırıcı duvar (salon–yatak odası)';
  // Yalnızca ayırıcı duvarı ağırlaştırmak yetmez; yan yolu sınırlayan koridor
  // duvarına da giydirme kabuk uygulanmıştır.
  a1.giydirmeId = 'ap-bagimsiz-50';
  a1.yanElemanlar[1].giydirmeId = 'ap-bagimsiz-50';
  p.ayiricilar.push(a1);

  const a2 = yeniAyirici();
  a2.ad = 'Merdiven sahanlığı ile daire arası duvar (kapılı)';
  a2.kaynakMekanId = 'konut-sirkulasyon-alanlari';
  a2.aliciMekanId = 'konut-sirkulasyon-alanlari';
  a2.elemanId = 'ddt-240';
  a2.S = 10; a2.V = 55;
  a2.kapiVar = true; a2.kapiId = 'daire-kapisi'; a2.kapiAlani = 2.0;
  p.ayiricilar.push(a2);

  p.darbeler.push(yeniDarbe());

  const c1 = yeniCephe();
  c1.disGurultu = 68;
  c1.elemanlar[1].elemanId = 'pencere-uclu';
  c1.elemanlar[1].S = 3.6;
  c1.elemanlar[0].S = 9.9;
  p.cepheler.push(c1);

  p.hacimler.push(yeniHacim());
  p.hacimler[0].ad = 'Ortak merdiven / hol';
  p.hacimler[0].mekanId = 'konut-sirkulasyon-alanlari';
  p.hacimler[0].V = 90;
  p.hacimler[0].yuzeyler = [
    { id: yeniId('s'), sogurucuId: 'siva', alan: 96 },
    { id: yeniId('s'), sogurucuId: 'seramik', alan: 40 },
    { id: yeniId('s'), sogurucuId: 'akustik-panel', alan: 24 },
  ];
  p.hacimler[0].nesneler = [];

  return p;
}
