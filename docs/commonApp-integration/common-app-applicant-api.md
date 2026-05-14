# Common App Applicant API - Findings

## Overview

The Applicant API appears to expose:

-   Applicant ↔ Partner connection management
-   Applicant detail retrieval
-   FERPA workflow support
-   Counselor/transcript workflow support
-   High school CEEB code management
-   Recommender/application status metadata

Unlike the Data Catalog API, these endpoints appear to be:

```txt
applicant-scoped APIs
```

meaning requests operate on behalf of authenticated Common App applicants.

---

# Relevant Endpoints

## POST /school-code

### Summary

```txt
Override the high school CEEB code
```

### Current Interpretation

Allows a partner to override/update the applicant’s associated high school CEEB code.

### Potential LearnCard Use Cases

-   Align learner credentials/transcripts with correct institution
-   Resolve school mismatches
-   Support CLR 2.0 transcript workflows
-   Enable transcript/recommender routing

### Observed Request

```json
{
    "applicantId": 123,
    "ceebCode": "123456"
}
```

### Important Finding

This strongly suggests:

```txt
Common App tracks applicant ↔ high school relationships using CEEB codes.
```

---

## POST /ferpaLink

### Summary

```txt
Generate FERPA link to redirect applicants to CA FERPA page
```

### Current Interpretation

Generates a FERPA authorization/redirect workflow for the applicant.

### Potential LearnCard Use Cases

-   Consent collection
-   Transcript authorization
-   Recommender/counselor workflows
-   Educational records release workflows

### Important Finding

FERPA participation appears to be a first-class workflow within Common App integrations.

This is highly relevant for:

```txt
LearnCard transcript + credential exchange
```

and likely required before transcript/recommender operations occur.

---

## GET /Connect/details/{requestId}

### Summary

```txt
Get Applicants by RequestId
The Unique link between Applicant and Partner
```

### Current Interpretation

Retrieves applicant identity details associated with a partner connection request.

### Observed Response

```json
{
    "applicantId": 123,
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "..."
}
```

### Important Finding

This endpoint strongly suggests:

```txt
Common App establishes explicit applicant ↔ partner relationships.
```

Potentially:

```txt
LearnCard connector installation
↔ Common App applicant connection
```

### Additional Important Finding

This endpoint appears to function as:

```txt
requestId → applicantId resolver
```

because downstream Applicant API endpoints require `applicantId`.

Potential downstream usage:

```txt
GET /{applicantId}/details
GET /{applicantId}/counselor-Info
PATCH /Connect/{applicantId}
POST /school-code
```

### Open Question: Source of requestId

The current Swagger surface does not explain where `requestId` originates.

Possible sources:

-   FERPA workflow
-   partner connection flow
-   Common App redirect/callback flow
-   connector installation handshake
-   applicant authorization flow

Unknowns:

-   Which endpoint generates requestId?
-   Is requestId temporary or persistent?
-   Is requestId single-use?
-   Does requestId represent:
    -   applicant auth
    -   FERPA authorization
    -   partner connection
    -   all of the above?

### Current Assumption

Most likely flow:

```txt
Applicant connects LearnCard
→ Common App creates partner connection request
→ LearnCard receives requestId
→ LearnCard resolves requestId into applicantId
→ LearnCard uses applicantId for downstream Applicant APIs
```

---

## PATCH /Connect/{applicantId}

### Summary

```txt
Update Applicant connect to deactivate status
```

### Current Interpretation

Deactivates/disconnects the applicant ↔ partner relationship.

### Potential LearnCard Use Cases

-   Disconnect LearnCard from Common App
-   Revoke connector access
-   End transcript/recommender relationship

---

## GET /{applicantId}/details

### Summary

```txt
Get detailed applicant information
```

### Current Interpretation

Returns detailed applicant/application metadata.

### Observed Metadata

Applicant metadata:

-   firstName
-   lastName
-   dateOfBirth
-   email
-   schoolCode
-   schoolName
-   FERPA status
-   FERPA acceptance date
-   fee waiver status

Application metadata:

-   colleges applied to
-   deadlines
-   application rounds
-   submission status
-   writing supplement submission status
-   application download status

Recommender metadata:

-   recommenders
-   recommendation forms
-   invitation dates
-   form submission/download status

### Potential LearnCard Use Cases

-   Application status dashboards
-   College application tracking
-   Deadline awareness
-   Recommendation tracking
-   Counselor coordination
-   Learner progress UI

### Important Finding

This endpoint appears highly useful for:

```txt
application tracking + workflow orchestration
```

rather than broad applicant field writing.

---

## GET /{applicantId}/counselor-Info

### Summary

```txt
Enable partners to get counselor information to post transcripts
```

### Current Interpretation

Retrieves counselor/recommender information associated with the applicant.

### Observed Metadata

-   recommenderId
-   counselor name
-   counselor email
-   persona type
-   online status
-   submitted forms

### Potential LearnCard Use Cases

-   Transcript workflows
-   Counselor integration
-   CLR 2.0 transcript submission coordination
-   Recommendation workflows

### Important Finding

This endpoint strongly supports the thesis that:

```txt
Common App expects partner integrations to participate in transcript/recommender workflows.
```

---

## POST /Payment

### Summary

```txt
Updates payment record
```

### Current Interpretation

Appears to support payment gateway callbacks/updates.

### Potential LearnCard Relevance

Likely low relevance for current LearnCard integration scope.

Potential future relevance:

-   application fee workflows
-   fee waiver integrations
-   payment status visibility

---

# Major Architectural Findings

## Applicant API Appears Workflow-Oriented

The current Applicant API surface appears optimized for:

-   applicant connection
-   FERPA workflows
-   counselor/recommender workflows
-   transcript coordination
-   application status tracking

rather than:

```txt
generic CRUD application field prefill APIs
```

---

# Important Limitation

The current Swagger surface does NOT clearly expose:

-   generic applicant profile update APIs
-   education history write APIs
-   coursework write APIs
-   honors/activity write APIs
-   broad application prefill endpoints
-   generic application submission endpoints

---

# Implication for LearnCard

## Supported Integration Direction

The current API surface strongly supports:

```txt
LearnCard as:
- transcript/credential orchestration layer
- counselor workflow participant
- application tracking dashboard
- FERPA-aware credential exchange platform
```

---

## Unclear / Unconfirmed Direction

The current API surface does NOT yet confirm:

```txt
LearnCard can broadly prefill all Common App application fields.
```

This remains an important open question.

---

# Open Questions for Common App

## Applicant Write Capabilities

Unknowns:

-   Are additional write APIs available privately?
-   Is application prefill handled through separate APIs?
-   Are there field-level update endpoints not exposed publicly?
-   Are there restrictions on partner-managed applicant updates?

---

## Transcript Workflow Questions

Unknowns:

-   Can LearnCard directly upload transcripts?
-   Are transcript uploads handled via Recommender APIs?
-   What transcript formats are supported?
-   Can VC/CLR payloads be attached directly?

---

## FERPA Workflow Questions

Unknowns:

-   Is FERPA acceptance required before transcript access?
-   How is FERPA state persisted?
-   Are additional consent flows required?

---

## requestId Lifecycle Questions

Unknowns:

-   Which workflow generates requestId?
-   How is requestId delivered back to LearnCard?
-   Is requestId temporary?
-   Is requestId single-use?
-   Is requestId tied to FERPA authorization?
-   Does requestId expire?
-   Is requestId required before all applicant-scoped API calls?

---

# Security Findings

The Applicant API uses:

```txt
X-API-KEY
Authorization
```

This suggests:

-   authenticated partner access
-   backend-to-backend communication
-   applicant-scoped partner operations

Likely combined with learner-authenticated Common App sessions/tokens.

---

# Current Working Interpretation

Most likely architecture:

```txt
Learner authenticates with Common App
→ LearnCard connector establishes applicant relationship
→ Common App issues requestId
→ LearnCard resolves requestId into applicantId
→ LearnCard retrieves applicant + counselor metadata
→ LearnCard coordinates transcript/recommender workflows
→ LearnCard surfaces application tracking/status
```

while broader application field prefill remains:

```txt
possible but currently unconfirmed
```

based on currently visible API surfaces.
