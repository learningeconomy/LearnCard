# Dynamic Boost Templates - LoreCard

## Overview

LoreCard now automatically creates and manages boost templates on the backend, eliminating the need for manual configuration of boost URIs in environment variables.

## Architecture

### Backend (`src/actions/index.ts`)

**Hardcoded Badge Definitions:**
- 8 social-emotional learning badges defined as constants
- Each badge includes: id, name, icon, color, skill, category, description, narrative, image, and subskills

**`getBoostTemplates` Action:**
1. Initializes LearnCard with the issuer's seed
2. Fetches existing boosts from the network
3. For each badge definition:
   - Checks if a boost already exists (by name and icon)
   - If exists: returns existing URI
   - If not: creates new boost with credential template
4. Returns array of boost templates with URIs

**Credential Template Creation:**
- Generates OpenBadgeCredential with BoostCredential type
- Includes achievement details, skills, display settings
- Uses issuer's DID from LearnCard instance

### Frontend (`src/pages/index.astro`)

**Server-Side Rendering:**
- Calls `actions.getBoostTemplates()` during page load
- Passes boost templates to frontend via config

**Dynamic Badge Rendering:**
- Badges are rendered using Astro's `.map()` function
- Each badge card includes:
  - `data-badge-id`: Badge identifier
  - `data-badge-uri`: Boost template URI
  - `style="--badge-color: ..."`: Dynamic color from backend
  
**Client-Side Logic:**
- Event delegation on badge grid for click handling
- Extracts badge name and URI from DOM attributes
- Calls `learnCard.initiateTemplateIssue(uri)` with dynamic URI

## Benefits

### ✅ Zero Configuration
- No need to manually create boosts in LearnCard Network
- No environment variables for individual badge URIs
- Automatic boost creation on first run

### ✅ Self-Healing
- Checks for existing boosts before creating new ones
- Idempotent - safe to run multiple times
- Maintains consistency across deployments

### ✅ Easily Extensible
- Add new badges by updating `BADGE_DEFINITIONS` array
- Frontend automatically renders new badges
- No frontend code changes required

### ✅ Type-Safe
- Full TypeScript support throughout
- Badge data flows from backend to frontend with type safety
- Reduces runtime errors

## Required Environment Variables

Only **one** environment variable is now required:

```bash
# Required: Issuer seed for creating and managing boost templates
LEARNCARD_ISSUER_SEED=your-hex-seed-here

# Optional: LearnCard Host Origin (defaults to https://learncard.app)
LEARNCARD_HOST_ORIGIN=https://learncard.app
```

## Badge Structure

Each badge definition includes:

```typescript
{
  id: string;              // Unique identifier (e.g., 'teamwork')
  name: string;            // Display name (e.g., 'Teamwork Champion')
  icon: string;            // Emoji icon (e.g., '🤝')
  color: string;           // Hex color code (e.g., '#3b82f6')
  skill: string;           // Primary skill (e.g., 'Teamwork')
  skillCategory: string;   // Category: 'social', 'cognitive', 'emotional'
  description: string;     // Short description for UI
  narrative: string;       // Detailed criteria for earning
  image: string;           // Badge image URL
  subskills: string[];     // Array of related subskills
  uri?: string;            // Boost URI (added by backend)
}
```

## First Run Behavior

When the app starts for the first time:

1. **Backend initializes** LearnCard with issuer seed
2. **Queries existing boosts** from LearnCard Network
3. **Creates 8 badge boosts** (if they don't exist)
4. **Returns boost templates** with URIs to frontend
5. **Frontend renders badges** dynamically

**Subsequent runs:**
- Boosts already exist
- Backend returns existing URIs immediately
- Fast page load with no redundant API calls

## Adding New Badges

To add a new badge:

1. **Add to `BADGE_DEFINITIONS`** in `src/actions/index.ts`:
   ```typescript
   {
     id: 'resilience',
     name: 'Resilient Spirit',
     icon: '💪',
     color: '#8b5cf6',
     skill: 'Resilience',
     skillCategory: 'emotional',
     description: 'Bounced back from setbacks and persevered through challenges.',
     narrative: 'Earn this boost by demonstrating resilience...',
     image: 'https://cdn.filestackcontent.com/...',
     subskills: ['perseverance', 'adaptability', 'grit']
   }
   ```

2. **Restart the app** - New badge will be:
   - Created automatically on next page load
   - Rendered in the badge grid
   - Fully functional for awarding

**That's it!** No frontend changes needed.

## Technical Details

### Boost Detection Logic

Existing boosts are matched by:
```typescript
boost.name === badge.name && 
boost.boost?.display?.emoji?.unified === badge.icon
```

This ensures we don't create duplicate boosts across deployments.

### Error Handling

- **Backend**: Continues processing other badges if one fails
- **Frontend**: Shows loading state if no badges available
- **Network errors**: Gracefully degrades with empty badge array

### Performance

- **Page load**: Single action call fetches all boosts
- **Caching**: Boosts persist in LearnCard Network
- **No redundant calls**: Existing boosts reused immediately

## Migration from Environment Variables

**Before:**
```bash
BADGE_TEAMWORK_URI=lc:network:network.learncard.com/trpc:boost:abc123
BADGE_LEADERSHIP_URI=lc:network:network.learncard.com/trpc:boost:def456
# ... 6 more URIs
```

**After:**
```bash
LEARNCARD_ISSUER_SEED=your-seed-here
```

**Result:** 8 environment variables → 1

## Deployment Checklist

- [ ] Set `LEARNCARD_ISSUER_SEED` in deployment environment
- [ ] (Optional) Set `LEARNCARD_HOST_ORIGIN` if not using default
- [ ] Build the app: `pnpm nx build 2-lore-card-app`
- [ ] Deploy to hosting platform
- [ ] First page load will create boosts automatically
- [ ] Verify badges appear in LearnCard Network under your issuer DID

---

**LoreCard** is now fully self-contained and requires minimal configuration! 🎲✨
