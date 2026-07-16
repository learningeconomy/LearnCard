---
'@learncard/openid4vc-plugin': minor
---

Bring the OID4VP (presentation) holder flow in line with OpenID4VP 1.0 final.

- Reject requests carrying `transaction_data` we can't honor with a typed `invalid_transaction_data` error, instead of silently presenting without binding it (§8.4/§8.5).
- Negotiate encrypted (JARM) responses per 1.0: content-encryption from `encrypted_response_enc_values_supported` with the `A128GCM` default, and the JWE key-wrap `alg` taken from the chosen verifier JWK (§8.3). The pre-1.0 `authorization_encrypted_response_alg`/`_enc` fields are still honored as a `[jarm-compat]` fallback.
- Require the `nonce` claim in signed Request Objects (§5.2) rather than defaulting it to empty.
- Accept the canonical `decentralized_identifier:` client-id prefix (§5.9.3), normalized to the internal `did` prefix; the bare `did:` form still works.
- Parse `verifier_info` (§5.11) and `request_uri_method` (§5.10) from both query-param and signed Request Object forms.
- Support the `x509_hash` client-id prefix (§5.9.3): the leaf certificate's base64url SHA-256 must equal the `client_id`.
- Support `request_uri_method=post` (§5.10): the wallet POSTs a fresh `wallet_nonce` to the request URI and requires the signed Request Object to echo it.

DCQL remains the 1.0 query path; PEX (`presentation_definition`) is retained as `[pex-compat]` backward support for pre-1.0 verifiers.

Still not implemented (verifiers using these are cleanly rejected): the `openid_federation` and `verifier_attestation` client-id prefixes, actually binding `transaction_data` into a presentation (we reject requests that carry it), and the Digital Credentials API response modes (`dc_api`/`dc_api.jwt`).
