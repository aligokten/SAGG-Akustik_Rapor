/**
 * lisans.js — Programın lisans ve sorumluluk bilgileri.
 *
 * Tek kaynaktır: raporun her sayfasındaki altbilgi buradan beslenir, böylece
 * metin tek yerden güncellenir ve sayfalar arasında ayrışmaz.
 */

export const LISANS = {
  /** Programın lisans sahibi (ticari unvan). */
  sahip: 'Sinem Ali Gökten Grup İnşaat Mimarlık Akustik Müh. San. Tic. Ltd. Şti.',

  /** Programı geliştiren. */
  gelistirici: 'SAGG+ App',

  /** Telif ibaresi. */
  haklar: 'Tüm hakları saklıdır.',

  /**
   * Sorumluluk ibaresi. Raporun hukuki niteliği açısından belirleyicidir:
   * araç bir ön boyutlandırma yapar, sonucun doğruluğu ve kullanımı proje
   * müellifinin sorumluluğundadır.
   */
  sorumluluk: 'Rapor içeriğinden ve hesaplamalardan proje müellifi sorumludur.',
};

/**
 * Telif satırı — yılı raporun tarihinden alır, yoksa içinde bulunulan yıl.
 * @param {string} [tarih] ISO tarih (YYYY-AA-GG)
 */
export function telifSatiri(tarih) {
  const yil = /^(\d{4})/.exec(String(tarih || ''))?.[1] || String(new Date().getFullYear());
  return `© ${yil} ${LISANS.sahip} · ${LISANS.haklar}`;
}
