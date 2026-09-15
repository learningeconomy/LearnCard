---
description: >-
    Understand Boosts as reusable credential templates: their structure, lifecycle,
    and permissions on the LearnCard Network.
---

# Credential Templates (Boosts)

A Boost is a **credential template** stored on the LearnCard Network.
Create it once; every `send()` from it produces a new signed credential for that recipient.
Sending a `signedCredential` without an existing template also saves a template automatically;
its URI is returned as `result.uri`.

Template URIs look like `lc:network:<host>/trpc:boost:<id>`.
Always use the returned value; never construct a URI yourself.
The template URI identifies the reusable template, not an individual recipient's credential.

## What a template gives you

- **Reuse** the same credential structure across recipients.
- **Personalize** `{{variables}}` for each send through `templateData`.
- **Track recipients** with `learnCard.invoke.getPaginatedBoostRecipients()`.
- **Revoke issued credentials** through a credential status list.
- **Let LearnCard sign for you** through a signing authority, so your server needn't hold the signing key.
- **Build visually** in the Developer Portal's credential template builder.

## Anatomy

`learnCard.invoke.createBoost(credential, metadata)` takes an unsigned credential
and a separate metadata object, and returns the template URI.
Here is an Open Badges v3 (OBv3) credential template, before recipient assignment and signing:

```json
{
    "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        "https://ctx.learncard.com/boosts/1.0.1.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
    "name": "Course Completion",
    "credentialSubject": {
        "type": ["AchievementSubject"],
        "achievement": {
            "id": "https://example.com/achievements/course-completion",
            "type": ["Achievement"],
            "achievementType": "Course",
            "name": "{{courseName}}",
            "description": "Completed {{courseName}}.",
            "criteria": { "narrative": "Complete all course requirements." }
        }
    }
}
```

{% hint style="warning" %}
Include the LearnCard Boost context and the `BoostCredential` type. When the network signs from a template — a `send()` with `templateUri`, or [issuing on consent](../consent-and-permissions/auto-boosts.md) — it stamps `boostId` on the credential, and signing fails with `undefined JSON-LD term` if nothing defines it.
{% endhint %}

The metadata argument describes the template in the network, not the claims in the credential:

```json
{
    "name": "Course Completion Template",
    "category": "Achievement",
    "type": "Course",
    "status": "DRAFT"
}
```

`name`, `category`, and `type` are optional strings; `status` is an optional enum.
The metadata `type` is separate from the credential's JSON-LD `type` array.
The recipient and signing details are supplied during issuance, not fixed to one learner in the template.

Optional display metadata controls appearance; BoostID fields support digital ID layouts.
Use credential `evidence` for proof of an achievement and attachments for other supporting resources.
See [Building Verifiable Credentials](building-verifiable-credentials.md) for credential fields.

## Lifecycle

The usual progression is **DRAFT → LIVE**; **PROVISIONAL** is available when you need to issue while iterating.

| Status        | Edit template fields?                                    | Send credentials?                          |
| ------------- | -------------------------------------------------------- | ------------------------------------------ |
| `DRAFT`       | Yes                                                      | No; claim links cannot be generated either |
| `PROVISIONAL` | Yes                                                      | Yes                                        |
| `LIVE`        | No; only `meta` and `defaultPermissions` remain editable | Yes                                        |

Publish a draft with `learnCard.invoke.updateBoost(boostUri, { status: 'LIVE' })` once it is ready.
Sending requires permission to issue from the template, regardless of its status.
Changes to a template do not rewrite credentials already signed and delivered.

For template-based sends, configure a signing authority before relying on hosted signing.
Providing a `signedCredential` instead preserves your existing proof rather than signing it again.

{% hint style="info" %}
Missing `templateData` variables render as empty strings; check required values before sending.
Templates without variables work unchanged, and unused template data is ignored.
{% endhint %}

Sending again to the same recipient creates another issuance; `send()` is not idempotent.
Reconcile recipient records before retrying bulk sends to avoid duplicates.

Older code uses `sendBoost(profileId, boostUri)`; prefer `send()`.

## Categories & types

Categories organize credentials in LearnCard, while achievement types describe what was earned.
They are not the same as the credential's JSON-LD types or its display layout.
See [Schemas, Types, & Categories](achievement-types-and-categories.md) for the supported conventions.

## Hierarchy & permissions

Templates can have parent/child relationships and per-role permissions, as ScoutPass uses for NSO → Troop → Scout IDs. Inspect them with `learnCard.invoke.getBoostChildren()` and `learnCard.invoke.getBoostPermissions()`. Permissions can be assigned directly, inherited, or granted on claim; `defaultPermissions` apply to all authenticated users and combine with explicit permissions, so grant them carefully.

## Next steps

- [Send & Issue Credentials — issue at scale with templates](../../how-to-guides/send-credentials.md#issue-at-scale-with-templates)
- [Who Signs](../../how-to-guides/create-signing-authority.md)
- [Revoke or Update a Credential](../../how-to-guides/revoke-or-update-a-credential.md)
