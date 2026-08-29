/**
 * favoriler.js — Sık kullanılan katman kombinasyonlarının kişisel kitaplığı.
 *
 * Favoriler projeye değil, kullanıcıya aittir: tarayıcıda ayrı bir anahtarda
 * saklanır ve tüm projelerde kullanılabilir. Bir favori, katman listesinin
 * derin kopyasını taşır; yüklenince yeni bir kopya üretilir, böylece favori
 * ile projedeki katmanlar birbirini etkilemez.
 *
 * Kategoriler, aynı adı taşıyan farklı yapıları ayırmak içindir (ör. "20 cm
 * gazbeton" bir iç duvarda da bir dış duvarda da bulunabilir).
 */

const DEPO_ANAHTARI = 'sagg-akustik-katman-favorileri-v1';

/** Favori kategorileri — görünen adlar ve sıralama. */
export const FAVORI_KATEGORILERI = {
  icDuvar:  { ad: 'İç duvar', kod: 'İD' },
  disDuvar: { ad: 'Dış duvar', kod: 'DD' },
  doseme:   { ad: 'Döşeme', kod: 'DÖ' },
};

/** Bilinmeyen bir kategori kodunu geçerli bir değere indirger. */
export function kategoriDogrula(kategori) {
  return Object.hasOwn(FAVORI_KATEGORILERI, kategori) ? kategori : 'icDuvar';
}

let onbellek = null;

function oku() {
  if (onbellek) return onbellek;
  try {
    const ham = localStorage.getItem(DEPO_ANAHTARI);
    const d = ham ? JSON.parse(ham) : [];
    onbellek = Array.isArray(d) ? d.filter(gecerliMi) : [];
  } catch {
    onbellek = [];
  }
  return onbellek;
}

function yaz(liste) {
  onbellek = liste;
  try {
    localStorage.setItem(DEPO_ANAHTARI, JSON.stringify(liste));
  } catch { /* depolama kullanılamıyor olabilir */ }
}

function gecerliMi(f) {
  return !!(f && typeof f.id === 'string' && typeof f.ad === 'string'
    && Array.isArray(f.katmanlar) && f.katmanlar.length > 0);
}

/** Katman listesinin bağımsız bir kopyasını üretir. */
function kopyala(katmanlar) {
  return katmanlar.map((k) => ({ ...k }));
}

/** Tüm favoriler; kategoriye ve ada göre sıralı. */
export function favorileriListele() {
  const sira = Object.keys(FAVORI_KATEGORILERI);
  return [...oku()].sort((a, b) => {
    const fark = sira.indexOf(a.kategori) - sira.indexOf(b.kategori);
    return fark !== 0 ? fark : a.ad.localeCompare(b.ad, 'tr');
  });
}

/** Kategoriye göre gruplanmış favoriler: { icDuvar: [...], … } */
export function favorileriGrupla() {
  const gruplar = {};
  for (const k of Object.keys(FAVORI_KATEGORILERI)) gruplar[k] = [];
  for (const f of favorileriListele()) gruplar[kategoriDogrula(f.kategori)].push(f);
  return gruplar;
}

export function favoriBul(id) {
  return oku().find((f) => f.id === id) || null;
}

/**
 * Yeni bir favori ekler.
 *
 * @param {string} ad
 * @param {string} kategori  icDuvar | disDuvar | doseme
 * @param {Object[]} katmanlar
 * @returns {{ok:boolean, hata?:string, favori?:Object}}
 */
export function favoriEkle(ad, kategori, katmanlar) {
  const temizAd = String(ad || '').trim();
  if (!temizAd) return { ok: false, hata: 'Favori için bir ad girin.' };
  if (!Array.isArray(katmanlar) || katmanlar.length === 0) {
    return { ok: false, hata: 'Kaydedilecek katman yok.' };
  }

  const kat = kategoriDogrula(kategori);
  const liste = oku();
  // Aynı kategoride aynı ad varsa üzerine yazılır; kitaplık böylece
  // kalabalıklaşmadan güncellenebilir.
  const mevcut = liste.find((f) => f.kategori === kat && f.ad.localeCompare(temizAd, 'tr', { sensitivity: 'base' }) === 0);

  const favori = {
    id: mevcut?.id || `fav${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    ad: temizAd,
    kategori: kat,
    katmanlar: kopyala(katmanlar),
    tarih: new Date().toISOString().slice(0, 10),
  };

  yaz(mevcut ? liste.map((f) => (f.id === mevcut.id ? favori : f)) : [...liste, favori]);
  return { ok: true, favori, guncellendi: !!mevcut };
}

export function favoriSil(id) {
  yaz(oku().filter((f) => f.id !== id));
}

/** Bir favorinin katmanlarının bağımsız kopyasını verir (projeye yüklemek için). */
export function favoriKatmanlari(id) {
  const f = favoriBul(id);
  return f ? kopyala(f.katmanlar) : null;
}

/** Dışa aktarma paketi. */
export function favoriPaketi() {
  return { bicim: 'SAGG-KATMAN-FAVORILERI-1', favoriler: favorileriListele() };
}

/**
 * İçe aktarır. Aynı kimlikli kayıtlar güncellenir, yeniler eklenir.
 * @returns {{eklenen:number, guncellenen:number}}
 */
export function favorileriIceAktar(paket) {
  const gelen = Array.isArray(paket) ? paket : (paket?.favoriler || []);
  const liste = oku();
  let eklenen = 0;
  let guncellenen = 0;

  for (const ham of gelen) {
    if (!gecerliMi(ham)) continue;
    const f = {
      id: ham.id,
      ad: String(ham.ad).trim(),
      kategori: kategoriDogrula(ham.kategori),
      katmanlar: kopyala(ham.katmanlar),
      tarih: ham.tarih || new Date().toISOString().slice(0, 10),
    };
    const idx = liste.findIndex((x) => x.id === f.id);
    if (idx >= 0) { liste[idx] = f; guncellenen += 1; } else { liste.push(f); eklenen += 1; }
  }

  yaz(liste);
  return { eklenen, guncellenen };
}

/** Testler için: önbelleği ve depoyu sıfırlar. */
export function favorileriTemizle() {
  onbellek = [];
  try { localStorage.removeItem(DEPO_ANAHTARI); } catch { /* yoksay */ }
}
