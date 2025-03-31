---
'@learncard/init': major
---

[Breaking] Do not include Ceramic Plugin by default

[Migration]
- If all you were using the ceramic plugin for was encryption, you may now use the methods exposed directly by the encryption plugin instead:

```ts
// Old
const jwe = await learnCard.invoke.getDIDObject().createDagJWE({ content });
const unencrypted = await learnCard.invoke.getDIDObject().decryptDagJWE(jwe);

// New
const jwe = await learnCard.invoke.createDagJwe({ content });
const unencrypted = await learnCard.invoke.decryptDagJwe(jwe);
```

- If you _need_ the ceramic plugin, install it via the `@learncard/ceramic` package, then add it to
your wallet

```ts
import { initLearnCard } from '@learncard/init'
import { getCeramicPlugin } from '@learncard/ceramic-plugin'

const withoutPlugin = await initLearnCard({ seed: 'a' });
const withPlugin = await withoutPlugin.addPlugin(await getCeramicPlugin(withoutPlugin));
```

- Similarly, if you need the IDX plugin, install it via the `@learncard/idx-plugin` package, then add it to
your wallet after adding the ceramic plugin

```ts
import { initLearnCard } from '@learncard/init'
import { getCeramicPlugin } from '@learncard/ceramic-plugin'
import { getIDXPlugin } from '@learncard/idx-plugin'

const withoutPlugins = await initLearnCard({ seed: 'a' });
const withCeramicPlugin = await withoutPlugin.addPlugin(await getCeramicPlugin(withoutPlugin));
const withIdxPlugin = await withCeramicPlugin.addPlugin(await getIDXPlugin(withCeramicPlugin));
```
