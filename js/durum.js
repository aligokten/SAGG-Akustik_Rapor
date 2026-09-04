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

      // ── Yapı yeri (tapu ve adres bilgileri) ──
      il: '',
      ilce: '',
      mahalle: '',
      pafta: '',
      ada: '',
      parsel: '',
      adres: '',                  // açık adres (sokak, no)
      belediye: '',               // ilgili belediye — rapor kapağında görünür
      adaParsel: '',              // eski serbest metin alanı; ada/parsel boşsa yedek olarak kullanılır

      // ── Bina bilgileri (EK-10 belgesi) ──
      insaatYili: '',
      kapaliAlan: '',             // m² — kapalı kullanım alanı
      toplamInsaatAlani: '',      // m² — toplam inşaat alanı
      binaResmi: '',              // data: URL — belgedeki "Binanın Resmi" alanı

      isveren: '',
      isverenAdres: '',           // bina sahibinin adresi (EK-10 belgesi)
      muellif: '',
      akustikUzman: '',
      sirket: 'SAGG İnşaat Mimarlık Akustik',  // rapor antetindeki şirket/ofis adı
      unvan: '',                  // akustik uzmanın unvanı (ör. "D1 Temel Bina Akustiği Uzmanı")
      odaSicil: '',               // belgeyi düzenleyenin oda sicil numarası (EK-10)
      belgeNo: '',                // EK-10 belge numarası; boşsa rapor kodu kullanılır
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
    onbolum: bosOnBolum(),
  };
}

/**
 * Raporun ön bölümü: hesaplardan önce gelen anlatı, çevresel gürültü
 * değerlendirmesi, anahtar paftalar ve sonuç/öneriler.
 *
 * Görseller (kat planı, kesit, nokta detay) proje JSON'unun içine data:
 * URL olarak gömülür; harici dosya bağımlılığı olmaz.
 */
export function bosOnBolum() {
  return {
    etkin: true,          // false ise ön bölüm rapora hiç girmez
    giris: '',            // serbest metin; boşsa künyeden cümle türetilir
    cevresel: {
      alanTuru: 'hassas',
      mevcutYol: false,   // planlanmamış (mevcut) yollar sınır değeri 5 dBA yükseltir
      gunduz: null, aksam: null, gece: null,
      aciklama: '',
    },
    gorseller: [],        // { id, tur, baslik, aciklama, veri }
    yapiElemaniNotu: '',
    sonuc: '',
    oneriler: [],         // serbest metin maddeleri
  };
}

/** Bir görsel kaydı (kat planı, kesit, nokta detay …). */
export function yeniGorsel(tur) {
  return { id: yeniId('g'), tur, baslik: '', aciklama: '', veri: '' };
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
    // EK-3 Tablo 3.4 komşuluk satırı. Doluysa gereksinim bu satırdan,
    // boşsa mekân derecelerine dayanan Tablo 3.2'den okunur.
    komsulukId: 'konut-birim-birim',
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
      // Alıcı mekânın kaynağa göre ayırıcı düzlem üzerindeki kayması (m).
      // 0 iken iki oda hizalıdır ve ortak alan min() ile bulunur; kayma
      // arttıkça duvarın yalnızca örtüşen kısmı ayırıcı eleman olur.
      kaydirmaA: 0,
      kaydirmaB: 0,
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
    // EK-3 Tablo 3.5 komşuluk satırı. Doluysa gereksinim bu satırdan,
    // boşsa kaynak mekân derecesine dayanan Tablo 3.3'ten okunur.
    komsulukId: 'konut-birim',
    LnwBeyan: null,
    sapId: 'yuzer-sap-20',
    dLwBeyan: null,
    asmaTavanVar: false,
    asmaTavanKazanci: 10,
    mYanOrtalama: 250,
    V: 40,
    katmanlar: [],
    // Geometri üç kipte çalışır:
    //   'hacim'   → alt mekân hacmi V doğrudan girilir
    //   'olculer' → tek oda: ALT (alıcı) mekânın L×W×H'si
    //   'iki-oda' → üst (kaynak) ve alt (alıcı) mekân ayrı ayrı, döşeme
    //               düzleminde kaydırma ile
    //
    // Üçünde de bağıntıya giren hacim ALT (alıcı) mekânın hacmidir:
    // L'nT,w = L'n,w − 10·lg(0,032·V). İki oda kipi, üst ve alt mekân
    // ölçüleri farklı olduğunda doğru hacmin karıştırılmamasını sağlar ve
    // ortak döşeme alanını ayrıca raporlar.
    // 'iki-oda' kipinin alanları (ustOda, altOda, kaydirmaA, kaydirmaB) burada
    // BİLEREK yer almaz; kipe ilk geçişte oluşturulurlar. Böylece o ana kadar
    // tek oda kipinde girilmiş ölçüler her iki odaya taşınabiliyor — hazır
    // duran varsayılan bir üst oda, kullanıcının yazdığı ölçüyü gölgelemiyor.
    geometri: { mod: 'hacim', L: 6.0, W: 3.0, H: 2.62 },
  };
}

/**
 * Darbe sesi kaydının geometri kipini değiştirir (yerinde).
 *
 * Kipler arasında geçerken kullanıcının ekranda gördüğü ölçü değişmemelidir.
 * Kural: tek oda kipindeki L/W/H her zaman ALICI (alt) mekânı tarif eder,
 * çünkü bağıntıya giren hacim odur. Dolayısıyla:
 *   • tek oda → iki oda : alt mekân bu ölçüleri alır; üst mekân daha önce
 *     ayrıca tanımlanmadıysa aynı ölçüde başlatılır,
 *   • iki oda → tek oda : tek oda alanlarına alt mekânın ölçüleri yazılır.
 *
 * İki oda alanları kayıtta baştan bulunmaz; ilk geçişte burada oluşturulur.
 * Hazır duran varsayılan bir üst oda, kullanıcının girdiği ölçüyü gölgelerdi.
 *
 * @param {Object} g Kaydın geometri alanı (değiştirilir)
 * @param {'hacim'|'olculer'|'iki-oda'} kip
 * @returns {Object} Aynı geometri nesnesi
 */
export function darbeKipiDegistir(g, kip) {
  if (!g) return g;
  const tek = { L: g.L ?? 6, W: g.W ?? 3, H: g.H ?? 2.62 };

  if (kip === 'iki-oda') {
    if (g.mod === 'olculer' || !g.altOda) g.altOda = { ad: g.altOda?.ad || '', ...tek };
    if (!g.ustOda) g.ustOda = { ad: '', ...tek };
    if (!Number.isFinite(g.kaydirmaA)) g.kaydirmaA = 0;
    if (!Number.isFinite(g.kaydirmaB)) g.kaydirmaB = 0;
  } else if (kip === 'olculer' && g.mod === 'iki-oda' && g.altOda) {
    g.L = g.altOda.L; g.W = g.altOda.W; g.H = g.altOda.H;
  }

  g.mod = kip;
  return g;
}

/** Yeni bir cephe kaydı. */
export function yeniCephe() {
  return {
    id: yeniId('c'),
    ad: 'Yatak odası cephesi',
    mekanId: 'konut-yatak-odalari',
    // Çevresel gürültü göstergesi Lgag (dBA). 58 dBA, C sınıfı hedefinde
    // EK-3 Tablo 3.1'e göre I/II/III hassasiyet için 36/33/30 dB gereksinim
    // verir; proje verisi varsa cephe kaydından değiştirilir.
    disGurultu: 58,
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
  // Ön bölüm, sürüm 1.4 ile eklendi; daha eski projelerde hiç yoktur.
  // Eksik alanları tek tek tamamlamak, kullanıcının kaydettiği ön bölümü
  // silmeden yeni alanların da varsayılanla gelmesini sağlar.
  const varsayilan = bosOnBolum();
  if (!d.onbolum || typeof d.onbolum !== 'object') {
    d.onbolum = varsayilan;
  } else {
    for (const [k, v] of Object.entries(varsayilan)) {
      if (d.onbolum[k] === undefined) d.onbolum[k] = v;
    }
    for (const [k, v] of Object.entries(varsayilan.cevresel)) {
      if (d.onbolum.cevresel?.[k] === undefined) {
        d.onbolum.cevresel = { ...varsayilan.cevresel, ...(d.onbolum.cevresel || {}) };
        break;
      }
    }
    if (!Array.isArray(d.onbolum.gorseller)) d.onbolum.gorseller = [];
    if (!Array.isArray(d.onbolum.oneriler)) d.onbolum.oneriler = [];
  }

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
  p.proje.il = 'Ankara';
  p.proje.ilce = 'Çankaya';
  p.proje.mahalle = 'Bağlar';
  p.proje.pafta = '12';
  p.proje.ada = '1234';
  p.proje.parsel = '5';
  p.proje.adres = 'Örnek Sokak No: 3';
  p.proje.insaatYili = '2026';
  p.proje.kapaliAlan = '1250';
  p.proje.toplamInsaatAlani = '3400';
  p.proje.isverenAdres = 'Örnek Cad. No: 10, Çankaya / Ankara';
  p.proje.odaSicil = '00000';
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

/* ── Künye metin yardımcıları ───────────────────────────────────────
   Ada/parsel ve adres, künyede ayrı alanlarda tutulur ama raporda ve
   EK-10 belgesinde tek satır olarak basılır. Alanlar boşsa satır da boş
   kalır; hiçbir yerde "undefined" ya da yarım kalmış ayraç görünmez. */

/** "1234 ada / 5 parsel" — ada/parsel boşsa eski serbest metne düşer. */
export function adaParselMetni(p) {
  const parcalar = [];
  if (p?.pafta) parcalar.push(`${p.pafta} pafta`);
  if (p?.ada) parcalar.push(`${p.ada} ada`);
  if (p?.parsel) parcalar.push(`${p.parsel} parsel`);
  return parcalar.length ? parcalar.join(' / ') : (p?.adaParsel || '');
}

/** "Bağlar Mah., Sokak No:3, Çankaya / Ankara" biçiminde tek satır adres. */
export function adresMetni(p) {
  const parcalar = [];
  if (p?.mahalle) parcalar.push(`${p.mahalle} Mah.`);
  if (p?.adres) parcalar.push(p.adres);
  const ilce = [p?.ilce, p?.il].filter(Boolean).join(' / ');
  if (ilce) parcalar.push(ilce);
  return parcalar.join(', ');
}

/** Alan bilgilerini "Kapalı 1.250 m² · Toplam 3.400 m²" biçiminde özetler. */
export function alanMetni(p) {
  const parcalar = [];
  if (p?.kapaliAlan) parcalar.push(`Kapalı ${p.kapaliAlan} m²`);
  if (p?.toplamInsaatAlani) parcalar.push(`Toplam ${p.toplamInsaatAlani} m²`);
  return parcalar.join(' · ');
}
