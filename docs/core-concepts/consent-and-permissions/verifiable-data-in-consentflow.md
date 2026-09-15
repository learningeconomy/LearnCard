# Verifiable Data in ConsentFlow

A learner's **My Skills Profile** — goals, title, experience, pay expectations, self-assessed skills — is stored as verifiable data in their LearnCard. A consent contract can ask for it field by field, so a career platform or tutor can read exactly what the learner agreed to share, as structured data.

## Supported fields

The supported My Skill Profile categories are:

- **Goals**
- **Professional Title**
- **Role Experience**
- **Work Experience**
- **Pay Rate**
- **Work Life Balance**
- **Job Stability**
- **Self-Assigned Skills**

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

- `shareAll: true` lets the contract sync the full category.
- `sharing: true` keeps the category eligible for sync.
- The `shared` array is populated by ConsentFlow when the learner syncs their data to the contract.

## Reading it from your platform

Once a user has consented, their shared fields show up in their consented data like any other category: each record's `credentials` array holds `{ category, uri }` pairs. Resolve the URI and the structured data is in `credentialSubject.dataPayload`. Two things to remember: the learner chooses which credential URIs to share under each category, and if the credential was stored encrypted, your platform's DID must be one of its encryption recipients — consent to a category does not by itself grant decryption.

<!-- snippet: understand/read-verifiable-data.mjs -->

```javascript
import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, USER_DID, CONTRACT_URI } = process.env;

const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });

// 1. Is this user's consent still live? Never read without checking.
const profile = await learnCard.invoke.getProfile(USER_DID);
const consented =
    profile && (await learnCard.invoke.verifyConsent(CONTRACT_URI, profile.profileId));
if (!consented) throw new Error('No active consent');

// 2. Fetch what they shared, keeping only records for this contract.
const { records } = await learnCard.invoke.getConsentFlowDataForDid(USER_DID, { limit: 100 });
const mine = records.filter(record => record.contractUri === CONTRACT_URI);

// 3. Resolve the Pay Rate credential(s) and read the structured payload.
for (const { category, uri } of mine.flatMap(record => record.credentials)) {
    if (category !== 'Pay Rate') continue;

    const vc = await learnCard.read.get(uri);
    console.log(JSON.stringify(vc.credentialSubject.dataPayload));
}
```

<!-- /snippet -->

Gate every read on `verifyConsent(contractUri, profileId)` first — see [Reading & Writing Consented Data](writing-consented-data.md).
