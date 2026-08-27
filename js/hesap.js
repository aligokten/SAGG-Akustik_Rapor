/**
 * hesap.js — Proje verisini hesap çekirdeğine bağlayan katman.
 * Durum nesnesini alır, tüm bileşenler için hesap ve değerlendirme üretir.
 */

import { rwKestir } from './cekirdek/kutle-kanunu.js';
import { havaDogusluYalitim, bilesikRw } from './cekirdek/en12354-1.js';
import { darbeSesiYalitimi } from './cekirdek/en12354-2.js';
import { cepheYalitimi } from './cekirdek/en12354-3.js';
import { reverberasyonSuresi } from './cekirdek/reverberasyon.js';
import {
  havaDogusluDegerlendir, darbeSesiDegerlendir, cepheDegerlendir,
  reverberasyonDegerlendir, genelSinif,
} from './cekirdek/degerlendirme.js';
import {
  DUVARLAR, DOSEMELER, DOGRAMALAR, SIVALAR, GIYDIRME_KABUKLAR,
  SAP_KAPLAMALAR, SOGURUCULAR, NESNELER, KUCUK_ELEMANLAR,
  elemanAlanKutlesi, bul,
} from './veri/malzemeler.js';

/** Tüm yapı elemanları tek listede (duvar + döşeme). */
export const TUM_ELEMANLAR = [...DUVARLAR, ...DOSEMELER];

/**
 * Bir yapı elemanı tanımından alan kütlesi ve Rw'yi çözer.
 * @param {{elemanId:string, sivaId?:string, sivaliYuzSayisi?:number, RwBeyan?:number|null}} tanim
 * @param {string} model Rw kestirim modeli
 */
export function elemanCoz(tanim, model = 'en12354') {
  const eleman = bul(TUM_ELEMANLAR, tanim.elemanId) || bul(DOGRAMALAR, tanim.elemanId);
  if (!eleman) return { ad: '—', mAlan: NaN, Rw: NaN, kaynak: 'bulunamadı' };

  const siva = bul(SIVALAR, tanim.sivaId || 'sivasiz');
  const sivaKutlesi = (siva?.mAlan || 0) * (tanim.sivaliYuzSayisi ?? 0);
  const mAlan = elemanAlanKutlesi(eleman) + sivaKutlesi;

  let Rw, kaynak;
  if (Number.isFinite(tanim.RwBeyan)) {
    Rw = tanim.RwBeyan; kaynak = 'beyan edilmiş (laboratuvar) değeri';
  } else if (Number.isFinite(eleman.Rw)) {
    Rw = eleman.Rw; kaynak = 'kütüphane tipik değeri';
  } else {
    Rw = rwKestir(mAlan, model); kaynak = 'alan kütlesinden kestirim';
  }

  return { ad: eleman.ad, eleman, mAlan, Rw, kaynak, sivaKutlesi };
}

/** Bir ayırıcı elemanın hesabı. */
export function ayiriciHesapla(a, proje) {
  const model = proje.rwModeli;
  const ana = elemanCoz(a, model);
  const giydirme = bul(GIYDIRME_KABUKLAR, a.giydirmeId);

  // Kapı varsa ayırıcı eleman bileşik hâle gelir.
  let RwAyirici = ana.Rw + (giydirme?.dRw || 0);
  let kapiBilgi = null;
  if (a.kapiVar) {
    const kapi = bul(DOGRAMALAR, a.kapiId);
    const Sk = Math.min(a.kapiAlani || 0, a.S);
    if (kapi && Sk > 0) {
      RwAyirici = bilesikRw([
        { S: a.S - Sk, Rw: RwAyirici },
        { S: Sk, Rw: kapi.Rw },
      ]);
      kapiBilgi = { ad: kapi.ad, Rw: kapi.Rw, S: Sk };
    }
  }

  const yanElemanlar = (a.yanElemanlar || []).map((y) => {
    const c = elemanCoz(y, model);
    const g = bul(GIYDIRME_KABUKLAR, y.giydirmeId);
    const dR = g?.dRw || 0;
    return {
      ad: y.ad,
      RwKaynak: c.Rw, RwAlici: c.Rw,
      mKaynak: c.mAlan, mAlici: c.mAlan,
      lf: y.lf, birlesim: y.birlesim,
      esnekBaglanti: !!y.esnekBaglanti,
      // Giydirme kabuk yan elemanın her iki ucunda da varsayılır.
      dRFf: dR ? Math.min(2 * dR, 18) : 0,
      dRFd: dR, dRDf: dR,
      _cozum: c, _giydirme: g,
    };
  });

  const sonuc = havaDogusluYalitim({
    RwAyirici,
    mAyirici: ana.mAlan,
    S: a.S, V: a.V,
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
  });

  return { kayit: a, ana, giydirme, kapiBilgi, RwAyirici, yanElemanlar, sonuc, degerlendirme };
}

/** Bir döşemenin darbe sesi hesabı. */
export function darbeHesapla(d, proje) {
  const doseme = elemanCoz({ elemanId: d.dosemeId, sivaId: 'alci-10', sivaliYuzSayisi: 1 }, proje.rwModeli);
  const sap = bul(SAP_KAPLAMALAR, d.sapId);
  const dLw = Number.isFinite(d.dLwBeyan) ? d.dLwBeyan : (sap?.dLw || 0);
  // Yüzer şapın kütlesi taşıyıcı döşemenin kütlesine eklenmez (esnek ayrılmıştır).

  const sonuc = darbeSesiYalitimi({
    mDoseme: doseme.mAlan,
    LnwEsdeger: Number.isFinite(d.LnwBeyan) ? d.LnwBeyan : undefined,
    dLw,
    dLwAsmaTavan: d.asmaTavanVar ? (d.asmaTavanKazanci || 0) : 0,
    mYanOrtalama: d.mYanOrtalama,
    V: d.V,
    T0: proje.T0,
    emniyetPayi: proje.emniyetPayi,
  });

  const degerlendirme = darbeSesiDegerlendir({
    ustMekanId: d.ustMekanId,
    altMekanId: d.altMekanId,
    LnTw: sonuc.LnTw,
    hedefSinif: proje.hedefSinif,
  });

  return { kayit: d, doseme, sap, dLw, sonuc, degerlendirme };
}

/** Bir cephenin hesabı. */
export function cepheHesapla(c, proje) {
  const yuzeysel = (c.elemanlar || []).map((e) => {
    const coz = elemanCoz(e, proje.rwModeli);
    return { ad: e.ad || coz.ad, S: e.S, Rw: coz.Rw, _cozum: coz };
  });
  const kucuk = (c.kucukElemanlar || []).map((k) => {
    const kayit = bul(KUCUK_ELEMANLAR, k.elemanId);
    return { ad: k.ad || kayit?.ad || 'Küçük eleman', adet: k.adet, Dnew: Number.isFinite(k.DnewBeyan) ? k.DnewBeyan : (kayit?.Dnew ?? 40) };
  });

  const sonuc = cepheYalitimi({
    yuzeyselElemanlar: yuzeysel,
    kucukElemanlar: kucuk,
    V: c.V,
    bicim: c.bicim,
    T0: proje.T0,
    emniyetPayi: proje.emniyetPayi,
  });

  const degerlendirme = cepheDegerlendir({
    mekanId: c.mekanId,
    disGurultu: c.disGurultu,
    D2mnTw: sonuc.D2mnTw,
    hedefSinif: proje.hedefSinif,
  });

  return { kayit: c, yuzeysel, kucuk, sonuc, degerlendirme };
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
