# Plugins

LearnCard uses a modular plugin system to extend functionality. Plugins are self-contained modules that add specific capabilities through **Control Planes** (standard interfaces like read, store, index) and **Methods** (custom functions via `invoke`).

## Quick Start

Most users don't need to install plugins individually—`@learncard/init` bundles the essential plugins automatically:

```typescript
import { initLearnCard } from '@learncard/init';

// Full wallet with all standard plugins
const learnCard = await initLearnCard({ seed: 'your-seed', network: true });

// Add additional plugins as needed
const enhancedLearnCard = await learnCard.addPlugin(await getMyPlugin());
```

## Official Plugins

### Core Plugins (included in @learncard/init)

| Plugin | Description |
|--------|-------------|
| [Crypto](crypto.md) | Core cryptographic operations |
| [DIDKit](didkit.md) | DID operations using DIDKit WASM |
| [DID Key](did-key.md) | Key management for `did:key` method |
| [VC](vc/README.md) | Verifiable Credential signing & verification |
| [VC-Templates](vc-templates.md) | Pre-built credential templates |
| [LearnCloud](learncloud.md) | Encrypted cloud storage |
| [Expiration](vc/expiration-sub-plugin.md) | Credential expiration handling |

### Network Plugins

| Plugin | Description |
|--------|-------------|
| [LearnCard Network](learncard-network.md) | Profiles, connections, boosts via LearnCloud Network |
| [VC-API](vc-api.md) | VC-API protocol support |

### Extension Plugins (install separately)

| Plugin | Package | Description |
|--------|---------|-------------|
| [Claimable Boosts](claimable-boosts.md) | `@learncard/claimable-boosts-plugin` | Generate claimable credential links |
| [Simple Signing](simple-signing.md) | `@learncard/simple-signing-plugin` | Remote signing authority support |
| [CHAPI](chapi.md) | `@learncard/chapi-plugin` | Credential Handler API integration |
| [Ceramic](ceramic.md) | `@learncard/ceramic-plugin` | Ceramic Network storage |
| [Ethereum](ethereum.md) | `@learncard/ethereum-plugin` | Ethereum blockchain integration |
| [VPQR](vpqr.md) | `@learncard/vpqr-plugin` | QR code generation for presentations |

## Building Your Own Plugin

Want to extend LearnCard? See [Build a Plugin](../../how-to-guides/deploy-infrastructure/the-simplest-plugin.md) for a step-by-step guide.

