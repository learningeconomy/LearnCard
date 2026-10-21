---
description: 'Understanding Trust Registries: Who to Trust in the Digital Credential World'
---

# Trust Registries

A **trust registry** associates recognized Decentralized Identifiers (DIDs) with
issuer information such as an organization's name, website, and location.
Looking up a credential's issuer DID tells an application whether that issuer is
recognized by a registry it relies on; it does not prove the credential's claims
are true or replace signature and status verification.

## How LearnCard queries registries

The LearnCard app's `useKnownDIDRegistry` hook performs a separate issuer lookup:

1. Fetch [known-did-registries.json](https://registries.learncard.com/known-did-registries.json)
   and [untrusted-did-registries.json](https://registries.learncard.com/untrusted-did-registries.json).
2. Configure separate registry clients with those registry lists.
3. Look up the issuer identifier in both clients using `lookupIssuersFor`.
4. Return `trusted` if the known registries match, otherwise `untrusted` if the
   untrusted registries match, or `unknown` when neither matches.

A matching entry supplies issuer metadata for display and trust decisions.
Calling the SDK's `verifyCredential` alone does not perform this registry lookup.

## Registries LearnCard ships with

The source list lives in `packages/learn-card-registries/known-did-registries.json`.
It currently contains these six registries:

| Registry                      | Type         | Registry URL or trust anchor                                                                                |
| ----------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| LEF Member Registry           | `dcc-legacy` | [LearnCard trusted registry](https://registries.learncard.com/trusted/registry.json)                        |
| OpenSALT Test Issuer Registry | `oidf`       | [OpenSALT staging trust anchor](https://staging.opensalt.net/issuer-registry/.well-known/openid-federation) |
| DCC Sandbox Registry          | `dcc-legacy` | [Sandbox registry](https://digitalcredentials.github.io/sandbox-registry/registry.json)                     |
| DCC Community Registry        | `dcc-legacy` | [Community registry](https://digitalcredentials.github.io/community-registry/registry.json)                 |
| DCC Member Registry           | `dcc-legacy` | [Member registry](https://digitalcredentials.github.io/dcc-registry/registry.json)                          |
| MSP Registry                  | `dcc-legacy` | [My Skills Pocket registry](https://sandbox-issuer.myskillspocket.com/registry.json)                        |

Each descriptor includes a `name`, `type`, and `governanceUrl`.
JSON (`dcc-legacy`) registries specify a `url` pointing to issuer entries;
OpenID Federation (`oidf`) registries specify a `trustAnchorEC` for discovery.
Test and sandbox entries are included in the shipped list, not only production
registries; integrators should choose registries appropriate to their use case.

## What listing gets you

Listing your exact issuing DID in the LEF Member Registry lets LearnCard recognize
your organization and display its registered name, website, and location.
Recipients see a trusted issuer instead of an unverified-issuer notice.
LEF registry membership also enables restricted features such as sending
credentials to phone numbers.

Listing does not make every credential from that DID valid: verifiers still need
to check signatures, credential status, and their own acceptance requirements.
An unlisted issuer is unknown to the registry, not necessarily fraudulent.

## Get listed

Follow [Get Listed as a Trusted Issuer](../../how-to-guides/verify-my-issuer.md)
to submit your organization's DID and metadata for review.
