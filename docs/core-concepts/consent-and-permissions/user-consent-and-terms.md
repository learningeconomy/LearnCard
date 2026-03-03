# User Consent & Terms

Discover how individuals interact with Consent Contracts by agreeing to specific "Terms." This page explains how users give, review, update, or withdraw their consent, empowering them with granular control over their data sharing preferences with different services.

### Terms Structure

```mermaid
graph TD
    Terms["ConsentFlowTerms"] -->|has| ReadTerms["read: {...}"]
    Terms -->|has| WriteTerms["write: {...}"]

    ReadTerms -->|includes| ReadPersonal["personal: {...}"]
    ReadTerms -->|includes| ReadCredentials["credentials: {...}"]

    WriteTerms -->|includes| WritePersonal["personal: {...}"]
    WriteTerms -->|includes| WriteCredentials["credentials: {...}"]

    ReadPersonal -->|has fields like| NameValue["name: 'John Doe'"]

    ReadCredentials -->|has| ShareAll["shareAll: boolean"]
    ReadCredentials -->|has| Sharing["sharing: boolean"]
    ReadCredentials -->|has| ReadCategories["categories: {...}"]

    WritePersonal -->|has fields like| NamePermission["name: boolean"]

    WriteCredentials -->|has| WriteCategories["categories: {...}"]

    ReadCategories -->|has categories like| AchievementCat["Achievement: {...}"]
    WriteCategories -->|has categories like| IDCat["ID: boolean"]

    AchievementCat -->|has| CatShareAll["shareAll: boolean"]
    AchievementCat -->|has| CatSharing["sharing: boolean"]
    AchievementCat -->|has| CatShared["shared: string[]"]
```

A typical terms example:

```typescript
{
  read: {
    personal: { name: 'Full Fullerson' },
    credentials: {
      shareAll: true,
      sharing: true,
      categories: {
        Achievement: {
          shareAll: true,
          sharing: true,
          shared: ['achievement1', 'achievement2']
        },
        ID: { 
          shareAll: true, 
          sharing: true,
          shared: ['id1', 'id2'] 
        }
      }
    }
  },
  write: {
    personal: { name: true },
    credentials: { 
      categories: { 
        Achievement: true, 
        ID: true 
      } 
    }
  }
}
```

### Managing Consent <a href="#managing-consent" id="managing-consent"></a>

From the perspective of the user who consented to a ConsentFlow Contract, consented terms can be:

1. **Retrieved** using `getConsentedContracts` (paginated list)
2. **Updated** using `updateConsentedContractTerms`
3. **Withdrawn** using `withdrawConsent`

```mermaid
sequenceDiagram
    participant Consenter as Contract Consenter
    participant API as LearnCloud Network API
    participant DB as Neo4j Database
    participant Owner as Contract Owner

    alt Update Terms
        Consenter->>API: updateContractTerms(termsUri, newTerms)
        API->>DB: Update terms
        API->>DB: Create update transaction

        opt Has Auto-Boosts
            API->>API: Process auto-boosts again
        end

        API->>Owner: Send notification
        API-->>Consenter: Return success
    else Withdraw Consent
        Consenter->>API: withdrawConsent(termsUri)
        API->>DB: Mark terms as withdrawn
        API->>DB: Create withdraw transaction
        API->>Owner: Send notification
        API-->>Consenter: Return success
    end
```

### &#x20;<a href="#transaction-system" id="transaction-system"></a>
