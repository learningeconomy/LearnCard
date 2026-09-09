---
description: Pick your path — every integration starts with one of these five jobs.
---

# What Do You Want to Build?

Most LearnCard integrations fit one of five paths. Each starts with the lowest-effort method.

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

## 🔬 Go deep: build on the SDK

For products where LearnCard is core infrastructure: run your own wallet instances, write plugins, manage keys, or deploy your own network.

Examples include a state agency running a credential network and a wallet vendor adding a LearnCard plugin.

- Start here: [How should I manage keys?](../how-to-guides/deploy-infrastructure/choose-key-management.md)
- [Build a plugin](../how-to-guides/deploy-infrastructure/the-simplest-plugin.md)
- [Connect to an independent network](../how-to-guides/deploy-infrastructure/connect-to-independent-network.md)
- Full API: [LearnCard Wallet SDK](../sdks/learncard-core/README.md)

---

For help choosing a path, [open an issue](https://github.com/learningeconomy/LearnCard/issues/new/choose) or email [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io).
