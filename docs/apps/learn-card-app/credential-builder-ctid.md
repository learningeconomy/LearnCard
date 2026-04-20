# Credential Registry ID (CTID) in CredentialBuilder

This page documents how to link credentials to the Credential Engine Registry using CTID in the CredentialBuilder.

## Overview

When a boost creator knows their credential is listed in the [Credential Engine Registry](https://credentialengine.org/), they can add the credential's CTID (Credential Transparency Identifier) to the template. Every credential issued from that boost will then carry an OBv3 alignment entry linking to the public registry description on [Credential Finder](https://credentialfinder.org/).

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

| Input | Example |
|-------|---------|
| CTID only | `ce-12345678-1234-5678-9abc-def012345678` |
| Full URL | `https://credentialfinder.org/credential/ce-12345678-1234-5678-9abc-def012345678` |

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

This allows the CTID to be injected at issuance time from external data sources.

## Validation

Static CTID values are validated against the Credential Engine format:

- Must start with `ce-`
- Must be followed by a valid UUID (8-4-4-4-12 hex characters)
- Case-insensitive

Invalid formats will show a validation error in the CredentialBuilder.

## Round-Trip Behavior

When loading a saved template that contains a Credential Engine Registry alignment:

1. The alignment is detected by matching `targetFramework === 'Credential Engine Registry'` and `targetType === 'ceterms:Credential'`
2. The `targetCode` is extracted and stored in the `ctid` field
3. The alignment is filtered from the regular alignments list (to avoid duplication)

This ensures credentials with CTIDs can be edited and re-saved without losing the registry link.

## Finding Your CTID

To find a credential's CTID:

1. Go to [Credential Finder](https://credentialfinder.org/)
2. Search for your credential
3. Open the credential detail page
4. The CTID is in the URL: `credentialfinder.org/credential/{ctid}`
5. Or look for "CTID" in the credential metadata
