import * as fixtures from '@transmute/universal-wallet-test-vectors';

import { plugin } from './index';

it('should generate content from seed', async () => {
  const content = await plugin.generateContentFromSeed(
    new Uint8Array(Buffer.from(fixtures.seed, 'hex'))
  );

  expect(content).toEqual(fixtures.content);
});
