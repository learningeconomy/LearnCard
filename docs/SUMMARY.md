# Table of contents

## 🚀 Introduction

* [What is LearnCard?](README.md)
* [Use Cases & Possibilities](introduction/use-cases-and-possibilities.md)
* [Ecosystem Architecture](introduction/ecosystem-architecture.md)
* [Interoperability](introduction/interoperability.md)

## ⚡ Quick Start

* [Setup & Prerequisites](quick-start/setup-and-prerequisites.md)
* [Your First Integration](quick-start/your-first-integration.md)

## ✅ How-To Guides

* [Send Credentials](how-to-guides/send-credentials.md)
* [Create Signing Authority](how-to-guides/create-signing-authority.md)
* [Interoperate with LearnCard](how-to-guides/interoperate-with-learncard.md)
* [Verify My Issuer](how-to-guides/verify-my-issuer.md)
* [Connect Systems](how-to-guides/connect-systems/README.md)
  * [Connect a Website](how-to-guides/connect-systems/connect-a-website.md)
  * [Connect a Game](how-to-guides/connect-systems/connect-a-game.md)
  * [Connect an LMS](how-to-guides/connect-systems/connect-an-lms.md)
  * [Connect a Bot](how-to-guides/connect-systems/connect-a-bot.md)
  * [Connect AI Tutor](how-to-guides/connect-systems/connect-ai-tutor.md)
  * [Connect AI Agent](how-to-guides/connect-systems/connect-ai-agent.md)
  * [Access Wallet Data](how-to-guides/connect-systems/access-wallet-data.md)
  * [Embed a Wallet](how-to-guides/connect-systems/embed-a-wallet.md)
* [Implement Flows](how-to-guides/implement-flows/README.md)
  * [Claim Data after Guardian Consent](how-to-guides/implement-flows/claim-data-after-guardian-consent.md)
  * [Login with LearnCard](how-to-guides/implement-flows/login-with-learncard.md)
  * [Connect via CHAPI](how-to-guides/implement-flows/chapi/README.md)
    * [⭐ CHAPI Wallet Setup Guide](how-to-guides/implement-flows/chapi/chapi-wallet-setup-guide.md)
    * [↔️ Translating to CHAPI documentation](how-to-guides/implement-flows/chapi/translating-to-chapi-documentation.md)
    * [🖥️ Demo Application](how-to-guides/implement-flows/chapi/demo-application.md)
    * [🔰 Using LearnCard to Interact with a CHAPI Wallet](how-to-guides/implement-flows/chapi/using-learncard-to-interact-with-a-chapi-wallet.md)
    * [📝 Cheat Sheets](how-to-guides/implement-flows/chapi/cheat-sheets/README.md)
      * [Issuers](how-to-guides/implement-flows/chapi/cheat-sheets/issuers.md)
      * [Wallets](how-to-guides/implement-flows/chapi/cheat-sheets/wallets.md)
* [Deploy Infrastructure](how-to-guides/deploy-infrastructure/README.md)
  * [Remote Key Management](how-to-guides/deploy-infrastructure/managing-seed-phrases.md)
  * [Generate API Tokens](how-to-guides/deploy-infrastructure/generate-api-tokens.md)
  * [Signing Authority](how-to-guides/deploy-infrastructure/signing-authority.md)
  * [Deploy Your Own Network](how-to-guides/deploy-infrastructure/deploy-your-own-network.md)
  * [Connect to Independent Network](how-to-guides/deploy-infrastructure/connect-to-independent-network.md)
  * [Build a Plugin](how-to-guides/deploy-infrastructure/the-simplest-plugin.md)

## 📚 Tutorials

* [Create a Credential](tutorials/create-a-credential.md)
* [Create a Boost](tutorials/create-a-boost.md)
* [Create a ConsentFlow](tutorials/create-a-consentflow.md)
* [Create a Connected Website](tutorials/create-a-connected-website.md)
* [Send xAPI Statements](tutorials/sending-xapi-statements.md)
* [Listen to Webhooks](tutorials/listen-to-webhooks.md)
* [Verify Credentials](tutorials/verify-credentials.md)

## 🛠️ SDKs & API Reference <a href="#sdks" id="sdks"></a>

* [LearnCard Wallet SDK](sdks/learncard-core/README.md)
  * [Authentication](sdks/learncard-core/authentication.md)
  * [Usage Examples](sdks/learncard-core/construction.md)
  * [Architecture](sdks/learncard-core/architecture.md)
  * [SDK Reference](https://api.docs.learncard.com/docs/core/modules)
  * [Plugin API Reference](sdks/learncard-core/writing-plugins.md)
  * [Integration Strategies](sdks/learncard-core/architectural-patterns.md)
  * [Deployment](sdks/learncard-core/production-deployment-guide.md)
  * [Troubleshooting](sdks/learncard-core/troubleshooting-guide.md)
  * [Changelog](sdks/learncard-core/migration-guide.md)
* [LearnCloud Network API](sdks/learncard-network/README.md)
  * [Authentication](sdks/learncard-network/authentication.md)
  * [Usage Examples](sdks/learncard-network/usage-examples.md)
  * [Architecture](sdks/learncard-network/architecture.md)
  * [Notifications & Webhooks](sdks/learncard-network/notifications.md)
  * ```yaml
    type: builtin:openapi
    props:
      models: true
    dependencies:
      spec:
        ref:
          kind: openapi
          spec: learn-card-network-api
    ```
  * [OpenAPI](https://network.learncard.com/docs#/)
* [LearnCloud Storage API](sdks/learncloud-storage-api/README.md)
  * [Authentication](sdks/learncloud-storage-api/authentication.md)
  * [Usage Examples](sdks/learncloud-storage-api/usage-examples.md)
  * [Architecture](sdks/learncloud-storage-api/architecture.md)
  * ```yaml
    type: builtin:openapi
    props:
      models: true
    dependencies:
      spec:
        ref:
          kind: openapi
          spec: learn-cloud-storage-openapi
    ```
  * [xAPI Reference](sdks/learncloud-storage-api/xapi-reference.md)
* [LearnCloud AI API](sdks/learncloud-ai-api/README.md)
  * [Authentication](sdks/learncloud-ai-api/authentication.md)
  * [Core Concepts](sdks/learncloud-ai-api/core-concepts.md)
  * [Usage Examples](sdks/learncloud-ai-api/usage-examples.md)
  * [API Reference](sdks/learncloud-ai-api/api-reference.md)
* [LearnCard App API](sdks/learncard-app-api.md)
* [Plugins](sdks/official-plugins/README.md)
  * [Crypto](sdks/official-plugins/crypto.md)
  * [DIDKit](sdks/official-plugins/didkit.md)
  * [DID Key](sdks/official-plugins/did-key.md)
  * [Dynamic Loader](sdks/official-plugins/dynamic-loader.md)
  * [VC](sdks/official-plugins/vc/README.md)
    * [Expiration Sub-Plugin](sdks/official-plugins/vc/expiration-sub-plugin.md)
  * [VC-Templates](sdks/official-plugins/vc-templates.md)
  * [VC-API](sdks/official-plugins/vc-api.md)
  * [Ceramic](sdks/official-plugins/ceramic.md)
  * [IDX](sdks/official-plugins/idx.md)
  * [VPQR](sdks/official-plugins/vpqr.md)
  * [Ethereum](sdks/official-plugins/ethereum.md)
  * [CHAPI](sdks/official-plugins/chapi.md)
  * [LearnCard Network](sdks/official-plugins/learncard-network.md)
  * [LearnCloud](sdks/official-plugins/learncloud.md)
  * [LearnCard](sdks/official-plugins/learncard.md)
  * [Simple Signing](sdks/official-plugins/simple-signing.md)
  * [Claimable Boosts](sdks/official-plugins/claimable-boosts.md)
* [LearnCard CLI](sdks/learncard-cli.md)

## 🧠 Core Concepts

* [Identities & Keys](core-concepts/identities-and-keys/README.md)
  * [Decentralized Identifiers (DIDs)](core-concepts/identities-and-keys/decentralized-identifiers-dids.md)
  * [Seed Phrases](core-concepts/identities-and-keys/seed-phrases.md)
  * [Network Profiles](core-concepts/identities-and-keys/network-profiles.md)
  * [Signing Authorities](core-concepts/identities-and-keys/signing-authorities.md)
  * [Trust Registries](core-concepts/identities-and-keys/trust-registries.md)
* [Credentials & Data](core-concepts/credentials-and-data/README.md)
  * [Verifiable Credentials (VCs)](core-concepts/credentials-and-data/verifiable-credentials-vcs.md)
  * [Credential Lifecycle](core-concepts/credentials-and-data/credential-lifecycle.md)
  * [Schemas, Types, & Categories](core-concepts/credentials-and-data/achievement-types-and-categories.md)
  * [Building Verifiable Credentials](core-concepts/credentials-and-data/building-verifiable-credentials.md)
  * [Boost Credentials](core-concepts/credentials-and-data/boost-credentials.md)
  * [Getting Started with Boosts](core-concepts/credentials-and-data/getting-started-with-boosts.md)
  * [Credential URIs](core-concepts/credentials-and-data/uris.md)
  * [xAPI Data](core-concepts/credentials-and-data/xapi-data.md)
  * [General Best Practices & Troubleshooting](core-concepts/credentials-and-data/general-best-practices-and-troubleshooting.md)
* [Consent & Permissions](core-concepts/consent-and-permissions/README.md)
  * [ConsentFlow Overview](core-concepts/consent-and-permissions/consentflow-overview.md)
  * [Consent Contracts](core-concepts/consent-and-permissions/consent-contracts.md)
  * [User Consent & Terms](core-concepts/consent-and-permissions/user-consent-and-terms.md)
  * [Consent Transactions](core-concepts/consent-and-permissions/consent-transactions.md)
  * [Auto-Boosts](core-concepts/consent-and-permissions/auto-boosts.md)
  * [Writing Consented Data](core-concepts/consent-and-permissions/writing-consented-data.md)
  * [Accessing Consented Data](core-concepts/consent-and-permissions/accessing-consented-data.md)
  * [GameFlow Overview](core-concepts/consent-and-permissions/gameflow-overview.md)
* [Network & Interactions](core-concepts/network-and-interactions/README.md)
  * [Network Vision & Principles](core-concepts/network-and-interactions/network-vision-and-principles.md)
  * [Key Network Procedures](core-concepts/network-and-interactions/key-network-procedures.md)
  * [Core Interaction Workflows](core-concepts/network-and-interactions/core-interaction-workflows.md)
  * [Universal Inbox](core-concepts/network-and-interactions/universal-inbox.md)
* [Architecture & Principles](core-concepts/architecture-and-principles/README.md)
  * [Control Planes](core-concepts/architecture-and-principles/control-planes.md)
  * [Plugin System](core-concepts/architecture-and-principles/plugins.md)
  * [Auth Grants and API Tokens](core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md)
  * [U.S. State API](core-concepts/architecture-and-principles/u.s.-state-api.md)

## 🔗 Development

* [Roadmap](development/roadmap.md)
* [Contributing](development/contributing.md)
