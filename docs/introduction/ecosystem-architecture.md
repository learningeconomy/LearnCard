# Ecosystem Architecture

{% embed url="https://www.figma.com/board/eogBqV1c1tCzmNOA54B005/Ecosystem-Architecture?node-id=0-1&t=9wggrjsXToOT1GMK-1" %}

The LearnCard ecosystem is modular by design. Every component plays a distinct role, built on open standards and APIs to give developers the flexibility and clarity to build confidently.

Use this guide to understand how each part connects—from low-level credential infrastructure to high-level personalized apps.



***

## 🛠️ SDK & API Model

Choose your stack:

* `@learncard/init` SDK for programmatic control
* LearnCloud Network API for backend integrations
* LearnCloud Storage API for encrypted storage
* LearnCloud AI API for AI-enabled credential flows
* LearnCard CLI for automation and scripting

LearnCard’s SDK is modular: bring only what you need, scale as you go.

***

## 🟨 LearnCard (Wallet)

The LearnCard wallet is the core tool for issuing, holding, sharing, and verifying credentials.

#### Wallet SDK

Use the SDK (via App or CLI) to:

* **Issue** credentials like Boosts or standard W3C VCs
* **Share** credentials with apps, orgs, or individuals
* **Verify** incoming credentials
* **Consent** to data access with ConsentFlows
* **Store**, **Read**, **Delete**, and **Encrypt** credentials securely

✅ Ideal for apps, bots, and backends needing verifiable credential logic.

***

## 🟨 LearnCloud (Platform)

LearnCloud extends LearnCard with cloud APIs for storage, sharing, and consent-based workflows.



### 🌐 LearnCloud Network API

The **LearnCloud Network API** lets developers:

* Send and receive credentials, boosts, and presentations
* Create and claim credentials through peer-to-peer or QR flows
* Register and manage Signing Authorities
* Trigger and validate ConsentFlows
* Monitor health and fetch metadata (like DIDs or challenge keys)

It’s the backbone of interaction between LearnCard users and applications.

### ☁️ LearnCloud Storage API

**LearnCloud** is LearnCard’s end-to-end encrypted storage system:

* Store credentials and presentations securely
* Sync across devices
* Swap in your own storage backend if desired

Data is encrypted client-side. LearnCard never sees private data unless explicitly shared through a consent contract.

### 🧠 LearnCloud AI API

Use to:

* **Ingest** credentials
* **Assess** skills and outcomes
* **Analyze** for insights
* **Award** credentials or Boosts via automated logic

✅ Ideal for cloud-based systems and network-wide credential interaction.

***

## 🟦 Standards & Protocols

LearnCard builds on trusted, open standards:

* **W3C VC**, **W3C DID**, **W3C Linked Claims**
* **OBv3**, **IEEE LER**, **CLR 2.0**, **LIF**
* **xAPI**, **OIDC4VC**, **SCD**, **KYC**, **Open Awarding Service**

✅ This ensures LearnCard plays nicely with existing platforms, wallets, and verifiers.

***

## 🟧 Connected Tools

These protocols and interfaces extend the LearnCard platform:

* **ConsentFlow**: Define how data can be accessed or written with user consent
* **LTI**: Integrate into LMSs and EdTech platforms
* **LearnCloud API**, **VC API**, **Trust Registry**: Shared infrastructure for credential validation and storage

✅ These tools make LearnCard ecosystem-ready and plug-in compatible.

***

## 🟪 Applications & Ecosystems

LearnCard is used in:

* **Apps**: Games, EdTech, LMS, AI, content tools
* **Ecosystems**: Nations, states, school districts, employers, communities

Each app or system connects via APIs, ConsentFlows, or wallet interactions.

***

## 🔁 The Layered Stack

On the right side of the diagram, you'll see the **Skyway Stack**—our model for understanding how everything flows upward:

1. **Data Pipes**: Ingest and stream raw credential data
2. **Portfolios**: Aggregate credentials per learner/worker
3. **Consent**: Enable trusted sharing with granular control
4. **Credentialing**: Issue and verify new claims
5. **Analytics**: Gain insight from usage, learning, and pathways
6. **Personalization**: Adapt experiences in real-time
7. **Pathways**: Help users discover career and learning options
8. **Applications**: Deliver features people see and touch

✅ You don’t have to use every layer—build what you need, plug in where it makes sense.

***

## 🧠 Summary

If you’re:

* **Building an app** → Start with the [Wallet SDK](../sdks/learncard-core/)
* **Working cloud-side** → Use ConsentFlows + the [Network](../sdks/learncard-network/) or [Storage](../sdks/learncloud-storage-api/) APIs
* **Needing automation and personalization** → Tap into the AI API _(public API coming soon)_

***

### ✅ Next Steps

Now that you understand the big ideas:

* 🔗 Jump into [Your First Integration](../quick-start/your-first-integration.md)
* 🧪 Try a live flow using the [LearnCard CLI](../sdks/learncard-cli.md)
* 📚 Browse the [API Reference](/broken/pages/2CFJ0iVopfhxEzxav7hh)
