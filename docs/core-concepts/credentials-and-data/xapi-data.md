---
description: How learning-activity records (xAPI) relate to credentials in LearnCard, and how to name your activities.
---

# xAPI Data

A credential says _what someone achieved_. An xAPI statement says _what they did_. LearnCard stores both, and the second is often the evidence for the first.

## What xAPI is

[xAPI](https://xapi.com/) (Experience API) records learning activity as simple statements — **actor, verb, object**:

> Jane — completed — "Module 2: Machine Learning Basics"

It isn't tied to courses or an LMS. A statement can describe reading an article, finishing a level in a game, attending a workshop, or passing a quiz. Each statement is a small JSON object with a standard shape, so tools from different vendors can read each other's records.

## How LearnCard uses it

- **Storage.** The LearnCloud Storage API accepts xAPI statements at `/xapi/statements`. Statements are stored under the learner's DID and are the learner's data — you write them with the learner's permission, not to a store you own. See [Send xAPI Statements](../../tutorials/sending-xapi-statements.md).
- **Evidence.** When you issue a credential, you can point its `evidence` at the statements that justify it. "Completed AI Fundamentals" becomes more useful when a verifier can see the four module completions and quiz passes behind it.
- **Triggers.** Your system decides when a pattern of statements earns a credential — four modules complete → issue the course badge. LearnCard doesn't do this automatically; it gives you the store and the `send()`.

## Naming your activities

Every statement's `object.id` is a URI you choose. Verbs are usually taken from the [ADL registry](http://adlnet.gov/expapi/verbs/) as-is:

```javascript
verb: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'en-US': 'completed' } },
object: {
    id: 'https://docs.yourgame.com/xapi/activities/level-1/custom-challenge',
    definition: {
        name: { 'en-US': 'Level 1 Custom Challenge' },
        type: 'http://adlnet.gov/expapi/activities/simulation',
    },
},
```

Three rules that save pain later:

1. **Use a domain you control**, with a consistent path structure. A made-up domain is valid xAPI, but a real one lets you publish what the activity means.
2. **Make the URI resolve to a description** if you can — what the activity is, what it demonstrates, which skills it maps to. Verifiers and analysts will look.
3. **Never reuse an ID for a different activity.** New version, new ID. An ID is a permanent name, not a label.

## Related

- [Building Verifiable Credentials](building-verifiable-credentials.md) — the `evidence` field
- [xAPI reference](../../sdks/learncloud-storage-api/xapi-reference.md) — endpoints, authentication, and the `X-VP` header
