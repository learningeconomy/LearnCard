# ScoutPass

**ScoutPass** is a specialized LearnCard application designed for scouting organizations to issue and manage achievement badges digitally. It uses LearnCard's **Boost hierarchy** system to model the organizational structure of scouting: National Organizations → Troops → Scouts.

Available on:

- 📱 iOS ([App Store](https://apps.apple.com/us/app/scoutpass/id6451271002))
- 📱 Android ([Google Play](https://play.google.com/store/apps/details?id=com.scoutpass.app))
- 🌐 Web ([pass.scout.org](https://pass.scout.org/))

---

## Key Features

| Feature                    | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| **Hierarchical Structure** | NSO → Troop → Scout organization modeled with parent-child Boosts |
| **BoostID Membership**     | Digital ID cards for troop membership at each level               |
| **Badge Issuance**         | Issue digital badges for achievements, ranks, and milestones      |
| **Role-Based Permissions** | NSO admins, troop leaders, and scouts have scoped permissions     |
| **Verifiable Credentials** | All badges and IDs are W3C Verifiable Credentials                 |

---

## For developers: how ScoutPass models this on LearnCard

ScoutPass is a worked example of a multi-level organization built on the platform. Everything below is the developer view — the same [Boost](../../core-concepts/credentials-and-data/boost-credentials.md) parent-child relationships and permission flags are available to any integration.

### Organizational hierarchy

ScoutPass uses parent-child Boost relationships to create a hierarchical structure:

```mermaid
graph TD
    subgraph "National Scouting Organization (NSO)"
        NSO_ID["NSO BoostID<br/>(Root)"]
        NSO_BADGES["NSO Badge Templates"]
    end

    subgraph "Troop Level"
        TROOP_ID["Troop BoostID<br/>(Child of NSO)"]
        TROOP_BADGES["Troop Badges<br/>(Children of NSO Badges)"]
    end

    subgraph "Scout Level"
        SCOUT_ID["Scout Membership ID<br/>(Issued from Troop ID)"]
        SCOUT_BADGES["Earned Badges<br/>(Issued from Troop Badges)"]
    end

    NSO_ID -->|PARENT_OF| TROOP_ID
    NSO_BADGES -->|PARENT_OF| TROOP_BADGES
    TROOP_ID -.->|ISSUED_TO| SCOUT_ID
    TROOP_BADGES -.->|ISSUED_TO| SCOUT_BADGES
```

#### How it works

1. **NSO creates root Boosts** — The National Scouting Organization creates BoostID templates and badge templates at the top level
2. **Troops are child Boosts** — Each troop is created as a child of the NSO, inheriting badge templates
3. **Scouts receive credentials** — Troop leaders issue membership IDs and badges to individual scouts

---

### User roles & permissions

Permissions flow down through the hierarchy using LearnCard's permission model:

| Role             | Scope             | Permissions                                                                                |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| **NSO Admin**    | Organization-wide | Create badge templates, manage troops, `canCreateChildren`, `canManageChildrenPermissions` |
| **Troop Leader** | Troop-level       | Issue badges to scouts, manage troop roster, `canIssue`, `canIssueChildren`                |
| **Scout**        | Individual        | View and share earned badges and membership ID                                             |

```mermaid
flowchart LR
    subgraph Permissions
        NSO[NSO Admin] -->|grants canIssueChildren| TL[Troop Leader]
        TL -->|issues credentials to| S[Scout]
    end
```

---

### Key flows

#### Setting up a troop

```mermaid
sequenceDiagram
    participant NSO as NSO Admin
    participant System as LearnCard Network
    participant TL as Troop Leader

    NSO->>System: Create Troop BoostID (child of NSO)
    System-->>NSO: troopBoostUri

    NSO->>System: Add Troop Leader as admin
    System->>System: Grant canIssue, canIssueChildren

    TL->>System: View troop badge templates
    System-->>TL: Inherited from NSO parent
```

#### Issuing a badge

```mermaid
sequenceDiagram
    participant TL as Troop Leader
    participant System as LearnCard Network
    participant Scout

    TL->>System: Select badge template
    TL->>System: sendBoost(scoutProfileId, badgeUri)
    System->>System: Verify TL has canIssue permission
    System->>Scout: Credential sent to inbox
    Scout->>System: Claim badge
    System-->>Scout: Badge in wallet
```

---

## Related Documentation

- [Credential Status & Bitstring Status Lists](../../core-concepts/credentials-and-data/credential-status-and-bitstring-status-lists.md) — How revocation works
- [Boost Credentials](../../core-concepts/credentials-and-data/boost-credentials.md) — Understanding hierarchies and permissions
- [Getting Started with Boosts](../../core-concepts/credentials-and-data/getting-started-with-boosts.md) — Creating and issuing boosts
- [Network Profiles](../../core-concepts/identities-and-keys/network-profiles.md) — Managing organizational profiles
