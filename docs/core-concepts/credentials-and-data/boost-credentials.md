---
description: >-
  Boosts are a core concept in the LearnCard Network that represent templates
  for credentials, achievements, or badge
---

# Boost Credentials

## What is a Boost?

A Boost is LearnCard's enhanced version of a standard Verifiable Credential (VC). It extends the Open Badges v3 and W3C Verifiable Credentials standards by adding useful features for credential display, management, and governance while maintaining full compatibility with standard credential verifiers.

Think of a Boost as a "VC+" - all the standard credential fields you expect, plus additional capabilities that make credentials more useful and manageable in real-world applications.

They can be:

1. Created with customizable properties
2. Organized in hierarchical structures (parent-child relationships)
3. Issued to recipients
4. Managed with fine-grained permissions

{% embed url="https://www.figma.com/board/DPGBfPLlss2K6KmDLCN3ul/LearnCard-Docs?node-id=130-192&p=f&t=fk1wywzjUFmakXJE-0" %}

## Why Use Boosts?

Boosts solve several common challenges when working with credentials:

1. **Display Control**: Customize how credentials appear in wallets and viewers
2. **Governance**: Define and enforce rules about who can issue what credentials
3. **Network Validation**: Get network-level verification that a credential was issued following proper procedures
4. **Extended Functionality**: Support for additional features like BoostIDs for identity verification

```mermaid
graph TD
    subgraph "Boost Lifecycle"
        create["Create Boost"]
        publish["Publish Boost"]
        issue["Issue to Recipients"]
        claim["Claim Boost"]
    end

    create --> publish
    publish --> issue
    issue --> claim

    subgraph "Boost Relationships"
        parent["Parent Boost"]
        child1["Child Boost 1"]
        child2["Child Boost 2"]
        recipient1["Recipient 1"]
        recipient2["Recipient 2"]
        admin["Admin Profile"]
    end

    parent --> child1
    parent --> child2
    child1 -.-> recipient1
    child2 -.-> recipient2
    admin -.-> parent
```



## Boost Hierarchies & Relationships

Boosts can have various relationships with other entities in the system:

#### Hierarchical Relationships <a href="#hierarchical-relationships" id="hierarchical-relationships"></a>

Boosts can be organized in a hierarchical structure:

1. **Parent-Child**: A Boost can have parent and child Boosts
2. **Siblings**: Boosts that share the same parent
3. **Familial**: The extended family of Boosts (parents, children, siblings)

These relationships allow for organizing credentials into families or pathways.

#### Administrative Relationships <a href="#administrative-relationships" id="administrative-relationships"></a>

1. **Admins**: Profiles that have administrative permissions over a Boost
2. **Recipients**: Profiles that have received/been issued a Boost
3. **Creator**: The original profile that created the Boost

### Example Hierarchy

{% embed url="https://www.figma.com/board/DPGBfPLlss2K6KmDLCN3ul/LearnCard-Docs?node-id=39-103&t=lcJjTVXMncZvOYSu-1" %}

Our system uses a clear parent-child relationship between badges:

* **Martial Arts** is the top-level parent badge
  * **Black Belt** is a child of Martial Arts
    * **Brown Belt** is a child of Black Belt
      * Additional belts follow in sequence (indicated as "n + 1")
  * **Self-Defense Expert** is another child of Martial Arts (sibling to Black Belt)

#### Role-Based Permissions

Two key roles exist in the system:

* **Admin**: Has top-level permissions to manage the entire badge system
* **Coach**: Has permissions to issue specific badges to students

#### Credential Issuance Process

1. An admin (like "Admin Urmila") with "admin" role permissions manages the badge hierarchy
2. The admin grants "coach" role permissions to instructors (like "Coach J")
3. Coach J can then create credential instances of badges they're authorized to issue
4. When a student (like "Student P") earns a badge, Coach J issues a specific credential instance (e.g., "Brown Belt for Student P")
5. This credential is then linked directly to Student P's profile

#### Key Relationships

* **PARENT\_OF**: Establishes the badge hierarchy
* **HAS\_PERMISSIONS**: Links roles to users
* **INSTANCE\_OF**: Connects a specific credential to its badge type
* **ISSUED\_TO**: Associates a credential with a student profile

This hierarchical structure ensures proper badge progression while maintaining clear permissions for who can issue credentials.

## Boost Lifecycle

### Creation <a href="#creation" id="creation"></a>

Boosts can be created in two ways:

1. **Create a new Boost**: Create a standalone Boost
2. **Create a Child Boost**: Create a Boost as a child of an existing Boost

When creating a Boost, you can specify:

* The credential template
* Metadata such as name, category, and type
* Default claim permissions



```mermaid
sequenceDiagram
    participant Client
    participant Brain as "LearnCloud Network API"
    participant DB as "Neo4j Database"

    Client->>Brain: createBoost(credential, metadata)
    Brain->>DB: createBoost(credential, profile, metadata)
    DB-->>Brain: boost.id
    Brain-->>Client: boostUri

    Client->>Brain: createChildBoost(parentUri, credential, metadata)
    Brain->>DB: getBoostByUri(parentUri)
    DB-->>Brain: parentBoost
    Brain->>DB: canProfileCreateChildBoost(profile, parentBoost)
    DB-->>Brain: boolean
    Brain->>DB: createBoost(credential, profile, metadata)
    DB-->>Brain: childBoost
    Brain->>DB: setBoostAsParent(parentBoost, childBoost)
    Brain-->>Client: childBoostUri
```

### Publishing and Updating <a href="#publishing-and-updating" id="publishing-and-updating"></a>

Boosts have two status states:

* **DRAFT**: Can be edited freely
* **LIVE**: Only metadata can be updated

When a Boost is published (status changed to LIVE), its core properties are finalized and cannot be changed. This ensures that issued credentials based on this Boost maintain their integrity.

### Sending to Recipients <a href="#sending-to-recipients" id="sending-to-recipients"></a>

Boosts can be sent to recipients, which creates a credential instance for that recipient. This requires:

1. The sender to have permission to issue the Boost
2. The Boost to be in LIVE status (not DRAFT)

The system checks permissions, creates a credential, sends it to the recipient, and optionally notifies them.

```mermaid
sequenceDiagram
    participant Sender
    participant Brain as "boosts.sendBoost"
    participant Boost
    participant Recipient

    Sender->>Brain: sendBoost(profileId, boostUri, credential)
    Brain->>Boost: getBoostByUri(uri)
    Boost-->>Brain: boost

    Brain->>Brain: canProfileIssueBoost(profile, boost)

    Note over Brain: Check if DRAFT (not allowed)

    Brain->>Brain: sendBoost(from, to, boost, credential)
    Brain->>Recipient: Notification (optional)
    Brain-->>Sender: credentialUri
```

### Claiming <a href="#claiming" id="claiming"></a>

Recipients have the option to accept/claim Boosts that have been sent to them. When a Boost is claimed:

1. A credential received relationship is created
2. The default claim permissions are applied, if specified
3. The recipient may gain certain permissions over the Boost

## Boost Permission Model <a href="#boost-permission-model" id="boost-permission-model"></a>

The Boost permission system is comprehensive, allowing fine-grained control over who can perform different actions on Boosts. Permissions can be:

* Directly assigned to profiles
* Inherited through the Boost hierarchy
* Granted when claiming a Boost
* Applied by default to all authenticated users via `defaultPermissions`

### Permission Properties <a href="#permission-properties" id="permission-properties"></a>

Boost permissions include:

| Permission                   | Type    | Description                                           |
| ---------------------------- | ------- | ----------------------------------------------------- |
| role                         | string  | Role identifier                                       |
| canEdit                      | boolean | Can edit the Boost metadata                           |
| canIssue                     | boolean | Can issue the Boost to recipients                     |
| canRevoke                    | boolean | Can revoke issued Boosts                              |
| canManagePermissions         | boolean | Can manage permissions of the Boost                   |
| canIssueChildren             | string  | Permission level for issuing child Boosts             |
| canCreateChildren            | string  | Permission level for creating child Boosts            |
| canEditChildren              | string  | Permission level for editing child Boosts             |
| canRevokeChildren            | string  | Permission level for revoking child Boosts            |
| canManageChildrenPermissions | string  | Permission level for managing child Boost permissions |
| canManageChildrenProfiles    | boolean | Can manage profiles related to child Boosts           |
| canViewAnalytics             | boolean | Can view analytics for the Boost                      |

```mermaid
graph TD
    subgraph "Profile Access Levels"
        creator["Creator"]
        admin["Admin"]
        issuer["Issuer"]
        viewer["Viewer"]
        anyUser["Any Authenticated User"]
    end

    subgraph "Permission Types"
        direct["Direct Permissions"]
        inherited["Inherited Permissions"]
        claim["Claim Permissions"]
        default["Default Permissions"]
    end

    creator -->|"has"| direct
    admin -->|"has"| direct
    anyUser -->|"receives"| default

    direct -->|"defines"| canEdit
    direct -->|"defines"| canIssue
    direct -->|"defines"| canManagePermissions
    default -->|"grants"| canIssue
    default -->|"grants"| canEdit
    default -->|"grants"| canViewAnalytics

    subgraph "Permission Propagation"
        parent["Parent Boost Permissions"]
        child["Child Boost Permissions"]
    end

    parent -->|"influences via canCreateChildren"| child
    parent -->|"influences via canEditChildren"| child
    parent -->|"influences via canIssueChildren"| child
```



### Permission Administration <a href="#permission-administration" id="permission-administration"></a>

The system provides several endpoints for managing permissions:

1. **Add Boost Admin**: Grants a profile admin permissions for a Boost
2. **Remove Boost Admin**: Removes admin permissions
3. **Get Boost Admins**: Lists all admin profiles for a Boost
4. **Get Boost Permissions**: Gets permissions for a specific profile
5. **Update Boost Permissions**: Updates permissions for a profile

### Default Permissions <a href="#default-permissions" id="default-permissions"></a>

`defaultPermissions` allow you to grant permissions to **all authenticated users** on a Boost without explicitly assigning roles. This is useful for creating "open" Boosts where anyone can perform certain actions.

#### Use Cases

* **Open Issuance**: Allow anyone to issue credentials from a Boost (e.g., community badges)
* **Collaborative Editing**: Enable any authenticated user to edit the Boost
* **Transparent Analytics**: Grant everyone access to view analytics

#### Setting Default Permissions

When creating or updating a Boost, you can specify `defaultPermissions`:

```typescript
// Create a Boost that anyone can issue
const boostUri = await learnCard.invoke.createBoost(credential, {
  name: 'Community Badge',
  defaultPermissions: {
    canIssue: true,           // Anyone can issue this Boost
    canViewAnalytics: true,   // Anyone can view analytics
  },
});
```

#### Updating Default Permissions

Default permissions can be updated on published Boosts:

```typescript
// Add canEdit permission to existing Boost
await learnCard.invoke.updateBoost(boostUri, {
  defaultPermissions: {
    canIssue: true,
    canEdit: true,
  },
});
```

#### Supported Permissions

The following permissions can be set via `defaultPermissions`:

| Permission           | Description                                      |
| -------------------- | ------------------------------------------------ |
| canIssue             | Allows any user to issue the Boost to recipients |
| canEdit              | Allows any user to edit the Boost metadata       |
| canRevoke            | Allows any user to revoke issued credentials     |
| canManagePermissions | Allows any user to manage Boost permissions      |
| canViewAnalytics     | Allows any user to view Boost analytics          |

{% hint style="info" %}
**Permission Precedence**: Explicit role permissions are merged with default permissions. If a user has both an explicit role and default permissions apply, they receive the combined set of permissions.
{% endhint %}

#### Example: Community-Issued Badge

```typescript
// Create a Boost that anyone in the community can issue
const communityBadgeUri = await learnCard.invoke.createBoost(
  {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json',
      'https://ctx.learncard.com/boosts/1.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    name: 'Community Helper Badge',
    issuer: 'did:web:community.example.com',
    credentialSubject: {
      type: ['AchievementSubject'],
      achievement: {
        type: ['Achievement'],
        name: 'Community Helper',
        description: 'Recognized for helping others in the community',
        criteria: { narrative: 'Awarded by any community member' },
      },
    },
  },
  {
    name: 'Community Helper Badge',
    category: 'Social Badge',
    defaultPermissions: {
      canIssue: true,  // Any authenticated user can issue this badge
    },
  }
);

// Now any authenticated user can issue this badge to others
await anyUser.invoke.sendBoost('recipient-profile-id', communityBadgeUri, signedCredential);
```

## Boost Queries <a href="#boost-queries" id="boost-queries"></a>

The system supports complex querying of Boosts with a flexible query language, allowing filtering by:

* String properties (exact match)
* Array inclusion (`$in` operator)
* Regular expression patterns (`$regex` operator)

```typescript
// Example query structure
const query = {
  category: "Education",              // Exact match
  type: { $in: ["Badge", "Certificate"] },  // Array inclusion
  name: { $regex: /introduction/i }   // Regex pattern
};
```

The query system is powered by a Neo4j database and includes helper functions for converting JavaScript query objects to Neo4j-compatible formats.

## Dynamic Templates with Mustache

Boosts support **dynamic templating** using Mustache-style variables (`{{variableName}}`). This allows you to create reusable credential templates where specific values are injected at the time of issuance.

### Why Use Dynamic Templates?

Dynamic templates solve a common challenge: you want to issue credentials that share the same structure but contain personalized data for each recipient. Instead of creating a new Boost for each variation, you create one template and provide the unique data when sending.

**Use cases include:**
- **Personalized certificates**: Include the recipient's name, completion date, or score
- **Course completions**: Dynamic course name, grade, or instructor
- **Event attendance**: Event date, location, or session details
- **Achievement levels**: Tier, points earned, or ranking

### Creating a Templated Boost

Define your Boost credential with Mustache variables where you want dynamic values:

```typescript
const templatedCredential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json',
    'https://ctx.learncard.com/boosts/1.0.3.json',
  ],
  type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
  issuer: 'did:web:example.com',
  name: 'Certificate for {{courseName}}',
  credentialSubject: {
    id: 'did:example:recipient',
    type: ['AchievementSubject'],
    achievement: {
      id: 'urn:uuid:123',
      type: ['Achievement'],
      achievementType: 'Course',
      name: '{{courseName}} - {{level}}',
      description: 'Awarded to {{studentName}} for completing {{courseName}}',
      criteria: {
        narrative: 'Complete the {{courseName}} course with grade {{grade}}.',
      },
    },
  },
};

// Create the boost template
const boostUri = await learnCard.invoke.createBoost(templatedCredential, {
  name: 'Course Completion Certificate',
  category: 'Education',
});
```

### Sending with Template Data

When sending the Boost, provide the `templateData` object to fill in the variables:

```typescript
// Send the boost with personalized data
const result = await learnCard.invoke.send({
  type: 'boost',
  recipient: 'recipient-profile-id',
  templateUri: boostUri,
  templateData: {
    courseName: 'Web Development 101',
    level: 'Beginner',
    studentName: 'Alice Smith',
    grade: 'A',
  },
});
```

The resulting credential will have all `{{variableName}}` placeholders replaced with the corresponding values from `templateData`.

### Using sendBoost with Template Data

You can also use the `sendBoost` method directly:

```typescript
const credentialUri = await learnCard.invoke.sendBoost(
  'recipient-profile-id',
  boostUri,
  {
    encrypt: true,
    templateData: {
      courseName: 'Advanced TypeScript',
      level: 'Advanced',
      studentName: 'Bob Johnson',
      grade: 'A+',
    },
  }
);
```

### Template Behavior

| Scenario | Behavior |
| -------- | -------- |
| Variable in template, value provided | Variable is replaced with the value |
| Variable in template, value missing | Variable is replaced with empty string |
| No variables in template | Template is used as-is (backwards compatible) |
| `templateData` provided, no variables | Data is ignored, template used as-is |

{% hint style="info" %}
**Missing Variables**: If a variable in the template is not provided in `templateData`, Mustache renders it as an empty string. This is the expected default behavior and allows for optional fields.
{% endhint %}

### Example: Event Attendance with Dynamic Date

```typescript
// Create a templated event attendance boost
const eventBoostUri = await learnCard.invoke.createBoost({
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json',
  ],
  type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
  issuer: 'did:web:events.example.com',
  name: '{{eventName}} Attendance',
  credentialSubject: {
    id: 'did:example:recipient',
    type: ['AchievementSubject'],
    achievement: {
      type: ['Achievement'],
      name: '{{eventName}} - {{eventDate}}',
      description: 'Attended {{eventName}} on {{eventDate}} at {{location}}',
      criteria: { narrative: 'Present at the event venue' },
    },
  },
}, { name: 'Event Attendance Template' });

// Issue to multiple attendees with the same event data
const attendees = ['alice', 'bob', 'charlie'];
for (const profileId of attendees) {
  await learnCard.invoke.send({
    type: 'boost',
    recipient: profileId,
    templateUri: eventBoostUri,
    templateData: {
      eventName: 'Tech Conference 2025',
      eventDate: 'January 15, 2025',
      location: 'San Francisco, CA',
    },
  });
}
```

{% hint style="success" %}
**Backwards Compatibility**: Existing Boosts without Mustache variables continue to work exactly as before. You can safely add `templateData` to any `send` or `sendBoost` call—if there are no variables in the template, the data is simply ignored.
{% endhint %}

## Types of Boosts

### Basic Boost

The simplest form of a boost adds display options to a standard credential:

```javascript
{
  type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
  // Standard VC fields...
  display: {
    backgroundColor: "#353E64",
    backgroundImage: "https://example.com/background.jpg",
    displayType: "badge" // or "certificate"
  }
}
```

{% hint style="info" %}
**Use Display Types**:

* `badge` for compact achievements
* `certificate` for formal credentials
{% endhint %}

### ID Boost

Special type for creating digital IDs with custom styling:

```javascript
{
  type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential", "BoostID"],
  // ... standard fields
  boostID: {
    IDIssuerName: "Organization Name",
    accentColor: "#FF0000",
    backgroundImage: "https://example.com/id-background.jpg",
    dimBackgroundImage: true,
    fontColor: "#FFFFFF",
    issuerThumbnail: "https://example.com/logo.png",
    showIssuerThumbnail: true
  }
}
```

### Network Certification

When a Boost is issued through the LearnCard Network, it gets wrapped in a CertifiedBoostCredential:

```javascript
{
  type: ["VerifiableCredential", "CertifiedBoostCredential"],
  issuer: "did:web:network.learncard.com",
  boostCredential: {
    // Your original boost here
  },
  boostId: "lc:network:example.com/boost:123"
}
```

This wrapper:

* Validates the issuer's authority to send the boost
* Provides a unique network identifier
* Adds a network-level signature
* Maintains the original peer-to-peer signatures

### Further Resources

* [W3C Verifiable Credentials Standard](https://www.w3.org/TR/vc-data-model/)
* [Open Badges v3 Specification](https://www.imsglobal.org/spec/ob/v3p0/)
* [JSON-LD Playground](https://json-ld.org/playground/)
