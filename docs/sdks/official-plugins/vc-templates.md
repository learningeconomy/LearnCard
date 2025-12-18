---
description: Plugin for creating new credentials from basic templates
---

# VC-Templates

This is a plugin for simplifying useful, meaningful credentials with minimal input. Additionally, this plugin can be used as reference for[ creating your own plugin](../learncard-core/writing-plugins.md) to add simple templates for creating new credentials.

### Install

```bash
pnpm i @learncard/vc-templates-plugin
```

### Basic Credential

The credential of type `basic` is the most simple credential, following the minimum information required by the Verifiable Credential specification.&#x20;

{% code title="LearnCard CLI" %}
```typescript
// Basic Credential: with default, 'basic' template
learnCard.invoke.newCredential();
learnCard.invoke.newCredential({ type: 'basic' });
/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  id: 'http://example.org/credentials/3731',
  type: [ 'VerifiableCredential' ],
  issuer: 'did:key:z6MkmF9iYcGTRiHFavPPYurDNuDfYMJQR66oGrSGnfnNpPzc',
  issuanceDate: '2020-08-19T21:41:50Z',
  credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' }
}
**/

// Basic Credential: with did, subject, and issuanceDate overloads
learnCard.invoke.newCredential({ 
  type: 'basic', 
  did:'did:example:123', 
  subject: 'did:example:456', 
  issuanceDate: '2020-08-19T21:41:50Z' 
});
/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  id: 'http://example.org/credentials/3731',
  type: [ 'VerifiableCredential' ],
  issuer: 'did:example:123',
  issuanceDate: '2020-08-19T21:41:50Z',
  credentialSubject: { id: 'did:example:456' }
}
**/

```
{% endcode %}

### Achievement Credential:

{% code title="LearnCard CLI" %}
```typescript
// Achievement Credential: with default, 'achievement' template
learnCard.invoke.newCredential({ type: 'achievement' });
/**
{
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://imsglobal.github.io/openbadges-specification/context.json'
  ],
  id: 'http://example.com/credentials/3527',
  type: [ 'VerifiableCredential', 'OpenBadgeCredential' ],
  issuer: 'did:key:z6MkmF9iYcGTRiHFavPPYurDNuDfYMJQR66oGrSGnfnNpPzc',
  issuanceDate: '2020-08-19T21:41:50Z',
  name: 'Teamwork Badge',
  credentialSubject: {
    id: 'did:example:d23dd687a7dc6787646f2eb98d0',
    type: [ 'AchievementSubject' ],
    achievement: {
      id: 'https://example.com/achievements/21st-century-skills/teamwork',
      type: [Array],
      criteria: [Object],
      description: 'This badge recognizes the development of the capacity to collaborate within a group environment.',
      name: 'Teamwork'
    }
  }
}
**/

// Achievement Credential: with overloads
learnCard.invoke.newCredential({ 
  type: 'achievement', 
  did:'did:example:123', 
  subject: 'did:example:456', 
  name: 'Singing Badge',
  achievementName: 'Beautiful Singing',
  description: 'This badge recognizes beautiful singing.',
  criteriaNarrative: 'Group members earn this badge when they sing a beautiful song at Karaoke night.',
  issuanceDate: '2020-08-19T21:41:50Z' 
});
/**
{
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://imsglobal.github.io/openbadges-specification/context.json'
  ],
  id: 'http://example.com/credentials/3527',
  type: [ 'VerifiableCredential', 'OpenBadgeCredential' ],
  issuer: 'did:example:123',
  issuanceDate: '2020-08-19T21:41:50Z',
  name: 'Singing Badge',
  credentialSubject: {
    id: 'did:example:456',
    type: [ 'AchievementSubject' ],
    achievement: {
      id: 'https://example.com/achievements/21st-century-skills/teamwork',
      type: [Array],
      criteria: [Object],
      description: 'This badge recognizes beautiful singing.',
      name: 'Beautiful Singing'
    }
  }
}
**/
```
{% endcode %}

### Other Types

{% hint style="warning" %}
More credential types are coming soon! Have a particular credential type you'd like to turn into a template? Start a conversation in our [Github Discussions](https://github.com/learningeconomy/LearnCard/discussions):&#x20;

* [Post a Credential Template Request ](https://github.com/learningeconomy/LearnCard/discussions/categories/feature-requests)💡
* [Ask for Help](https://github.com/learningeconomy/LearnCard/discussions/categories/help) 💖
{% endhint %}
