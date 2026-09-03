# Escrow Relay Isolation Checklist

## Deployment boundary

-   [ ] Deploy in a separate cloud account; if temporarily impossible, use a dedicated role and stack.
-   [ ] Give the runtime role only platform logging permissions; do not grant application-resource access.
-   [ ] Do not attach the relay to the `lca-api` VPC, peering connection, VPN, or private subnets.
-   [ ] Confirm security groups and network ACLs provide no path to MongoDB, Redis, or internal data stores.
-   [ ] Allow outbound HTTPS only as narrowly as the platform permits (Postmark plus platform control plane).
-   [ ] Protect `/email-backup` with the relay bearer token and rate-limit it at the edge.

## Allowed secrets

-   [ ] `ESCROW_RELAY_PRIVATE_KEYS_JSON` (relay P-256 PKCS#8 private keys only)
-   [ ] `ESCROW_RELAY_AUTH_TOKEN` (high-entropy proxy-to-relay token)
-   [ ] `POSTMARK_SERVER_TOKEN` (scoped relay Postmark server token)
-   [ ] Verify the deployment contains no `SEED`, MongoDB URI, Redis credential, Firebase credential, or lca-api role.

## Key rotation

1. Generate a new P-256 keypair using the command in `README.md` and assign a new key ID.
2. Add the new private key beside the old key in `ESCROW_RELAY_PRIVATE_KEYS_JSON`; deploy and smoke-test.
3. Publish the new public key/key ID in signed/baked tenant config and wait for client rollout/cache expiry.
4. Confirm relay metrics show no requests for the old key ID for the agreed compatibility window.
5. Remove and destroy the old private key, redeploy, then record the rotation evidence and date.

## Review evidence

-   [ ] Inspect the deployed role policy and attach it to the release record.
-   [ ] Record VPC/subnet/security-group state proving no database path.
-   [ ] Enumerate secret names (not values) and confirm they match the allowlist above.
-   [ ] Exercise Postmark rejection and confirm the relay returns non-2xx with no acceptance recorded.
