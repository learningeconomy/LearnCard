---
description: Pick your path — every integration starts with one of these five jobs.
---

# What Do You Want to Build?

Most LearnCard integrations are one of five jobs. Pick yours — each path starts with the easiest method and lets you go deeper only when you need to.

## 🎖️ Send & issue credentials

Issue badges, certificates, or credentials to your users — by email, phone, or directly to their LearnCard profile.

_In the wild:_ universities issuing diplomas and micro-credentials, bootcamps certifying skills, employers recognizing training — all verifiable anywhere.

- **No code**: issue directly from the [LearnCard app](https://learncard.app)
- **One API call**: [send a credential to an email](../quick-start/your-first-integration.md) (~15 lines)
- **At scale**: [issue at scale with Boosts](../tutorials/create-a-boost.md)
- **Everything else**: [all sending patterns](../how-to-guides/send-credentials.md) — templates, webhooks, guardian consent

## 📱 Publish your app in LearnCard

Put your product inside the LearnCard app store, where users can install and launch it. Your app gets single sign-on, credential issuance, notifications, and learner context via the Partner Connect SDK.

_In the wild:_ AI tutors that read a learner's real history (with consent), games that turn achievements into portable badges, career tools that build a skills profile from the wallet.

- Start here: [Publish Your App in LearnCard](../how-to-guides/publish-your-app.md) — local mock mode to published listing
- Build it: [Build an Embedded App](../how-to-guides/connect-systems/connect-an-embedded-app.md)
- Full API surface: [Partner Connect SDK](../sdks/partner-connect.md)

## 🌐 Add LearnCard to your site

Let users claim credentials from your website or app — from a one-script claim button to a full embedded experience.

_In the wild:_ an LMS that awards completions into the learner's wallet; a conference site with a one-click "claim your attendance badge."

- **One script tag**: [embed a claim button](../how-to-guides/connect-systems/embed-a-claim-button.md)
- **Connected accounts**: [connect your website or game](../how-to-guides/connect-systems/connect-a-website.md) — users link once, you issue automatically
- **All options**: [Add LearnCard to Your Product](../how-to-guides/connect-systems/README.md)

## 🤝 Manage consent & guardianship

Request user consent to read or write data, with built-in guardian approval flows for minors.

_In the wild:_ a K-12 platform where parents approve what a school app can see; a scouting organization issuing to minors with guardian sign-off.

- Start here: [Create a ConsentFlow](../tutorials/create-a-consentflow.md)
- Concepts: [ConsentFlow overview](../core-concepts/consent-and-permissions/consentflow-overview.md)

## 🔬 Go deep: build on the SDK

For products where LearnCard is core infrastructure: run your own wallet instances, write plugins, manage keys, or deploy your own network.

_In the wild:_ a state agency running its own credential network; a wallet vendor adding a LearnCard plugin so its users can receive LearnCard-issued credentials.

- Start here: [How should I manage keys?](../how-to-guides/deploy-infrastructure/choose-key-management.md)
- [Build a plugin](../how-to-guides/deploy-infrastructure/the-simplest-plugin.md)
- [Connect to an independent network](../how-to-guides/deploy-infrastructure/connect-to-independent-network.md)
- Full API: [LearnCard Wallet SDK](../sdks/learncard-core/README.md)

---

Still not sure? [Open an issue](https://github.com/learningeconomy/LearnCard/issues/new/choose) or email [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io).
