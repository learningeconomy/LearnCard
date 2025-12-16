# Writing Consented Data

Understand how, after consent is given, new credentials or data can be provided to a user or recorded about them by authorized parties (like contract owners or automated systems). This covers the rules and methods for data delivery based on established consent.

## Writing Credentials to Contracts <a href="#writing-credentials-to-contracts" id="writing-credentials-to-contracts"></a>

Contract owners can write credentials to profiles that have consented to their contracts using:

* `writeCredentialToContract`: Direct credential writing
* `writeCredentialToContractViaSigningAuthority`: Using a signing authority

```mermaid
sequenceDiagram
    participant Owner as Contract Owner
    participant API as LearnCloud Network API
    participant Consenter as Contract Consenter

    alt Direct credential writing
        Owner->>API: writeCredentialToContract
        Note right of Owner: Includes did, contractUri, boostUri, credential
    else Via signing authority
        Owner->>API: writeCredentialToContractViaSigningAuthority
        Note right of Owner: Includes did, contractUri, boostUri, signingAuthority
    end

    API->>API: Verify consent
    API->>API: Verify boost permissions
    API->>API: Verify category permissions

    opt Via signing authority
        API->>API: Issue credential using signing authority
    end

    API->>API: Send boost with credential
    API->>API: Record write transaction
    API-->>Owner: Return credential URI
```

The system verifies:

1. The recipient has consented to the contract
2. The contract owner has permission to issue the boost
3. The contract terms allow writing in the boost's category

## Credential Syncing <a href="#credential-syncing" id="credential-syncing"></a>

Consented users can sync their existing credentials to a contract using `syncCredentialsToContract`.

```mermaid
sequenceDiagram
    participant Consenter as Contract Consenter
    participant API as LearnCloud Network API
    participant Owner as Contract Owner

    Consenter->>API: syncCredentialsToContract
    Note right of Consenter: Includes termsUri and credentials by category

    API->>API: Verify terms ownership
    API->>API: Update terms with synced credentials
    API->>API: Create sync transaction
    API->>Owner: Notify of synced credentials
    API-->>Consenter: Return success
```

Credential syncing allows:

1. Sharing existing credentials with contract owners
2. Organizing credentials by categories defined in the contract
3. Controlling exactly which credentials are shared

The sync process:

1. Verify the terms exist and belong to the requesting user
2. Ensure terms are still live (not withdrawn or expired)
3. Update the terms by adding the synced credentials to the shared arrays
4. Create a 'sync' transaction with the categorized credentials
5. Notify the contract owner
