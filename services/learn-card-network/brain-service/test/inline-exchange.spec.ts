import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import base64url from 'base64url';
import { gzipSync } from 'zlib';

import { UnsignedVC, VC, VP } from '@learncard/types';

import { __testHooks as inlineSrcTestHooks } from '../src/helpers/inline-src.helpers';

import { getClient, getUser } from './helpers/getClient';

const noAuthClient = getClient();

let userA: Awaited<ReturnType<typeof getUser>>;

const encodeJson = (value: unknown, compress = false): string => {
    const json = Buffer.from(JSON.stringify(value), 'utf8');
    return base64url.encode(compress ? gzipSync(json) : json);
};

const encodeUrl = (url: string): string => base64url.encode(Buffer.from(url, 'utf8'));

/**
 * SDK-produced inline-src envelope: `{v:1, url, presenting?}`. Encoded the
 * same way the browser SDK encodes it so we exercise the real parse path.
 */
const encodeInlineSrcEnvelope = (
    url: string,
    presenting?: string
): string => {
    const envelope: { v: 1; url: string; presenting?: string } = { v: 1, url };
    if (presenting) envelope.presenting = presenting;
    return base64url.encode(Buffer.from(JSON.stringify(envelope), 'utf8'));
};

const sampleUnsigned = (partnerIssuer = 'https://partner.example.com/issuers/x'): UnsignedVC => ({
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: 'http://example.org/credentials/inline-1',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: partnerIssuer,
    issuanceDate: '2024-01-01T00:00:00Z',
    credentialSubject: {
        type: 'AchievementSubject',
        achievement: {
            id: 'urn:uuid:sample-achievement',
            type: 'Achievement',
            name: 'Accountability',
            description: 'Sample demo badge.',
        },
    } as any,
});

/** Wallet-side helper: do the full DIDAuth roundtrip for an unsigned inline VC. */
const claimUnsignedInline = async (localExchangeId: string) => {
    const initiation = await noAuthClient.workflows.participateInExchange({
        localWorkflowId: 'inline',
        localExchangeId,
    });

    expect(initiation.verifiablePresentationRequest).toBeDefined();
    const vpr = initiation.verifiablePresentationRequest!;
    const didAuthVp = (await userA.learnCard.invoke.getDidAuthVp({
        challenge: vpr.challenge,
        domain: vpr.domain,
    })) as VP;

    return noAuthClient.workflows.participateInExchange({
        localWorkflowId: 'inline',
        localExchangeId,
        verifiablePresentation: didAuthVp,
    });
};

describe('Inline VC-API exchanges (single unified workflow)', () => {
    const originalEnv = process.env;

    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
    });

    beforeEach(() => {
        // SSRF guard uses dns.lookup to reject hosts that resolve into internal
        // ranges. Tests use example hostnames that don't exist in real DNS, so
        // stub the resolver to return a public-looking IP by default. Tests that
        // specifically exercise SSRF behavior override this inline.
        inlineSrcTestHooks.setDnsLookup(async () => [
            { address: '203.0.113.1', family: 4 }, // TEST-NET-3 (RFC5737) — public, non-restricted
        ]);
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        inlineSrcTestHooks.resetDnsLookup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    // -------------------------------------------------------------------------
    // Signed VC payloads (1-step: wrap in VP and return).
    // -------------------------------------------------------------------------
    describe('pre-signed VC payload', () => {
        it('returns the signed VC wrapped in a VP in one step', async () => {
            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeJson(signed),
            });

            expect(response.verifiablePresentation).toBeDefined();
            expect(response.verifiablePresentationRequest).toBeUndefined();

            const vp = response.verifiablePresentation as VP;
            const creds = Array.isArray(vp.verifiableCredential)
                ? vp.verifiableCredential
                : vp.verifiableCredential
                  ? [vp.verifiableCredential]
                  : [];
            expect(creds).toHaveLength(1);
            expect(creds[0]).toMatchObject({ id: signed.id });
        });

        it('accepts gzip-compressed payloads', async () => {
            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeJson(signed, true),
            });

            expect(response.verifiablePresentation).toBeDefined();
        });

        it('still responds under the legacy `inline-unsigned` workflow id for backward compat', async () => {
            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline-unsigned',
                localExchangeId: encodeJson(signed),
            });

            // Signed VC detected regardless of which legacy id the client used.
            expect(response.verifiablePresentation).toBeDefined();
        });

        it('rejects malformed base64url payloads', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: 'not-valid-base64url-json',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects payloads that are valid JSON but neither VC nor Unsigned VC', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeJson({ hello: 'world' }),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    // -------------------------------------------------------------------------
    // Unsigned VC payloads (2-step DIDAuth + holder binding + issuer preservation).
    // -------------------------------------------------------------------------
    describe('unsigned VC payload (DIDAuth flow)', () => {
        it('step 1: returns a DIDAuthentication VPR for an empty body', async () => {
            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeJson(sampleUnsigned()),
            });

            expect(response.verifiablePresentation).toBeUndefined();
            expect(response.verifiablePresentationRequest).toBeDefined();

            const vpr = response.verifiablePresentationRequest!;
            expect(vpr.query[0]?.type).toBe('DIDAuthentication');
            expect(vpr.challenge).toContain(':'); // `${token}:${uuid}`
            expect(vpr.domain).toBeTruthy();
        });

        it('step 2: issues a holder-bound VC on a valid DIDAuth VP', async () => {
            const response = await claimUnsignedInline(encodeJson(sampleUnsigned()));

            expect(response.verifiablePresentation).toBeDefined();
            const vp = response.verifiablePresentation as VP;
            const creds = Array.isArray(vp.verifiableCredential)
                ? vp.verifiableCredential
                : vp.verifiableCredential
                  ? [vp.verifiableCredential]
                  : [];
            expect(creds).toHaveLength(1);
            const issued = creds[0]!;

            // Bound to the claimer's DID.
            const subject = (issued as any).credentialSubject;
            const subjectId = Array.isArray(subject) ? subject[0]?.id : subject?.id;
            expect(subjectId).toBe(userA.learnCard.id.did());

            // Signed proof is present.
            expect(issued).toHaveProperty('proof');
        });

        it('preserves the partner issuer as credentialSubject.awardedBy', async () => {
            const partnerIssuer = 'https://mapmyfuture.org/issuers/primary';
            const response = await claimUnsignedInline(
                encodeJson(sampleUnsigned(partnerIssuer))
            );

            const vp = response.verifiablePresentation as VP;
            const issued = Array.isArray(vp.verifiableCredential)
                ? vp.verifiableCredential[0]
                : vp.verifiableCredential;
            const subject = (issued as any).credentialSubject;
            const awardedBy = Array.isArray(subject) ? subject[0]?.awardedBy : subject?.awardedBy;

            expect(awardedBy).toBeDefined();
            expect(awardedBy.id ?? awardedBy).toBe(partnerIssuer);

            // Cryptographic issuer is LearnCard, not the partner.
            const issuedIssuer = typeof issued?.issuer === 'string'
                ? issued.issuer
                : issued?.issuer?.id;
            expect(issuedIssuer).not.toBe(partnerIssuer);
        });

        it('rejects a replayed DIDAuth VP (challenge exhausted after first use)', async () => {
            const localExchangeId = encodeJson(sampleUnsigned());
            const initiation = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId,
            });
            const vpr = initiation.verifiablePresentationRequest!;
            const didAuthVp = (await userA.learnCard.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            })) as VP;

            // First submission succeeds.
            await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId,
                verifiablePresentation: didAuthVp,
            });

            // Second submission with the same VP is rejected.
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId,
                    verifiablePresentation: didAuthVp,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a DIDAuth VP whose challenge is not tied to this exchange', async () => {
            // Initiate exchange A.
            const exchangeA = encodeJson(sampleUnsigned());
            const initA = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: exchangeA,
            });
            const vprA = initA.verifiablePresentationRequest!;
            const vpForA = (await userA.learnCard.invoke.getDidAuthVp({
                challenge: vprA.challenge,
                domain: vprA.domain,
            })) as VP;

            // Submit A's VP against exchange B's URL.
            const exchangeB = encodeJson({
                ...sampleUnsigned(),
                id: 'http://example.org/credentials/inline-2',
            });

            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: exchangeB,
                    verifiablePresentation: vpForA,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('routes legacy `inline-unsigned` id to the same DIDAuth flow', async () => {
            const localExchangeId = encodeJson(sampleUnsigned());
            const initiation = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline-unsigned',
                localExchangeId,
            });

            expect(initiation.verifiablePresentationRequest).toBeDefined();
        });
    });

    // -------------------------------------------------------------------------
    // URL-source payloads (fetch from partner host, hardened).
    // -------------------------------------------------------------------------
    describe('URL-source payload (inline-src)', () => {
        // Partner allowlist was retired — trust is anchored on the verified
        // fetch origin (awardedByDomain) plus the SSRF guard below.
        const PARTNER_HOST = 'partner.example.com';
        const PARTNER_URL = `https://${PARTNER_HOST}/badges/accountability.json`;

        const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
            new Response(JSON.stringify(body), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                ...init,
            });

        it('auto-detects a URL payload under the unified `inline` workflow id', async () => {
            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;

            vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(signed)));

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeUrl(PARTNER_URL),
            });

            expect(response.verifiablePresentation).toBeDefined();
        });

        it('never treats an http:// URL as a URL-source (falls through to JSON branch and fails)', async () => {
            // Bare http:// URLs aren't recognized as the URL branch; they fall through to
            // JSON parsing and error as "not a VC".
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('http://partner.example.com/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('fetches an unsigned VC from any https host, preserves partner issuer, and signs', async () => {
            const partnerIssuer = 'https://mapmyfuture.org/issuers/primary';
            const fetchMock = vi.fn(
                async () => jsonResponse(sampleUnsigned(partnerIssuer))
            );
            vi.stubGlobal('fetch', fetchMock);

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeUrl(PARTNER_URL),
            });

            expect(fetchMock).toHaveBeenCalled();
            const vp = response.verifiablePresentation as VP;
            const issued = Array.isArray(vp.verifiableCredential)
                ? vp.verifiableCredential[0]
                : vp.verifiableCredential;
            expect(issued).toHaveProperty('proof');
            const subject = (issued as any).credentialSubject;
            expect(subject.awardedBy?.id ?? subject.awardedBy).toBe(partnerIssuer);
        });

        it('passes through a pre-signed VC fetched from any https host', async () => {
            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;
            vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(signed)));

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline-src',
                localExchangeId: encodeUrl(PARTNER_URL),
            });
            expect(response.verifiablePresentation).toBeDefined();
        });

        it('rejects non-JSON Content-Type on the fetched response', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(
                    async () =>
                        new Response('<html>hello</html>', {
                            status: 200,
                            headers: { 'Content-Type': 'text/html' },
                        })
                )
            );

            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl(PARTNER_URL),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a response whose Content-Length exceeds the cap', async () => {
            const big = 'x'.repeat(10); // body doesn't matter — we lie about size.
            vi.stubGlobal(
                'fetch',
                vi.fn(
                    async () =>
                        new Response(big, {
                            status: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': String(10 * 1024 * 1024),
                            },
                        })
                )
            );

            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl(PARTNER_URL),
                })
            ).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
        });

        it('surfaces upstream fetch failures as BAD_GATEWAY', async () => {
            vi.stubGlobal('fetch', vi.fn(async () => new Response('oops', { status: 500 })));

            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline-src',
                    localExchangeId: encodeUrl(PARTNER_URL),
                })
            ).rejects.toMatchObject({ code: 'BAD_GATEWAY' });
        });

        it('rejects upstream responses whose body is neither VC nor Unsigned VC', async () => {
            vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ hello: 'world' })));

            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline-src',
                    localExchangeId: encodeUrl(PARTNER_URL),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('passes redirect:"error" to fetch so open-redirects cannot bypass the SSRF guard', async () => {
            const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
                // Assert on the fetch options the handler supplied.
                expect(init?.redirect).toBe('error');
                return jsonResponse(
                    await userA.learnCard.invoke.issueCredential({
                        ...sampleUnsigned(),
                        issuer: userA.learnCard.id.did(),
                    })
                );
            });
            vi.stubGlobal('fetch', fetchMock);

            await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeUrl(PARTNER_URL),
            });

            expect(fetchMock).toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------------------
    // SSRF guard (replacement for the retired partner allowlist). Any https
    // URL is now accepted, but the guard still blocks internal network
    // resources: loopback, RFC1918, link-local (cloud metadata), reserved
    // hostnames, and names that DNS-resolve into any of those ranges.
    // -------------------------------------------------------------------------
    describe('SSRF guard', () => {
        it('rejects a URL with a loopback IP literal', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://127.0.0.1/badges/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a URL with an RFC1918 private IP literal', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://10.0.0.42/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a URL targeting the cloud metadata endpoint (169.254.169.254)', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl(
                        'https://169.254.169.254/latest/meta-data/iam/security-credentials/'
                    ),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects an IPv6 loopback literal (`::1`)', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://[::1]/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a `localhost` hostname', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://localhost/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a `.local` mDNS hostname', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://printer.local/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a single-label hostname', async () => {
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://router/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a public hostname that DNS-resolves into a private IP range', async () => {
            // Attacker registers `evil.example.com` pointing to 10.0.0.1 to
            // trick the server into hitting internal infrastructure. The
            // resolver returns a private address — guard rejects.
            inlineSrcTestHooks.setDnsLookup(async () => [
                { address: '10.0.0.1', family: 4 },
            ]);

            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://evil.example.com/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects when ANY resolved address is restricted (public + private mixed)', async () => {
            // Multi-record resolution: safe + private mixed. Must reject.
            inlineSrcTestHooks.setDnsLookup(async () => [
                { address: '203.0.113.5', family: 4 },
                { address: '192.168.1.1', family: 4 },
            ]);

            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://attacker.example.com/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects when DNS resolution fails (NXDOMAIN, SERVFAIL, etc.)', async () => {
            inlineSrcTestHooks.setDnsLookup(async () => {
                throw Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' });
            });

            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeUrl('https://does-not-exist.example.com/x.json'),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('INLINE_SRC_DEV_MODE=1 bypasses the guard entirely (accepts http://localhost)', async () => {
            // Local dev mode: partner HTML is served over http://localhost, so
            // the envelope url is http://, the hostname is `localhost`, and DNS
            // resolves to 127.0.0.1 — all three would be hard rejects in prod.
            process.env.INLINE_SRC_DEV_MODE = '1';

            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;
            vi.stubGlobal(
                'fetch',
                vi.fn(
                    async () =>
                        new Response(JSON.stringify(signed), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                        })
                )
            );

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeUrl('http://localhost:8899/badges/x.json'),
            });

            expect(response.verifiablePresentation).toBeDefined();
        });

        it('INLINE_SRC_DEV_MODE=1 also accepts an envelope with an http:// url', async () => {
            process.env.INLINE_SRC_DEV_MODE = '1';
            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;
            vi.stubGlobal(
                'fetch',
                vi.fn(
                    async () =>
                        new Response(JSON.stringify(signed), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                        })
                )
            );

            // Envelope parser normally rejects non-https; dev mode accepts http.
            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeInlineSrcEnvelope(
                    'http://localhost:8899/badges/x.json',
                    'http://localhost:8899'
                ),
            });

            expect(response.verifiablePresentation).toBeDefined();
        });

        it('allows an arbitrary public hostname when DNS resolves to a public IP', async () => {
            // This is the core "no-allowlist" case: any previously-blocked
            // partner host is now accepted, so long as it resolves safely.
            inlineSrcTestHooks.setDnsLookup(async () => [
                { address: '203.0.113.99', family: 4 },
            ]);

            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;
            vi.stubGlobal(
                'fetch',
                vi.fn(
                    async () =>
                        new Response(JSON.stringify(signed), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                        })
                )
            );

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeUrl(
                    'https://previously-blocked-partner.example.org/badges/x.json'
                ),
            });

            expect(response.verifiablePresentation).toBeDefined();
        });
    });

    // -------------------------------------------------------------------------
    // Two-signal domain reconciliation (fetch origin + SDK-reported presenting
    // origin). The server emits a server-verified `awardedByDomain` on the
    // final credential by reconciling the two via Public Suffix List eTLD+1.
    // -------------------------------------------------------------------------
    describe('origin reconciliation (envelope + presenting)', () => {
        // Two subdomains of the same registrable domain. tldts collapses both
        // to `myapp.example` (`.example` is an IANA special-use TLD that the
        // PSL treats as a public suffix, so `myapp.example` is eTLD+1).
        const FETCH_HOST = 'storage.myapp.example';
        const PRESENTING_HOST = 'myapp.example';
        const FETCH_URL = `https://${FETCH_HOST}/badges/x.json`;
        const ETLD1 = 'myapp.example';

        const unsignedBody = () => sampleUnsigned('https://myapp.example/issuers/primary');

        const jsonRes = (body: unknown) =>
            new Response(JSON.stringify(body), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });

        const extractAwardedByDomain = (vp: VP): any => {
            const issued = Array.isArray(vp.verifiableCredential)
                ? vp.verifiableCredential[0]
                : vp.verifiableCredential;
            const subject = (issued as any)?.credentialSubject;
            return Array.isArray(subject) ? subject[0]?.awardedByDomain : subject?.awardedByDomain;
        };

        it('promotes to eTLD+1 when fetch and presenting share a registrable domain', async () => {
            vi.stubGlobal('fetch', vi.fn(async () => jsonRes(unsignedBody())));

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeInlineSrcEnvelope(FETCH_URL, `https://${PRESENTING_HOST}`),
            });

            const awardedByDomain = extractAwardedByDomain(response.verifiablePresentation as VP);
            expect(awardedByDomain).toMatchObject({
                id: `https://${ETLD1}`,
                domain: ETLD1,
                verificationMethod: 'etld1-promote',
                fetchOrigin: `https://${FETCH_HOST}`,
                presentingOrigin: `https://${PRESENTING_HOST}`,
            });
        });

        it('records exact-match when fetch and presenting are literally the same origin', async () => {
            vi.stubGlobal('fetch', vi.fn(async () => jsonRes(unsignedBody())));

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeInlineSrcEnvelope(
                    `https://${PRESENTING_HOST}/badges/x.json`,
                    `https://${PRESENTING_HOST}`
                ),
            });

            const awardedByDomain = extractAwardedByDomain(response.verifiablePresentation as VP);
            expect(awardedByDomain).toMatchObject({
                id: `https://${PRESENTING_HOST}`,
                domain: ETLD1,
                verificationMethod: 'exact-match',
                fetchOrigin: `https://${PRESENTING_HOST}`,
                presentingOrigin: `https://${PRESENTING_HOST}`,
            });
        });

        it('rejects a presenting origin whose eTLD+1 does not match the fetch origin', async () => {
            vi.stubGlobal('fetch', vi.fn(async () => jsonRes(unsignedBody())));

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeInlineSrcEnvelope(
                    FETCH_URL,
                    // Attacker-supplied presenting origin that would elevate
                    // the apparent identity. eTLD+1 mismatch → rejected.
                    'https://harvard.edu'
                ),
            });

            const awardedByDomain = extractAwardedByDomain(response.verifiablePresentation as VP);
            expect(awardedByDomain).toMatchObject({
                id: `https://${FETCH_HOST}`,
                domain: FETCH_HOST, // Full fetch host, NOT promoted
                verificationMethod: 'presenting-rejected',
                fetchOrigin: `https://${FETCH_HOST}`,
            });
            // The rejected presenting origin must not be recorded on the credential.
            expect(awardedByDomain.presentingOrigin).toBeUndefined();
        });

        it('falls back to fetch-only when no presenting is supplied', async () => {
            vi.stubGlobal('fetch', vi.fn(async () => jsonRes(unsignedBody())));

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeInlineSrcEnvelope(FETCH_URL),
            });

            const awardedByDomain = extractAwardedByDomain(response.verifiablePresentation as VP);
            expect(awardedByDomain).toMatchObject({
                id: `https://${FETCH_HOST}`,
                domain: FETCH_HOST,
                verificationMethod: 'fetch-only',
                fetchOrigin: `https://${FETCH_HOST}`,
            });
            expect(awardedByDomain.presentingOrigin).toBeUndefined();
        });

        it('legacy raw-URL payload still works and records fetch-only', async () => {
            vi.stubGlobal('fetch', vi.fn(async () => jsonRes(unsignedBody())));

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeUrl(FETCH_URL),
            });

            const awardedByDomain = extractAwardedByDomain(response.verifiablePresentation as VP);
            expect(awardedByDomain?.verificationMethod).toBe('fetch-only');
        });

        it('does not touch pre-signed VCs (origin reconciliation is advisory for them)', async () => {
            const signed = (await userA.learnCard.invoke.issueCredential({
                ...sampleUnsigned(),
                issuer: userA.learnCard.id.did(),
            })) as VC;
            vi.stubGlobal('fetch', vi.fn(async () => jsonRes(signed)));

            const response = await noAuthClient.workflows.participateInExchange({
                localWorkflowId: 'inline',
                localExchangeId: encodeInlineSrcEnvelope(FETCH_URL, `https://${PRESENTING_HOST}`),
            });

            // Pre-signed VCs pass through untouched — mutating them would
            // invalidate the partner's signature. No awardedByDomain is added.
            const vp = response.verifiablePresentation as VP;
            const issued = Array.isArray(vp.verifiableCredential)
                ? vp.verifiableCredential[0]
                : vp.verifiableCredential;
            const subject = (issued as any)?.credentialSubject;
            const awardedByDomain = Array.isArray(subject)
                ? subject[0]?.awardedByDomain
                : subject?.awardedByDomain;
            expect(awardedByDomain).toBeUndefined();
        });

        it('ignores an envelope with a non-https url', async () => {
            // http:// in envelope → server skips envelope branch, falls through to
            // JSON branch which fails classification.
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: encodeInlineSrcEnvelope(
                        'http://storage.myapp.example/x.json',
                        `https://${PRESENTING_HOST}`
                    ),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('ignores a malformed envelope missing the v:1 discriminator', async () => {
            // Looks like an envelope but lacks `v:1`. Falls through to JSON
            // classification, which rejects it as not-a-VC.
            const malformed = base64url.encode(
                Buffer.from(JSON.stringify({ url: FETCH_URL, presenting: 'https://x.com' }), 'utf8')
            );
            await expect(
                noAuthClient.workflows.participateInExchange({
                    localWorkflowId: 'inline',
                    localExchangeId: malformed,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });
});
