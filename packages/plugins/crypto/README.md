[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/crypto-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/crypto-plugin)](https://www.npmjs.com/package/@learncard/crypto-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/crypto-plugin)](https://www.npmjs.com/package/@learncard/crypto-plugin)

Exposes a standardized, isomorphic `crypto` object (WebCrypto in browsers, Node's `crypto` on the server) to other plugins.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/crypto-plugin
```

## Usage

This package exports `CryptoPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { CryptoPlugin } from '@learncard/crypto-plugin';

const learnCard = await initLearnCard({ custom: true });
const cryptoLearnCard = await learnCard.addPlugin(CryptoPlugin);

const crypto = cryptoLearnCard.invoke.crypto();
```

This package exports a plugin object (`CryptoPlugin`), not a factory. Seed-based `initLearnCard` wallets already include it.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
