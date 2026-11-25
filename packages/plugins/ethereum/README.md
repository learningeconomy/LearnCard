[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/ethereum-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/ethereum-plugin)](https://www.npmjs.com/package/@learncard/ethereum-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/ethereum-plugin)](https://www.npmjs.com/package/@learncard/ethereum-plugin)

Adds Ethereum account support (address, ETH and ERC-20 balances and transfers) using the wallet's secp256k1 key.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/ethereum-plugin
```

## Usage

This package exports `getEthereumPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getEthereumPlugin } from '@learncard/ethereum-plugin';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const ethLearnCard = await learnCard.addPlugin(
    getEthereumPlugin(learnCard, {
        infuraProjectId: '<your Infura project ID>',
        network: 'mainnet',
    })
);
```

Seed-based `initLearnCard` wallets already include it, configured through the `ethereumConfig` option.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
