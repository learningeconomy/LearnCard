# ScoutPass App (`apps/scouts/`)

## Key Concepts

- **Troop**: A group that issues TroopID credentials to scouts
- **TroopID**: A credential issued to scouts when they join a troop
- **Boost**: A credential template that can be issued to recipients
- **NSO hierarchy**: National → Troop → Scout

## Running

```bash
cd apps/scouts
pnpm dev              # Start frontend
pnpm docker-start     # Start backend services (Neo4j, brain-service)
```

## Troop Credential Status

The `useTroopIDStatus` hook determines credential status:

| Status | Meaning |
|--------|---------|
| `'valid'` | User is in the claimed recipients list |
| `'pending'` | User is in all recipients but not claimed list |
| `'revoked'` | User is not in either list |

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/troop/TroopPage.tsx` | Main troop view, hides members for revoked/pending |
| `src/pages/troop/TroopPageIdAndTroopBox.tsx` | Share button, disabled for revoked/pending |
| `src/pages/troop/InviteSelectionModal.tsx` | Select Leader ID vs Scout ID for network admins |
| `src/components/TroopIdStatusButton.tsx` | Shows Valid ID / Pending Acceptance / ID Revoked |
| `src/components/troopsCMS/TroopsCMS.tsx` | Troop CMS — boost creation and self-issuance |
| `src/components/boost/boostCMS/BoostCMS.tsx` | Boost CMS |
| `src/components/troopsCMS/troops.helpers.ts` | Permission helpers (canIssueChildren, canRevokeChildren) |
| `src/components/AddressBookConnections.tsx` | User connections, uses `useGetConnections` |

## Address Book

- **Main contacts**: `useGetConnections()` → `CONNECTED_WITH` relationships
- **Troop-filtered**: `getPaginatedBoostRecipientsWithChildren()` → boost recipients

## ScoutPass-Specific Permissions

### National Admin Troop View Access

National admins may see "ID Revoked" when viewing troops they manage but don't own (because `useTroopIDStatus` checks the *current user* as recipient).

**Workaround**: `TroopPage.tsx` uses `hasParentAdminAccess` to bypass the `isRevokedOrPending` check. If a user has `canEditChildren` on the parent network boost, they see full troop details regardless.

### Network Admin Scout ID Issuance

Network admins (Directors) can issue Scout IDs for troops under their networks:
- `troops.helpers.ts`: `canIssueChildren` and `canRevokeChildren` for `network` and `global` roles set to `'*'`
- `InviteSelectionModal.tsx`: Allows selecting between Leader ID and Scout ID for elevated permissions
