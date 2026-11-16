[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/vc-api-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/vc-api-plugin)](https://www.npmjs.com/package/@learncard/vc-api-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/vc-api-plugin)](https://www.npmjs.com/package/@learncard/vc-api-plugin)

Implements LearnCard's VC methods against a remote [VC-API](https://w3c-ccg.github.io/vc-api/) server instead of signing locally.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/vc-api-plugin
```

## Usage

This package exports `getVCAPIPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getVCAPIPlugin } from '@learncard/vc-api-plugin';

const learnCard = await initLearnCard({ custom: true });
const apiLearnCard = await learnCard.addPlugin(
    await getVCAPIPlugin({ url: '<VC-API base URL>', did: '<optional issuer DID>' })
);
```

`initLearnCard({ vcApi: true | '<url>' })` builds a wallet with this plugin for you.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
