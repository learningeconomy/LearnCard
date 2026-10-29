import { describe, expect, it } from 'bun:test';

import { createHandler, type Submit } from './app';
import type { CompletionFields, SubmitResult } from './brain';
import type { DemoLmsConfig } from './config';

const config: DemoLmsConfig = {
    port: 0,
    brainUrl: 'http://brain.invalid',
    healthUrl: 'http://localhost:4322/health',
    serviceAccountId: 'sa_1',
    serviceAccountSecret: 'unused',
    installId: 'install_1',
    ecosystemId: 'eco_1',
    platformJwk: { kty: 'OKP', crv: 'Ed25519', x: '' },
    learnCardAppUrl: 'https://learncard.app',
};

const complete = (fields: Record<string, string>, accept?: string): Request => {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    return new Request('http://localhost:4322/complete', {
        method: 'POST',
        body: form,
        headers: accept ? { accept } : {},
    });
};

const stub = (result: SubmitResult) => {
    const calls: CompletionFields[] = [];
    const submit: Submit = async (_config, _learner, fields) => {
        calls.push(fields);
        return result;
    };
    return { submit, calls };
};

describe('POST /complete with Accept: application/json', () => {
    it('returns the release as JSON, with the offer link the page would show', async () => {
        const offerUri = 'http://localhost:4000/api/workflows/educationos-claim/exchanges/x1';
        const { submit, calls } = stub({
            ok: true,
            recordId: 'rec_1',
            status: 'ACCEPTED',
            issuance: { status: 'OFFERED', offerUri },
        });
        const response = await createHandler(
            config,
            submit
        )(
            complete(
                { learner: 'demo-learner', course: 'course-101', completionId: 'c-1' },
                'application/json'
            )
        );
        expect(response.headers.get('content-type')).toContain('application/json');
        expect(await response.json()).toEqual({
            ok: true,
            recordId: 'rec_1',
            status: 'ACCEPTED',
            issuance: { status: 'OFFERED', offerUri },
            offerUrl: `https://learncard.app/request?vc_request_url=${encodeURIComponent(offerUri)}`,
        });
        expect(calls[0]?.completionId).toBe('c-1');
    });

    it("passes brain's refusal code and message through", async () => {
        const { submit } = stub({ ok: false, code: 'FORBIDDEN', message: 'CONSENT_DENIED' });
        const response = await createHandler(
            config,
            submit
        )(complete({ learner: 'demo-learner-b', course: 'course-101' }, 'application/json'));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: false,
            code: 'FORBIDDEN',
            message: 'CONSENT_DENIED',
        });
    });

    it('rejects a missing learner as JSON 400', async () => {
        const { submit, calls } = stub({ ok: false, code: 'UNKNOWN', message: 'unused' });
        const response = await createHandler(
            config,
            submit
        )(complete({ course: 'course-101' }, 'application/json'));
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ ok: false, code: 'BAD_REQUEST' });
        expect(calls).toHaveLength(0);
    });

    it('keeps the HTML page without the Accept header, generating a completion id', async () => {
        const { submit, calls } = stub({ ok: true, recordId: 'rec_2', status: 'DUPLICATE' });
        const response = await createHandler(
            config,
            submit
        )(complete({ learner: 'demo-learner', course: 'course-101' }));
        expect(response.headers.get('content-type')).toContain('text/html');
        expect(await response.text()).toContain('<p class="ok">Record DUPLICATE: rec_2</p>');
        expect(calls[0]?.completionId).toMatch(/^completion_/);
    });
});
