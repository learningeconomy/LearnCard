# Verifiable Credentials (VCs)

Verifiable Credentials are a W3C standard for expressing credentials in a way that is cryptographically secure, privacy-respecting, and machine-verifiable. They enable trusted digital claims about subjects.

### Verifiable Credential Data Model <a href="#credential-data-model" id="credential-data-model"></a>

LearnCard implements the W3C Verifiable Credentials Data Model, with support for both VC 1.0 and VC 2.0 formats. The core data types are defined using Zod validators.

#### Credential Structure <a href="#credential-structure" id="credential-structure"></a>

```mermaid
graph 
    subgraph "Verifiable Credential"
        VC["Verifiable Credential"]
        VC --> Context["@context"]
        VC --> ID["id"]
        VC --> Type["type"]
        VC --> Issuer["issuer"]
        VC --> IssuanceDate["issuanceDate"]
        VC --> Subject["credentialSubject"]
        VC --> Proof["proof"]

        Subject --> SubjectID["id (DID of subject)"]
        Subject --> Claims["Claims (achievements, skills, etc.)"]

        Proof --> ProofType["type (e.g., Ed25519Signature2020)"]
        Proof --> Created["created"]
        Proof --> VM["verificationMethod"]
        Proof --> Purpose["proofPurpose"]
        Proof --> JWS["jws (signature)"]
    end
```

| Component           | Description                              | Required |
| ------------------- | ---------------------------------------- | -------- |
| `@context`          | JSON-LD contexts defining the vocabulary | Yes      |
| `id`                | Unique identifier for the credential     | No       |
| `type`              | Array of credential types                | Yes      |
| `issuer`            | Entity that issued the credential        | Yes      |
| `credentialSubject` | Entity the credential is about           | Yes      |
| `proof`             | Cryptographic proof of authenticity      | Yes      |

Version differences:

* VC 1.0 uses `issuanceDate` and `expirationDate`
* VC 2.0 uses `validFrom` and `validUntil`

{% @github-files/github-code-block url="https://github.com/learningeconomy/LearnCard/blob/942bb5f7/packages/learn-card-types/src/vc.ts#L129-L177" %}

<br>

## Verifiable Presentations (VPs) <a href="#verifiable-presentations-vps" id="verifiable-presentations-vps"></a>

Verifiable Presentations allow holders to bundle and selectively disclose credentials:

```mermaid
graph 
    subgraph "Verifiable Presentation"
        VP["Verifiable Presentation"]
        VP --> VPContext["@context"]
        VP --> VPID["id"]
        VP --> VPType["type"]
        VP --> Holder["holder"]
        VP --> VCs["verifiableCredential[]"]
        VP --> VPProof["proof"]

        VCs --> VC1["Credential 1"]
        VCs --> VC2["Credential 2"]

        VPProof --> VPProofType["type"]
        VPProof --> VPCreated["created"]
        VPProof --> VPVM["verificationMethod"]
        VPProof --> VPPurpose["proofPurpose"]
        VPProof --> Challenge["challenge (optional)"]
        VPProof --> Domain["domain (optional)"]
        VPProof --> VPJWS["jws (signature)"]
    end
```

