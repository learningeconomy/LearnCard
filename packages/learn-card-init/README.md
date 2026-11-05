[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/init

[![npm version](https://img.shields.io/npm/v/@learncard/init)](https://www.npmjs.com/package/@learncard/init)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/init)](https://www.npmjs.com/package/@learncard/init)

The main entry point for the LearnCard SDK. `initLearnCard` builds a LearnCard wallet with the right set of `@learncard/*` plugins for the config you pass in, so you don't have to wire plugins by hand.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init
```

## Usage

```ts
import { initLearnCard } from '@learncard/init';

// Full wallet from a 32-byte hex seed (shorter strings are left-padded with 0s)
const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });

const unsigned = learnCard.invoke.getTestVc();
const vc = await learnCard.invoke.issueCredential(unsigned);
const result = await learnCard.invoke.verifyCredential(vc);
```

Other configs `initLearnCard` accepts:

| Config                            | What you get                                                         |
| --------------------------------- | -------------------------------------------------------------------- |
| `{}`                              | Read/verify-only wallet, no keys                                     |
| `{ seed }`                        | Full wallet (DIDKit, did:key, VC, templates, LearnCloud, CHAPI, ...) |
| `{ seed, network: true }`         | Full wallet plus LearnCard Network (`@learncard/network-plugin`)     |
| `{ seed, network: true, didWeb }` | Network wallet acting as a `did:web`                                 |
| `{ apiKey, network: true }`       | Network wallet authenticated with an API key, no local seed          |
| `{ vcApi: true \| url }`          | Wallet that signs through a remote VC-API                            |
| `{ custom: true }`                | Empty wallet; add your own plugins with `addPlugin`                  |

On Node, pass `didkit: 'node'` to use `@learncard/didkit-plugin-node` instead of the WASM build.

Adding a plugin to any wallet:

```ts
import { initLearnCard } from '@learncard/init';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';

const learnCard = await initLearnCard({ custom: true });
const withTemplates = await learnCard.addPlugin(getVCTemplatesPlugin());
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
