/**
 * xlsx-yazici.js — Dış bağımlılık kullanmadan, tarayıcıda .xlsx (OOXML)
 * dosyası üreten minimal bir yazıcı.
 *
 * Kapsam kasıtlı olarak dardır: birden çok sayfa, sütun genişlikleri,
 * hücre birleştirme, dört sabit hücre biçemi (başlık / kategori / veri /
 * sağa yaslı veri) ve metin/sayı hücreleri. Sıkıştırmasız (STORE) bir ZIP
 * paketi üretir — Excel ve LibreOffice bunu sorunsuz açar, ayrı bir
 * deflate uygulaması gerektirmez.
 */

/* ── ZIP (STORE) ──────────────────────────────────────────────────── */

const CRC_TABLOSU = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLOSU[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function utf8Bytes(str) {
  return new TextEncoder().encode(str);
}

/** DOS tarih/saat alanları — sabit bir zaman damgası (içerik doğrulaması etkilenmez). */
const DOS_SAAT = 0;
const DOS_TARIH = (1 << 9) | (1 << 5) | 1; // 1980-01-01

function u16(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]); }
function u32(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]); }
function birlestir(...parcalar) {
  const toplam = parcalar.reduce((t, p) => t + p.length, 0);
  const sonuc = new Uint8Array(toplam);
  let ofset = 0;
  for (const p of parcalar) { sonuc.set(p, ofset); ofset += p.length; }
  return sonuc;
}

/**
 * @param {{ad:string, icerik:string}[]} dosyalar
 * @returns {Blob}
 */
function zipOlustur(dosyalar) {
  const yerelParcalar = [];
  const merkeziParcalar = [];
  let ofset = 0;

  for (const { ad, icerik } of dosyalar) {
    const adBytes = utf8Bytes(ad);
    const veriBytes = utf8Bytes(icerik);
    const crc = crc32(veriBytes);
    const boyut = veriBytes.length;

    const yerelBaslik = birlestir(
      u32(0x04034b50), u16(20), u16(0), u16(0),
      u16(DOS_SAAT), u16(DOS_TARIH),
      u32(crc), u32(boyut), u32(boyut),
      u16(adBytes.length), u16(0), adBytes,
    );
    yerelParcalar.push(yerelBaslik, veriBytes);

    const merkeziBaslik = birlestir(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0),
      u16(DOS_SAAT), u16(DOS_TARIH),
      u32(crc), u32(boyut), u32(boyut),
      u16(adBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0),
      u32(ofset), adBytes,
    );
    merkeziParcalar.push(merkeziBaslik);

    ofset += yerelBaslik.length + veriBytes.length;
  }

  const merkeziKatalog = birlestir(...merkeziParcalar);
  const sonKayit = birlestir(
    u32(0x06054b50), u16(0), u16(0),
    u16(dosyalar.length), u16(dosyalar.length),
    u32(merkeziKatalog.length), u32(ofset), u16(0),
  );

  return new Blob([...yerelParcalar, merkeziKatalog, sonKayit], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/* ── XML kaçış ve sütun harfleri ──────────────────────────────────── */

function xKacis(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sutunHarfi(index0) {
  let n = index0 + 1;
  let s = '';
  while (n > 0) {
    const kalan = (n - 1) % 26;
    s = String.fromCharCode(65 + kalan) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/* ── Sabit stil paleti ────────────────────────────────────────────── */

/** cellXfs dizinindeki sıra: 0 varsayılan, 1 başlık, 2 kategori, 3 veri, 4 veri-sağ. */
export const STIL = { VARSAYILAN: 0, BASLIK: 1, KATEGORI: 2, VERI: 3, VERI_SAG: 4 };

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><name val="Arial"/></font>
    <font><b/><sz val="13"/><name val="Arial"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color indexed="64"/></left>
      <right style="thin"><color indexed="64"/></right>
      <top style="thin"><color indexed="64"/></top>
      <bottom style="thin"><color indexed="64"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/* ── Sayfa XML üretimi ────────────────────────────────────────────── */

/**
 * @param {Object} sayfa
 * @param {number[]} [sayfa.sutunGenislikleri]
 * @param {string[]} [sayfa.birlestirmeler] "A1:B1" biçiminde
 * @param {Array<Array<{deger:(string|number), sayi?:boolean, stil?:number}|null>>} sayfa.satirlar
 */
function sayfaXml({ sutunGenislikleri = [], birlestirmeler = [], satirlar }) {
  const cols = sutunGenislikleri.length
    ? `<cols>${sutunGenislikleri.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';

  const rows = satirlar.map((satir, rIdx) => {
    const rNo = rIdx + 1;
    const hucreler = satir.map((hucre, cIdx) => {
      if (!hucre || hucre.deger === null || hucre.deger === undefined || hucre.deger === '') {
        if (!hucre || hucre.stil === undefined) return '';
        const ref = `${sutunHarfi(cIdx)}${rNo}`;
        return `<c r="${ref}" s="${hucre.stil}"/>`;
      }
      const ref = `${sutunHarfi(cIdx)}${rNo}`;
      const s = hucre.stil !== undefined ? ` s="${hucre.stil}"` : '';
      if (hucre.sayi) {
        return `<c r="${ref}"${s}><v>${Number(hucre.deger)}</v></c>`;
      }
      return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xKacis(hucre.deger)}</t></is></c>`;
    }).join('');
    return `<row r="${rNo}">${hucreler}</row>`;
  }).join('');

  const merges = birlestirmeler.length
    ? `<mergeCells count="${birlestirmeler.length}">${birlestirmeler.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${cols}
  <sheetData>${rows}</sheetData>
  ${merges}
</worksheet>`;
}

/* ── Çalışma kitabı ───────────────────────────────────────────────── */

/**
 * @param {{ad:string, sutunGenislikleri?:number[], birlestirmeler?:string[], satirlar:Array}[]} sayfalar
 * @returns {Blob}
 */
export function xlsxOlustur(sayfalar) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sayfalar.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n  ')}
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sayfalar.map((s, i) => `<sheet name="${xKacis(s.ad)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('\n    ')}
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sayfalar.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n  ')}
  <Relationship Id="rId${sayfalar.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const dosyalar = [
    { ad: '[Content_Types].xml', icerik: contentTypes },
    { ad: '_rels/.rels', icerik: rootRels },
    { ad: 'xl/workbook.xml', icerik: workbook },
    { ad: 'xl/_rels/workbook.xml.rels', icerik: workbookRels },
    { ad: 'xl/styles.xml', icerik: STYLES_XML },
    ...sayfalar.map((s, i) => ({ ad: `xl/worksheets/sheet${i + 1}.xml`, icerik: sayfaXml(s) })),
  ];

  return zipOlustur(dosyalar);
}

/** Bir Blob'u kullanıcı bilgisayarına indirir. */
export function blobIndir(blob, dosyaAdi) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dosyaAdi;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
