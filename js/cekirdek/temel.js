/**
 * temel.js — Temel akustik yardımcı fonksiyonlar.
 *
 * Bu modül, TS EN 12354 serisinde ve "Binaların Gürültüye Karşı Korunması
 * Hakkında Yönetmelik" (RG 31/05/2017-30082) eklerinde geçen temel
 * dönüşümleri içerir.
 */

/** Oktav bandı merkez frekansları (Hz) — TS EN ISO 717 değerlendirme aralığı. */
export const OKTAV_BANTLARI = [125, 250, 500, 1000, 2000, 4000];

/** 1/3 oktav bandı merkez frekansları (Hz), 100–3150 Hz. */
export const UCTE_BIR_OKTAV_100_3150 = [
  100, 125, 160, 200, 250, 315, 400, 500, 630,
  800, 1000, 1250, 1600, 2000, 2500, 3150,
];

/** Onluk logaritma. */
export const log10 = (x) => Math.log(x) / Math.LN10;

/** Sayıyı verilen basamağa yuvarlar (varsayılan 1). */
export function yuvarla(x, basamak = 1) {
  if (!Number.isFinite(x)) return NaN;
  const k = Math.pow(10, basamak);
  return Math.round(x * k) / k;
}

/** Enerjik (logaritmik) toplama: 10·lg(Σ 10^(Li/10)). */
export function enerjikTopla(seviyeler) {
  const toplam = seviyeler
    .filter(Number.isFinite)
    .reduce((a, L) => a + Math.pow(10, L / 10), 0);
  return toplam > 0 ? 10 * log10(toplam) : -Infinity;
}

/**
 * Yalıtım değerlerinin enerjik olarak birleştirilmesi:
 * R_top = −10·lg( Σ 10^(−Ri/10) )
 * Paralel ses iletim yollarının toplanmasında kullanılır.
 */
export function yalitimlariBirlestir(yalitimlar) {
  const toplam = yalitimlar
    .filter(Number.isFinite)
    .reduce((a, R) => a + Math.pow(10, -R / 10), 0);
  return toplam > 0 ? -10 * log10(toplam) : Infinity;
}

/**
 * Sabine soğurma alanı: A = 0,16·V / T  (m² Sabine)
 * @param {number} V Hacim (m³)
 * @param {number} T Reverberasyon süresi (s)
 */
export function sogurmaAlani(V, T) {
  return (0.16 * V) / T;
}

/**
 * Alan yalıtımından (R') standardize edilmiş düzey farkına (DnT) geçiş.
 *
 *   DnT = R' + 10·lg( 0,32·V / S )        (T0 = 0,5 s)
 *
 * Türetme: DnT = D + 10·lg(T/T0), R' = D + 10·lg(S/A), A = 0,16·V/T.
 *
 * @param {number} Rw   Ayırıcı elemanın yerinde ses azaltma indisi R'w (dB)
 * @param {number} V    Alıcı mekân hacmi (m³)
 * @param {number} S    Ayırıcı elemanın ortak yüzey alanı (m²)
 * @param {number} T0   Referans reverberasyon süresi (s), konutlarda 0,5 s
 */
export function RdenDnT(Rw, V, S, T0 = 0.5) {
  if (!(V > 0) || !(S > 0)) return NaN;
  return Rw + 10 * log10((0.64 * T0 * V) / S);
}

/** DnT → R' ters dönüşümü. */
export function DnTdenR(DnTw, V, S, T0 = 0.5) {
  if (!(V > 0) || !(S > 0)) return NaN;
  return DnTw - 10 * log10((0.64 * T0 * V) / S);
}

/**
 * Normalize edilmiş darbe sesi düzeyinden (L'n) standardize edilmiş
 * darbe sesi düzeyine (L'nT) geçiş.
 *
 *   L'nT = L'n − 10·lg( 0,064·T0·V )      (T0 = 0,5 s → 0,032·V)
 *
 * @param {number} Lnw Yerinde normalize darbe sesi düzeyi L'n,w (dB)
 * @param {number} V   Alıcı mekân hacmi (m³)
 * @param {number} T0  Referans reverberasyon süresi (s)
 */
export function LndenLnT(Lnw, V, T0 = 0.5) {
  if (!(V > 0)) return NaN;
  return Lnw - 10 * log10(0.064 * T0 * V);
}

/** L'nT → L'n ters dönüşümü. */
export function LnTdenLn(LnTw, V, T0 = 0.5) {
  if (!(V > 0)) return NaN;
  return LnTw + 10 * log10(0.064 * T0 * V);
}

/**
 * Alan kütlesi (m', kg/m²) hesabı.
 * @param {number} kalinlik Kalınlık (mm)
 * @param {number} yogunluk Birim hacim ağırlığı (kg/m³)
 * @param {number} sivaTekYuz Tek yüzdeki sıva alan kütlesi (kg/m²)
 * @param {number} sivaliYuzSayisi Sıvalı yüz sayısı (0, 1 veya 2)
 */
export function alanKutlesi(kalinlik, yogunluk, sivaTekYuz = 0, sivaliYuzSayisi = 0) {
  return (kalinlik / 1000) * yogunluk + sivaTekYuz * sivaliYuzSayisi;
}

/**
 * Giydirme kabuk / bölme duvar boşluğunun rezonans (kütle-yay-kütle)
 * frekansı f₀ (Hz).
 *
 *   f₀ = (1/2π)·√( s′ · (1/m′₁ + 1/m′₂) )        s′ = κ·P₀/d
 *
 *   m′₁ : giydirme levhasının alan kütlesi (kg/m²)
 *   m′₂ : taşıyıcı elemanın alan kütlesi (kg/m²)
 *   d   : boşluk derinliği (m)
 *   P₀  : atmosfer basıncı, 101 325 Pa
 *   κ   : gözenekli dolgulu boşlukta 1,0 (izotermal),
 *         boş (dolgusuz) boşlukta 1,4 (adyabatik)
 *
 * f₀ ne kadar düşükse giydirme kabuk o kadar etkilidir. Tasarımda f₀'ın
 * değerlendirme aralığının (100 Hz) belirgin biçimde altında kalması,
 * uygulamada 80 Hz'in altı hedeflenir. f₀ 200 Hz'in üzerine çıktığında
 * giydirme kabuk yalıtımı iyileştirmek yerine kötüleştirebilir.
 *
 * @param {number} mLevha  Giydirme levhasının alan kütlesi (kg/m²)
 * @param {number} mTasiyici Taşıyıcı elemanın alan kütlesi (kg/m²)
 * @param {number} boslukMm Boşluk derinliği (mm)
 * @param {boolean} gozenekliDolgu Boşlukta gözenekli (mineral yün vb.) dolgu var mı
 * @returns {number} f₀ (Hz)
 */
export function rezonansFrekansi(mLevha, mTasiyici, boslukMm, gozenekliDolgu = true) {
  const d = (boslukMm || 0) / 1000;
  if (!(d > 0) || !(mLevha > 0) || !(mTasiyici > 0)) return NaN;
  const P0 = 101325;
  const kappa = gozenekliDolgu ? 1.0 : 1.4;
  const sDinamik = (kappa * P0) / d;
  return Math.sqrt(sDinamik * (1 / mLevha + 1 / mTasiyici)) / (2 * Math.PI);
}

/** f₀ değerine göre tasarım yorumu. */
export function rezonansYorumu(f0) {
  if (!Number.isFinite(f0)) return { seviye: 'yok', metin: 'Hesaplanamadı' };
  if (f0 <= 80)  return { seviye: 'iyi',  metin: 'Çok uygun — boşluk derinliği ve kütle yeterli' };
  if (f0 <= 125) return { seviye: 'iyi',  metin: 'Uygun' };
  if (f0 <= 200) return { seviye: 'orta', metin: 'Sınırda — boşluğu derinleştirmek ya da levhayı ağırlaştırmak iyileştirir' };
  return { seviye: 'kotu', metin: 'Yüksek — bu giydirme kabuk yalıtımı kötüleştirebilir' };
}

/**
 * İki kabuklu (boşlukla ayrılmış) bir sistemde, kütle kanununun tek kabuk
 * gibi varsaydığı taban değere göre kavitenin (boşluğun) sağladığı ek
 * yalıtım ΔR (dB).
 *
 * Fiziksel dayanak: kütle-yay-kütle rezonansının üzerindeki frekanslarda
 * yalıtım, tek kabuklu (aynı toplam kütleli) bir elemana göre daha hızlı
 * artar. Bu iyileşme miktarı rezonans frekansı f₀'a bağlıdır; f₀ ne kadar
 * düşükse (derin boşluk, hafif kabuklar, gözenekli dolgu) kavite o kadar
 * etkilidir.
 *
 * Aşağıdaki bağıntı, tipik giydirme kabuk sistemleri için literatürde
 * bildirilen ΔRw değerleriyle (f₀ ≈ 80 Hz → ~16 dB, f₀ ≈ 125 Hz → ~10 dB,
 * f₀ ≈ 200 Hz → ~4 dB, f₀ ≳ 300 Hz → ~0 dB) uyumlu olacak şekilde
 * kalibre edilmiş, düzgün (log-doğrusal) bir mühendislik yaklaşımıdır.
 *
 *   ΔR(f₀) = 73,4 − 30,15·log10(f₀),  0 ile 25 dB arasında sınırlanır
 *
 * ÖNEMLİ: Bu, rijit köprüleme (nokta temas, ankraj) bulunmayan, düzgün
 * biçimde ayrılmış ve gözenekli malzeme ile sönümlenmiş boşluklar için
 * geçerli bir KESTİRİMDİR; kritik tasarımlarda ölçüm veya üretici beyan
 * verisi kullanılmalıdır.
 *
 * @param {number} f0 Kavitenin rezonans frekansı (Hz)
 * @returns {number} ΔR (dB)
 */
export function ikiKabukBonusu(f0) {
  if (!Number.isFinite(f0) || f0 <= 0) return 0;
  const dR = 73.4 - 30.15 * log10(f0);
  return Math.min(25, Math.max(0, dR));
}
