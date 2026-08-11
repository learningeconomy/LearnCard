# ScoutPass credential revocation

## Lifecycle source of truth

ScoutPass reads the issuer-controlled lifecycle recorded by LearnCard Network for the specific credential URI. If that record is unavailable, it verifies the credential's Bitstring Status List entry. A loading state, missing list entry, or request failure is never treated as proof of revocation.

## Removing a member

Removing a member revokes every active, pending, or suspended credential issued from that group ID to the profile. LearnCard also removes permissions, administrator grants, and connections created by those credentials. Repeating the operation is safe; a partial result remains visible so the administrator can retry.

## Holder experience

Revoked IDs remain in the holder's credential list and display **ID Revoked**. Suspended and unaccepted IDs display **ID Suspended** and **Pending Acceptance**. Sharing and membership-protected actions are unavailable in all three states.

## Legacy credentials

Credentials issued before Bitstring Status List support still receive authoritative LearnCard Network revocation, but their old signed copies cannot be changed. External cryptographic revocation for those IDs requires controlled reissuance, retirement or blocklisting of old identifiers, and verifier cutover in a separate migration cycle.
