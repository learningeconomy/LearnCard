---
'@learncard/openid4vc-plugin': minor
---

Bring the OID4VP (presentation) holder flow in line with OpenID4VP 1.0 final.

- Reject requests carrying `transaction_data` we can't honor with a typed `invalid_transaction_data` error, instead of silently presenting without binding it (§8.4/§8.5).
- Negotiate encrypted (JARM) responses per 1.0: content-encryption from `encrypted_response_enc_values_supported` with the `A128GCM` default, and the JWE key-wrap `alg` taken from the chosen verifier JWK (§8.3). The pre-1.0 `authorization_encrypted_response_alg`/`_enc` fields are still honored as a `[jarm-compat]` fallback.
- Require the `nonce` claim in signed Request Objects (§5.2) rather than defaulting it to empty.
- Accept the canonical `decentralized_identifier:` client-id prefix (§5.9.3), normalized to the internal `did` prefix; the bare `did:` form still works.
- Parse `verifier_info` (§5.11) and `request_uri_method` (§5.10) from both query-param and signed Request Object forms.

DCQL remains the 1.0 query path; PEX (`presentation_definition`) is retained as `[pex-compat]` backward support for pre-1.0 verifiers.
