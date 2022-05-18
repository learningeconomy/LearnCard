import * as fixtures from '@transmute/universal-wallet-test-vectors';
import { lockContents } from './lockContents';
import { unlockContents } from './unlockContents';

it('unlockContents', async () => {
  const contents = [{ foo: 1 }, { bar: 1 }];
  const lockedContents = await lockContents(fixtures.password, contents);
  const unlockedContents = await unlockContents(
    fixtures.password,
    lockedContents
  );
  expect(unlockedContents).toEqual(contents);
});
