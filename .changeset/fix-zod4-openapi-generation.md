---
"@learncard/network-brain-service": patch
"@learncard/learn-cloud-service": patch
---

Fix OpenAPI document generation under Zod 4.4 so the brain and cloud services boot.

Zod 4.3 tightened two behaviors that broke `generateOpenApiDocument` (which runs
eagerly at service startup, so a failure crashed every Lambda at cold start):

- `.omit()` is no longer allowed on object schemas containing refinements, which
  `trpc-to-openapi` calls internally on every route's input. Bumping the
  `trpc-to-openapi` override to `3.3.0` resolves this for all refined route inputs.
- `z.custom()` can no longer be represented in OpenAPI. The custom-storage
  `count`/`update`/`delete` query schemas now use `z.record(z.string(), z.any())`,
  matching the already-working `read` route.

Also hardens the custom-storage query routes (`read`/`count`/`update`/`delete`)
by rejecting MongoDB server-side-JavaScript operators (`$where`, `$function`,
`$accumulator`) in caller-supplied queries, closing a denial-of-service vector.
(did-scoping was already enforced in the access layer; this is orthogonal.)
