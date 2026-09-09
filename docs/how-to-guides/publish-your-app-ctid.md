---
description: Give every credential your app issues a link to its public Credential Engine Registry entry.
---

# Link Credentials to the Credential Engine Registry (CTID)

If your credential is listed in the [Credential Engine Registry](https://credentialengine.org/), add its CTID during the credential template step of [publishing your app](publish-your-app.md). Each issued credential then links to its public registry entry.

**~5 minutes · Needs:** a CTID or Credential Finder URL

## Overview

A CTID (Credential Transparency Identifier) adds an OBv3 alignment from a credential template to its public [Credential Finder](https://credentialfinder.org/) description.

## What is CTID?

A CTID is a unique identifier assigned to credentials registered in the Credential Engine Registry. It follows the format:

```
ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

For example: `ce-12345678-1234-5678-9abc-def012345678`

## Adding CTID to a Credential Template

1. Open the CredentialBuilder in the partner onboarding flow
2. Expand the **Achievement** section
3. Scroll to **Additional Details**
4. Find the **Credential Registry ID (CTID)** field
5. Enter either:
    - The CTID directly (e.g., `ce-12345678-1234-5678-9abc-def012345678`)
    - A full Credential Finder URL (the CTID will be extracted automatically)

### Supported Input Formats

| Input     | Example                                                                           |
| --------- | --------------------------------------------------------------------------------- |
| CTID only | `ce-12345678-1234-5678-9abc-def012345678`                                         |
| Full URL  | `https://credentialfinder.org/credential/ce-12345678-1234-5678-9abc-def012345678` |

## Generated Alignment Entry

When a CTID is present, `templateToJson()` generates an OBv3 alignment entry:

```json
{
    "type": ["Alignment"],
    "targetName": "<achievement name>",
    "targetUrl": "https://credentialfinder.org/credential/<ctid>",
    "targetType": "ceterms:Credential",
    "targetCode": "<ctid>",
    "targetFramework": "Credential Engine Registry"
}
```

This alignment is appended to any existing user-defined alignments.

## Dynamic Field Support

The CTID field supports dynamic mode. When enabled, you can use Mustache variables:

```
{{registryId}}
```

External data sources provide the CTID at issuance time.

## Validation

Static CTID values are validated against the Credential Engine format:

- Must start with `ce-`
- Must be followed by a valid UUID (8-4-4-4-12 hex characters)
- Case-insensitive

CredentialBuilder shows a validation error for invalid formats.

## Round-Trip Behavior

When loading a saved template that contains a Credential Engine Registry alignment:

1. The alignment is detected by matching `targetFramework === 'Credential Engine Registry'` and `targetType === 'ceterms:Credential'`
2. The `targetCode` is extracted and stored in the `ctid` field
3. The alignment is filtered from the regular alignments list (to avoid duplication)

This preserves the registry link when a template is edited and saved again.

## Finding Your CTID

1. Go to [Credential Finder](https://credentialfinder.org/)
2. Search for your credential
3. Open the credential detail page
4. The CTID is in the URL: `credentialfinder.org/credential/{ctid}`
5. Or look for "CTID" in the credential metadata

## What you should see

When you issue a credential using this template, the resulting JSON will include the alignment entry pointing to the Credential Engine Registry.

## Troubleshooting

| If…                       | Then                                                                                                                          |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------- |
| `Invalid CTID format`     | Ensure the CTID starts with `ce-` and is followed by a valid UUID (e.g., `ce-12345678-1234-5678-9abc-def012345678`).          |
| `Alignment not appearing` | Verify that the template was saved successfully and that you are issuing from the updated template.                           |
| `Duplicate alignments`    | The system automatically filters duplicates when loading, but ensure you aren't manually adding the same alignment elsewhere. |
