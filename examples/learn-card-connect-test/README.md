# LearnCard Connect Test Example

This is a test application for the `@learncard/react` LearnCardConnect component. It demonstrates how to use the SDK to authenticate users and fetch their learning context for AI tutor platforms.

## Features

-   Interactive LearnCardConnect button component
-   Automatic test data generation
-   Consent flow contract setup
-   Credential generation and sharing

## Prerequisites

1. LearnCard App running locally on port 3000
2. Brain service running on port 4000
3. LearnCloud service running on port 4100

## Setup

Install dependencies:

```bash
pnpm install
```

## Running

1. First, start the LearnCard App and services:

```bash
# In the monorepo root
cd apps/learn-card-app
pnpm dev
```

This will start:

-   LearnCard App on http://localhost:3000
-   Brain service on http://localhost:4000
-   LearnCloud on http://localhost:4100

2. In a new terminal, start the test app:

```bash
cd examples/learn-card-connect-test
pnpm dev
```

The test app will be available at http://localhost:4321 (or another port if 4321 is in use).

## Usage

### Step 1: Generate Test Data

1. Open the test app in your browser
2. Click the **"Generate Test Data"** button
3. This will:
    - Create two wallets (test user and partner app)
    - Create LCN profiles for both
    - Create a consent flow contract
    - Generate test credentials
    - Consent the test user to the contract

### Step 2: Test LearnCardConnect

1. Click the **"Personalize with LearnCard"** button
2. Sign in with the demo account:
    - Email: `demo@learningeconomy.io`
    - Password: (your local test password, or check console output)
3. The SDK will:
    - Authenticate the user
    - Fetch consented data using the partner's API key
    - Call the AI service to format the context
    - Return a system prompt for your LLM

## How It Works

### Test Data Generation

The test data generator (`src/helpers/testDataGenerator.js`) automates the setup:

1. **Wallet Initialization**: Creates two LearnCard wallets

    - Test account: Uses seed derived from `demo@learningeconomy.io`
    - Partner app: Uses hardcoded seed `abcabc`

2. **Profile Creation**: Creates LCN network profiles for both wallets

3. **Consent Contract**: Partner creates a contract allowing read access to:

    - Personal: name
    - Credentials: Achievement, Course, ID categories

4. **Credential Generation**: Test account creates 3 test credentials:

    - Introduction to Programming (Course)
    - Advanced TypeScript (Achievement)
    - Open Source Contributor (Achievement)

5. **Consent**: Test account consents to the partner's contract

### LearnCardConnect Flow

1. User clicks the button → Opens modal with LearnCard App
2. User authenticates → AuthCoordinator validates session
3. SDK fetches consented data → Uses `getConsentedDataForDid`
4. AI service formats context → Returns structured prompt
5. SDK returns data to callback → `onContextReady(context)`

## Project Structure

```
.
├── astro.config.mjs          # Astro configuration
├── package.json              # Dependencies
├── src/
│   ├── pages/
│   │   └── index.astro       # Main test page with React component
│   └── helpers/
│       └── testDataGenerator.js  # Test data generation logic
└── README.md                 # This file
```

## Troubleshooting

### "Cannot connect to localhost:4000"

Make sure the brain service is running:

```bash
cd services/learn-card-network/brain-service
pnpm dev
```

### "Profile already exists"

This is expected if you've run the generator before. The script will skip creating existing profiles.

### "No consented data found"

Make sure:

1. Test data generation completed successfully
2. The consent contract was created
3. The test user has consented to the contract

Check the browser console for detailed error messages.

## Customization

To modify the test data:

1. Edit `src/helpers/testDataGenerator.js`
2. Change the `testBoosts` array to add different credentials
3. Modify the contract definition to change consent permissions
4. Update the `TEST_ACCOUNT_EMAIL` or `PARTNER_SEED` constants

## Learn More

-   [LearnCard Documentation](https://docs.learncard.com)
-   [LearnCard React SDK](../react-learn-card/README.md)
-   [Consent Flow Documentation](../../docs/core-concepts/consent-and-permissions/consentflow-overview.md)
