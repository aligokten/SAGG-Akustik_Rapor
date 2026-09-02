# SAGG Akustik Hesap Aracı

**Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik** (Resmî Gazete 31/05/2017 – 30082;
değişik: 01/07/2018 – 30465) ve eklerine göre bina akustiği hesabı yapan Türkçe web aracı.

**▶ Canlı sürüm (tarayıcı): <https://aligokten.github.io/SAGG-Akustik_Rapor/>**
*(Bağlantının çalışması için Pages'in bir kez açılması gerekir — bkz. [Yayın](#yayın).)*

**▶ Windows kurulum dosyası (.exe):
[Releases](https://github.com/aligokten/SAGG-Akustik_Rapor/releases/latest)** — aynı uygulamanın
kurulabilir masaüstü sürümü. Çevrimdışı çalışır, açılışta kendi güncellemesini denetler ve
kullanıcıyı yeni sürüme yönlendirir; bkz. [Windows uygulaması](#windows-uygulaması-exe).

Alman *KS-Schallschutzrechner*'ın (Kalksandstein, DIN 4109) yaptığı işi Türkiye mevzuatı için
karşılayacak biçimde tasarlanmıştır: yapı elemanlarının ses yalıtım başarımını **yan yol iletimini de
içerecek şekilde** hesaplar, sonucu yönetmeliğin eklerindeki sınır değerlerle karşılaştırır ve
**akustik performans sınıfını** (A–F) belirler.

Kenar çubuklu bir dashboard olarak çalışır. **Panel** ekranı bento (kart ızgarası) düzenindedir:
soldaki halka gösterge projenin genel uygunluk oranını ve bölüm bölüm dökümünü verir; yanındaki
**bileşen başarım marjı** grafiği her bileşenin gereksinime göre farkını sıfır çizgisinin
üstünde/altında gösterir (hap biçimli düğmelerle bölüme göre süzülebilir); altındaki kutucuklar
belirleyici sınıfı, hedef sınıfı, dikkat gerektiren bileşen sayısını ve proje kapsamını özetler.
Menüdeki sayaçlar hangi bölümde kaç bileşen olduğunu ve kaçının sınırda kaldığını belirtir.

Arayüz koyu tema için kurgulanmıştır (varsayılan); üst çubuktaki güneş/ay düğmesiyle açık temaya
geçilebilir ve tercih saklanır. Yazdırmada renkler her hâlükârda açık temaya döndürülür, böylece
rapor koyu temadan da doğru basılır. **Yan panel katlanabilir**: üst çubuktaki menü düğmesi geniş
ekranda kenar çubuğunu tamamen katlar (tercih saklanır, sonraki açılışta korunur), dar ekranda ise
çekmece olarak açıp kapatır; dar ekranda kartlar tek sütuna iner.

---

## Ne hesaplar?

| Bölüm | Gösterge | Yöntem | Karşılaştırma |
|---|---|---|---|
| Ayırıcı elemanlar (düşey/yatay) | `DnT,A` | TS EN 12354-1, doğrudan yol + Ff/Fd/Df yan yolları | EK-3 Tablo **3.4** (varsayılan) / 3.2 |
| Döşemeler | `L'nT,w` | TS EN 12354-2, `L'n,w = Ln,w,eq − ΔLw + K` | EK-3 Tablo **3.5** (varsayılan) / 3.3 |
| Cephe (dış yapı elemanı) | `DnT,A,tr` | TS EN 12354-3, bileşik yalıtım + iç yan yollar (Df) + biçim ve hacim düzeltmesi, `+ Ctr` | EK-3 Tablo 3.1 |
| Hacimler | `T` (çınlama süresi) | Sabine bağıntısı, oktav bantlarında, hava soğurması dahil | EK-6 Tablo 6.1 |

Ayrıca: mekân içi gürültü düzeyi sınırları (EK-4 Tablo 4.1), mekânların gürültülülük/hassasiyet
dereceleri (EK-2 Tablo 2.1), bina tipine göre komşuluk tabloları (EK-3 Tablo 3.4 / 3.5) ve
sınıfların öznel karşılıkları (EK-2 Tablo 2.2) veri katmanında yer alır.

Raporun son sayfası, **EK-10 Akustik Performans Belgesi**'dir (bkz.
[Akustik performans belgesi](#akustik-performans-belgesi)).

### Hangi gereksinim tablosu kullanılır?

Yönetmelik, oda-oda ses yalıtımı için iki farklı gereksinim tablosu verir:

| | Neye bakar | Tablo |
|---|---|---|
| **Komşuluk ilişkisi** *(varsayılan)* | Bina işlevi + kaynak/alıcı mekân ilişkisi | Hava: **3.4** · Darbe: **3.5** |
| Mekân dereceleri | Kaynağın gürültülülüğü (YG/OG/DG) + alıcının hassasiyeti (I/II/III) | Hava: 3.2 · Darbe: 3.3 |

Her ayırıcı eleman ve döşeme kaydında **Gereksinim tablosu** başlığı altında bir seçim vardır.
Varsayılan, komşuluk ilişkisine dayanan **Tablo 3.4 / 3.5**'tir; listeden "Kullanma" seçilirse
mekân derecelerine dönülür. Seçim raporda da yazılır, böylece hangi tablonun esas alındığı belgede
görünür.

Fark önemlidir — konutta C sınıfı için:

| Komşuluk ilişkisi | DnT,A gereksinimi |
|---|---|
| Ticari işletme / teknik merkez → bağımsız birim | 58 dB |
| Bağımsız birim / ortak alan → bağımsız birim / ortak alan | 52 dB |
| **Aynı bağımsız birim içi** (yatak odası ↔ yaşam alanı) | **44 dB** |

Tablo 3.4 / 3.5 yalnızca konut, eğitim, sağlık, büro, konaklama ve yurt işlevlerini kapsar; diğer
bina türlerinde seçim gösterilmez ve Tablo 3.2 / 3.3 kullanılır.

### Cephede çevresel gürültü düzeyi

Cephe gereksinimi `DnT,A,tr ≥ Lgag − indirim` bağıntısıyla bulunur (EK-3 Tablo 3.1). Yeni cephe
kayıtlarında **Lgag varsayılanı 58 dBA**'dır; bu, C sınıfı hedefinde şu gereksinimleri verir:

| Alıcı odası hassasiyeti | C sınıfı gereksinimi |
|---|---|
| I | 58 − 22 = **36 dB** |
| II | 58 − 25 = **33 dB** |
| III | 58 − 28 = **30 dB** |

Projenin gerçek cephe gürültü düzeyi biliniyorsa cephe kaydından değiştirilir; gereksinim
kendiliğinden kayar.

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
düzenlenebilir bir veri katmanında tutulur.

**Veri sürümü 2.0.0'dan itibaren** bu tablolar, Yönetmeliğin resmî ek dosyasından
([7.5.23616-Ek.docx](https://www.mevzuat.gov.tr/mevzuatmetin/yonetmelik/7.5.23616-Ek.docx))
**programlı olarak çıkarılmıştır** — elle kopyalanmamıştır. Çıkarılan değerler
`test/yonetmelik-resmi.test.js` ile sabitlenmiştir.

Sürüm 1.x'te tabloların bir bölümü hatalıydı; bunlar düzeltilmiştir:

| Tablo | 1.x'teki durum | 2.0.0 |
|---|---|---|
| **3.1** (cephe) | Lgag bantlarına göre sabit dB matrisi, gösterge `D2m,nT,w` | Resmî hâli: `DnT,A,tr ≥ Lgag − indirim` |
| **3.2** (hava doğuşlu) | Tekdüze 4 dB adımlı, hatalı değerler | Resmî değerler (B→C adımı 6 dB), gösterge `DnT,A` |
| **3.3** (darbe) | Kaynak **ve** alıcıya göre 9 satır | Resmî hâli: yalnızca kaynak gürültülülüğü, 3 satır |
| **4.1** (iç gürültü) | Hatalı değerler | Resmî değerler (4 dB adımlı) |
| **6.1** (reverberasyon) | "EK-5" adıyla, eksik/uydurma liste | EK-6 Tablo 6.1, 41 mekân |
| **2.1** (mekân dereceleri) | 35 mekân, bir bölümü hatalı derecelendirilmiş | Resmî liste: 12 bina işlevi, 65 mekân |
| **3.4 / 3.5** | Yoktu | Eklendi (bina tipine göre komşuluk) |

Eski projeleriniz açılmaya devam eder: mekân kimlikleri `MEKAN_KIMLIK_GOCU` ile yeni
karşılıklarına otomatik çevrilir.

Yine de resmî bir işlemde kullanmadan önce:

1. Uygulamada **Yönetmelik verileri** sekmesini açın.
2. Tablolardaki değerleri [mevzuat.gov.tr](https://www.mevzuat.gov.tr) üzerindeki yürürlükteki metin
   (Mevzuat No: 23616) ile karşılaştırın. Yönetmelik değişebilir; bu araçtaki veri, çıkarıldığı
   tarihteki ek dosyasını yansıtır.
3. Farklı olanları doğrudan arayüzden düzeltin — kod değiştirmeye gerek yoktur.
4. **JSON olarak indir** ile doğrulanmış veri setini kaydedin; ekibinizle paylaşıp
   **JSON yükle** ile geri yükleyebilirsiniz.

Düzenlemeleriniz tarayıcıda saklanır ve proje dosyasıyla birlikte dışa aktarılır.

Aynı biçimde, malzeme kütüphanesindeki (`js/veri/malzemeler.js`) `Rw`, `ΔLw`, `ΔRw`, `Dn,e,w` ve
soğurma katsayıları **tipik tasarım değerleridir**. Akustik projede, kullanılacak ürünün
TS EN ISO 10140 serisine göre akredite laboratuvarda ölçülmüş beyan değerleri esas alınmalıdır;
arayüzdeki "Beyan edilmiş …" alanları bunun içindir.

---

## Malzeme kütüphanesi

**Malzeme kütüphanesi** ekranı tüm kayıtları hesaplanmış alan kütlesi ve kestirilen Rw ile birlikte
listeler; üstteki arama kutusu tabloları anında süzer (arama Türkçe I/İ ve aksan duyarsızdır —
`ipb 039`, `gorultu`, `dosem` gibi yazımlar da bulur).

| Kategori | Kayıt | Kapsam |
|---|---|---|
| Duvar elemanları | 100 | Betonarme · dolu/harman tuğla · yatay ve düşey delikli tuğla · ısı yalıtımlı tuğla · akustik tuğla · **gazbeton G2/G3/G4** · **blok bims (hafif/standart/ağır)** · beton blok ve briket · alçı blok · cam tuğla · alçı levha duvar sistemleri (tek ve ikiz iskelet) |
| Döşeme elemanları | 20 | Betonarme plak 100–250 mm · asmolen (gazbeton/bims/EPS dolgulu) · nervürlü · trapez sac kompozit · ahşap kirişli · CLT |
| Yalıtım levhaları | 8 | **Knauf Insulation Mineral Plus IPB 039 / IPB 037** · taşyünü · camyünü · ahşap yünü · EPS/XPS (akustik uyarısıyla) |
| Şap ve kaplamalar | 22 | Yapışık şap · yüzer şap (5–40 mm şilte) · kuru şap · lamine parke · LVT · halı · kauçuk-mantar |
| Giydirme kabuk / asma tavan | 14 | Bağımsız iskeletli · elastik askılı · doğrudan bağlantılı · mantolama (EPS ve taşyünü) · asma tavanlar |
| Pencere ve kapı | 24 | Tek/çift/üçlü cam · lamine akustik cam · çift kat pencere · iç kapı · akustik kapı Rw 32–45 · daire giriş kapısı |
| Küçük elemanlar | 8 | Menfezler · panjur kutuları · tesisat geçişleri |
| Soğurucu yüzey | 24 | Yapı yüzeyleri · kaplamalar · akustik tavan/panel · delikli levhalar · membran |
| Nesne / kullanıcı | 8 | Kişi · koltuk · sıra · ofis bölmesi · hasta yatağı |

### Malzeme değerlerini kendi ürününüze uyarlama

Kütüphanedeki bloklar anma yoğunluklarıyla girilmiştir. Elinizdeki ürün farklıysa iki yol var:

1. **Beyan edilmiş yoğunluk (kg/m³)** — alan kütlesi bundan yeniden hesaplanır, Rw kestirimi buna
   göre değişir. Blok ürünlerde en pratik yol budur.
2. **Beyan edilmiş Rw (dB)** — kestirimi tamamen devre dışı bırakır. Laboratuvar raporu olan
   ürün ve sistemlerde bu kullanılmalıdır.

### Boşluk dolgusu ve rezonans frekansı

Giydirme kabuk ve bölme duvarlarda boşluk dolgusu ayrıca seçilir. Dolgunun hesaba iki etkisi olur:

- **Rezonans frekansı f₀** — boşluğun kütle-yay-kütle rezonansı:
  `f₀ = (1/2π)·√( κ·P₀/d · (1/m′₁ + 1/m′₂) )`, gözenekli dolguda κ = 1,0 (izotermal),
  dolgusuz boşlukta κ = 1,4 (adyabatik). f₀ ne kadar düşükse giydirme o kadar etkilidir;
  arayüz 80 / 125 / 200 Hz eşiklerine göre yorum verir.
- **Dolgu cezası** — sistemin öngördüğü gözenekli dolgu yerine dolgusuz ya da sert köpük
  (EPS/XPS) seçilirse boşluk sönümlenmediği için ΔRw'den muhafazakâr biçimde 4 dB düşülür.

Bir yalıtım levhasının tek başına Rw değeri olmadığını unutmayın: akustik başarım, levhanın içinde
yer aldığı **sistemin** ölçülmüş değeriyle tanımlanır. Kütüphanedeki levha kayıtları λ, kalınlık
ve yangın sınıfı gibi üretici föyü verilerini taşır; akustik etkileri yalnızca yukarıdaki iki
mekanizma üzerinden hesaba girer.

---

## Katmanlı yapı elemanları

Ayırıcı elemanların ana gövdesi, her yan eleman ve döşemeler artık **kütüphaneden tek satır seçim**
yerine **katman katman** kurulabilir — "Katmanlı yapıya geç" düğmesiyle geçilir, mevcut basit seçim
(varsa) ilk katman olarak aktarılır, "Basit seçime dön" ile geri dönülür (veri kaybolmaz).

Üç katman türü:

- **Masif tabaka** — serbest metin malzeme adı + kalınlık (mm) + yoğunluk (kg/m³). Sık kullanılan
  malzemeler (G2/G3/G4 gazbeton, bims/tuğla, betonarme, Knauf mineral yün IPB 039 vb.) bir ön ayar
  menüsünden tek tıkla doldurulabilir; alan yine de serbestçe düzenlenebilir.
- **Sıva** — tek yüzey sıvası, aynı serbest ad/kalınlık/yoğunluk girişiyle.
- **Boşluk / dolgu** — kalınlık (mm) ve boşluk dolgusu (Knauf IPB serisi, taşyünü, camyünü, EPS/XPS…).
  Bir boşluk katmanı, elemanı iki bağımsız kabuğa ayırır.

Her katman listesinin üstünde, kalınlıkla orantılı renkli bir **katman şeridi** kalınlık dağılımını
tek bakışta gösterir (aynı görsel hem düzenleyicide hem raporda kullanılır).

**Hesap mantığı:**

- **Boşluk yoksa** (ör. "15 cm betonarme + 5 mm şilte + 7 cm şap + 2 cm seramik"): tüm katmanların
  kütlesi toplanır, TS EN 12354-1 Ek-B kütle kanunu ile tek kabuk gibi Rw kestirilir.
- **Tam bir boşluk iki dolu segmenti ayırıyorsa** (ör. "2 cm sıva + 15 cm G2 gazbeton + 5 cm Knauf
  taşyünü + 15 cm G2 gazbeton + 2 cm sıva"): iki kabuk bağımsız değerlendirilir. Taban Rw yine toplam
  kütleden kütle kanunuyla bulunur; ardından kabukların kütle-yay-kütle rezonans frekansı f₀
  (`rezonansFrekansi`, giydirme kabuk hesabıyla aynı bağıntı) hesaplanır ve buna dayalı bir kavite
  bonusu (`ikiKabukBonusu`, 0–25 dB, f₀ ≈ 80 Hz'de ~16 dB) eklenir. Bu kestirim, KS-Schallschutzrechner
  örnek bir sandviç duvarda (G2 gazbeton 150 + IPB 039 50 + G2 gazbeton 150) verdiği R'Dd,w = 68,3 dB
  değerine ~2,6 dB yakınsar (farklı taban eğrileri kullanıldığından tam örtüşme beklenmez).
  Rijit köprüleme (nokta temas, ankraj) bulunmayan, düzgün ayrılmış ve gözenekli malzemeyle
  sönümlenmiş boşluklar için geçerlidir; kritik tasarımlarda ölçüm veya üretici beyan verisi esastır.
- **Birden fazla boşluk katmanı** eklenirse yalnızca ilki değerlendirmeye katılır, kalanı bağlı kabul
  edilir ve arayüzde uyarı gösterilir (üçüncü bir bağımsız kabuk desteklenmez).

Bu mantık `js/cekirdek/katmanli-eleman.js` içindedir ve **cephe elemanlarında da aynı arayüzle**
kullanılabilir: cephe duvarları, iç yan yollu yüzeyler (tavan, taban, iç duvarlar) ve döşemeler için
aynı katman düzenleyici sunulur.

### Katman favorileri

Sürekli tekrarlanan katman kombinasyonları, her katman düzenleyicisinin üstündeki **"Katmanı favoriye
ekle"** satırıyla kişisel bir kitaplığa kaydedilebilir ve tek seçimle başka bir elemana yüklenebilir.
Favoriler üç kategoriye ayrılır:

| Kategori | Kullanıldığı yer |
|---|---|
| **İç duvar** | Ayırıcı elemanlar, iç yan elemanlar |
| **Dış duvar** | Cephe duvarları |
| **Döşeme** | Döşemeler, tavan/taban yan elemanları |

Düzenleyici, bulunduğu bağlama uygun kategoriyi kendiliğinden ön seçer; yükleme listesi kategoriye
göre gruplanır. Aynı kategoride aynı ad yeniden kaydedilirse üzerine yazılır.

Favoriler **projeye değil kullanıcıya** aittir: tarayıcıda ayrı bir anahtarda (`sagg-akustik-katman-
favorileri-v1`) tutulur ve tüm projelerde kullanılabilir. Yüklenen katmanlar bağımsız kopyadır —
projede yapılan değişiklik favoriyi bozmaz. **Malzeme kütüphanesi** ekranındaki *Katman favorileri*
kartından tüm liste görülebilir, tek tek silinebilir ve JSON olarak dışa/içe aktarılabilir (başka bir
bilgisayara taşımak için). Kod: `js/veri/favoriler.js`.

## Oda geometrisi, izometrik şema ve canlı 3B model

Ayırıcı elemanlarda ve döşemelerde, alan/hacmi doğrudan girmek yerine **oda boyutlarından
hesapla** moduna geçilebilir: iki mekânın (Oda 1/kaynak, Oda 2/alıcı) **her biri bağımsız olarak**
derinlik (L), genişlik (W), yükseklik (H) ile girilir — eşit boyutlu olmaları gerekmez — ve
ayırıcının bulunduğu yüz seçilir: **ön / arka / sol / sağ duvar** ya da **taban / tavan döşemesi**.

- Ayırıcı elemanın alanı S ve alıcı mekân hacmi V, seçilen yüze göre otomatik hesaplanır. S, iki
  odanın seçilen düzlemdeki **örtüşen** kısmıdır; odalar hizalıysa bu `min(A1,A2) × min(B1,B2)`
  demektir (taban/tavan seçiminde `min(L1,L2) × min(W1,W2)`).
- Standart dört yan elemanın (iki yan duvar + taban + tavan) birleşim uzunluğu (lf) oda
  boyutlarından otomatik türetilir. Kullanıcının sonradan eklediği ek yan elemanlar bu otomasyondan
  etkilenmez, elle girilen lf'lerini korur.
- Girilen boyutlarla **izometrik, döndürülebilir bir 3B oda şeması** (`js/arayuz/oda-cizimi.js`, saf
  SVG, dış bağımlılık yok) otomatik çizilir: ayırıcı yüzey vurgulu, iki oda kendi boyutlarıyla ayrı
  ayrı çizilir. Ayırıcı sekmesindeki "Canlı 3B model" kutusu fare/dokunmatikle **sürüklenerek
  döndürülebilir**; aynı şema (o anki açıyla) yazdırılabilir rapora da statik olarak eklenir.
- Şemadaki her kutunun üç kenarına **ölçüler** yazılır (ör. `L 6,1 m`, `W 3,0 m`, `H 2,6 m`);
  etiketler izleyiciye dönük kenarların ortasına konur ve kutunun dışına itilir.
- Kaynak mekânda **ses kaynağını temsil eden bir simge** (hoparlör + yayılan dalgalar) yer alır.
- Her iki mekâna **ad** girilebilir. Bu adlar şemada ve raporda kullanılır; boş bırakılırsa mekân
  kullanım adı (ör. "Yatak odası") yedek olarak devreye girer. Ayırıcı elemanın kendi adı (ör. "ID1")
  yalnızca "Kaynak → Alıcı" biçiminde yazılmışsa mekân adı olarak yorumlanır.
- **Cephe hesaplarının da kendi canlı 3B modeli** vardır: mahal kutusu, vurgulanmış dış duvar(lar),
  ait oldukları duvarda **gerçek en × boy ölçüsüyle çizilen pencere/kapılar**, Df yan yolu oluşturan
  iç yüzeyler ve cephenin dışında, geliş yönünü gösteren kesikli çizgiyle bağlanmış **çevresel
  gürültü kaynağı** simgesi. Doğramaların duvar üzerindeki yatay konumu temsilîdir (hesabı etkilemez);
  ölçüleri ve hangi duvarda oldukları gerçektir.

Eksen kuralı, KS-Schallschutzrechner'in oda diyagramıyla doğrulanmıştır: L=6,12 m, W=3,03 m,
H=2,62 m, ayırıcı "sol duvar"da iken hesaplanan S = 16,03 m² birebir eşleşir.

### Kısmi örtüşme — mekânların birbirine göre kaydırılması

İki mekân ayırıcı düzlem üzerinde her zaman tam karşı karşıya olmayabilir: kat planında yana
kayabilir, üst kat alt kata göre ötelenmiş olabilir ya da odalar arasında kot farkı bulunabilir.
Böyle bir durumda duvarın/döşemenin **yalnızca örtüşen kısmı ayırıcı elemandır**; kalan kısım
kaynak ya da alıcı odanın kendi yan duvarı/döşemesidir ve iki mekân arasında doğrudan bir hava
doğuşlu iletim yolu oluşturmaz.

Geometri bölümünde ayırıcı düzlemin iki ekseni için birer **kaydırma** değeri girilir. Eksenler
seçilen yüze göre adlandırılır:

| Ayırıcının bulunduğu yüz | A ekseni | B ekseni |
| --- | --- | --- |
| Ön / arka duvar | Genişlik (W) | Yükseklik (H) |
| Sol / sağ duvar | Derinlik (L) | Yükseklik (H) |
| Taban / tavan döşemesi | Derinlik (L) | Genişlik (W) |

Kaydırma, iki mekânın **referans kenarları arasındaki uzaklıktır**. Her odanın yerel koordinatı
kendi referans kenarında sıfırdan başlar:

| Eksen | Referans kenar |
| --- | --- |
| Derinlik (L) | ön kenar |
| Genişlik (W) | sol kenar |
| Yükseklik (H) | taban |

Değer, **Oda 2'nin referans kenarının Oda 1'inkine olan uzaklığıdır** (işaretli; negatif değer
geriye kaymayı gösterir). Böylece plandan okunan *"duvardan şu kadar içeride"* ölçüsü doğrudan
yazılabilir; ortalanmış konuma göre sapma hesaplamak gerekmez.

Kaydırma sıfırken kenarlar hizalıdır ve örtüşme `min(A1, A2)` olur — küçük aralık büyüğünün içinde
kalır. Bunun bir sonucu şudur: **küçük oda büyüğün sınırları içinde kaldığı sürece kaydırma ortak
alanı değiştirmez**; örtüşme ancak oda karşı kenardan taşmaya başlayınca küçülür. Örneğin 7 m'lik
bir mekânın altındaki 5 m'lik mekân 1,5 m kaydırılınca hâlâ tümüyle üstün altındadır (örtüşme 5 m);
3 m kaydırılınca örtüşme 4 m'ye iner.

> **Sürüm 1.3.1'de değişti.** Önceki sürümlerde kaydırma, *ortalanmış* konumdan sapma olarak
> ölçülüyordu. Kaydırması **0 olan** kayıtlar bu değişiklikten etkilenmez (iki kural da
> `min(A1, A2)` verir); eşit boyutlu odalarda da sonuç aynıdır. Yalnızca **farklı boyutlu odalarda
> girilmiş sıfırdan farklı** kaydırma değerlerinin anlamı değişmiştir — bu kayıtlarda değeri
> kenardan ölçüp yeniden girmek gerekir.

- Ortak alan `S = ortakA × ortakB`, aralık kesişimiyle bulunur:
  `ortak = max(0, min(a, d+b) − max(0, d))` (`js/cekirdek/geometri.js`, `ortakUzunluk`); burada
  `d` doğrudan kenardan ölçülen kaydırmadır.
- **Yan eleman birleşim uzunlukları (lf) de örtüşen boyutları izler** — kısalan bir ayırıcının
  yan yollarının birleşim uzunluğu da kısalır.
- Arayüzde kaydırmanın sonucu canlı olarak yazılır: ortak alan, ve her iki odada bu yüzeyin
  ortak **olmayan** kısmının alanı. 3B model kaydırmayı gerçek konumuyla çizer.
- Kaydırma örtüşmeyi tamamen ortadan kaldırırsa (`S = 0`) mekânlar temas etmiyordur: arayüzde
  kırmızı bir uyarı çıkar ve rapor, sessizce yanıltıcı bir "SAĞLAMIYOR" satırı yazmak yerine
  aralarında ayırıcı eleman bulunmadığını açıkça belirtir.

> **Darbe sesi sekmesinde kaydırma yoktur.** TS EN 12354-2'nin bu araçta kullanılan basitleştirilmiş
> bağıntısı `L'nT,w = L'n,w − 10·lg(0,032·V)` yalnızca **alıcı mekânın hacmini** kullanır; ortak
> döşeme alanı bağıntıya hiç girmez. Kaydırma bu nedenle yalnızca sonucu gerçekten değiştirdiği
> yerde — ayırıcı elemanda, ayırıcı yüz bir döşeme (`taban`) olduğunda da — uygulanmıştır.

### Darbe sesi: üst ve alt mekân ölçüleri farklıysa

Darbe sesi sekmesinde geometri üç kipte tanımlanabilir:

| Kip | Ne girilir | Ne zaman |
| --- | --- | --- |
| **Doğrudan V** | Alt (alıcı) mekân hacmi | Hacim zaten biliniyorsa |
| **Tek oda** | Alt (alıcı) mekânın L×W×H'si | İki kat aynı boyuttaysa |
| **Üst ve alt ayrı** | Her iki mekânın L×W×H'si + döşeme düzleminde kaydırma | Katlar farklı boyutta ya da birbirine göre kaymışsa |

**Hangi ölçü sonucu değiştirir?** Bağıntı `L'nT,w = L'n,w − 10·lg(0,032·V)` yalnızca **alıcı (alt)
mekânın hacmini** kullanır. Ortak döşeme alanı, bu araçta uygulanan basitleştirilmiş
TS EN 12354-2 tek sayılı modeline **girmez** — model alan değil, yalnızca kütle (Ln,w,eq), kaplama
(ΔLw), yan yol düzeltmesi (K) ve alıcı hacmi üzerinden çalışır. Dolayısıyla üst mekânı büyütmek
sonucu değiştirmez; alt mekânı büyütmek değiştirir.

Öyleyse üç kipin ayrı ayrı bulunmasının nedeni şudur: **doğru hacmin karıştırılmaması.** Tek oda
kipinde girilen ölçülerin alıcı mekâna ait olduğu açıkça yazılıdır; iki oda kipinde ise iki mekân
ayrı ayrı görünür ve bağıntıya hangisinin girdiği ekranda gösterilir. Üst kat alttan büyükse ya da
kaymışsa, yanlışlıkla üst mekânın hacmiyle hesap yapmak artık mümkün değildir.

İki oda kipi ayrıca:

- **ortak döşeme alanını** (iki mekânın örtüşen taban izdüşümü) hesaplar ve rapora yazar — sonucu
  değiştirmez, projenin geometrik kabulünü belgeler;
- katlar birbirine göre kaydırılmışsa örtüşen ve örtüşmeyen kısımları ayrı ayrı gösterir
  (aynı aralık kesişimi mantığı, bkz. [Kısmi örtüşme](#kısmi-örtüşme--mekânların-birbirine-göre-kaydırılması));
- **mekânlar hiç üst üste gelmiyorsa** (ortak döşeme 0 m²) hem arayüzde hem raporda kırmızı uyarı
  verir: aralarında ortak bir döşeme yoksa darbe sesi hesabı anlamlı değildir;
- döndürülebilir **3B şema** çizer.

> Kayıtların iki oda alanları ancak kipe ilk geçişte oluşturulur ve o ana kadar tek oda kipinde
> girilmiş ölçüler her iki odaya taşınır; iki odadan tek odaya dönüldüğünde de alıcı mekânın
> ölçüleri yazılır. Böylece kip değiştirince ekrandaki sayı değişmez. Eski projeler (yalnızca
> `mod`/`L`/`W`/`H` taşıyan kayıtlar) birebir aynı sonucu vermeye devam eder.

### "Katmanlı Model v3" JSON içe aktarma

Proje sekmesinden veya "Proje aç" ile, uyumlu bir üçüncü parti araçtan (`room1`/`room2`/
`separatorFace`/`surfaces: {separator, f1..f4}` şemalı `.json`) dışa aktarılmış dosyalar doğrudan
açılabilir — dosya biçimi otomatik tanınır (`js/veri/v3-donusturucu.js`) ve künye, oda ölçüleri,
ayırıcı yönü, ayırıcı + dört yan yüzeyin katman reçeteleri SAGG proje biçimine dönüştürülerek
içe aktarılır. İçe aktarma sonrası proje, bu araçtaki tüm özelliklerle (proje bazlı kayıt, canlı
model, katman düzenleyici) normal şekilde düzenlenebilir.

#### Referans araçla sayısal denklik

Hesap çekirdeği, aynı şemayı üreten referans araca karşı iki düzeyde doğrulanmıştır:

- **Bağıntı düzeyi** (`test/referans-motor.test.js`) — referans motorun formülleri bağımsız bir
  "oracle" olarak yeniden yazılmış, kendi modüllerimiz geniş bir girdi kümesinde bununla 1e-9
  toleransla karşılaştırılmıştır: Rw kestirimi (iki model, kol değişim noktaları dâhil), Kij
  (T/X × düz/köşe × esnek, 338 kütle çifti), Ff/Fd/Df, enerjik birleştirme, DnT,w, L′nT,w,
  üç ayırıcı yüzeyin alanı ve lf eşleşmesi, cephe geometri düzeltmesi ve bileşik Rw.
- **Uçtan uca** (`test/referans-raporlar.test.js`) — **ID1** (düşey L×H duvar, simetrik odalar) ve
  **DOS1** (döşeme ayırıcı, asimetrik odalar) senaryoları yayımlanmış raporlarla **birebir**
  eşleşir: S, V, her elemanın m′ ve Rw değeri, sekiz ses iletim yolunun R değeri ve enerji payı,
  R′w ve DnT,w.

Aynı olan ve ayrışan noktaların tam dökümü: **[`docs/referans-karsilastirma.md`](docs/referans-karsilastirma.md)**.
Ortak çalışma prensibi:

| Adım | Bağıntı |
|---|---|
| Rw kestirimi (m′ < 200 kg/m²) | `Rw = 13·lg(m′) + 14` |
| Rw kestirimi (m′ ≥ 200 kg/m²) | `Rw = 37,5·lg(m′) − 42` |
| Yan yollar | Dd + Ff/Fd/Df enerjik toplamı, Kij birleşim tipinden (T/X, esnek seçeneği) |
| Göstergeye dönüşüm | `DnT,w = R′w + 10·lg(0,32·V_alıcı / S) − emniyet payı` |

Emniyet payı referans dosyalarda 2 dB'dir (`safetyMargin`) ve içe aktarmada korunur. Katmanlı
elemanlarda **kavite bonusu uygulanmaz**: aradaki yalıtım levhası yalnızca kütlesiyle katkı verir,
Rw toplam alan kütlesinden hesaplanır — bu, referans aracın davranışıyla aynıdır. (Kendi
oluşturduğunuz projelerde iki kabuklu sistem kurmak isterseniz katmanı **boşluk** türünde eklemeniz
gerekir; bkz. [Katmanlı yapı elemanları](#katmanlı-yapı-elemanları).)

Döşeme (taban/tavan) ayırıcıda dört yan elemanın hepsi düşey duvardır; birleşim uzunluğu (lf)
hangi döşeme kenarına oturduklarıyla belirlenir. Kural her üç ayırıcı yüzeyde de aynıdır:
**F1/F3 → spanA**, **F2/F4 → spanB**; döşemede spanA = `min(L1,L2)`, spanB = `min(W1,W2)`.
Ters eşleşme yan yolları ±3,15 dB kaydırıp DnT,w'yi 1,6 dB düşürür.

### Sınır değer tablosunu Excel'e aktarma

> Tabloda **darbe sesi (döşeme)** kayıtları da yer alır. Kod olarak kaydın **kendi adı** kullanılır
> (ör. `DOS1`), böylece Excel ile rapor birebir eşleşir; ad boşsa ayırıcı döşemelerin ardından gelen
> `DOS` numarası verilir. Sınır burada **üst** sınırdır:
> satır `≤` işaretiyle yazılır, çünkü sağlanan L′<sub>nT,w</sub> değerinin sınırdan küçük olması
> gerekir — hava doğuşlu ve cephe satırlarındaki `≥` ile karıştırılmamalıdır.

Rapor sekmesindeki **"Sınır değer tablosunu Excel'e aktar"** düğmesi, projedeki tüm ayırıcı/cephe
kayıtlarını dış duvar (**DD**), iç duvar (**İD**) ve döşeme (**DOS**) olarak kodlayıp iki sayfalı bir
`.xlsx` dosyası indirir — bu, sahada elle tutulan özet tablolarla aynı düzendedir:

- **"Katman Kesitleri ve Rw Değerler"** — her elemanın kodu ve hesaplanan D<sub>nT,A,tr</sub>/D<sub>nT,w</sub>
  değeri, kategoriye göre gruplanmış (dış duvar / iç duvar / döşemeler).
- **"Projedeki Sınır Değerler ve Seç"** — aynı elemanlar, kaynak/alıcı mekân adları, EK-3 Tablo
  3.1/3.2'den gelen asgari sınır değer (veya manuel geçersiz kılma) ve hesaplanan değerle yan yana.

Cepheler DD, ayırıcı elemanlardan taban/tavan yönlü olanlar DOS, kalan (düşey) ayırıcılar İD olarak
sınıflandırılır; darbe (L′nT,w) kayıtları bu tabloya dahil değildir (yalnızca hava doğuşlu D<sub>nT,A,tr</sub>
kapsanır). Dosya, dış bağımlılık kullanmadan tarayıcıda üretilir (`js/arayuz/xlsx-yazici.js` — sıkıştırmasız
bir ZIP/OOXML yazıcı) ve doğrudan indirilir.

## Liste düzeni

Uzun projelerde hesap listesi hızla büyür. İki davranış bunu yönetilebilir tutar:

- **Kart katlama.** Her ayırıcı/cephe/döşeme kartı "Küçült" ile yalnızca başlığı görünecek biçimde
  katlanabilir; başlıkta sonuç değeri ve uygunluk rozeti kalır, böylece katlı kart yine tanınır.
  Liste başlığındaki **"Tümünü küçült / Tümünü aç"** ile hepsi birden katlanır — örnek projede
  ayırıcı sekmesinin yüksekliği 5405 px'ten 900 px'e iner ve sayfa başındaki "ekle" düğmesine
  ulaşmak için listeyi kaydırmak gerekmez. Durum saklanır; kayıt **indeksi değil kimliği**
  kullanıldığı için liste sıralanınca katlama yanlış karta kaymaz.
- **Kopyalar listenin sonuna eklenir**, kaynağın hemen ardına değil; sıralama kullanıcıda kalır.

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

### Windows uygulaması (.exe)

Aynı uygulama Windows'ta kurulabilir bir masaüstü programı olarak da çalışır. Kurulum dosyası
her sürümde otomatik derlenip **[Releases](https://github.com/aligokten/SAGG-Akustik_Rapor/releases)**
sayfasına yüklenir:

> **SAGG-Akustik-Hesap-Kurulum-\<sürüm\>.exe**

Kurulum sihirbazı Türkçedir, **yönetici hakkı istemez** (kullanıcı profiline kurar), masaüstü ve
başlat menüsü kısayolu oluşturur. Program çevrimdışı çalışır; hiçbir proje verisi dışarı gönderilmez.

Masaüstü sürümü web sürümünün **birebir aynı kodudur** — `js/`, `css/`, `index.html` olduğu gibi
paketlenir, hesap çekirdeğinde tek satır fark yoktur. Üzerine yalnızca ince bir Electron kabuğu
(`masaustu/`) eklenir: pencere, Türkçe menü, PDF'e aktarma ve otomatik güncelleme.

**Neden `file://` değil, `sagg://` özel protokolü?** Uygulama projeleri, malzeme favorilerini ve
temayı `localStorage`'da tutar. Chromium `file://` kaynağına opak bir origin verdiği için orada
`localStorage` erişimi `SecurityError` atar — yani dosyadan açılan bir pencerede hiçbir şey
kaydedilemezdi. Depo içeriği bu yüzden `sagg://yerel/...` adresinden, gerçek ve güvenli bir origin
üzerinden servis edilir; kayıt davranışı web sürümüyle birebir aynı olur. Protokol işleyicisi yalnızca
uygulama kökünün altındaki dosyaları verir (`masaustu/yardimcilar.js`, `guvenliYol`).

#### Yayıncı bilgileri

| Alan | Değer | Nereden gelir |
| --- | --- | --- |
| Yayıncı (Windows "Uygulamalar" listesi) | SAGG+ App | `package.json` → `author.name` |
| Destek adresi | info@saggplus.com | `author.email` |
| Web sitesi | https://www.saggplus.com | `homepage` |
| Uygulama kimliği (appId) | `com.saggplus.akustik` | ters çevrilmiş alan adı |
| Telif | Sinem Ali Gökten Grup İnşaat Mimarlık Akustik Müh. San. Tic. Ltd. Şti. | `electron-builder.mjs` → `copyright` |
| Kurulum kapsamı | Yalnızca oturum açan kullanıcı | `nsis.perMachine: false` |

> **`win.publisherName` bilerek boş bırakılmıştır.** Bu alan kod imzalama
> sertifikasındaki adı bildirir ve dolu olduğunda electron-updater, indirdiği
> kurulum dosyasının imzasını bu ada karşı **doğrular**. Paket imzasız olduğu
> için alanı doldurmak, güncellemelerin sessizce reddedilmesine yol açardı.
> Windows'ta görünen yayıncı adı zaten `author.name` alanından geliyor.
> Sertifika alındığında `electron-builder.mjs` içindeki yorum satırları açılır.

#### Otomatik güncelleme

Program **her açılışta** (ve açıkken 6 saatte bir) GitHub Releases'i sessizce denetler:

1. Yeni sürüm yoksa kullanıcı hiçbir şey görmez.
2. Yeni sürüm varsa Türkçe bir pencere çıkar ve sürüm notlarını gösterir. **İndirme, kullanıcı
   onaylamadan başlamaz** (`autoDownload = false`).
3. İndirme sırasında görev çubuğu simgesinde ilerleme çubuğu, pencere başlığında yüzde görünür.
4. İndirme bitince "şimdi yeniden başlat" ya da "çıkışta yükle" sorulur. İkincisinde güncelleme,
   program bir sonraki kapatılışında kendiliğinden kurulur.

Menüden **Yardım → Güncellemeleri denetle…** ile elle de denetlenebilir; orada sonuç her hâlükârda
(güncel olsa da, ağ hatası olsa da) bildirilir. Sessiz denetimde ağ hatası kullanıcıyı rahatsız etmez.
Geliştirme kopyasında (paketlenmemiş) güncelleme hiç aranmaz.

Sürüm karşılaştırmasını, imza/bütünlük denetimini ve fark (differential) indirmeyi `electron-updater`
yapar; beslemesi `electron-builder`'ın kurulum .exe'sinin yanına koyduğu `latest.yml` dosyasıdır.

Yayın **iki adımlıdır ve bu bilinçlidir**: electron-builder önce bir *taslak* sürüm oluşturup üç
dosyayı da (`.exe`, `.blockmap`, `latest.yml`) oraya yükler; iş akışı taslağı ancak yükleme
bittikten sonra yayımlar. Nedeni GitHub'ın kuralıdır — *"Published releases must have a valid tag"*:
yayımlanmış bir sürüm var olmayan bir etikete işaret edemez, bu yüzden doğrudan yayımlanmış sürüm
oluşturma denemesi 422 ile düşer ve yükleme yarıda kalır. Taslak ise var olmayan bir etikete işaret
edebilir; yayımlandığı anda etiketi GitHub oluşturur. Yan faydası: `electron-updater` yalnızca
yayımlanmış sürümleri gördüğü için **yarım kalmış bir yayın kullanıcılara hiç görünmez**.

#### Yeni sürüm yayınlama

Yayın ölçütü tek bir şeydir: **`package.json` içindeki sürüm numarası.**

```bash
npm version minor --no-git-tag-version     # ya da elle: "version": "1.2.0"
git commit -am "Sürüm 1.2.0" && git push
```

Push'tan sonra `.github/workflows/windows-yayin.yml` kendiliğinden:

1. testleri koşar (düşerse yayın yapılmaz),
2. `windows-latest` koşucusunda kurulum .exe'sini derler ve bir **taslak**
   sürüme yükler,
3. dosyaları gerçekten taşıyan taslağı yayımlar — etiketi bu anda GitHub,
   derlemenin yapıldığı commit'e bağlayarak oluşturur,
4. yayının Releases'e ulaştığını (`.exe` + `latest.yml`, taslak değil) doğrular;
   eksikse iş kırmızı düşer.

> electron-builder aynı etiket için **iki taslak** açıyor: biri `.exe` +
> `latest.yml`, öteki yalnızca `.exe.blockmap` alıyor. Bu yüzden iş akışı,
> etikete göre körlemesine yayımlamak yerine **`.exe` ve `latest.yml`'i birlikte
> taşıyan** taslağı seçip onu yayımlar, ikizini siler. Seçim dosya adlarını
> **tam** eşleştirir: alt dize araması burada yanlış taslağı seçer, çünkü
> kurulum dosyasının adı `...exe.blockmap` adının içinde alt dize olarak geçer.

Sürüm artırılmadan yapılan push'lar yalnızca test edilir; aynı sürüm iki kez yayınlanmaz. Bir yayını
yeniden derlemek gerekirse Actions sekmesinden iş akışı **"zorla"** seçeneğiyle elle çalıştırılabilir.

Kurulum dosyasını yerelde denemek için (Windows üzerinde):

```bash
npm install
npm run masaustu          # uygulamayı derlemeden çalıştırır
npm run paketle           # dist/ içine kurulum .exe'si üretir, yayınlamaz
```

> Kurulum dosyası **kod imzalama sertifikasıyla imzalı değildir.** Windows SmartScreen ilk kurulumda
> "Bilinmeyen yayımcı" uyarısı gösterebilir; **Daha fazla bilgi → Yine de çalıştır** ile geçilir.
> Uyarıyı tümüyle kaldırmak için ücretli bir kod imzalama sertifikası gerekir; sertifika alındığında
> `electron-builder.mjs` içine `win.certificateFile`/`certificatePassword` eklenmesi yeterlidir.

## Raporun ön bölümü

Teslim edilen akustik rapor, hesap sayfalarından ibaret değildir: önünde parsel künyesi,
çevresel gürültü değerlendirmesi, anahtar paftalar (kat planları ve kesitler), yapı elemanı
kod anahtarı, mekân hassasiyet tablosu ve nokta detaylar bulunur. **Rapor ön bölümü**
sekmesi bu kısmı üretir.

Tasarımın çekirdeği şudur: *kullanıcı aynı bilgiyi iki kez girmez.* Parsel, mal sahibi ve
bina bilgileri **Proje künyesi** sekmesinden olduğu gibi akar; yapı elemanı kod anahtarı,
mekân dereceleri ve malzeme yoğunlukları ise **hesaplardan türetilir**. Sekmede bunlar
salt okunur olarak önizlenir — değiştirmek için ilgili hesap kaydı düzenlenir.

### Çizim ekleme ve şekil numaralandırma

Beş görsel bölümü vardır ve her biri raporda kendi bölüm numarasını taşır:

| Bölüm | İçerik | Şekil numarası |
|---|---|---|
| Vaziyet planı | Parsel ve çevre yollar | Şekil 1.1 |
| Kat planları | Zemin / normal / çatı katı | Şekil 4.1 … |
| Kesitler | Düşey kesitler | kat planlarının ardından sürer |
| Nokta detaylar | Birleşim ve şaft detayları | Şekil 7.1 … |
| Uygulama ve kontrol | Şantiye kuralları | Şekil 9.1 … |

Numaraları kullanıcı yazmaz: listedeki sıraya göre kendiliğinden verilir, ↑/↓ ile sıra
değiştirildiğinde yeniden hesaplanır. Kat planları ile kesitler **aynı bölümü paylaşır**
(4), bu yüzden kesitler kat planlarının bıraktığı yerden numaralanmayı sürdürür.

Çizimler proje JSON'unun içine `data:` URL olarak gömülür — harici dosya bağımlılığı
olmaz, proje dosyası tek başına taşınabilir. Dosya başına sınır **4 MB**'tır; sınır
`localStorage` kotasını (tipik 5 MB) tek bir çizimle doldurmamak içindir.

### Çevresel gürültü ve L(gag)

Gündüz–akşam–gece göstergesi, üç zaman diliminin süreyle ağırlıklı 24 saatlik enerji
ortalamasıdır:

```
Lgag = 10·lg[ (12·10^(Lgündüz/10) + 4·10^(Lakşam/10) + 8·10^(Lgece/10)) / 24 ]
```

Ağırlıklar dilim uzunluklarıdır: gündüz 07.00–19.00 (12 saat), akşam 19.00–23.00
(4 saat), gece 23.00–07.00 (8 saat).

> **Akşama ve geceye ceza eklenmez.** Avrupa'daki L<sub>den</sub> göstergesi akşamı
> +5, geceyi +10 dBA cezalandırır ve iki bağıntı sıkça karıştırılır; Çevresel
> Gürültünün Değerlendirilmesi ve Yönetimi Yönetmeliği'ndeki L<sub>gag</sub> ise düz
> enerji ortalamasıdır. Fark önemsiz değil: 60/55/50 dBA girdisinde cezalı bağıntı
> 60,0 — doğru bağıntı **57,7 dBA** verir. v1.4.0 bu hesabı cezalı yapıyordu,
> **v1.4.1** ile düzeltildi.

Girilen düzeyler, seçilen alan türünün EK-VII sınır değerleriyle karşılaştırılır.
"Yollar mevcut" işaretlendiğinde sınırlar 5 dBA yükselir — planlanmış ama henüz
yapılmamış yollar için daha sıkı değerler geçerlidir. Üç düzeyden biri bile eksikse
L<sub>gag</sub> hesaplanmaz ve tabloda "—" görünür; eksik veriyi varsayımla doldurmak,
raporu sessizce yanlışlamak olurdu.

### Sayfa sığdırma

Ön bölümün sekiz sayfasının her biri **tek bir A4'e sığar** (yazılabilir yükseklik
277 mm ≈ 1047 px). Bir sayfaya en çok iki şekil konur; şekil yüksekliği yazdırmada
310 px'e, künye tablosuyla aynı sayfayı paylaşan vaziyet planında 175 px'e kısılır.
Bu sınırlar keyfî değil ölçülmüştür: kısılmadan önce giriş sayfası 1190 px'e çıkıyor ve
yalnızca altbilginin düştüğü boş bir sayfa üretiyordu.

### Rapor sayfa düzeni

Her hesap **kendi sayfasında** başlar (`break-before: page`): her ayırıcı eleman, her döşeme
(darbe sesi) ve her cephe için ayrı bir sayfa üretilir; sayfa kendi mahal şemasını, geometri
dökümünü, bileşen tablolarını ve hesap adımlarını taşır. Sonda toplu özet tabloları ve EK-10
performans belgesi yer alır.

Cephe hesapları artık ayırıcı elemanla **aynı ayrıntıda** raporlanır: sonuç şeridi, mahal
geometrisi ve 3B şema, cephe bileşenlerinin alan/R<sub>w</sub>/enerji payı dökümü, küçük elemanlar,
iç yan yollar (Df) ve adım adım hesap tablosu — bileşik R′<sub>w</sub>'den D<sub>nT,A,tr</sub>'ye
kadar her ara değer görünür. Döşeme hesapları da benzer biçimde kendi sayfasında,
L<sub>n,w,eq</sub> → ΔL<sub>w</sub> → K → L′<sub>nT,w</sub> zinciriyle dökülür ve — ayırıcı eleman
ile cephede olduğu gibi — **canlı 3B mahal şeması** taşır. Şema iki oda kipinde üst ve alt mekânı
kaydırmasıyla birlikte, tek oda kipinde alıcı mekânı gösterir; yalnızca doğrudan hacim girilen
kipte ölçü bulunmadığı için şema çizilemez.

### Raporu PDF'e aktarma

İki ayrıntı bilinçlidir:

**Çıktı her koşulda beyaz A4'tür.** Sayfa boyutu `@page { size: A4; margin: 10mm }` ile tanımlıdır;
masaüstü sürümü de `preferCSSPageSize` ile aynı kuralı okur, böylece tarayıcıdan ve uygulamadan alınan
PDF birebir aynı kâğıda basılır. Renk şeması yazdırmada `light`a sabitlenir — bu şart, çünkü uygulama
koyu temada çalışıyor ve sayfa zemini (aşağıdaki nedenle) saydam bırakılıyor: zemini olmayan kâğıdı
tarayıcı `color-scheme`e göre boyar ve koyu şemada **#121212**, yani simsiyah bir PDF üretirdi.

**Kâğıt açıkça beyaza boyanır.** Bu, sayfayı kaplayan bir dolgu dikdörtgeni üretir; bir ara bu
dolgu kaldırılmıştı, çünkü PDF düzenleyicilerde (Nitro, Acrobat) seçilebilir bir nesne olarak
görünüyordu. Ne var ki **dolgusuz kâğıdın rengini tarayıcı belirliyor**: uygulama koyu temada
çalıştığı için sayfa siyah basılabiliyordu. "Her koşulda beyaz" şartı o nesnenin yokluğundan
önemlidir, bu yüzden dolgu geri alındı. Yalnızca `html` boyanır; `body` ve rapor kapları saydam
kalır, yani sayfa başına **tek** dolgu düşer. **Anlamlı** dolgular — belge başlık bandı, tablo
başlıkları, sınıf okları — `print-color-adjust: exact` ile ayrıca korunur.

İkinci bir güvence olarak renk şeması **belge düzeyinde** açığa sabitlenmiştir
(`:root{color-scheme:light}`), koyu şema yalnızca `@media screen` içinde açılır. Bunu yalnızca
`@media print` içine yazmak yetmiyordu: özellik hesaplanan değerde `light` görünse bile sayfa
tuvalinin rengi belge düzeyinde çözüldüğünden koyu kalabiliyordu.

**Tablolar sayfaya sığar.** Ekranda geniş tablolar `.tablo-sar` içinde yatay kaydırılır; kâğıtta
kaydırma diye bir şey olmadığı için taşan sütunlar görünmez olur — veri sessizce kaybolurdu.
Yazdırmada kaydırma kapatılır, hücrelerin satır atlamasına izin verilir ve ölçüt sütunundaki asgari
genişlik kaldırılır; sütunlar birden çok satıra yayılarak daralır. Örnek projede rapordaki 12
tablonun tamamı 717 px'lik A4 basılabilir genişliğine sığar.

**Akustik performans belgesi tek A4 sayfasına sığar.** Buradaki incelik şudur: A4'ün basılabilir
genişliği ≈ 717 px'tir (210 mm − 2×10 mm kenar, 96 dpi) ve bu değer arayüzün dar ekran eşiğinin
(820 px) **altında** kalır. Yani belge, yazdırmada kendiliğinden "cep telefonu" yerleşimine iniyor,
iki sütunlu tasarımı tek sütuna dizilip 1822 px'e uzuyor ve ikinci sayfaya taşıyordu. Yazdırma
biçemleri sütunlu yerleşimi açıkça geri getirir ve ölçüleri sıkıştırır; belge ölçülen 988 px ile
1046 px'lik A4 alanına 58 px payla sığar ve `break-before: page` ile kendi sayfasında başlar.
Bu değerler tarayıcıda ölçülerek bulunmuştur; `test/yazdirma.test.js` kuralların sessizce geri
alınmasını önler.


Rapor sekmesindeki **"Raporu PDF'e aktar"** düğmesi iki ortamda farklı çalışır, çünkü ortamların
yetenekleri farklıdır:

- **Windows uygulamasında** bu gerçek bir dışa aktarmadır. Yazdırma penceresi hiç açılmaz; yalnızca
  dosyanın nereye kaydedileceği sorulur, PDF doğrudan yazılır ve kaydedilen dosya Dosya
  Gezgini'nde gösterilir. Dosya adı proje adından (varsa rapor kodundan) türetilir.
- **Tarayıcıda** ise düğme yazdırma penceresini açar; hedef olarak *"PDF olarak kaydet"* seçilir.
  Bunun nedeni basittir: bir web sayfası kendi başına PDF dosyası yazamaz, tarayıcının PDF motoruna
  ancak bu pencereden ulaşılır. Harici bir PDF kitaplığı eklemek hem projenin dış bağımlılığı
  olmaması ilkesini bozar hem de daha kötü çıktı verir — sayfa sonları, tablo bölünmeleri ve yazı
  tipleri `@media print` kurallarıyla zaten doğru dökülüyor.

Her iki durumda da çıktı aynı `@media print` biçemlerini kullanır: kenar çubuğu, üst çubuk ve düğme
şeridi çıktıya girmez, renkler açık temaya döndürülür, sayfa sonları rapordaki tanımlara uyar.
A4, 10 mm kenar boşluğu.

### Akış

0. **Panel** — genel görünüm: belirleyici performans sınıfı, uygunluk oranı, dikkat gerektiren
   bileşenler ve bölüm bazlı özet tablolar. Her satırdan ilgili bölüme geçilebilir.
1. **Proje künyesi** — künye, bina türü, yapının durumu (yeni bina / kullanım amacı değişikliği / esaslı
   tadilat) ve hedef akustik performans sınıfı. Yönetmelik yeni binalarda en az **C** sınıfı ister.
2. **Ayırıcı elemanlar** — kaynak ve alıcı mekânları seçin, ayırıcı elemanı ve yan elemanları
   (birleşim uzunluğu `lf`, birleşim tipi T/X) tanımlayın. "Ses iletim yollarının payları" bölümü
   hangi yolun sonucu sınırladığını gösterir; iyileştirme oraya yapılmalıdır.
3. **Darbe sesi** — taşıyıcı döşeme, yüzer şap/şilte ve varsa asma tavan.
4. **Cephe** — yüzeysel elemanlar (duvar, pencere) ve küçük elemanlar (menfez, panjur kutusu). Oda
   boyutları girilirse mahal **orta** (tek dış duvar D1 = L×H) veya **köşe** (D1 + D2 = W×H) olarak
   çözülür ve iç tavan / iç taban / iç yan duvarların dış duvarla birleşimlerinden doğan **Df yan
   yolları** hesaba katılır. Ayrıca Ctr girilerek D<sub>nT,A,tr</sub> = D2m,nT,w + Ctr bilgi olarak üretilir.
   Dış duvarlar ve dört iç yan eleman **katmanlı yapı** olarak da kurulabilir; doğramalar **en × boy**
   ölçüsüyle girilir ve geometri modunda opak duvar alanı, brüt alandan o duvardaki doğramalar
   düşülerek kendiliğinden bulunur.
5. **Reverberasyon** — hacim, yüzeyler ve nesneler.
6. **Rapor** — tüm sonuçların özeti; **PDF'e aktarılabilir** (bkz. aşağıdaki not).

Ölçü ve değer kutuları metin girdisidir (`inputmode="decimal"`): Türkçe ondalık **virgülü**
doğrudan kabul edilir ("2,62"), yazarken araya giren yeniden çizimlerde imleç ve odak korunur.

Ayırıcı, döşeme ve cephe hesaplarında **manuel hedef** girilebilir: alan boş bırakıldığında
yönetmelik tablosundan gelen değer kullanılır, bir değer girildiğinde uygunluk kararı ona göre
verilir. Yönetmelik değeri kaybolmaz — arayüzde yer tutucu olarak, raporda ise hedefin yanındaki
"manuel" etiketiyle birlikte görünür; elde edilen akustik sınıf her hâlükârda yönetmelik
tablosundan okunmaya devam eder.

Projeler `Projeyi indir` / `Proje aç` ile JSON olarak taşınır; çalışma ayrıca tarayıcıya otomatik
kaydedilir.

Panel **boş bir projeyle** açılır: kayıtlı bir çalışma varsa ondan devam edilir, yoksa hiçbir bileşen
tanımlı değildir ve panelde başlangıç kartı görünür. Örnek proje kendiliğinden yüklenmez — üst
çubuktaki `Örnek proje` düğmesi (ya da başlangıç kartındaki `Örnek projeyi yükle`) hem sağlanan hem
sağlanmayan bileşenler içeren bir konut örneği yükler.

### Raporda lisans ve sorumluluk

Yazdırılabilir raporun **her sayfasının** altında program künyesi yer alır: lisans sahibi
(*Sinem Ali Gökten Grup İnşaat Mimarlık Akustik Müh. San. Tic. Ltd. Şti.*), geliştirici
(*SAGG+ App*), telif ibaresi ve şu sorumluluk kaydı:

> **Rapor içeriğinden ve hesaplamalardan proje müellifi sorumludur.**

Metinlerin tek kaynağı `js/veri/lisans.js`'tir; telif yılı raporun tarihinden alınır.

---

## Proje yapısı

```
index.html                     Dashboard kabuğu (kenar çubuğu + içerik)
css/stil.css                   Tasarım simgeleri, açık/koyu tema, yazdırma biçemleri
css/yazi.css                   Inter @font-face tanımları (latin + latin-ext)
fonts/                         Inter değişken font dosyaları (woff2) + OFL lisansı
assets/                        Marka işareti (logo.png) ve favicon türevleri
.github/workflows/pages.yml    Testleri çalıştırıp GitHub Pages'e yayınlar
.github/workflows/windows-yayin.yml
                               Windows kurulum .exe'sini derleyip Releases'e yayınlar
electron-builder.mjs           Masaüstü paketleme ve yayın yapılandırması
masaustu/
  ana.js                       Electron ana süreci: pencere, menü, sagg:// protokolü
  guncelleyici.js              GitHub Releases üzerinden otomatik güncelleme akışı
  yardimcilar.js               Kabuğun Electron'suz sınanabilen saf mantığı
  onyukleme.cjs                Ön yükleme köprüsü (yalnızca sürüm/platform künyesi)
js/
  uygulama.js                  Giriş noktası: durum, yönlendirme, tema, olaylar, dosya işlemleri
  durum.js                     Proje verisi, kalıcılık, örnek proje
  hesap.js                     Proje verisini hesap çekirdeğine bağlayan katman
  cekirdek/
    temel.js                   Birim dönüşümleri, enerjik toplama, rezonans frekansı, kavite bonusu
    katmanli-eleman.js         Çok katmanlı duvar/döşeme hesabı (tek/iki kabuk)
    geometri.js                Oda boyutlarından (L×W×H) alan/hacim/birleşim uzunluğu hesabı
    kutle-kanunu.js            Alan kütlesinden Rw ve Ln,w,eq kestirimi
    kij.js                     Birleşimlerde titreşim azaltma indisi (TS EN 12354-1 Ek-E)
    en12354-1.js               Hava doğuşlu ses, yan yollu
    en12354-2.js               Darbe sesi
    en12354-3.js               Cephe
    reverberasyon.js           Sabine
    degerlendirme.js           Yönetmelik gereksinimleri ve sınıf belirleme
    performans-belgesi.js      EK-10 Akustik Performans Belgesi verisi
    rapor-onbolum.js           Raporun ön bölümü: çevresel gürültü, şekil numaraları, kod anahtarı
  veri/
    yonetmelik.js              ★ Yönetmelik ekleri — düzenlenebilir veri katmanı
    malzemeler.js              ★ Malzeme kütüphanesi + eski kimlik göç haritası
    lisans.js                  Program lisans / sorumluluk künyesi (rapor altbilgisi)
    favoriler.js               Kullanıcıya ait katman favorileri (iç duvar/dış duvar/döşeme)
    v3-donusturucu.js          "Katmanlı Model v3" JSON şemasından içe aktarma
  arayuz/
    sekme-panel.js             Panel (genel görünüm)
    sekme-kutuphane.js         Malzeme kütüphanesi (aranabilir döküm) + katman favorileri
    katman-editor.js           Çok katmanlı yapı elemanı düzenleyici (paylaşılan bileşen)
    oda-cizimi.js              İzometrik oda şeması (SVG) üretici
    rapor-onbolum-sayfalari.js Raporun ön bölümünün yazdırılabilir A4 sayfaları
    xlsx-yazici.js             Dış bağımlılıksız .xlsx (ZIP/OOXML) yazıcı
    sekme-*.js                 Bölüm ekranları
    simgeler.js                Satır içi SVG simge seti
    ortak.js                   Arayüz yardımcıları
test/cekirdek.test.js          Hesap çekirdeği testleri
test/masaustu.test.js          Masaüstü kabuğu ve paketleme yapılandırması testleri
```

## Testler

```bash
npm test          # node --test test/*.test.js
```

343 test; birim dönüşümlerini, Kij bağıntılarını, yan yol modelini, sınıf belirlemeyi, örnek
projenin uçtan uca hesabını, kütüphane bütünlüğünü, eski projelerin kimlik göçünü, rezonans frekansı
modelini, katmanlı eleman hesabını (tek/iki kabuk ayrımı, kavite bonusu), oda geometrisi
hesaplarını (KS-Schallschutzrechner örneğiyle doğrulanmış), izometrik şema üretimini, cephe iç yan
yollarını, sayı girdisi davranışını, katman favorileri kitaplığını, raporda mekân adı çözümünü ve
Excel sınır değer tablosu çıktısını (DD/İD/DOS kodlaması, sayfa yerleşimi, geçerli ZIP/OOXML paketi)
rapor altbilgisindeki lisans künyesini, yönetmelik tablolarının resmî ek dosyasıyla
birebir örtüşmesini, EK-10 performans belgesini, künye alanlarının rapora akışını, ayırıcı elemanda kısmi örtüşme
(kaydırma) hesabını ve Windows masaüstü kabuğunu (özel protokol yol çözümü ve dizin dışına çıkma
koruması, güncelleme penceresi metinleri, paketleme ve yayıncı yapılandırması, uygulama menüsünün
içeriği) ve darbe sesinde üst/alt mekân ölçülerinin ayrı verilebildiği kipi (hangi hacmin bağıntıya
girdiği, kipler arası ölçü taşıma, eski kayıtların değişmezliği) kapsar. Ayrıca referans araçtan alınan dört örnek dosya, sonuçları birebir doğrulayan bir kehanet
(oracle) takımı olarak koşturulur.

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
  hesabında çevresel gürültü düzeyi **L<sub>gag</sub>** (gündüz-akşam-gece eşdeğer düzeyi) kullanıcı
  girdisidir ve gürültü haritasından ya da ölçümden alınmalıdır.
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

## Akustik performans belgesi

### Künye alanları

Belgenin künye bölümü **Proje künyesi** sekmesinden doldurulur:

- **Yapı yeri** — il, ilçe, mahalle, pafta, ada, parsel, açık adres. Bunlar raporda ve belgede
  tek satır olarak birleştirilir (`1234 ada / 5 parsel`, `Bağlar Mah., Sokak No:3, Çankaya / Ankara`);
  boş bıraktığınız alanlar satıra hiç girmez, yarım ayraç kalmaz. Ekranda canlı bir önizleme gösterilir.
- **Bina bilgileri** — inşaat yılı, kapalı kullanım alanı, toplam inşaat alanı ve **binanın resmi**.
  Resim proje JSON'unun içine `data:` URL olarak gömülür, yani proje dosyası tek başına taşınabilir
  (en çok 2 MB).
- **Belge künyesi** — oda sicil numarası ve belge numarası (boşsa rapor kodu kullanılır),
  işverenin adresi.

Ada/parsel eskiden tek serbest metin alanıydı; o alanda kayıtlı projeler bozulmaz — Ada ve Parsel
alanları boş kaldığı sürece eski metin kullanılmaya devam eder ve künye ekranında bu durum bildirilir.

Raporun **son sayfası**, Yönetmeliğin EK-10'undaki *Akustik Performans Belgesi*'nin aynı
düzendeki bir kopyasıdır: sarı başlık bandı, proje/bina künyesi ve bina resmi alanı,
A–F performans merdiveni ile sınıf tanımları, altı ölçütlü değerlendirme tablosu,
açıklamalar ve imza bloğu.

Sınıf belirleme EK-10 §10.1(9) kuralını izler: **elde edilen en alt performans sınıfı**
hem her ölçüt için hem de "Toplam" satırı için belirleyicidir. Altı ölçüt:

| # | Ölçüt | Gösterge | Kaynak |
|---|---|---|---|
| 1 | İç gürültü düzeyleri | LAeq | *hesaplanmaz — ölçüme dayanır* |
| 2 | Dış yapı elemanı yalıtımı | DnT,A,tr | Cephe kayıtları |
| 3 | Hava doğuşlu ses | DnT,A | Ayırıcı eleman kayıtları |
| 4 | Darbe sesi | L′nT,w | Döşeme kayıtları |
| 5 | Tesisat gürültüsü | LAeq,nT / LAF,max,nT | *hesaplanmaz — ölçüme dayanır* |
| 6 | Reverberasyon süresi | T | Hacim kayıtları |

1. ve 5. ölçütler Yönetmelikçe saha ölçümüne dayandırılır (EK-10 §10.1/4); bu araç onları
hesaplamaz ve belgede EK-10 §10.2(3) uyarınca **"performans belirlenemedi"** olarak işaretler.
Belgenin son geçerlilik tarihi, veriliş tarihinden 10 yıl sonrasıdır (EK-10 §10.1/1).

> Bu çıktı bir **ön boyutlandırma** belgesidir; EK-9'daki standartlara uygun saha ölçümleriyle
> doğrulanmadan resmî akustik performans belgesi yerine geçmez. Belge sayfasında bu uyarı
> ayrıca basılır.

Kod: `js/cekirdek/performans-belgesi.js` (sınıf mantığı) ve `js/arayuz/sekme-rapor.js`
(`performansBelgesi`).

## Marka ve tipografi

### İşaret

Kenar çubuğu, favicon ve rapor antedi aynı **yazısız marka işaretini** kullanır
(`assets/logo.png` — saydam zeminli PNG, kaynak dosyanın kendisi). Türevleri:

| Dosya | Kullanım |
|---|---|
| `assets/logo.png` | Kenar çubuğu, rapor antedi |
| `assets/favicon-32.png`, `favicon-512.png` | Tarayıcı sekmesi |
| `assets/apple-touch-icon.png` | iOS ana ekran kısayolu |

İşaret siyah + turuncudur (`#000000` / `#FC3B00`). Koyu kenar çubuğunda ve koyu sekme
şeridinde kaybolmaması için beyaz, yuvarlatılmış bir levhaya oturtulur — **işaretin
kendisi hiç değiştirilmez**, yalnızca arkasına bir zemin konur.

### Yazı ailesi

Arayüz ve rapor **Inter** ile dizilir — Helvetica Neue soyundan gelen bir neo-grotesk.
Font depoda barındırılır (`fonts/`, ~134 KB): dış istek yoktur, çevrimdışı ve kısıtlı
ağlarda da çalışır. Değişken (variable) font olduğu için 100–900 arası tüm ağırlıklar
tek dosyadan gelir; yalnızca `latin` ve `latin-ext` altkümeleri alınmıştır.

Türkçe'ye özgü **ı İ ğ Ğ ş Ş ç Ç ö Ö ü Ü** karakterleri `latin-ext` altkümesindedir ve
tam olarak desteklenir. Font yüklenemezse yığın sırayla sistemdeki gerçek **Helvetica
Neue**'ye, ardından Arial'e düşer — yani her koşulda aynı tipografik karakter korunur:

```css
--yazi: "Inter", "Helvetica Neue", Helvetica, "Segoe UI", Roboto, Arial, sans-serif;
```

Excel çıktısı, Office'te her yerde bulunan Arial ile biçimlendirilir.

Inter, SIL Open Font License 1.1 ile dağıtılır; lisans metni `fonts/LICENSE-Inter.txt`
içindedir.

## Lisans

MIT
