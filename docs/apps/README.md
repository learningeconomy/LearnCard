---
description: The apps built on LearnCard, who they're for, and how they relate to the platform.
---

# LearnCard Apps

Everything in these docs — the SDKs, the network, the storage layer — exists so that people can hold and use their own credentials. These are the apps where that happens.

| App                                           | Who it's for                                                                                                                                                                                                                  | Get it                                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**LearnCard App**](learn-card-app/README.md) | Anyone who receives credentials: learners, workers, volunteers. Also the app your users land in when you [send a credential](../how-to-guides/send-credentials.md) or [publish an app](../how-to-guides/publish-your-app.md). | [iOS](https://apps.apple.com/us/app/learncard/id1635841898) · [Android](https://play.google.com/store/apps/details?id=com.learncard.app) · [Web](https://app.learncard.com) |
| [**ScoutPass**](scouts/README.md)             | Scouting organizations: national bodies, troop leaders, and scouts. A purpose-built app for issuing and holding badges and membership IDs.                                                                                    | [iOS](https://apps.apple.com/us/app/scoutpass/id6451271002) · [Android](https://play.google.com/store/apps/details?id=com.scoutpass.app) · [Web](https://pass.scout.org/)   |

## How they relate

Both apps are wallets on the same network. A credential issued in one is a standard [Verifiable Credential](../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) that verifies anywhere, and a person can hold credentials from many sources in one place.

- **LearnCard App** is the general-purpose wallet. Any organization can issue into it with no app-store presence of their own — see [Send & Issue Credentials](../how-to-guides/send-credentials.md). Organizations that want their own experience inside the wallet build an [embedded app](../how-to-guides/publish-your-app.md).
- **ScoutPass** shows what a dedicated app on the platform looks like: the same wallet capabilities, plus an organizational hierarchy (national organization → troop → scout) modeled with [Boosts](../core-concepts/credentials-and-data/boost-credentials.md). If you're designing a multi-level organization on LearnCard, its page is a worked example.

## If you're a developer

You don't need to build an app to use LearnCard. Most integrations issue credentials into the LearnCard App or add a small embedded experience to it:

- [What Do You Want to Build?](../introduction/what-do-you-want-to-build.md) — pick a path
- [Quickstart: Send a Credential](../quick-start/your-first-integration.md) — a credential in someone's wallet in ~15 lines
- [Publish Your App in LearnCard](../how-to-guides/publish-your-app.md) — ship inside the wallet
