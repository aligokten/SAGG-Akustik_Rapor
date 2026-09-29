import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kalanSure, oturumBandiniBaslat, demoMu } from '../js/arayuz/oturum-bandi.js';

test('kalan süre saat ve dakika olarak yazılır', () => {
  assert.equal(kalanSure(24 * 3600000), '24 sa 0 dk');
  assert.equal(kalanSure(5 * 3600000 + 12 * 60000), '5 sa 12 dk');
  assert.equal(kalanSure(59 * 60000 + 1), '1 sa 0 dk');
  assert.equal(kalanSure(90000), '2 dk');
  assert.equal(kalanSure(0), '0 dk');
  assert.equal(kalanSure(-5), '0 dk');
});

test('kap yoksa ya da tarayıcı dışındaysa hiçbir şey yapmaz', async () => {
  await oturumBandiniBaslat(null);
  const eski = globalThis.location;
  globalThis.location = { protocol: 'file:' };
  try {
    await oturumBandiniBaslat({ prepend() { throw new Error('eklenmemeli'); } });
  } finally {
    globalThis.location = eski;
  }
});

test('oturum bilgisi gelmeden demo kısıtı uygulanmaz', () => {
  // Masaüstü sürümünde ve kapı arkasında olmayan kopyalarda uç hiç çağrılmaz;
  // bu durumda rapor dışa aktarma serbest kalmalıdır.
  assert.equal(demoMu(), false);
});

/** oturumBandiniBaslat'ın ihtiyaç duyduğu en küçük tarayıcı taklidi. */
function sahteOrtamKur(oturum) {
  const eski = {
    location: globalThis.location,
    fetch: globalThis.fetch,
    document: globalThis.document,
    setInterval: globalThis.setInterval,
  };

  const govde = { siniflar: new Set(), eklenen: [] };
  globalThis.location = { protocol: 'https:' };
  globalThis.fetch = async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => oturum,
  });
  globalThis.setInterval = () => 0;
  globalThis.document = {
    body: {
      classList: { add: (s) => govde.siniflar.add(s) },
      append: (d) => govde.eklenen.push(d),
    },
    querySelector: () => null,
    createElement: () => ({
      className: '',
      textContent: '',
      classList: { toggle() {} },
      setAttribute() {},
      append() {},
      addEventListener() {},
    }),
  };

  return { govde, geriAl: () => Object.assign(globalThis, eski) };
}

test('demo oturumu gövdeye demo-oturum sınıfını ve baskı uyarısını ekler', async () => {
  const { govde, geriAl } = sahteOrtamKur({
    email: 'demo@example.com',
    kind: 'demo',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  });
  try {
    await oturumBandiniBaslat({ prepend() {} });
    assert.ok(govde.siniflar.has('demo-oturum'), 'demo-oturum sınıfı eklenmeli');
    assert.equal(govde.eklenen.length, 1, 'baskı uyarısı gövdeye eklenmeli');
    assert.equal(demoMu(), true);
  } finally {
    geriAl();
  }
});

test('tam lisans oturumunda demo kısıtı uygulanmaz', async () => {
  const { govde, geriAl } = sahteOrtamKur({ email: 'tam@example.com', kind: 'tam' });
  try {
    await oturumBandiniBaslat({ prepend() {} });
    assert.equal(govde.siniflar.has('demo-oturum'), false);
    assert.equal(govde.eklenen.length, 0, 'baskı uyarısı eklenmemeli');
  } finally {
    geriAl();
  }
});
