---
"@learncard/network-brain-service": patch
"@learncard/learn-cloud-service": patch
"@learncard/types": patch
---

Fix OpenAPI document generation under Zod 4.4 so the brain and cloud services boot.

Zod 4.3 tightened two behaviors that broke `generateOpenApiDocument` (which runs
eagerly at service startup, so a failure crashed every Lambda at cold start):

- `.omit()` is no longer allowed on object schemas containing refinements, which
  `trpc-to-openapi` calls internally on every route's input. Bumping the
  `trpc-to-openapi` override to `3.3.0` resolves this for all refined route inputs.
- `z.custom()` (and `z.instanceof()`) can no longer be represented in OpenAPI,
  and the `.meta({ override })` escape hatch is not honored for these types. Two
  schemas are affected:
  - The custom-storage `count`/`update`/`delete` query schemas now use
    `z.record(z.string(), z.any())`, matching the already-working `read` route.
  - `RegExpValidator` in `@learncard/types` (used by the brain-service skill /
    skill-framework search routes via `$regex`) no longer relies on
    `z.instanceof(RegExp)`. It now `z.preprocess`es a `RegExp` instance into its
    `/source/flags` string, so the OpenAPI schema is a plain string while still
    accepting both `RegExp` and string inputs at runtime.

Also hardens the custom-storage query routes (`read`/`count`/`update`/`delete`)
by rejecting MongoDB server-side-JavaScript operators (`$where`, `$function`,
`$accumulator`) in caller-supplied queries, closing a denial-of-service vector.
(did-scoping was already enforced in the access layer; this is orthogonal.)
