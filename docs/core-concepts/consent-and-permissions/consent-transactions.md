# Consent Transactions

Explore the Consent Transaction system, which provides a reliable audit trail of all significant consent-related activities. Understand the different transaction types and how they transparently record the history of consent decisions and changes.

### Transaction System <a href="#transaction-system" id="transaction-system"></a>

Every action in the consent flow creates a transaction record, which provides an audit trail of all consent-related activities.

```mermaid
graph TD
    Terms["ConsentFlowTerms"] -->|has| Transactions["ConsentFlowTransaction[]"]

    Transactions -->|includes| ConsentTx["consent: initial consent"]
    Transactions -->|includes| UpdateTx["update: terms modified"]
    Transactions -->|includes| WithdrawTx["withdraw: consent revoked"]
    Transactions -->|includes| SyncTx["sync: credentials synced"]
    Transactions -->|includes| WriteTx["write: credential issued"]

    ConsentTx -->|records| ConsentDate["date"]
    ConsentTx -->|may record| ExpiresAt["expiresAt"]
    ConsentTx -->|may record| OneTime["oneTime"]

    SyncTx -->|records| SyncedCredentials["credentials by category"]

    WriteTx -->|may link to| IssuedCredential["credential"]
```

Transaction types:

* **consent**: Created when a user initially consents
* **update**: Created when a user updates their terms
* **withdraw**: Created when a user withdraws consent
* **sync**: Created when a user syncs credentials to the contract
* **write**: Created when a credential is issued through the contract

Transactions can be retrieved using `getConsentFlowTransactions` for a specific terms URI.
