[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/learn-cloud-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/learn-cloud-plugin)](https://www.npmjs.com/package/@learncard/learn-cloud-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/learn-cloud-plugin)](https://www.npmjs.com/package/@learncard/learn-cloud-plugin)

Stores, indexes, and syncs a wallet's credentials (encrypted) in LearnCloud.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/learn-cloud-plugin
```

## Usage

This package exports `getLearnCloudPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getLearnCloudPlugin } from '@learncard/learn-cloud-plugin';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const cloudLearnCard = await learnCard.addPlugin(
    await getLearnCloudPlugin(learnCard, 'https://cloud.learncard.com/trpc')
);
```

Seed-based `initLearnCard` wallets already include it, pointed at `https://cloud.learncard.com/trpc`. Optional args after the URL: `unencryptedFields`, `unencryptedCustomFields`, `automaticallyAssociateDids` (default `true`).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
