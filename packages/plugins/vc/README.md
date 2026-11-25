[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/vc-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/vc-plugin)](https://www.npmjs.com/package/@learncard/vc-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/vc-plugin)](https://www.npmjs.com/package/@learncard/vc-plugin)

Issues, verifies, and refreshes Verifiable Credentials and Presentations.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/vc-plugin
```

## Usage

This package exports `getVCPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getVCPlugin } from '@learncard/vc-plugin';

// Needs a LearnCard with DIDKit + an ID plane
const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const vcLearnCard = await learnCard.addPlugin(getVCPlugin(learnCard));

const unsigned = vcLearnCard.invoke.getTestVc();
const vc = await vcLearnCard.invoke.issueCredential(unsigned);
const result = await vcLearnCard.invoke.verifyCredential(vc);
```

Also exports `refreshCredential`. Seed-based `initLearnCard` wallets already include this plugin.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
