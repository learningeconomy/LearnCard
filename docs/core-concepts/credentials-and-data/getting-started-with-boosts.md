# Getting Started with Boosts

#### Prerequisites

* Node.js environment
* Basic knowledge of Verifiable Credentials and JSON-LD
* LearnCard SDK installed in your project

```bash
npm install @learncard/init
```

#### Setup Your LearnCard Instance

First, initialize the LearnCard SDK:

```javascript
import { initLearnCard } from '@learncard/init';

// Initialize LearnCard with a seed for key generation
const learnCard = await initLearnCard({ 
  seed: 'your-secure-seed-value',
  network: true 
});
```

### Creating a Basic Boost Credential

Let's start with creating a simple Boost Credential:

```javascript
// Define credential issuer and subject
const issuerDID = 'did:web:network.learncard.com:users:issuer-example';
const subjectDID = 'did:web:network.learncard.com:users:example';

// Create a basic Boost Credential
const basicBoostCredential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
    "https://ctx.learncard.com/boosts/1.0.0.json",
  ],
  "credentialSubject": {
    "achievement": {
      "achievementType": "Badge",
      "criteria": {
        "narrative": "This badge is awarded for demonstrating teamwork skills."
      },
      "description": "Recognizes excellence in team collaboration.",
      "id": "urn:uuid:" + crypto.randomUUID(), // Generate a unique ID
      "image": "https://example.com/badge-images/teamwork.png",
      "name": "Team Player",
      "type": [
        "Achievement"
      ]
    },
    "id": subjectDID,
    "type": [
      "AchievementSubject"
    ]
  },
  "display": {
    "backgroundColor": "#4285F4",
    "displayType": "badge"
  },
  "image": "https://example.com/badge-images/teamwork.png",
  "issuanceDate": new Date().toISOString(),
  "issuer": issuerDID,
  "name": "Team Player Badge",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential",
    "BoostCredential"
  ]
};

// Sign the credential to verify you created it correctly
const signedCredential = await learnCard.invoke.issueCredential(basicBoostCredential);

// Now you have a verifiable Boost Credential that can be shared with the recipient
console.log(JSON.stringify(signedCredential, null, 2));
```

### Customizing Display Options

Boost Credentials allow for extensive display customization. Here's how to enhance your credential's visual appearance:

```javascript
// Enhanced display options
const enhancedDisplayCredential = {
  // Include the same base fields as the basic example
  ...basicBoostCredential,
  
  // Add enhanced display options
  "display": {
    "backgroundColor": "#673AB7", // Purple background
    "backgroundImage": "https://example.com/images/pattern.jpg",
    "displayType": "certificate", // Options: award, certificate, id
    "fadeBackgroundImage": true,
    "repeatBackgroundImage": false,
    "emoji": {
      "names": ["trophy", "star"],
      "imageUrl": "https://example.com/emojis/trophy.png",
      "unified": "1F3C6"
    }
  }
};

// Sign the enhanced credential
const signedEnhancedCredential = await learnCard.invoke.issueCredential(enhancedDisplayCredential);
```

### Adding Skills Information

For education and workforce credentials, adding skills data helps make the credential more valuable:

```javascript
// Create a credential with skills metadata
const skillsCredential = {
  // Include the same base fields as the basic example
  ...basicBoostCredential,
  
  // Add skills information
  "alignment": [{
        "type":  ["Alignment"],
        "targetName": "Fundamentals of 3D Modeling Certificate",
        "targetUrl": "https:/credentialfinder.org/resources/ce-64d07ada-6659-4097-9bc2-9f1c111b0826",
        "targetDescription": "Additional information powered by the Credential Registry.",
        "targetFramework": "Credential Transparency Description Language",
        "targetCode": "ce-64d07ada-6659-4097-9bc2-9f1c111b0826”
      }]
};

// Sign the credential with skills
const signedSkillsCredential = await learnCard.invoke.issueCredential(skillsCredential);
```

### Adding Attachments

You can enhance a Boost Credential with attachments.

{% hint style="warning" %}
&#x20;Only use if you want to attach elements to a Boost that are not evidence of an achievement. Use [evidence](getting-started-with-boosts.md#adding-evidence-to-boost-credentials) in those instances.
{% endhint %}

```javascript
// Create a credential with attachments
const credentialWithAttachments = {
  // Include the same base fields as the basic example
  ...basicBoostCredential,
  
  // Add attachments
  "attachments": [
    {
      "title": "Project Report",
      "type": "pdf",
      "url": "https://example.com/reports/project123.pdf"
    },
    {
      "title": "Presentation Video",
      "type": "video",
      "url": "https://example.com/videos/presentation.mp4"
    }
  ]
};

// Sign the credential with attachments
const signedCredentialWithAttachments = await learnCard.invoke.issueCredential(credentialWithAttachments);
```

### Creating a BoostID

BoostID extends the credential concept to create digital identity cards with enhanced display properties:

```javascript
// Create a BoostID credential
const boostIDCredential = {
  // Include the same base fields as the basic example
  ...basicBoostCredential,
  
  // Add BoostID specific fields
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential",
    "BoostCredential",
    "BoostID"
  ],
  "boostID": {
    "fontColor": "#FFFFFF",
    "accentColor": "#FF5722",
    "backgroundImage": "https://example.com/images/id-background.jpg",
    "dimBackgroundImage": true,
    "issuerThumbnail": "https://example.com/images/issuer-logo.png",
    "showIssuerThumbnail": true,
    "IDIssuerName": "University of Knowledge",
    "idThumbnail": "https://example.com/images/user-photo.jpg",
    "idBackgroundColor": "#03A9F4",
    "repeatIdBackgroundImage": false,
    "idDescription": "Student ID valid for the 2024-2025 academic year"
  }
};

// Sign the BoostID to verify you created it correctly
const signedBoostID = await learnCard.invoke.issueCredential(boostIDCredential);
```

### Real-world Use Cases

#### Educational Achievement Badges

```javascript
const courseCompletionBadge = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
    "https://ctx.learncard.com/boosts/1.0.0.json",
  ],
  "credentialSubject": {
    "achievement": {
      "achievementType": "Course",
      "criteria": {
        "narrative": "Successfully completed all course requirements with a grade of 85% or higher."
      },
      "description": "Introduction to Web Development with focus on HTML, CSS, and JavaScript.",
      "id": "urn:uuid:" + crypto.randomUUID(),
      "image": "https://example.com/badge-images/web-dev.png",
      "name": "Web Development Fundamentals",
      "type": ["Achievement"]
    },
    "id": "did:web:network.learncard.com:users:student-example",
    "type": ["AchievementSubject"]
  },
  "display": {
    "backgroundColor": "#2196F3",
    "displayType": "badge",
    "emoji": {
      "names": ["computer", "code"],
      "unified": "1F4BB"
    }
  },
  "image": "https://example.com/badge-images/web-dev.png",
  "skills": [
    {
      "skill": "HTML",
      "category": "Front-end Development"
    },
    {
      "skill": "CSS",
      "category": "Front-end Development"
    },
    {
      "skill": "JavaScript",
      "category": "Programming"
    }
  ],
  "issuanceDate": new Date().toISOString(),
  "issuer": "did:web:network.learncard.com:users:university-example",
  "name": "Web Development Fundamentals Certificate",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential",
    "BoostCredential"
  ]
};
```

#### Professional Certification

```javascript
const professionalCertification = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
    "https://ctx.learncard.com/boosts/1.0.0.json",
  ],
  "credentialSubject": {
    "achievement": {
      "achievementType": "Certification",
      "criteria": {
        "narrative": "Passed certification exam with a score of 90% or higher and completed all required practical assessments."
      },
      "description": "Professional certification for data science practitioners covering statistics, machine learning, and data engineering.",
      "id": "urn:uuid:" + crypto.randomUUID(),
      "image": "https://example.com/certifications/data-science.png",
      "name": "Certified Data Scientist",
      "type": ["Achievement"]
    },
    "id": "did:web:network.learncard.com:users:professional-example",
    "type": ["AchievementSubject"]
  },
  "display": {
    "backgroundColor": "#00796B",
    "backgroundImage": "https://example.com/images/data-pattern.jpg",
    "displayType": "certificate",
    "fadeBackgroundImage": true
  },
  "image": "https://example.com/certifications/data-science.png",
  "skills": [
    {
      "skill": "Machine Learning",
      "category": "Data Science",
      "subskills": ["Supervised Learning", "Unsupervised Learning", "Neural Networks"]
    },
    {
      "skill": "Statistical Analysis",
      "category": "Data Science",
      "subskills": ["Hypothesis Testing", "Regression Analysis"]
    },
    {
      "skill": "Data Engineering",
      "category": "Data Science",
      "subskills": ["ETL Processes", "Data Pipelines"]
    }
  ],
  "attachments": [
    {
      "title": "Certification Exam Results",
      "type": "pdf",
      "url": "https://example.com/certifications/results123.pdf"
    }
  ],
  "issuanceDate": new Date().toISOString(),
  "issuer": "did:web:network.learncard.com:users:certifying-body-example",
  "name": "Professional Data Science Certification",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential",
    "BoostCredential"
  ]
};
```

## Adding Evidence to Boost Credentials

Evidence is a crucial component of Open Badge v3 credentials that provides proof or documentation of the achievement. Adding evidence to your Boost Credentials enhances their credibility and value by showing the actual work, assessment, or documentation that supports the credential claim.

#### Understanding Evidence in Open Badge v3

In the Open Badge v3 specification, evidence can be attached to a credential to provide verification of the achievement being recognized. Evidence can include:

* URLs to completed projects
* Assessment results
* Documentation of work performed
* Portfolio items
* Media files demonstrating competency
* Testimonials or evaluations

#### How to Add Evidence to Boost Credentials

Here's how to incorporate evidence into your Boost Credentials:

```javascript
// Create a credential with evidence
const credentialWithEvidence = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
    "https://ctx.learncard.com/boosts/1.0.0.json",
  ],
  "credentialSubject": {
    "achievement": {
      "achievementType": "Certificate",
      "criteria": {
        "narrative": "This certificate is awarded for completing the Advanced Web Development course with a grade of A."
      },
      "description": "Advanced understanding of front-end and back-end web development technologies.",
      "id": "urn:uuid:" + crypto.randomUUID(),
      "image": "https://example.com/badge-images/web-dev-advanced.png",
      "name": "Advanced Web Development",
      "type": ["Achievement"],
    },
    "id": "did:web:network.learncard.com:users:student-example",
    "type": ["AchievementSubject"]
  },
  // Evidence array within the achievement object
  "evidence": [
    {
      "id": "urn:uuid:" + crypto.randomUUID(),
      "type": ["Evidence"],
      "name": "Final Project",
      "description": "E-commerce website built with React and Node.js",
      "narrative": "The student designed and developed a fully functional e-commerce platform with user authentication, product catalog, shopping cart, and payment processing integration.",
      "genre": "Project",
      // URL to the evidence
      "url": "https://github.com/student-example/ecommerce-project"
    },
    {
      "id": "urn:uuid:" + crypto.randomUUID(),
      "type": ["Evidence"],
      "name": "Technical Assessment",
      "description": "Assessment of JavaScript proficiency",
      "narrative": "Scored 95% on a comprehensive assessment covering advanced JavaScript concepts including asynchronous programming, closures, and ES6+ features.",
      "genre": "Assessment",
      "url": "https://example.com/assessment-results/student123"
    }
  ],
  "display": {
    "backgroundColor": "#3F51B5",
    "displayType": "certificate"
  },
  "image": "https://example.com/badge-images/web-dev-advanced.png",
  "issuanceDate": new Date().toISOString(),
  "issuer": "did:web:network.learncard.com:users:university-example",
  "name": "Advanced Web Development Certificate",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential",
    "BoostCredential"
  ]
};

// Sign the credential with evidence
const signedCredentialWithEvidence = await learnCard.issue(credentialWithEvidence);
```

#### Evidence Properties

Each evidence item in the `evidence` array can include the following properties:

* `id`: A unique identifier for the evidence item (required)
* `type`: The type of evidence, typically \["Evidence"] (required)
* `name`: A name or title for the evidence (recommended)
* `description`: A short description of the evidence (recommended)
* `narrative`: A detailed explanation of how this evidence demonstrates the achievement (recommended)
* `genre`: The category or type of evidence (e.g., Project, Assessment, Testimonial)
* `url`: A URL where the evidence can be accessed (recommended)
* `audience`: The intended audience for the evidence

#### Best Practices for Evidence

1. **Be Specific**: Include detailed descriptions and narratives that clearly explain how the evidence demonstrates the achievement.
2. **Ensure Accessibility**: Make sure evidence URLs are accessible to verifiers. Consider access permissions for private repositories.
3. **Diversify Evidence Types**: Include different types of evidence when possible, such as projects, assessments, and testimonials.
4. **Maintain Privacy**: Be mindful of privacy concerns when including evidence. Avoid including sensitive personal information.
5. **Permanence**: Try to use evidence links that will remain accessible long-term. Consider using persistent identifiers or archived versions of web content.

#### Example: Portfolio Evidence

For a credential that recognizes design skills, you might include evidence pointing to portfolio items:

```javascript
"evidence": [
  {
    "id": "urn:uuid:" + crypto.randomUUID(),
    "type": ["Evidence"],
    "name": "Design Portfolio",
    "description": "Collection of UX/UI designs for web and mobile applications",
    "narrative": "The portfolio demonstrates proficiency in user-centered design principles, wireframing, prototyping, and implementation of responsive design patterns.",
    "genre": "Portfolio",
    "url": "https://behance.net/designer-example"
  }
]
```

#### Example: Multiple Evidence Types

For comprehensive credentials, include various types of evidence:

```javascript
"evidence": [
  {
    "id": "urn:uuid:" + crypto.randomUUID(),
    "type": ["Evidence"],
    "name": "Project Repository",
    "description": "GitHub repository for machine learning project",
    "url": "https://github.com/student-example/ml-project"
  },
  {
    "id": "urn:uuid:" + crypto.randomUUID(),
    "type": ["Evidence"],
    "name": "Research Paper",
    "description": "Published paper on novel machine learning approach",
    "url": "https://example.com/journal/paper123.pdf"
  },
  {
    "id": "urn:uuid:" + crypto.randomUUID(),
    "type": ["Evidence"],
    "name": "Instructor Evaluation",
    "description": "Assessment by course instructor",
    "narrative": "This student demonstrated exceptional critical thinking and problem-solving skills throughout the course. Their final project showed innovative application of machine learning techniques to real-world problems.",
    "genre": "Testimonial"
  }
]
```

By including comprehensive evidence in your Boost Credentials, you create more valuable and verifiable credentials that clearly demonstrate the achievement being recognized.

### Best Practices

1. **Security**: Always use a secure method to generate and store your seed value.
2. **Images**: Use high-quality images that meet size requirements for optimal display.
3. **Metadata**: Include detailed and accurate information in credentials to maximize their utility.
4. **Validation**: Test your credentials with the verification method before issuing them at scale.
5. **Privacy**: Only include necessary personal information in credentials to respect privacy.

### Troubleshooting

#### Common Issues

* **Verification Failures**: Ensure all required fields are present and properly formatted.
* **Display Issues**: Check that image URLs are accessible and correctly formatted.
* **Context Errors**: Make sure all context URLs are accessible and valid.

For more assistance, refer to the LearnCard SDK documentation or join the LearnCard community forum.
