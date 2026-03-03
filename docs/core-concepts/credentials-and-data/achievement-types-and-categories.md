# Schemas, Types, & Categories

## Using Open Badge v3 Contexts

To create a credential following the Open Badge v3 specification:

1.  Include the OB v3 context in your `@context` array:

    ```json
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
    ]
    ```
2.  Add required credential types:

    ```json
    "type": ["VerifiableCredential", "OpenBadgeCredential"]
    ```
3.  Structure your `credentialSubject` with appropriate types:

    ```json
    "credentialSubject": {
      "id": "did:example:recipient123",
      "type": ["AchievementSubject"],
      "achievement": {
        "id": "https://example.org/achievements/123",
        "type": ["Achievement"],
        "name": "Achievement Name",
        "description": "Achievement description",
        "criteria": {
          "narrative": "Description of criteria for earning this achievement"
        }
      }
    }
    ```

### Extending Context with Custom Fields

You can extend the context to add custom fields using two methods:

#### Method 1: Embedded Context

Include custom definitions directly in the credential:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
    {
      "skills": "https://example.org/terms/skills",
      "Skill": "https://example.org/terms/Skill",
      "proficiencyLevel": "https://example.org/terms/proficiencyLevel"
    }
  ],
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "credentialSubject": {
    "id": "did:example:recipient123",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://example.org/achievements/123",
      "type": ["Achievement"],
      "name": "Programming Skills"
    },
    "skills": [
      {
        "type": ["Skill"],
        "name": "JavaScript",
        "proficiencyLevel": "Advanced"
      }
    ]
  }
}
```

#### Method 2: Remote Context

Reference an external context file:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
    "https://example.org/contexts/skills.json"
  ],
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "credentialSubject": {
    "id": "did:example:recipient123",
    "skills": [
      {
        "id": "https://example.org/skills/js",
        "proficiencyLevel": "Advanced"
      }
    ]
  }
}
```

The remote context file (`skills.json`) would define the terms:

```json
{
  "@context": {
    "skills": "https://example.org/terms/skills",
    "Skill": "https://example.org/terms/Skill",
    "proficiencyLevel": {
      "@id": "https://example.org/terms/proficiencyLevel",
      "@type": "xsd:string"
    }
  }
}
```

## Achievement Types & Categories

Our system uses Achievement Types to organize and categorize user credentials. This document explains how to work with standard and custom types and ensure they integrate seamlessly into the platform.

### **Categories We Support**

Our system organizes achievements into predefined categories to ensure they are properly grouped and displayed. Below is the list of supported categories:

<table data-full-width="false"><thead><tr><th>Category</th><th width="201">Identifier</th><th>Description</th></tr></thead><tbody><tr><td><strong>Achievement</strong></td><td><code>Achievement</code></td><td>Generic accomplishments.</td></tr><tr><td><strong>ID</strong></td><td><code>ID</code></td><td>Identifiers such as student or employee IDs.</td></tr><tr><td><strong>Learning History</strong></td><td><code>Learning History</code></td><td>Records of educational achievements.</td></tr><tr><td><strong>Work History</strong></td><td><code>Work History</code></td><td>Records of professional experience.</td></tr><tr><td><strong>Social Badges</strong></td><td><code>Social Badges</code></td><td> Recognition tied to social or community participation.</td></tr><tr><td><strong>Membership</strong></td><td><code>Membership</code></td><td>Memberships in organizations or groups.</td></tr><tr><td><strong>Accomplishment</strong></td><td><code>Accomplishment</code></td><td>Specific completed tasks or goals.</td></tr><tr><td><strong>Accommodation</strong></td><td><code>Accommodation</code></td><td>Support or adjustments made for individuals.</td></tr><tr><td><strong>Family</strong></td><td><code>Family</code></td><td>Recognition tied to family relationships or contributions.</td></tr></tbody></table>

### **Standard Achievement Types**

#### **Overview**

**`Standard AchievementTypes`** are predefined achievement types that do not include the **`ext:`** prefix. These types are sourced directly from the [IMS Global Open Badges v3 AchievementType Enumeration](https://www.imsglobal.org/spec/ob/v3p0/#achievementtype-enumeration). These types are directly recognized by the system and are mapped to predefined categories without additional transformation.&#x20;

Here is the **complete** list of predefined achievement types supported on our platform

<table><thead><tr><th width="384">AchievementType (String)</th><th>Category (String)</th></tr></thead><tbody><tr><td><code>'Achievement'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'Assessment'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'Award'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'Badge'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'Certificate'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'Certification'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'CommunityService'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'Competency'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'Degree'</code></td><td><code>'Achievement'</code></td></tr><tr><td><code>'MicroCredential'</code></td><td><code>'Achievement'</code></td></tr><tr><td></td><td></td></tr><tr><td><code>'License'</code></td><td><code>'ID'</code></td></tr><tr><td></td><td></td></tr><tr><td><code>'Membership'</code></td><td><code>'Membership'</code></td></tr><tr><td></td><td></td></tr><tr><td><code>'ApprenticeShipCertificate'</code></td><td><code>'Work History'</code></td></tr><tr><td><code>'JourneymanCertificate'</code></td><td><code>'Work History'</code></td></tr><tr><td><code>'MasterCertificate'</code></td><td><code>'Work History'</code></td></tr><tr><td></td><td></td></tr><tr><td><code>'Assignment'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'AssociateDegree'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'BachelorDegree'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'CertificateOfCompletion'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'CoCurricular'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'Course'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'Diploma'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'DoctoralDegree'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'FieldWork'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'GeneralEducationDevelopment'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'LearningProgram'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'MasterDegree'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'ProfessionalDoctorate'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'QualityAssuranceCredential'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'ResearchDoctorate'</code></td><td><code>'Learning History'</code></td></tr><tr><td><code>'SecondarySchoolDiploma'</code></td><td><code>'Learning History'</code></td></tr><tr><td></td><td></td></tr></tbody></table>

## Custom Credential Types

**`Custom AchievementTypes`**, include the **`ext:`** prefix and allow for user-defined or external achievements. These custom types must adhere to specific formatting rules.

#### **Rules for Custom Types**

1. **Prefix**: Custom types must begin with **`ext:`**.
2.  **Validation**: Custom types must match the regex:

    ```typescript
    ^([a-zA-Z]+\s*){3,25}$
    ```
3.  **Structure**: Custom types follow this format:

    ```typescript
    ext:LCA_CUSTOM:<CategoryType>:<TransformedAchievementType>
    ```

    Example: `ext:LCA_CUSTOM:Learning History:The_Coolest_Dog`

***

#### **Formatting Logic**

Custom types are formatted using helper functions:

**Capitalize Words**

Converts lowercase strings like `cool cat` to `Cool Cat`:

```typescript
const capitalizeWordsAfterSpace = (str: string): string => {
    return str.replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
};
```

**Replace Spaces with Underscores**

Converts "Cool Cat" to "Cool\_Cat":

```typescript
const replaceWhiteSpacesWithUnderscores = (str: string): string => {
    return str.replace(/\s+/g, '_');
};
```

**Construct the Final Type**

Combines the category and transformed achievement type:

```typescript
const constructCustomType = (categoryType: string, customAchievementType: string) => {
    const capitalized = capitalizeWordsAfterSpace(customAchievementType);
    const transformed = replaceWhiteSpacesWithUnderscores(capitalized);
    return `ext:LCA_CUSTOM:${categoryType}:${transformed}`;
};
```

Example:

```typescript
constructCustomType("Learning History", "The Coolest Dog");
// Output: ext:LCA_CUSTOM:Learning History:The_Coolest_Dog
```

***

#### **Internal Handling of Custom Types**

Custom types are processed internally using the following helper functions:

**Check if a Type is Custom**

This function checks if a given type string contains the **`LCA_CUSTOM`** identifier:

```typescript
export const isCustomType = (str: string): boolean => {
    const regex = /LCA_CUSTOM/;
    const result = regex.test(str);
    return result;
};
```

**Extract Achievement Type from Custom Type**

This function extracts the specific achievement type from a custom type string:

```typescript
export const getAchievementTypeFromCustomType = (str: string) => {
    // ie: str -> "ext:LCA_CUSTOM:Learning History:The_Coolest_Dog";
    const regex = /^((?:[^:]+:){3})([^:]+)/;
    const result = str.match(regex)?.[2]; // "The_Coolest_Dog"
    return result;
};
```

**Extract Category Type from Custom Type**

This function extracts the category type from a custom type string:

```typescript
export const getCategoryTypeFromCustomType = (str: string) => {
    // ie: str -> "ext:LCA_CUSTOM:Learning History:The_Coolest_Dog";
    const regex = /(?:[^:]*:){2}([^:]*)(?::|$)/;
    const result = str.match(regex)?.[1]; // "Learning History"
    return result;
};
```

***

### **FAQ**

**Can I create new categories?**

No, our system only supports the following pre defined categories&#x20;

```typescript
export const CATEGORIES = {    
    Achievement: 'Achievement',
    ID: 'ID',
    LearningHistory: 'Learning History',
    WorkHistory: 'Work History',
    SocialBadge: 'Social Badge',
    Membership: 'Membership',
    Accomplishment: 'Accomplishment',
    Accommodation: 'Accommodation',
    Family: 'Family',
};
```

#### **How do I validate a custom type?**

Use the **`CUSTOM_TYPE_REGEX`** to ensure compliance:&#x20;

```typescript
/^([a-zA-Z]+\s*){3,25}$/;
```

You can also test the formatting of your custom type to ensure it works internally:

1.  **Check if the type is custom:** Use the **`isCustomType`** function:

    ```typescript
    const isCustom = isCustomType('ext:LCA_CUSTOM:Learning History:The_Coolest_Dog');
    console.log(isCustom); // Output: true
    ```
2.  **Extract the achievement type:** Use the **`getAchievementTypeFromCustomType`** function:

    ```typescript
    const achievementType = getAchievementTypeFromCustomType('ext:LCA_CUSTOM:Learning History:The_Coolest_Dog');
    console.log(achievementType); // Output: The_Coolest_Dog
    ```
3.  **Extract the category type:** Use the `getCategoryTypeFromCustomType` function:

    ```typescript
    const categoryType = getCategoryTypeFromCustomType('ext:LCA_CUSTOM:Learning History:The_Coolest_Dog');
    console.log(categoryType); // Output: Learning History
    ```
