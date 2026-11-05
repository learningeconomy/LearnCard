[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/vpqr-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/vpqr-plugin)](https://www.npmjs.com/package/@learncard/vpqr-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/vpqr-plugin)](https://www.npmjs.com/package/@learncard/vpqr-plugin)

Reads and creates QR codes that carry Verifiable Presentations (VPQR).

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/vpqr-plugin
```

## Usage

This package exports `getVpqrPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getVpqrPlugin } from '@learncard/vpqr-plugin';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const vpqrLearnCard = await learnCard.addPlugin(getVpqrPlugin(learnCard));
```

Seed-based `initLearnCard` wallets already include it.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
