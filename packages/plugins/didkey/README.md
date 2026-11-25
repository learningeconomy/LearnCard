[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/didkey-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/didkey-plugin)](https://www.npmjs.com/package/@learncard/didkey-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/didkey-plugin)](https://www.npmjs.com/package/@learncard/didkey-plugin)

Derives `did:key` (and other DIDKit-supported) DIDs and keypairs from a seed, and implements the LearnCard ID plane.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/didkey-plugin
```

## Usage

This package exports `getDidKeyPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';

const learnCard = await initLearnCard({ custom: true });
const didkitLearnCard = await learnCard.addPlugin(await getDidKitPlugin());

// key: hex string (up to 64 chars); defaultDidMethod: e.g. 'key'
const didkeyLearnCard = await didkitLearnCard.addPlugin(
    await getDidKeyPlugin(didkitLearnCard, 'a'.repeat(64), 'key')
);

console.log(didkeyLearnCard.id.did());
```

Requires the DIDKit plugin's key-generation methods on the LearnCard you pass in. Seed-based `initLearnCard` wallets already include it.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
