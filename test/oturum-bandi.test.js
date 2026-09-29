import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kalanSure, oturumBandiniBaslat } from '../js/arayuz/oturum-bandi.js';

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
