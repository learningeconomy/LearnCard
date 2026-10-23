/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Server-only issuer settings read by src/actions. Astro types undeclared keys as `any`, and an
// options object with an `any` spread resolves initLearnCard to its empty overload (no `id` plane).
interface ImportMetaEnv {
    readonly LEARNCARD_ISSUER_SEED?: string;
    readonly LEARNCARD_NETWORK_URL?: string;
    readonly LEARNCARD_CLOUD_URL?: string;
}
