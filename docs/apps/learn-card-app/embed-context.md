---
description: LearnCard App embedded context review flow for LearnCard Connect integrations
---

# Embedded Context Review

The LearnCard App exposes an embedded context review flow at `/embed/context` for LearnCard Connect partner integrations. This route is designed to run inside the `LearnCardConnect` modal or popup, not as a normal wallet page.

The embedded flow lets a learner sign in, review consented credentials, adjust the selected credentials, and confirm what should be formatted into learner context for the requesting partner app.

## User Flow

```mermaid
flowchart TD
    A[Partner app opens LearnCard Connect] --> B[/embed/context loads]
    B --> C{Learner signed in?}
    C -->|No| D[Login inside iframe]
    C -->|Yes| E[Load consented credentials]
    D --> E
    E --> F[Show review screen]
    F --> G{Learner choice}
    G -->|Confirm selected credentials| H[Format learner context]
    G -->|Deselect all| I[Disable confirm]
    G -->|Cancel| J[Return CANCELLED]
    H --> K[Return SUCCESS to partner app]
```

## What Learners See

On the review screen, learners can:

- See which credentials were preselected from their existing consent.
- Add or remove credentials from their wallet before sharing.
- Toggle all credentials or a category of credentials.
- Confirm the selected credentials to generate learner context.
- Cancel the request without sharing data.

If the learner deselects every credential, **Confirm and continue** is disabled. If the confirm handler is reached with zero credentials through any defensive/runtime edge case, the host receives a `NO_CREDENTIALS_SELECTED` response.

## Embedded App Chrome

The route hides normal LearnCard App navigation and sidebar chrome so the iframe remains focused on review and consent. The route is also excluded from the standard navbar visibility rules.

## Host Responses

The route posts terminal responses to the parent window or popup opener using the `LEARNCARD_V1` protocol:

| Type | Code | Meaning |
|------|------|---------|
| `SUCCESS` | — | Learner confirmed selected credentials and context was generated. |
| `ERROR` | `CANCELLED` | Learner cancelled the request. |
| `ERROR` | `NO_CREDENTIALS_SELECTED` | Learner declined to share any credentials. |
| `ERROR` | `INVALID_REQUEST` | Required request parameters were missing. |
| `ERROR` | `FETCH_ERROR` | LearnCard could not load consented data. |
| `ERROR` | `FORMAT_ERROR` | LearnCard could not format learner context. |

## Related Documentation

- [Embed LearnCard Connect](../../how-to-guides/connect-systems/embed-learncard-connect.md)
- [LearnCard Connect SDK Reference](../../sdks/learncard-connect.md)
- [ConsentFlow Overview](../../core-concepts/consent-and-permissions/consentflow-overview.md)
- [Accessing Consented Data](../../core-concepts/consent-and-permissions/accessing-consented-data.md)
