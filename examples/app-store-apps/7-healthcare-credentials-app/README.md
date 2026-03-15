# Healthcare Credentials Demo App

A demo application showcasing healthcare credential issuance using LearnCard. This app demonstrates how healthcare organizations can issue verifiable medical licenses, training certifications, provider credentials, and patient education certificates.

## Features

- 🏥 **Medical License Verification** - Issue and verify professional medical licenses
- 🎓 **Medical Training Certifications** - Award certifications for completed training programs
- 👨‍⚕️ **Healthcare Provider Credentials** - Create provider identification and credentials
- 📚 **Patient Education Certificates** - Issue completion certificates for patient education programs

## Technology Stack

- **Framework**: Astro 4.x (static site generation)
- **SDK**: `@learncard/partner-connect` (frontend)
- **Backend**: `@learncard/init` (server-side credential operations)
- **Styling**: CSS with Inter font family
- **Deployment**: Netlify-ready configuration

## Setup

### 1. Environment Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
LEARNCARD_ISSUER_SEED=your_hex_seed_here
```

### 2. Install Dependencies

From the repository root:

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm --filter @learncard/app-store-demo-healthcare-credentials dev
```

The app will be available at `http://localhost:4321`

### 4. Build for Production

```bash
pnpm --filter @learncard/app-store-demo-healthcare-credentials build
```

## Authentication

This demo uses LearnCard for authentication. To skip traditional auth during testing:

- Use `demo@learningeconomy.io` as the login email, or
- Use a seed phrase directly for wallet connection

## Credential Types

### Medical License
- Provider name and DID
- License type and number
- Issuing medical board
- Issue and expiration dates
- Specialties and restrictions

### Medical Training Certification
- Provider name and DID
- Training program name
- Certification type
- Completion date
- Expiration date (if applicable)
- Training institution

### Healthcare Provider Credential
- Provider name and DID
- Provider ID/employee number
- Healthcare facility
- Department and role
- Issue date
- Verification status

### Patient Education Certificate
- Patient name and DID
- Education program name
- Completion date
- Topics covered
- Healthcare provider/facility
- Validity period

## SDK Integration

This app demonstrates several LearnCard SDK patterns:

```typescript
// Initialize Partner Connect SDK
const learnCard = createPartnerConnect();

// Authenticate user
const identity = await learnCard.requestIdentity();

// Issue credentials via server actions
const { data, error } = await actions.issueMedicalLicense({
  recipientDid: "did:example:123...",
  providerName: "Dr. Jane Smith",
  licenseType: "Medical Doctor",
  // ... other fields
});
```

## Project Structure

```
7-healthcare-credentials-app/
├── src/
│   ├── actions/
│   │   └── index.ts          # Server-side credential operations
│   ├── pages/
│   │   └── index.astro       # Main application page
│   └── env.d.ts              # Environment types
├── .env.example              # Environment template
├── astro.config.mjs          # Astro configuration
├── netlify.toml              # Netlify deployment config
├── package.json              # Dependencies
├── project.json              # NX configuration
└── README.md                 # This file
```

## LearnCard Integration Patterns

### Server-Side Credential Issuance

```typescript
const learnCard = await initLearnCard({ seed: issuerSeed, network: true });

const credential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    // ... other contexts
  ],
  type: ['VerifiableCredential', 'OpenBadgeCredential', 'MedicalLicenseCredential'],
  // ... credential fields
};

const signed = await learnCard.invoke.issueCredential(credential);
const sent = await learnCard.invoke.sendCredential(recipientDid, signed);
```

## Development Notes

- All credential data is validated using Zod schemas
- Issuer profile is automatically created if it doesn't exist
- Credentials are cryptographically signed and sent to recipients
- Error handling includes user-friendly messages

## License

MIT - See LearnCard repository for full license details
