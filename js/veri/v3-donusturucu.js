/**
 * v3-donusturucu.js — "Katmanlı Model v3" JSON şemasını (room1/room2 +
 * surfaces: separator/f1-f4) SAGG proje biçimine dönüştürür.
 *
 * Bu şema, tek bir ayırıcı eleman + dört yan elemandan oluşan odaklı bir
 * hesap dosyasını tanımlar (ID1, ID2, ID3, DOS1 gibi). İçe aktarıldığında
 * SAGG projesinde TEK bir ayırıcı eleman kaydı olarak açılır; proje daha
 * sonra ek ayırıcı/döşeme/cephe/hacim kayıtlarıyla genişletilebilir.
 *
 * Katman dönüşümü: v3'teki her katman yalnızca ad/kalınlık/yoğunluk taşır
 * (rol etiketi olsa da gerçek bir hava boşluğu kavramı yoktur); bu nedenle
 * tüm katmanlar BAĞLI (masif/sıva) olarak aktarılır — 'finish' rolündekiler
 * 'siva', diğerleri 'masif' türünde. Bu, v3 aracının kendi davranışıyla
 * birebir örtüşür (yalnızca toplam kütleden kütle kanunu).
 */

import { bosProje, yeniAyirici } from '../durum.js';

/** Ayırıcı yüzey kodunu kendi yön kodlarımıza çevirir. */
function ayiriciYonCoz(separatorFace) {
  const s = String(separatorFace || '').toLowerCase();
  if (s.includes('floor') || s.includes('lw') || s.includes('taban') || s.includes('tavan')) return 'taban';
  if (s.includes('lh')) return 'sol';
  if (s.includes('wh')) return 'on';
  return 'on';
}

/** v3 katman kaydını kendi katman şemamıza çevirir. */
function katmaniDonustur(katman) {
  const tur = katman.role === 'finish' ? 'siva' : 'masif';
  return {
    tur,
    ad: katman.name || (tur === 'siva' ? 'Sıva' : 'Malzeme'),
    kalinlik: Number(katman.defaultMm) || 0,
    yogunluk: Number(katman.density) || 0,
  };
}

/**
 * v3 JSON'unu bir SAGG projesine dönüştürür.
 * @param {Object} v3 Ayrıştırılmış JSON içeriği
 * @returns {Object} bosProje() biçiminde bir SAGG projesi
 */
export function v3ProjeyiDonustur(v3) {
  const p = bosProje();
  const pr = p.proje;

  pr.ad = v3.projectName || '';
  pr.kod = v3.projectCode || '';
  pr.adaParsel = v3.parcel || '';
  pr.isveren = v3.employer || '';
  pr.muellif = v3.architect || '';
  pr.akustikUzman = v3.author || '';
  if (v3.date) pr.tarih = v3.date;
  if (v3.buildingType) pr.binaTuru = v3.buildingType;
  if (v3.buildingStatus) pr.durum = v3.buildingStatus;
  if (v3.targetClass) pr.hedefSinif = v3.targetClass;
  if (v3.rwModel) pr.rwModeli = v3.rwModel;
  if (Number.isFinite(v3.referenceT0)) pr.T0 = v3.referenceT0;
  if (Number.isFinite(v3.safetyMargin)) pr.emniyetPayi = v3.safetyMargin;
  pr.notlar = v3.projectNotes || '';

  const yon = ayiriciYonCoz(v3.separatorFace);
  const ayirici = yeniAyirici();
  ayirici.ad = `${v3.room1?.name || 'Oda 1'} → ${v3.room2?.name || 'Oda 2'}`;
  if (v3.sourceRoomUseId) ayirici.kaynakMekanId = v3.sourceRoomUseId;
  if (v3.receiverRoomUseId) ayirici.aliciMekanId = v3.receiverRoomUseId;
  ayirici.geometri = {
    mod: 'olculer',
    oda1: { L: v3.room1?.length, W: v3.room1?.width, H: v3.room1?.height },
    oda2: { L: v3.room2?.length, W: v3.room2?.width, H: v3.room2?.height },
    yon,
  };

  const ayiriciYuzey = v3.surfaces?.separator;
  ayirici.katmanlar = (ayiriciYuzey?.layers || []).map(katmaniDonustur);
  if (Number.isFinite(ayiriciYuzey?.declaredRw)) ayirici.RwBeyan = ayiriciYuzey.declaredRw;

  // v3'ün F1-F4 sırası, ayırıcı yönüne göre kendi 4-flank dizinimize
  // (0,1 = yan duvar rolü → kısa kenar lf; 2,3 = taban/tavan rolü → uzun
  // kenar lf) eşlenir:
  //   duvar ayırıcı  : F1→0(yanDuvar) F2→3(tabanTavan) F3→1(yanDuvar) F4→2(tabanTavan)
  //   taban ayırıcı  : F1→2(tabanTavan) F2→0(yanDuvar) F3→3(tabanTavan) F4→1(yanDuvar)
  //
  // Döşeme ayırıcıda dört yan elemanın hepsi düşey duvardır; rol etiketi
  // yalnızca hangi döşeme kenarı boyunca birleştiklerini (lf) seçer.
  // v3 aracı Ön/Arka yüzeyleri döşemenin UZUN kenarına (min L), Sol/Sağ
  // yüzeyleri KISA kenarına (min W) oturtur; eşleşme buna göre kurulmuştur.
  // Bu, DOS1 referans raporunu birebir (R'w 49,9 / DnT,w 49,3) yeniden üretir;
  // ters eşleşme yan yolları ±3,15 dB kaydırıp sonucu 1,6 dB düşürüyordu.
  const hedefIndeks = yon === 'taban' ? [2, 0, 3, 1] : [0, 3, 1, 2];
  const etiketler = yon === 'taban'
    ? ['Ön yan duvar', 'Sol yan duvar', 'Arka yan duvar', 'Sağ yan duvar']
    : ['Ön yan eleman', 'Tavan', 'Arka yan eleman', 'Döşeme'];

  ['f1', 'f2', 'f3', 'f4'].forEach((anahtar, i) => {
    const yuzey = v3.surfaces?.[anahtar];
    if (!yuzey) return;
    const ye = ayirici.yanElemanlar[hedefIndeks[i]];
    ye.ad = etiketler[i];
    ye.katmanlar = (yuzey.layers || []).map(katmaniDonustur);
    ye.birlesim = yuzey.jointType === 'X' ? 'X' : 'T';
    ye.esnekBaglanti = !!yuzey.elastic;
    if (Number.isFinite(yuzey.declaredRw)) ye.RwBeyan = yuzey.declaredRw;
  });

  p.ayiricilar = [ayirici];
  return p;
}

/** Bir JSON nesnesinin v3 içe aktarma şemasına uyup uymadığını denetler. */
export function v3SemasiMi(veri) {
  return !!(veri && veri.version === 3 && veri.surfaces && (veri.room1 || veri.room2));
}
