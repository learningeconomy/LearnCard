// Real export from MIT's Learner Credential Wallet — LC-1905 acceptance fixture.
// A VerifiablePresentation wrapping a single already-signed OpenBadge v3 credential.
export const SHARED_CREDENTIAL_VP = `{
  "@context": [
    "https://www.w3.org/ns/credentials/v2"
  ],
  "type": [
    "VerifiablePresentation"
  ],
  "verifiableCredential": [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      "credentialSubject": {
        "achievement": {
          "criteria": {
            "narrative": "Earners will demonstrate an understanding of key challenges and opportunities in digital credentials by:\\n\\n* Reading two core DCC reports.\\n\\n* Participating in the discussion thread attached to the white paper.\\n\\n* Attending the kickoff event.",
            "type": "Criteria"
          },
          "description": "Earn this badge by diving into the world of digital credentials, exploring their impact on education, workforce development, and interoperability.",
          "id": "urn:uuid:bc3bf149-27ed-4117-a62d-00b73649a275",
          "image": {
            "id": "https://participate.community/img/k/public/758febb-DCC%20Cards%20%286%29.png",
            "type": "Image"
          },
          "name": "Digital Credential Explorer",
          "type": [
            "Achievement"
          ]
        },
        "id": "did:key:z6Mkm8FeBwVH5NbReLLHTEYxrKRT1MzEMytfXmCgz6w23phs",
        "type": [
          "AchievementSubject"
        ]
      },
      "id": "https://participate.community/open-badges/v2/assertions/8a68d122-aa99-4c0f-8cef-3344a5c81a56",
      "issuanceDate": "2025-02-24T17:45:25.514689Z",
      "issuer": {
        "id": "did:web:participate.community",
        "image": {
          "id": "https://participate.community/img/k/public/4a92f18-Badge%20%2839%29.png",
          "type": "Image"
        },
        "name": "Digital Credentials Consortium",
        "type": [
          "Profile"
        ],
        "url": "https://digitalcredentials.mit.edu/"
      },
      "name": "Digital Credential Explorer",
      "proof": [
        {
          "created": "2025-08-05T18:56:47Z",
          "proofPurpose": "assertionMethod",
          "proofValue": "z3oE7NnJhHoQjmqjb9ssf9ysJRR6NLSu8XjwMnezDeK1bGQ3ybroSBjoQDp8UnL8VCv3h9mBPKrdvvFjVwrKbF3A",
          "type": "Ed25519Signature2020",
          "verificationMethod": "did:web:participate.community#z6MkshUuBLUq8B3heEMCNNbxEMadoWSgiDhSt6b2iA9Nozqu"
        }
      ],
      "type": [
        "VerifiableCredential",
        "OpenBadgeCredential"
      ]
    }
  ]
}`;
