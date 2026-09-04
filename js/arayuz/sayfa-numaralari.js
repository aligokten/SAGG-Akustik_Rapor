/**
 * sayfa-numaralari.js — İçindekiler sayfa numaralarını ölçerek doldurur.
 *
 * Bir bölümün kaç kâğıda basılacağı ekrandan okunamaz: yazdırma biçemleri
 * düzeni gerçekten değiştirir (tablo yazı boyu 10,5 px'e iner, `.tablo-sar`
 * kaydırması kapanır ve hücreler satır atlar, kenar çubuğu kalkar, şekil
 * yükseklikleri kısılır). Ekranda ölçülen yükseklikle sayfa numarası vermek,
 * doğru görünen ama yanlış bir içindekiler üretirdi.
 *
 * Bu yüzden ölçüm, YAZDIRMA KURALLARININ KENDİSİYLE yapılır: biçem
 * sayfasındaki `@media print` blokları geçici olarak `all` medyasına
 * çevrilir, rapor A4'ün yazılabilir genişliğine kısılır, yükseklikler
 * okunur, sonra her şey geri alınır. Kuralların ikinci bir kopyası
 * tutulmadığı için biçem değiştiğinde ölçüm kendiliğinden uyar.
 */

/** A4 (210×297 mm), 10 mm kenar boşluğu, 96 dpi. */
export const A4_YAZILABILIR_GENISLIK = (210 - 20) / 25.4 * 96;   // ≈ 718,1 px
export const A4_YAZILABILIR_YUKSEKLIK = (297 - 20) / 25.4 * 96;  // ≈ 1047,1 px

/**
 * Sayfa numarasına ayrılan alt şerit (px).
 *
 * İçerik bu şeride hiç girmez; numara ile altbilgi metni birbirinin üstüne
 * binmesin diye. Şeridi ayırmamak, numarayı "…Katmanlı Model v3" satırının
 * üzerine bastırıyordu.
 */
const NUMARA_SERIDI = 26;

/**
 * `@media print` bloklarını geçici olarak açar ve `geri()` döndürür.
 *
 * Başka bir kaynaktan gelen (cross-origin) biçem sayfasında `cssRules`
 * okunamaz; o durumda sessizce atlanır — ölçüm yine de yapılır, yalnızca
 * daha az doğru olur.
 */
function yazdirmaKurallariniAc() {
  const degisenler = [];
  for (const sayfa of Array.from(document.styleSheets)) {
    let kurallar;
    try { kurallar = sayfa.cssRules; } catch { continue; }
    if (!kurallar) continue;
    for (const kural of Array.from(kurallar)) {
      if (kural.type !== CSSRule.MEDIA_RULE) continue;
      const metin = kural.media.mediaText;
      if (!/\bprint\b/.test(metin) || /\ball\b/.test(metin)) continue;
      degisenler.push([kural.media, metin]);
      kural.media.mediaText = 'all';
    }
  }
  return () => { for (const [medya, metin] of degisenler) medya.mediaText = metin; };
}

/**
 * Bir bloğun yazdırmada bölünmeden durup duramayacağı.
 *
 * `break-inside: avoid` yalnızca blok BİR SAYFAYA SIĞIYORSA geçerlidir;
 * sayfadan uzun bir bloğu tarayıcı yine de böler.
 */
function bolunmezMi(bicem, h) {
  return h <= A4_YAZILABILIR_YUKSEKLIK && bicem.breakInside === 'avoid';
}

/**
 * Bir bölümün içeriğini "atom"lara ayırır.
 *
 * Atom, sayfaya sığan en dış bloktur; sayfadan uzun bir blok varsa onun
 * çocuklarına inilir, çünkü tarayıcı da onu çocukları hizasından böler.
 * Her atomun bölüm başına göre KONUMU kaydedilir — yükseklikleri toplamak
 * yerine konum kullanmak zorunludur: `getBoundingClientRect()` kenar
 * boşluklarını (margin) içermez ve daralan boşluklarla birlikte toplam,
 * gerçek yükseklikten yüzlerce piksel sapar (ölçülen bir örnekte
 * çocuk toplamı 1754 px iken bölümün gerçek yüksekliği 2058 px'ti).
 */
function atomlar(kap, bolumUst, liste = []) {
  for (const c of Array.from(kap.children)) {
    const r = c.getBoundingClientRect();
    if (r.height <= 0) continue;
    if (r.height > A4_YAZILABILIR_YUKSEKLIK && c.children.length > 0) {
      atomlar(c, bolumUst, liste);
      continue;
    }
    const bicem = getComputedStyle(c);
    liste.push({
      el: c,
      ust: r.top - bolumUst,
      h: r.height,
      bolunmez: bolunmezMi(bicem, r.height),
      sonrakiyle: bicem.breakAfter === 'avoid',
    });
  }
  return liste;
}

/**
 * Bir bölümün kaç kâğıda basılacağı ve kaydırma noktaları.
 *
 * Blokların doğal konumları üzerinden sayfalama benzetilir: sayfa sınırında
 * bölünemeyen bir blok, sınırın ötesine "itilir" ve bu itme sonraki bütün
 * blokları kaydırır. Sonuçta bölümün kaydırma sonrası toplam yüksekliği
 * sayfa yüksekliğine bölünerek kâğıt sayısı bulunur.
 *
 * `kaydirmalar`, itmelerin nerede ve ne kadar olduğunu tutar. Basılı konum
 * ile DOM konumu arasındaki bağ budur:
 *
 *     basiliY(domY) = domY + Σ miktar   (nokta ≤ domY olan kaydırmalar)
 *
 *
 * @returns {{kagit:number, kaydirmalar:Array<{nokta:number,miktar:number}>}}
 */
/**
 * Kapak sayfaları sabit ölçülü, tek kâğıtlık tasarımlardır; ölçülmezler.
 * (Alt kenar boşlukları sıfır olduğu için yükseklikleri öteki sayfalardan
 * farklıdır ve genel ölçüm onları iki kâğıt sayardı.)
 */
const TEK_KAGIT = new Set(['kapak', 'arkaKapak']);

function sayfaBilgisi(bolum) {
  if (TEK_KAGIT.has(bolum.dataset.bolumId)) return { kagit: 1, kaydirmalar: [] };
  const bolumUst = bolum.getBoundingClientRect().top;
  const liste = atomlar(bolum, bolumUst);
  const yukseklik = bolum.getBoundingClientRect().height;
  if (!liste.length) {
    return { kagit: Math.max(1, Math.ceil(yukseklik / A4_YAZILABILIR_YUKSEKLIK)), kaydirmalar: [] };
  }

  const kaydirmalar = [];
  let kaydirma = 0;
  for (let i = 0; i < liste.length; i += 1) {
    const a = liste[i];
    const ust = a.ust + kaydirma;

    // `break-after: avoid` taşıyan blok (ör. başlık), ardından geleni de
    // yanında taşır; sığma sınaması ikisi birlikte yapılır.
    let taban = ust + a.h;
    if (a.sonrakiyle && liste[i + 1]) taban = liste[i + 1].ust + kaydirma + liste[i + 1].h;

    const sayfaSonu = (Math.floor(ust / A4_YAZILABILIR_YUKSEKLIK) + 1) * A4_YAZILABILIR_YUKSEKLIK;
    // İçeriğin girebileceği son nokta: sayfa sonu eksi numara şeridi.
    const dolumSonu = sayfaSonu - NUMARA_SERIDI;
    const birim = taban - ust;
    const bolunemez = a.bolunmez || (a.sonrakiyle && birim <= A4_YAZILABILIR_YUKSEKLIK);

    if (taban > dolumSonu && bolunemez && birim <= A4_YAZILABILIR_YUKSEKLIK) {
      const miktar = sayfaSonu - ust;   // blok, sonraki sayfanın başına iner
      kaydirmalar.push({ el: a.el, miktar });
      kaydirma += miktar;
    }
  }
  return {
    kagit: Math.max(1, Math.ceil((yukseklik + kaydirma) / A4_YAZILABILIR_YUKSEKLIK)),
    kaydirmalar,
  };
}

/** Kapak sayfaları numaralanmaz. */
export const NUMARASIZ = new Set(['kapak', 'arkaKapak']);

/** Önceki turdan kalan dolgu ve numaraları siler (ölçüm bunlarsız yapılmalı). */
function izleriSil(kok) {
  for (const el of kok.querySelectorAll('.sayfa-dolgu, .sayfa-no')) el.remove();
}

/**
 * Sayfa numaralarını kâğıtların SAĞ ALT köşesine yerleştirir.
 *
 * Numarayı doğru yere koymanın önünde tek bir engel vardı: bir blok sayfa
 * sonunda bölünemeyip aşağı itildiğinde, kâğıdın alt kısmı boş kalır ama o
 * boşluğun DOM'da KARŞILIĞI YOKTUR — oraya mutlak konumla ulaşılamaz
 * (denendi: numaralar sayfa ortasında kalıyordu).
 *
 * Çözüm, boşluğu gerçekten var etmek: itmenin olacağı yere tam o yükseklikte
 * bir dolgu bloğu konur. Böylece blok zaten ineceği yere doğal olarak iner —
 * sayfalama değişmez — ve DOM konumu ile basılı konum birebir örtüşür.
 * Numaralar artık sayfa yüksekliğinin katlarına konabilir.
 */
function numaralariYerlestir(bolum, ilkSayfa, bilgi) {
  for (const k of bilgi.kaydirmalar) {
    const dolgu = document.createElement('div');
    dolgu.className = 'sayfa-dolgu';
    dolgu.style.height = `${k.miktar}px`;
    k.el.parentElement.insertBefore(dolgu, k.el);
  }

  if (NUMARASIZ.has(bolum.dataset.bolumId)) return;

  for (let i = 1; i <= bilgi.kagit; i += 1) {
    const el = document.createElement('div');
    el.className = 'sayfa-no';
    el.textContent = String(ilkSayfa + i - 1);
    el.style.top = `${Math.round(i * A4_YAZILABILIR_YUKSEKLIK - NUMARA_SERIDI + 8)}px`;
    bolum.appendChild(el);
  }
}

/**
 * Bir ölçüm turu: bölümleri ölçer, içindekiler satırlarını doldurur.
 *
 * Ölçüm senkron yapılır ve düzen değişikliği aynı karede geri alınır; bu
 * yüzden kullanıcı bir titreme görmez.
 *
 * @param {Element} kok Raporun kapsayıcısı (#icerik)
 * @returns {Map<string,number>|null} Bölüm kimliği → başlangıç sayfası
 */
function olc(kok) {
  const bolumler = Array.from(kok.querySelectorAll('.rapor[data-bolum-id]'));
  const hedefler = Array.from(kok.querySelectorAll('.ic-sayfa[data-bolum-ref]'));
  if (!bolumler.length || !hedefler.length) return null;

  const kapsayici = bolumler[0].parentElement;
  const eskiGenislik = kapsayici.style.width;
  const eskiMaks = kapsayici.style.maxWidth;

  const geri = yazdirmaKurallariniAc();
  kapsayici.style.width = `${A4_YAZILABILIR_GENISLIK}px`;
  kapsayici.style.maxWidth = `${A4_YAZILABILIR_GENISLIK}px`;

  const sayfalar = new Map();
  try {
    // Ölçüm önceki turun dolgularından arınmış düzende yapılmalı.
    izleriSil(kok);
    let imlec = 1;
    for (const b of bolumler) {
      sayfalar.set(b.dataset.bolumId, imlec);
      const bilgi = sayfaBilgisi(b);
      numaralariYerlestir(b, imlec, bilgi);
      imlec += bilgi.kagit;
    }
  } finally {
    kapsayici.style.width = eskiGenislik;
    kapsayici.style.maxWidth = eskiMaks;
    geri();
  }

  for (const h of hedefler) {
    const n = sayfalar.get(h.dataset.bolumRef);
    h.textContent = n == null ? '—' : String(n);
  }
  return sayfalar;
}

/**
 * İçindekilerin sayfa numaralarını doldurur; resimler yüklendikçe tazeler.
 *
 * Çizimden hemen sonra yapılan ölçümde kat planı ve kesit görselleri henüz
 * çözülmemiş olur: `<img>` yüksekliği 0 okunur ve o bölümler bir kâğıt
 * eksik sayılır — ölçülen bir örnekte bu, sonraki bütün numaraları bir
 * kaydırıyordu. Bu yüzden ilk tur hemen (numaralar boş kalmasın diye),
 * ikinci tur bekleyen görseller yüklendikten sonra yapılır.
 *
 * @param {Element} kok Raporun kapsayıcısı (#icerik)
 */
export function icindekileriDoldur(kok = document) {
  const sonuc = olc(kok);

  const bekleyen = Array.from(kok.querySelectorAll('.rapor img'))
    .filter((i) => !i.complete || i.naturalHeight === 0);
  if (bekleyen.length) {
    let kalan = bekleyen.length;
    const bitti = () => {
      kalan -= 1;
      if (kalan > 0) return;
      // Rapor bu arada yeniden çizilmiş olabilir; ölçüm kabı yeniden sorgular.
      try { olc(kok); } catch { /* ölçüm başarısızsa numaralar olduğu gibi kalır */ }
    };
    for (const i of bekleyen) {
      i.addEventListener('load', bitti, { once: true });
      i.addEventListener('error', bitti, { once: true });
    }
  }
  return sonuc;
}
