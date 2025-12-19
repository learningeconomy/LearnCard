# LearnCard App Store Examples - AI Assistant Guide

## Overview

This directory contains example applications demonstrating the `@learncard/partner-connect` SDK in real-world scenarios. These apps serve as reference implementations for partners building applications that integrate with the LearnCard ecosystem.

## Example Applications

### 1. Basic Launchpad App (`1-basic-launchpad-app/`)
**Purpose**: Comprehensive SDK demonstration and testing
**Features**: All 7 SDK methods with real-world examples

**Architecture**:
- **Frontend**: Astro static site with vanilla JavaScript
- **Backend**: Astro actions using `@learncard/init`
- **SDK Integration**: Full Partner Connect SDK usage

**Key Patterns**:
- SSO authentication with `requestIdentity()`
- Credential issuance via `sendCredential()` 
- Feature launching with `launchFeature()`
- Credential querying with `askCredentialSearch()`

### 2. LoreCard App (`2-lore-card-app/`)
**Purpose**: Advanced boost template and badge management system
**Features**: Dynamic badge creation, template management, admin assignment

**Architecture**:
- **Badge System**: Predefined badge definitions with metadata
- **Template Creation**: Automatic boost template generation
- **Admin Management**: Bulk admin assignment with success tracking
- **UI**: Interactive badge selection and issuance

**Key Patterns**:
- Boost template lifecycle management
- Profile and contract creation
- Dynamic credential template generation
- Batch operations with proper error handling

### 3. Mozilla Social Badges (`3-mozilla-social-badges-app/`)
**Purpose**: Production-ready organizational badge system
**Features**: Mozilla-themed badges, professional UI, organization branding

**Architecture**:
- **Branding**: Mozilla color scheme and design language
- **Badge Definitions**: Mozilla community badges (Firefox Champion, Privacy Guardian, etc.)
- **Professional UI**: Custom CSS styling and responsive design
- **Production Patterns**: Environment configuration, error handling

## Development Guidelines

### Creating New Example Apps

When building new example apps:

1. **Follow Directory Structure**:
```
examples/app-store-apps/N-your-app-name/
├── src/
│   ├── actions/index.ts      # Server-side actions
│   ├── pages/index.astro     # Main page
│   └── env.d.ts              # Environment types
├── .env.example              # Environment template
├── README.md                 # Setup instructions
├── package.json              # Dependencies
├── project.json              # NX configuration
├── astro.config.mjs          # Astro config
└── netlify.toml              # Deployment config
```

2. **Use Consistent Technology Stack**:
   - **Framework**: Astro for simple static hosting
   - **SDK**: `@learncard/partner-connect` for frontend
   - **Backend**: `@learncard/init` for credential operations
   - **Styling**: Tailwind CSS for rapid development
   - **Deployment**: Netlify-compatible configuration

3. **Environment Configuration**:
```typescript
// Required environment variables
const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;
const hostOrigin = import.meta.env.LEARNCARD_HOST_ORIGIN || 'http://localhost:3000';
const contractUri = import.meta.env.CONTRACT_URI;
const boostUri = import.meta.env.BOOST_URI;
```

4. **Error Handling Pattern**:
```typescript
try {
  const result = await learnCard.someMethod();
  updateUI({ success: true, data: result });
} catch (error) {
  if (error.code === 'LC_UNAUTHENTICATED') {
    showAuthPrompt();
  } else {
    showError(error.message);
  }
}
```

### Code Patterns and Best Practices

#### Partner Connect SDK Integration
```typescript
// Initialize SDK with proper configuration
const learnCard = createPartnerConnect({
  hostOrigin: hostOrigin,  // From environment or query param
  requestTimeout: 30000,
  allowNativeAppOrigins: true
});

// Always handle authentication first
const identity = await learnCard.requestIdentity();
console.log('Authenticated user:', identity.user.did);
```

#### Server-Side Credential Operations
```typescript
export const server = {
  issueCredential: defineAction({
    input: z.object({ recipientDid: z.string() }),
    handler: async (input) => {
      const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
      
      // Create credential with proper subject assignment
      const credential = learnCard.invoke.newCredential({ type: 'achievement' });
      credential.credentialSubject = {
        ...credential.credentialSubject,  // Preserve existing properties
        id: input.recipientDid
      };
      
      const signed = await learnCard.invoke.issueCredential(credential);
      return signed;
    }
  })
};
```

#### UI State Management
```typescript
// Use simple state management for demo apps
let currentUser = null;
let isAuthenticated = false;

function updateAuthStatus(user) {
  currentUser = user;
  isAuthenticated = !!user;
  
  // Update UI elements
  document.getElementById('auth-status').textContent = 
    isAuthenticated ? `Signed in as ${user.did}` : 'Not authenticated';
  
  // Show/hide controls
  const controls = document.getElementById('controls');
  controls.style.display = isAuthenticated ? 'block' : 'none';
}
```

### Common Implementation Patterns

#### 1. Badge/Template Definition Systems
For apps that create dynamic content:
```typescript
const BADGE_DEFINITIONS = [
  {
    id: 'teamwork',
    name: 'Teamwork Champion',
    icon: '🤝',
    color: '#3b82f6',
    description: 'Exceptional collaboration skills',
    narrative: 'Earn by demonstrating teamwork...',
    image: 'https://example.com/teamwork-badge.png'
  }
  // ... more badges
];
```

#### 2. Profile and Contract Management
For apps that need LearnCard Network integration:
```typescript
const ensureIssuerProfileExists = async (learnCard) => {
  const profile = await learnCard.invoke.getProfile();
  if (!profile) {
    await learnCard.invoke.createProfile({
      profileId: 'my-app-issuer',
      displayName: 'My App',
      description: 'Badge issuer for My App'
    });
  }
};
```

#### 3. Boost Template Creation
For dynamic template generation:
```typescript
const createBoostTemplate = async (learnCard, badgeDefinition) => {
  const template = await learnCard.invoke.createBoost({
    name: badgeDefinition.name,
    description: badgeDefinition.description,
    image: badgeDefinition.image,
    criteria_narrative: badgeDefinition.narrative,
    // ... other template properties
  });
  return template;
};
```

### Deployment Considerations

#### Environment Variables
```bash
# Required for all apps
LEARNCARD_ISSUER_SEED=your-hex-seed-here

# Optional host override (for staging)
LEARNCARD_HOST_ORIGIN=https://staging.learncard.app

# Optional contract/boost URIs for demos
CONTRACT_URI=lc:network:network.learncard.com/trpc:contract:...
BOOST_URI=lc:network:network.learncard.com/trpc:boost:...
```

#### Netlify Configuration
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### NX Integration
```json
{
  "name": "your-app-name",
  "targets": {
    "build": {
      "executor": "nx:run-script",
      "options": { "script": "build" }
    },
    "dev": {
      "executor": "nx:run-script", 
      "options": { "script": "dev" }
    }
  }
}
```

### Testing Example Apps

#### Local Development
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your values

# 2. Install dependencies (from repo root)
pnpm install

# 3. Run the app
pnpm --filter @learncard/app-store-demo-your-app dev
```

#### Testing SDK Integration
1. **Authentication Flow**: Test `requestIdentity()` with different user states
2. **Credential Operations**: Verify `sendCredential()` with various credential types
3. **Feature Navigation**: Test `launchFeature()` with different paths
4. **Error Handling**: Test timeout scenarios and invalid requests
5. **Security**: Verify origin validation works correctly

#### Cross-Browser Testing
Test example apps in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Android Chrome)

### Security Guidelines

#### Frontend Security
- Never include private keys in browser code
- Always validate user input before server actions
- Use HTTPS in production deployments
- Validate all environment variables

#### Backend Security
- Store issuer seeds securely (environment variables only)
- Validate all input parameters with Zod schemas
- Use proper error handling without exposing sensitive data
- Implement rate limiting for production deployments

### Troubleshooting Guide

#### Common Issues

1. **SDK Authentication Failures**
   - Check that LearnCard host is loaded
   - Verify origin configuration matches host
   - Ensure user is logged into LearnCard

2. **Credential Issuance Errors**
   - Verify `LEARNCARD_ISSUER_SEED` is set correctly
   - Check that seed has network permissions
   - Ensure recipient DID is valid

3. **Build/Deployment Issues**
   - Check that all dependencies are installed
   - Verify environment variables are set in deployment
   - Test Astro build process locally

4. **Network/API Errors**
   - Check LearnCard Network connectivity
   - Verify profile exists before creating content
   - Test with staging environment first