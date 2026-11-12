import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../js/veri/hazir-gorseller.js';
import { bosProje } from '../js/durum.js';

/** IndexedDB yerine bellekte duran depo; kalıcılığı taklit eder. */
function bellekDeposu(baslangic = []) {
  const kayitlar = new Map(baslangic.map((k) => [k.id, structuredClone(k)]));
  return {
    kayitlar,
    hepsi: async () => [...kayitlar.values()].map((k) => structuredClone(k)),
    yaz: async (k) => { kayitlar.set(k.id, structuredClone(k)); },
    sil: async (id) => { kayitlar.delete(id); },
  };
}

const BELGE = 'data:image/png;base64,QkVMR0U=';
const DETAY1 = 'data:image/png;base64,REVUQVkx';
const DETAY2 = 'data:image/png;base64,REVUQVky';

let depo;
beforeEach(async () => {
  depo = bellekDeposu();
  H.depoAyarla(depo);
  await H.yukle();
});

test('uzman belgesi ve nokta detay kaydedilir, yeniden açılışta geri gelir', async () => {
  await H.kaydet({ tur: 'uzmanBelgesi', baslik: '', aciklama: 'D1', veri: BELGE });
  await H.kaydet({ tur: 'noktaDetay', baslik: 'ŞAFT DETAYI', aciklama: '', veri: DETAY1 });
  assert.equal(depo.kayitlar.size, 2);

  H.depoAyarla(depo);              // uygulama kapanıp açıldı
  await H.yukle();
  assert.equal(H.hazirGorseller().length, 2);
  assert.equal(H.hazirGorseller('noktaDetay')[0].baslik, 'ŞAFT DETAYI');
  assert.ok(H.hazirGorseller().every((k) => k.otomatik), 'yeni kayıt otomatik başlar');
  assert.ok(H.kitaplikta(BELGE));
});

test('aynı görüntü ikinci kez kaydedilmez, başlığı güncellenir', async () => {
  await H.kaydet({ tur: 'noktaDetay', baslik: 'A', veri: DETAY1 });
  await H.kaydet({ tur: 'noktaDetay', baslik: 'B', veri: DETAY1 });
  assert.equal(H.hazirGorseller().length, 1);
  assert.equal(H.hazirGorseller()[0].baslik, 'B');
});

test('yalnızca uzman belgesi ve nokta detay türleri, görseli olanlar kaydedilir', async () => {
  assert.equal(await H.kaydet({ tur: 'katPlani', veri: DETAY1 }), null);
  assert.equal(await H.kaydet({ tur: 'noktaDetay', veri: '' }), null);
  assert.equal(H.hazirGorseller().length, 0);
});

test('yeni projeye yalnızca otomatik işaretliler eklenir, iki kez eklenmez', async () => {
  await H.kaydet({ tur: 'uzmanBelgesi', veri: BELGE });
  const d1 = await H.kaydet({ tur: 'noktaDetay', baslik: 'D1', veri: DETAY1 });
  await H.kaydet({ tur: 'noktaDetay', baslik: 'D2', veri: DETAY2 });
  await H.otomatikAyarla(d1.id, false);

  const p = bosProje();
  assert.equal(H.otomatikleriEkle(p), 2);
  assert.deepEqual(p.onbolum.gorseller.map((g) => g.veri), [BELGE, DETAY2]);
  assert.equal(H.otomatikleriEkle(p), 0, 'zaten projede olanlar atlanır');

  assert.equal(H.projeyeEkle(p, H.hazirGorseller('noktaDetay')), 1);
  assert.equal(p.onbolum.gorseller.length, 3);
  const ids = new Set(p.onbolum.gorseller.map((g) => g.id));
  assert.equal(ids.size, 3, 'her kopya kendi kimliğini alır');
});

test('kitaplıktan kaldırmak projedeki kopyaya dokunmaz', async () => {
  const k = await H.kaydet({ tur: 'uzmanBelgesi', veri: BELGE });
  const p = bosProje();
  H.otomatikleriEkle(p);
  await H.sil(k.id);
  assert.equal(H.hazirGorseller().length, 0);
  assert.equal(depo.kayitlar.size, 0);
  assert.equal(p.onbolum.gorseller.length, 1);
});

test('depo yoksa (Node, eski tarayıcı) kitaplık boş ve kullanılamaz kalır', async () => {
  H.depoAyarla(null);
  await H.yukle();
  assert.equal(H.kullanilabilir(), false);
  assert.deepEqual(H.hazirGorseller(), []);
  assert.equal(H.otomatikleriEkle(bosProje()), 0);
});

test('depo açılamazsa hata yutulur', async () => {
  H.depoAyarla({ hepsi: async () => { throw new Error('kapalı'); } });
  await H.yukle();
  assert.equal(H.kullanilabilir(), false);
});
