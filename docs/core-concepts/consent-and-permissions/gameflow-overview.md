---
description: ConsentFlow for products used by children — a guardian approves the connection before anything is shared.
---

# GameFlow

GameFlow is [ConsentFlow](consentflow-overview.md) with one flag set: `needsGuardianConsent: true`. It exists because a ten-year-old can't meaningfully consent to data sharing. With GameFlow, a parent or guardian reviews and approves the connection between your product and the child's LearnCard before you can read or write anything.

There is no separate API. You build a normal consent integration; LearnCard handles the guardian step.

## What changes when the flag is set

- A child's account (one managed by a guardian) cannot consent on its own. The network rejects the attempt with `Child accounts require guardian approval to consent to contracts`.
- The LearnCard app routes the child to "get an adult". The guardian signs in — or creates an account — reviews your contract in plain language, and approves or declines on the child's behalf.
- After approval, everything works as normal ConsentFlow: you receive the redirect with the child's DID, `verifyConsent` returns `true`, and you can issue credentials into the child's account. The guardian can withdraw at any time from their own LearnCard.

Adults hitting the same contract are unaffected; they consent directly.

## Two ways in

**From your game.** The child taps "Connect to LearnCard" and is sent to `https://learncard.app/consent-flow?uri=<contractUri>&returnTo=<yourUrl>`. LearnCard asks for a grown-up, the guardian picks or creates the child's profile and approves, and the child lands back in your game connected. Good for onboarding inside the game.

**From the LearnCard app.** A family finds your game in the LearnCard app store and taps Connect there. Same approval, then LearnCard opens your game with the connection already live. Good for discovery.

## What you get

- Credentials you issue land in a real, portable account the child keeps as they grow.
- You never store a child's identity yourself; you hold a DID and a consent record that the guardian controls.
- The guardian, not you, is the source of truth for permission — which is what COPPA and similar rules want.

## Build it

The [Connect a User's LearnCard to Your Platform](../../tutorials/create-a-consentflow.md) tutorial is the whole integration; add `needsGuardianConsent: true` to the `createContract` call. A working example is the [Gashapon Game Corner](https://github.com/learningeconomy/LearnCard/tree/main/examples/app-store-apps/4-gashapon-game-corner).
