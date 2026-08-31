/**
 * onyukleme.cjs — Ön yükleme (preload) betiği.
 *
 * Web uygulaması masaüstünde de tarayıcıdakiyle birebir aynı kodu çalıştırır;
 * Node API'lerine ihtiyacı yoktur. Bu yüzden burada yalnızca zararsız, salt
 * okunur bir künye açığa çıkarılır: arayüz istediğinde "masaüstü sürümü"
 * olduğunu anlayabilsin diye. Node erişimi kapalıdır (contextIsolation +
 * sandbox), yani bu köprü uygulamanın güvenlik sınırını genişletmez.
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('saggMasaustu', {
  surum: (process.argv.find((a) => a.startsWith('--sagg-surum=')) || '=').split('=')[1] || null,
  platform: process.platform,
  masaustu: true,
});
