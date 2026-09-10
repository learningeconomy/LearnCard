---
description: 'Explanation: Interoperability, Open Standards, and LearnCard'
---

# Interoperability

A credential you issue through LearnCard is a standard W3C Verifiable Credential, usually an Open Badges 3.0 badge. That's a plain JSON document with a signature — not a LearnCard format. Any wallet or verifier that speaks the standard can hold it, show it, and check it, whether or not LearnCard is involved.

The same goes the other way. LearnCard can receive credentials issued by other systems, present its credentials to other verifiers, and export everything a user holds. Nothing about a learner's record depends on LearnCard staying around.

This page lists what that rests on. For how to actually move credentials in and out, see [Bring Your Credentials into LearnCard](../how-to-guides/interoperate-with-learncard.md).

## Standards LearnCard implements

- [**Verifiable Credentials (VCs)**](https://w3c.github.io/vc-data-model/)**:** The W3C standard for creating secure, tamper-evident digital records that are portable and independently verifiable.
- [**Decentralized Identifiers (DIDs)**](https://w3c.github.io/did/)**:** The W3C standard for creating globally unique, user-controlled identifiers that are not dependent on any single organization.
- [**VC-API**](https://w3c-ccg.github.io/vc-api)**:** A standard protocol that defines how wallets and servers communicate to issue and verify credentials, ensuring any compliant wallet can interact with any compliant issuer.
- [**OpenID for Verifiable Credential Issuance (OID4VCI)**](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html)**:** The OpenID Foundation standard for receiving credentials from an issuer. LearnCard can accept a credential offer (by scanning a QR code or following a link), complete the issuer's authorization, and store the resulting credentials—bridging the OpenID ecosystem with your LearnCard Passport.
- [**OpenID for Verifiable Presentations (OID4VP)**](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)**:** The OpenID Foundation standard for presenting credentials to a verifier. LearnCard resolves a verifier's request, lets you choose which held credentials to share (with selective disclosure via DIF Presentation Exchange or DCQL), and returns a signed Verifiable Presentation.
- [**Self-Issued OpenID Provider v2 (SIOPv2)**](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html)**:** The OpenID Foundation standard that lets your wallet act as its own identity provider, issuing self-signed ID tokens so you can authenticate to relying parties without a centralized login.
- [**Credential Handler API (CHAPI)**](http://chapi.io/): The Credential Handler API (CHAPI) allows your digital wallet to receive Verifiable Credentials from an independent third-party issuer - or present Verifiable Credentials to an independent third-party verifier - in a way that establishes trust and preserves privacy. LearnCard is CHAPI-compatible out of the box: if your system implements CHAPI (see the [official CHAPI documentation](https://chapi.io/developers/)), it works with LearnCard — no LearnCard-specific integration required.
- [**Open Badges v3**](https://www.imsglobal.org/spec/ob/v3p0/)**:** The leading standard from 1EdTech for creating and recognizing digital badges for skills and achievements, which is fully compatible with the Verifiable Credentials model.
- [**Comprehensive Learner Record v2**](https://www.imsglobal.org/spec/clr/v2p0/)**:** The leading standard from 1EdTech designed to create, transmit, and render an individual's set of achievements, as issued by multiple learning providers, in a machine-readable format that can be curated into verifiable digital records of achievement.
- [**Credential Transparency Description Language (CTDL)**](https://credentialengine.org/credential-transparency/ctdl/)**:** A standard vocabulary for describing credentials, competencies, and educational pathways, making records machine-readable and easy to understand across different systems.

## Portability

A user can export their credentials, identifiers, and consent records from LearnCard at any time, without asking anyone — see [Holder Continuity](../core-concepts/architecture-and-principles/holder-continuity.md). The credentials remain valid in any other conformant wallet because their validity comes from the issuer's signature, not from LearnCard.

One honest limit: _claiming_ a credential from a LearnCard email link happens in the LearnCard app. Getting that credential into a different wallet afterwards is an export or a standards-based transfer (OID4VCI, VC-API, CHAPI), not something the claim link does by itself.

## Tested against

Wallets and platforms LearnCard has exchanged credentials with:

- [MIT's Learner Credential Wallet](https://lcw.app/)
- [iDatify's SmartResume](https://www.smartresume.com/)
- [IEEE's Open Credential Publisher](https://opencredentialpublisher.org/access/login)
- [Digital Bazaar's Veres One Wallet](https://veres.one/)
- [Spruce's Credible Wallet](https://spruceid.com/products/credible)
- [Acreditta](https://info.acreditta.com/)
- [ASU's Pocket](https://pocket.asu.edu/)
- [Danube Tech](https://danubetech.com/tech/uni-issuer-verifier)
- [Participate](https://www.participate.com/)
- [Gobekli](https://gobekli.io/)
- [VC Playground](https://vcplayground.org/)
- _And many others that implement the VC-API and OpenID4VC (OID4VCI / OID4VP) standards._

Standards bodies whose work this builds on:

- [W3C Credentials Community Group](https://www.w3.org/community/credentials/)
- [1EdTech](https://www.1edtech.org/) (formerly IMS Global)
- [IEEE](https://www.ieee.org/)
- [Decentralized Identity Foundation (DIF)](https://identity.foundation/)
- [OpenID Foundation](https://openid.net/)
