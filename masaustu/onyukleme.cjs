/**
 * onyukleme.cjs — Ön yükleme (preload) betiği.
 *
 * Web uygulaması masaüstünde de tarayıcıdakiyle birebir aynı kodu çalıştırır.
 * Bu yüzden köprü olabildiğince dar tutulur: salt okunur bir künye (arayüz
 * "masaüstü sürümündeyim" diyebilsin) ve tek bir eylem — raporu PDF olarak
 * kaydetmek. Node erişimi kapalıdır (contextIsolation + sandbox); PDF çağrısı
 * yalnızca ana sürece bir istek iletir, dosyayı nereye yazacağını kullanıcı
 * kaydetme penceresinde seçer.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('saggMasaustu', {
  surum: (process.argv.find((a) => a.startsWith('--sagg-surum=')) || '=').split('=')[1] || null,
  platform: process.platform,
  masaustu: true,
  /**
   * Raporu PDF olarak kaydeder. Web sürümünde bu köprü yoktur; arayüz orada
   * tarayıcının yazdırma penceresine düşer (bkz. js/uygulama.js).
   */
  pdfeAktar: (dosyaAdi) => ipcRenderer.invoke('sagg:pdfe-aktar', String(dosyaAdi || '')),
});
