/**
 * hesap.js — Proje verisini hesap çekirdeğine bağlayan katman.
 * Durum nesnesini alır, tüm bileşenler için hesap ve değerlendirme üretir.
 */

import { rwKestir } from './cekirdek/kutle-kanunu.js';
import { havaDogusluYalitim, bilesikRw } from './cekirdek/en12354-1.js';
import { darbeSesiYalitimi } from './cekirdek/en12354-2.js';
import {
  cepheYalitimi, cepheGeometrisi, yanElemanBaglantilari, CEPHE_YAN_ROLLERI,
} from './cekirdek/en12354-3.js';
import { dogramaAlani } from './durum.js';
import { reverberasyonSuresi } from './cekirdek/reverberasyon.js';
import {
  havaDogusluDegerlendir, darbeSesiDegerlendir, cepheDegerlendir,
  reverberasyonDegerlendir, genelSinif,
} from './cekirdek/degerlendirme.js';
import {
  DUVARLAR, DOSEMELER, DOGRAMALAR, SIVALAR, GIYDIRME_KABUKLAR,
  SAP_KAPLAMALAR, SOGURUCULAR, NESNELER, KUCUK_ELEMANLAR, YALITIM_LEVHALARI,
  elemanAlanKutlesi, bul,
} from './veri/malzemeler.js';
import { rezonansFrekansi, rezonansYorumu } from './cekirdek/temel.js';
import { katmanliElemaniCoz } from './cekirdek/katmanli-eleman.js';
import { geometriHesapla } from './cekirdek/geometri.js';

/** Tüm yapı elemanları tek listede (duvar + döşeme). */
export const TUM_ELEMANLAR = [...DUVARLAR, ...DOSEMELER];

/**
 * Bir yapı elemanı tanımından alan kütlesi ve Rw'yi çözer.
 * @param {Object} tanim
 * @param {string} tanim.elemanId
 * @param {string} [tanim.sivaId]
 * @param {number} [tanim.sivaliYuzSayisi]
 * @param {number|null} [tanim.RwBeyan]        Beyan edilmiş Rw (dB)
 * @param {number|null} [tanim.yogunlukBeyan]  Ürünün gerçek birim hacim ağırlığı (kg/m³)
 * @param {string} model Rw kestirim modeli
 */
export function elemanCoz(tanim, model = 'en12354') {
  const eleman = bul(TUM_ELEMANLAR, tanim.elemanId) || bul(DOGRAMALAR, tanim.elemanId);
  if (!eleman) return { ad: '—', mAlan: NaN, Rw: NaN, kaynak: 'bulunamadı' };

  const siva = bul(SIVALAR, tanim.sivaId || 'sivasiz');
  const sivaKutlesi = (siva?.mAlan || 0) * (tanim.sivaliYuzSayisi ?? 0);
  const yogunlukBeyan = Number.isFinite(tanim.yogunlukBeyan) ? tanim.yogunlukBeyan : null;
  const mAlan = elemanAlanKutlesi(eleman, yogunlukBeyan) + sivaKutlesi;

  let Rw, kaynak;
  if (Number.isFinite(tanim.RwBeyan)) {
    Rw = tanim.RwBeyan; kaynak = 'beyan edilmiş (laboratuvar) değeri';
  } else if (Number.isFinite(eleman.Rw)) {
    Rw = eleman.Rw; kaynak = 'kütüphane tipik değeri';
  } else {
    Rw = rwKestir(mAlan, model); kaynak = 'alan kütlesinden kestirim';
  }

  return {
    ad: eleman.ad, eleman, mAlan, Rw, kaynak, sivaKutlesi,
    yogunluk: yogunlukBeyan ?? eleman.yogunluk,
    yogunlukBeyanEdildi: yogunlukBeyan != null,
    katmanli: false, katmanDetay: null,
  };
}

/**
 * Bir yapı elemanı tanımını çözer: `tanim.katmanlar` doluysa çok katmanlı
 * (kullanıcı tanımlı) yapı olarak, aksi hâlde kütüphaneden tek satırlık
 * seçim (elemanCoz) olarak değerlendirilir. İkisi de aynı çıktı şeklini
 * (ad, mAlan, Rw, kaynak, katmanli, katmanDetay) döndürür.
 *
 * @param {Object} tanim
 * @param {string} model Rw kestirim modeli
 */
export function elemanVeyaKatmanCoz(tanim, model = 'en12354') {
  if (tanim?.katmanlar && tanim.katmanlar.length > 0) {
    const r = katmanliElemaniCoz(tanim.katmanlar, {
      dolguBul: (id) => bul(YALITIM_LEVHALARI, id),
      model,
    });

    let Rw = r.Rw;
    let kaynak = r.tur === 'ikiKabuk'
      ? `katmanlı yapı — iki kabuklu (kavite bonusu +${r.dRKavite.toFixed(1)} dB)`
      : 'katmanlı yapı — tek kabuk (kütle kanunu)';
    if (Number.isFinite(tanim.RwBeyan)) {
      Rw = tanim.RwBeyan; kaynak = 'beyan edilmiş (laboratuvar) değeri';
    }

    return {
      ad: 'Katmanlı yapı elemanı', eleman: null, mAlan: r.mAlan, Rw, kaynak,
      sivaKutlesi: 0, yogunluk: null, yogunlukBeyanEdildi: false,
      katmanli: true, katmanDetay: r,
    };
  }
  return elemanCoz(tanim, model);
}

/**
 * Bir giydirme kabuğu çözer: ΔRw, boşluk dolgusu ve rezonans frekansı.
 * @param {string} giydirmeId
 * @param {string|null} dolguId  Kullanıcının seçtiği boşluk dolgusu; yoksa
 *                               sistemin öngördüğü dolgu kullanılır.
 * @param {number} mTasiyici     Giydirmenin uygulandığı elemanın alan kütlesi
 */
export function giydirmeCoz(giydirmeId, dolguId, mTasiyici) {
  const giydirme = bul(GIYDIRME_KABUKLAR, giydirmeId) || GIYDIRME_KABUKLAR[0];
  const secilenDolguId = dolguId || giydirme.dolguOnerisi || 'yok';
  const dolgu = bul(YALITIM_LEVHALARI, secilenDolguId) || YALITIM_LEVHALARI[0];

  const gozenekli = !!dolgu.gozenekli;
  const f0 = giydirme.bosluk > 0
    ? rezonansFrekansi(giydirme.levhaKutlesi, mTasiyici, giydirme.bosluk, gozenekli)
    : NaN;

  // Sistemin öngördüğü dolgu gözenekliyken dolgusuz/sert dolgu seçilirse
  // boşluk sönümlenmez; muhafazakâr bir ceza uygulanır.
  const onerilenGozenekli = !!(bul(YALITIM_LEVHALARI, giydirme.dolguOnerisi || 'yok')?.gozenekli);
  const dolguCezasi = (onerilenGozenekli && !gozenekli) ? -4 : 0;

  return {
    giydirme,
    dolgu,
    dRw: (giydirme.dRw || 0) + dolguCezasi,
    dolguCezasi,
    f0,
    f0Yorum: rezonansYorumu(f0),
  };
}

/** Bir ayırıcı elemanın hesabı. */
export function ayiriciHesapla(a, proje) {
  const model = proje.rwModeli;
  const ana = elemanVeyaKatmanCoz(a, model);
  const giydirmeCozum = giydirmeCoz(a.giydirmeId, a.dolguId, ana.mAlan);
  const giydirme = giydirmeCozum.giydirme;

  // Oda boyutlarından (L×W×H + ayırıcı yön) S, V ve yan eleman birleşim
  // uzunlukları otomatik hesaplanabilir.
  const geo = a.geometri?.mod === 'olculer' ? geometriHesapla(a.geometri) : null;
  const S = geo ? geo.S : a.S;
  const V = geo ? geo.V : a.V;

  // Kapı varsa ayırıcı eleman bileşik hâle gelir.
  let RwAyirici = ana.Rw + giydirmeCozum.dRw;
  let kapiBilgi = null;
  if (a.kapiVar) {
    const kapi = bul(DOGRAMALAR, a.kapiId);
    const Sk = Math.min(a.kapiAlani || 0, S);
    if (kapi && Sk > 0) {
      RwAyirici = bilesikRw([
        { S: S - Sk, Rw: RwAyirici },
        { S: Sk, Rw: kapi.Rw },
      ]);
      kapiBilgi = { ad: kapi.ad, Rw: kapi.Rw, S: Sk };
    }
  }

  const yanElemanlar = (a.yanElemanlar || []).map((y) => {
    const c = elemanVeyaKatmanCoz(y, model);
    const gc = giydirmeCoz(y.giydirmeId, y.dolguId, c.mAlan);
    const dR = gc.dRw;
    // Geometri modunda, standart 4 yan elemanın (iki yan duvar + taban +
    // tavan) birleşim uzunluğu odanın boyutlarından hesaplanır; kullanıcının
    // eklediği ek yan elemanlarda (geometriRolu tanımsız) manuel lf korunur.
    const lf = (geo && y.geometriRolu === 'yanDuvar') ? geo.yanDuvarLf
             : (geo && y.geometriRolu === 'tabanTavan') ? geo.tabanTavanLf
             : y.lf;
    return {
      ad: y.ad,
      RwKaynak: c.Rw, RwAlici: c.Rw,
      mKaynak: c.mAlan, mAlici: c.mAlan,
      lf, birlesim: y.birlesim,
      esnekBaglanti: !!y.esnekBaglanti,
      // Giydirme kabuk yan elemanın her iki ucunda da varsayılır.
      dRFf: dR ? Math.min(2 * dR, 18) : 0,
      dRFd: dR, dRDf: dR,
      _cozum: c, _giydirme: gc,
    };
  });

  const sonuc = havaDogusluYalitim({
    RwAyirici,
    mAyirici: ana.mAlan,
    S, V,
    dRDd: 0,                       // giydirme zaten RwAyirici içinde
    yanElemanlar,
    T0: proje.T0,
    emniyetPayi: proje.emniyetPayi,
  });

  const degerlendirme = havaDogusluDegerlendir({
    kaynakMekanId: a.kaynakMekanId,
    aliciMekanId: a.aliciMekanId,
    DnTw: sonuc.DnTw,
    hedefSinif: proje.hedefSinif,
    manuelHedef: a.manuelHedef,
    komsulukId: a.komsulukId,
  });

  return { kayit: a, ana, giydirme, giydirmeCozum, kapiBilgi, RwAyirici, yanElemanlar, sonuc, degerlendirme, geo };
}

/** Bir döşemenin darbe sesi hesabı. */
export function darbeHesapla(d, proje) {
  const doseme = (d.katmanlar && d.katmanlar.length > 0)
    ? elemanVeyaKatmanCoz(d, proje.rwModeli)
    : elemanCoz({ elemanId: d.dosemeId, sivaId: 'alci-10', sivaliYuzSayisi: 1 }, proje.rwModeli);
  const sap = bul(SAP_KAPLAMALAR, d.sapId);
  const dLw = Number.isFinite(d.dLwBeyan) ? d.dLwBeyan : (sap?.dLw || 0);
  // Yüzer şapın kütlesi taşıyıcı döşemenin kütlesine eklenmez (esnek ayrılmıştır).

  const geo = d.geometri?.mod === 'olculer' ? geometriHesapla(d.geometri) : null;
  const V = geo ? geo.V : d.V;

  const sonuc = darbeSesiYalitimi({
    mDoseme: doseme.mAlan,
    LnwEsdeger: Number.isFinite(d.LnwBeyan) ? d.LnwBeyan : undefined,
    dLw,
    dLwAsmaTavan: d.asmaTavanVar ? (d.asmaTavanKazanci || 0) : 0,
    mYanOrtalama: d.mYanOrtalama,
    V,
    T0: proje.T0,
    emniyetPayi: proje.emniyetPayi,
  });

  const degerlendirme = darbeSesiDegerlendir({
    ustMekanId: d.ustMekanId,
    altMekanId: d.altMekanId,
    LnTw: sonuc.LnTw,
    hedefSinif: proje.hedefSinif,
    manuelHedef: d.manuelHedef,
    komsulukId: d.komsulukId,
  });

  return { kayit: d, doseme, sap, dLw, sonuc, degerlendirme, geo };
}

/** Bir cephenin hesabı. */
export function cepheHesapla(c, proje) {
  // Oda boyutları girilmişse hacim, dış duvar brüt alanları ve iç yan
  // yolların birleşim uzunlukları geometriden türetilir; aksi hâlde yalnızca
  // elle girilen V kullanılır ve yan yol hesabı yapılmaz.
  const geo = c.geometri?.mod === 'olculer'
    ? cepheGeometrisi(c.geometri, c.konum)
    : null;
  const V = geo ? geo.V : c.V;

  // Doğrama alanı en × boy'dan gelir (girilmemişse elle yazılan S korunur).
  const dogramaAlanlari = new Map();
  for (const e of (c.elemanlar || [])) {
    if (e.tur === 'duvar') continue;
    const no = e.duvarNo || 1;
    dogramaAlanlari.set(no, (dogramaAlanlari.get(no) || 0) + dogramaAlani(e));
  }

  /**
   * Geometri modunda opak duvar alanı, o duvarın brüt alanından üzerindeki
   * doğramalar düşülerek bulunur; böylece toplam cephe alanı brüt alana
   * eşitlenir ve doğrama boyutu değiştiğinde opak alan kendiliğinden
   * güncellenir. Hacim modunda kullanıcının girdiği S korunur.
   */
  const opakAlan = (e) => {
    if (!geo || e.tur !== 'duvar') return dogramaAlani(e);
    const no = e.duvarNo || 1;
    const duvar = geo.duvarlar.find((d) => d.no === no);
    if (!duvar) return 0;   // etkin olmayan duvardaki eleman (ör. orta mahalde D2)
    return Math.max(0.1, duvar.alan - (dogramaAlanlari.get(no) || 0));
  };

  const yuzeysel = (c.elemanlar || []).map((e) => {
    const coz = e.tur === 'duvar' ? elemanVeyaKatmanCoz(e, proje.rwModeli) : elemanCoz(e, proje.rwModeli);
    const no = e.duvarNo || 1;
    // Geometri modunda, etkin olmayan duvara atanmış elemanlar hesaba girmez.
    const etkin = !geo || geo.duvarlar.some((d) => d.no === no);
    return {
      ad: e.ad || coz.ad,
      S: etkin ? (e.tur === 'duvar' ? opakAlan(e) : dogramaAlani(e)) : 0,
      Rw: coz.Rw, duvarNo: no, tur: e.tur, etkin, _cozum: coz,
    };
  });
  const kucuk = (c.kucukElemanlar || []).map((k) => {
    const kayit = bul(KUCUK_ELEMANLAR, k.elemanId);
    return { ad: k.ad || kayit?.ad || 'Küçük eleman', adet: k.adet, Dnew: Number.isFinite(k.DnewBeyan) ? k.DnewBeyan : (kayit?.Dnew ?? 40) };
  });

  // Her dış duvarın opak elemanı, o duvarın yan yol hesabında kaynak elemandır.
  const duvarElemani = (no) =>
    yuzeysel.find((y) => y.tur === 'duvar' && y.duvarNo === no)
    || yuzeysel.find((y) => y.tur === 'duvar')
    || null;

  const yanElemanCozumleri = [];
  const yanYollar = [];
  if (geo) {
    for (const y of (c.yanElemanlar || [])) {
      const baglantilar = yanElemanBaglantilari(y.rol, geo);
      const coz = elemanVeyaKatmanCoz(y, proje.rwModeli);
      yanElemanCozumleri.push({ ...y, _cozum: coz, baglantiSayisi: baglantilar.length });
      for (const b of baglantilar) {
        const dis = duvarElemani(b.duvarNo);
        if (!dis) continue;
        yanYollar.push({
          ad: `D${b.duvarNo}f — ${y.ad || CEPHE_YAN_ROLLERI[y.rol]?.ad || 'İç eleman'}`,
          duvarNo: b.duvarNo,
          lf: b.lf,
          RwYan: coz.Rw, mYan: coz.mAlan,
          RwDis: dis.Rw, mDis: dis._cozum.mAlan,
          birlesim: y.birlesim || 'T',
          esnek: !!y.esnekBaglanti,
        });
      }
    }
  }

  const sonuc = cepheYalitimi({
    yuzeyselElemanlar: yuzeysel,
    kucukElemanlar: kucuk,
    V,
    bicim: c.bicim,
    T0: proje.T0,
    emniyetPayi: proje.emniyetPayi,
    ctr: Number.isFinite(c.ctr) ? c.ctr : 0,
    yanYollar,
  });

  // Uygunluk kararı EK-3 Tablo 3.1 ile DnT,A,tr üzerinden verilir
  // (resmî tablonun göstergesi budur; D2m,nT,w değildir).
  const degerlendirme = cepheDegerlendir({
    mekanId: c.mekanId,
    disGurultu: c.disGurultu,
    DnTAtr: sonuc.DnTAtr,
    hedefSinif: proje.hedefSinif,
    manuelHedef: c.manuelHedef,
  });

  return { kayit: c, yuzeysel, kucuk, sonuc, degerlendirme, geo, yanElemanlar: yanElemanCozumleri };
}

/** Bir hacmin reverberasyon hesabı. */
export function hacimHesapla(h) {
  const yuzeyler = (h.yuzeyler || []).map((y) => {
    const s = bul(SOGURUCULAR, y.sogurucuId);
    return { ad: s?.ad || 'Yüzey', alan: y.alan, alfa: s?.alfa || {} };
  });
  const nesneler = (h.nesneler || []).map((n) => {
    const s = bul(NESNELER, n.nesneId);
    return { ad: s?.ad || 'Nesne', adet: n.adet, A: s?.A || {} };
  });

  const sonuc = reverberasyonSuresi({ V: h.V, yuzeyler, nesneler });
  const degerlendirme = reverberasyonDegerlendir({ mekanId: h.mekanId, T: sonuc.Torta });

  return { kayit: h, yuzeyler, nesneler, sonuc, degerlendirme };
}

/** Tüm projeyi hesaplar. */
export function projeyiHesapla(durum) {
  const proje = durum.proje;
  const ayiricilar = (durum.ayiricilar || []).map((a) => ayiriciHesapla(a, proje));
  const darbeler = (durum.darbeler || []).map((d) => darbeHesapla(d, proje));
  const cepheler = (durum.cepheler || []).map((c) => cepheHesapla(c, proje));
  const hacimler = (durum.hacimler || []).map((h) => hacimHesapla(h));

  const tumDegerlendirmeler = [
    ...ayiricilar.map((x) => x.degerlendirme),
    ...darbeler.map((x) => x.degerlendirme),
    ...cepheler.map((x) => x.degerlendirme),
  ].filter(Boolean);

  const uygunsuzlar = [
    ...ayiricilar.filter((x) => x.degerlendirme && !x.degerlendirme.uygun).map((x) => x.kayit.ad),
    ...darbeler.filter((x) => x.degerlendirme && !x.degerlendirme.uygun).map((x) => x.kayit.ad),
    ...cepheler.filter((x) => x.degerlendirme && !x.degerlendirme.uygun).map((x) => x.kayit.ad),
    ...hacimler.filter((x) => x.degerlendirme && !x.degerlendirme.uygun).map((x) => x.kayit.ad),
  ];

  return {
    ayiricilar, darbeler, cepheler, hacimler,
    genelSinif: genelSinif(tumDegerlendirmeler),
    toplamBilesen: tumDegerlendirmeler.length + hacimler.length,
    uygunsuzlar,
    tumUygun: uygunsuzlar.length === 0,
  };
}
