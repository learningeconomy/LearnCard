/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly LEARNCARD_ISSUER_SEED: string;
  readonly LEARNCARD_HOST_ORIGIN?: string;
  readonly CONTRACT_URI?: string;
  readonly BOOST_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
