import { registerPlugin } from '@capacitor/core';
import { fixture, verifyPresentation } from './fixture';
import { heading, text, status, button } from './ui';

const requester = registerPlugin<{
    request: (options: {
        requestJson: string;
    }) => Promise<{ responseJson: string; origin: string }>;
}>('LabVerifier');

heading('Verify course completion');
text('Request two fields through Android and verify the returned proof.');
text('Synthetic credentials only.');
button('Request Course Details', 'Waiting for approval...', async () => {
    const nonce = crypto.randomUUID();
    status('Choose the sample in Android, then review the request in LearnCard.');
    try {
        const result = await requester.request({
            requestJson: JSON.stringify({
                requests: [
                    {
                        protocol: 'openid4vp-v1-unsigned',
                        data: {
                            response_type: 'vp_token',
                            response_mode: 'dc_api',
                            nonce,
                            dcql_query: {
                                credentials: [
                                    {
                                        id: 'course_completion',
                                        format: 'dc+sd-jwt',
                                        meta: { vct_values: [fixture.template.vct] },
                                        claims: [
                                            { path: ['course_name'] },
                                            { path: ['completion_date'] },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                ],
            }),
        });
        const response = JSON.parse(result.responseJson);
        if (response.protocol !== 'openid4vp-v1-unsigned') throw new Error('Protocol mismatch');
        const compact = response.data?.vp_token?.course_completion?.[0];
        if (typeof compact !== 'string') throw new Error('Missing presentation');
        const verified = await verifyPresentation(compact, result.origin, nonce);
        const resultElement = document.getElementById('result') ?? text('', 'credential');
        resultElement.id = 'result';
        resultElement.textContent = `${verified.course_name} · ${verified.completion_date}`;
        status('Verified: issuer signature, disclosures, nonce, audience and holder binding.');
    } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
        status(
            code === 'canceled'
                ? 'Canceled. No credential was received.'
                : 'Could not verify a credential. Please try again.',
            code !== 'canceled'
        );
    }
});
status('Ready to request the sample.');
