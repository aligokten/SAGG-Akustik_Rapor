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
 */

const OTURUM_UCU = '/api/akustik/oturum';
const CIKIS_UCU = '/api/akustik/cikis';
const GIRIS_SAYFASI = '/akustik/giris';

/** Kalan süreyi "5 sa 12 dk" biçiminde verir. */
export function kalanSure(ms) {
  if (!(ms > 0)) return '0 dk';
  const dk = Math.ceil(ms / 60000);
  const sa = Math.floor(dk / 60);
  return sa > 0 ? `${sa} sa ${dk % 60} dk` : `${dk} dk`;
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
