# Usage Examples

This page provides common usage examples for the **LearnCloud Storage API**, so you can quickly see how to store, retrieve, and manage verifiable data objects like credentials, presentations, and metadata.

Each example is standalone and self-explanatory. Scroll, copy, and paste what you need.

> ✅ All examples assume:
>
> * You have a **valid LearnCloud JWT** (via auth or delegation)
> * You’re storing data on behalf of a user identified by a **DID**
> * You’re using the endpoint: `https://cloud.learncard.com/api`

***

### 🔐 Authentication

All requests require:

* `Authorization: Bearer <your-JWT>`
* The JWT must resolve to a DID matching the stored object owner, unless delegated.

***

## Storage

### 📤 Store a Credential or Presentation

**Endpoint:** `POST https://cloud.learncard.com/storage/store`\
**Description:** Stores a VC, VP, or JWE, and returns a `lc:cloud:cloud.learncard.com/trpc:credential:id` URI for later access.

#### Request

```http
POST /storage/store
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "item": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential"],
    "issuer": "did:key:xyz...",
    "credentialSubject": {
      "id": "did:key:abc...",
      "achievement": "Quickstart Achievement"
    }
  }
}
```

#### Response

```json
"lc:cloud:cloud.learncard.com/trpc:credential:1234"
```

***

### 📥 Resolve a Stored Item by URI

**Endpoint:** `GET https://cloud.learncard.com/storage/resolve/{uri}`\
**Description:** Fetches an encrypted, stored credential or presentation from its URI.

#### Request

```http
GET /storage/resolve/lc:cloud:cloud.learncard.com/trpc:credential:1234
Authorization: Bearer <JWT>
```

#### Response

```json
{
  "protected": "eyJlbmMiOiJ...",
  "recipients": [...],
  "iv": "...",
  "ciphertext": "...",
  "tag": "..."
}
```

> Returns the encrypted JWE for the stored credential or presentation.

***

### 📦 Batch Resolve Stored Items

**Endpoint:** `POST https://cloud.learncard.com/storage/resolve/batch`\
**Description:** Resolves multiple credential URIs in a single call.

#### Request

```json
POST /storage/resolve/batch
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "uris": [
    "lc:cloud:cloud.learncard.com/trpc:credential:1",
    "lc:cloud:cloud.learncard.com/trpc:credential:2",
    "lc:cloud:cloud.learncard.com/trpc:credential:3"
  ]
}
```

#### Response

```json
[
  {
    "protected": "...",
    "recipients": [...],
    "iv": "...",
    "ciphertext": "...",
    "tag": "..."
  },
  {
    "protected": "...",
    "recipients": [...],
    "iv": "...",
    "ciphertext": "...",
    "tag": "..."
  },
  null
]
```

> ⚠️ If a URI is invalid or not found, `null` is returned for that entry.

***

### ✅ Quick Tips

| Action          | Endpoint                 | Method | Returns                   |
| --------------- | ------------------------ | ------ | ------------------------- |
| Store VC/VP/JWE | `/storage/store`         | POST   | URI of stored item        |
| Resolve 1 item  | `/storage/resolve/{uri}` | GET    | Encrypted JWE             |
| Resolve many    | `/storage/resolve/batch` | POST   | Array of JWE/null results |

* Always encrypt before sending to the API
* Use returned URIs as persistent identifiers
* Batch resolve to reduce network overhead

## Indexing

### 🧾 How the Index Stores Credential Metadata

The LearnCard **index** is used to securely store metadata about credentials you’ve issued or received. It doesn't store the full credential itself—instead, it stores a reference (`uri`) to the credential (which is stored separately in LearnCloud Storage) along with optional metadata fields.

Each entry is encrypted as a JWE object and stored as a `CredentialRecord`.

#### Unencrypted Format (Before Encryption)

```ts
type CredentialRecord = {
  id: string;            // Internal ID
  uri: string;           // Reference to the stored credential (e.g. "lc:cloud:cloud.learncard.com/trpc:credential:1234")
  [key: string]: any;    // Custom metadata fields (e.g. tags, labels, timestamps)
}
```

#### Encrypted Format (Submitted to `/index/add`, etc.)

```ts
{
  encryptedRecord: { /* JWE */ },
  fields: ["uri", "tags", "created"] // Metadata fields included in the encrypted payload
}
```

> This encrypted object becomes the payload for the index API (e.g., `/index/add`, `/index/get`). LearnCard decrypts it on read and uses it to support search, sync, and filtered queries—without exposing sensitive data.

### 📄 Get Credential Records Index

**Endpoint:** `POST https://cloud.learncard.com/index/get`\
**Description:** Query your CredentialRecords index with pagination, sorting, and optional filtering.

#### Request

```http
POST /index/get
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "limit": 25,
  "query": { "type": "EducationCredential" },
  "encrypt": true,
  "sort": "newestFirst",
  "includeAssociatedDids": true
}
```

#### Response

```json
{
  "records": [
    {
      "id": "abc123",
      "did": "did:key:xyz...",
      "cursor": "cursorValue",
      "created": "2024-05-01T12:00:00Z",
      "modified": "2024-05-01T12:00:00Z"
    }
  ],
  "hasMore": false,
  "cursor": "cursorValue"
}
```

Returns a paginated list of credential records or a JWE if encryption is enabled.

***

### 🔢 Count Credential Records

**Endpoint:** `POST https://cloud.learncard.com/index/count`\
**Description:** Count the number of credential records matching a query.

#### Request

```http
POST /index/count
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "query": { "type": "EducationCredential" },
  "encrypt": true,
  "includeAssociatedDids": true
}
```

#### Response

```json
42
```

or

```json
{ /* JWE object */ }
```

Returns either a plain number or encrypted JWE containing the count.

***

### ➕ Add a Credential Record

**Endpoint:** `POST https://cloud.learncard.com/index/add`\
**Description:** Add a new credential record to the user's index.

#### Request

```http
POST /index/add
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "record": { /* JWE object + fields: z.string().array() */ }
}
```

#### Response

```json
true
```

Returns `true` if the record was successfully added.

***

### ➕➕ Add Many Credential Records

**Endpoint:** `POST https://cloud.learncard.com/index/addMany`\
**Description:** Add multiple credential records in one request.

#### Request

```http
POST /index/addMany
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "records": [
    {
      /* JWE object */
    },
    {
      /* JWE object */
    }
  ]
}
```

#### Response

```json
true
```

Returns `true` if all records were successfully added.

***

### ✏️ Update a Credential Record

**Endpoint:** `PATCH https://cloud.learncard.com/index/{id}`\
**Description:** Update a credential record by its internal ID.

#### Request

```http
PATCH /index/abc123
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "id": "abc123",
  "updates": {
    /* JWE object updates */
  }
}
```

#### Response

```json
true
```

Returns `true` if the record was successfully updated.

***

### ❌ Delete a Credential Record

**Endpoint:** `DELETE https://cloud.learncard.com/index/{id}`\
**Description:** Delete a specific credential record by ID.

#### Request

```http
DELETE /index/abc123
Authorization: Bearer <JWT>
```

#### Response

```json
true
```

Returns `true` if the record was deleted.

***

### 🧹 Delete All Credential Records

**Endpoint:** `DELETE https://cloud.learncard.com/index`\
**Description:** Delete all credential records for the authenticated user.

#### Request

```http
DELETE /index
Authorization: Bearer <JWT>
```

#### Response

```json
true
```

Returns `true` if all records were removed.

## xAPI Statements

### 📤 Send an xAPI Statement

**Endpoint:** `POST https://cloud.learncard.com/xapi/statements`\
**Description:** Send a structured learning event to LearnCloud, using the "Actor - Verb - Object" format.

#### Request

```http
POST /xapi/statements
Authorization: Bearer <JWT>
X-Experience-API-Version: 1.0.3
X-VP: <JWT>
Content-Type: application/json
```

```json
{
  "actor": {
    "objectType": "Agent",
    "name": "did:key:abc123...",
    "account": {
      "homePage": "https://www.w3.org/TR/did-core/",
      "name": "did:key:abc123..."
    }
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/attempted",
    "display": {
      "en-US": "attempted"
    }
  },
  "object": {
    "id": "http://yourgame.com/activities/level-1-challenge",
    "definition": {
      "name": { "en-US": "Level 1 Challenge" },
      "description": { "en-US": "First challenge of the game" },
      "type": "http://adlnet.gov/expapi/activities/simulation"
    }
  }
}
```

Returns `200 OK` on success. No response body is returned unless there is an error.

### ✅ Best Practices

* Use the **same DID** in `actor.name` and `actor.account.name`
* Always set `X-VP` header with your JWT
* Use **standard verbs** like `attempted`, `completed`, `mastered`, `demonstrated`
* Use **real or resolvable URIs** for `object.id` (or consistent mock URLs)
* Test with dummy statements before production

### 📖 Read xAPI Statements

**Endpoint:** `GET https://cloud.learncard.com/xapi/statements`\
**Description:** Retrieve xAPI statements associated with the authenticated user's DID.

***

#### 🔍 Basic Query

```http
GET /xapi/statements?agent={actor}
Authorization: Bearer <JWT>
X-Experience-API-Version: 1.0.3
X-VP: <JWT>
```

```ts
const actor = {
  objectType: "Agent",
  name: userDid,
  account: {
    homePage: "https://www.w3.org/TR/did-core/",
    name: userDid
  }
};

const query = new URLSearchParams({
  agent: JSON.stringify(actor)
});

const response = await fetch(`https://cloud.learncard.com/xapi/statements?${query}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-Experience-API-Version': '1.0.3',
    'X-VP': jwt
  }
});

const data = await response.json();
```

Returns a list of xAPI statements for the user.

***

#### 🔎 Filtered Query Example

```http
GET /xapi/statements?agent={...}&verb={...}&since={...}
```

```ts
const filterParams = new URLSearchParams({
  agent: JSON.stringify(actor),
  verb: "http://adlnet.gov/expapi/verbs/completed",
  since: "2024-03-01T00:00:00Z",
  until: "2024-03-31T23:59:59Z",
  limit: "10"
});

const response = await fetch(`https://cloud.learncard.com/xapi/statements?${filterParams}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-Experience-API-Version': '1.0.3',
    'X-VP': jwt
  }
});
```

Filters results by verb and date range.

***

#### 🔁 Paginated Fetching

```ts
let more = "";
const getPage = async (moreUrl = "") => {
  const url = moreUrl || `https://cloud.learncard.com/xapi/statements?${filterParams.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Experience-API-Version': '1.0.3',
      'X-VP': jwt
    }
  });
  const data = await response.json();
  processStatements(data.statements);
  return data.more || null;
};

more = await getPage();
while (more) {
  more = await getPage(more);
}
```

***

#### 🧪 Security Notes

* ✅ You can only query **your own statements** unless using delegated access.
* ❌ A `401` means:
  * Invalid or expired JWT
  * DID mismatch between JWT and `actor`
  * Missing `X-VP` header

***

#### 🤝 Delegated Access

To allow another party to query your statements:

1. **Issue a delegate credential**
2. **Wrap it in a presentation**
3. **Sign it into a JWT**
4. **Use it in the `X-VP` header**

```ts
const delegateCredential = await userA.invoke.issueCredential({
  type: 'delegate',
  subject: userB.id.did(),
  access: ['read']
});

const unsignedPresentation = await userB.invoke.newPresentation(delegateCredential);
const delegateJwt = await userB.invoke.issuePresentation(unsignedPresentation, {
  proofPurpose: 'authentication',
  proofFormat: 'jwt'
});
```

***

#### 🧼 Voiding a Statement

You can void a previously sent statement by its ID.

```ts
const voidStatement = {
  actor,
  verb: {
    id: "http://adlnet.gov/expapi/verbs/voided",
    display: { "en-US": "voided" }
  },
  object: {
    objectType: "StatementRef",
    id: "original-statement-id"
  }
};

await fetch(`https://cloud.learncard.com/xapi/statements`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Experience-API-Version': '1.0.3',
    'X-VP': jwt
  },
  body: JSON.stringify(voidStatement)
});
```

> ⚠️ You can only void statements **you originally submitted**.

***

#### 🧠 Best Practices for Querying

* Use `limit`, `since`, and `verb` to keep results efficient
* Use `activity`, `ascending`, or `format=ids` for advanced querying
