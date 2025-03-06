[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# Simple Signing Service

A self-hostable service implementation for providing signature verification within the LearnCard Network ecosystem.

## Overview

This service acts as a Signing Authority for LearnCard Network operations. It provides endpoints for verifying signatures and validating actions within the network.

Key features:
- Self-hostable TypeScript-based service
- tRPC API for simple, type-safe client-server interaction
- Straightforward configuration for different deployment environments
- Designed for integration with LearnCard Network

## Setup & Deployment

### Local Development

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### Production Deployment

```bash
# Deploy using serverless framework
pnpm serverless-deploy
```

### Environment Configuration

Create a `.env` file with the following variables:

```
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
AUTHORIZED_DIDS=did:web:network.learncard.com did:web:localhost%3A4000
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=test
```

## Integration

This service is designed to be used with:
- `@learncard/simple-signing-client`: Client library for communicating with this service
- `@learncard/simple-signing-plugin`: LearnCard plugin that connects to this service

## E2E Testing

This service is particularly useful for end-to-end testing of LearnCard Network operations that require Signing Authorities, without needing to implement a full production signing authority.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
