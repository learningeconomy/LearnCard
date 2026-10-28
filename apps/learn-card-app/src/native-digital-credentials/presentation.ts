import {
    createDcApiResponse,
    parseDcApiRequest,
    selectCredentialsForDcql,
    type AuthorizationRequest,
    type DcqlSelectionResult,
} from '@learncard/openid4vc-plugin';
import { createEd25519KbSigner } from '@learncard/sd-jwt-vc-plugin';
import type { ConsentPicks } from '../pages/oid4vp/components/RequestConsent';
import {
    accountOwner,
    compactCredential,
    credentialDigest,
    eligibleCredential,
    type AccountInventory,
    type DigitalCredentialWallet,
} from './inventory';
import type { PendingDigitalCredentialRequest } from './types';

/** Uses the same consent component and SDK matcher as OID4VP, with a request-bounded frame. */
export const prepareAccountPresentation = async (
    wallet: DigitalCredentialWallet,
    inventory: AccountInventory,
    pending: PendingDigitalCredentialRequest,
    isCurrent: () => boolean
): Promise<{
    request: AuthorizationRequest;
    selection: DcqlSelectionResult;
    policy: Record<string, string[]>;
    approve: (picks: ConsentPicks) => Promise<string>;
}> => {
    const assertCurrent = () => {
        if (!isCurrent() || inventory.owner !== accountOwner(wallet))
            throw new Error('Account changed');
    };
    assertCurrent();
    const entry = inventory.entries.find(value => value.id === pending.selectedEntryId);
    if (!entry) throw new Error('Selected entry unavailable in this account');
    const request = parseDcApiRequest(pending.request, pending.origin);
    if (request.query.credentials.length !== 1 || request.query.credential_sets)
        throw new Error('Unsupported credential selection');
    const query = request.query.credentials[0];
    if (query.format !== 'dc+sd-jwt' && query.format !== 'vc+sd-jwt')
        throw new Error('Unsupported credential format');
    if (query.multiple || query.claim_sets || !query.claims?.length)
        throw new Error('Unsupported claim selection');
    const fields = query.claims.map(claim => {
        if (
            !('path' in claim) ||
            claim.path.length !== 1 ||
            typeof claim.path[0] !== 'string' ||
            !entry.projection.claims.some(value => value.path[0] === claim.path[0])
        )
            throw new Error('Unsupported requested field');
        return claim.path[0];
    });
    if (new Set(fields).size !== fields.length) throw new Error('Duplicate requested field');
    const load = async () => {
        const credential = await wallet.read.get(entry.uri);
        assertCurrent();
        const compact = compactCredential(credential);
        if (!compact || (await credentialDigest(compact)) !== entry.digest)
            throw new Error('Credential changed');
        // Re-read both the index and body at approval; a deleted credential is not shareable.
        if (!(await wallet.index.LearnCloud.get()).some(value => value.uri === entry.uri))
            throw new Error('Credential removed');
        const candidate = { id: entry.uri, credential, title: entry.projection.title };
        const eligible = await eligibleCredential(wallet, candidate);
        if (!eligible) throw new Error('Credential no longer eligible');
        const selection = await selectCredentialsForDcql([candidate], request.query, {
            sdJwtParser: source => wallet.invoke.parseSdJwtVc(source),
        });
        if (!selection.canSatisfy || selection.matches[query.id]?.candidates.length !== 1)
            throw new Error('Credential cannot satisfy request');
        assertCurrent();
        return { candidate, selection };
    };
    const loaded = await load();
    return {
        request: {
            response_type: 'vp_token',
            response_mode: 'dc_api',
            client_id: pending.origin,
            client_metadata: { client_name: pending.callerName },
            nonce: request.nonce,
            dcql_query: request.query,
        },
        selection: loaded.selection,
        policy: { [query.id]: fields },
        approve: async picks => {
            assertCurrent();
            const { candidate } = await load();
            const frame = picks.disclose[`${query.id}::${candidate.id}`];
            if (
                (picks.row[query.id] ?? 0) !== 0 ||
                !frame ||
                fields.some(key => frame[key] !== true) ||
                Object.keys(frame).some(key => !fields.includes(key))
            )
                throw new Error('Required fields not approved');
            const signer = await createEd25519KbSigner({
                privateJwk: wallet.id.keypair('ed25519'),
            });
            const data = await createDcApiResponse(
                request,
                [
                    {
                        credentialQueryId: query.id,
                        candidate,
                        disclose: Object.fromEntries(fields.map(key => [key, true])),
                    },
                ],
                wallet.id.did(),
                (compact, options) =>
                    wallet.invoke.presentSdJwtVc(compact, { ...options, kbSigner: signer })
            );
            assertCurrent();
            return JSON.stringify({ protocol: 'openid4vp-v1-unsigned', data });
        },
    };
};
