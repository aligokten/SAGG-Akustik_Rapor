/**
 * performans-belgesi.js — EK-10 "Akustik Performans Belgesi" verisini üretir.
 *
 * Belge, projedeki tüm bileşenleri altı değerlendirme ölçütünde toplar ve
 * her ölçüt için tek bir akustik performans sınıfı belirler.
 *
 * EK-10 §10.1(9): "Farklı bağımsız birimler, odalar veya akustik özellikler
 * değişik performans sınıflarını gösteriyorsa, elde edilen EN ALT performans
 * sınıfı değeri atanır."  Toplam satırı da aynı kuralla belirlenir.
 *
 * EK-10 §10.2(3): Ölçülemeyen / hesaplanmayan bir ölçüt için belgeye
 * "performans belirlenemedi" yazılır — burada `sinif: null` ile temsil edilir.
 */

import { SINIFLAR } from '../veri/yonetmelik.js';

/** Belgedeki altı değerlendirme ölçütü (resmî belgedeki sıra ve adlandırma). */
export const OLCUTLER = [
  { no: 1, id: 'icGurultu',  ad: 'İç gürültü düzeyleri',        gosterge: 'LAeq' },
  { no: 2, id: 'cephe',      ad: 'Dış yapı elemanı yalıtımı',   gosterge: 'DnT,A,tr' },
  { no: 3, id: 'hava',       ad: 'Hava doğuşlu ses',            gosterge: 'DnT,A',  grup: 'İç yapı elemanı yalıtımı' },
  { no: 4, id: 'darbe',      ad: 'Darbe sesi',                  gosterge: "L'nT,w", grup: 'İç yapı elemanı yalıtımı' },
  { no: 5, id: 'tesisat',    ad: 'Tesisat gürültüsü',           gosterge: 'LAeq,nT / LAF,max,nT' },
  { no: 6, id: 'reverb',     ad: 'Reverberasyon süresi (T)',    gosterge: 'T' },
];

/** İki sınıftan performansı daha düşük olanı verir (A en yüksek, F en düşük). */
export function enDusukSinif(a, b) {
  if (!a) return b;
  if (!b) return a;
  return SINIFLAR.indexOf(a) >= SINIFLAR.indexOf(b) ? a : b;
}

/**
 * Bir değerlendirme kümesini tek bir ölçüt satırına indirger.
 *
 * @param {Object[]} degerlendirmeler `eldeEdilenSinif` taşıyan kayıtlar
 * @returns {{ornek:number, toplam:number, enDusuk:number|null, enYuksek:number|null, sinif:string|null}}
 */
export function olcutOzeti(degerlendirmeler) {
  const gecerli = (degerlendirmeler || []).filter(Boolean);
  const degerler = gecerli.map((d) => d.hesaplanan).filter(Number.isFinite);
  const siniflar = gecerli.map((d) => d.eldeEdilenSinif).filter(Boolean);

  return {
    ornek: gecerli.length,
    toplam: gecerli.length,
    enDusuk: degerler.length ? Math.min(...degerler) : null,
    enYuksek: degerler.length ? Math.max(...degerler) : null,
    // Ölçütün sınıfı, o ölçütteki en kötü bileşen tarafından belirlenir.
    sinif: siniflar.length ? siniflar.reduce(enDusukSinif, null) : null,
  };
}

/**
 * Hesap sonuçlarından belge verisini üretir.
 *
 * @param {Object} s `projeyiHesapla` çıktısı
 * @returns {{satirlar:Object[], toplamSinif:string|null, belirlenemeyen:string[]}}
 */
export function belgeVerisi(s) {
  const kume = {
    // İç gürültü ve tesisat gürültüsü bu araçta hesaplanmaz: yönetmelik
    // bunları ölçüme dayandırır (EK-10 §10.1/4). Belgede "belirlenemedi".
    icGurultu: [],
    cephe: (s.cepheler || []).map((x) => x.degerlendirme),
    hava:  (s.ayiricilar || []).map((x) => x.degerlendirme),
    darbe: (s.darbeler || []).map((x) => x.degerlendirme),
    tesisat: [],
    reverb: (s.hacimler || []).map((x) => x.degerlendirme),
  };

  const satirlar = OLCUTLER.map((o) => ({ ...o, ...olcutOzeti(kume[o.id]) }));
  const siniflar = satirlar.map((r) => r.sinif).filter(Boolean);

  return {
    satirlar,
    // Binanın/bağımsız birimin sınıfı, ölçütlerin en düşüğüdür.
    toplamSinif: siniflar.length ? siniflar.reduce(enDusukSinif, null) : null,
    belirlenemeyen: satirlar.filter((r) => !r.sinif).map((r) => r.ad),
  };
}

/** Reverberasyon değerlendirmesi sınıf üretmez; belgede sınıfa çevirir. */
export function reverberasyonSinifi(d) {
  if (!d || !Number.isFinite(d.hesaplanan)) return null;
  // EK-6 Tablo 6.1 tek bir sınır verir ve bu sınır C–D bandı içindir.
  if (d.Tmax == null) return null;
  return d.uygun ? 'C' : 'E';
}
