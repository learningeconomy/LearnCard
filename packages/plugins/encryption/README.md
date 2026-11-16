[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/encryption-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/encryption-plugin)](https://www.npmjs.com/package/@learncard/encryption-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/encryption-plugin)](https://www.npmjs.com/package/@learncard/encryption-plugin)

Exposes basic encryption methods (JWE create/decrypt, DAG-JWE) backed by the wallet's DID keys.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/encryption-plugin
```

## Usage

This package exports `getEncryptionPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getEncryptionPlugin } from '@learncard/encryption-plugin';

// Needs a LearnCard with an ID plane (e.g. DIDKit + DID key plugins)
const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const encryptionLearnCard = await learnCard.addPlugin(await getEncryptionPlugin(learnCard));
```

Seed-based `initLearnCard` wallets already include it.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
