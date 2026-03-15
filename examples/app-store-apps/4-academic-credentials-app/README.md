# Academic Credentials Demo App

A demo application showcasing academic credential issuance using LearnCard. This app demonstrates how educational institutions can issue verifiable diplomas, course certificates, student ID cards, and academic transcripts.

## Features

- 🎓 **Diploma Credentials** - Issue official diplomas with degree details, majors, and honors
- 📜 **Course Certificates** - Award certificates for individual course completions
- 🪪 **Student ID Cards** - Create digital student identification cards
- 📊 **Academic Transcripts** - Generate complete academic transcripts with courses and GPA

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
pnpm --filter @learncard/app-store-demo-academic-credentials dev
```

The app will be available at `http://localhost:4321`

### 4. Build for Production

```bash
pnpm --filter @learncard/app-store-demo-academic-credentials build
```

## Authentication

This demo uses LearnCard for authentication. To skip traditional auth during testing:

- Use `demo@learningeconomy.io` as the login email, or
- Use a seed phrase directly for wallet connection

## Credential Types

### Diploma
- Student name and DID
- Degree name and major
- Institution details
- Graduation date
- Honors/distinctions (optional)

### Course Certificate
- Student name and DID
- Course name
- Institution details
- Instructor name (optional)
- Completion date
- Grade/score (optional)

### Student ID Card
- Student name and DID
- Student ID number
- Institution details
- Program/Degree
- Enrollment date
- Expiration date (optional)

### Academic Transcript
- Student name and DID
- Institution and program
- Complete course list with:
  - Course name and code
  - Credits
  - Grade
  - Semester
- Cumulative GPA

## SDK Integration

This app demonstrates several LearnCard SDK patterns:

```typescript
// Initialize Partner Connect SDK
const learnCard = createPartnerConnect();

// Authenticate user
const identity = await learnCard.requestIdentity();

// Issue credentials via server actions
const { data, error } = await actions.issueDiploma({
  recipientDid: "did:example:123...",
  studentName: "Jane Doe",
  // ... other fields
});
```

## Project Structure

```
4-academic-credentials-app/
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
  type: ['VerifiableCredential', 'OpenBadgeCredential', 'DiplomaCredential'],
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
