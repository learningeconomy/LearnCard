[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/learn-card-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/learn-card-plugin)](https://www.npmjs.com/package/@learncard/learn-card-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/learn-card-plugin)](https://www.npmjs.com/package/@learncard/learn-card-plugin)

Adds opinionated LearnCard logic on top of the VC plugin, including prettified, human-readable credential verification results.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/learn-card-plugin
```

## Usage

This package exports `getLearnCardPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const lcLearnCard = await learnCard.addPlugin(getLearnCardPlugin(learnCard));
```

Seed-based `initLearnCard` wallets already include it.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
