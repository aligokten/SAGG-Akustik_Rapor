/**
 * uygulama.js — Uygulamanın giriş noktası: durum yönetimi, sekme yönlendirme,
 * olay bağlama ve dosya işlemleri.
 */

import { $, $$, sayiOku, yeniId } from './arayuz/ortak.js';
import * as D from './durum.js';
import { projeyiHesapla } from './hesap.js';
import * as sekmeProje from './arayuz/sekme-proje.js';
import * as sekmeAyirici from './arayuz/sekme-ayirici.js';
import * as sekmeDarbe from './arayuz/sekme-darbe.js';
import * as sekmeCephe from './arayuz/sekme-cephe.js';
import * as sekmeReverberasyon from './arayuz/sekme-reverberasyon.js';
import * as sekmeYonetmelik from './arayuz/sekme-yonetmelik.js';
import * as sekmeRapor from './arayuz/sekme-rapor.js';
import {
  EK2_TABLO_2_1, EK3_TABLO_3_1, EK3_TABLO_3_2, EK3_TABLO_3_3,
  EK4_TABLO_4_1, EK5_REVERBERASYON, veriPaketi,
} from './veri/yonetmelik.js';

const YONETMELIK_DEPO = 'sagg-akustik-yonetmelik-v1';
const YONETMELIK_TABLOLARI = {
  EK2_TABLO_2_1, EK3_TABLO_3_1, EK3_TABLO_3_2, EK3_TABLO_3_3,
  EK4_TABLO_4_1, EK5_REVERBERASYON,
};

let durum = D.yukle() || D.ornekProje();
let etkinSekme = 'proje';

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

function degerCoz(el) {
  const tur = el.dataset.tur;
  if (tur === 'sayi') return sayiOku(el.value, 0);
  if (tur === 'bool') return el.checked;
  if (tur === 'sayiVeyaNull') {
    return el.value.trim() === '' ? null : sayiOku(el.value, null);
  }
  return el.value;
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
  } else if (tabloAdi === 'EK5_REVERBERASYON') {
    const v = el.value.trim() === '' ? null : sayiOku(el.value, null);
    tablo.mekanlar[Number(anahtar)][alanAdi] = v;
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
      paket[ad] = t.degerler ? { degerler: t.degerler } : { mekanlar: t.mekanlar };
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
    if (veri.mekanlar && t.mekanlar) {
      veri.mekanlar.forEach((m, i) => { if (t.mekanlar[i]) Object.assign(t.mekanlar[i], m); });
    }
  }
}

/* ── Eylemler ───────────────────────────────────────────────────────── */

const EYLEMLER = {
  'ekle-ayirici': () => durum.ayiricilar.push(D.yeniAyirici()),
  'sil-ayirici': (i) => durum.ayiricilar.splice(i, 1),
  'kopyala-ayirici': (i) => {
    const k = yapiKopyala(durum.ayiricilar[i]);
    k.ad += ' (kopya)';
    durum.ayiricilar.splice(i + 1, 0, k);
  },
  'ekle-yan': (i) => durum.ayiricilar[i].yanElemanlar.push({
    id: yeniId('y'), ad: 'Yeni yan eleman', elemanId: 'tugla-d190', sivaId: 'alci-15',
    sivaliYuzSayisi: 2, RwBeyan: null, lf: 3, birlesim: 'T', giydirmeId: 'yok', esnekBaglanti: false,
  }),
  'sil-yan': (i, j) => durum.ayiricilar[i].yanElemanlar.splice(j, 1),

  'ekle-darbe': () => durum.darbeler.push(D.yeniDarbe()),
  'sil-darbe': (i) => durum.darbeler.splice(i, 1),
  'kopyala-darbe': (i) => {
    const k = yapiKopyala(durum.darbeler[i]); k.ad += ' (kopya)';
    durum.darbeler.splice(i + 1, 0, k);
  },

  'ekle-cephe': () => durum.cepheler.push(D.yeniCephe()),
  'sil-cephe': (i) => durum.cepheler.splice(i, 1),
  'kopyala-cephe': (i) => {
    const k = yapiKopyala(durum.cepheler[i]); k.ad += ' (kopya)';
    durum.cepheler.splice(i + 1, 0, k);
  },
  'ekle-cephe-eleman': (i) => durum.cepheler[i].elemanlar.push({
    id: yeniId('e'), ad: 'Yeni eleman', tur: 'duvar', elemanId: 'tugla-d190',
    sivaId: 'cimento-20', sivaliYuzSayisi: 2, RwBeyan: null, S: 5,
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
    durum.hacimler.splice(i + 1, 0, k);
  },
  'ekle-yuzey': (i) => durum.hacimler[i].yuzeyler.push({ id: yeniId('s'), sogurucuId: 'siva', alan: 10 }),
  'sil-yuzey': (i, j) => durum.hacimler[i].yuzeyler.splice(j, 1),
  'ekle-nesne': (i) => durum.hacimler[i].nesneler.push({ id: yeniId('n'), nesneId: 'kisi-koltuk', adet: 1 }),
  'sil-nesne': (i, j) => durum.hacimler[i].nesneler.splice(j, 1),
};

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

function ciz() {
  const sonuclar = projeyiHesapla(durum);
  const kok = $('#icerik');
  const cizimler = {
    proje: () => sekmeProje.ciz(durum, sonuclar),
    ayirici: () => sekmeAyirici.ciz(durum, sonuclar),
    darbe: () => sekmeDarbe.ciz(durum, sonuclar),
    cephe: () => sekmeCephe.ciz(durum, sonuclar),
    reverberasyon: () => sekmeReverberasyon.ciz(durum, sonuclar),
    yonetmelik: () => sekmeYonetmelik.ciz(),
    rapor: () => sekmeRapor.ciz(durum, sonuclar),
  };
  kok.innerHTML = (cizimler[etkinSekme] || cizimler.proje)();
  $$('.sekme').forEach((b) => b.classList.toggle('etkin', b.dataset.sekme === etkinSekme));
  D.kaydet(durum);
}

/* ── Olay bağlama ───────────────────────────────────────────────────── */

function olaylariBagla() {
  // Sekme değiştirme
  $$('.sekme').forEach((b) => b.addEventListener('click', () => {
    etkinSekme = b.dataset.sekme;
    ciz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  // Girdi değişiklikleri (delege)
  document.addEventListener('input', (e) => {
    const el = e.target;
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
    if (el.dataset?.yol) {
      yolAyarla(durum, el.dataset.yol, degerCoz(el));
      ciz();
    } else if (el.dataset?.yonetmelik) {
      yonetmelikDegistir(el);
      ciz();
    } else if (el.id === 'dosya-ac' && el.files?.[0]) {
      dosyaOku(el.files[0], (veri) => {
        if (!veri?.proje) { alert('Bu dosya bir SAGG akustik projesi değil.'); return; }
        durum = veri;
        if (veri.yonetmelik) yonetmeligiUygula(veri.yonetmelik);
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
      const i = Number(dugme.dataset.idx);
      const j = Number(dugme.dataset.alt);
      if (EYLEMLER[eylem]) { EYLEMLER[eylem](i, j); ciz(); return; }

      if (eylem === 'yazdir') { window.print(); return; }
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

let cizimZamani = null;
function planlaCizim() {
  clearTimeout(cizimZamani);
  cizimZamani = setTimeout(ciz, 400);
}

/* ── Başlangıç ──────────────────────────────────────────────────────── */

yonetmeligiYukle();
olaylariBagla();
ciz();
