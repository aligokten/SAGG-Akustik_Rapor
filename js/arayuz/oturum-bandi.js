/**
 * oturum-bandi.js — akustik.saggplus.com oturum bilgisi.
 *
 * Web sürümü, saggplus.com sunucusundaki bir giriş kapısının arkasında
 * yayımlanır (Nginx auth_request). Kapı /api/akustik/oturum ucunu sunar; bu
 * modül ondan kullanıcıyı öğrenir ve üst çubuğa bir "Çıkış" düğmesi ekler.
 * Demo hesabında kalan süre de gösterilir; süre dolunca sayfa yeniden
 * yüklenir ve kapı kullanıcıyı giriş sayfasına gönderir.
 *
 * Uç yoksa (GitHub Pages, masaüstü sürümü, yerel sunucu) hiçbir şey eklenmez.
 * Bu, demo kısıtlarının yalnızca kapı arkasındaki web sürümünde geçerli
 * olması demektir; masaüstü (tam) sürüm etkilenmez.
 */

const OTURUM_UCU = '/api/akustik/oturum';
const CIKIS_UCU = '/api/akustik/cikis';
const GIRIS_SAYFASI = '/akustik/giris';

/** E-posta adresi; demo kullanıcısına tam sürüm için gösterilir. */
export const ILETISIM_EPOSTA = 'info@saggplus.com';

let demoOturum = false;

/**
 * Geçerli oturum demo hesabına mı ait?
 *
 * Oturum bilgisi sunucudan gelene kadar `false` döner. Rapor dışa aktarma
 * gibi kullanıcı eylemleri bu noktadan çok sonra tetiklendiği için pratikte
 * bilgi hazırdır; yine de bu bir caydırıcıdır, kopya korumasi değildir.
 */
export function demoMu() {
  return demoOturum;
}

/** Kalan süreyi "5 sa 12 dk" biçiminde verir. */
export function kalanSure(ms) {
  if (!(ms > 0)) return '0 dk';
  const dk = Math.ceil(ms / 60000);
  const sa = Math.floor(dk / 60);
  return sa > 0 ? `${sa} sa ${dk % 60} dk` : `${dk} dk`;
}

/**
 * Demo oturumunda kâğıda/PDF'e basılacak uyarı sayfasını hazırlar.
 *
 * Ekranda görünmez; yalnızca `@media print` içinde açılır ve raporun kendisi
 * o sırada gizlenir (bkz. css/stil.css, "demo-oturum"). Böylece tarayıcının
 * yazdırma penceresi (Ctrl+P, "PDF olarak kaydet") rapor yerine bu sayfayı
 * verir.
 */
function baskiUyarisiniEkle() {
  if (document.querySelector('.demo-baski-uyarisi')) return;

  const kutu = document.createElement('div');
  kutu.className = 'demo-baski-uyarisi';
  kutu.setAttribute('aria-hidden', 'true');

  const baslik = document.createElement('strong');
  baslik.textContent = 'SAGG Akustik Hesap Aracı — demo sürümü';

  const metin = document.createElement('p');
  metin.textContent =
    'Demo sürümünde raporun çıktısı alınamaz ve PDF olarak kaydedilemez.';

  const iletisim = document.createElement('p');
  iletisim.textContent = `Tam sürüm için lütfen bizimle iletişime geçiniz: ${ILETISIM_EPOSTA}`;

  kutu.append(baslik, metin, iletisim);
  document.body.append(kutu);
}

export async function oturumBandiniBaslat(kap) {
  if (!kap || !/^https?:$/.test(location.protocol)) return;

  let oturum;
  try {
    const yanit = await fetch(OTURUM_UCU, { credentials: 'same-origin', cache: 'no-store' });
    if (!yanit.ok || !(yanit.headers.get('content-type') || '').includes('json')) return;
    oturum = await yanit.json();
  } catch {
    return;
  }
  if (!oturum?.email) return;

  const bant = document.createElement('div');
  bant.className = 'oturum-bandi';
  bant.title = oturum.email;

  if (oturum.kind === 'demo') {
    demoOturum = true;
    document.body.classList.add('demo-oturum');
    baskiUyarisiniEkle();
  }

  const bitis = oturum.expires_at ? new Date(oturum.expires_at).getTime() : null;
  if (oturum.kind === 'demo' && bitis) {
    const sure = document.createElement('span');
    sure.className = 'oturum-demo';
    const guncelle = () => {
      const kalan = bitis - Date.now();
      if (kalan <= 0) {
        location.reload();
        return;
      }
      sure.textContent = `Demo · ${kalanSure(kalan)} kaldı`;
      sure.classList.toggle('son-saat', kalan < 3600000);
    };
    guncelle();
    setInterval(guncelle, 30000);
    bant.append(sure);
  }

  const cikis = document.createElement('button');
  cikis.type = 'button';
  cikis.className = 'dugme acik kucuk';
  cikis.textContent = 'Çıkış';
  cikis.addEventListener('click', async () => {
    try { await fetch(CIKIS_UCU, { method: 'POST', credentials: 'same-origin' }); } catch { /* yine de yönlendir */ }
    location.href = GIRIS_SAYFASI;
  });
  bant.append(cikis);

  kap.prepend(bant);
}
