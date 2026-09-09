---
description: The two-minute mental model — three verbs, three layers, one credential's journey.
---

# How LearnCard Works

LearnCard organizes credential activity around three verbs and three platform layers.

## Three verbs

Everything a person does with their record is one of three things:

- **Collect** — gather credentials from schools, work, courses, games, and certifications across institutions.
- **Understand** — make sense of what's inside: skills, gaps against a goal, insights grounded in the real record.
- **Navigate** — use the record for pathways, jobs, scholarships, and consented AI agents.

Every part of the platform exists to make those three verbs **portable, open, and learner-controlled**.

## Three layers

```mermaid
flowchart LR
  You["Your app · school · employer · game · AI agent"]
  subgraph LC["LearnCard — what people touch"]
    APP["LearnCard App · CLI"]
    SDK["Wallet SDK"]
  end
  subgraph CL["LearnCloud — open APIs"]
    NET["Network API<br/>send · share · verify · consent"]
    STR["Storage API<br/>encrypted personal data"]
    AI["AI API<br/>assess · analyze · tutor"]
  end
  STD["Open standards<br/>W3C Verifiable Credentials · DIDs · Open Badges 3.0 · CLR"]
  You --> LC
  LC <--> CL
  LC -.- STD
  CL -.- STD
```

- **LearnCard** is the wallet app and SDK. Signing and verification use a Rust core compiled to native and WebAssembly for web, iOS, Android, and Node.
- **LearnCloud** provides APIs for network delivery, user-controlled encrypted storage, and AI analysis. Each API can be used independently.
- **Open standards** support interoperability. LearnCard issues W3C Verifiable Credentials, usually Open Badges 3.0, that work with conformant wallets and verifiers. LearnCard also accepts credentials from other systems.

## One credential's journey

1. **You issue it.** Your seed (or a hosted signing authority) signs a credential naming you as issuer. It's now tamper-evident: anyone can check the signature without asking you.
2. **You send it.** To a profile, a DID, or — for someone with no account — an email or phone via the **Universal Inbox**. They get a claim link.
3. **They hold it.** After claiming, the credential is stored encrypted in the person's own storage, under a **DID** they control. You can't revoke their copy of the _data_ — only mark the credential's _status_.
4. **They share it.** With a verifier, an employer, another app — through **consent** the person grants and can withdraw. Verifiers check the signature and status; they don't need to call you.

The holder controls the keys throughout issuance, delivery, storage, and sharing.

## Where to go deeper

- Full architecture, including how a credential moves through every component → [Ecosystem Architecture](ecosystem-architecture.md)
- Why open standards are the point, not a feature → [Interoperability](interoperability.md)
- The credential formats themselves → [Verifiable Credentials](../core-concepts/credentials-and-data/verifiable-credentials-vcs.md), [Boosts](../core-concepts/credentials-and-data/boost-credentials.md)
- Identity and keys → [DIDs](../core-concepts/identities-and-keys/decentralized-identifiers-dids.md), [How Should I Manage Keys?](../how-to-guides/deploy-infrastructure/choose-key-management.md)
- Consent → [ConsentFlow Overview](../core-concepts/consent-and-permissions/consentflow-overview.md)
