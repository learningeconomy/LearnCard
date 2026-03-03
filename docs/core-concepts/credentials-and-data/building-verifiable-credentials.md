# Building Verifiable Credentials

A Verifiable Credential (VC) in LearnCard is a JSON document that follows the W3C Verifiable Credentials Data Model. This guide explains how to construct the JSON structure for various types of credentials.

### Basic Structure

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/vc/status-list/2021/v1"
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
      },
      "validFrom": "2023-01-01T00:00:00Z",
      "validUntil": "2026-01-01T00:00:00Z"
    }
  }
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
    "https://w3id.org/security/suites/ed25519-2020/v1"
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
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
    "https://example.org/contexts/skills.json"
  ],
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "credentialSubject": {
    "id": "did:example:recipient123",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://example.org/skills/001",
      "type": ["Achievement"],
      "name": "Advanced JavaScript Programming",
      "description": "Demonstrated advanced JavaScript programming skills",
      "criteria": {
        "narrative": "Successfully completed advanced programming assessments"
      }
    },
    "skills": [
      {
        "id": "https://example.org/skills/js-async",
        "name": "Asynchronous JavaScript",
        "proficiencyLevel": "Advanced"
      },
      {
        "id": "https://example.org/skills/js-frameworks",
        "name": "JavaScript Frameworks",
        "proficiencyLevel": "Intermediate"
      }
    ]
  }
}
```

#### 6. Learning Pathway Completion

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/vc/status-list/2021/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
    "https://example.org/contexts/pathways.json"
  ],
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "credentialSubject": {
    "id": "did:example:learner456",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://example.org/pathways/fullstack",
      "type": ["Achievement"],
      "name": "Full Stack Developer Pathway",
      "description": "Completed the full stack developer learning pathway"
    },
    "pathway": {
      "id": "https://example.org/pathways/fullstack",
      "name": "Full Stack Developer",
      "totalModules": 6,
      "completedModules": 6,
      "completionDate": "2023-06-15"
    }
  }
}
```

#### 7. Attendance Credential

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/vc/status-list/2021/v1"
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
    "https://w3id.org/vc/status-list/2021/v1"
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
    "membershipLevel": "Professional",
    "validFrom": "2023-01-01T00:00:00Z",
    "validUntil": "2023-12-31T23:59:59Z"
  }
}
```

### Best Practices

1. Always include the core W3C VC context
2. Use specific types that match your credential purpose
3. Include only necessary fields to keep credentials compact
4. Ensure all custom fields are properly defined in contexts
5. Remember that LearnCard will add issuance date and issuer DID automatically

For detailed examples of different credential types, see the examples section above.
