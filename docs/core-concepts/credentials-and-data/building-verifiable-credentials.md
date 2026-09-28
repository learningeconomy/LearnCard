# Building Verifiable Credentials

A Verifiable Credential (VC) in LearnCard is a JSON document that follows the W3C Verifiable Credentials Data Model. This guide explains how to construct the JSON structure for various types of credentials.

### Basic Structure

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://schema.org/"
    ],
    "type": ["VerifiableCredential"],
    "credentialSubject": {
        "id": "did:example:recipient123",
        "name": "Credential Subject Name"
    }
}
```

**Note:** LearnCard automatically injects the `issuanceDate` and `issuer` fields when you call `learnCard.invoke.issueCredential()`.

### Examples by Use Case

#### 1. Basic Educational Achievement

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential"],
    "credentialSubject": {
        "id": "did:example:recipient123",
        "type": ["AchievementSubject"],
        "achievement": {
            "id": "https://example.org/achievements/123",
            "type": ["Achievement"],
            "name": "Introduction to Blockchain",
            "description": "Successfully completed the introduction to blockchain course",
            "criteria": {
                "narrative": "The recipient demonstrated understanding of blockchain fundamentals"
            }
        }
    }
}
```

#### 2. Professional Certification

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential"],
    "credentialSubject": {
        "id": "did:example:recipient123",
        "type": ["AchievementSubject"],
        "achievement": {
            "id": "https://example.org/certifications/456",
            "type": ["Achievement"],
            "name": "Certified Web Developer",
            "description": "Professional certification in web development",
            "criteria": {
                "narrative": "Demonstrated proficiency in HTML, CSS, JavaScript, and modern frameworks"
            }
        }
    },
    "issuanceDate": "2023-01-01T00:00:00Z",
    "expirationDate": "2026-01-01T00:00:00Z"
}
```

#### 3. Digital Badge with Evidence

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential"],
    "credentialSubject": {
        "id": "did:example:recipient123",
        "type": ["AchievementSubject"],
        "achievement": {
            "id": "https://example.org/badges/789",
            "type": ["Achievement"],
            "name": "Data Science Contributor",
            "description": "Recognized for contributing to community data science projects",
            "criteria": {
                "narrative": "Completed 5 data analysis projects and shared results with the community"
            },
            "image": {
                "id": "https://example.org/badges/789/image",
                "type": "Image"
            }
        }
    },
    "evidence": [
        {
            "id": "https://example.org/evidence/123",
            "type": ["Evidence"],
            "name": "Project Portfolio",
            "description": "Collection of completed data science projects",
            "url": "https://example.org/portfolio/123"
        }
    ]
}
```

#### 4. Employment Credential

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1",
        "https://schema.org/",
        "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "type": ["VerifiableCredential", "EmploymentCredential"],
    "credentialSubject": {
        "id": "did:example:employee123",
        "type": ["Person"],
        "name": "Alex Johnson",
        "jobTitle": "Senior Software Engineer",
        "worksFor": {
            "type": ["Organization"],
            "name": "Example Tech Inc.",
            "location": "San Francisco, CA"
        },
        "startDate": "2021-03-15"
    }
}
```

#### 5. Skill Assessment

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential"],
    "credentialSubject": {
        "id": "did:example:recipient123",
        "type": ["AchievementSubject"],
        "achievement": {
            "id": "https://example.org/skills/001",
            "type": ["Achievement"],
            "achievementType": "Competency",
            "name": "Advanced JavaScript Programming",
            "description": "Demonstrated advanced JavaScript programming skills",
            "criteria": {
                "narrative": "Successfully completed advanced programming assessments"
            },
            "alignment": [
                {
                    "type": ["Alignment"],
                    "targetName": "Asynchronous JavaScript",
                    "targetUrl": "https://example.org/skills/js-async",
                    "targetType": "Competency",
                    "targetFramework": "Example Skills Framework"
                },
                {
                    "type": ["Alignment"],
                    "targetName": "JavaScript Frameworks",
                    "targetUrl": "https://example.org/skills/js-frameworks",
                    "targetType": "Competency",
                    "targetFramework": "Example Skills Framework"
                }
            ]
        }
    }
}
```

#### 6. Learning Pathway Completion

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential"],
    "credentialSubject": {
        "id": "did:example:learner456",
        "type": ["AchievementSubject"],
        "achievement": {
            "id": "https://example.org/pathways/fullstack",
            "type": ["Achievement"],
            "achievementType": "LearningProgram",
            "name": "Full Stack Developer Pathway",
            "description": "Completed the full stack developer learning pathway",
            "criteria": { "narrative": "Complete all six modules." },
            "resultDescription": [
                {
                    "id": "https://example.org/pathways/fullstack/results/modules",
                    "type": ["ResultDescription"],
                    "name": "Modules completed",
                    "resultType": "Result"
                }
            ]
        },
        "result": [
            {
                "type": ["Result"],
                "resultDescription": "https://example.org/pathways/fullstack/results/modules",
                "value": "6 of 6"
            }
        ]
    }
}
```

#### 7. Attendance Credential

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://schema.org/",
        "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "type": ["VerifiableCredential", "AttendanceCredential"],
    "credentialSubject": {
        "id": "did:example:attendee789",
        "type": ["Person"],
        "name": "Jamie Smith",
        "attended": {
            "type": ["Event"],
            "name": "Blockchain Developer Conference 2023",
            "description": "Annual conference for blockchain developers",
            "startDate": "2023-09-15",
            "endDate": "2023-09-17",
            "location": {
                "type": ["Place"],
                "name": "Tech Convention Center",
                "address": "123 Innovation Blvd, San Francisco, CA"
            }
        },
        "role": "Participant"
    }
}
```

#### 8. Membership Credential

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://schema.org/",
        "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "type": ["VerifiableCredential", "MembershipCredential"],
    "credentialSubject": {
        "id": "did:example:member321",
        "type": ["Person"],
        "name": "Taylor Williams",
        "memberOf": {
            "type": ["Organization"],
            "name": "Professional Developers Association",
            "url": "https://example.org/pda"
        },
        "membershipId": "PDA-98765",
        "membershipLevel": "Professional"
    },
    "issuanceDate": "2023-01-01T00:00:00Z",
    "expirationDate": "2023-12-31T23:59:59Z"
}
```

### Fields that make a credential yours

| You want to…                                       | Add                                                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Change how it's categorized in the recipient's app | `achievement.achievementType` — e.g. `'Certificate'`, `'Course'`, `'Competency'`, `'Badge'` ([all types & categories](achievement-types-and-categories.md)) |
| Show proof of the work                             | `credentialSubject.achievement` stays the same; add a top-level `evidence: [{ id: 'https://…', type: ['Evidence'], name: 'Final project' }]`                |
| Make it expire                                     | `validUntil: '2027-01-01T00:00:00Z'` next to `validFrom`                                                                                                    |
| Add your own fields (score, cohort, instructor…)   | Put them under `credentialSubject` and add a context that defines them                                                                                      |
| Control how it displays in LearnCard               | [Display hint tags](display-hint-tags.md) (`lc:` convention)                                                                                                |

### Alignments: link to external frameworks and registries

The OBv3 `achievement.alignment` array says "this achievement corresponds to entry X in framework Y" — a skills framework, a competency standard, or a credential registry. Verifiers, registries, and hiring tools use it to recognize your credential without a bespoke integration. Each entry names the framework, the target, and where to look it up:

```json
{
    "alignment": [
        {
            "type": ["Alignment"],
            "targetName": "Front-End Web Development",
            "targetUrl": "https://example.org/frameworks/web-dev/FE-101",
            "targetType": "Competency",
            "targetCode": "FE-101",
            "targetFramework": "Example Skills Framework"
        }
    ]
}
```

#### <a id="ctid"></a>Credential Engine Registry (CTID)

The [Credential Engine Registry](https://credentialengine.org/) is a public directory of credential _definitions_. Registering yours gets it a CTID (Credential Transparency Identifier) — `ce-` plus a UUID, e.g. `ce-12345678-1234-5678-9abc-def012345678` (validated with `/^ce-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`). Find it on your credential's page at [credentialfinder.org](https://credentialfinder.org/) or in the Registry's publishing tools.

Adding the CTID as an alignment tells verifiers which registered definition each issued credential is an instance of:

```json
{
    "alignment": [
        {
            "type": ["Alignment"],
            "targetName": "My Credential Name",
            "targetUrl": "https://credentialfinder.org/credential/ce-12345678-1234-5678-9abc-def012345678",
            "targetType": "ceterms:Credential",
            "targetCode": "ce-12345678-1234-5678-9abc-def012345678",
            "targetFramework": "Credential Engine Registry"
        }
    ]
}
```

**No-code path:** The Credential Builder in the Developer Portal has a dedicated CTID field. It automatically generates this alignment entry and round-trips it back into the form when editing. See [Publish Your App](../../how-to-guides/publish-your-app.md) for details.

### Best Practices

1. Start from Open Badges 3.0 (`OpenBadgeCredential` + `AchievementSubject`) unless you have a reason not to. Its vocabulary already covers skills (`alignment`), scores and progress (`result`), evidence, and validity.
2. **Every field must be defined by a context you list.** Signing fails with `undefined JSON-LD term` otherwise. If you need a field OBv3 doesn't have, add `https://schema.org/` (for `name`, `description`, `startDate`…) or `https://www.w3.org/2018/credentials/examples/v1` (for VC 1.0 example terms) — or publish your own context and list it.
3. Prefer `alignment` over inventing a `skills` array; prefer `result` over inventing a `score` field. Other wallets will understand the first and ignore the second.
4. Include only what the credential needs. Smaller credentials are easier to display and verify.
5. `issueCredential()` fills in `issuer` and the issuance date if you leave them out.
