import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClient } from '@learncard/lca-api-client';

import { generateIconsInBatches } from './skillIconHelpers';

/**
 * Drives the icon batching helper through the real lca-api tRPC client (httpBatchLink) with a
 * mocked fetch, so we see the requests that actually leave the browser.
 *
 * On staging, a 9,376-byte GET passed and a 9,425-byte GET got HTTP 431 from API Gateway, and a
 * browser sends more headers than that measurement did. 8,192 bytes leaves room for those.
 */
const MAX_REQUEST_URL_BYTES = 8_192;

const URL_BASE = 'https://staging.api.learncard.app/trpc';

type SentRequest = { url: string; method: string; procedures: string[] };

const jsonResponse = (body: unknown): Response =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    });

const stubLcaApiFetch = (): SentRequest[] => {
    const sent: SentRequest[] = [];

    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = new URL(input.toString());
            const method = init?.method ?? 'GET';
            const procedures = decodeURIComponent(
                url.pathname.slice(new URL(URL_BASE).pathname.length + 1)
            ).split(',');

            sent.push({ url: input.toString(), method, procedures });

            const rawInput =
                method === 'GET' ? url.searchParams.get('input') : (init?.body as string);
            const inputs = JSON.parse(rawInput ?? '{}') as Record<string, { names?: string[] }>;

            return jsonResponse(
                procedures.map((procedure, index) => {
                    if (procedure === 'utilities.getChallenges') {
                        return {
                            result: {
                                data: Array.from({ length: 20 }, (_, i) => `challenge-${i}`),
                            },
                        };
                    }

                    if (procedure === 'ai.generateSkillIcons') {
                        const names = inputs[String(index)]?.names ?? [];

                        return {
                            result: {
                                data: Object.fromEntries(names.map(name => [name, `icon:${name}`])),
                            },
                        };
                    }

                    throw new Error(`Unexpected procedure ${procedure}`);
                })
            );
        })
    );

    return sent;
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('skill icon batches over the real lca-api transport', () => {
    it('keeps every generateSkillIcons request under the URL bound and maps all 200 names', async () => {
        const sent = stubLcaApiFetch();
        const client = await getClient(
            URL_BASE,
            async (challenge?: string) => `jwt:${challenge ?? 'none'}`
        );

        const names = Array.from(
            { length: 200 },
            (_, i) => `${String(i).padStart(3, '0')} Use a map to go to X`
        );

        // Same call the lca-api plugin makes for wallet.invoke.generateSkillIcons
        const icons = await generateIconsInBatches(names, batch =>
            client.ai.generateSkillIcons.query({ names: batch })
        );

        const iconRequests = sent.filter(request =>
            request.procedures.includes('ai.generateSkillIcons')
        );

        for (const request of iconRequests) {
            if (request.method === 'GET') {
                // Percent-encoded, so characters and bytes are the same
                expect(Buffer.byteLength(request.url)).toBeLessThanOrEqual(MAX_REQUEST_URL_BYTES);
            }
        }

        // Two logical batches of 100, and the link must not merge them back into one request
        expect(
            iconRequests.map(
                request =>
                    request.procedures.filter(procedure => procedure === 'ai.generateSkillIcons')
                        .length
            )
        ).toEqual([1, 1]);

        expect(Object.keys(icons)).toHaveLength(200);
        for (const name of names) expect(icons[name]).toBe(`icon:${name}`);
    });
});
