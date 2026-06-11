# Verifiable Data in ConsentFlow

ConsentFlow contracts can now read and share verifiable data from **My Skill Profile**. This gives contract owners a way to access the learner’s profile fields as consented, structured data instead of treating them as a single generic category.

## Supported fields

The supported My Skill Profile categories are:

-   **Goals**
-   **Professional Title**
-   **Role Experience**
-   **Work Experience**
-   **Pay Rate**
-   **Work Life Balance**
-   **Job Stability**
-   **Self-Assigned Skills**

These categories use the canonical `CredentialCategoryEnum` keys in contracts and app code.

## What each category contains

| Category               | Typical data shape                                            | Notes                                       |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| `Goals`                | `{ goals: string[] }`                                         | Freeform learner goals                      |
| `Professional Title`   | `{ professionalTitle: string }`                               | The learner’s current or desired title      |
| `Role Experience`      | `{ lifetimeExperience: { years?: number; months?: number } }` | Time spent in a role                        |
| `Work Experience`      | `{ selectedCredentialUris: string[] }`                        | Selected work experience credentials        |
| `Pay Rate`             | `{ salary: string; salaryType: 'per_hour' \| 'per_year' }`    | Stored as a simple rate object              |
| `Work Life Balance`    | `{ workLifeBalance: string }`                                 | Saved choice from the My Skill Profile flow |
| `Job Stability`        | `{ jobStability: string }`                                    | Saved choice from the My Skill Profile flow |
| `Self-Assigned Skills` | Boost credential with aligned skill names                     | Displayed from the boost alignment targets  |

## Configuring a contract

Add the categories you want to share under `read.credentials.categories`. The category names must match the canonical names used by the app.

```json
{
    "read": {
        "credentials": {
            "shareAll": true,
            "sharing": true,
            "categories": {
                "Goals": {
                    "shareAll": true,
                    "sharing": true,
                    "shared": []
                },
                "Professional Title": {
                    "shareAll": true,
                    "sharing": true,
                    "shared": []
                },
                "Role Experience": {
                    "shareAll": true,
                    "sharing": true,
                    "shared": []
                },
                "Work Experience": {
                    "shareAll": true,
                    "sharing": true,
                    "shared": []
                },
                "Pay Rate": {
                    "shareAll": true,
                    "sharing": true,
                    "shared": []
                },
                "Work Life Balance": {
                    "shareAll": true,
                    "sharing": true,
                    "shared": []
                },
                "Job Stability": {
                    "shareAll": true,
                    "sharing": true,
                    "shared": []
                },
                "Self-Assigned Skills": {
                    "shareAll": true,
                    "sharing": true,
                    "shared": []
                }
            }
        }
    }
}
```

### Notes

-   `shareAll: true` lets the contract sync the full category.
-   `sharing: true` keeps the category eligible for sync.
-   The `shared` array is populated by ConsentFlow when the learner syncs their data to the contract.

## Reading the data in an app

The LearnCard app now prefetches the supported categories for ConsentFlow. A simplified example looks like this:

```tsx
import { useConsentFlowCredentials } from './useConsentFlowCredentials';

const { mappedCredentials } = useConsentFlowCredentials(contractDetails);

const goalCredentials = mappedCredentials['Goals'] ?? [];
const selfAssignedSkills = mappedCredentials['Self-Assigned Skills'] ?? [];
```

For in-app summaries, the Skill Profile flow also reads the underlying verifiable data record with `useVerifiableData()` and renders a category-specific summary.

## Reading the shared data locally

For local testing, the ConsentFlow REPL includes helper functions to inspect the synced data and the full credentials behind each URI. This script assumes the full app is being run locally via docker.

```ts
await readVerifiableDataSummary();
await readUri(uri);
```

Use `readVerifiableDataSummary()` to inspect the shared data at a glance, and `readUri(uri)` to inspect the full credential payload.

## Why this matters

This support lets ConsentFlow contracts expose the learner’s skill profile data in a structured way, so contract owners can request only the fields they need and learners keep control over what gets shared.
