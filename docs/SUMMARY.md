# Table of contents

## 🚀 Start Here

- [What is LearnCard?](README.md)
- [Quickstart: Send a Credential](quick-start/your-first-integration.md)
- [What Do You Want to Build?](introduction/what-do-you-want-to-build.md)
- [How LearnCard Works](introduction/how-learncard-works.md)
- [Glossary](introduction/glossary.md)

## 🛠️ Build

- [Send & Issue Credentials](how-to-guides/send-credentials.md)
    - [Design a Custom Credential](tutorials/create-a-credential.md)
    - [Issue at Scale with Boosts](tutorials/create-a-boost.md)
    - [Verify Credentials](tutorials/verify-credentials.md)
    - [Set Up a Signing Authority](how-to-guides/create-signing-authority.md)
    - [Listen to Webhooks](tutorials/listen-to-webhooks.md)
    - [Get Listed as a Trusted Issuer](how-to-guides/verify-my-issuer.md)
- [Publish Your App in LearnCard](how-to-guides/publish-your-app.md)
    - [Build an Embedded App](how-to-guides/connect-systems/connect-an-embedded-app.md)
    - [Embedded App Auth & xAPI](how-to-guides/connect-systems/embedded-app-auth-and-xapi.md)
    - [Link Credentials to the Credential Engine Registry (CTID)](how-to-guides/publish-your-app-ctid.md)
- [Add LearnCard to Your Product](how-to-guides/connect-systems/README.md)
    - [Embed a Claim Button](how-to-guides/connect-systems/embed-a-claim-button.md)
    - [Connect Your Website or Game](how-to-guides/connect-systems/connect-a-website.md)
        - [Tutorial: Build a Connected Website](tutorials/create-a-connected-website.md)
    - [Interoperate with Any Wallet (VC-API)](how-to-guides/interoperate-with-learncard.md)
- [Consent & Guardianship](tutorials/create-a-consentflow.md)
    - [Guardian-Gated Credentials](how-to-guides/implement-flows/guardian-gated-credentials.md)
    - [Claim Data after Guardian Consent](how-to-guides/implement-flows/claim-data-after-guardian-consent.md)
- [Go Deep: Build on the SDK](how-to-guides/deploy-infrastructure/README.md)
    - [How Should I Manage Keys?](how-to-guides/deploy-infrastructure/choose-key-management.md)
    - [Generate API Tokens](how-to-guides/deploy-infrastructure/generate-api-tokens.md)
    - [Remote Key Management](how-to-guides/deploy-infrastructure/managing-seed-phrases.md)
    - [SSS Key Management Config](how-to-guides/deploy-infrastructure/sss-key-management-config.md)
    - [Build a Plugin](how-to-guides/deploy-infrastructure/the-simplest-plugin.md)
    - [Connect to an Independent Network](how-to-guides/deploy-infrastructure/connect-to-independent-network.md)

## 🧠 Understand

- [Credentials & Data](core-concepts/credentials-and-data/README.md)
    - [Verifiable Credentials (VCs)](core-concepts/credentials-and-data/verifiable-credentials-vcs.md)
    - [Credential Lifecycle](core-concepts/credentials-and-data/credential-lifecycle.md)
    - [Credential Status & Bitstring Status Lists](core-concepts/credentials-and-data/credential-status-and-bitstring-status-lists.md)
    - [Schemas, Types, & Categories](core-concepts/credentials-and-data/achievement-types-and-categories.md)
    - [Display Hint Tags (`lc:` convention)](core-concepts/credentials-and-data/display-hint-tags.md)
    - [Building Verifiable Credentials](core-concepts/credentials-and-data/building-verifiable-credentials.md)
    - [Boost Credentials](core-concepts/credentials-and-data/boost-credentials.md)
    - [Getting Started with Boosts](core-concepts/credentials-and-data/getting-started-with-boosts.md)
    - [Credential URIs](core-concepts/credentials-and-data/uris.md)
    - [xAPI Data](core-concepts/credentials-and-data/xapi-data.md)
- [Identities & Keys](core-concepts/identities-and-keys/README.md)
    - [Decentralized Identifiers (DIDs)](core-concepts/identities-and-keys/decentralized-identifiers-dids.md)
    - [Seed Phrases](core-concepts/identities-and-keys/seed-phrases.md)
    - [Key Management (SSS)](core-concepts/identities-and-keys/key-management-sss.md)
    - [Account Recovery](core-concepts/identities-and-keys/account-recovery.md)
    - [Cross-Device Login (QR)](core-concepts/identities-and-keys/cross-device-login.md)
    - [Network Profiles](core-concepts/identities-and-keys/network-profiles.md)
    - [Signing Authorities](core-concepts/identities-and-keys/signing-authorities.md)
    - [Trust Registries](core-concepts/identities-and-keys/trust-registries.md)
    - [Holder Continuity](core-concepts/holder-continuity.md)
- [Consent & Permissions](core-concepts/consent-and-permissions/README.md)
    - [ConsentFlow Overview](core-concepts/consent-and-permissions/consentflow-overview.md)
    - [Consent Contracts](core-concepts/consent-and-permissions/consent-contracts.md)
    - [User Consent & Terms](core-concepts/consent-and-permissions/user-consent-and-terms.md)
    - [Consent Transactions](core-concepts/consent-and-permissions/consent-transactions.md)
    - [Auto-Boosts](core-concepts/consent-and-permissions/auto-boosts.md)
    - [Writing Consented Data](core-concepts/consent-and-permissions/writing-consented-data.md)
    - [Verifiable Data in ConsentFlow](core-concepts/consent-and-permissions/verifiable-data-in-consentflow.md)
    - [Accessing Consented Data](core-concepts/consent-and-permissions/accessing-consented-data.md)
    - [GameFlow Overview](core-concepts/consent-and-permissions/gameflow-overview.md)
- [Network & Interactions](core-concepts/network-and-interactions/README.md)
    - [Network Architecture](core-concepts/network-and-interactions/network-architecture.md)
    - [Universal Inbox](core-concepts/network-and-interactions/universal-inbox.md)
- [Architecture & Principles](core-concepts/architecture-and-principles/README.md)
    - [Ecosystem Architecture](introduction/ecosystem-architecture.md)
    - [Interoperability](introduction/interoperability.md)
    - [Control Planes](core-concepts/architecture-and-principles/control-planes.md)
    - [Plugin System](core-concepts/architecture-and-principles/plugins.md)
    - [Auth Coordinator](core-concepts/architecture-and-principles/auth-coordinator.md)
    - [Auth Grants and API Tokens](core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md)

## 📖 Reference

- [Which SDK Do I Need?](sdks/which-sdk.md)
- [LearnCard Wallet SDK](sdks/learncard-core/README.md)
    - [Authentication](sdks/learncard-core/authentication.md)
    - [Usage Examples](sdks/learncard-core/construction.md)
    - [Plugin API Reference](sdks/learncard-core/writing-plugins.md)
    - [Integration Strategies](sdks/learncard-core/architectural-patterns.md)
    - [Deployment](sdks/learncard-core/production-deployment-guide.md)
    - [Troubleshooting](sdks/learncard-core/troubleshooting-guide.md)
    - [Changelog](sdks/learncard-core/migration-guide.md)
- [LearnCloud Network API](sdks/learncard-network/README.md)
    - [Authentication](sdks/learncard-network/authentication.md)
    - [Usage Examples](sdks/learncard-network/usage-examples.md)
    - [Universal Inbox API](sdks/learncard-network/universal-inbox-api.md)
    - [Bitstring Status Lists](sdks/learncard-network/bitstring-status-lists.md)
    - [Key Management & QR Login API](sdks/learncard-network/lca-api-key-management.md)
    - [Skill Frameworks & OpenSALT](sdks/learncard-network/skills-and-opensalt.md)
    - [Architecture](sdks/learncard-network/architecture.md)
    - [Notifications & Webhooks](sdks/learncard-network/notifications.md)
    - ```yaml
      props:
          models: true
      type: builtin:openapi
      dependencies:
          spec:
              ref:
                  kind: openapi
                  spec: learn-card-network-api
      ```
    - [OpenAPI](https://network.learncard.com/docs#/)
- [LearnCloud Storage API](sdks/learncloud-storage-api/README.md)
    - [Authentication](sdks/learncloud-storage-api/authentication.md)
    - [Usage Examples](sdks/learncloud-storage-api/usage-examples.md)
    - [Architecture](sdks/learncloud-storage-api/architecture.md)
    - ```yaml
      props:
          models: true
      type: builtin:openapi
      dependencies:
          spec:
              ref:
                  kind: openapi
                  spec: learn-cloud-storage-openapi
      ```
    - [xAPI Reference](sdks/learncloud-storage-api/xapi-reference.md)
    - [Send xAPI Statements](tutorials/sending-xapi-statements.md)
- [LearnCloud AI API](sdks/learncloud-ai-api/README.md)
    - [Usage Examples](sdks/learncloud-ai-api/usage-examples.md)
- [Partner Connect SDK](sdks/partner-connect.md)
- [Embed SDK](sdks/embed-sdk.md)
- [SSS Key Manager](sdks/sss-key-manager.md)
- [Auth Types](sdks/auth-types.md)
- [Plugins](sdks/official-plugins/README.md)
    - [LearnCard (Universal Wallet)](sdks/official-plugins/learncard.md)
    - [Crypto](sdks/official-plugins/crypto.md)
    - [DIDKit](sdks/official-plugins/didkit.md)
        - [DIDKit (Node)](sdks/official-plugins/didkit-node.md)
    - [DID Key](sdks/official-plugins/did-key.md)
    - [VC](sdks/official-plugins/vc/README.md)
        - [Expiration Sub-Plugin](sdks/official-plugins/vc/expiration-sub-plugin.md)
    - [VC Templates](sdks/official-plugins/vc-templates.md)
    - [LearnCloud](sdks/official-plugins/learncloud.md)
    - [Dynamic Loader](sdks/official-plugins/dynamic-loader.md)
    - [LearnCard Network](sdks/official-plugins/learncard-network.md)
        - [LCA API](sdks/official-plugins/lca-api.md)
        - [Claimable Boosts](sdks/official-plugins/claimable-boosts.md)
    - [VC API](sdks/official-plugins/vc-api.md)
    - [CHAPI](sdks/official-plugins/chapi.md)
    - [Ceramic](sdks/official-plugins/ceramic.md)
        - [IDX](sdks/official-plugins/idx.md)
    - [Ethereum](sdks/official-plugins/ethereum.md)
    - [VPQR](sdks/official-plugins/vpqr.md)
- [LearnCard CLI](sdks/learncard-cli.md)
    - [Holder Continuity Export](sdks/learncard-cli.md#holder-continuity-export)

## 📱 Products

- [LearnCard Apps](apps/README.md)
- [LearnCard App](apps/learn-card-app/README.md)
    - [Export & Import Your Data](how-to-guides/export-and-import-your-data.md)
    - [Connect an AI Assistant](how-to-guides/connect-systems/connect-ai-agent.md)
- [ScoutPass](apps/scouts/README.md)
- [Contributing](development/contributing.md)
- [Roadmap](https://roadmap.learncard.com/)
- [Changelog](https://roadmap.learncard.com/changelog)
