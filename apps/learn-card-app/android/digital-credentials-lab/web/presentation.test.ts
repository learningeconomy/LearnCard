import { describe, expect, it } from 'vitest';

import { createLabCredential, fixture, verifyPresentation } from './fixture';
import { prepareLabPresentation } from './presentation';

const ORIGIN = `android:apk-key-hash:${'A'.repeat(43)}`;
const setup = async () => {
    const credential = await createLabCredential();
    const pending = {
        requestId: 'test-request',
        selectedEntryId: credential.id,
        origin: ORIGIN,
        request: {
            protocol: 'openid4vp-v1-unsigned',
            data: {
                response_type: 'vp_token',
                response_mode: 'dc_api',
                nonce: 'test-nonce',
                dcql_query: {
                    credentials: [
                        {
                            id: 'course_completion',
                            format: 'dc+sd-jwt',
                            meta: { vct_values: [fixture.template.vct] },
                            claims: [{ path: ['course_name'] }, { path: ['completion_date'] }],
                        },
                    ],
                },
            },
        },
    };
    return { credential, pending };
};

describe('Android holder laboratory profile', () => {
    it('returns exactly requested fields and verifies issuer, nonce, origin and holder binding', async () => {
        const { pending, credential } = await setup();
        const prepared = await prepareLabPresentation(pending, credential);
        const response = JSON.parse(await prepared.approve());
        const compact = response.data.vp_token.course_completion[0];
        const result = await verifyPresentation(compact, ORIGIN, 'test-nonce');
        expect(result.course_name).toBe(fixture.template.claims.course_name);
        expect(result.learner_name).toBeUndefined();
        await expect(verifyPresentation(compact, ORIGIN, 'other-nonce')).rejects.toThrow();
        await expect(
            verifyPresentation(compact, 'https://wrong.example', 'test-nonce')
        ).rejects.toThrow();
    });
    it('rejects a selected ID other than the persisted mapping', async () => {
        const { pending, credential } = await setup();
        await expect(
            prepareLabPresentation({ ...pending, selectedEntryId: 'another-entry' }, credential)
        ).rejects.toThrow();
    });
    it('rejects a wrong VCT before signing', async () => {
        const { pending, credential } = await setup();
        pending.request.data.dcql_query.credentials[0].meta.vct_values = [
            'https://example.com/other',
        ];
        await expect(prepareLabPresentation(pending, credential)).rejects.toThrow();
    });
    it('rejects unsupported claims and additional credential queries', async () => {
        const { pending, credential } = await setup();
        pending.request.data.dcql_query.credentials[0].claims = [{ path: ['learner_name'] }];
        await expect(prepareLabPresentation(pending, credential)).rejects.toThrow();
        pending.request.data.dcql_query.credentials.push({
            ...pending.request.data.dcql_query.credentials[0],
            id: 'extra',
        });
        await expect(prepareLabPresentation(pending, credential)).rejects.toThrow();
    });
    it('rejects a different active holder key', async () => {
        const { pending, credential } = await setup();
        const other = await createLabCredential();
        const prepared = await prepareLabPresentation(pending, {
            ...credential,
            holderSecret: other.holderSecret,
        });
        await expect(prepared.approve()).rejects.toThrow();
    });
});
