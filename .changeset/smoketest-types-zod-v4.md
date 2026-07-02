---
'@learncard/types': patch
---

fix(types): import zod via the `zod/v4` subpath instead of the bare `zod` specifier

The published ESM build externalizes `import { z } from 'zod'`, so when a consumer's dependency tree hoists the zod **3.25 bridge** release (whose default export is still v3, e.g. when `expo` is present transitively), `z.iso` resolves to `undefined` and the package throws `Cannot read properties of undefined (reading 'datetime')` at import time. Importing from `zod/v4` pins the v4 API regardless of which zod major the consumer hoists (the `./v4` subpath exists in both 3.25.x and 4.x), making the ESM build resolution-stable.
