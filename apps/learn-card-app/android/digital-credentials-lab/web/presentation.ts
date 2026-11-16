import {
    parseDcApiRequest,
    createDcApiResponse,
} from '../../../../../packages/plugins/openid4vc/src/vp/dcApi';
import { selectCredentialsForDcql } from '../../../../../packages/plugins/openid4vc/src/dcql/select';
import { parseSdJwtVc } from '../../../../../packages/plugins/sd-jwt-vc/src/parse';
import { presentSdJwtVc } from '../../../../../packages/plugins/sd-jwt-vc/src/present';
import type { PendingDigitalCredentialRequest } from '../../../src/native-digital-credentials/types';
import {
    decode,
    fixture,
    ISSUER,
    publicJwk,
    signHolder,
    verifier,
    type LabCredential,
} from './fixture';

/** Deliberately narrow lab profile; rejects unsupported selection/disclosure instead of guessing. */
export const prepareLabPresentation = async (
    pending: PendingDigitalCredentialRequest,
    credential: LabCredential
): Promise<{ claims: string[]; approve: () => Promise<string> }> => {
    if (pending.selectedEntryId !== credential.id) throw new Error('Selected entry unavailable');
    const request = parseDcApiRequest(pending.request, pending.origin);
    if (request.query.credentials.length !== 1 || request.query.credential_sets) {
        throw new Error('Lab supports one required credential');
    }
    const query = request.query.credentials[0];
    if (query.claim_sets || query.multiple) throw new Error('Unsupported lab query');
    const claims = (query.claims ?? []).map(claim => {
        if (
            claim.path.length !== 1 ||
            !['course_name', 'completion_date'].includes(String(claim.path[0]))
        ) {
            throw new Error('Unsupported requested field');
        }
        return String(claim.path[0]);
    });
    if (new Set(claims).size !== claims.length) throw new Error('Duplicate claim');
    const candidate = { credential: credential.compact, format: 'dc+sd-jwt' };
    const selection = await selectCredentialsForDcql([candidate], request.query, {
        sdJwtParser: parseSdJwtVc,
    });
    if (!selection.canSatisfy || selection.matches[query.id]?.candidates.length !== 1) {
        throw new Error('Credential cannot satisfy request');
    }
    const parsed = await parseSdJwtVc(credential.compact);
    if (parsed.issuer !== ISSUER || parsed.vct !== fixture.template.vct)
        throw new Error('Unexpected source');
    return {
        claims,
        approve: async () => {
            const data = await createDcApiResponse(
                request,
                [
                    {
                        credentialQueryId: query.id,
                        candidate,
                        disclose: Object.fromEntries(claims.map(key => [key, true])),
                    },
                ],
                'did:example:android-lab-holder',
                async (compact, options) =>
                    presentSdJwtVc(compact, {
                        ...options,
                        activeHolderPublicJwk: publicJwk(decode(credential.holderSecret)),
                        kbSigner: async input => signHolder(credential.holderSecret, input),
                        verify: async source => {
                            await verifier().verify(source);
                            return { checks: ['issuer_signature'], warnings: [], errors: [] };
                        },
                    })
            );
            return JSON.stringify({ protocol: 'openid4vp-v1-unsigned', data });
        },
    };
};
