/**
 * durum.js — Uygulama durumu (proje verisi), kalıcılık ve örnek proje.
 */

import { yeniId } from './arayuz/ortak.js';

const DEPO_ANAHTARI = 'sagg-akustik-proje-v1';

/** Boş bir proje. */
export function bosProje() {
  return {
    surum: 1,
    proje: {
      ad: '',
      adaParsel: '',
      isveren: '',
      muellif: '',
      akustikUzman: '',
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
    kaynakMekanId: 'konut-oturma',
    aliciMekanId: 'konut-yatak',
    S: 12,
    V: 40,
    elemanId: 'ba-200',
    sivaId: 'alci-15',
    sivaliYuzSayisi: 2,
    RwBeyan: null,            // beyan edilmiş Rw varsa kestirimin yerine geçer
    giydirmeId: 'yok',
    kapiVar: false,
    kapiId: 'kapi-ic-dolu',
    kapiAlani: 1.8,
    yanElemanlar: varsayilanYanElemanlar(),
  };
}

/** Tipik dört yan eleman (iki duvar + döşeme + tavan). */
export function varsayilanYanElemanlar() {
  return [
    { id: yeniId('y'), ad: 'Cephe duvarı', elemanId: 'tugla-d250', sivaId: 'cimento-20', sivaliYuzSayisi: 2, RwBeyan: null, lf: 2.8, birlesim: 'T', giydirmeId: 'yok', esnekBaglanti: false },
    { id: yeniId('y'), ad: 'İç koridor duvarı', elemanId: 'tugla-d190', sivaId: 'cimento-20', sivaliYuzSayisi: 2, RwBeyan: null, lf: 2.8, birlesim: 'T', giydirmeId: 'yok', esnekBaglanti: false },
    { id: yeniId('y'), ad: 'Alt döşeme', elemanId: 'ba-d-160', sivaId: 'alci-10', sivaliYuzSayisi: 1, RwBeyan: null, lf: 4.3, birlesim: 'X', giydirmeId: 'yok', esnekBaglanti: false },
    { id: yeniId('y'), ad: 'Üst döşeme (tavan)', elemanId: 'ba-d-160', sivaId: 'alci-10', sivaliYuzSayisi: 1, RwBeyan: null, lf: 4.3, birlesim: 'X', giydirmeId: 'yok', esnekBaglanti: false },
  ];
}

/** Yeni bir darbe sesi (döşeme) kaydı. */
export function yeniDarbe() {
  return {
    id: yeniId('d'),
    ad: 'Daireler arası döşeme',
    ustMekanId: 'konut-oturma',
    altMekanId: 'konut-yatak',
    dosemeId: 'ba-d-160',
    LnwBeyan: null,
    sapId: 'yuzer-sap-20',
    dLwBeyan: null,
    asmaTavanVar: false,
    asmaTavanKazanci: 10,
    mYanOrtalama: 250,
    V: 40,
  };
}

/** Yeni bir cephe kaydı. */
export function yeniCephe() {
  return {
    id: yeniId('c'),
    ad: 'Yatak odası cephesi',
    mekanId: 'konut-yatak',
    disGurultu: 65,
    V: 40,
    bicim: 'duz',
    elemanlar: [
      { id: yeniId('e'), ad: 'Dolu cephe duvarı', tur: 'duvar', elemanId: 'tugla-d250', sivaId: 'cimento-20', sivaliYuzSayisi: 2, RwBeyan: null, S: 9 },
      { id: yeniId('e'), ad: 'Pencere', tur: 'dograma', elemanId: 'pencere-6-16-4', RwBeyan: null, S: 4.5 },
    ],
    kucukElemanlar: [],
  };
}

/** Yeni bir hacim (reverberasyon) kaydı. */
export function yeniHacim() {
  return {
    id: yeniId('h'),
    ad: 'Derslik',
    mekanId: 'okul-derslik',
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
    return d && d.proje ? d : null;
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
  a1.giydirmeId = 'ap-metal-50';
  a1.yanElemanlar[1].giydirmeId = 'ap-metal-50';
  p.ayiricilar.push(a1);

  const a2 = yeniAyirici();
  a2.ad = 'Merdiven sahanlığı ile daire arası duvar (kapılı)';
  a2.kaynakMekanId = 'konut-merdiven';
  a2.aliciMekanId = 'konut-hol';
  a2.elemanId = 'tugla-d250';
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
  p.hacimler[0].mekanId = 'konut-merdiven';
  p.hacimler[0].V = 90;
  p.hacimler[0].yuzeyler = [
    { id: yeniId('s'), sogurucuId: 'siva', alan: 96 },
    { id: yeniId('s'), sogurucuId: 'seramik', alan: 40 },
    { id: yeniId('s'), sogurucuId: 'akustik-panel', alan: 24 },
  ];
  p.hacimler[0].nesneler = [];

  return p;
}
