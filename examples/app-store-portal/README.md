# LearnCard App Store Portal

A mock-up of the LearnCard App Store submission and management interface, designed to validate the App Store API and bootstrap initial content.

## Features

### Partner Submission Mode
- Multi-step form for app submissions
- App details (name, tagline, description, icon)
- Launch type selection (Embedded Iframe, Second Screen, Direct Link, Consent Flow, Server Headless)
- Conditional launch configuration based on selected type
- Review and submit for approval

### Admin Approval Mode  
- Review queue for pending submissions
- Filter by status (Pending, Listed, Draft, Archived)
- Search functionality
- Detailed view with launch configuration inspection
- Security warnings for sensitive configurations
- Approve/Reject actions
- Promotion level management for listed apps

## Tech Stack

- **Framework**: [Astro](https://astro.build/) with React
- **Styling**: TailwindCSS with Apple-inspired design tokens
- **Icons**: Lucide React
- **State**: React useState (mock data, no backend)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin dashboard components
│   │   ├── AdminDashboard.tsx
│   │   ├── ListingCard.tsx
│   │   └── ListingDetail.tsx
│   ├── partner/         # Partner submission components
│   │   ├── AppDetailsStep.tsx
│   │   ├── LaunchTypeStep.tsx
│   │   ├── LaunchConfigStep.tsx
│   │   ├── ReviewStep.tsx
│   │   └── SubmissionForm.tsx
│   ├── ui/              # Shared UI components
│   │   ├── Header.tsx
│   │   ├── StepIndicator.tsx
│   │   └── StatusBadge.tsx
│   └── App.tsx          # Main application component
├── data/
│   └── mock-listings.ts # Sample app listings data
├── layouts/
│   └── Layout.astro
├── pages/
│   └── index.astro
├── styles/
│   └── global.css
└── types/
    └── app-store.ts     # TypeScript types
```

## API Integration

This portal is designed to test the LearnCard App Store API. The mock data in `src/data/mock-listings.ts` mirrors the actual API schema:

```typescript
interface AppStoreListing {
    listing_id: string;
    display_name: string;
    tagline: string;
    full_description: string;
    icon_url: string;
    app_listing_status: 'DRAFT' | 'PENDING_REVIEW' | 'LISTED' | 'ARCHIVED';
    launch_type: 'EMBEDDED_IFRAME' | 'SECOND_SCREEN' | 'DIRECT_LINK' | 'CONSENT_REDIRECT' | 'SERVER_HEADLESS';
    launch_config_json: string;
    category?: string;
    promo_video_url?: string;
    promotion_level?: 'FEATURED_CAROUSEL' | 'CURATED_LIST' | 'STANDARD' | 'DEMOTED';
    privacy_policy_url?: string;
    terms_url?: string;
}
```

To connect to the real API, replace the mock data imports with actual API calls using the LearnCard Network plugin:

```typescript
import { learnCard } from '@learncard/init';

// Create listing
const listingId = await learnCard.invoke.createAppStoreListing(integrationId, {
    display_name: 'My App',
    tagline: 'A great app',
    // ...
});

// Admin operations
const isAdmin = await learnCard.invoke.isAppStoreAdmin();
await learnCard.invoke.adminUpdateListingStatus(listingId, 'LISTED');
```

## Design Philosophy

This interface is inspired by Apple's App Store Connect, focusing on:

- **Clarity**: Clean typography and generous whitespace
- **Guidance**: Step-by-step flow with progress indicators
- **Security**: Prominent display of security-critical configurations
- **Efficiency**: Quick actions for common admin tasks
