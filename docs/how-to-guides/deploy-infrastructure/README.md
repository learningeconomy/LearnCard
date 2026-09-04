---
description: For power users — run LearnCard as core infrastructure in your product.
---

# Go Deep: Build on the SDK

These guides are for teams integrating LearnCard deeply — running wallet instances server-side, writing plugins, managing keys, or pointing the SDK at your own network. Most integrations don't need this level: check [What Do You Want to Build?](../../introduction/what-do-you-want-to-build.md) first.

Start with the decision guide, then pick what you need:

- [How Should I Manage Keys?](choose-key-management.md) — one table that routes you to the right pattern
- [Generate API Tokens](generate-api-tokens.md) — scoped Bearer tokens for server-to-server calls (what the Quickstart's `curl` tab uses)
- [Remote Key Management](managing-seed-phrases.md) — keep issuer seeds in a KMS, never in code
- [SSS Key Management Config](sss-key-management-config.md) — self-hosted passwordless key infrastructure for your own end users
- [Build a Plugin](the-simplest-plugin.md) — extend LearnCard with custom functionality
- [Connect to an Independent Network](connect-to-independent-network.md) — point the SDK and REST calls at your own LearnCard network

Want to run the network services themselves? The [Brain Service README](https://github.com/learningeconomy/LearnCard/tree/main/services/learn-card-network/brain-service) and the [`services/learn-card-network` compose file](https://github.com/learningeconomy/LearnCard/tree/main/services/learn-card-network) cover local and serverless deployment; email [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io) if you're planning a production deployment and we'll help.
