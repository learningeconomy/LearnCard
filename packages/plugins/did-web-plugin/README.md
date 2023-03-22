[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/did-web-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/core)](https://www.npmjs.com/package/@learncard/core)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/core)](https://www.npmjs.com/package/@learncard/core)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/core)](https://www.npmjs.com/package/@learncard/core)

The LearnCard DID Web Plugin is a plugin for adding did-web support to a LearnCard agent for signing VCs.

## Documentation
All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
pnpm i @learncard/core @learncard/did-web-plugin
```

## Usage

```ts
import { initLearnCard } from '@learncard/core';
import { getDidWebPlugin } from '@learncard/did-web-plugin';

const emptyLearnCard = await initLearnCard();
const customLearnCard = await emptyLearnCard.addPlugin(getDidWebPlugin());
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:


## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
