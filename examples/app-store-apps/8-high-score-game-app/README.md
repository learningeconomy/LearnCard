# LearnCard High Score Game App

A visually stunning arcade-style game that issues verifiable credentials for high score achievements on the LearnCard App Store.

## Features

- **Space Dodger Game**: Fast-paced arcade action with progressive difficulty
- **Achievement Credentials**: Earn verifiable credentials for reaching score milestones
- **Visual Appeal**: Stunning neon aesthetics with particle effects and smooth animations
- **LearnCard Integration**: Seamless SSO and credential issuance via Partner Connect SDK
- **Template-Based Issuance**: Uses app store boost templates (no backend issuer seed required)

## Architecture

This app uses the **Partner Connect SDK template-based credential issuance** pattern:

1. Game validates achievements on the backend (score/tier verification)
2. Credentials are issued directly from the user's wallet using pre-configured boost templates
3. Template aliases map to boosts configured in the app store listing

### Required Template Aliases

The following boost templates must be configured in the app store listing:

- `space-dodger-bronze` - Bronze Space Pilot (1,000 points)
- `space-dodger-silver` - Silver Space Pilot (5,000 points)
- `space-dodger-gold` - Gold Space Pilot (10,000 points)
- `space-dodger-platinum` - Platinum Space Ace (25,000 points)

**Note:** If your app store listing uses different template aliases (e.g., auto-generated LearnCard aliases), you can configure them via environment variables in `.env`:

```bash
LEARNCARD_TEMPLATE_BRONZE=your-custom-bronze-alias
LEARNCARD_TEMPLATE_SILVER=your-custom-silver-alias
LEARNCARD_TEMPLATE_GOLD=your-custom-gold-alias
LEARNCARD_TEMPLATE_PLATINUM=your-custom-platinum-alias
```

## Tech Stack

- Framework: Astro
- Styling: Tailwind CSS + Custom Canvas animations
- SDK: @learncard/partner-connect
- Backend: Astro Actions (validation only, no credential issuance)

## Running Locally

1. Install dependencies from repo root:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env to set the correct template aliases for your app store listing
   # The default values work if your boosts use the standard aliases
   ```

3. Run the app:
   ```bash
   pnpm dev
   # or
   pnpm --filter @learncard/app-store-demo-high-score-game dev
   ```

4. Open http://localhost:3009 (or the port shown in terminal)

## Game Instructions

- Use **Arrow Keys** or **WASD** to move your ship
- Dodge the incoming asteroids
- Collect power-ups for bonus points
- Reach score milestones to earn credentials:
  - **1,000 points**: Bronze Pilot Badge
  - **5,000 points**: Silver Pilot Badge
  - **10,000 points**: Gold Pilot Badge
  - **25,000 points**: Platinum Space Ace Badge

## Deployment

This app is configured for Netlify deployment.

**Important:** You must configure the template alias environment variables in your deployment platform:

- `LEARNCARD_TEMPLATE_BRONZE`
- `LEARNCARD_TEMPLATE_SILVER`
- `LEARNCARD_TEMPLATE_GOLD`
- `LEARNCARD_TEMPLATE_PLATINUM`

These must match the template aliases configured in your app store listing boosts.

## App Store Setup

To enable credential issuance:

1. Create an app store listing for Space Dodger
2. Create boost templates for each achievement tier
3. Associate the boosts with template aliases (note the aliases that are created)
4. Update the `.env` file with the actual template aliases from your listing:
   - `LEARNCARD_TEMPLATE_BRONZE` - should match your Bronze boost alias
   - `LEARNCARD_TEMPLATE_SILVER` - should match your Silver boost alias
   - `LEARNCARD_TEMPLATE_GOLD` - should match your Gold boost alias
   - `LEARNCARD_TEMPLATE_PLATINUM` - should match your Platinum boost alias
5. Set up a signing authority for the app
6. Publish the app to the app store

**Troubleshooting:** If you see "Boost not found for this app" errors, the template aliases in your `.env` file don't match the aliases configured in the app store listing. Check the actual aliases in the LearnCard platform and update the environment variables accordingly.

## License

MIT - Part of the LearnCard Example Apps collection
