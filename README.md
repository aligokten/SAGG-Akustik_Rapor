# SAGG Akustik Hesap Aracı

**Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik** (Resmî Gazete 31/05/2017 – 30082;
değişik: 01/07/2018 – 30465) ve eklerine göre bina akustiği hesabı yapan Türkçe web aracı.

**▶ Canlı sürüm: <https://aligokten.github.io/SAGG-Akustik_Rapor/>**
*(Bağlantının çalışması için Pages'in bir kez açılması gerekir — bkz. [Yayın](#yayın).)*

Alman *KS-Schallschutzrechner*'ın (Kalksandstein, DIN 4109) yaptığı işi Türkiye mevzuatı için
karşılayacak biçimde tasarlanmıştır: yapı elemanlarının ses yalıtım başarımını **yan yol iletimini de
içerecek şekilde** hesaplar, sonucu yönetmeliğin eklerindeki sınır değerlerle karşılaştırır ve
**akustik performans sınıfını** (A–F) belirler.

Kenar çubuklu bir dashboard olarak çalışır: **Panel** ekranı projenin belirleyici performans sınıfını,
uygunluk oranını ve gereksinimi sağlamayan bileşenleri marj çubuklarıyla birlikte tek bakışta
gösterir; menüdeki sayaçlar hangi bölümde kaç bileşen olduğunu ve kaçının sınırda kaldığını
belirtir. Açık/koyu tema desteklidir ve dar ekranlarda menü çekmeceye dönüşür.

---

## Ne hesaplar?

| Bölüm | Gösterge | Yöntem | Karşılaştırma |
|---|---|---|---|
| Ayırıcı elemanlar (düşey/yatay) | `DnT,w` | TS EN 12354-1, doğrudan yol + Ff/Fd/Df yan yolları | EK-3 Tablo 3.2 |
| Döşemeler | `L'nT,w` | TS EN 12354-2, `L'n,w = Ln,w,eq − ΔLw + K` | EK-3 Tablo 3.3 |
| Cephe (dış yapı elemanı) | `D2m,nT,w` | TS EN 12354-3, bileşik yalıtım + biçim ve hacim düzeltmesi | EK-3 Tablo 3.1 |
| Hacimler | `T` (çınlama süresi) | Sabine bağıntısı, oktav bantlarında, hava soğurması dahil | EK-5 |

Ayrıca: mekân içi gürültü düzeyi sınırları (EK-4 Tablo 4.1) ve mekânların gürültülülük/hassasiyet
dereceleri (EK-2 Tablo 2.1) veri katmanında yer alır.

### Kullanılan bağıntılar

```
R'w   = −10·lg( 10^(−R_Dd/10) + Σ 10^(−R_Ff/10) + Σ 10^(−R_Fd/10) + Σ 10^(−R_Df/10) )
R_Ff  = (R_F,w + R_f,w)/2 + ΔR_Ff + K_Ff + 10·lg( Ss / (l₀·lf) )
DnT,w = R'w + 10·lg( 0,32·V / S )                       (T₀ = 0,5 s)

L'n,w  = Ln,w,eq − ΔLw + K          Ln,w,eq = 164 − 35·lg(m')
L'nT,w = L'n,w − 10·lg( 0,032·V )                       (T₀ = 0,5 s)

D2m,nT,w = R'w,bileşik + ΔLfs + 10·lg( V / (6·T₀·S) )

T = 0,161·V / ( Σ Sᵢ·αᵢ + Σ Aₙ + 4·m·V )
```

Titreşim azaltma indisleri `Kij`, TS EN 12354-1 Ek-E'nin rijit birleşim bağıntıları ile hesaplanır
(T ve X birleşimleri, `M = lg(m'ᵢ/m'ⱼ)`).

Beyan edilmiş `Rw` girilmemiş masif elemanlarda değer, alan kütlesinden kestirilir. İki model
seçilebilir: **TS EN 12354-1 Ek-B** (varsayılan) ve karşılaştırma amaçlı **DIN 4109-32**.

---

## ⚠️ Doğrulama uyarısı — önce okuyun

Yönetmelik eklerindeki **sayısal sınır değerleri**, `js/veri/yonetmelik.js` dosyasında ayrı ve
düzenlenebilir bir veri katmanında tutulur. Bu değerler yönetmeliğin ekler yapısına uygun biçimde
kodlanmıştır, ancak **resmî metinle satır satır karşılaştırılmamıştır** ve her tablo
`dogrulama: 'TASLAK — resmî metinle doğrulanmalıdır'` olarak işaretlidir.

Resmî bir işlemde kullanmadan önce:

1. Uygulamada **Yönetmelik verileri** sekmesini açın.
2. Tablolardaki değerleri [mevzuat.gov.tr](https://www.mevzuat.gov.tr) üzerindeki yürürlükteki metin
   (Mevzuat No: 23616) ile karşılaştırın.
3. Farklı olanları doğrudan arayüzden düzeltin — kod değiştirmeye gerek yoktur.
4. **JSON olarak indir** ile doğrulanmış veri setini kaydedin; ekibinizle paylaşıp
   **JSON yükle** ile geri yükleyebilirsiniz.

Düzenlemeleriniz tarayıcıda saklanır ve proje dosyasıyla birlikte dışa aktarılır.

Aynı biçimde, malzeme kütüphanesindeki (`js/veri/malzemeler.js`) `Rw`, `ΔLw`, `ΔRw`, `Dn,e,w` ve
soğurma katsayıları **tipik tasarım değerleridir**. Akustik projede, kullanılacak ürünün
TS EN ISO 10140 serisine göre akredite laboratuvarda ölçülmüş beyan değerleri esas alınmalıdır;
arayüzdeki "Beyan edilmiş …" alanları bunun içindir.

---

## Kullanım

Kurulum gerekmez — [canlı sürümü](https://aligokten.github.io/SAGG-Akustik_Rapor/) doğrudan
tarayıcıda açabilirsiniz. Tüm hesaplar tarayıcı içinde çalışır; hiçbir proje verisi sunucuya
gönderilmez, çalışmanız tarayıcınızda saklanır.

Yerelde çalıştırmak için: derleme adımı yoktur, saf HTML + ES modülleridir. ES modülleri `file://`
üzerinden çalışmadığı için basit bir yerel sunucu gerekir:

```bash
git clone https://github.com/aligokten/SAGG-Akustik_Rapor.git
cd SAGG-Akustik_Rapor
npm start                 # veya: python3 -m http.server 8080
# tarayıcıda http://localhost:8080
```

GitHub Pages gibi bir statik barındırmaya olduğu gibi yüklenebilir.

### Akış

0. **Panel** — genel görünüm: belirleyici performans sınıfı, uygunluk oranı, dikkat gerektiren
   bileşenler ve bölüm bazlı özet tablolar. Her satırdan ilgili bölüme geçilebilir.
1. **Proje künyesi** — künye, bina türü, yapının durumu (yeni bina / kullanım amacı değişikliği / esaslı
   tadilat) ve hedef akustik performans sınıfı. Yönetmelik yeni binalarda en az **C** sınıfı ister.
2. **Ayırıcı elemanlar** — kaynak ve alıcı mekânları seçin, ayırıcı elemanı ve yan elemanları
   (birleşim uzunluğu `lf`, birleşim tipi T/X) tanımlayın. "Ses iletim yollarının payları" bölümü
   hangi yolun sonucu sınırladığını gösterir; iyileştirme oraya yapılmalıdır.
3. **Darbe sesi** — taşıyıcı döşeme, yüzer şap/şilte ve varsa asma tavan.
4. **Cephe** — yüzeysel elemanlar (duvar, pencere) ve küçük elemanlar (menfez, panjur kutusu).
5. **Reverberasyon** — hacim, yüzeyler ve nesneler.
6. **Rapor** — tüm sonuçların yazdırılabilir özeti (tarayıcıdan PDF'e aktarılabilir).

Projeler `Projeyi indir` / `Proje aç` ile JSON olarak taşınır; çalışma ayrıca tarayıcıya otomatik
kaydedilir. `Örnek proje` düğmesi, hem sağlanan hem sağlanmayan bileşenler içeren bir konut örneği
yükler.

---

## Proje yapısı

```
index.html                     Dashboard kabuğu (kenar çubuğu + içerik)
css/stil.css                   Tasarım simgeleri, açık/koyu tema, yazdırma biçemleri
.github/workflows/pages.yml    Testleri çalıştırıp GitHub Pages'e yayınlar
js/
  uygulama.js                  Giriş noktası: durum, yönlendirme, tema, olaylar, dosya işlemleri
  durum.js                     Proje verisi, kalıcılık, örnek proje
  hesap.js                     Proje verisini hesap çekirdeğine bağlayan katman
  cekirdek/
    temel.js                   Birim dönüşümleri (DnT ↔ R', L'nT ↔ L'n), enerjik toplama
    kutle-kanunu.js            Alan kütlesinden Rw ve Ln,w,eq kestirimi
    kij.js                     Birleşimlerde titreşim azaltma indisi (TS EN 12354-1 Ek-E)
    en12354-1.js               Hava doğuşlu ses, yan yollu
    en12354-2.js               Darbe sesi
    en12354-3.js               Cephe
    reverberasyon.js           Sabine
    degerlendirme.js           Yönetmelik gereksinimleri ve sınıf belirleme
  veri/
    yonetmelik.js              ★ Yönetmelik ekleri — düzenlenebilir veri katmanı
    malzemeler.js              Yapı elemanı ve malzeme kütüphanesi
  arayuz/
    sekme-panel.js             Panel (genel görünüm)
    sekme-*.js                 Bölüm ekranları
    simgeler.js                Satır içi SVG simge seti
    ortak.js                   Arayüz yardımcıları
test/cekirdek.test.js          Hesap çekirdeği testleri
```

## Testler

```bash
npm test          # node --test test/*.test.js
```

42 test; birim dönüşümlerini, Kij bağıntılarını, yan yol modelini, sınıf belirlemeyi ve örnek
projenin uçtan uca hesabını kapsar.

---

## Sınırlar

- Hesap, TS EN 12354 serisinin **basitleştirilmiş tek sayılı** (Rw tabanlı) modelini uygular;
  frekans bandı bazlı ayrıntılı hesap yapılmaz. Kaynak veya alıcı spektrumunda 50–100 Hz aralığında
  baskın ton bileşenleri varsa yönetmelik `DnT,50` / `L'nT,50` göstergelerini ister; bu durum
  ayrıntılı bant hesabı gerektirir ve bu araç kapsamı dışındadır.
- `Kij` bağıntıları **rijit** birleşimler içindir. Elastik ara katmanlı birleşimlerde arayüzdeki
  "Esnek" seçeneği muhafazakâr bir ilave uygular; kesin değer için ölçüm ya da üretici verisi
  kullanılmalıdır.
- Tesisat ve servis ekipmanı gürültüsü ile bina dışı gürültü haritalaması kapsam dışıdır; cephe
  hesabında dış gürültü düzeyi kullanıcı girdisidir.
- Bu araç bir **ön tasarım ve kontrol aracıdır**. Yönetmelik kapsamındaki akustik proje ve raporlar,
  Bakanlık kayıtlı yetkili akustik uzmanının sorumluluğundadır.

## Yayın

`.github/workflows/pages.yml`, dala yapılan her itmede önce hesap çekirdeği testlerini çalıştırır;
testler geçerse depoyu olduğu gibi GitHub Pages'e yayınlar. Derleme yapılandırması gerekmez.

### Tek seferlik kurulum

Pages'in depo ayarlarından **bir kez** açılması gerekir — bunu iş akışı kendi başına yapamaz, çünkü
`GITHUB_TOKEN` kullanıcı depolarında Pages sitesi *oluşturma* yetkisine sahip değildir
(`Resource not accessible by integration`).

1. **Settings → Pages** sayfasını açın.
2. **Build and deployment → Source** ayarını **GitHub Actions** yapın.
3. **Actions → GitHub Pages yayını → Run workflow** ile iş akışını yeniden çalıştırın
   (ya da yeni bir itme yapın).

Bunun ardından site <https://aligokten.github.io/SAGG-Akustik_Rapor/> adresinde yayına girer ve
sonraki her itmede otomatik güncellenir.

### Kurulum yapmadan denemek

Pages açılana kadar uygulama, GitHub'daki dosyaları doğru MIME türleriyle sunan bir aynadan
çalıştırılabilir:

```
https://raw.githack.com/aligokten/SAGG-Akustik_Rapor/claude/ks-schallschutzrechner-turkish-lgtwfl/index.html
```

## Lisans

MIT
