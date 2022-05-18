import * as fixtures from '@transmute/universal-wallet-test-vectors';
import { passwordToKey } from './passwordToKey';

it('seed from password', async () => {
  const derivedKey: any = await passwordToKey(fixtures.password);
  expect(Buffer.from(derivedKey).toString('hex')).toBe(fixtures.seed);
});
