[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/didkit-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/didkit-plugin)](https://www.npmjs.com/package/@learncard/didkit-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/didkit-plugin)](https://www.npmjs.com/package/@learncard/didkit-plugin)

Wraps the [DIDKit](https://github.com/spruceid/didkit) WASM build to sign and verify credentials and presentations and resolve DIDs.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/didkit-plugin
```

## Usage

This package exports `getDidKitPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getDidKitPlugin } from '@learncard/didkit-plugin';

const learnCard = await initLearnCard({ custom: true });

// Optional args: a custom WASM URL/module, and allowRemoteContexts (default false)
const didkitLearnCard = await learnCard.addPlugin(await getDidKitPlugin());
```

On Node, prefer [`@learncard/didkit-plugin-node`](../didkit-plugin-node) (or `initLearnCard({ seed, didkit: 'node' })`). Seed-based `initLearnCard` wallets already include a DIDKit plugin.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
