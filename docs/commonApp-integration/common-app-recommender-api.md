# Common App Recommender API - Findings

## Overview

The Recommender API appears to expose workflows for managing teacher and counselor recommendation materials.

This API supports:

-   inviting recommenders
-   assigning recommenders to applicants/colleges
-   saving recommender profile answers
-   saving recommender form answers
-   submitting/unsubmitting forms
-   checking form statuses
-   retrieving preview/submitted PDF URLs
-   moving/deleting invitations

This API is highly relevant to:

```txt
LearnCard transcript + counselor + recommender workflows
```

but it is not a college recommendation/discovery API.

---

# Major Finding

The term `Recommender API` does not mean:

```txt
recommend colleges to applicants
```

It means:

```txt
manage Common App recommenders:
- teachers
- counselors
- recommendations
- reports
- school forms
- fee waivers
```

So in the LearnCard integration, this API should be categorized under:

```txt
counselor / transcript / recommendation workflow support
```

not learner-facing college recommendations.

---

# Relevant Endpoint Groups

## Teacher Workflows

### Invite Teacher

```txt
POST /teacher/invite
```

Invites a teacher recommender for an applicant.

Observed request data includes:

-   applicantId
-   teacher email
-   firstName
-   lastName
-   title
-   subject

Potential LearnCard use cases:

-   allow an applicant/school workflow to invite a teacher
-   connect teacher recommendation flow to Common App
-   track teacher recommendation readiness

---

### Remove Teacher Invitation

```txt
DELETE /teacher/invite/{applicantId}/{recommenderId}
```

Removes an invitation between an applicant and teacher.

---

### Assign / Unassign Teacher

```txt
POST /teacher/assign
DELETE /teacher/assign/{applicantId}/{recommenderId}/{memberId}
```

Assigns or removes a teacher recommendation for a specific college/member.

Observed identifiers:

-   applicantId
-   recommenderId
-   memberId

Important implication:

```txt
Teacher recommendations can be assigned per college/member.
```

---

### Save Teacher Profile

```txt
POST /teacher/profile
```

Saves teacher recommender profile answers.

Observed request pattern:

```json
{
    "recommenderId": 123,
    "answers": [
        {
            "questionId": 456,
            "response": "..."
        }
    ]
}
```

---

### Save Teacher Recommendation

```txt
POST /teacher/recommendation
```

Saves answers for teacher recommendation form.

Observed request pattern:

```json
{
    "applicantId": 123,
    "recommenderId": 456,
    "answers": [
        {
            "questionId": 789,
            "response": "..."
        }
    ]
}
```

Important implication:

```txt
Common App recommender forms are questionId/response driven.
```

---

### Submit / Unsubmit Teacher Recommendation

```txt
POST /teacher/submit/recommendation
DELETE /teacher/submit/recommendation
```

Submits or un-submits teacher recommendation forms.

Observed request:

```json
{
    "applicantId": 123,
    "recommenderId": 456
}
```

---

### Teacher Form Status

```txt
GET /teacher/{recommenderId}/form-status/{applicantId}
```

Returns form status for a teacher recommender and applicant.

Potential LearnCard use cases:

-   recommendation tracking UI
-   school/counselor dashboard
-   applicant application readiness checklist

---

### Teacher Recommendation PDFs

```txt
GET /teacher/{recommenderId}/{applicantId}/{memberId}/recommendation/preview-pdf
GET /teacher/{recommenderId}/{applicantId}/{memberId}/recommendation/submitted-pdf
```

Returns preview/submitted PDF URLs for teacher recommendation forms.

Potential LearnCard use cases:

-   preview before submission
-   audit submitted materials
-   confirmation UX

---

# Counselor Workflows

## Invite / Remove Counselor

```txt
POST /counselor/invite
DELETE /counselor/invite/{applicantId}/{recommenderId}
```

Invites or removes a counselor recommender.

Potential LearnCard use cases:

-   connect applicant with school counselor
-   enable counselor-side transcript workflow
-   coordinate school report / fee waiver / recommendation forms

---

## Save Counselor Profile

```txt
POST /counselor/profile
```

Saves counselor profile answers.

---

## Save Counselor Forms

The API exposes save endpoints for multiple counselor form types:

```txt
POST /counselor/secondary-report
POST /counselor/recommendation
POST /counselor/optional-report
POST /counselor/optional-report-2
POST /counselor/midyear-report
POST /counselor/final-report
POST /counselor/fee-waiver
POST /counselor/early-decision
POST /counselor/early-decision2
```

These endpoints save answers before final submission.

Observed request pattern:

```json
{
    "applicantId": 123,
    "recommenderId": 456,
    "answers": [
        {
            "questionId": 789,
            "response": "..."
        }
    ]
}
```

Important implication:

```txt
Common App counselor forms are also questionId/response driven.
```

---

## Submit / Unsubmit Counselor Forms

The API exposes submit/unsubmit endpoints for multiple counselor forms:

```txt
POST /counselor/submit/secondary-report
DELETE /counselor/submit/secondary-report

POST /counselor/submit/recommendation
DELETE /counselor/submit/recommendation

POST /counselor/submit/optional-report
DELETE /counselor/submit/optional-report

POST /counselor/submit/optional-report-2
DELETE /counselor/submit/optional-report-2

POST /counselor/submit/midyear-report
DELETE /counselor/submit/midyear-report

POST /counselor/submit/final-report
DELETE /counselor/submit/final-report

POST /counselor/submit/fee-waiver

POST /counselor/submit/early-decision
POST /counselor/submit/early-decision2
```

Important implication:

```txt
The API supports full lifecycle management for counselor-side Common App forms.
```

---

## Counselor Form Status

```txt
GET /counselor/{recommenderId}/form-status/{applicantId}
```

Returns counselor form status for an applicant.

Potential LearnCard use cases:

-   transcript/recommendation status tracking
-   counselor dashboard
-   student checklist progress
-   application readiness state

---

## Counselor PDF Preview / Submitted URLs

The API exposes preview and submitted PDF endpoints for several counselor form types:

```txt
secondary-report
recommendation
optional-report
optional-report-2
midyear-report
final-report
fee-waiver
early-decision
early-decision2
```

Example patterns:

```txt
GET /counselor/{recommenderId}/{applicantId}/secondary-report/preview-pdf
GET /counselor/{recommenderId}/{applicantId}/secondary-report/submitted-pdf

GET /counselor/{recommenderId}/{applicantId}/recommendation/preview-pdf
GET /counselor/{recommenderId}/{applicantId}/recommendation/submitted-pdf
```

Some forms also require:

```txt
memberId
```

which likely ties the form to a specific college/member.

Potential LearnCard use cases:

-   preview documents before submission
-   confirmation of submitted materials
-   audit trail for counselor workflows
-   surface expiring PDF URLs to authorized users

---

# General Recommender Endpoints

## Get Recommender Profile by Email

```txt
GET /profile/{email}
```

Returns recommender profile by email.

Observed response includes:

-   recommender id
-   firstName
-   lastName
-   high school CEEB code
-   online status

Potential LearnCard use cases:

-   check whether counselor/teacher already exists in Common App
-   resolve recommenderId before invite/assign workflows
-   map school staff to Common App recommender profiles

---

## Update Recommender Profile

```txt
PATCH /
```

Updates recommender profile using JSON Patch.

Potential LearnCard use case:

-   update recommender profile metadata if partner-authorized

---

## Delete Invitations

```txt
DELETE /invite
DELETE /external-invites/{applicantId}
```

Supports deleting recommender invitations, including external invitations.

Potential LearnCard use cases:

-   clean up stale invitations
-   revoke incorrect counselor/teacher connections
-   reset applicant recommender setup

---

## Move Counselor Invitations

```txt
POST /counselor/move-invitations
```

Moves invitations from one counselor to another.

Potential LearnCard use cases:

-   counselor reassignment
-   school staff changes
-   operational admin support

---

# Key Data Model Findings

## applicantId

Used throughout the Recommender API to identify the applicant.

Likely obtained from:

```txt
GET /Connect/details/{requestId}
```

or other applicant connection workflows.

---

## recommenderId

Used throughout the Recommender API to identify teacher/counselor recommenders.

Can likely be obtained via:

```txt
GET /profile/{email}
```

or invite responses.

---

## memberId

Used when a form/recommendation is associated with a specific Common App member college.

Likely obtained from:

```txt
GET /datacatalog/colleges
```

or applicant detail responses.

---

## questionId / response

Form saving is modeled as:

```json
{
    "questionId": 123,
    "response": "..."
}
```

This means LearnCard would need access to Common App form/question definitions to safely map credential data into form answers.

Current Swagger does not clearly expose a form-definition endpoint.

---

# LearnCard Integration Implications

## Strongly Supported

The Recommender API strongly supports:

```txt
LearnCard as a counselor/recommender workflow tool
```

Potential features:

-   invite counselor/teacher recommenders
-   assign recommenders to colleges
-   save recommendation/report answers
-   submit counselor and teacher forms
-   check form statuses
-   preview submitted PDFs
-   surface application readiness checklist

---

## Relevant to CLR 2.0 Transcript Flow

The most relevant counselor form appears to be:

```txt
secondary-report
```

because Common App school reports are often where transcript/school academic context is handled.

This aligns with the earlier Applicant API endpoint:

```txt
GET /{applicantId}/counselor-Info
```

which explicitly says it enables partners to get counselor information to post transcripts.

---

# Important Limitations / Open Questions

## Transcript Upload Format

The API exposes form answer submission and PDF preview/submission URLs, but it does not clearly show:

```txt
direct transcript upload endpoint
```

Open questions:

-   Where does the actual transcript file/payload get attached?
-   Does the secondary report include transcript submission?
-   Are transcripts uploaded through form answers?
-   Is there another private endpoint for transcript upload?
-   Are CLR 2.0 payloads accepted directly?
-   Are PDFs required?

---

## Form Definition Discovery

The API accepts `questionId` values but does not clearly expose:

```txt
GET form questions
GET form schema
GET allowed values
GET validation rules
```

Open questions:

-   How does LearnCard know which questionIds to answer?
-   Are form definitions static?
-   Are questionIds documented elsewhere?
-   Are they partner-specific, school-specific, applicant-specific, or year-specific?

---

## Permission Model

The API supports counselor/teacher actions.

Open questions:

-   Can LearnCard submit on behalf of counselors/teachers?
-   Does the counselor/teacher need their own Common App login?
-   Does FERPA need to be completed first?
-   Does the high school need to be opted into LearnCard?
-   What prevents a partner from submitting forms without school approval?

---

# Current Working Interpretation

The Recommender API is the clearest evidence that Common App partner APIs support an institutional workflow.

Most likely architecture:

```txt
Applicant connects LearnCard
→ FERPA authorization completed
→ LearnCard resolves applicantId
→ LearnCard resolves/invites counselor or teacher recommender
→ LearnCard saves form answers
→ counselor/teacher reviews
→ LearnCard submits forms to Common App
→ LearnCard tracks statuses and submitted PDFs
```

This API does not support college recommendations.

Instead:

```txt
Data Catalog API
= college/member discovery

Recommender API
= counselor/teacher recommendation and report workflows
```
