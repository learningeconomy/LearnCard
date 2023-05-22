---
'@learncard/init': major
'@learncard/ceramic-plugin': major
'@learncard/chapi-plugin': major
'@learncard/crypto-plugin': major
'@learncard/didkey-plugin': major
'@learncard/didkit-plugin': major
'@learncard/ethereum-plugin': major
'@learncard/expiration-plugin': major
'@learncard/idx-plugin': major
'@learncard/learn-card-plugin': major
'@learncard/vc-plugin': major
'@learncard/vc-api-plugin': major
'@learncard/vc-templates-plugin': major
'@learncard/vpqr-plugin': major
'@learncard/react': minor
'@learncard/core': major
'@learncard/cli': minor
'@learncard/learn-cloud-service': patch
'@learncard/network-brain-service': patch
'@learncard/create-http-bridge': patch
'learn-card-discord-bot': patch
'@learncard/chapi-example': patch
'@learncard/did-web-plugin': patch
'@learncard/network-plugin': patch
---

BREAKING CHANGE: Split @learncard/core into multiple plugin packages and @learncard/init.

_Breaking Changes_

- `initLearnCard` is no longer exported by `@learncard/core`, as it is now the responsibility of `@learncard/init`

```ts
// Old
const { initLearnCard } from '@learncard/core';

// New
const { initLearnCard } from '@learncard/init';
```

- The didkit wasm binary is no longer exported by `@learncard/core` as it is now the responsibility of `@learncard/didkit-plugin`

```ts
// Old
import didkit from '@learncard/core/dist/didkit/didkit_wasm_bg.wasm';

// New
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm';
```

- `@learncard/network-plugin` and `@learncard/did-web-plugin` no longer export their own version of `initLearnCard`, and are instead now proper instantiation targets from `@learncard/init`

```ts
// Old
import { initNetworkLearnCard } from '@learncard/network-plugin';
import { initDidWebLearnCard } from '@learncard/did-web-plugin';

const networkLearnCard = await initNetworkLearnCard({ seed: 'a'.repeat(64) });
const didWebLearnCard = await initDidWebLearnCard({ seed: 'a'.repeat(64), didWeb: 'did:web:test' });

// New
import { initLearnCard } from '@learncard/init';

const networkLearnCard = await initLearnCard({ seed: 'a'.repeat(64), network: true });
const didWebLearnCard = await initLearnCard({ seed: 'a'.repeat(64), didWeb: 'did:web:test' });
```
