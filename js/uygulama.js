/**
 * uygulama.js — Uygulamanın giriş noktası: durum yönetimi, sekme yönlendirme,
 * olay bağlama ve dosya işlemleri.
 */

import { $, $$, sayiOku, yeniId, aramaMetni, katlamayiDegistir, tumunuKatla } from './arayuz/ortak.js';
import { simge } from './arayuz/simgeler.js';
import * as YK from './cekirdek/katmanli-eleman.js';
import { DUVARLAR, DOSEMELER, SIVALAR, bul as malzemeBul } from './veri/malzemeler.js';
import { odaSVG, cepheSVG } from './arayuz/oda-cizimi.js';
import { v3ProjeyiDonustur, v3SemasiMi } from './veri/v3-donusturucu.js';
import * as FAV from './veri/favoriler.js';
import { favoriTaslaginiAyarla, favoriTaslaginiOku, favoriTaslaginiTemizle } from './arayuz/katman-editor.js';
import * as D from './durum.js';
import { projeyiHesapla } from './hesap.js';
import * as sekmePanel from './arayuz/sekme-panel.js';
import * as sekmeProje from './arayuz/sekme-proje.js';
import * as sekmeOnBolum from './arayuz/sekme-onbolum.js';
import * as sekmeAyirici from './arayuz/sekme-ayirici.js';
import * as sekmeDarbe from './arayuz/sekme-darbe.js';
import * as sekmeCephe from './arayuz/sekme-cephe.js';
import * as sekmeReverberasyon from './arayuz/sekme-reverberasyon.js';
import * as sekmeKutuphane from './arayuz/sekme-kutuphane.js';
import * as sekmeYonetmelik from './arayuz/sekme-yonetmelik.js';
import * as sekmeRapor from './arayuz/sekme-rapor.js';
import {
  EK2_TABLO_2_1, EK3_TABLO_3_1, EK3_TABLO_3_2, EK3_TABLO_3_3,
  EK3_TABLO_3_4, EK3_TABLO_3_5,
  EK4_TABLO_4_1, EK6_TABLO_6_1, veriPaketi, SURUM,
} from './veri/yonetmelik.js';

const YONETMELIK_DEPO = 'sagg-akustik-yonetmelik-v1';
const YONETMELIK_TABLOLARI = {
  EK2_TABLO_2_1, EK3_TABLO_3_1, EK3_TABLO_3_2, EK3_TABLO_3_3,
  EK3_TABLO_3_4, EK3_TABLO_3_5,
  EK4_TABLO_4_1, EK6_TABLO_6_1,
};

// Kayıtlı bir çalışma varsa ondan devam edilir; yoksa panel boş bir projeyle
// açılır. Örnek proje yalnızca üst çubuktaki "Örnek proje" düğmesiyle yüklenir.
let durum = D.yukle() || D.bosProje();
let etkinSekme = 'panel';

const TEMA_DEPO = 'sagg-akustik-tema';

/**
 * Kenar çubuğu menüsü. `sayim`, o bölümdeki bileşen sayısını verir;
 * `eksik` ise gereksinimi sağlamayan bileşen sayısını verir.
 */
const SEKMELER = [
  { grup: 'Genel', id: 'panel',   ad: 'Panel',              simge: '▤',
    baslik: 'Panel', yol: 'Akustik performans genel görünümü' },
  { id: 'proje',   ad: 'Proje künyesi',      simge: '▣',
    baslik: 'Proje künyesi', yol: 'Künye, hedef sınıf ve hesap ayarları' },
  { id: 'onbolum', ad: 'Rapor ön bölümü', simge: '▧',
    baslik: 'Rapor ön bölümü', yol: 'Giriş, çevresel gürültü, anahtar paftalar ve sonuç',
    sayim: (d) => (d.onbolum?.gorseller || []).length },

  { grup: 'Hesaplar', id: 'ayirici', ad: 'Ayırıcı elemanlar', simge: '▥',
    baslik: 'Ayırıcı elemanlarda hava doğuşlu ses yalıtımı', yol: 'TS EN 12354-1 · DnT,A · EK-3 Tablo 3.2',
    sayim: (d) => d.ayiricilar.length, eksik: (s) => s.ayiricilar.filter((x) => x.degerlendirme && !x.degerlendirme.uygun).length },
  { id: 'darbe',   ad: 'Darbe sesi',         simge: '▤',
    baslik: 'Döşemelerde darbe sesi yalıtımı', yol: "TS EN 12354-2 · L'nT,w · EK-3 Tablo 3.3",
    sayim: (d) => d.darbeler.length, eksik: (s) => s.darbeler.filter((x) => x.degerlendirme && !x.degerlendirme.uygun).length },
  { id: 'cephe',   ad: 'Cephe',              simge: '▦',
    baslik: 'Cephede (dış yapı elemanı) ses yalıtımı', yol: 'TS EN 12354-3 · DnT,A,tr · EK-3 Tablo 3.1',
    sayim: (d) => d.cepheler.length, eksik: (s) => s.cepheler.filter((x) => x.degerlendirme && !x.degerlendirme.uygun).length },
  { id: 'reverberasyon', ad: 'Reverberasyon', simge: '◍',
    baslik: 'Reverberasyon (çınlama) süresi', yol: 'Sabine bağıntısı · EK-6 Tablo 6.1',
    sayim: (d) => d.hacimler.length, eksik: (s) => s.hacimler.filter((x) => x.degerlendirme && !x.degerlendirme.uygun).length },

  { grup: 'Başvuru', id: 'kutuphane', ad: 'Malzeme kütüphanesi',
    baslik: 'Malzeme kütüphanesi', yol: 'Yapı elemanları, yalıtım ürünleri ve yüzey kaplamaları' },
  { id: 'yonetmelik', ad: 'Yönetmelik verileri', simge: '⚖',
    baslik: 'Yönetmelik verileri', yol: 'EK-2 – EK-6 sınır değerleri · düzenlenebilir' },
  { id: 'rapor',   ad: 'Akustik rapor',      simge: '🖹',
    baslik: 'Akustik rapor', yol: 'Yazdırılabilir özet çıktı' },
];

/* ── Durum yolu okuma / yazma ───────────────────────────────────────── */

function yolAyarla(nesne, yol, deger) {
  const parcalar = yol.split('.');
  let hedef = nesne;
  for (const p of parcalar.slice(0, -1)) {
    if (hedef == null) return;
    hedef = hedef[p];
  }
  if (hedef != null) hedef[parcalar[parcalar.length - 1]] = deger;
}

/** Nokta ayraçlı bir yoldaki nesneyi okur (bulunamazsa undefined). */
function yolDegerAl(nesne, yol) {
  return yol.split('.').reduce((h, p) => (h == null ? h : h[p]), nesne);
}

function degerCoz(el) {
  const tur = el.dataset.tur;
  if (tur === 'sayi') return sayiOku(el.value, 0);
  if (tur === 'bool') return el.checked;
  if (tur === 'sayiVeyaNull') {
    return el.value.trim() === '' ? null : sayiOku(el.value, null);
  }
  return el.value;
}

/**
 * Binanın resmini okur ve proje verisine data: URL olarak gömer.
 *
 * Resim proje JSON'unun içinde taşınır (harici dosya bağımlılığı olmaz).
 * localStorage kotasını doldurmamak için 2 MB üstü dosyalar reddedilir.
 */
const BINA_RESMI_SINIRI = 2 * 1024 * 1024;

function binaResminiOku(dosya) {
  if (!dosya.type.startsWith('image/')) {
    alert('Lütfen bir resim dosyası seçin.');
    return;
  }
  if (dosya.size > BINA_RESMI_SINIRI) {
    alert(`Resim çok büyük (${(dosya.size / 1024 / 1024).toFixed(1)} MB). En çok 2 MB olmalı.`);
    return;
  }
  const okuyucu = new FileReader();
  okuyucu.onload = () => {
    durum.proje.binaResmi = String(okuyucu.result || '');
    ciz();
  };
  okuyucu.onerror = () => alert('Resim okunamadı.');
  okuyucu.readAsDataURL(dosya);
}

/* ── Rapor ön bölümü: görseller ─────────────────────────────────────── */

/**
 * Kat planı / kesit / detay görselini okur ve ön bölüm kaydına gömer.
 *
 * Çizimler binanın resminden büyük olduğundan sınır daha yüksek tutulur;
 * yine de localStorage kotasını (tipik 5 MB) tek çizimle doldurmamak için
 * bir üst sınır gerekir.
 */
const GORSEL_SINIRI = 4 * 1024 * 1024;

function gorseliOku(id, dosya) {
  if (!dosya.type.startsWith('image/')) {
    alert('Lütfen bir resim dosyası seçin (PNG, JPG veya SVG).');
    return;
  }
  if (dosya.size > GORSEL_SINIRI) {
    alert(`Görsel çok büyük (${(dosya.size / 1024 / 1024).toFixed(1)} MB). En çok 4 MB olmalı.`);
    return;
  }
  const kayit = (durum.onbolum?.gorseller || []).find((g) => g.id === id);
  if (!kayit) return;
  const okuyucu = new FileReader();
  okuyucu.onload = () => {
    kayit.veri = String(okuyucu.result || '');
    ciz();
  };
  okuyucu.onerror = () => alert('Görsel okunamadı.');
  okuyucu.readAsDataURL(dosya);
}

/**
 * Bir görseli kendi bölümü içinde yukarı/aşağı taşır.
 *
 * Şekil numaraları listedeki sıraya göre verildiğinden, taşıma yalnızca
 * aynı türdeki görseller arasında anlamlıdır: bir kat planını nokta
 * detayların arasına sokmak numaralandırmayı bozardı.
 */
function gorseliTasi(id, yon) {
  const liste = durum.onbolum?.gorseller || [];
  const g = liste.find((x) => x.id === id);
  if (!g) return;
  const ayniTur = liste.filter((x) => x.tur === g.tur);
  const yer = ayniTur.indexOf(g);
  const hedef = ayniTur[yer + yon];
  if (!hedef) return;
  const a = liste.indexOf(g), b = liste.indexOf(hedef);
  [liste[a], liste[b]] = [liste[b], liste[a]];
}

/* ── Yönetmelik verisi düzenleme ve kalıcılık ───────────────────────── */

function yonetmelikDegistir(el) {
  const tabloAdi = el.dataset.yonetmelik;
  const tablo = YONETMELIK_TABLOLARI[tabloAdi];
  if (!tablo) return;
  const anahtar = el.dataset.anahtar;
  const altAnahtar = el.dataset.altAnahtar;
  const sinif = el.dataset.sinif;
  const alanAdi = el.dataset.alan;

  if (tabloAdi === 'EK2_TABLO_2_1') {
    tablo.mekanlar[Number(anahtar)][alanAdi] = el.value;
  } else if (tabloAdi === 'EK5_REVERBERASYON' || tabloAdi === 'EK6_TABLO_6_1') {
    const v = el.value.trim() === '' ? null : sayiOku(el.value, null);
    tablo.mekanlar[Number(anahtar)][alanAdi] = v;
  } else if (anahtar === 'indirim') {
    // EK-3 Tablo 3.1 sabit matris değil, Lgag'dan çıkarılan indirimdir.
    tablo.indirim[altAnahtar][sinif] = sayiOku(el.value, null);
  } else if (altAnahtar) {
    tablo.degerler[anahtar][altAnahtar][sinif] = sayiOku(el.value, null);
  } else {
    tablo.degerler[anahtar][sinif] = sayiOku(el.value, null);
  }
  yonetmeligiKaydet();
}

function yonetmeligiKaydet() {
  try {
    const paket = {};
    for (const [ad, t] of Object.entries(YONETMELIK_TABLOLARI)) {
      paket[ad] = t.indirim ? { indirim: t.indirim }
                : t.degerler ? { degerler: t.degerler }
                : { mekanlar: t.mekanlar };
    }
    localStorage.setItem(YONETMELIK_DEPO, JSON.stringify(paket));
  } catch { /* yoksay */ }
}

function yonetmeligiYukle() {
  try {
    const ham = localStorage.getItem(YONETMELIK_DEPO);
    if (!ham) return;
    yonetmeligiUygula(JSON.parse(ham));
  } catch { /* yoksay */ }
}

function yonetmeligiUygula(paket) {
  for (const [ad, veri] of Object.entries(paket || {})) {
    const t = YONETMELIK_TABLOLARI[ad];
    if (!t || !veri) continue;
    if (veri.degerler && t.degerler) Object.assign(t.degerler, veri.degerler);
    if (veri.indirim && t.indirim) Object.assign(t.indirim, veri.indirim);
    if (veri.mekanlar && t.mekanlar) {
      veri.mekanlar.forEach((m, i) => { if (t.mekanlar[i]) Object.assign(t.mekanlar[i], m); });
    }
  }
}

/* ── Eylemler ───────────────────────────────────────────────────────── */

const EYLEMLER = {
  'ekle-ayirici': () => durum.ayiricilar.push(D.yeniAyirici()),
  'sil-ayirici': (i) => durum.ayiricilar.splice(i, 1),
  // Kopyalar listenin SONUNA eklenir, kaynağın hemen ardına değil: sıralamayı
  // kullanıcı belirlesin. Araya girmek, uzun listelerde kartların yerini
  // kaydırıp kullanıcının o an baktığı yeri kaybettiriyordu.
  'kopyala-ayirici': (i) => {
    const k = yapiKopyala(durum.ayiricilar[i]);
    k.ad += ' (kopya)';
    durum.ayiricilar.push(k);
  },
  'ekle-yan': (i) => durum.ayiricilar[i].yanElemanlar.push({
    id: yeniId('y'), ad: 'Yeni yan eleman', elemanId: 'ddt-190', sivaId: 'alci-15',
    sivaliYuzSayisi: 2, RwBeyan: null, yogunlukBeyan: null, lf: 3, birlesim: 'T',
    giydirmeId: 'yok', dolguId: null, esnekBaglanti: false, katmanlar: [],
    // geometriRolu kasıtlı olarak atanmaz: kullanıcının eklediği yan elemanlar
    // geometri modunda bile manuel lf kullanır (bkz. ayiriciHesapla).
  }),
  'sil-yan': (i, j) => durum.ayiricilar[i].yanElemanlar.splice(j, 1),

  'ekle-darbe': () => durum.darbeler.push(D.yeniDarbe()),
  'sil-darbe': (i) => durum.darbeler.splice(i, 1),
  'kopyala-darbe': (i) => {
    const k = yapiKopyala(durum.darbeler[i]); k.ad += ' (kopya)';
    durum.darbeler.push(k);
  },

  'ekle-cephe': () => durum.cepheler.push(D.yeniCephe()),
  'sil-cephe': (i) => durum.cepheler.splice(i, 1),
  'kopyala-cephe': (i) => {
    const k = yapiKopyala(durum.cepheler[i]); k.ad += ' (kopya)';
    durum.cepheler.push(k);
  },
  'ekle-cephe-eleman': (i) => durum.cepheler[i].elemanlar.push({
    id: yeniId('e'), ad: 'Yeni eleman', tur: 'duvar', duvarNo: 1, elemanId: 'tugla-d190',
    sivaId: 'cimento-20', sivaliYuzSayisi: 2, RwBeyan: null, yogunlukBeyan: null,
    S: 5, en: 1.2, boy: 1.4, katmanlar: [],
  }),
  'sil-cephe-eleman': (i, j) => durum.cepheler[i].elemanlar.splice(j, 1),
  'ekle-kucuk': (i) => durum.cepheler[i].kucukElemanlar.push({
    id: yeniId('k'), elemanId: 'menfez-akustik', adet: 1, DnewBeyan: null,
  }),
  'sil-kucuk': (i, j) => durum.cepheler[i].kucukElemanlar.splice(j, 1),

  'ekle-hacim': () => durum.hacimler.push(D.yeniHacim()),
  'sil-hacim': (i) => durum.hacimler.splice(i, 1),
  'kopyala-hacim': (i) => {
    const k = yapiKopyala(durum.hacimler[i]); k.ad += ' (kopya)';
    durum.hacimler.push(k);
  },
  'ekle-yuzey': (i) => durum.hacimler[i].yuzeyler.push({ id: yeniId('s'), sogurucuId: 'siva', alan: 10 }),
  'sil-yuzey': (i, j) => durum.hacimler[i].yuzeyler.splice(j, 1),
  'ekle-nesne': (i) => durum.hacimler[i].nesneler.push({ id: yeniId('n'), nesneId: 'kisi-koltuk', adet: 1 }),
  'sil-nesne': (i, j) => durum.hacimler[i].nesneler.splice(j, 1),
};

/**
 * Katman listesi ve geometri modu için yol tabanlı eylemler.
 *
 * Bu eylemler (i,j) indeksleriyle değil, durum içindeki bir nesneyi
 * doğrudan gösteren `data-yol-tabani` yolu ile çalışır — çünkü katman
 * düzenleyici; ayırıcı ana eleman, her yan eleman, döşeme ve cephe duvar
 * elemanı gibi çok farklı derinliklerde yeniden kullanılır.
 *
 * @param {HTMLElement} dugme
 * @returns {boolean} eylem işlendiyse true
 */
function yolTabaniEylemiUygula(dugme) {
  const yolTabani = dugme.dataset.yolTabani;
  if (!yolTabani) return false;
  const eylem = dugme.dataset.eylem;
  const nesne = yolDegerAl(durum, yolTabani);
  if (!nesne) return false;

  if (eylem === 'katmanli-moda-gec') {
    if (!nesne.katmanlar) nesne.katmanlar = [];
    if (nesne.katmanlar.length === 0) {
      // Mevcut basit seçimi, serbest alanlı başlangıç katmanlarına çevirir.
      const TUM = [...DUVARLAR, ...DOSEMELER];
      const eleman = malzemeBul(TUM, nesne.elemanId || nesne.dosemeId);
      const siva = malzemeBul(SIVALAR, nesne.sivaId);
      // Sıva kayıtları yalnızca alan kütlesi taşır; kalınlık, adındaki
      // "X mm" ibaresinden çözülür (ör. "Alçı sıva, 15 mm").
      const sivaKalinlik = Number(siva?.ad.match(/(\d+(?:[.,]\d+)?)\s*mm/)?.[1]?.replace(',', '.')) || 15;
      const sivaYogunluk = siva && siva.mAlan > 0 ? Math.round(siva.mAlan / (sivaKalinlik / 1000)) : 1000;
      const sivaAdi = siva?.ad.replace(/,?\s*\d+(?:[.,]\d+)?\s*mm/, '').trim() || 'Sıva';

      const sivaKatmani = () => ({ tur: 'siva', ad: sivaAdi, kalinlik: sivaKalinlik, yogunluk: sivaYogunluk });
      const baslangic = [];
      for (let n = 0; n < (nesne.sivaliYuzSayisi || 0); n++) baslangic.push(sivaKatmani());

      const ortaMasif = eleman ? {
        tur: 'masif', ad: eleman.ad,
        kalinlik: eleman.kalinlik ?? 150,
        yogunluk: Number.isFinite(nesne.yogunlukBeyan) ? nesne.yogunlukBeyan : (eleman.yogunluk ?? 400),
      } : YK.yeniKatman('masif');

      // Sıvalar iki yüzdeyse taşıyıcının iki tarafına yerleştir.
      nesne.katmanlar = baslangic.length >= 2
        ? [baslangic[0], ortaMasif, ...baslangic.slice(1)]
        : [ortaMasif, ...baslangic];
    }
    return true;
  }

  if (eylem === 'basit-moda-don') {
    nesne.katmanlar = [];
    return true;
  }

  if (eylem === 'favori-ekle') {
    // Ad ve kategori projeye yazılmaz; katman düzenleyicinin taslağında
    // tutulur (bkz. katman-editor.js) ve çizimler arasında korunur.
    const taslak = favoriTaslaginiOku(yolTabani);
    // Kategori taslakta yoksa, çubuğun gösterdiği ön seçim kullanılır —
    // kullanıcı listeye hiç dokunmadıysa ekranda görünen değer geçerlidir.
    const kategori = taslak.kategori || dugme.dataset.favoriKategori;
    const sonuc = FAV.favoriEkle(taslak.ad, kategori, nesne.katmanlar || []);
    if (!sonuc.ok) { alert(sonuc.hata); return false; }
    favoriTaslaginiTemizle(yolTabani);
    return true;
  }

  if (eylem === 'katman-ekle') {
    if (!nesne.katmanlar) nesne.katmanlar = [];
    nesne.katmanlar.push(YK.yeniKatman(dugme.dataset.tur || 'masif'));
    return true;
  }

  const katmanIdx = Number(dugme.dataset.katmanIdx);
  if (eylem === 'katman-sil') {
    nesne.katmanlar?.splice(katmanIdx, 1);
    return true;
  }
  if (eylem === 'katman-yukari' && katmanIdx > 0) {
    const dizi = nesne.katmanlar;
    [dizi[katmanIdx - 1], dizi[katmanIdx]] = [dizi[katmanIdx], dizi[katmanIdx - 1]];
    return true;
  }
  if (eylem === 'katman-asagi' && nesne.katmanlar && katmanIdx < nesne.katmanlar.length - 1) {
    const dizi = nesne.katmanlar;
    [dizi[katmanIdx], dizi[katmanIdx + 1]] = [dizi[katmanIdx + 1], dizi[katmanIdx]];
    return true;
  }

  // Geometri kipi değişimleri. Darbe kaydında kipler arası ölçü taşıma
  // kuralı durum.js'te (darbeKipiDegistir) — orada sınanabiliyor.
  if (eylem === 'geometri-moda-gec' || eylem === 'hacim-moda-don' || eylem === 'iki-oda-moda-gec') {
    if (!nesne.geometri) nesne.geometri = { mod: 'hacim', L: 6, W: 3, H: 2.62 };
    const kip = eylem === 'geometri-moda-gec' ? 'olculer'
      : eylem === 'iki-oda-moda-gec' ? 'iki-oda' : 'hacim';
    D.darbeKipiDegistir(nesne.geometri, kip);
    return true;
  }

  return false;
}

function yapiKopyala(nesne) {
  const k = JSON.parse(JSON.stringify(nesne));
  const yenile = (o) => {
    if (Array.isArray(o)) return o.forEach(yenile);
    if (o && typeof o === 'object') {
      if ('id' in o) o.id = yeniId('k');
      Object.values(o).forEach(yenile);
    }
  };
  yenile(k);
  return k;
}

/* ── Dosya işlemleri ────────────────────────────────────────────────── */

function indir(veri, dosyaAdi) {
  const blob = new Blob([JSON.stringify(veri, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = dosyaAdi;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function dosyaOku(dosya, geriCagri) {
  const okuyucu = new FileReader();
  okuyucu.onload = () => {
    try { geriCagri(JSON.parse(okuyucu.result)); }
    catch { alert('Dosya okunamadı: geçerli bir JSON değil.'); }
  };
  okuyucu.readAsText(dosya);
}

/* ── Çizim ──────────────────────────────────────────────────────────── */

/**
 * Bir form alanını çizimler arasında yeniden bulmaya yarayan kararlı kimlik.
 *
 * Değerler nokta ve köşeli ayraç içerdiğinden CSS seçici kurmak yerine düz
 * dizge karşılaştırması yapılır; böylece kaçış kurallarına takılmayız.
 * Yönetmelik tablosu hücrelerinde `data-yol` yoktur; onlar kendi veri
 * öznitelikleriyle tanımlanır.
 */
function alanKimligi(el) {
  const d = el.dataset || {};
  if (d.yol) return `yol:${d.yol}`;
  if (d.yonetmelik) {
    return `yon:${d.yonetmelik}|${d.anahtar ?? ''}|${d.altAnahtar ?? ''}|${d.sinif ?? ''}|${d.alan ?? ''}`;
  }
  if (d.onayar) return `onayar:${d.onayar}`;
  if (el.id) return `id:${el.id}`;
  return null;
}

/**
 * Yeniden çizimden önce odaklı alanın kimliğini, ham metnini ve imleç
 * konumunu saklar.
 *
 * Görünüm her çizimde `innerHTML` ile baştan kurulduğu için, kullanıcı bir
 * kutuya yazarken araya giren çizim odağı düşürür ve yazmayı keser.
 */
function odakDurumunuAl() {
  const el = document.activeElement;
  if (!el || typeof el.matches !== 'function') return null;
  if (!el.matches('input, select, textarea')) return null;
  const kok = $('#icerik');
  if (!kok || !kok.contains(el)) return null;

  const kimlik = alanKimligi(el);
  if (!kimlik) return null;

  // number ve select alanları metin seçimini desteklemez; erişim bazı
  // tarayıcılarda hata fırlatır.
  let bas = null;
  let son = null;
  try { bas = el.selectionStart; son = el.selectionEnd; } catch { /* desteklenmiyor */ }

  return { kimlik, deger: el.value, secimVar: bas != null, bas, son, secimKutusu: el.tagName === 'SELECT' };
}

/**
 * Gecikmeli (alandan çıkışta tetiklenen) yeniden çizim.
 *
 * Odakta bir `<select>` varsa çizim atlanır: kullanıcı bir açılır listeyi
 * açmışken görünümü yeniden kurmak, seçim yapılmadan önce o denetimi DOM'dan
 * koparır ve seçim kaybolur. Bu durumda çizim, listenin kendi `change`
 * olayına bırakılır — durum zaten güncel olduğundan yalnızca ekrandaki
 * türetilmiş değerler bir etkileşim geç tazelenir.
 */
function gecikmeliCiz() {
  const el = document.activeElement;
  if (el && el.tagName === 'SELECT' && $('#icerik')?.contains(el)) return;
  ciz();
}

/** `odakDurumunuAl` ile saklanan odağı, ham metni ve imleci geri yükler. */
function odagiGeriYukle(od) {
  if (!od) return;
  const kok = $('#icerik');
  if (!kok) return;
  const el = $$('input, select, textarea', kok).find((x) => alanKimligi(x) === od.kimlik);
  if (!el) return;

  // Kullanıcının yazmakta olduğu ham metni koru: "6," ya da "-" gibi ara
  // durumlar sayıya çevrilip geri yazıldığında girdi bozulurdu.
  if (!od.secimKutusu && el.value !== od.deger) el.value = od.deger;

  el.focus({ preventScroll: true });
  if (od.secimVar) {
    try { el.setSelectionRange(od.bas, od.son); } catch { /* desteklenmiyor */ }
  }
}

function ciz() {
  const sonuclar = projeyiHesapla(durum);
  const kok = $('#icerik');
  const odak = odakDurumunuAl();
  const cizimler = {
    panel: () => sekmePanel.ciz(durum, sonuclar),
    proje: () => sekmeProje.ciz(durum),
    onbolum: () => sekmeOnBolum.ciz(durum, sonuclar),
    ayirici: () => sekmeAyirici.ciz(durum, sonuclar),
    darbe: () => sekmeDarbe.ciz(durum, sonuclar),
    cephe: () => sekmeCephe.ciz(durum, sonuclar),
    reverberasyon: () => sekmeReverberasyon.ciz(durum, sonuclar),
    kutuphane: () => sekmeKutuphane.ciz(durum),
    yonetmelik: () => sekmeYonetmelik.ciz(),
    rapor: () => sekmeRapor.ciz(durum, sonuclar),
  };
  kok.innerHTML = (cizimler[etkinSekme] || cizimler.panel)();
  menuyuCiz(sonuclar);
  ustBasligiCiz();
  D.kaydet(durum);
  canliModelleriBagla();
  odagiGeriYukle(odak);
}

/**
 * Ayırıcı sekmesindeki "Canlı 3B model" şemalarını sürükleyerek döndürme
 * etkileşimini bağlar. Döndürme yalnızca görsel/geçicidir: geometri
 * verisini değiştirmez, `durum`a yazılmaz — bir sonraki tam çizimde
 * varsayılan açıya döner. Bu nedenle her ciz() çağrısından sonra yeniden
 * bağlanması yeterlidir.
 */
function canliModelleriBagla() {
  for (const sarmalayici of $$('.oda-svg-sarmalayici')) {
    const yolTabani = sarmalayici.dataset.yolTabani;
    const cepheYolu = sarmalayici.dataset.cepheYolu;
    const oda1Adi = sarmalayici.dataset.oda1Adi;
    const oda2Adi = sarmalayici.dataset.oda2Adi;
    const mekanAdi = sarmalayici.dataset.mekanAdi;
    let aci = 30;
    let surukluyorMu = false;
    let baslangicX = 0;
    let baslangicAci = 30;

    // Ayırıcı şeması geometri kaydını, cephe şeması cephe kaydının tamamını
    // (doğramalar ve konum bilgisi gerektiği için) çizer.
    const yenidenCiz = () => {
      const genislik = sarmalayici.clientWidth || 640;
      if (cepheYolu) {
        const cephe = yolDegerAl(durum, cepheYolu);
        if (!cephe) return;
        sarmalayici.innerHTML = cepheSVG(cephe, {
          mekanAdi, donusAcisiDeg: aci, genislik, yukseklik: 340,
        });
        return;
      }
      const geometri = yolDegerAl(durum, yolTabani);
      if (!geometri) return;
      sarmalayici.innerHTML = odaSVG(geometri, {
        oda1Adi, oda2Adi, donusAcisiDeg: aci, genislik, yukseklik: 340,
      });
    };

    sarmalayici.addEventListener('pointerdown', (e) => {
      surukluyorMu = true; baslangicX = e.clientX; baslangicAci = aci;
      sarmalayici.setPointerCapture(e.pointerId);
    });
    sarmalayici.addEventListener('pointermove', (e) => {
      if (!surukluyorMu) return;
      aci = baslangicAci + (e.clientX - baslangicX) * 0.4;
      yenidenCiz();
    });
    const birak = (e) => { surukluyorMu = false; try { sarmalayici.releasePointerCapture(e.pointerId); } catch { /* yoksay */ } };
    sarmalayici.addEventListener('pointerup', birak);
    sarmalayici.addEventListener('pointercancel', birak);
  }
}

/** Kenar çubuğu menüsünü, bileşen sayaçlarıyla birlikte çizer. */
function menuyuCiz(sonuclar) {
  const menu = $('#yan-menu');
  const html = SEKMELER.map((sek) => {
    const adet = sek.sayim ? sek.sayim(durum) : null;
    const eksik = sek.eksik ? sek.eksik(sonuclar) : 0;
    const rakam = adet == null ? ''
      : `<span class="rakam${eksik ? ' uyar' : ''}" title="${eksik ? `${eksik} bileşen gereksinimi sağlamıyor` : `${adet} bileşen`}">${eksik ? `${eksik}!` : adet}</span>`;
    return (sek.grup ? `<div class="yan-baslik">${sek.grup}</div>` : '') +
      `<button class="sekme${sek.id === etkinSekme ? ' etkin' : ''}" data-sekme="${sek.id}" role="tab">
         ${simge(sek.id)}
         <span>${sek.ad}</span>${rakam}
       </button>`;
  }).join('');

  // Değişmediyse yeniden kurma: bir alandan çıkarken tetiklenen çizim,
  // tıklanmakta olan sekme düğmesini DOM'dan koparıp tıklamayı düşürüyordu.
  if (menu.innerHTML !== html) menu.innerHTML = html;

  const s = $('#veri-surumu');
  if (s) s.textContent = SURUM.veriSurumu;
}

/** Üst çubuktaki başlık ve alt açıklamayı günceller. */
function ustBasligiCiz() {
  const sek = SEKMELER.find((x) => x.id === etkinSekme) || SEKMELER[0];
  $('#ust-baslik').textContent = sek.baslik;
  $('#ust-yol').textContent = sek.yol;
  document.title = `${sek.baslik} — SAGG Akustik Hesap Aracı`;
}

/** Sekme değiştirir ve görünümü tazeler. */
function sekmeyeGit(id) {
  etkinSekme = id;
  kenarCubuguKapat();
  ciz();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Tema ───────────────────────────────────────────────────────────── */

function temayiUygula(tema) {
  document.documentElement.dataset.tema = tema;
  const d = $('#btn-tema');
  if (d) {
    // Referans arayüzdeki gibi iki durum da görünür; etkin olan CSS ile vurgulanır.
    d.innerHTML = `<span class="gunes">${simge('gunes', '')}</span><span class="ay">${simge('ay', '')}</span>`;
    d.title = tema === 'koyu' ? 'Açık temaya geç' : 'Koyu temaya geç';
  }
  try { localStorage.setItem(TEMA_DEPO, tema); } catch { /* yoksay */ }
}

function temayiBaslat() {
  let tema = null;
  try { tema = localStorage.getItem(TEMA_DEPO); } catch { /* yoksay */ }
  // Panel tasarımı koyu tema için kurgulandığından varsayılan koyudur;
  // kullanıcı açık temaya geçerse tercihi kalıcı olarak saklanır.
  if (!tema) tema = 'koyu';
  temayiUygula(tema);
}

/* ── Raporu PDF olarak dışa aktarma ─────────────────────────────────── */

/** Proje adından dosya adı türetir (kaydetme penceresine önerilir). */
function raporDosyaAdi() {
  const ad = (durum.proje.ad || 'akustik-rapor')
    .replace(/[^\wğüşıöçĞÜŞİÖÇ -]/g, '').trim() || 'akustik-rapor';
  const kod = (durum.proje.kod || '').replace(/[^\wğüşıöçĞÜŞİÖÇ-]/g, '').trim();
  return kod ? `${ad} - ${kod}` : ad;
}

/**
 * Raporu PDF olarak kaydeder.
 *
 * Masaüstü (Electron) sürümünde bu gerçek bir dışa aktarmadır: yazdırma
 * penceresi hiç açılmaz, yalnızca dosyanın nereye kaydedileceği sorulur ve
 * PDF doğrudan yazılır.
 *
 * Tarayıcıda ise bir web sayfasının kendi başına PDF dosyası yazması mümkün
 * değildir; tek yol tarayıcının kendi PDF motorudur ve ona ancak yazdırma
 * penceresi üzerinden ulaşılır (hedef: "PDF olarak kaydet"). Harici bir PDF
 * kitaplığı eklemek hem projenin bağımsızlığını bozar hem de tarayıcının
 * kendi çıktısından daha kötü sonuç verir: sayfa sonları, tablo bölünmeleri
 * ve yazı tipleri `@media print` kurallarıyla zaten doğru dökülüyor.
 */
async function raporuPdfeAktar() {
  const kopru = window.saggMasaustu;
  if (kopru?.pdfeAktar) {
    try {
      await kopru.pdfeAktar(raporDosyaAdi());
      // Kaydedilen dosya ana süreçte Dosya Gezgini'nde gösterilir; ayrıca
      // bir bildirim penceresi açmaya gerek yok.
      return;
    } catch {
      // Köprü beklenmedik biçimde düşerse tarayıcı yoluna geri dönülür.
    }
  }
  window.print();
}

/* ── Kenar çubuğu ───────────────────────────────────────────────────── */

/** Dar ekranda kenar çubuğu çekmeceye dönüşür; katlama yalnızca geniş ekranda. */
const DAR_EKRAN = '(max-width:1000px)';
const YAN_DEPO = 'sagg-yan-cubuk';

function darEkranMi() {
  return window.matchMedia(DAR_EKRAN).matches;
}

/** Geniş ekranda kenar çubuğunu katlar/açar ve tercihi saklar. */
function yanCubuguKatla(kapali) {
  document.body.classList.toggle('yan-kapali', kapali);
  $('#btn-menu')?.setAttribute('aria-expanded', String(!kapali));
  try { localStorage.setItem(YAN_DEPO, kapali ? 'kapali' : 'acik'); } catch { /* yoksay */ }
}

/** Sayfa açılışında saklanan katlama tercihini uygular. */
function yanCubuguKur() {
  let kapali = false;
  try { kapali = localStorage.getItem(YAN_DEPO) === 'kapali'; } catch { /* yoksay */ }
  document.body.classList.toggle('yan-kapali', kapali);
  $('#btn-menu')?.setAttribute('aria-expanded', String(!kapali));
}

/** Menü düğmesi: dar ekranda çekmece, geniş ekranda katlama. */
function yanCubuguDegistir() {
  if (darEkranMi()) {
    $('#yan-cubuk').classList.contains('acik') ? kenarCubuguKapat() : kenarCubuguAc();
  } else {
    yanCubuguKatla(!document.body.classList.contains('yan-kapali'));
  }
}

/* ── Kenar çubuğu (dar ekran çekmecesi) ───────────────────────────────────────── */

function kenarCubuguAc() {
  $('#yan-cubuk').classList.add('acik');
  if (!$('.perde')) {
    const perde = document.createElement('div');
    perde.className = 'perde';
    perde.addEventListener('click', kenarCubuguKapat);
    document.body.appendChild(perde);
  }
}

function kenarCubuguKapat() {
  $('#yan-cubuk').classList.remove('acik');
  $('.perde')?.remove();
}

/* ── Olay bağlama ───────────────────────────────────────────────────── */

function olaylariBagla() {
  $('#btn-menu').innerHTML = simge('menu');
  $('#btn-menu').title = 'Yan paneli aç / kapat';
  yanCubuguKur();

  // Sekme değiştirme (menü her çizimde yenilendiği için delege edilir)
  $('#yan-menu').addEventListener('click', (e) => {
    const b = e.target.closest('.sekme');
    if (b) sekmeyeGit(b.dataset.sekme);
  });

  // Girdi değişiklikleri (delege)
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset?.filtre === 'kutuphane') { kutuphaneyiSuz(el.value); return; }
    if (el.dataset?.favoriAlan) {
      favoriTaslaginiAyarla(el.dataset.yolTabani, el.dataset.favoriAlan, el.value);
      return;
    }
    if (el.dataset?.yolGorsel) {
      // "<id>.<alan>" — görsel kaydını kimliğinden bulup alanını yazar.
      const [id, alanAdi] = el.dataset.yolGorsel.split('.');
      const g = (durum.onbolum?.gorseller || []).find((x) => x.id === id);
      if (g) g[alanAdi] = el.value;
      setTimeout(gecikmeliCiz, 0);
      return;
    }
    if (el.dataset?.yolOneri !== undefined) {
      const i = Number(el.dataset.yolOneri);
      if (durum.onbolum?.oneriler && i >= 0 && i < durum.onbolum.oneriler.length) {
        durum.onbolum.oneriler[i] = el.value;
      }
      setTimeout(gecikmeliCiz, 0);
      return;
    }
    if (el.dataset?.yol) {
      yolAyarla(durum, el.dataset.yol, degerCoz(el));
      D.kaydet(durum);
      // Metin alanlarında odak kaybını önlemek için anlık yeniden çizim yapılmaz;
      // sonuçlar 'change' olayında güncellenir.
      if (el.type === 'number' || el.tagName === 'SELECT') planlaCizim();
    } else if (el.dataset?.yonetmelik) {
      yonetmelikDegistir(el);
      planlaCizim();
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset?.favoriAlan) {
      favoriTaslaginiAyarla(el.dataset.yolTabani, el.dataset.favoriAlan, el.value);
      return;
    }
    if (el.dataset?.favoriYukle) {
      const id = el.value;
      if (id) {
        const katmanlar = FAV.favoriKatmanlari(id);
        const hedef = yolDegerAl(durum, el.dataset.favoriYukle);
        if (katmanlar && hedef) {
          hedef.katmanlar = katmanlar;
          ciz();
          return;
        }
      }
      el.value = '';
      return;
    }
    if (el.dataset?.onayar) {
      // Katman ön ayarı: seçilen malzemenin adını ve yoğunluğunu katmana
      // kopyalar (kalınlık kullanıcının kendi girdiği değerde kalır).
      const secenek = el.selectedOptions[0];
      if (secenek && secenek.value) {
        yolAyarla(durum, `${el.dataset.onayar}.ad`, secenek.value);
        yolAyarla(durum, `${el.dataset.onayar}.yogunluk`, Number(secenek.dataset.yogunluk));
        ciz();
      }
      return;
    }
    if (el.dataset?.yolGorsel) {
      // "<id>.<alan>" — görsel kaydını kimliğinden bulup alanını yazar.
      const [id, alanAdi] = el.dataset.yolGorsel.split('.');
      const g = (durum.onbolum?.gorseller || []).find((x) => x.id === id);
      if (g) g[alanAdi] = el.value;
      setTimeout(gecikmeliCiz, 0);
      return;
    }
    if (el.dataset?.yolOneri !== undefined) {
      const i = Number(el.dataset.yolOneri);
      if (durum.onbolum?.oneriler && i >= 0 && i < durum.onbolum.oneriler.length) {
        durum.onbolum.oneriler[i] = el.value;
      }
      setTimeout(gecikmeliCiz, 0);
      return;
    }
    if (el.dataset?.yol) {
      yolAyarla(durum, el.dataset.yol, degerCoz(el));
      // Çizim bir sonraki döngüye bırakılır: 'change' alandan çıkarken
      // (mousedown → blur) tetiklenir; hemen çizmek, tıklanmakta olan
      // düğmeyi mouseup'tan önce DOM'dan koparıp tıklamayı düşürürdü.
      setTimeout(gecikmeliCiz, 0);
    } else if (el.dataset?.yonetmelik) {
      yonetmelikDegistir(el);
      setTimeout(gecikmeliCiz, 0);
    } else if (el.id === 'dosya-ac' && el.files?.[0]) {
      dosyaOku(el.files[0], (veri) => {
        if (v3SemasiMi(veri)) {
          durum = v3ProjeyiDonustur(veri);
          alert('"Katmanlı Model v3" formatındaki dosya içe aktarıldı. Ayırıcı elemanlar sekmesinden düzenleyebilirsiniz.');
          ciz();
          return;
        }
        if (!veri?.proje) { alert('Bu dosya tanınan bir SAGG akustik proje biçiminde değil.'); return; }
        durum = D.cepheleriNormallestir(veri);
        if (veri.yonetmelik) yonetmeligiUygula(veri.yonetmelik);
        ciz();
      });
      el.value = '';
    } else if (el.id === 'bina-resmi' && el.files?.[0]) {
      binaResminiOku(el.files[0]);
      el.value = '';
    } else if (el.dataset?.gorselDosya && el.files?.[0]) {
      gorseliOku(el.dataset.gorselDosya, el.files[0]);
      el.value = '';
    } else if (el.id === 'favori-ice' && el.files?.[0]) {
      dosyaOku(el.files[0], (veri) => {
        const r = FAV.favorileriIceAktar(veri);
        alert(`${r.eklenen} favori eklendi, ${r.guncellenen} favori güncellendi.`);
        ciz();
      });
      el.value = '';
    } else if (el.id === 'yonetmelik-ice' && el.files?.[0]) {
      dosyaOku(el.files[0], (veri) => { yonetmeligiUygula(veri); yonetmeligiKaydet(); ciz(); });
      el.value = '';
    }
  });

  // Düğmeler (delege)
  document.addEventListener('click', (e) => {
    const dugme = e.target.closest('[data-eylem]');
    if (dugme) {
      const eylem = dugme.dataset.eylem;

      if (yolTabaniEylemiUygula(dugme)) { ciz(); return; }

      const i = Number(dugme.dataset.idx);
      const j = Number(dugme.dataset.alt);
      if (EYLEMLER[eylem]) { EYLEMLER[eylem](i, j); ciz(); return; }

      if (eylem === 'cephe-olcu-moda-gec' || eylem === 'cephe-hacim-moda-don') {
        const c = durum.cepheler[Number(dugme.dataset.idx)];
        if (c) {
          if (!c.geometri) c.geometri = { mod: 'hacim', L: 4.5, W: 3.4, H: 2.62 };
          c.geometri.mod = eylem === 'cephe-olcu-moda-gec' ? 'olculer' : 'hacim';
          if (!c.yanElemanlar?.length) c.yanElemanlar = D.varsayilanCepheYanElemanlari();
        }
        ciz();
        return;
      }
      if (eylem === 'favori-sil') {
        const f = FAV.favoriBul(dugme.dataset.favoriId);
        if (f && confirm(`"${f.ad}" favorisi silinsin mi?`)) { FAV.favoriSil(f.id); ciz(); }
        return;
      }
      if (eylem === 'gorsel-ekle') {
        durum.onbolum.gorseller.push(D.yeniGorsel(dugme.dataset.tur));
        ciz();
        return;
      }
      if (eylem === 'gorsel-sil') {
        const liste = durum.onbolum.gorseller;
        const yer = liste.findIndex((g) => g.id === dugme.dataset.id);
        if (yer >= 0 && confirm('Bu görsel rapordan kaldırılsın mı?')) {
          liste.splice(yer, 1);
          ciz();
        }
        return;
      }
      if (eylem === 'gorsel-yukari' || eylem === 'gorsel-asagi') {
        gorseliTasi(dugme.dataset.id, eylem === 'gorsel-yukari' ? -1 : 1);
        ciz();
        return;
      }
      if (eylem === 'oneri-ekle') { durum.onbolum.oneriler.push(''); ciz(); return; }
      if (eylem === 'oneri-sil') {
        durum.onbolum.oneriler.splice(Number(dugme.dataset.indeks), 1);
        ciz();
        return;
      }
      if (eylem === 'bina-resmi-sil') {
        durum.proje.binaResmi = '';
        ciz();
        return;
      }
      if (eylem === 'favori-disa') { indir(FAV.favoriPaketi(), 'katman-favorileri.json'); return; }
      if (eylem === 'panel-filtre') { sekmePanel.suzgeciAyarla(dugme.dataset.deger); ciz(); return; }
      if (eylem.startsWith('git-')) { sekmeyeGit(eylem.slice(4)); return; }
      if (eylem === 'ornek-yukle') { durum = D.ornekProje(); ciz(); return; }
      if (eylem === 'kart-katla') {
        katlamayiDegistir(dugme.dataset.kartId);
        ciz();
        return;
      }
      if (eylem === 'tumunu-katla') {
        // data-katla="true" → hepsini küçült, "false" → hepsini aç.
        const liste = durum[dugme.dataset.liste] || [];
        tumunuKatla(liste.map((k) => k.id), dugme.dataset.katla === 'true');
        ciz();
        return;
      }
      if (eylem === 'pdfe-aktar') { raporuPdfeAktar(); return; }
      if (eylem === 'excel-indir') {
        sekmeRapor.excelRaporunuIndir(durum.proje, projeyiHesapla(durum));
        return;
      }
      if (eylem === 'yonetmelik-disa') { indir(veriPaketi(), 'yonetmelik-verileri.json'); return; }
      if (eylem === 'yonetmelik-varsayilan') {
        if (confirm('Yönetmelik tablolarındaki düzenlemeleriniz silinip varsayılan değerlere dönülecek. Devam edilsin mi?')) {
          try { localStorage.removeItem(YONETMELIK_DEPO); } catch { /* yoksay */ }
          location.reload();
        }
        return;
      }
    }

    if (e.target.closest('.uyari-bandi .kapat')) {
      $('#dogrulama-uyarisi').style.display = 'none';
    }
  });

  $('#btn-tema').addEventListener('click', () => {
    temayiUygula(document.documentElement.dataset.tema === 'koyu' ? 'acik' : 'koyu');
  });
  $('#btn-menu').addEventListener('click', () => {
    yanCubuguDegistir();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') kenarCubuguKapat(); });

  $('#btn-kaydet').addEventListener('click', () => {
    const ad = (durum.proje.ad || 'akustik-proje').replace(/[^\wğüşıöçĞÜŞİÖÇ -]/g, '').trim() || 'akustik-proje';
    indir({ ...durum, yonetmelik: veriPaketiOzet() }, `${ad}.json`);
  });
  $('#btn-ornek').addEventListener('click', () => {
    if (confirm('Mevcut proje örnek projeyle değiştirilecek. Devam edilsin mi?')) {
      durum = D.ornekProje(); ciz();
    }
  });
  $('#btn-sifirla').addEventListener('click', () => {
    if (confirm('Proje sıfırlanacak. Devam edilsin mi?')) {
      durum = D.bosProje(); D.temizle(); ciz();
    }
  });
}

function veriPaketiOzet() {
  const paket = {};
  for (const [ad, t] of Object.entries(YONETMELIK_TABLOLARI)) {
    paket[ad] = t.degerler ? { degerler: t.degerler } : { mekanlar: t.mekanlar };
  }
  return paket;
}

/**
 * Malzeme kütüphanesi tablolarını metin filtresine göre süzer.
 * Yeniden çizim yapılmaz; yalnızca satır görünürlüğü değiştirilir, böylece
 * arama kutusundaki odak korunur.
 */
function kutuphaneyiSuz(metin) {
  const arama = aramaMetni(metin).trim();
  const parcalar = arama.split(/\s+/).filter(Boolean);
  for (const kapsam of $$('[data-filtre-kapsam]')) {
    let gorunen = 0;
    for (const satir of $$('[data-filtre-satir]', kapsam)) {
      const metni = satir.dataset.filtreSatir;
      const uyar = parcalar.every((k) => metni.includes(k));
      satir.style.display = uyar ? '' : 'none';
      if (uyar) gorunen += 1;
    }
    kapsam.style.display = gorunen === 0 && parcalar.length ? 'none' : '';
  }
}

let cizimZamani = null;
function planlaCizim() {
  clearTimeout(cizimZamani);
  cizimZamani = setTimeout(ciz, 400);
}

/* ── Başlangıç ──────────────────────────────────────────────────────── */

temayiBaslat();
yonetmeligiYukle();
olaylariBagla();
ciz();
