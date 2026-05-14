# Common App Data Catalog API - Findings

## Overview

The Common App Data Catalog API appears to expose:

-   Partner ↔ High School integration management
-   High school metadata associated with a partner
-   Active Common App member college metadata
-   College deadlines and application requirements

Unlike the Applicant API, these endpoints appear to be primarily:

```txt
partner-scoped APIs
```

rather than:

```txt
learner/applicant-scoped APIs
```

This is supported by the API security model requiring:

```txt
X-API-KEY
Authorization
```

which strongly suggests authenticated partner access rather than direct learner access.

---

# Relevant Endpoints

## POST /school-integration/{ceebCode}

### Summary

```txt
OptIn HS to partner
```

### Current Interpretation

Associates a high school with the authenticated Common App partner integration using a CEEB code.

Potential meaning:

```txt
Enable this high school for LearnCard/Common App partner workflows.
```

Potential workflows:

-   High school onboarding
-   Transcript exchange enablement
-   Counselor/recommender workflows
-   CLR 2.0 transcript participation

### Open Questions

-   Must schools explicitly approve integrations?
-   Can LearnCard self-register schools?
-   Is approval asynchronous?
-   What permissions does this grant?
-   How are valid CEEB codes discovered?
-   Is there a school discovery endpoint not currently documented?

---

## DELETE /school-integration/{ceebCode}

### Summary

```txt
Opt out HS from Partner
```

### Current Interpretation

Removes a high school from the authenticated partner relationship.

Potential meaning:

```txt
Disable Common App partner workflows for this high school.
```

Potential workflows:

-   School disconnect
-   Partnership removal
-   Transcript exchange revocation

---

## GET /request-status/{requestId}

### Summary

```txt
Get Partner Request Status
```

### Current Interpretation

Checks the status of a previously initiated partner operation.

Likely used for:

-   school integration requests
-   asynchronous approval workflows
-   onboarding processing

### Open Questions

-   Which operations generate request IDs?
-   What statuses exist?
-   Does Common App manually approve integrations?
-   Are schools involved in approval workflows?

---

## GET /my-schools

### Summary

```txt
Get HighSchool details by partner
```

### Current Interpretation

Returns high schools currently associated with the authenticated partner.

This strongly suggests:

```txt
Partners only have access to a subset of schools.
```

rather than global unrestricted access.

### Potential LearnCard Use Cases

-   Show connected schools
-   School onboarding dashboards
-   Counselor/recommender tooling
-   Transcript-enabled institution lists

---

## GET /colleges

### Summary

```txt
Get active Common App member colleges and deadlines
```

### Current Interpretation

Returns metadata for active Common App colleges/members.

Potentially the primary endpoint for:

```txt
college discovery inside LearnCard
```

### Available Metadata

Observed metadata includes:

-   collegeName
-   address/city/state/country
-   website
-   contactEmail
-   ceebCode
-   ipedsCode
-   deadlines
-   decision types
-   transferOnly
-   counselorEvalRequired
-   coursesAndGradesRequired
-   min/max teacher evaluations
-   midYearRequired
-   essay requirement flags
-   writing supplement flags
-   arts supplement flags

---

# Recommendation Architecture Findings

## Likely LearnCard Flow

```txt
Common App Data Catalog API
→ LearnCard backend sync/cache
→ Normalize college metadata
→ LearnCard recommendation engine
→ Learner-facing college discovery UI
```

### Recommendation Inputs

Potential LearnCard recommendation signals:

-   CLR 2.0 transcript
-   academic credentials
-   achievement credentials
-   pathway/interests
-   learner profile
-   location preferences
-   transfer status
-   counselor availability

---

# Important Limitation

Current API surface does NOT clearly expose:

-   majors/programs
-   GPA requirements
-   admissions competitiveness
-   tuition/cost
-   financial aid
-   pathway/career alignment
-   acceptance rates
-   ranking data

This implies LearnCard may need:

-   additional data providers
-   external enrichment
-   internal recommendation logic

to build richer college/program recommendations.

---

# Security Findings

The Data Catalog API appears to use:

```txt
X-API-KEY
Authorization
```

This strongly suggests:

-   server-to-server communication
-   authenticated partner integrations
-   backend-only access patterns

This API does NOT appear intended for direct learner authentication flows.

---

# Proposed Architectural Separation

## Learner-Scoped APIs

Potential learner-scoped APIs:

-   Auth API
-   Applicant API
-   Possibly Recommender API

These APIs likely operate on behalf of authenticated applicants.

---

## Partner-Scoped APIs

Partner-scoped APIs:

-   Data Catalog API
-   School integration APIs
-   College metadata APIs

These APIs likely operate using LearnCard partner credentials.

---

# High-Level Product Interpretation

The Data Catalog API appears to support two major LearnCard use cases:

## 1. College Discovery

```txt
LearnCard recommendation/search experience
powered by Common App member metadata.
```

Potential features:

-   school search
-   deadline awareness
-   recommendation filtering
-   application requirement visibility

---

## 2. Institutional Integration Workflows

```txt
Partner ↔ High School relationship management
```

Potential features:

-   school onboarding
-   transcript enablement
-   counselor/recommender tooling
-   CLR 2.0 participation

---

# Important Open Questions

## School Relationship Model

Unclear from current docs:

-   Do schools need to explicitly opt into LearnCard?
-   Does Common App approve integrations manually?
-   Are schools pre-authorized?
-   Can LearnCard onboard schools independently?
-   What operational/governance workflows exist?

This may significantly impact rollout strategy.

---

# Current Assumption

Most likely model:

```txt
LearnCard becomes an approved Common App partner
→ LearnCard integrates schools via CEEB code
→ schools become associated with LearnCard partner account
→ students from those schools use LearnCard connector workflows
```

However, this assumption requires confirmation with Common App partnership onboarding.
