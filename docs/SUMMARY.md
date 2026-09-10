# Table of contents

## 🚀 Start Here

- [What is LearnCard?](README.md)
- [Quickstart: Send a Credential](quick-start/your-first-integration.md)
- [What Do You Want to Build?](introduction/what-do-you-want-to-build.md)
- [How LearnCard Works](introduction/how-learncard-works.md)
- [Glossary](introduction/glossary.md)

## 🛠️ Build

- [Send & Issue Credentials](how-to-guides/send-credentials.md)
    - [Revoke or Update a Credential](how-to-guides/revoke-or-update-a-credential.md)
    - [Who Signs Your Credentials?](how-to-guides/create-signing-authority.md)
    - [Know When a Credential Is Claimed](tutorials/listen-to-webhooks.md)
- [Verify Credentials](tutorials/verify-credentials.md)
- [Build an App Inside LearnCard](how-to-guides/publish-your-app.md)
- [Embed a Claim Button](how-to-guides/connect-systems/embed-a-claim-button.md)
- [Bring Your Credentials into LearnCard](how-to-guides/interoperate-with-learncard.md)
- [Connect a User's LearnCard to Your Platform](tutorials/create-a-consentflow.md)
- [Record Learning Activity](tutorials/sending-xapi-statements.md)
- [Go to Production](how-to-guides/go-to-production.md)
    - [Generate API Tokens](how-to-guides/deploy-infrastructure/generate-api-tokens.md)
    - [Test Safely: Staging & Mock Recipients](how-to-guides/deploy-infrastructure/test-safely.md)
    - [Get Listed as a Trusted Issuer](how-to-guides/verify-my-issuer.md)

## 🧠 Understand

- [Credentials & Data](core-concepts/credentials-and-data/verifiable-credentials-vcs.md)
    - [Building Verifiable Credentials](core-concepts/credentials-and-data/building-verifiable-credentials.md)
    - [Credential Templates (Boosts)](core-concepts/credentials-and-data/boost-credentials.md)
    - [Credential Status & Revocation](core-concepts/credentials-and-data/credential-status-and-bitstring-status-lists.md)
    - [Display Hint Tags (`lc:` convention)](core-concepts/credentials-and-data/display-hint-tags.md)
    - [Credential URIs](core-concepts/credentials-and-data/uris.md)
    - [xAPI Data](core-concepts/credentials-and-data/xapi-data.md)
- [Identity & Trust](core-concepts/identities-and-keys/decentralized-identifiers-dids.md)
    - [Seed Phrases](core-concepts/identities-and-keys/seed-phrases.md)
    - [Key Management (SSS)](core-concepts/identities-and-keys/key-management-sss.md)
    - [Network Profiles](core-concepts/identities-and-keys/network-profiles.md)
    - [Signing Authorities](core-concepts/identities-and-keys/signing-authorities.md)
    - [Trust Registries](core-concepts/identities-and-keys/trust-registries.md)
    - [Auth Grants and API Tokens](core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md)
- [Consent & Permissions](core-concepts/consent-and-permissions/consentflow-overview.md)
    - [Reading & Writing Consented Data](core-concepts/consent-and-permissions/writing-consented-data.md)
    - [Issue on Consent](core-concepts/consent-and-permissions/auto-boosts.md)
    - [GameFlow](core-concepts/consent-and-permissions/gameflow-overview.md)
    - [Verifiable Data in ConsentFlow](core-concepts/consent-and-permissions/verifiable-data-in-consentflow.md)
- [How LearnCard Is Built](introduction/ecosystem-architecture.md)
    - [Interoperability](introduction/interoperability.md)
    - [Universal Inbox](core-concepts/network-and-interactions/universal-inbox.md)
    - [Plugin System](core-concepts/architecture-and-principles/plugins.md)
    - [Holder Continuity & Portability](core-concepts/architecture-and-principles/holder-continuity.md)

## 📖 Reference

- [Which SDK Do I Need?](sdks/which-sdk.md)
- [LearnCard Wallet SDK](sdks/learncard-core/README.md)
    - [Initialization & Authentication](sdks/learncard-core/authentication.md)
    - [Methods](sdks/learncard-core/construction.md)
    - [Control Planes](core-concepts/architecture-and-principles/control-planes.md)
    - [Plugin API](sdks/learncard-core/writing-plugins.md)
    - [Achievement Types & Categories](core-concepts/credentials-and-data/achievement-types-and-categories.md)
    - [Changelog](sdks/learncard-core/migration-guide.md)
- [Network API](sdks/learncard-network/README.md)
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
    - [Authentication](sdks/learncard-network/authentication.md)
    - [Usage Examples](sdks/learncard-network/usage-examples.md)
    - [Universal Inbox API](sdks/learncard-network/universal-inbox-api.md)
    - [Notifications & Webhooks](sdks/learncard-network/notifications.md)
    - [Status Lists](sdks/learncard-network/bitstring-status-lists.md)
    - [Skill Frameworks & OpenSALT](sdks/learncard-network/skills-and-opensalt.md)
    - [Key Management & QR Login API](sdks/learncard-network/lca-api-key-management.md)
    - [Errors & Limits](sdks/learncard-network/errors-and-limits.md)
- [Storage API](sdks/learncloud-storage-api/README.md)
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
    - [Authentication](sdks/learncloud-storage-api/authentication.md)
    - [Usage Examples](sdks/learncloud-storage-api/usage-examples.md)
    - [xAPI Reference](sdks/learncloud-storage-api/xapi-reference.md)
- [Partner Connect SDK](sdks/partner-connect/README.md)
    - [Methods](sdks/partner-connect/methods.md)
    - [Errors, Types & Migration](sdks/partner-connect/errors-and-types.md)
- [Embed SDK](sdks/embed-sdk.md)
- [SSS Key Manager](sdks/sss-key-manager.md)
- [Plugins](sdks/official-plugins/README.md)
    - [DIDKit (Node)](sdks/official-plugins/didkit-node.md)
    - [VC Templates](sdks/official-plugins/vc-templates.md)
    - [LearnCloud](sdks/official-plugins/learncloud.md)
    - [LearnCard Network](sdks/official-plugins/learncard-network.md)
    - [Claimable Boosts](sdks/official-plugins/claimable-boosts.md)
    - [Ceramic](sdks/official-plugins/ceramic.md)
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
