---
'@learncard/types': patch
---

Declare `zod` (and the `zod-openapi` type augmentation) as explicit dependencies of `@learncard/types`.

`@learncard/types` uses zod's v4-only `.meta({ override })` API at module load but previously declared no zod dependency, relying on hoisting. Inside the monorepo this works because a `pnpm.overrides` entry pins zod to `4.1.13`, but in a fresh registry install (the npm-packages smoketest) those overrides don't apply, so zod could resolve to a v3 where `.meta()` doesn't exist — crashing on import. Declaring the dependency ensures a v4 zod with `.meta()` is always resolved, fixing LC-1935 at its root without the `.meta`-existence guard (whose previous form, #1321, broke OpenAPI document generation in the brain-service).
