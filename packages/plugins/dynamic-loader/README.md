[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/dynamic-loader-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/dynamic-loader-plugin)](https://www.npmjs.com/package/@learncard/dynamic-loader-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/dynamic-loader-plugin)](https://www.npmjs.com/package/@learncard/dynamic-loader-plugin)

Resolves JSON-LD contexts at runtime by fetching them, as a fallback for contexts that aren't cached statically.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/dynamic-loader-plugin
```

## Usage

This package exports `DynamicLoaderPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { DynamicLoaderPlugin } from '@learncard/dynamic-loader-plugin';

const learnCard = await initLearnCard({ custom: true });
const dynamicLearnCard = await learnCard.addPlugin(DynamicLoaderPlugin);
```

This package exports a plugin object (`DynamicLoaderPlugin`), not a factory. Seed-based `initLearnCard` wallets already include it.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
