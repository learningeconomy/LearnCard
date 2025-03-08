[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# Simple Signing Client

A client library for interacting with the Simple Signing Service in the LearnCard Network ecosystem.

## Overview

This client provides a convenient way to communicate with a Simple Signing Service instance. It abstracts away the details of the network requests and provides a simple interface for signing operations.

Key features:
- TypeScript-based API client for Simple Signing Service
- Streamlined authentication flow
- Integration with LearnCard Network operations
- Support for Signing Authorities

## Usage

```typescript
import { getClient } from '@learncard/simple-signing-client';

// Initialize the client with your service endpoint
const client = getClient('https://yourendpoint.com/trpc', () => {} // DID-Auth function);

// Authenticate and perform operations
const response = await client.verifySignature({
  // Signature data
});
```

## Related Packages

This client is designed to work with:
- `@learncard/simple-signing-service`: The service implementation
- `@learncard/simple-signing-plugin`: The LearnCard plugin that uses this client

## E2E Testing

This client is particularly useful for end-to-end testing of LearnCard Network operations that require Signing Authorities, without needing to implement a full production signing authority.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
