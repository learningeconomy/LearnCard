# ⚔️ LoreCard - Social-Emotional Learning Badges for Tabletop RPG

A themed partner application showcasing the `@learncard/partner-connect` SDK for issuing meaningful credentials to tabletop roleplaying game players.

## Overview

**LoreCard** is a simple yet powerful tool that allows tabletop roleplaying game masters to award verifiable credentials (badges) to their players for demonstrating social-emotional learning skills during gameplay.

By helping to track personal growth within tabletop games, LoreCard serves as a tool for game companies and communities to promote collaborative, intergenerational play.

## Features

- 🎲 **8 Pre-configured Badges** - Award meaningful credentials for key social-emotional skills
- 🎨 **Themed RPG UI** - Beautiful parchment-style interface with fantasy typography
- ⚡ **One-Click Awards** - Simple click-to-award interface powered by the Partner Connect SDK
- 🔒 **Verifiable Credentials** - Players receive permanent, portable credentials in their LearnCard wallet
- 👥 **Bulk Issuance** - Award badges to multiple players at once

## Badge Types

### Social-Emotional Learning Skills

| Badge | Icon | Skill | When to Award |
|-------|------|-------|---------------|
| **Teamwork Champion** | 🤝 | Teamwork | Player demonstrated exceptional collaboration and supported party members |
| **Natural Leader** | 👑 | Leadership | Player took initiative, made difficult decisions, and guided the party |
| **Creative Thinker** | 🎨 | Creativity | Player found innovative solutions and brought imaginative ideas |
| **Puzzle Master** | 🧩 | Problem Solving | Player analyzed complex situations and developed effective strategies |
| **Empathetic Soul** | 💝 | Empathy | Player showed understanding and compassion for others' perspectives |
| **Eloquent Speaker** | 💬 | Communication | Player communicated clearly and facilitated productive discussions |
| **Brave Heart** | 🛡️ | Courage | Player faced fears, took risks, and stood up for what's right |
| **Wise Sage** | 📜 | Wisdom | Player applied knowledge thoughtfully and shared insights |

## Technology Stack

- **Framework**: Astro 5
- **SDK**: `@learncard/partner-connect` (workspace)
- **Deployment**: Netlify (SSR)
- **Styling**: Custom CSS with fantasy/medieval theme
- **Fonts**: Cinzel (headings), Lora (body)

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# LearnCard Host (required)
LEARNCARD_HOST_ORIGIN=https://learncard.app

# Badge Template URIs (required)
# Replace these with your actual boost/template IDs from LearnCard Network
BADGE_TEAMWORK_URI=lc:network:network.learncard.com/trpc:boost:your-teamwork-boost-id
BADGE_LEADERSHIP_URI=lc:network:network.learncard.com/trpc:boost:your-leadership-boost-id
BADGE_CREATIVITY_URI=lc:network:network.learncard.com/trpc:boost:your-creativity-boost-id
BADGE_PROBLEM_SOLVING_URI=lc:network:network.learncard.com/trpc:boost:your-problem-solving-boost-id
BADGE_EMPATHY_URI=lc:network:network.learncard.com/trpc:boost:your-empathy-boost-id
BADGE_COMMUNICATION_URI=lc:network:network.learncard.com/trpc:boost:your-communication-boost-id
BADGE_COURAGE_URI=lc:network:network.learncard.com/trpc:boost:your-courage-boost-id
BADGE_WISDOM_URI=lc:network:network.learncard.com/trpc:boost:your-wisdom-boost-id
```

### 3. Run Development Server

```bash
# From the monorepo root
pnpm --filter @learncard/app-store-demo-lore-card dev

# Or from this directory
pnpm dev
```

The app will be available at `http://localhost:4321` (or similar).

### 4. Build for Production

```bash
# From the monorepo root
pnpm nx build 2-lore-card-app

# Or from this directory
pnpm build
```

## Usage

### For Game Masters

1. **Open the app** - Navigate to your LoreCard deployment URL
2. **Authenticate** - The app will request your LearnCard identity (SSO)
3. **Select a badge** - Click on any badge card to award it
4. **Add recipients** (optional) - Enter player DIDs or leave empty to select in LearnCard
5. **Confirm issuance** - Complete the flow in the LearnCard modal
6. **Done!** - Players receive the badge in their LearnCard wallet

### For Players

Players receive badges as verifiable credentials that:
- ✅ Are permanently stored in their LearnCard wallet
- ✅ Can be shared with others to demonstrate skills
- ✅ Are cryptographically verifiable and tamper-proof
- ✅ Belong to them forever, regardless of platform

## SDK Integration

This app demonstrates the `initiateTemplateIssue()` method from `@learncard/partner-connect`:

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize SDK
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});

// Award a badge
async function awardBadge(templateId, recipients) {
  try {
    const response = await learnCard.initiateTemplateIssue(
      templateId,
      recipients  // Array of DIDs (optional)
    );
    
    if (response.issued) {
      console.log('Badge awarded successfully!');
    }
  } catch (error) {
    console.error('Award failed:', error.message);
  }
}
```

### Error Handling

The app handles common errors gracefully:

- **`UNAUTHORIZED`** - User is not an admin of the badge template
- **`TEMPLATE_NOT_FOUND`** - Badge template URI is invalid or doesn't exist
- **`LC_UNAUTHENTICATED`** - User needs to log in to LearnCard
- **User cancellation** - User closed the modal without completing issuance

## Creating Badge Templates

To use LoreCard with your own badges:

1. **Log in to LearnCard Network** at [network.learncard.com](https://network.learncard.com)
2. **Create a Boost** for each badge type:
   - Go to Boosts → Create New Boost
   - Design your badge (name, description, image)
   - Set yourself as an admin
3. **Get the Boost URI** - Copy the `lc:network:...` URI from the boost page
4. **Update `.env`** - Add the URIs to your environment configuration
5. **Deploy** - Redeploy your LoreCard instance with new configuration

## Customization

### Add New Badges

1. **Add environment variable** in `.env.example` and `.env`:
   ```bash
   BADGE_YOUR_SKILL_URI=lc:network:network.learncard.com/trpc:boost:your-id
   ```

2. **Update config** in `src/pages/index.astro`:
   ```javascript
   const config = {
     badges: {
       yourSkill: import.meta.env.BADGE_YOUR_SKILL_URI || 'default-uri',
       // ... other badges
     }
   };
   ```

3. **Add badge card** in the HTML:
   ```html
   <div class="badge-card your-skill" data-badge="yourSkill">
     <div class="badge-icon">🌟</div>
     <div class="badge-name">Your Badge Name</div>
     <div class="badge-description">Description of when to award this badge.</div>
     <div class="badge-skill">Social-Emotional Skill: Your Skill</div>
   </div>
   ```

4. **Add color** in the CSS:
   ```css
   .badge-card.your-skill { --badge-color: #yourcolor; }
   ```

5. **Update badge names** in the script:
   ```javascript
   const badgeNames = {
     yourSkill: 'Your Badge Name',
     // ... other badges
   };
   ```

### Theming

The app uses CSS custom properties for easy theming:

```css
:root {
  --parchment: #f4e8d0;       /* Main background */
  --ink: #2c1810;              /* Text color */
  --gold: #d4af37;             /* Accent color */
  --deep-red: #8b1a1a;         /* Headings */
  /* ... more variables */
}
```

## Deployment

### Netlify

The app includes a `netlify.toml` configuration:

```toml
[build]
command = "pnpm exec nx build 2-lore-card-app"
publish = "dist/"
```

**Environment Variables** - Set these in your Netlify dashboard:
- `LEARNCARD_HOST_ORIGIN`
- `BADGE_TEAMWORK_URI`
- `BADGE_LEADERSHIP_URI`
- (... all other badge URIs)

### Other Platforms

The app uses Astro's SSR mode with the Netlify adapter. To deploy to other platforms:

1. Change the adapter in `astro.config.mjs`
2. Update deployment configuration
3. Set environment variables in your platform's dashboard

## Use Cases

### Educational Settings

- **After-school programs** - Reward students for demonstrating SEL skills
- **Summer camps** - Track personal growth throughout camp sessions
- **Library programs** - Award badges for D&D leagues and game clubs

### Community Play

- **Gaming cafes** - Recognize regular players' social development
- **Convention games** - Award memorable credentials from special sessions
- **Online campaigns** - Digital badges for remote play groups

### Professional Development

- **Team building** - Document collaboration skills in corporate RPG sessions
- **Training programs** - Gamified credential system for soft skills training
- **Educational research** - Track SEL outcomes in game-based learning studies

## Benefits

### For Game Masters
- **Quick & Easy** - Award badges with a single click
- **Meaningful Recognition** - Give players permanent, verifiable credentials
- **Track Growth** - Help players see their development over time

### For Players
- **Portable Credentials** - Take your achievements anywhere
- **Skill Demonstration** - Show evidence of soft skills to educators, employers
- **Motivation** - Clear recognition of personal growth

### For Organizations
- **Promote SEL** - Encourage social-emotional learning through play
- **Community Building** - Create shared achievement systems
- **Data & Insights** - Track skill development across player populations

## Architecture

```
src/pages/index.astro
├── Server-side (Astro frontmatter)
│   └── Load environment variables into config
│
└── Client-side (HTML + JavaScript)
    ├── UI Components
    │   ├── Status indicator
    │   └── Badge grid (8 cards)
    │
    └── SDK Integration
        ├── Initialize Partner Connect SDK
        ├── Authenticate game master
        └── Award badges via initiateTemplateIssue()
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires `postMessage` API and `Promise` support.

## License

MIT

## Contributing

This is an example application demonstrating the `@learncard/partner-connect` SDK. 

For issues or contributions to the SDK itself, see the [main LearnCard repository](https://github.com/learningeconomy/LearnCard).

## Support

- **Documentation**: See the Partner Connect SDK README
- **Issues**: [GitHub Issues](https://github.com/learningeconomy/LearnCard/issues)
- **Community**: Join the LearnCard Discord

---

**LoreCard** - Empowering personal growth through collaborative play 🎲✨
