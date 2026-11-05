[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/network-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/network-plugin)](https://www.npmjs.com/package/@learncard/network-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/network-plugin)](https://www.npmjs.com/package/@learncard/network-plugin)

Connects a LearnCard to LearnCard Network (profiles, connections, boosts, consent flows) and adds Boost verification against a trusted registry.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/network-plugin
```

## Usage

This package exports `getLearnCardNetworkPlugin` and `getVerifyBoostPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getLearnCardNetworkPlugin, getVerifyBoostPlugin } from '@learncard/network-plugin';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });

// Verify Boost credentials against a trusted registry (URL optional)
const verifyLearnCard = await learnCard.addPlugin(await getVerifyBoostPlugin(learnCard));

// Talk to LearnCard Network
const networkLearnCard = await verifyLearnCard.addPlugin(
    await getLearnCardNetworkPlugin(verifyLearnCard, 'https://network.learncard.com/trpc')
);

const profile = await networkLearnCard.invoke.getProfile();
```

Most apps don't wire this by hand: `initLearnCard({ seed, network: true })` (or `{ apiKey, network: true }`) adds both plugins and points at `https://network.learncard.com/trpc`. `getLearnCardNetworkPlugin` also takes an options object (e.g. `actAs`) or an API token as its third argument.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
