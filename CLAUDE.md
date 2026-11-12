# Çalışma kuralları (proje sahibinin kalıcı talimatı)

Proje sahibi, her işin sonunda ayrıca komut beklenmeden şunların yapılmasını istedi:

1. **Doğrula:** `npm test` geçmeli. Arayüz değiştiyse tarayıcıda da denenmeli.
2. **Sürüm:** Kullanıcıya ulaşan her değişiklikte sürümü artır. Hem `package.json` hem
   `package-lock.json` (kök `version` ve `packages[""].version`) hem de
   `js/veri/lisans.js` → `UYGULAMA_SURUMU` güncellenir. Bir test bunların eşleştiğini denetler.
   Düzeltmede yama (1.7.0 → 1.7.1), yeni özellikte ara sürüm (1.7.x → 1.8.0) artırılır.
3. **Birleştir ve yayınla:** Çalışma dalını yayın dalı
   `claude/ks-schallschutzrechner-turkish-lgtwfl` ile birleştir ve gönder. Bu dala yapılan push:
   - `.github/workflows/pages.yml` ile web sürümünü GitHub Pages'e yayınlar,
   - `.github/workflows/windows-yayin.yml` ile, sürüm yeni ise Windows kurulum dosyasını
     derleyip Releases'e koyar. Kurulu uygulamalar bu güncellemeyi kendiliğinden bulur.
4. **Denetle:** İki iş akışının sonucunu kontrol et. Kırmızıysa düzelt ve yeniden gönder.

Geçmişi yeniden yazma (force-push yok). Birleştirme commit'i kullan.
