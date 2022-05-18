import * as fixtures from '@transmute/universal-wallet-test-vectors';
import { seedToId } from './seedToId';

it('seed from password', async () => {
  const contentUrn: any = await seedToId(Buffer.from(fixtures.seed, 'hex'));
  expect(contentUrn).toBe(
    'urn:digest:9468ad3dcb7c87cd994b9013f980569af9c81823b1bfd1ffdb7c3fc72abb652a'
  );
});
