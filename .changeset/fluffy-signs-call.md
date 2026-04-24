---
'@learncard/learn-cloud-service': patch
'@learncard/network-brain-service': patch
'@learncard/lca-api-service': patch
'@learncard/react': patch
'learn-card-base': patch
'learn-card-app': patch
---

Implement LearnCard Plug and Play, an embeddable learner-context flow that lets partner applications request consented LearnCard data through a reusable `LearnCardConnect` React component.

This adds a new `/embed/context` route in LearnCard App that authenticates inside an iframe/modal, loads consent-flow data with an Auth Grant API key, resolves the user's consented credentials, lets the learner review and adjust the selected credentials using the existing Share Credentials card UI, and posts either formatted learner context or a graceful error back to the host application. The embed flow now hides normal app chrome, handles missing/invalid requests, supports compact/expanded context options, can optionally return raw credentials, guards against sharing zero credentials, and returns `NO_CREDENTIALS_SELECTED` when the learner declines to share data.

This also exports `LearnCardConnect` from `@learncard/react`, including modal/popup support, host-origin validation, request timeouts, theming hooks, sandboxed iframe rendering, and CSS-module bundling. The modal was visually tuned so the embedded chooser uses sane desktop sizing, avoids iframe baseline overflow, and gives the credential carousel enough room to render clearly.

The shared credential-selection UI was updated so `ShareCredentialCards` can be driven by an injected controller. That allows the embed page to own selection state, preselect consented credentials, merge in wallet credentials, and avoid contradictory parent/child selection state. Credential query keys now include an initial-credential signature so cached credential lists update correctly when preselected credentials change.

A new `@learncard/connect-test-example` Astro app demonstrates the full plug-and-play flow. It can generate demo test data, create the partner consent contract, issue and accept demo credentials for `demo@learningeconomy.io`, index those credentials into LearnCloud using the same record shape as the app wallet, sync credentials to the consent contract, create an Auth Grant API token, persist the token locally, and exercise the `LearnCardConnect` modal end-to-end.
