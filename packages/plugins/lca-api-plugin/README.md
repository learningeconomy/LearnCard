[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/lca-api-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/lca-api-plugin)](https://www.npmjs.com/package/@learncard/lca-api-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/lca-api-plugin)](https://www.npmjs.com/package/@learncard/lca-api-plugin)

Connects a LearnCard to the LearnCard App (LCA) API.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/lca-api-plugin
```

## Usage

This package exports `getLCAPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';

// getLCAPlugin calls getProfile on construction, so the wallet needs LearnCard Network
const learnCard = await initLearnCard({ seed: 'a'.repeat(64), network: true });
const lcaLearnCard = await learnCard.addPlugin(await getLCAPlugin(learnCard, '<LCA API URL>'));
```

Optional args after the URL: `useCustomHash` (default `false`) and `extraHeaders`.

Or let the package build the whole thing for you (network wallet + LCA plugin, defaulting to `https://api.learncard.app/trpc`):

```ts
import { initLCALearnCard } from '@learncard/lca-api-plugin';

const lcaLearnCard = await initLCALearnCard({ seed: 'a'.repeat(64) });
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
