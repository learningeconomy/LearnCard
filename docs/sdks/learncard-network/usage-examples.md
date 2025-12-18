# Usage Examples

This page provides common usage examples for the **LearnCloud Network API**, so you can quickly see how to&#x20;

* Send and receive credentials, boosts, and presentations
* Create and claim credentials through peer-to-peer or QR flows
* Register and manage Signing Authorities
* Trigger and validate ConsentFlows
* Monitor health and fetch metadata (like DIDs or challenge keys)

Each example is standalone and self-explanatory. Scroll, copy, and paste what you need.

> ✅ All examples assume:
>
> * You have a **valid LearnCloud JWT** (via auth or delegation)
> * You’re storing data on behalf of a user identified by a **DID**
> * You’re using the endpoint: `https://network.learncard.com/api`

***

### 🔐 Authentication

All requests require:

* `Authorization: Bearer <your-JWT>`
* The JWT must resolve to a DID matching the stored object owner, unless delegated.

***

##
