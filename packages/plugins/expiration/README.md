[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/expiration-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/expiration-plugin)](https://www.npmjs.com/package/@learncard/expiration-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/expiration-plugin)](https://www.npmjs.com/package/@learncard/expiration-plugin)

Extends `verifyCredential` so credentials past their `expirationDate` (or before `validFrom`) fail verification.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/expiration-plugin
```

## Usage

This package exports `expirationPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { expirationPlugin } from '@learncard/expiration-plugin';

// Needs a LearnCard that can already verify credentials (e.g. the VC plugin)
const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const expirationLearnCard = await learnCard.addPlugin(expirationPlugin(learnCard));
```

Seed-based `initLearnCard` wallets already include it.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
