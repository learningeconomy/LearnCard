https://partners.commonapp.org/

## Current Endpoint Findings Summary

Based on the currently visible Swagger docs, the exposed Common App Partner APIs do not appear to provide enough direct write endpoints to fully support the original “prefill Common App application fields from LearnCard credentials” goal.

### 1. Auth API

Useful for:

-   authenticating an applicant with username/password
-   receiving `token` and `refreshToken`
-   refreshing access tokens for future requests

This supports the connection layer, but not prefill by itself.

### 2. Applicant API

Useful for:

-   resolving applicant identity/details
-   retrieving applicant/application status
-   getting FERPA status/date
-   generating FERPA link
-   retrieving counselor info
-   overriding applicant high school CEEB code
-   deactivating applicant ↔ partner connection

Open questions:

-   Where does `requestId` come from?
-   Is `requestId` generated during a Common App partner connection flow?
-   Does `/ferpaLink` produce the requestId needed for `/Connect/details/{requestId}`?
-   Does the applicant explicitly complete FERPA consent, or does Common App handle consent as part of the partner flow?
-   Are there additional private endpoints for writing applicant profile/application fields?

### 3. Data Catalog API

Appears to be partner-scoped.

Useful for:

-   fetching Common App member colleges
-   fetching deadlines/application requirement metadata
-   managing high school partner integration via CEEB code
-   retrieving high schools associated with the partner

This can support college discovery/search at a high level, but does not appear to expose rich program/major/GPA/pathway recommendation data.

### 4. Recommender API

Appears to be partner/institution workflow scoped.

Useful for:

-   inviting teachers/counselors
-   assigning recommenders to applicants/colleges
-   saving/submitting recommender forms
-   saving/submitting counselor reports
-   checking form status
-   retrieving preview/submitted PDFs

This supports counselor/teacher recommendation and report workflows, but does not support learner-facing college recommendation logic.

## Big Finding

The currently exposed APIs seem stronger for:

-   Common App account/auth connection
-   applicant status visibility
-   FERPA/consent workflows
-   counselor/recommender workflows
-   school/partner integration management
-   college catalog/deadline discovery

than for:

-   directly pre-filling full Common App application fields
-   writing education/course/activity/honor sections from LearnCard credentials
-   submitting complete applicant application data

## Feasibility Takeaway

The original LearnCard connector vision is still directionally valid, but the currently visible endpoint surface does not confirm the main prefill use case.

The strongest next step is to ask Common App whether partner access includes additional private applicant write/prefill endpoints, or whether prefill is handled through a different integration flow not shown in these Swagger docs.
