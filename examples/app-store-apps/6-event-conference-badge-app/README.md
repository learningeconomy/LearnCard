# Event & Conference Badge App

A demo application showcasing event and conference credential issuance using LearnCard. This app demonstrates how event organizers can issue verifiable attendance badges, speaker credentials, workshop certificates, and networking credentials.

## Features

- 🎫 **Event Attendance Badges** - Issue verifiable credentials for event attendance
- 🎤 **Speaker Credentials** - Create speaker badges with bios and session info
- 🛠️ **Workshop Certificates** - Award certificates for workshop participation
- 🤝 **Networking Credentials** - Enable contact exchange and networking
- 📍 **Session Check-in** - Track attendance for specific sessions

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
pnpm --filter @learncard/app-store-demo-event-conference dev
```

The app will be available at `http://localhost:4321`

### 4. Build for Production

```bash
pnpm --filter @learncard/app-store-demo-event-conference build
```

## Authentication

This demo uses LearnCard for authentication. To skip traditional auth during testing:

- Use `demo@learningeconomy.io` as the login email, or
- Use a seed phrase directly for wallet connection

## Credential Types

### Event Attendance
- Attendee name and DID
- Event name and date
- Ticket type/registration level
- Organizer details

### Speaker Credential
- Speaker name and DID
- Bio and expertise areas
- Session/talk details
- Event affiliation

### Workshop Certificate
- Participant name and DID
- Workshop title and description
- Instructor name
- Completion date
- Skills/competencies earned

### Networking Credential
- Contact name and DID
- Professional information
- Exchange context (event, date)
- Mutual consent verification

### Session Check-in
- Attendee name and DID
- Session name and time
- Room/location
- Timestamp verification

## SDK Integration

This app demonstrates several LearnCard SDK patterns:

```typescript
// Initialize Partner Connect SDK
const learnCard = createPartnerConnect();

// Authenticate user
const identity = await learnCard.requestIdentity();

// Issue credentials via server actions
const { data, error } = await actions.issueAttendanceBadge({
  recipientDid: "did:example:123...",
  attendeeName: "Jane Doe",
  eventName: "Tech Conference 2024",
  // ... other fields
});
```

## Project Structure

```
6-event-conference-badge-app/
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
  type: ['VerifiableCredential', 'OpenBadgeCredential', 'EventAttendanceCredential'],
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
