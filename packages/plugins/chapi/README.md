[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/chapi-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/chapi-plugin)](https://www.npmjs.com/package/@learncard/chapi-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/chapi-plugin)](https://www.npmjs.com/package/@learncard/chapi-plugin)

Adds [CHAPI](https://chapi.io) (Credential Handler API) support so a browser LearnCard can install itself as a credential handler and receive or share credentials with other sites.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/chapi-plugin
```

## Usage

This package exports `getCHAPIPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getCHAPIPlugin } from '@learncard/chapi-plugin';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const chapiLearnCard = await learnCard.addPlugin(await getCHAPIPlugin());
```

Browser only: `getCHAPIPlugin` returns a stub plugin when `window` is undefined. Seed-based `initLearnCard` wallets already include this plugin.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
