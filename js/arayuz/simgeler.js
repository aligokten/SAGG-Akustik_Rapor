/**
 * simgeler.js — Arayüzde kullanılan satır içi SVG simgeler.
 * Dış kaynak gerektirmez; renk `currentColor` üzerinden devralınır.
 */

const sar = (ic) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg>`;

export const SIMGELER = {
  // Panel — gösterge kutucukları
  panel: sar('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  // Proje künyesi — belge
  proje: sar('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
  // Ayırıcı elemanlar — iki mekân arasında duvar
  ayirici: sar('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/><path d="M7 9v6M17 9v6"/>'),
  // Darbe sesi — yukarıdan gelen darbe
  darbe: sar('<path d="M12 3v6"/><path d="M9 6l3 3 3-3"/><path d="M3 13h18"/><path d="M6 17l1.5 3M12 17l1.5 3M18 17l1.5 3"/>'),
  // Cephe — pencereli dış duvar
  cephe: sar('<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="7" rx="1"/><path d="M12 7v7"/><path d="M7 18h10"/>'),
  // Reverberasyon — yayılan ses dalgaları
  reverberasyon: sar('<path d="M6 9v6"/><path d="M10 6v12"/><path d="M14 8v8"/><path d="M18 5v14"/><path d="M2 11v2"/><path d="M22 11v2"/>'),
  // Malzeme kütüphanesi — istiflenmiş katmanlar
  kutuphane: sar('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 16.5l9 5 9-5"/>'),
  // Yönetmelik — terazi
  yonetmelik: sar('<path d="M12 3v18"/><path d="M7 6h10"/><path d="M5 21h14"/><path d="M7 6l-3 6a3 3 0 0 0 6 0z"/><path d="M17 6l3 6a3 3 0 0 1-6 0z"/>'),
  // Rapor — onaylı belge
  rapor: sar('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 15l2 2 4-4"/>'),

  // Üst çubuk
  ay: sar('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>'),
  gunes: sar('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  menu: sar('<path d="M4 6h16M4 12h16M4 18h16"/>'),
};

/** Bir simgeyi verilen sınıfla döndürür; bulunamazsa boş dizge. */
export function simge(ad, sinif = 'simge') {
  const s = SIMGELER[ad];
  return s ? s.replace('<svg ', `<svg class="${sinif}" `) : '';
}
