# Referans "Katmanlı Model v3" ile karşılaştırma

Bu belge, SAGG Akustik Hesap Aracı'nın hesap çekirdeğinin, aynı işi yapan referans
uygulamayla (Next.js sürümü — `app/page.tsx` ve `docs/TECHNICAL-HANDOFF.md`) hangi
noktalarda aynı, hangi noktalarda farklı olduğunu kaydeder.

Karşılaştırma iki kaynaktan yapılmıştır:

1. **Yayımlanmış raporlar** — ID1, ID2, ID3, DOS1 PDF çıktılarının sayısal değerleri.
2. **Referans kaynak kodu** — hesap fonksiyonlarının bağıntıları.

Doğrulama iki test dosyasında kilitlidir:

| Dosya | Kapsam |
|---|---|
| `test/referans-motor.test.js` | Bağıntı düzeyinde denklik. Referans motorun formülleri bağımsız bir "oracle" olarak yeniden yazılmış, kendi modüllerimiz geniş bir girdi kümesinde bununla karşılaştırılmıştır (1e-9 toleransla). |
| `test/cephe-yan-yollar.test.js` | Cephe iç yan yolları, köşe mahal, Ctr ve manuel hedef davranışı. |
| `test/referans-raporlar.test.js` | Uçtan uca denklik. ID1 ve DOS1 senaryoları geometriden nihai göstergeye kadar yayımlanmış rapor değerleriyle karşılaştırılır. |

---

## 1. Birebir aynı olan bağıntılar

Aşağıdakiler formül ve katsayı düzeyinde özdeştir; hiçbir değişiklik gerekmemiştir.

### 1.1 Rw kestirimi

```text
en12354   m' < 200 kg/m² :  Rw = 13·lg(m') + 14
          m' ≥ 200 kg/m² :  Rw = 37,5·lg(m') − 42

din4109   m' ≤ 150 kg/m² :  Rw = 20,4·lg(m') + 0,9
          m' > 150 kg/m² :  Rw = 30,9·lg(m') − 22,2
```

Kol değişim noktaları da aynıdır (200 ve 150 kg/m²). Beyan edilmiş Rw varsa kestirimin
yerine geçer.

### 1.2 Kij — titreşim azaltma indisi

```text
M = lg(m'_giriş / m'_çıkış)

T birleşimi   düz  : 5,7 + 5,7·M²
              köşe : 5,7 + 14,1·M + 5,7·M²
X birleşimi   düz  : 8,7 + 5,7·M²
              köşe : 8,7 + 17,1·M + 5,7·M²

Esnek bağlantı: +5 dB · Sonuç 0 dB'ye kırpılır.
```

> Not: Referans belgenin §5.3'ü "0 dB'nin altına kırpılmaz" der, ancak referans **kod**
> `Math.max(0, …)` uygular. Kod esas alınmıştır; bizim uygulamamız da kırpar.

### 1.3 İletim yolları

```text
A_term = 10·lg(S / l_f)

R_Dd = Rw_ayırıcı
R_Ff = Rw_F + K_düz  + A_term
R_Fd = (Rw_F + Rw_D)/2 + K_köşe(F→D) + A_term
R_Df = (Rw_D + Rw_F)/2 + K_köşe(D→F) + A_term

R'w = −10·lg( Σ 10^(−R_yol/10) )      (13 yol: Dd + 4×[Ff, Fd, Df])
```

### 1.4 Göstergeye dönüşüm

```text
DnT,w  = R'w + 10·lg( 0,64·T0·V_alıcı / S ) − emniyet_payı
L'nT,w = (164 − 35·lg(m'_döşeme)) − ΔLw − 10·lg( 0,064·T0·V_alıcı ) + emniyet_payı
```

Hacim her iki bağıntıda da **alıcı (oda 2)** hacmidir. Emniyet payı hava doğuşlu
sonuçtan düşülür, darbe sonucuna eklenir.

### 1.5 Ayırıcı geometrisi

```text
L×H duvarı  : S = min(L1,L2) × min(H1,H2)
W×H duvarı  : S = min(W1,W2) × min(H1,H2)
L×W döşemesi: S = min(L1,L2) × min(W1,W2)
```

### 1.6 Yan yol birleşim uzunluğu (lf)

Referans motor `lf = (index % 2 === 0) ? spanA : spanB` kuralını uygular; yani
**F1/F3 → spanA**, **F2/F4 → spanB**. Bizde bu, yan eleman rolleriyle karşılanır:
0/1 dizinli elemanlar `yanDuvarLf` (spanA), 2/3 dizinliler `tabanTavanLf` (spanB) alır.

| Ayırıcı yüzey | spanA (`yanDuvarLf`) | spanB (`tabanTavanLf`) |
|---|---|---|
| L×H duvarı | min(H1,H2) | min(L1,L2) |
| W×H duvarı | min(H1,H2) | min(W1,W2) |
| L×W döşemesi | min(L1,L2) | min(W1,W2) |

Döşeme ayırıcıda dört yan elemanın hepsi düşey duvardır; rol etiketi yalnızca hangi
döşeme kenarı boyunca birleştiklerini seçer. Bu eşleşme DOS1 raporunu birebir yeniden
üretir; ters eşleşme yan yolları ±3,15 dB kaydırıp DnT,w'yi 1,6 dB düşürür.

### 1.7 Yönetmelik sınır tabloları

`EK3_TABLO_3_2` (DnT,w) ve `EK3_TABLO_3_3` (L'nT,w) matrisleri, referanstaki
`AIR_LIMITS` / `IMPACT_LIMITS` ile 9 mekân çifti × 6 sınıfın tamamında aynıdır.
Asgari sınıf kuralı da aynıdır (yeni bina → C; kullanım amacı değişikliği ve esaslı
tadilat → D).

### 1.8 Cephe çekirdeği

```text
E_alan  = Σ S_i · 10^(−R_i/10)
E_küçük = Σ adet_j · 10 · 10^(−Dn,e,w,j/10)        (A0 = 10 m²)
Rw_bileşik = −10·lg( (E_alan + E_küçük) / S_toplam )

C_geo = 10·lg( V / (6·T0·S_cephe) )
D2m,nT,w = Rw_bileşik + C_şekil + C_geo − emniyet_payı
```

Cephe şekil düzeltmeleri de aynıdır: düz 0, soğurucu balkon +1, yansıtıcı balkon −1,
loggia +1,5, güneş kırıcı −2 dB.

### 1.9 Katman kütlesi

```text
m' = Σ (d_i / 1000) × ρ_i
```

Katmanlı elemanlarda **kavite bonusu uygulanmaz**: aradaki yalıtım levhası yalnızca
kütlesiyle katkı verir. (Kendi projelerinizde iki kabuklu sistem kurmak isterseniz
katmanı `boşluk` türünde eklemeniz gerekir — bu, referansta bulunmayan bir ek yetenektir.)

---

## 2. Farklar

### 2.1 Referanstan alınanlar (uygulandı)

| # | Konu | Durum |
|---|---|---|
| 1 | **Cephe iç yan yolları** | Uygulandı. İç tavan, iç taban ve iç yan duvarlar dış duvara Df yolu olarak bağlanır: `R'w,görünür = −10·lg(10^(−Rw,bileşik/10) + Σ10^(−R_Df/10))`. Yalnızca cephe kaydında oda boyutları girilmişse etkindir. |
| 2 | **Köşe mahal** | Uygulandı. Orta mahalde tek dış duvar (D1 = L×H), köşe mahalde iki dış duvar (D2 = W×H). Yüzeysel elemanlar D1/D2'ye atanır; iç tavan/taban her aktif duvara, iç yan duvar D1'e, iç arka duvar (yalnız köşede) D2'ye bağlanır. |
| 3 | **Ctr → DnT,A,tr** | Uygulandı. `DnT,A,tr = D2m,nT,w + Ctr` hesaplanır ve raporda gösterilir. **Uygunluk kararı yine EK-3 Tablo 3.1 ile D2m,nT,w üzerinden verilir** (bkz. §2.4); DnT,A,tr bilgi amaçlıdır. |
| 4 | **Manuel hedef** | Uygulandı. Hava (DnT,w), darbe (L'nT,w) ve cephe (D2m,nT,w) hedefleri elle geçersiz kılınabilir. Yönetmelik değeri `yonetmelikGereken` alanında korunur, elde edilen sınıf yine tablodan okunur, rapor ve arayüzde "manuel" etiketi gösterilir. |

### 2.2 Referansta olup bizde olmayan

| # | Konu | Referans davranışı | Bizdeki durum |
|---|---|---|---|
| 1 | Darbe bağlama | Ayırıcı döşemeyse ayırıcı, duvarsa F4 döşeme sayılır; darbe genel karara yalnız ayırıcı döşemeyse katılır | Darbe ayrı bir kayıt türüdür (`darbeler`), ayırıcıdan bağımsız modellenir — tek projede birden çok döşeme tanımlanabildiği için bağlama yapılmaz |

### 2.3 Bizde olup referansta olmayanlar

| # | Konu |
|---|---|
| 1 | `boşluk` katman türü ve iki kabuklu (kütle–yay–kütle) sistemlerde kavite bonusu; rezonans frekansı f₀ hesabı |
| 2 | Giydirme kabuk (ön duvar) sistemleri ve ΔRw katkısı |
| 3 | Reverberasyon (Sabine) hesabı — EK-5 |
| 4 | Yönetmelik sınır tablolarının arayüzden düzenlenebilmesi ve dışa aktarılması |
| 5 | Tek projede sınırsız sayıda ayırıcı / döşeme / cephe / hacim kaydı |
| 6 | Sürüklenerek döndürülebilen izometrik 3B oda modeli (saf SVG, dış bağımlılık yok) |

### 2.4 Bilinçli olarak benimsenmeyen

**Cephe hedef matrisi.** Referans, cephe hedefini `hedef = L_dış − sınıf_indirimi`
bağıntısıyla kendi tablosundan üretir (A–D sınıflarında 30 dB alt sınırıyla). Referans
belge bu matrisi kendi ifadesiyle "uygulamadaki kabul verileri" olarak niteler.
Bu araçta cephe hedefi **EK-3 Tablo 3.1**'den, yani yönetmelik verisinden gelir;
yönetmelik bağlılığını azaltmamak için referansın kabul matrisi benimsenmemiştir.
