# Professional Skills Certification Demo App

A demo application showcasing professional workplace credentials and skill certification using LearnCard. This app demonstrates how organizations can issue verifiable professional certifications, skill assessment badges, continuing education credits, and professional development records.

## Features

- 🏆 **Professional Certifications** - Issue official workplace certifications with levels, expiration dates, and credential IDs
- 🎯 **Skill Assessment Badges** - Award digital badges for demonstrated skill proficiency with proficiency levels
- 📚 **Continuing Education Credits** - Track CE credits with accreditation bodies, credit types, and subject areas
- 📈 **Professional Development** - Record development activities, track competencies, and set next steps

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
pnpm --filter @learncard/app-store-demo-professional-skills dev
```

The app will be available at `http://localhost:4321`

### 4. Build for Production

```bash
pnpm --filter @learncard/app-store-demo-professional-skills build
```

## Authentication

This demo uses LearnCard for authentication. To skip traditional auth during testing:

- Use `demo@learningeconomy.io` as the login email, or
- Use a seed phrase directly for wallet connection

## Credential Types

### Professional Certification
- Professional name and DID
- Certification name and level
- Issuing organization
- Issue and expiration dates
- Credential ID for verification

### Skill Badge
- Professional name and DID
- Skill name and category
- Assessment organization
- Proficiency level (Beginner, Intermediate, Advanced, Expert)
- Assessment score
- Assessment date

### Continuing Education Credit
- Professional name and DID
- Course title and provider
- Credit hours earned
- Credit type (CEU, CME, CNE, etc.)
- Subject area
- Accreditation body
- Completion date

### Professional Development
- Professional name and DID
- Development title and type (Training, Workshop, Conference, etc.)
- Organization
- Hours completed
- Key competencies developed
- Recommended next steps
- Completion date

## SDK Integration

This app demonstrates several LearnCard SDK patterns:

```typescript
// Initialize Partner Connect SDK
const learnCard = createPartnerConnect();

// Authenticate user
const identity = await learnCard.requestIdentity();

// Issue credentials via server actions
const { data, error } = await actions.issueProfessionalCertification({
  recipientDid: "did:example:123...",
  professionalName: "Jane Smith",
  // ... other fields
});
```

## Project Structure

```
5-professional-skills-app/
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
  type: ['VerifiableCredential', 'OpenBadgeCredential', 'ProfessionalCertificationCredential'],
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
