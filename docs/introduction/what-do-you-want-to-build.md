---
description: Pick your path — every integration starts with one of these six jobs.
---

# What Do You Want to Build?

Most LearnCard integrations fit one of six paths. Each starts with the lowest-effort method.

## 🎖️ Send & issue credentials

Issue badges, certificates, or credentials by email, phone, or LearnCard profile.

Examples include universities issuing diplomas, bootcamps certifying skills, and employers recognizing training.

- **No code**: issue directly from the [LearnCard app](https://learncard.app)
- **One API call**: [send a credential to an email](../quick-start/your-first-integration.md) (~15 lines)
- **At scale**: [issue at scale with Boosts](../tutorials/create-a-boost.md)
- **Templates, webhooks, and guardian consent**: [all sending patterns](../how-to-guides/send-credentials.md)
- **OID4VCI, VC-API, or signed JSON**: [bring existing credentials into LearnCard](../how-to-guides/interoperate-with-learncard.md)

## 📱 Publish your app in LearnCard

Put your product inside the LearnCard app store, where users can install and launch it. Your app gets single sign-on, credential issuance, notifications, and learner context via the Partner Connect SDK.

Examples include AI tutors using consented learner history, games issuing portable badges, and career tools building skills profiles.

- Start here: [Publish Your App in LearnCard](../how-to-guides/publish-your-app.md) — local mock mode to published listing
- Build it: [Build an Embedded App](../how-to-guides/connect-systems/connect-an-embedded-app.md)
- Full API surface: [Partner Connect SDK](../sdks/partner-connect.md)

## 🌐 Add LearnCard to your site

Let users claim credentials from your website or app — from a one-script claim button to a full embedded experience.

Examples include an LMS awarding course completions and a conference site offering an attendance badge.

- **One script tag**: [embed a claim button](../how-to-guides/connect-systems/embed-a-claim-button.md)
- **Connected accounts**: [connect your website or game](../how-to-guides/connect-systems/connect-a-website.md) — users link once, you issue automatically
- **All options**: [Add LearnCard to Your Product](../how-to-guides/connect-systems/README.md)

## 🤝 Manage consent & guardianship

Request user consent to read or write data, with built-in guardian approval flows for minors.

Examples include parent-approved school apps and scouting organizations issuing to minors with guardian consent.

- Start here: [Create a ConsentFlow](../tutorials/create-a-consentflow.md)
- Concepts: [ConsentFlow overview](../core-concepts/consent-and-permissions/consentflow-overview.md)

## 🔬 Keys, tokens & infrastructure

A server integration uses either a seed (you sign; the SDK authenticates with your DID) or an API token (LearnCard signs via a hosted signing authority; create the token once in the Developer Portal or with `addAuthGrant`). Verification-only code needs neither.

- Start here: [How should I manage keys?](../how-to-guides/deploy-infrastructure/choose-key-management.md)
- [Build a plugin](../how-to-guides/deploy-infrastructure/the-simplest-plugin.md)
- [Generate API tokens](../how-to-guides/deploy-infrastructure/generate-api-tokens.md) · [Test safely on staging](../how-to-guides/deploy-infrastructure/test-safely.md)
- [Run your own network](../how-to-guides/deploy-infrastructure/connect-to-independent-network.md)
- Ready to ship? [Go to Production](../how-to-guides/go-to-production.md) checklist
- Full API: [LearnCard Wallet SDK](../sdks/learncard-core/README.md)

## ✅ Verify credentials

Check badges, degrees, and certificates presented to your hiring or verification service.

- Start here: [Verify Credentials](../tutorials/verify-credentials.md) — sign locally, then test valid, tampered, expired, and revoked outcomes
- Decide which issuers to accept with [Trust Registries](../core-concepts/identities-and-keys/trust-registries.md); a valid signature alone is not issuer trust.

---

For help choosing a path, [open an issue](https://github.com/learningeconomy/LearnCard/issues/new/choose) or email [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io).
