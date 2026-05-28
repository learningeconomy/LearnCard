---
description: Portability notes for LearnCard holder continuity exports
---

# Holder Continuity Compatibility

The LearnCard continuity bundle is meant to be easy to inspect and implement, but external wallets usually import credentials through protocols rather than raw ZIP files.

| Wallet / toolkit | Raw LearnCard ZIP import | Raw credential JSON import | OID4VCI / credential-level receive | DIDComm credential receive | Notes |
|---|---:|---:|---:|---:|---|
| Spruce / SpruceKit | Not published | Documented at SDK level through `CredentialPack.addJsonVc(...)` | Documented for accepting a W3C VC with OID4VCI | Not found in current Spruce wallet docs | See SpruceKit [CredentialPack](https://www.sprucekit.dev/sprucekit-mobile/sprucekit-mobile-sdk/core-components/credentialpack) and [Accept a W3C VC](https://www.sprucekit.dev/sprucekit-mobile/sprucekit-mobile-sdk/sprucekit-ios-sdk/build-a-wallet/accept-a-w3c-vc). |
| Sphereon Wallet / SSI SDK | Not published | Credential formats include JWT and JSON-LD, but a generic JSON-file import path was not found | Documented holder receive flow | Not found in the cited wallet docs | See Sphereon's [receiving credentials](https://ssisdk.docs.sphereon.com/mobile-wallet/receiving-credentials) and [OID4VCI](https://ssisdk.docs.sphereon.com/oid4vc/oid4vci/introduction) docs. |
| MATTR | Not published | Generic wallet JSON-file import was not found | Documented claiming and OID4VCI journey patterns | Not found in the cited holding docs | See MATTR [credential claiming overview](https://learn.mattr.global/docs/holding/credential-claiming-overview) and [OID4VCI authorization code](https://learn.mattr.global/docs/issuance/journey-patterns/oid4vci-authorization-code). |
| Paradym Wallet | Not published | Generic JSON-file import was not found | Wallet docs describe OID4VC-based use | Not found in the cited wallet docs | See [Paradym Wallet](https://docs.paradym.id/api-and-dashboard/integrating-with-a-holder-wallet/paradym-wallet). |

## How to use the matrix

- **Raw LearnCard ZIP import** means the wallet can directly open `learncard-export.zip`, validate `manifest.json`, decrypt entries, and import all supported payloads. No third-party wallet is listed as supporting that today.
- **Raw credential JSON import** means a wallet or SDK documents adding a VC/VP JSON object after the bundle is decrypted.
- **OID4VCI / credential-level receive** means the wallet supports a standards-based issuance or claim flow. That is useful for future re-issuance, but it is not the same as importing this ZIP.
- **DIDComm credential receive** is listed separately because DIDComm and OpenID4VC flows are different interoperability paths.

## Practical portability path

1. Export the LearnCard bundle.
2. Verify `manifest.json` and decrypt the credential JSON payloads.
3. Use any target wallet's documented JSON import, SDK import, OID4VCI, or DIDComm path.
4. Preserve the original LearnCard ZIP as an audit backup even when the target wallet imports individual credentials.

Do not claim that a wallet supports the LearnCard bundle unless the wallet has been tested against the ZIP format.
