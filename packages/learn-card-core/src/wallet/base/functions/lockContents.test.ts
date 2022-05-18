import * as fixtures from '@transmute/universal-wallet-test-vectors';
import { lockContents } from './lockContents';

it('lockContents', async () => {
  const contents = [{ foo: 1 }, { bar: 1 }];
  const lockedContents = await lockContents(fixtures.password, contents);
  expect(lockedContents.length).toBe(2);
});
