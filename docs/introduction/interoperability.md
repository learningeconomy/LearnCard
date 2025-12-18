---
description: 'Explanation: Interoperability, Open Standards, and LearnCard'
---

# Interoperability

Our core philosophy is simple: **A user's identity and achievements belong to them, not to a platform.** This principle is not just a talking point; it is the architectural foundation of everything we build, and it is made possible through a deep commitment to interoperability and open standards.

## The Universal Passport: Beyond a Simple Wallet

It's helpful to think of LearnCard not as a closed "wallet," but as a **universal passport for learning and work.**

A physical passport is valuable because it's based on a global standard. It's issued by a trusted authority, but it's recognized and accepted by countless other countries, airlines, and institutions. You can take it anywhere, and its value is understood.

This is our model for digital identity. A credential for a course completed on one platform should be just as valid and useful on another. A skill verified by one employer should be presentable to the next. LearnCard is designed to be that trusted, portable container for these records—a passport that unlocks opportunities across the entire digital world, not just within our own walls.

## The Universal Inbox: The Bridge to Simplicity

The biggest challenge to interoperability isn't a lack of standards; it's the friction of adoption. How do you connect the simple, centralized systems everyone uses today (like email) with the powerful, decentralized world of verifiable identity?

This is the problem the [**Universal Inbox**](../core-concepts/network-and-interactions/universal-inbox.md) solves.

It acts as a simple, familiar on-ramp. By allowing an organization to send a credential to a simple email address or phone number, we remove the "chicken-and-egg" problem of decentralized identity. The developer doesn't need to ask, "Does this user have a passport yet?" They just send the record.

The Universal Inbox is the bridge that makes interoperability practical. It uses a simple, centralized interaction to bootstrap the user into a world where they are in full control of their own decentralized, interoperable records.

## A Foundation of Open Standards

Our commitment to interoperability is not theoretical; it's built into every layer of our platform through the adoption of global, open standards. This ensures that data created or managed within LearnCard is portable, secure, and understandable by any other compliant system.

* [**Verifiable Credentials (VCs)**](https://w3c.github.io/vc-data-model/)**:** The W3C standard for creating secure, tamper-evident digital records that are portable and independently verifiable.
* [**Decentralized Identifiers (DIDs)**](https://w3c.github.io/did/)**:** The W3C standard for creating globally unique, user-controlled identifiers that are not dependent on any single organization.
* [**VC-API**](https://w3c-ccg.github.io/vc-api)**:** A standard protocol that defines how wallets and servers communicate to issue and verify credentials, ensuring any compliant wallet can interact with any compliant issuer.
* [**Credential Handler API (CHAPI)**](http://chapi.io/): The Credential Handler API (CHAPI) allows your digital wallet to receive Verifiable Credentials from an independent third-party issuer - or present Verifiable Credentials to an independent third-party verifier - in a way that establishes trust and preserves privacy.
* [**Open Badges v3**](https://www.imsglobal.org/spec/ob/v3p0/)**:** The leading standard from 1EdTech for creating and recognizing digital badges for skills and achievements, which is fully compatible with the Verifiable Credentials model.
* [**Comprehensive Learner Record v2**](https://www.imsglobal.org/spec/clr/v2p0/)**:** The leading standard from 1EdTech designed to create, transmit, and render an individual's set of achievements, as issued by multiple learning providers, in a machine-readable format that can be curated into verifiable digital records of achievement.
* [**Credential Transparency Description Language (CTDL)**](https://credentialengine.org/credential-transparency/ctdl/)**:** A standard vocabulary for describing credentials, competencies, and educational pathways, making records machine-readable and easy to understand across different systems.

## Your Data, Your Passport: True Portability

Because we are built on these open standards, **you are never locked in.**

A user can, at any time, export their credentials and identifiers from their LearnCard Passport and import them into any other standards-compliant wallet. This is the ultimate guarantee of user control and freedom. It's not our platform that gives the credentials their value; it's the standards they are built upon. Our job is simply to provide the most secure, user-friendly passport for carrying them.

## The Wall of Interoperability

LearnCard is a node in a growing global network. Our ability to interoperate is proven by our compatibility with other tools and platforms that also embrace open standards.

**Compatible Wallets & Platforms:**

* [MIT's Learner Credential Wallet](https://lcw.app/)
* [iDatify's SmartResume](https://www.smartresume.com/)
* [IEEE's Open Credential Publisher](https://opencredentialpublisher.org/access/login)
* [Digital Bazaar's Veres One Wallet](https://veres.one/)
* [Spruce's Credible Wallet](https://spruceid.com/products/credible)
* [Acreditta](https://info.acreditta.com/)
* [ASU's Pocket](https://pocket.asu.edu/)
* [Danube Tech](https://danubetech.com/tech/uni-issuer-verifier)
* [Participate](https://www.participate.com/)
* [Gobekli](https://gobekli.io/)
* [VC Playground](https://vcplayground.org/)
* _And many others that implement the VC-API and OpenID4VC standards._

**Supported Standards Bodies:**

* [W3C Credentials Community Group](https://www.w3.org/community/credentials/)
* [1EdTech](https://www.1edtech.org/) (formerly IMS Global)
* [IEEE](https://www.ieee.org/)
* [Decentralized Identity Foundation (DIF)](https://identity.foundation/)

This ecosystem is a testament to the power of collaborative, open development. Our goal is to make LearnCard the easiest way to participate in it.
