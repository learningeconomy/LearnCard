---
description: A standards-pure convention for carrying display hints on Open Badges v3 credentials using the native `tag` field.
---

# Display Hint Tags (`lc:` convention)

LearnCard credentials are **standards-pure** Open Badges v3 / W3C Verifiable Credentials. To let a wallet render a credential more richly — a background color, a certificate-style layout, a friendly subtype label — without adding bespoke fields or custom JSON-LD `@context` terms, LearnCard uses a small, namespaced convention that rides inside the credential's existing, spec-defined `tag` array.

Because these are ordinary tags, any wallet that doesn't understand them simply ignores them. There is **zero interoperability cost** and **zero spec violation**. If other wallets choose to adopt the convention, it becomes a de-facto display micro-standard.

## Where the tags live

Open Badges v3 defines an optional `tag` property on the `Achievement` as an array of strings. Display hints go there:

```json
{
    "credentialSubject": {
        "achievement": {
            "type": ["Achievement"],
            "achievementType": "Achievement",
            "name": "Trailblazer",
            "tag": ["lc:subtype:Trailblazer", "lc:displayType:certificate", "lc:bgColor:353E64"]
        }
    }
}
```

## Format

Each hint is a single string of the form:

```
lc:<key>:<value>
```

-   The `lc` namespace and the `<key>` are matched **case-insensitively**.
-   Only the **first two colons** are structural. Everything after the second colon is the value, verbatim — so values may themselves contain colons (e.g. a URL).
-   Every recognized tag is a **hint, never a requirement**. Unknown keys are ignored, and malformed values (a bad hex color, an unknown display type, a non-`https` URL) are dropped rather than causing an error.

## Recognized keys

| Tag                     | Meaning                                                                                              | Value format                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `lc:subtype:<Label>`    | Human-facing subtype label, shown in place of the coarse category. Decoupled from `achievementType`. | Free text, e.g. `Trailblazer`, `Event`                          |
| `lc:displayType:<type>` | Preferred visual layout                                                                              | One of `badge`, `certificate`, `id`, `course`, `award`, `media` |
| `lc:bgColor:<hex>`      | Background color                                                                                     | Hex, with or without leading `#` (`353E64` or `#353E64`)        |
| `lc:bgImage:<url>`      | Background image                                                                                     | An `https` URL                                                  |
| `lc:accentColor:<hex>`  | Accent color (reserved)                                                                              | Hex, with or without leading `#`                                |

## Why `subtype` is decoupled from `achievementType`

Earlier LearnCard credentials expressed a badge's flavor by pushing values like `ext:Trailblazer` into the OBv3 `achievementType`. That is spec-legal (the `ext:` prefix is the OBv3 extension convention) but coarse: `achievementType` is meant to describe the _kind_ of achievement, not its brand or theme.

With this convention, `achievementType` stays a clean, interoperable spec value (e.g. `Achievement`) and the richer, human-facing label lives in `lc:subtype`. Wallets that understand the convention show the subtype; everyone else still reads a valid, standard credential.

## Precedence

When a wallet resolves a credential's display type, hints are weighted in this order (highest first):

1. An explicit legacy `display.displayType` object (for backwards compatibility with older LearnCard credentials).
2. An `lc:displayType:*` tag.
3. The credential's `achievementType`.
4. The credential's category.

Background color and image resolve to the legacy `display` object first, then fall back to the corresponding `lc:` tag.

## Backwards compatibility

-   Credentials **without** any `lc:` tags behave exactly as before.
-   Older credentials that used the internal `display` object continue to render from it; the object wins over the tags.
-   Newly issued LearnCard credentials use tags only, keeping the issued credential fully interoperable.
