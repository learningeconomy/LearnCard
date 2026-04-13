# AI Tutor Context Demo

A demonstration app showcasing the `requestLearnerContext()` method from the `@learncard/partner-connect` SDK.

## Overview

This app demonstrates how to retrieve learner context (credentials and history) for AI personalization.

## Prerequisites

1. LearnCard account
2. App installed from LearnCard App Store
3. ConsentFlow contract accepted

## Running the Demo

```bash
# From monorepo root
pnpm exec nx dev 4-request-learner-context-app

# Or from app directory
pnpm dev
```

The app will be available at `http://localhost:4321`.

## Usage

1. Click "Connect with LearnCard" to authenticate
2. Toggle data options (credentials, personal data) on/off
3. Choose format (LLM Prompt or Structured Data)
4. Set detail level (Compact or Expanded)
5. Click "Get Learner Context"
6. View the formatted results

## SDK Integration

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect();

const context = await learnCard.requestLearnerContext({
    includeCredentials: true, // Toggle credentials on/off
    includePersonalData: true, // Toggle personal data on/off (name, bio, etc.)
    format: 'prompt',
    detailLevel: 'expanded',
});

const systemPrompt = `You are a tutor. ${context.prompt}`;
```

## Technology Stack

-   **Framework**: Astro 5
-   **SDK**: `@learncard/partner-connect` (workspace)
-   **Styling**: Tailwind CSS via CDN

## Deployment

Build for production:

```bash
pnpm build
```

Deploy the `dist/` directory to any static hosting provider.

## Setup Guide

### Step 1: Create App Listing

1. Log in to LearnCard Network
2. Go to App Store → Create Listing
3. Fill in app details and submit for review

### Step 2: Create ConsentFlow Contract

1. Go to ConsentFlow → Create Contract
2. Define data access requirements (credentials, history)
3. Save the contract

### Step 3: Install and Test

1. Once approved, install the app from LearnCard App Store
2. Accept the consent contract
3. Run this demo and test the integration

## Error Handling

| Error                | Cause              | Solution                             |
| -------------------- | ------------------ | ------------------------------------ |
| `LC_UNAUTHENTICATED` | User not logged in | Prompt user to log into LearnCard    |
| `USER_REJECTED`      | Declined consent   | Explain why consent is needed        |
| `UNAUTHORIZED`       | App not installed  | Guide user to install from App Store |

## License

MIT
