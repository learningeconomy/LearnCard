/* eslint-disable @typescript-eslint/no-explicit-any -- browser harness intentionally uses loose plugin/learnCard doubles across the WASM bridge */
/**
 * LC-2195 browser artifact harness (bundled into a real browser by
 * scripts/test-vc-jwt-artifacts.mjs).
 *
 * This intentionally imports the *built* production dist of the didkit and VC
 * plugins (no `development` export condition) so the browser exercises the same
 * packaged WASM wrapper and refresh primitive that consumers receive. Every
 * fixture is a synthetic Ed25519 `did:key` issuer/holder generated in-page.
 *
 * Results are published on `window.__LC_VC_JWT_RESULTS__`; the Playwright
 * orchestrator reads them back and fails the run on any assertion error.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import {
    getVerifiedCredentialTemporalStatus,
    refreshCredential,
    verifyCredentialJwt,
} from '@learncard/vc-plugin';

type CheckResult = { name: string; ok: boolean; detail: string };

type HarnessResults = {
    runtime: string;
    checks: CheckResult[];
    done: boolean;
    fatal?: string;
};

declare global {
    // eslint-disable-next-line no-var
    var __LC_VC_JWT_RESULTS__: HarnessResults | undefined;
}

const results: HarnessResults = { runtime: 'browser', checks: [], done: false };
window.__LC_VC_JWT_RESULTS__ = results;

const record = (name: string, ok: boolean, detail: unknown = ''): void => {
    results.checks.push({
        name,
        ok,
        detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
    });
};

const expect = (name: string, cond: boolean, detail: unknown = ''): void => {
    record(name, cond, cond ? 'ok' : detail);
};

type AnyPlugin = Awaited<ReturnType<typeof getDidKitPlugin>>;

const ISSUER_SEED = new Uint8Array(32).fill(21);
const OTHER_SEED = new Uint8Array(32).fill(23);
const HOLDER_SEED = new Uint8Array(32).fill(25);

const b64url = (value: string): string =>
    btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const decodePayload = (token: string): any =>
    JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

const main = async (): Promise<void> => {
    const wasmUrl = new URL('didkit_wasm_bg.wasm', location.href).href;
    const plugin: AnyPlugin = await getDidKitPlugin(wasmUrl);

    // The DIDKit plugin resolves `context.resolveDocument`; JWT verification never
    // needs it, but JWT issuance builds a context map, so wire the static loader.
    const fakeLC: any = {
        context: {
            resolveDocument: async (url: string) => {
                try {
                    return (await plugin.methods.contextLoader(fakeLC, url)) ?? undefined;
                } catch {
                    return undefined;
                }
            },
        },
        debug: () => undefined,
    };

    const issuerKey = plugin.methods.generateEd25519KeyFromBytes(fakeLC, ISSUER_SEED) as any;
    const issuerDid = plugin.methods.keyToDid(fakeLC, 'key', issuerKey);
    const issuerVm = await plugin.methods.keyToVerificationMethod(fakeLC, 'key', issuerKey);

    const otherKey = plugin.methods.generateEd25519KeyFromBytes(fakeLC, OTHER_SEED) as any;
    const otherVm = await plugin.methods.keyToVerificationMethod(fakeLC, 'key', otherKey);

    const holderKey = plugin.methods.generateEd25519KeyFromBytes(fakeLC, HOLDER_SEED) as any;
    const holderDid = plugin.methods.keyToDid(fakeLC, 'key', holderKey);

    const issueOptions = (): any => ({
        proofFormat: 'jwt',
        verificationMethod: issuerVm,
        proofPurpose: 'assertionMethod',
    });

    const v1 = (overrides: Record<string, unknown> = {}): any => ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
        type: ['VerifiableCredential'],
        issuer: issuerDid,
        issuanceDate: '2026-01-01T00:00:00Z',
        expirationDate: '2100-01-01T00:00:00Z',
        credentialSubject: { id: holderDid },
        ...overrides,
    });

    const v2 = (overrides: Record<string, unknown> = {}): any => ({
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: 'urn:uuid:22222222-2222-2222-2222-222222222222',
        type: ['VerifiableCredential'],
        issuer: issuerDid,
        validFrom: '2026-01-01T00:00:00Z',
        validUntil: '2100-01-01T00:00:00Z',
        credentialSubject: { id: holderDid },
        ...overrides,
    });

    const issue = async (credential: any): Promise<string> =>
        (await plugin.methods.issueCredential(
            fakeLC,
            credential,
            issueOptions(),
            issuerKey
        )) as unknown as string;

    const verify = (token: string): Promise<any> =>
        plugin.methods.verifyCredential(fakeLC, token, { proofFormat: 'jwt' });

    // --- browser WASM positive/negative matrix ---------------------------------
    const v1Token = await issue(v1());
    const v1Check = await verify(v1Token);
    expect(
        'valid VCDM 1.1 compact VC-JWT verifies in browser',
        v1Check.errors.length === 0 && v1Check.checks.includes('JWS'),
        v1Check
    );

    const v2Token = await issue(v2());
    const v2Check = await verify(v2Token);
    expect(
        'valid VCDM 2.0 (legacy JOSE profile) compact VC-JWT verifies in browser',
        v2Check.errors.length === 0 && v2Check.checks.includes('JWS'),
        v2Check
    );

    const [h1, p1, s1] = v1Token.split('.');
    const tamperedSig = `${h1}.${p1}.${s1.slice(0, -4)}AAAA`;
    const tamperedSigCheck = await verify(tamperedSig);
    expect(
        'tampered signature fails in browser',
        !tamperedSigCheck.checks.includes('JWS') && tamperedSigCheck.errors.length > 0,
        tamperedSigCheck
    );

    const claims = decodePayload(v1Token);
    claims.sub = 'did:example:attacker';
    const tamperedPayload = `${h1}.${b64url(JSON.stringify(claims))}.${s1}`;
    const tamperedPayloadCheck = await verify(tamperedPayload);
    expect(
        'tampered payload fails in browser',
        !tamperedPayloadCheck.checks.includes('JWS') && tamperedPayloadCheck.errors.length > 0,
        tamperedPayloadCheck
    );

    const wrongKeyCheck = await plugin.methods.verifyCredential(fakeLC, v1Token, {
        proofFormat: 'jwt',
        verificationMethod: otherVm,
    });
    expect(
        'wrong authorized key fails in browser',
        !wrongKeyCheck.checks.includes('JWS') && wrongKeyCheck.errors.length > 0,
        wrongKeyCheck
    );

    const swappedClaims = decodePayload(v1Token);
    swappedClaims.iss = 'did:example:attacker';
    swappedClaims.vc.issuer = 'did:example:attacker';
    const swappedCheck = await verify(`${h1}.${b64url(JSON.stringify(swappedClaims))}.${s1}`);
    expect(
        'swapped issuer fails in browser',
        !swappedCheck.checks.includes('JWS') && swappedCheck.errors.length > 0,
        swappedCheck
    );

    const expiredToken = await issue(v1({ expirationDate: '2000-01-01T00:00:00Z' }));
    const expiredCheck = await verify(expiredToken);
    expect(
        'expired compact VC-JWT fails in browser',
        !expiredCheck.checks.includes('JWS') && expiredCheck.errors.length > 0,
        expiredCheck
    );

    const renewalCheck = await plugin.methods.verifyCredentialForRenewal(fakeLC, expiredToken, {
        proofFormat: 'jwt',
    });
    expect(
        'expired compact VC-JWT accepted in renewal-only mode',
        renewalCheck.errors.length === 0 &&
            renewalCheck.checks.includes('JWS') &&
            renewalCheck.checks.includes('JWSRenewalExpired'),
        renewalCheck
    );

    const smuggledCheck = await plugin.methods.verifyCredential(fakeLC, expiredToken, {
        proofFormat: 'jwt',
        allowExpiredCredential: true,
    });
    expect(
        'ordinary verifyCredential ignores a smuggled renewal option',
        !smuggledCheck.checks.includes('JWS') && smuggledCheck.errors.length > 0,
        smuggledCheck
    );

    const futureToken = await issue(
        v1({ issuanceDate: '2100-01-01T00:00:00Z', expirationDate: '2101-01-01T00:00:00Z' })
    );
    const futureRenewalCheck = await plugin.methods.verifyCredentialForRenewal(
        fakeLC,
        futureToken,
        { proofFormat: 'jwt' }
    );
    expect(
        'future nbf rejected in renewal-only mode',
        !futureRenewalCheck.checks.includes('JWS') && futureRenewalCheck.errors.length > 0,
        futureRenewalCheck
    );

    const noneHeader = b64url(JSON.stringify({ alg: 'none', kid: issuerVm }));
    const noneCheck = await verify(`${noneHeader}.${p1}.`);
    expect(
        'alg=none fails in browser',
        !noneCheck.checks.includes('JWS') && noneCheck.errors.length > 0,
        noneCheck
    );

    // HS256 confusion signed with the public key material.
    const hsHeader = b64url(JSON.stringify({ alg: 'HS256', kid: issuerVm }));
    const signingInput = `${hsHeader}.${p1}`;
    const keyBytes = Uint8Array.from(atob(issuerKey.x.replace(/-/g, '+').replace(/_/g, '/')), c =>
        c.charCodeAt(0)
    );
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const hsSig = new Uint8Array(
        await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(signingInput))
    );
    const hsSigB64 = btoa(String.fromCharCode(...hsSig))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const hsCheck = await verify(`${signingInput}.${hsSigB64}`);
    expect(
        'HS256 symmetric confusion fails in browser',
        !hsCheck.checks.includes('JWS') && hsCheck.errors.length > 0,
        hsCheck
    );

    // JSON-LD LDP regression in browser.
    const ldp = await plugin.methods.issueCredential(
        fakeLC,
        v1(),
        { proofFormat: 'ldp', verificationMethod: issuerVm, proofPurpose: 'assertionMethod' },
        issuerKey
    );
    const ldpCheck = await plugin.methods.verifyCredential(fakeLC, ldp as any, {
        proofFormat: 'ldp',
    });
    expect(
        'JSON-LD linked-data-proof still verifies in browser',
        ldpCheck.errors.length === 0 && ldpCheck.checks.includes('proof'),
        ldpCheck
    );

    // --- verified normalization (token is authority) ---------------------------
    const dependentLC: any = {
        invoke: {
            verifyCredential: (credential: any, options: any) =>
                plugin.methods.verifyCredential(fakeLC, credential, options),
            verifyCredentialForRenewal: (credential: any, options: any) =>
                plugin.methods.verifyCredentialForRenewal(fakeLC, credential, options),
        },
    };

    const normalized = await verifyCredentialJwt(dependentLC, v1Token);
    expect(
        'verifyCredentialJwt verifies and normalizes in browser',
        normalized.verified === true,
        normalized
    );
    if (normalized.verified) {
        expect('verified token bytes preserved exactly (browser)', normalized.token === v1Token);
        expect(
            'verified metadata issuer is token-derived (browser)',
            normalized.metadata.issuer === issuerDid,
            normalized.metadata
        );
        expect(
            'verified metadata version/profile (browser)',
            normalized.metadata.version === '1.1' && normalized.metadata.profile === 'vc-jwt-1.1',
            normalized.metadata
        );
        expect(
            'temporal status valid (browser)',
            getVerifiedCredentialTemporalStatus(normalized) === 'valid'
        );

        const display = JSON.parse(JSON.stringify(normalized.credential));
        display.issuer = 'did:example:attacker';
        display.id = 'urn:uuid:attacker';
        const second = await verifyCredentialJwt(dependentLC, display);
        expect(
            're-verification ignores mutated display metadata (browser)',
            second.verified === true &&
                second.verified &&
                second.metadata.issuer === issuerDid &&
                second.metadata.id === normalized.metadata.id,
            second
        );
    }

    const forged = `${h1}.${b64url(JSON.stringify({ ...decodePayload(v1Token), vc: { ...decodePayload(v1Token).vc, issuer: 'did:example:attacker' } }))}.${s1}`;
    const forgedResult = await verifyCredentialJwt(dependentLC, forged);
    expect(
        'forged claim mutation fails verifyCredentialJwt (browser)',
        forgedResult.verified === false,
        forgedResult
    );

    // --- local text/plain 1EdTech refresh --------------------------------------
    const refreshUrl = new URL('/refresh/standard', location.href).href;
    const attackerUrl = new URL('/refresh/attacker', location.href).href;
    const managedUrl = new URL('/refresh/managed', location.href).href;

    const heldToken = await issue(
        v1({
            id: 'urn:uuid:held-credential-1',
            refreshService: { id: refreshUrl, type: '1EdTechCredentialRefresh' },
        })
    );
    const replacementToken = await issue(
        v1({
            id: 'urn:uuid:held-credential-1',
            issuanceDate: '2026-06-01T00:00:00Z',
            expirationDate: '2100-01-01T00:00:00Z',
            credentialSubject: { id: holderDid, achievement: { name: 'Final' } },
            refreshService: { id: refreshUrl, type: '1EdTechCredentialRefresh' },
        })
    );

    await fetch('/set-replacement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: replacementToken }),
    });

    const invokeRefresh = refreshCredential(dependentLC);
    const implicitLC: any = {
        invoke: {
            verifyCredential: (c: any, o: any) => plugin.methods.verifyCredential(fakeLC, c, o),
        },
    };

    const loopbackOpts = { allowInsecureHttp: true, allowPrivateAddresses: true } as const;

    const hits = async (): Promise<{ standard: number; attacker: number; managed: number }> =>
        (await fetch('/__hits')).json();

    const before = await hits();
    const refreshed = await invokeRefresh(implicitLC, heldToken, loopbackOpts);
    expect(
        'standard text/plain VC-JWT refresh succeeds in browser',
        refreshed.status === 'updated',
        refreshed
    );
    if (refreshed.status === 'updated') {
        expect(
            'refresh result carries exact replacement token (browser)',
            (refreshed.credential as any).proof?.jwt === replacementToken,
            (refreshed.credential as any).proof
        );
        const reverified = await verifyCredentialJwt(dependentLC, refreshed.credential);
        expect(
            'replacement re-verifies from stored token (browser)',
            reverified.verified === true &&
                reverified.verified &&
                reverified.metadata.issuer === issuerDid,
            reverified
        );
    }
    expect(
        'refresh hit the signed standard endpoint (browser)',
        (await hits()).standard === before.standard + 1,
        await hits()
    );

    // Display mutation must not redirect the request: the display object claims
    // the attacker endpoint, but the signed token's refreshService still wins.
    const mutatedView = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:held-credential-1',
        type: ['VerifiableCredential'],
        issuer: issuerDid,
        issuanceDate: '2026-01-01T00:00:00Z',
        expirationDate: '2100-01-01T00:00:00Z',
        credentialSubject: { id: holderDid },
        refreshService: { id: attackerUrl, type: '1EdTechCredentialRefresh' },
        proof: { type: 'JwtProof2020', jwt: heldToken },
    };
    const beforeMutation = await hits();
    const mutatedRefresh = await invokeRefresh(implicitLC, mutatedView, loopbackOpts);
    const afterMutation = await hits();
    expect(
        'display refreshService mutation cannot redirect refresh (browser)',
        mutatedRefresh.status === 'updated' &&
            afterMutation.attacker === beforeMutation.attacker &&
            afterMutation.standard === beforeMutation.standard + 1,
        { mutatedRefresh, beforeMutation, afterMutation }
    );

    // Production guard rejection: loopback endpoint without the local opt-in.
    const beforeGuard = await hits();
    const guardedRefresh = await invokeRefresh(implicitLC, heldToken, {});
    expect(
        'loopback refresh rejected without explicit local opt-in (browser)',
        guardedRefresh.status === 'failed' && guardedRefresh.code === 'UNSAFE_ENDPOINT',
        guardedRefresh
    );
    expect(
        'production guard rejection made zero network requests (browser)',
        (await hits()).standard === beforeGuard.standard,
        await hits()
    );

    // Managed service must reject text/plain outright.
    const managedHeldToken = await issue(
        v1({
            id: 'urn:uuid:managed-held-1',
            refreshService: { id: managedUrl, type: 'LearnCardCredentialRefresh2026' },
        })
    );
    const managedRefresh = await invokeRefresh(implicitLC, managedHeldToken, loopbackOpts);
    expect(
        'managed service rejects text/plain response (browser)',
        managedRefresh.status === 'failed' && managedRefresh.code === 'MALFORMED_RESPONSE',
        managedRefresh
    );

    // Store/read/export round trip then a second refresh. Rotate the server-side
    // replacement to a newer issuance so the second refresh is a real update.
    const replacementToken2 = await issue(
        v1({
            id: 'urn:uuid:held-credential-1',
            issuanceDate: '2026-09-01T00:00:00Z',
            expirationDate: '2100-01-01T00:00:00Z',
            credentialSubject: { id: holderDid, achievement: { name: 'Final v2' } },
            refreshService: { id: refreshUrl, type: '1EdTechCredentialRefresh' },
        })
    );
    await fetch('/set-replacement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: replacementToken2 }),
    });

    if (refreshed.status === 'updated') {
        const exported = JSON.parse(JSON.stringify(refreshed.credential));
        expect(
            'export retains exact compact token (browser)',
            exported.proof?.jwt === replacementToken,
            exported.proof
        );
        const secondRefresh = await invokeRefresh(implicitLC, exported, loopbackOpts);
        expect(
            'second refresh after export succeeds (browser)',
            secondRefresh.status === 'updated' &&
                (secondRefresh.credential as any).proof?.jwt === replacementToken2,
            secondRefresh
        );
    }

    // Expired held compact JWT: renewal-only verification accepts the signed
    // token, fetches the text/plain replacement and preserves exact bytes.
    const expiredHeldToken = await issue(
        v1({
            id: 'urn:uuid:held-credential-3',
            issuanceDate: '2019-01-01T00:00:00Z',
            expirationDate: '2020-01-01T00:00:00Z',
            refreshService: { id: refreshUrl, type: '1EdTechCredentialRefresh' },
        })
    );
    const expiredHeldReplacement = await issue(
        v1({
            id: 'urn:uuid:held-credential-3',
            issuanceDate: '2026-09-01T00:00:00Z',
            expirationDate: '2100-01-01T00:00:00Z',
            credentialSubject: { id: holderDid, achievement: { name: 'Renewed after expiry' } },
            refreshService: { id: refreshUrl, type: '1EdTechCredentialRefresh' },
        })
    );
    await fetch('/set-replacement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: expiredHeldReplacement }),
    });
    const beforeExpired = await hits();
    const expiredHeldRefresh = await invokeRefresh(implicitLC, expiredHeldToken, loopbackOpts);
    expect(
        'expired compact-JWT held renewal succeeds via text/plain replacement (browser)',
        expiredHeldRefresh.status === 'updated' &&
            (expiredHeldRefresh.credential as any).proof?.jwt === expiredHeldReplacement &&
            (await hits()).standard === beforeExpired.standard + 1,
        expiredHeldRefresh
    );

    results.done = true;
};

main().catch(error => {
    results.fatal = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    results.done = true;
});
