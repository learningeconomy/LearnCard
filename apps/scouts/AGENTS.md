# ScoutPass App (`apps/scouts/`)

## Key Concepts

-   **Troop**: A group that issues TroopID credentials to scouts
-   **TroopID**: A credential issued to scouts when they join a troop
-   **Boost**: A credential template that can be issued to recipients
-   **NSO hierarchy**: National → Troop → Scout

## Running

```bash
cd apps/scouts
bun run dev              # Start frontend
bun run docker-start     # Start backend services (Neo4j, brain-service)
```

## Troop credential lifecycle

-   `learn-card-base/useCredentialStatus` is the shared authoritative holder lifecycle hook.
-   `TroopIdStatusButton.tsx` adapts lifecycle plus explicit acceptance metadata for ScoutPass presentation.
-   Earned views must pass a credential-record URI; managed views must not pass a Boost URI as a credential URI.
-   Missing/query-error recipient data must never be interpreted as revocation.
-   Administrator group removal uses `useRevokeBoostRecipientGroup`; the existing singular mutation remains per-instance.
-   Revoked credentials remain visible. Do not mount deletion-based revoked-credential synchronization in ScoutPass.

## Key Files

| File                                         | Purpose                                                  |
| -------------------------------------------- | -------------------------------------------------------- |
| `src/pages/troop/TroopPage.tsx`              | Main troop view, hides members for revoked/pending       |
| `src/pages/troop/TroopPageIdAndTroopBox.tsx` | Share button, disabled for revoked/pending               |
| `src/pages/troop/InviteSelectionModal.tsx`   | Select Leader ID vs Scout ID for network admins          |
| `src/components/TroopIdStatusButton.tsx`     | Shows Valid ID / Pending Acceptance / ID Revoked         |
| `src/components/troopsCMS/TroopsCMS.tsx`     | Troop CMS — boost creation and self-issuance             |
| `src/components/boost/boostCMS/BoostCMS.tsx` | Boost CMS                                                |
| `src/components/troopsCMS/troops.helpers.ts` | Permission helpers (canIssueChildren, canRevokeChildren) |
| `src/components/AddressBookConnections.tsx`  | User connections, uses `useGetConnections`               |

## Address Book

-   **Main contacts**: `useGetConnections()` → `CONNECTED_WITH` relationships
-   **Troop-filtered**: `getPaginatedBoostRecipientsWithChildren()` → boost recipients

## ScoutPass-Specific Permissions

### Network Admin Scout ID Issuance

Network admins (Directors) can issue Scout IDs for troops under their networks:

-   `troops.helpers.ts`: `canIssueChildren` and `canRevokeChildren` for `network` and `global` roles set to `'*'`
-   `InviteSelectionModal.tsx`: Allows selecting between Leader ID and Scout ID for elevated permissions
