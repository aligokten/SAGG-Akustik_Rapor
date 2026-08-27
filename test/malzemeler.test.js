/**
 * malzemeler.test.js — Malzeme kütüphanesi, kimlik göçü, yoğunluk beyanı,
 * boşluk dolgusu ve rezonans frekansı testleri.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DUVARLAR, DOSEMELER, YALITIM_LEVHALARI, SAP_KAPLAMALAR, GIYDIRME_KABUKLAR,
  DOGRAMALAR, KUCUK_ELEMANLAR, SOGURUCULAR, NESNELER, SIVALAR,
  elemanAlanKutlesi, bul, kimligiGuncelle, projeKimliklerinigGuncelle,
  ESKI_ID_ESLESMESI, kutuphaneOzeti,
} from '../js/veri/malzemeler.js';
import { rezonansFrekansi, rezonansYorumu, OKTAV_BANTLARI } from '../js/cekirdek/temel.js';
import { elemanCoz, giydirmeCoz, projeyiHesapla, TUM_ELEMANLAR } from '../js/hesap.js';
import { ornekProje, yeniAyirici, yeniCephe, yeniDarbe, yeniHacim } from '../js/durum.js';
import { aramaMetni } from '../js/arayuz/ortak.js';

const yakin = (a, b, tol = 0.05) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b} bekleniyordu (tolerans ${tol})`);

/* ── Kütüphane bütünlüğü ──────────────────────────────────────────── */

test('Hiçbir listede yinelenen kimlik yoktur', () => {
  const listeler = {
    DUVARLAR, DOSEMELER, YALITIM_LEVHALARI, SAP_KAPLAMALAR,
    GIYDIRME_KABUKLAR, DOGRAMALAR, KUCUK_ELEMANLAR, SOGURUCULAR, NESNELER, SIVALAR,
  };
  for (const [ad, liste] of Object.entries(listeler)) {
    const ids = liste.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `${ad} içinde yinelenen kimlik var`);
  }
});

test('Duvar ve döşeme kimlikleri birbiriyle çakışmaz', () => {
  const ids = TUM_ELEMANLAR.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('Her masif elemanın kalınlığı ve yoğunluğu geçerlidir', () => {
  for (const e of TUM_ELEMANLAR) {
    if (e.cokKatmanli) {
      assert.ok(Number.isFinite(e.mAlanSabit), `${e.id}: mAlanSabit eksik`);
      assert.ok(Number.isFinite(e.Rw), `${e.id}: çok katmanlı elemanda Rw gerekli`);
      continue;
    }
    assert.ok(e.kalinlik > 0, `${e.id}: kalınlık geçersiz`);
    assert.ok(e.yogunluk > 0, `${e.id}: yoğunluk geçersiz`);
    const m = elemanAlanKutlesi(e);
    assert.ok(m > 0 && m < 1500, `${e.id}: m′ = ${m} makul aralıkta değil`);
  }
});

test('Gazbeton sınıfları TS EN 771-4 yoğunluklarına uyar (G2=400, G3=500, G4=600)', () => {
  const sinif = (onek, beklenen) => {
    const kayitlar = DUVARLAR.filter((d) => d.id.startsWith(onek));
    assert.ok(kayitlar.length > 0, `${onek} kaydı yok`);
    for (const k of kayitlar) assert.equal(k.yogunluk, beklenen, `${k.id} yoğunluğu`);
  };
  sinif('gb-g2-', 400);
  sinif('gb-g3-', 500);
  sinif('gb-g4-', 600);
});

test('Bims blok yoğunlukları TS EN 771-3 aralığındadır', () => {
  const bims = DUVARLAR.filter((d) => d.id.startsWith('bims-'));
  assert.ok(bims.length >= 15, 'bims çeşitliliği yetersiz');
  for (const b of bims) {
    assert.ok(b.yogunluk >= 400 && b.yogunluk <= 900, `${b.id}: ${b.yogunluk} kg/m³`);
  }
});

test('Her giydirme kabuğun önerdiği dolgu kütüphanede vardır', () => {
  for (const g of GIYDIRME_KABUKLAR) {
    assert.ok(bul(YALITIM_LEVHALARI, g.dolguOnerisi), `${g.id}: dolgu "${g.dolguOnerisi}" bulunamadı`);
  }
});

test('Çok katmanlı duvarların önerdiği dolgu kütüphanede vardır', () => {
  for (const d of DUVARLAR.filter((x) => x.dolguOnerisi)) {
    assert.ok(bul(YALITIM_LEVHALARI, d.dolguOnerisi), `${d.id}: dolgu bulunamadı`);
  }
});

test('Soğurucu ve nesne kayıtları tüm oktav bantlarını kapsar', () => {
  for (const s of SOGURUCULAR) {
    for (const f of OKTAV_BANTLARI) {
      assert.ok(Number.isFinite(s.alfa[f]), `${s.id}: ${f} Hz eksik`);
      assert.ok(s.alfa[f] >= 0 && s.alfa[f] <= 1.1, `${s.id}: α(${f}) = ${s.alfa[f]}`);
    }
  }
  for (const n of NESNELER) {
    for (const f of OKTAV_BANTLARI) assert.ok(Number.isFinite(n.A[f]), `${n.id}: ${f} Hz eksik`);
  }
});

test('Kütüphane özeti gerçek kayıt sayılarını verir', () => {
  const o = kutuphaneOzeti();
  assert.equal(o.duvar, DUVARLAR.length);
  assert.ok(o.duvar >= 90, 'duvar kütüphanesi beklenenden küçük');
  assert.ok(o.yalitim >= 8, 'yalıtım levhası kütüphanesi beklenenden küçük');
});

/* ── Kimlik göçü ──────────────────────────────────────────────────── */

test('Eski kimliklerin tamamı güncel bir kayda çözülür', () => {
  const hepsi = [
    ...TUM_ELEMANLAR, ...GIYDIRME_KABUKLAR, ...SAP_KAPLAMALAR,
    ...DOGRAMALAR, ...SOGURUCULAR, ...NESNELER, ...YALITIM_LEVHALARI,
  ];
  for (const [eski, yeni] of Object.entries(ESKI_ID_ESLESMESI)) {
    assert.ok(hepsi.some((x) => x.id === yeni), `${eski} → ${yeni} karşılığı bulunamadı`);
  }
});

test('kimligiGuncelle bilinmeyen kimliği olduğu gibi bırakır', () => {
  assert.equal(kimligiGuncelle('tugla-d190'), 'ddt-190');
  assert.equal(kimligiGuncelle('ba-200'), 'ba-200');
  assert.equal(kimligiGuncelle('bilinmeyen-xyz'), 'bilinmeyen-xyz');
});

test('Gazbeton göçü yoğunluğu korur', () => {
  // Eski "G4" etiketi 500 kg/m³ idi; doğru sınıf G3'tür.
  assert.equal(bul(DUVARLAR, kimligiGuncelle('gb-200-g4')).yogunluk, 500);
  // Eski "G6" 700 kg/m³ idi; en yakın sınıf G4 (600).
  assert.equal(bul(DUVARLAR, kimligiGuncelle('gb-200-g6')).yogunluk, 600);
});

test('Eski sürümde kaydedilmiş proje göç ettirilip hesaplanabilir', () => {
  const eskiProje = {
    surum: 1,
    proje: { ...ornekProje().proje },
    ayiricilar: [{
      ...yeniAyirici(),
      elemanId: 'ba-200', giydirmeId: 'ap-metal-50',
      yanElemanlar: [
        { id: 'y1', ad: 'Cephe', elemanId: 'tugla-d250', sivaId: 'cimento-20', sivaliYuzSayisi: 2,
          RwBeyan: null, lf: 2.8, birlesim: 'T', giydirmeId: 'yok', esnekBaglanti: false },
        { id: 'y2', ad: 'İç duvar', elemanId: 'gb-200-g4', sivaId: 'alci-15', sivaliYuzSayisi: 2,
          RwBeyan: null, lf: 2.8, birlesim: 'T', giydirmeId: 'ap-metal-75', esnekBaglanti: false },
      ],
    }],
    darbeler: [{ ...yeniDarbe(), sapId: 'kuru-sap' }],
    cepheler: [], hacimler: [],
  };

  projeKimliklerinigGuncelle(eskiProje);
  assert.equal(eskiProje.ayiricilar[0].giydirmeId, 'ap-bagimsiz-50');
  assert.equal(eskiProje.ayiricilar[0].yanElemanlar[0].elemanId, 'ddt-240');
  assert.equal(eskiProje.ayiricilar[0].yanElemanlar[1].elemanId, 'gb-g3-200');
  assert.equal(eskiProje.darbeler[0].sapId, 'kuru-sap-20');

  const s = projeyiHesapla(eskiProje);
  assert.ok(Number.isFinite(s.ayiricilar[0].sonuc.DnTw), 'göç sonrası hesap yapılamadı');
  assert.ok(Number.isFinite(s.darbeler[0].sonuc.LnTw));
});

/* ── Yoğunluk beyanı ──────────────────────────────────────────────── */

test('Beyan edilmiş yoğunluk alan kütlesini değiştirir', () => {
  const eleman = bul(DUVARLAR, 'ba-200');
  yakin(elemanAlanKutlesi(eleman), 480);
  yakin(elemanAlanKutlesi(eleman, 1800), 360);
});

test('Beyan edilmiş yoğunluk çok katmanlı sistemleri etkilemez', () => {
  const ap = bul(DUVARLAR, 'ap-75-2x2-my');
  assert.equal(elemanAlanKutlesi(ap, 2400), ap.mAlanSabit);
});

test('Yoğunluk beyanı Rw kestirimini düşürür', () => {
  const agir = elemanCoz({ elemanId: 'ba-200', sivaId: 'sivasiz', sivaliYuzSayisi: 0 });
  const hafif = elemanCoz({ elemanId: 'ba-200', sivaId: 'sivasiz', sivaliYuzSayisi: 0, yogunlukBeyan: 1200 });
  assert.ok(hafif.mAlan < agir.mAlan);
  assert.ok(hafif.Rw < agir.Rw);
  assert.equal(hafif.yogunlukBeyanEdildi, true);
  assert.equal(agir.yogunlukBeyanEdildi, false);
});

test('Beyan edilmiş Rw, yoğunluk beyanına rağmen önceliklidir', () => {
  const c = elemanCoz({ elemanId: 'ba-200', sivaId: 'sivasiz', sivaliYuzSayisi: 0, yogunlukBeyan: 1200, RwBeyan: 58 });
  assert.equal(c.Rw, 58);
});

/* ── Rezonans frekansı ────────────────────────────────────────────── */

test('Rezonans frekansı bilinen bir giydirme için gerçekçi çıkar', () => {
  // 12,5 mm alçı levha (10 kg/m²), 50 mm mineral yün dolgulu boşluk, ağır duvar
  const f0 = rezonansFrekansi(10, 300, 50, true);
  assert.ok(f0 > 60 && f0 < 85, `f0 = ${f0} Hz`);
});

test('Dolgusuz boşlukta rezonans frekansı yükselir (adyabatik sıkışma)', () => {
  const dolgulu = rezonansFrekansi(10, 300, 50, true);
  const dolgusuz = rezonansFrekansi(10, 300, 50, false);
  assert.ok(dolgusuz > dolgulu);
  yakin(dolgusuz / dolgulu, Math.sqrt(1.4), 0.01);
});

test('Boşluk derinledikçe ve levha ağırlaştıkça f₀ düşer', () => {
  assert.ok(rezonansFrekansi(10, 300, 100, true) < rezonansFrekansi(10, 300, 50, true));
  assert.ok(rezonansFrekansi(20, 300, 50, true) < rezonansFrekansi(10, 300, 50, true));
});

test('Boşluksuz giydirmede f₀ hesaplanmaz', () => {
  assert.ok(Number.isNaN(rezonansFrekansi(10, 300, 0, true)));
});

test('Rezonans yorumu eşiklere göre değişir', () => {
  assert.equal(rezonansYorumu(70).seviye, 'iyi');
  assert.equal(rezonansYorumu(160).seviye, 'orta');
  assert.equal(rezonansYorumu(300).seviye, 'kotu');
  assert.equal(rezonansYorumu(NaN).seviye, 'yok');
});

/* ── Boşluk dolgusu ───────────────────────────────────────────────── */

test('Gözenekli dolgu yerine dolgusuz seçilirse ΔRw cezalandırılır', () => {
  const dolgulu = giydirmeCoz('ap-bagimsiz-50', 'knauf-ipb039', 480);
  const dolgusuz = giydirmeCoz('ap-bagimsiz-50', 'yok', 480);
  assert.equal(dolgulu.dolguCezasi, 0);
  assert.equal(dolgusuz.dolguCezasi, -4);
  assert.equal(dolgusuz.dRw, dolgulu.dRw - 4);
});

test('Sert köpük dolgu da gözeneksiz sayılır', () => {
  const eps = giydirmeCoz('ap-bagimsiz-50', 'eps', 480);
  assert.equal(eps.dolgu.gozenekli, false);
  assert.equal(eps.dolguCezasi, -4);
});

test('Dolgu seçilmezse sistemin öngördüğü dolgu kullanılır', () => {
  const c = giydirmeCoz('ap-bagimsiz-75', null, 480);
  assert.equal(c.dolgu.id, 'knauf-ipb039');
  assert.equal(c.dolguCezasi, 0);
});

test('Giydirme kabuk yoksa f₀ hesaplanmaz ve ΔRw sıfırdır', () => {
  const c = giydirmeCoz('yok', null, 480);
  assert.equal(c.dRw, 0);
  assert.ok(Number.isNaN(c.f0));
});

test('Boşluk dolgusu DnT,w sonucunu değiştirir', () => {
  const p = ornekProje();
  p.ayiricilar[0].dolguId = 'knauf-ipb039';
  const dolgulu = projeyiHesapla(p).ayiricilar[0].sonuc.DnTw;
  p.ayiricilar[0].dolguId = 'yok';
  const dolgusuz = projeyiHesapla(p).ayiricilar[0].sonuc.DnTw;
  assert.ok(dolgulu > dolgusuz, `${dolgulu} > ${dolgusuz} olmalı`);
});

/* ── Varsayılan projeler kütüphaneyle tutarlı ─────────────────────── */

test('Varsayılan kayıtların tüm malzeme kimlikleri kütüphanede vardır', () => {
  const listeler = [TUM_ELEMANLAR, GIYDIRME_KABUKLAR, SAP_KAPLAMALAR, DOGRAMALAR,
                    SOGURUCULAR, NESNELER, SIVALAR, YALITIM_LEVHALARI];
  const varMi = (id) => listeler.some((l) => l.some((x) => x.id === id));
  const ANAHTARLAR = ['elemanId', 'dosemeId', 'sapId', 'giydirmeId', 'kapiId', 'sivaId', 'sogurucuId', 'nesneId', 'dolguId'];

  const gez = (o, yol = '') => {
    if (Array.isArray(o)) return o.forEach((x, i) => gez(x, `${yol}[${i}]`));
    if (o && typeof o === 'object') {
      for (const a of ANAHTARLAR) {
        if (typeof o[a] === 'string') assert.ok(varMi(o[a]), `${yol}.${a} = "${o[a]}" kütüphanede yok`);
      }
      Object.entries(o).forEach(([k, v]) => gez(v, `${yol}.${k}`));
    }
  };

  gez(ornekProje(), 'ornekProje');
  gez(yeniAyirici(), 'yeniAyirici');
  gez(yeniDarbe(), 'yeniDarbe');
  gez(yeniCephe(), 'yeniCephe');
  gez(yeniHacim(), 'yeniHacim');
});

/* ── Arama normalizasyonu ─────────────────────────────────────────── */

test('Arama metni Türkçe I/İ sorununu çözer', () => {
  // "IPB".toLocaleLowerCase('tr') → "ıpb" olur ve kullanıcının yazdığı
  // "ipb" ile eşleşmezdi.
  assert.equal(aramaMetni('IPB 039'), 'ipb 039');
  assert.equal(aramaMetni('İzolasyon'), 'izolasyon');
  assert.ok(aramaMetni('Knauf Insulation Mineral Plus IPB 039').includes(aramaMetni('ipb')));
});

test('Arama metni aksan duyarsızdır', () => {
  assert.equal(aramaMetni('Gürültü'), 'gurultu');
  assert.equal(aramaMetni('Döşeme'), 'doseme');
  assert.equal(aramaMetni('Şap Çimento'), 'sap cimento');
});
