/**
 * hazir-gorseller.js — Projeden projeye taşınan "hazır" ön bölüm görselleri.
 *
 * Akustik uzman belgesi ve firmanın standart nokta detayları her raporda
 * aynıdır; her projede yeniden yüklenmeleri gerekmesin diye bu tarayıcıda
 * (ya da masaüstü uygulamasında) kalıcı bir kitaplıkta saklanır. Kitaplıkta
 * "otomatik" işaretli olanlar her yeni projeye kendiliğinden eklenir;
 * diğerleri ön bölüm sekmesinden tek tıkla eklenir.
 *
 * Görseller taranmış belge boyutunda olabildiğinden localStorage yerine
 * IndexedDB kullanılır (localStorage'ın ~5 MB'lık kotası proje verisine
 * ayrılmıştır). Kitaplık açılışta bir kez belleğe okunur; arayüz bellekteki
 * kopyayı eşzamanlı okur, yazmalar arka planda depoya işlenir.
 *
 * Kitaplık bu cihaza/tarayıcıya özeldir: başka bir bilgisayara ya da başka
 * bir kullanıcının hesabına geçmez.
 */

import { yeniId } from '../arayuz/ortak.js';

/** Kitaplıkta tutulabilen görsel türleri (bkz. GORSEL_BOLUMLERI). */
export const HAZIR_TURLER = ['uzmanBelgesi', 'noktaDetay'];

const VT_ADI = 'sagg-akustik-hazir-gorseller';
const DEPO = 'gorseller';

/** Tarayıcının IndexedDB'si üzerinde kitaplık deposu. */
function indexedDbDeposu() {
  let vtSozu = null;
  const vt = () => {
    vtSozu ??= new Promise((coz, reddet) => {
      const istek = indexedDB.open(VT_ADI, 1);
      istek.onupgradeneeded = () => istek.result.createObjectStore(DEPO, { keyPath: 'id' });
      istek.onsuccess = () => coz(istek.result);
      istek.onerror = () => reddet(istek.error);
    });
    return vtSozu;
  };
  const islem = async (kip, is) => {
    const db = await vt();
    return new Promise((coz, reddet) => {
      const tx = db.transaction(DEPO, kip);
      const sonuc = is(tx.objectStore(DEPO));
      tx.oncomplete = () => coz(sonuc?.result);
      tx.onerror = () => reddet(tx.error);
      tx.onabort = () => reddet(tx.error);
    });
  };
  return {
    hepsi: () => islem('readonly', (d) => d.getAll()),
    yaz: (kayit) => islem('readwrite', (d) => d.put(kayit)),
    sil: (id) => islem('readwrite', (d) => d.delete(id)),
  };
}

let depo = null;
let liste = [];
let hazir = false;

/** Testler için depoyu değiştirir (hepsi/yaz/sil sözleri dönen bir nesne). */
export function depoAyarla(yeniDepo) {
  depo = yeniDepo;
  liste = [];
  hazir = false;
}

function depoAl() {
  if (!depo && typeof indexedDB !== 'undefined') depo = indexedDbDeposu();
  return depo;
}

/** Kitaplığı depodan belleğe okur. Depo yoksa ya da açılamazsa boş kalır. */
export async function yukle() {
  try {
    const d = depoAl();
    const kayitlar = d ? await d.hepsi() : [];
    liste = (kayitlar || [])
      .filter((k) => k && HAZIR_TURLER.includes(k.tur) && k.veri)
      .sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
    hazir = !!d;
  } catch {
    liste = [];
    hazir = false;
  }
  return liste;
}

/** Kitaplık kullanılabilir mi (IndexedDB açıldı mı)? */
export function kullanilabilir() {
  return hazir;
}

/** Bellekteki kitaplık; `tur` verilirse yalnızca o türdekiler. */
export function hazirGorseller(tur) {
  return tur ? liste.filter((k) => k.tur === tur) : [...liste];
}

/** Bu görüntü kitaplıkta zaten var mı? */
export function kitaplikta(veri) {
  return !!veri && liste.some((k) => k.veri === veri);
}

/**
 * Projedeki bir görseli kitaplığa ekler. Aynı görüntü zaten varsa yalnızca
 * başlık ve açıklaması güncellenir. Yeni kayıt "otomatik" başlar: kullanıcı
 * belgeyi sakladığında amacı onu her projede hazır bulmaktır.
 */
export async function kaydet(gorsel) {
  if (!gorsel?.veri || !HAZIR_TURLER.includes(gorsel.tur)) return null;
  const d = depoAl();
  if (!d) throw new Error('Bu ortamda kalıcı depolama kullanılamıyor.');
  const var_ = liste.find((k) => k.veri === gorsel.veri);
  const kayit = var_
    ? { ...var_, baslik: gorsel.baslik || '', aciklama: gorsel.aciklama || '' }
    : {
        id: yeniId('h'),
        tur: gorsel.tur,
        baslik: gorsel.baslik || '',
        aciklama: gorsel.aciklama || '',
        veri: gorsel.veri,
        otomatik: true,
        sira: liste.reduce((m, k) => Math.max(m, k.sira ?? 0), 0) + 1,
      };
  await d.yaz(kayit);
  liste = var_ ? liste.map((k) => (k.id === kayit.id ? kayit : k)) : [...liste, kayit];
  return kayit;
}

export async function otomatikAyarla(id, otomatik) {
  const k = liste.find((x) => x.id === id);
  const d = depoAl();
  if (!k || !d) return;
  const yeni = { ...k, otomatik: !!otomatik };
  await d.yaz(yeni);
  liste = liste.map((x) => (x.id === id ? yeni : x));
}

export async function sil(id) {
  const d = depoAl();
  if (!d) return;
  await d.sil(id);
  liste = liste.filter((x) => x.id !== id);
}

/**
 * Kitaplık kayıtlarını projenin ön bölümüne kopyalar. Projede aynı görüntü
 * zaten varsa o kayıt atlanır, böylece iki kez eklenmez.
 *
 * @returns {number} Eklenen görsel sayısı.
 */
export function projeyeEkle(durum, kayitlar) {
  const gorseller = durum?.onbolum?.gorseller;
  if (!Array.isArray(gorseller)) return 0;
  let sayi = 0;
  for (const k of kayitlar) {
    if (!k?.veri || gorseller.some((g) => g.veri === k.veri)) continue;
    gorseller.push({
      id: yeniId('g'), tur: k.tur, baslik: k.baslik || '', aciklama: k.aciklama || '', veri: k.veri,
    });
    sayi += 1;
  }
  return sayi;
}

/** Yeni bir projeye "otomatik" işaretli tüm hazır görselleri ekler. */
export function otomatikleriEkle(durum) {
  return projeyeEkle(durum, liste.filter((k) => k.otomatik));
}
