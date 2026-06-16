// Node ESM entrypoint (resolved via the `node.import` export condition).
//
// Node consumers are deliberately routed to the CommonJS bundle (`index.cjs`,
// which switches between the dev / minified prod CJS builds via NODE_ENV).
// We load it with `createRequire` rather than a static `import ... from
// './index.cjs'`.
//
// Why: a static ESM import of a CJS file is the one shape that breaks bundlers.
// When a bundler (e.g. Vite/Astro SSR) transforms this module — which it does
// for symlinked workspace deps — it follows the static import into `index.cjs`
// and tries to transform that CommonJS file as ESM, throwing
// `module is not defined`. `createRequire` keeps the CJS loading opaque to the
// bundler's ESM transform and hands it to Node's native CommonJS loader, where
// `module` / `require` are defined. Runtime behavior for Node consumers is
// unchanged (same CJS bundle, same didkit backend); bundler-transformed
// symlinked consumers no longer need `ssr.external` / `optimizeDeps` guards.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const init = require('./index.cjs');

export const customLearnCard = init.customLearnCard;
export const didWebLearnCardFromSeed = init.didWebLearnCardFromSeed;
export const didWebNetworkLearnCardFromSeed = init.didWebNetworkLearnCardFromSeed;
export const emptyLearnCard = init.emptyLearnCard;
export const initLearnCard = init.initLearnCard;
export const learnCardFromApiUrl = init.learnCardFromApiUrl;
export const learnCardFromSeed = init.learnCardFromSeed;
export const networkLearnCardFromApiKey = init.networkLearnCardFromApiKey;
export const networkLearnCardFromSeed = init.networkLearnCardFromSeed;

export default init;
