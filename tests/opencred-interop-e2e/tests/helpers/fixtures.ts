/**
 * Credential fixture builders for OpenCred interop tests.
 *
 * Wraps `@learncard/credential-library` to mint unsigned VCs in the
 * shapes OpenCred workflows ask for. Each builder returns an *unsigned*
 * VC pinned to the wallet's DID — the spec passes them through
 * `wallet.invoke.issueCredential` to get the actual signed credential.
 *
 * Fixtures are pinned to VC Data Model v1 contexts. The openid4vc
 * plugin's LD-VP signer composes a VP context that combines the
 * holder's and inner VCs' contexts — mixing v1 and v2 (e.g. by using
 * `obv3/plugfest-jff2` which is VCDM v2) trips the JSON-LD
 * "Protected term redefinition" error inside DidKit's expansion
 * step. v1-only fixtures sidestep that until the plugin's VP signer
 * picks v2 cleanly on its own.
 */
import { prepareFixtureById } from '@learncard/credential-library';

import type { SeedLearnCard } from './learncard';

export const buildUnsignedBasicV1 = (
    wallet: SeedLearnCard,
    subjectDid?: string
) =>
    prepareFixtureById('vc-v1/basic', {
        issuerDid: wallet.id.did(),
        subjectDid: subjectDid ?? wallet.id.did(),
        freshIds: true,
    });
