# Boosting & claiming badges

A learner picks a badge in **Boost a Friend**, personalizes its title, adds it to their own Passport, reopens it after a reload, and sends another badge to a peer, who claims it from Alerts and sees the same issuer. Each resulting credential is independently resolved from its owner's real LearnCloud index and cryptographically verified; a displayed issuer alone is not proof.

## Sub-features

- `wallet-self-issue`: Boost a Friend → **Vibe Curator** → title → **Just me** → **Boost Myself** → "Added to your Passport!" → the badge is listed in `/socialBadges`.
- `wallet-detail-persistence`: after a reload, Passport → **Badges** → open the badge; the detail card shows the title and a resolved issuer. The learner's independent SDK resolves exactly one persisted indexed credential with that unique title, requires the learner's DID as issuer and sole subject, and verifies its signature.
- `wallet-peer-claim`: send a badge by searching the peer's handle; the peer claims and accepts it from Alerts, skips the connect prompt, and sees it with the same issuer. The peer's independent SDK resolves exactly one indexed credential with the peer badge's title, requires the issuing learner's DID and the peer's subject DID, and verifies its signature.

## How to get to it (user POV)

- **Issue Credentials** in the sidebar (or `/boost-a-friend`) → **Pick a Badge**.
- Passport (`/wallet` or `/passport`) → **Badges**.
- Bell icon → `/notifications` → **Claim**.

## Driving it with lc verify

Preconditions:

- Doctor ok. `peerbadges.com` is reachable (the default tenant badge pack is fetched from it).

- **Run.** `$LCV run credentials --dir /tmp/lcv` → `credentials: passed`. Observations include both titles, both displayed issuer strings, and `selfCredential` / `peerCredential` containing each persisted index ID, URI, issuer DID, subject DID, and verification result.
- **Pick and personalize.** `getByPlaceholder('Search badges...')` → `Vibe Curator`; `getByPlaceholder('e.g. Trailblazer')` → title; **Next**; heading `Send to`.
- **Self.** **Just me** → **Boost Myself** → heading `Added to your Passport!` → **Done** → `/socialBadges` lists the title.
- **Detail.** `/wallet` → reload → **Badges** → click the title. In `dialog`, `group` named with the title, a level-1 heading containing the title, and `.issued-by` not "loading/unknown".
- **Peer.** `getByPlaceholder('Search people...')` → handle, then the result button containing `@handle` → **Send Badge** → `Badge sent!`. The recipient's page: `/notifications` → **Claim** → group with the title → **Accept** → `Connect with …?` → **Skip for Now** → the stored badge shows the same issuer.
- **Same-artifact proof.** After each reloaded detail is visible, use the owner's independent SDK to read `index.LearnCloud.get()` and resolve the stored URIs with `read.get`. Exactly one resolved credential must have the UI title; its issuer and single subject must match the expected actor DIDs. Run `verifyCredential` on that very credential and require `errors: []` and `checks` containing `proof`. `self-stored-credential-proof` and `peer-stored-credential-proof` JSON artifacts preserve the index/URI and proof results. This corroboration is read-only: SDK issuance or acceptance cannot substitute for the UI action.

## Gotchas

- The card heading reads `<category> <title>` (for example `Social Badge Verify self 1a2b`), so match with a substring at level 1.
- If `peerbadges.com` is unreachable, the picker shows "No badges found". That's an external prerequisite failure, not a pass.
- The recipient must have a network profile to appear in people search. `signInAs` creates one.
- `useIonModal` phantom modals can block `getByRole`. See `apps/learn-card-app/AGENTS.md` for workarounds.
