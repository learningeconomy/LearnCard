[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/ceramic-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/ceramic-plugin)](https://www.npmjs.com/package/@learncard/ceramic-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/ceramic-plugin)](https://www.npmjs.com/package/@learncard/ceramic-plugin)

**Legacy.** Publishes and reads credentials on [Ceramic](https://ceramic.network) streams. LearnCard's default storage is now LearnCloud and LearnCard Network; IDX/Ceramic support is kept for older wallets.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/ceramic-plugin
```

## Usage

This package exports `getCeramicPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getCeramicPlugin } from '@learncard/ceramic-plugin';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const ceramicLearnCard = await learnCard.addPlugin(
    await getCeramicPlugin(learnCard, {
        ceramicEndpoint: '<Ceramic node URL>',
        defaultContentFamily: 'SuperSkills',
    })
);

const vc = await ceramicLearnCard.invoke.issueCredential(ceramicLearnCard.invoke.getTestVc());
const uri = await ceramicLearnCard.store.Ceramic.upload(vc);
const resolved = await ceramicLearnCard.read.get(uri);
```

The second argument is optional and defaults to the plugin's built-in Ceramic args. The old `wallet.index.IDX` flow lives in the deprecated [`@learncard/idx-plugin`](../idx).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
