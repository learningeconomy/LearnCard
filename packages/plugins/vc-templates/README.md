[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/vc-templates-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/vc-templates-plugin)](https://www.npmjs.com/package/@learncard/vc-templates-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/vc-templates-plugin)](https://www.npmjs.com/package/@learncard/vc-templates-plugin)

Adds `newCredential` / `newPresentation` templates for building unsigned credentials and presentations.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/vc-templates-plugin
```

## Usage

This package exports `getVCTemplatesPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const templateLearnCard = await learnCard.addPlugin(getVCTemplatesPlugin());

const unsigned = templateLearnCard.invoke.newCredential({ type: 'boost' });
```

Seed-based `initLearnCard` wallets already include it.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
