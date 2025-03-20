[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# Simple Signing Plugin

A LearnCard plugin that integrates with the Simple Signing Service to enable signature verification for LearnCard Network operations.

## Overview

This plugin provides a connection between LearnCard and a Simple Signing Service implementation. It allows LearnCard Network operations to utilize a signing authority that can verify and sign actions within the network.

Key features:
- Integration with LearnCard Network for credential operations
- Signing Authority for network actions like claim links and Auto Boosts

## Usage

```typescript
import { initLearnCard } from '@learncard/init';
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';

// Initialize LearnCard with network capabilities
const learnCard = await initLearnCard({ seed: 'abc123', network: true });

// Add the Simple Signing Plugin
const saLearnCard = await learnCard.addPlugin(
  await getSimpleSigningPlugin(learnCard, 'https://yourendpoint.com/trpc')
);

// Now your LearnCard instance can use signing operations with the Simple Signing Service
```

## Self-Hosting

This plugin is designed to work with a self-hosted Simple Signing Service. See the `simple-signing-service` package for details on setting up your own service.

## E2E Testing

This plugin is particularly useful for end-to-end testing of LearnCard Network operations that require Signing Authorities, without needing to implement a full production signing authority.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
