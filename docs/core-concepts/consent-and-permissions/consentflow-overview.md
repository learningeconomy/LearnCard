# ConsentFlow Overview

The Consent Flow system allows organizations to create contracts that users can consent to, enabling controlled data sharing and credential issuance.

## Architecture

The Consent Flow Contract system manages permissions and data sharing between profiles using a graph-based data model. It tracks what data can be shared, who has consented to share it, and maintains a transaction history of all consent-related activities.

```mermaid
classDiagram
    class Profile {
        profileId: string
        did: string
        displayName: string
    }

    class ConsentFlowContract {
        id: string
        name: string
        description: string
        contract: Object
        createdAt: string
        updatedAt: string
        expiresAt: string
    }

    class ConsentFlowTerms {
        id: string
        terms: Object
        status: "live"|"stale"|"withdrawn"
        createdAt: string
        updatedAt: string
        expiresAt: string
        oneTime: boolean
    }

    class ConsentFlowTransaction {
        id: string
        action: "consent"|"update"|"withdraw"|"sync"|"write"
        date: string
        terms: Object
    }

    class Boost {
        id: string
        boost: Object
        category: string
    }

    class Credential {
        uri: string
        credential: Object
    }

    Profile "1" -- "*" ConsentFlowContract : creates
    Profile "1" -- "*" ConsentFlowTerms : consents with
    ConsentFlowContract "1" -- "*" ConsentFlowTerms : consented to via
    ConsentFlowTerms "1" -- "*" ConsentFlowTransaction : has
    ConsentFlowTransaction "1" -- "*" Credential : may issue
    ConsentFlowContract "1" -- "*" Boost : can auto-issue
```

The system consists of the following key components:

1. **Profiles**: Users who create contracts or consent to contracts
2. **Contracts**: Define data access requirements and permissions
3. **Terms**: Record a profile's consent to a contract with specific sharing preferences
4. **Transactions**: Record actions related to terms (consent, withdraw, update, sync, write)
5. **Credentials**: Can be issued or synced through contract consent
6. **Auto-Boosts**: Credentials automatically issued when a user consents to a contract

## ConsentFlow Process

When a profile consents to a contract, the following steps occur:

```mermaid
sequenceDiagram
    participant Organization
    participant Network as LearnCard Network API
    participant User

    Organization->>Network: createConsentFlowContract(...)
    Network-->>Organization: contractUri

    User->>Network: getContract(contractUri)
    Network-->>User: contract details and terms

    User->>Network: consentToContract(contractUri, acceptedTerms)
    Network->>Network: processAutoBoosts()
    Network-->>User: consent confirmed, autoboosts issued

    Organization->>Network: getContractData(contractUri, query)
    Network-->>Organization: data for consented profiles

    Organization->>Network: writeToContract(contractUri, profileId, credential)
    Network->>User: credential issued to consented user
```

The consent flow includes:

1. Verifying the terms are valid for the contract
2. Creating a terms record with status (live/stale)
3. Recording a consent transaction
4. Processing any auto-boosts (if configured)
5. Notifying the contract owner

Options when consenting:

* **expiresAt**: Date when the consent expires
* **oneTime**: If true, marks terms as "stale" after consent
